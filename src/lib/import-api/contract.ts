export const IMPORT_API_MAX_BODY_BYTES = 1_048_576;
export const IMPORT_API_MAX_RECORDS = 100;
export const IMPORT_API_MAX_PAYLOAD_BYTES = 65_536;

export const IMPORT_API_RECORD_TYPES = [
  "inventory_snapshot",
  "sales_history",
  "product_master",
  "store_master",
] as const;

export type ImportApiRecordType = (typeof IMPORT_API_RECORD_TYPES)[number];

export type ImportApiRecord = {
  record_type: ImportApiRecordType;
  source_record_key: string;
  source_updated_at: string | null;
  location_code: string | null;
  payload: Record<string, unknown>;
};

export type ImportApiIngestInput = {
  tokenHash: string;
  idempotencyKey: string;
  requestHash: string;
  records: ImportApiRecord[];
};

export type ImportApiIngestResult = {
  syncJobId: string;
  acceptedRecords: number;
  duplicateRecords: number;
  idempotentReplay: boolean;
};

export type ImportApiStore = {
  ingest(input: ImportApiIngestInput): Promise<ImportApiIngestResult>;
};

export type ImportApiErrorCode =
  | "authentication_required"
  | "invalid_content_type"
  | "payload_too_large"
  | "invalid_payload"
  | "unsupported_record_type"
  | "idempotency_conflict"
  | "data_source_not_importable"
  | "server_misconfigured"
  | "internal_error";

export class ImportApiError extends Error {
  constructor(
    public readonly code: ImportApiErrorCode,
    public readonly status: number,
    message = code,
  ) {
    super(message);
  }
}

export function isImportApiRecordType(value: string): value is ImportApiRecordType {
  return (IMPORT_API_RECORD_TYPES as readonly string[]).includes(value);
}
