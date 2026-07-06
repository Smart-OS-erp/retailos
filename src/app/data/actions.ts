"use server";

import { createHash, randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { hasPermission } from "@/lib/auth/authorization";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import {
  CsvInputError,
  parseCsv,
  type ParsedCsv,
} from "@/lib/data/csv";
import type {
  Database,
  Json,
  ValidationSeverity,
  ValidationStatus,
} from "@/types/database";

type StagingInsert =
  Database["public"]["Tables"]["staging_inventory_rows"]["Insert"];
type IssueInsert =
  Database["public"]["Tables"]["validation_issues"]["Insert"];

const inventoryHeaders = [
  "sku_code",
  "product_name",
  "location_code",
  "on_hand_quantity",
  "approved_unit_cost",
  "currency_code",
  "first_available_at",
  "units_sold_90",
  "units_sold_30",
] as const;

type IntakeContext = Awaited<ReturnType<typeof requireOrganizationContext>>;

function fail(code: string): never {
  redirect(`/data/uploads/new?error=${encodeURIComponent(code)}`);
}

function assertCanManageData(context: IntakeContext) {
  if (!hasPermission(context.membership.role, "data.manage")) {
    redirect("/data?error=permission-denied");
  }
}

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function normalizeParsedCsv(parsed: ParsedCsv): ParsedCsv {
  const headers = parsed.headers.map(normalizeHeader);
  if (new Set(headers).size !== headers.length) {
    throw new CsvInputError(
      "CSV headers collide after normalization.",
      "invalid_structure",
    );
  }

  return {
    headers,
    rows: parsed.rows.map((row) =>
      Object.fromEntries(
        parsed.headers.map((header, index) => [
          headers[index]!,
          row[header] ?? "",
        ]),
      ),
    ),
  };
}

function readInteger(
  value: string,
  field: string,
  required: boolean,
  addIssue: (severity: ValidationSeverity, code: string, message: string) => void,
) {
  const trimmed = value.trim();
  if (!trimmed) {
    if (required) {
      addIssue("blocking", `missing_${field}`, `${field} is required.`);
    }
    return null;
  }

  if (!/^\d+$/.test(trimmed)) {
    addIssue("blocking", `invalid_${field}`, `${field} must be a non-negative integer.`);
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isSafeInteger(parsed)) {
    addIssue("blocking", `invalid_${field}`, `${field} is outside the supported range.`);
    return null;
  }
  return parsed;
}

function readCost(
  value: string,
  addIssue: (severity: ValidationSeverity, code: string, message: string) => void,
) {
  const trimmed = value.trim();
  if (!trimmed) {
    addIssue(
      "warning",
      "missing_approved_unit_cost",
      "Approved unit cost is missing; recoverable value will be suppressed.",
    );
    return null;
  }
  if (!/^\d+(?:\.\d{1,4})?$/.test(trimmed)) {
    addIssue(
      "blocking",
      "invalid_approved_unit_cost",
      "Approved unit cost must be a non-negative number with at most four decimals.",
    );
    return null;
  }
  return Number.parseFloat(trimmed);
}

function readCurrency(
  value: string,
  addIssue: (severity: ValidationSeverity, code: string, message: string) => void,
) {
  const currency = value.trim().toUpperCase();
  if (!currency) {
    addIssue(
      "warning",
      "missing_currency_code",
      "Currency is missing; value aggregation will be suppressed.",
    );
    return null;
  }
  if (!/^[A-Z]{3}$/.test(currency)) {
    addIssue("blocking", "invalid_currency_code", "Currency must be a three-letter ISO code.");
    return null;
  }
  return currency;
}

function readDate(
  value: string,
  addIssue: (severity: ValidationSeverity, code: string, message: string) => void,
) {
  const date = value.trim();
  if (!date) {
    addIssue(
      "warning",
      "missing_first_available_at",
      "First-available date is missing; ageing classification will be suppressed.",
    );
    return null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    addIssue("blocking", "invalid_first_available_at", "First-available date must use YYYY-MM-DD.");
    return null;
  }
  return date;
}

async function persistInventoryIntake(input: {
  byteSize: number;
  content: Uint8Array;
  context: IntakeContext;
  fileName: string;
  parsed: ParsedCsv;
  uploadType: "inventory_csv" | "sample";
}) {
  const { context } = input;
  const organizationId = context.membership.organization_id;
  const { data: locations, error: locationsError } = await context.supabase
    .from("locations")
    .select("id, code")
    .eq("organization_id", organizationId);

  if (locationsError) fail("location-lookup-failed");
  const locationIds = new Map(
    (locations ?? []).map((location) => [location.code.toLowerCase(), location.id]),
  );
  const uploadId = randomUUID();
  const rawRows: Database["public"]["Tables"]["raw_upload_rows"]["Insert"][] = [];
  const stagingRows: StagingInsert[] = [];
  const issues: IssueInsert[] = [];

  for (const [index, row] of input.parsed.rows.entries()) {
    const rawRowId = randomUUID();
    const stagingRowId = randomUUID();
    const rowIssues: Array<{
      code: string;
      message: string;
      severity: ValidationSeverity;
    }> = [];
    const addIssue = (
      severity: ValidationSeverity,
      code: string,
      message: string,
    ) => rowIssues.push({ severity, code, message });

    const skuCode = (row.sku_code ?? "").trim();
    const locationCode = (row.location_code ?? "").trim();
    if (!skuCode) addIssue("blocking", "missing_sku_code", "SKU code is required.");
    if (!locationCode) {
      addIssue("blocking", "missing_location_code", "Location code is required.");
    }
    const locationId = locationIds.get(locationCode.toLowerCase()) ?? null;
    if (locationCode && !locationId) {
      addIssue(
        "blocking",
        "unknown_location_code",
        "Location code does not belong to the active organization.",
      );
    }

    const onHandQuantity = readInteger(
      row.on_hand_quantity ?? "",
      "on_hand_quantity",
      true,
      addIssue,
    );
    const approvedUnitCost = readCost(row.approved_unit_cost ?? "", addIssue);
    const currencyCode = readCurrency(row.currency_code ?? "", addIssue);
    const firstAvailableAt = readDate(row.first_available_at ?? "", addIssue);
    const unitsSold90 = readInteger(
      row.units_sold_90 ?? "",
      "units_sold_90",
      false,
      addIssue,
    );
    const unitsSold30 = readInteger(
      row.units_sold_30 ?? "",
      "units_sold_30",
      false,
      addIssue,
    );
    const validationStatus: ValidationStatus = rowIssues.some(
      (issue) => issue.severity === "blocking",
    )
      ? "blocked"
      : rowIssues.some((issue) => issue.severity === "warning")
        ? "warning"
        : "valid";

    rawRows.push({
      id: rawRowId,
      organization_id: organizationId,
      upload_id: uploadId,
      row_number: index + 1,
      payload: row as Json,
    });
    stagingRows.push({
      id: stagingRowId,
      organization_id: organizationId,
      upload_id: uploadId,
      raw_row_id: rawRowId,
      location_id: locationId,
      sku_code: skuCode || null,
      product_name: (row.product_name ?? "").trim() || null,
      location_code: locationCode || null,
      on_hand_quantity: onHandQuantity,
      approved_unit_cost: approvedUnitCost,
      currency_code: currencyCode,
      first_available_at: firstAvailableAt,
      units_sold_90: unitsSold90,
      units_sold_30: unitsSold30,
      validation_status: validationStatus,
    });
    issues.push(
      ...rowIssues.map((issue) => ({
        id: randomUUID(),
        organization_id: organizationId,
        upload_id: uploadId,
        staging_row_id: stagingRowId,
        severity: issue.severity,
        issue_code: issue.code,
        message: issue.message,
      })),
    );
  }

  const hasBlocking = issues.some((issue) => issue.severity === "blocking");
  const hasWarnings = issues.some((issue) => issue.severity === "warning");
  const digest = createHash("sha256").update(input.content).digest("hex");
  const { error: uploadError } = await context.supabase
    .from("data_uploads")
    .insert({
      id: uploadId,
      organization_id: organizationId,
      upload_type: input.uploadType,
      file_name: input.fileName,
      content_sha256: digest,
      byte_size: input.byteSize,
      row_count: input.parsed.rows.length,
      status: hasBlocking ? "validation_blocked" : hasWarnings ? "parsed" : "ready",
      created_by: context.user.id,
    });
  if (uploadError) {
    fail(uploadError.code === "23505" ? "duplicate-upload" : "upload-create-failed");
  }

  const rawResult = await context.supabase.from("raw_upload_rows").insert(rawRows);
  const stagingResult = await context.supabase
    .from("staging_inventory_rows")
    .insert(stagingRows);
  const issuesResult =
    issues.length > 0
      ? await context.supabase.from("validation_issues").insert(issues)
      : { error: null };

  if (rawResult.error || stagingResult.error || issuesResult.error) {
    await context.supabase
      .from("data_uploads")
      .update({ status: "failed" })
      .eq("organization_id", organizationId)
      .eq("id", uploadId);
    fail("upload-persistence-failed");
  }

  revalidatePath("/data");
  revalidatePath("/data/uploads");
  redirect(`/data/uploads/${uploadId}`);
}

export async function uploadInventoryCsv(formData: FormData) {
  const context = await requireOrganizationContext();
  assertCanManageData(context);
  const value = formData.get("file");
  if (!(value instanceof File)) fail("file-required");

  const safeName = value.name.split(/[\\/]/).at(-1)?.trim() ?? "";
  if (!safeName.toLowerCase().endsWith(".csv")) fail("csv-required");
  const allowedTypes = new Set(["", "text/csv", "application/csv", "application/vnd.ms-excel"]);
  if (!allowedTypes.has(value.type.toLowerCase())) fail("unsupported-media-type");

  const bytes = new Uint8Array(await value.arrayBuffer());
  let parsed: ParsedCsv;
  try {
    parsed = normalizeParsedCsv(parseCsv(bytes));
  } catch (error) {
    fail(error instanceof CsvInputError ? error.code : "invalid-csv");
  }

  if (!inventoryHeaders.every((header) => parsed.headers.includes(header))) {
    fail("missing-required-columns");
  }

  await persistInventoryIntake({
    byteSize: bytes.byteLength,
    content: bytes,
    context,
    fileName: safeName,
    parsed,
    uploadType: "inventory_csv",
  });
}

export async function loadSampleInventory() {
  const context = await requireOrganizationContext();
  assertCanManageData(context);
  const organizationId = context.membership.organization_id;
  const { data: location, error } = await context.supabase
    .from("locations")
    .select("code")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error || !location) fail("location-required");

  const headers = [...inventoryHeaders];
  const rows = [
    {
      sku_code: "SAMPLE-AGED-001",
      product_name: "Sample aged style",
      location_code: location.code,
      on_hand_quantity: "18",
      approved_unit_cost: "12500",
      currency_code: "NGN",
      first_available_at: "2026-01-01",
      units_sold_90: "1",
      units_sold_30: "0",
    },
    {
      sku_code: "SAMPLE-WATCH-002",
      product_name: "Sample watch style",
      location_code: location.code,
      on_hand_quantity: "9",
      approved_unit_cost: "8900",
      currency_code: "NGN",
      first_available_at: "2026-04-15",
      units_sold_90: "4",
      units_sold_30: "1",
    },
  ];
  const content = new TextEncoder().encode(
    [headers.join(","), ...rows.map((row) => headers.map((header) => row[header]).join(","))].join("\n"),
  );

  await persistInventoryIntake({
    byteSize: content.byteLength,
    content,
    context,
    fileName: "retailos-sample-inventory.csv",
    parsed: { headers, rows },
    uploadType: "sample",
  });
}
