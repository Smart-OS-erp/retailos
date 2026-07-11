import { describe, expect, it } from "vitest";

import { CsvInputError, csvLimits, parseCsv } from "@/lib/data/csv";

const encode = (value: string) => new TextEncoder().encode(value);

describe("bounded CSV parser", () => {
  it("parses quoted values and neutralizes spreadsheet formulas", () => {
    const result = parseCsv(encode('sku,name,quantity\nSKU-1,"Blue, Coat",12\nSKU-2,"=HYPERLINK(""bad"")",-4'));

    expect(result.headers).toEqual(["sku", "name", "quantity"]);
    expect(result.rows).toEqual([
      { sku: "SKU-1", name: "Blue, Coat", quantity: "12" },
      { sku: "SKU-2", name: "'=HYPERLINK(\"bad\")", quantity: "-4" },
    ]);
  });

  it("rejects duplicate headers and uneven records", () => {
    expect(() => parseCsv(encode("sku,SKU\n1,2"))).toThrow(CsvInputError);
    expect(() => parseCsv(encode("sku,name\n1"))).toThrow("header column count");
  });

  it("rejects binary, oversized, and over-row-limit inputs", () => {
    expect(() => parseCsv(encode("sku\nA\0B"))).toThrow("binary content");
    expect(() => parseCsv(new Uint8Array(csvLimits.maxBytes + 1))).toThrow("byte limit");
    const rows = Array.from({ length: csvLimits.maxRows + 1 }, (_, index) => `SKU-${index}`).join("\n");
    expect(() => parseCsv(encode(`sku\n${rows}`))).toThrow("data rows");
  });
});
