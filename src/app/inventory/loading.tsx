import { FoundationState } from "@/components/ui/state";

export default function InventoryLoading() {
  return (
    <FoundationState kind="loading" title="Loading inventory operations">
      RetailOS is loading tenant-scoped inventory balances and workflow queues.
    </FoundationState>
  );
}
