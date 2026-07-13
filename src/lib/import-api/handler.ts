import { NextResponse, type NextRequest } from "next/server";

import {
  IMPORT_API_MAX_BODY_BYTES,
  IMPORT_API_MAX_PAYLOAD_BYTES,
  IMPORT_API_MAX_RECORDS,
  ImportApiError,
  type ImportApiRecord,
  type ImportApiStore,
  isImportApiRecordType,
} from "@/lib/import-api/contract";
import { hashImportApiToken, sha256Evidence } from "@/lib/import-api/crypto";

function jsonResponse(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function safeCorrelationId() {
  return crypto.randomUUID();
}

function readBearerToken(header: string | null) {
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice("Bearer ".length).trim();

  if (!/^rtos_[A-Za-z0-9._:-]{24,}$/.test(token)) return null;

  return token;
}

function readRequiredIdempotencyKey(header: string | null) {
  const value = header?.trim();

  if (
    !value
    || value.length < 8
    || value.length > 160
    || !/^[a-zA-Z0-9._:-]+$/.test(value)
  ) {
    throw new ImportApiError("invalid_payload", 400);
  }

  return value;
}

function assertJsonContentType(request: NextRequest) {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (!contentType.startsWith("application/json")) {
    throw new ImportApiError("invalid_content_type", 415);
  }
}

function assertContentLength(request: NextRequest) {
  const contentLength = request.headers.get("content-length");

  if (contentLength && Number(contentLength) > IMPORT_API_MAX_BODY_BYTES) {
    throw new ImportApiError("payload_too_large", 413);
  }
}

function parsePayload(rawBody: string): ImportApiRecord[] {
  if (Buffer.byteLength(rawBody, "utf8") > IMPORT_API_MAX_BODY_BYTES) {
    throw new ImportApiError("payload_too_large", 413);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    throw new ImportApiError("invalid_payload", 400);
  }

  if (!parsed || typeof parsed !== "object" || !("records" in parsed)) {
    throw new ImportApiError("invalid_payload", 400);
  }

  const records = (parsed as { records: unknown }).records;

  if (
    !Array.isArray(records)
    || records.length < 1
    || records.length > IMPORT_API_MAX_RECORDS
  ) {
    throw new ImportApiError("invalid_payload", 400);
  }

  return records.map((record): ImportApiRecord => {
    if (!record || typeof record !== "object") {
      throw new ImportApiError("invalid_payload", 400);
    }

    const candidate = record as Record<string, unknown>;
    const recordType = candidate.record_type;
    const sourceRecordKey = candidate.source_record_key;
    const sourceUpdatedAt = candidate.source_updated_at;
    const locationCode = candidate.location_code;
    const payload = candidate.payload;

    if (typeof recordType !== "string" || !isImportApiRecordType(recordType)) {
      throw new ImportApiError("unsupported_record_type", 422);
    }

    if (
      typeof sourceRecordKey !== "string"
      || sourceRecordKey.length < 1
      || sourceRecordKey.length > 200
    ) {
      throw new ImportApiError("invalid_payload", 400);
    }

    if (
      sourceUpdatedAt !== undefined
      && sourceUpdatedAt !== null
      && (
        typeof sourceUpdatedAt !== "string"
        || Number.isNaN(Date.parse(sourceUpdatedAt))
      )
    ) {
      throw new ImportApiError("invalid_payload", 400);
    }

    if (
      locationCode !== undefined
      && locationCode !== null
      && (
        typeof locationCode !== "string"
        || locationCode.length > 80
      )
    ) {
      throw new ImportApiError("invalid_payload", 400);
    }

    if (
      !payload
      || typeof payload !== "object"
      || Array.isArray(payload)
      || Buffer.byteLength(JSON.stringify(payload), "utf8") > IMPORT_API_MAX_PAYLOAD_BYTES
    ) {
      throw new ImportApiError("invalid_payload", 400);
    }

    return {
      record_type: recordType,
      source_record_key: sourceRecordKey,
      source_updated_at: sourceUpdatedAt ?? null,
      location_code: locationCode ?? null,
      payload: payload as Record<string, unknown>,
    };
  });
}

export async function authorizeImportApiRequest(
  request: NextRequest,
  store: ImportApiStore,
  tokenHashSecret: string | undefined,
) {
  const correlationId = safeCorrelationId();

  try {
    if (!tokenHashSecret) {
      throw new ImportApiError("server_misconfigured", 503);
    }

    assertJsonContentType(request);
    assertContentLength(request);

    const token = readBearerToken(request.headers.get("authorization"));
    if (!token) {
      throw new ImportApiError("authentication_required", 401);
    }

    const idempotencyKey = readRequiredIdempotencyKey(
      request.headers.get("idempotency-key"),
    );
    const rawBody = await request.text();
    const records = parsePayload(rawBody);
    const requestHash = sha256Evidence(rawBody);
    const tokenHash = hashImportApiToken(token, tokenHashSecret);

    const result = await store.ingest({
      tokenHash,
      idempotencyKey,
      requestHash,
      records,
    });

    return jsonResponse(202, {
      correlation_id: correlationId,
      sync_job_id: result.syncJobId,
      accepted_records: result.acceptedRecords,
      duplicate_records: result.duplicateRecords,
      idempotent_replay: result.idempotentReplay,
      status: "accepted",
    });
  } catch (error) {
    if (error instanceof ImportApiError) {
      return jsonResponse(error.status, {
        correlation_id: correlationId,
        error: error.code,
      });
    }

    return jsonResponse(500, {
      correlation_id: correlationId,
      error: "internal_error",
    });
  }
}
