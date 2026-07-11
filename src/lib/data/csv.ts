const CSV_MAX_BYTES = 2 * 1024 * 1024;
const CSV_MAX_ROWS = 10_000;

export const csvLimits = {
  maxBytes: CSV_MAX_BYTES,
  maxRows: CSV_MAX_ROWS,
} as const;

export class CsvInputError extends Error {
  constructor(
    message: string,
    readonly code:
      | "empty"
      | "invalid_encoding"
      | "invalid_structure"
      | "too_large"
      | "too_many_rows",
  ) {
    super(message);
    this.name = "CsvInputError";
  }
}

export type ParsedCsv = {
  headers: string[];
  rows: Array<Record<string, string>>;
};

function neutralizeFormula(value: string) {
  const trimmed = value.trimStart();
  if (/^[=+@]/.test(trimmed) || (/^-/.test(trimmed) && !/^-\d+(?:\.\d+)?$/.test(trimmed))) {
    return `'${value}`;
  }
  return value;
}

function parseCells(input: string) {
  const records: string[][] = [];
  let record: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    const next = input[index + 1];

    if (character === '"') {
      if (quoted && next === '"') {
        cell += '"';
        index += 1;
      } else if (quoted || cell.length === 0) {
        quoted = !quoted;
      } else {
        throw new CsvInputError("CSV contains an unexpected quote.", "invalid_structure");
      }
      continue;
    }

    if (!quoted && character === ",") {
      record.push(neutralizeFormula(cell));
      cell = "";
      continue;
    }

    if (!quoted && (character === "\n" || character === "\r")) {
      record.push(neutralizeFormula(cell));
      records.push(record);
      record = [];
      cell = "";
      if (character === "\r" && next === "\n") index += 1;
      if (records.length > CSV_MAX_ROWS + 1) {
        throw new CsvInputError(`CSV exceeds ${CSV_MAX_ROWS} data rows.`, "too_many_rows");
      }
      continue;
    }

    cell += character;
  }

  if (quoted) {
    throw new CsvInputError("CSV contains an unclosed quoted value.", "invalid_structure");
  }

  if (cell.length > 0 || record.length > 0) {
    record.push(neutralizeFormula(cell));
    records.push(record);
  }

  return records.filter((candidate) => candidate.some((value) => value.length > 0));
}

export function parseCsv(bytes: Uint8Array): ParsedCsv {
  if (bytes.byteLength === 0) {
    throw new CsvInputError("CSV is empty.", "empty");
  }
  if (bytes.byteLength > CSV_MAX_BYTES) {
    throw new CsvInputError(`CSV exceeds the ${CSV_MAX_BYTES} byte limit.`, "too_large");
  }

  let input: string;
  try {
    input = new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/^\uFEFF/, "");
  } catch {
    throw new CsvInputError("CSV must be valid UTF-8.", "invalid_encoding");
  }
  if (input.includes("\0")) {
    throw new CsvInputError("CSV contains unsupported binary content.", "invalid_encoding");
  }

  const records = parseCells(input);
  if (records.length < 2) {
    throw new CsvInputError("CSV must contain a header and at least one data row.", "empty");
  }

  const headers = records[0]?.map((header) => header.trim()) ?? [];
  if (headers.some((header) => !header) || new Set(headers.map((header) => header.toLowerCase())).size !== headers.length) {
    throw new CsvInputError("CSV headers must be non-empty and unique.", "invalid_structure");
  }

  const dataRows = records.slice(1);
  if (dataRows.length > CSV_MAX_ROWS) {
    throw new CsvInputError(`CSV exceeds ${CSV_MAX_ROWS} data rows.`, "too_many_rows");
  }
  if (dataRows.some((row) => row.length !== headers.length)) {
    throw new CsvInputError("Every CSV row must match the header column count.", "invalid_structure");
  }

  return {
    headers,
    rows: dataRows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]))),
  };
}
