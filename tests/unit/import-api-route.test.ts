import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import {
  ImportApiError,
  type ImportApiIngestInput,
  type ImportApiIngestResult,
  type ImportApiStore,
} from "@/lib/import-api/contract";
import { authorizeImportApiRequest } from "@/lib/import-api/handler";

class FakeImportApiStore implements ImportApiStore {
  calls: ImportApiIngestInput[] = [];

  constructor(private readonly result?: ImportApiIngestResult) {}

  async ingest(input: ImportApiIngestInput) {
    this.calls.push(input);

    if (input.idempotencyKey === "conflict-key") {
      throw new ImportApiError("idempotency_conflict", 409);
    }

    return this.result ?? {
      syncJobId: "30000000-0000-4000-8000-000000000001",
      acceptedRecords: input.records.length,
      duplicateRecords: 0,
      idempotentReplay: false,
    };
  }
}

function request(body: unknown, headers?: Record<string, string>) {
  return new NextRequest("https://retailos.test/api/import/v1/records", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer rtos_${"a".repeat(32)}`,
      "idempotency-key": "request-001",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const validBody = {
  records: [
    {
      record_type: "inventory_snapshot",
      source_record_key: "sku-001|lag-lek|2026-07-13",
      source_updated_at: "2026-07-13T09:00:00Z",
      location_code: "LAG-LEK",
      payload: {
        sku: "SKU-001",
        quantity: 5,
      },
    },
  ],
};

describe("RetailOS Import API route handler", () => {
  it("accepts valid tenant-scoped records through the injected store", async () => {
    const store = new FakeImportApiStore();
    const response = await authorizeImportApiRequest(
      request(validBody),
      store,
      "test-secret",
    );
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body).toMatchObject({
      accepted_records: 1,
      duplicate_records: 0,
      idempotent_replay: false,
      status: "accepted",
    });
    expect(store.calls).toHaveLength(1);
    expect(store.calls[0]!.tokenHash).toMatch(/^hmac-sha256:[a-f0-9]{64}$/);
    expect(store.calls[0]!.requestHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(store.calls[0]!.records[0]).toMatchObject({
      record_type: "inventory_snapshot",
      source_record_key: "sku-001|lag-lek|2026-07-13",
      location_code: "LAG-LEK",
    });
  });

  it("fails closed when the server token hash secret is missing", async () => {
    const store = new FakeImportApiStore();
    const response = await authorizeImportApiRequest(
      request(validBody),
      store,
      undefined,
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      error: "server_misconfigured",
    });
    expect(store.calls).toEqual([]);
  });

  it("requires a bearer token and idempotency key", async () => {
    const store = new FakeImportApiStore();
    const missingToken = await authorizeImportApiRequest(
      request(validBody, { authorization: "" }),
      store,
      "test-secret",
    );
    const missingIdempotency = await authorizeImportApiRequest(
      request(validBody, { "idempotency-key": "" }),
      store,
      "test-secret",
    );

    expect(missingToken.status).toBe(401);
    expect(await missingToken.json()).toMatchObject({
      error: "authentication_required",
    });
    expect(missingIdempotency.status).toBe(400);
    expect(store.calls).toEqual([]);
  });

  it("rejects non-json, oversized, unsupported, and empty payloads before persistence", async () => {
    const store = new FakeImportApiStore();
    const nonJson = await authorizeImportApiRequest(
      request(validBody, { "content-type": "text/plain" }),
      store,
      "test-secret",
    );
    const emptyRecords = await authorizeImportApiRequest(
      request({ records: [] }),
      store,
      "test-secret",
    );
    const unsupported = await authorizeImportApiRequest(
      request({
        records: [
          {
            ...validBody.records[0],
            record_type: "purchase_order",
          },
        ],
      }),
      store,
      "test-secret",
    );

    expect(nonJson.status).toBe(415);
    expect(emptyRecords.status).toBe(400);
    expect(unsupported.status).toBe(422);
    expect(store.calls).toEqual([]);
  });

  it("returns safe idempotency conflict errors", async () => {
    const store = new FakeImportApiStore();
    const response = await authorizeImportApiRequest(
      request(validBody, { "idempotency-key": "conflict-key" }),
      store,
      "test-secret",
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: "idempotency_conflict",
    });
  });
});
