const RETAIL_CODE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeRetailCode(value: FormDataEntryValue | null) {
  return String(value ?? "").trim().toLowerCase();
}

export function displayRetailCode(value: string) {
  return value.toUpperCase();
}

export function isValidRetailCode(value: string) {
  return (
    value.length >= 2
    && value.length <= 32
    && RETAIL_CODE_PATTERN.test(value)
  );
}
