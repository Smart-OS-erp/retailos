import { describe, expect, it } from "vitest";

import {
  isValidOrganizationSlug,
  normalizeOrganizationSlug,
} from "@/lib/organizations/slug";

describe("organization slug", () => {
  it("normalizes user input deterministically", () => {
    expect(normalizeOrganizationSlug("  Lagos Luxury & Co.  ")).toBe(
      "lagos-luxury-co",
    );
  });

  it("rejects unsafe or ambiguous slugs", () => {
    expect(isValidOrganizationSlug("valid-retailer-2")).toBe(true);
    expect(isValidOrganizationSlug("-leading")).toBe(false);
    expect(isValidOrganizationSlug("double--hyphen")).toBe(false);
    expect(isValidOrganizationSlug("Uppercase")).toBe(false);
    expect(isValidOrganizationSlug("a")).toBe(false);
  });
});
