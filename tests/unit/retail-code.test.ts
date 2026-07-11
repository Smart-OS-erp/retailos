import { describe, expect, it } from "vitest";

import {
  displayRetailCode,
  isValidRetailCode,
  normalizeRetailCode,
} from "@/lib/retail-code";

describe("retail code normalization", () => {
  it("normalizes user-entered uppercase codes into the lowercase database format", () => {
    expect(normalizeRetailCode(" LAG-LEK ")).toBe("lag-lek");
    expect(normalizeRetailCode("ABJ-AR1")).toBe("abj-ar1");
  });

  it("keeps normalized codes compatible with the database check constraint", () => {
    expect(isValidRetailCode("lag-lek")).toBe(true);
    expect(isValidRetailCode("abj-ar1")).toBe(true);
    expect(isValidRetailCode("lag lek")).toBe(false);
    expect(isValidRetailCode("lag_lek")).toBe(false);
  });

  it("renders internal codes in the familiar uppercase retail format", () => {
    expect(displayRetailCode("lag-lek")).toBe("LAG-LEK");
  });
});
