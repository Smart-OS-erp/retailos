"use client";

import { FoundationState } from "@/components/ui/state";

export default function InventoryError() {
  return (
    <FoundationState kind="error" title="Inventory operations unavailable">
      RetailOS could not safely load the inventory operation workspace. Refresh
      after checking the active organization and deployment state.
    </FoundationState>
  );
}
