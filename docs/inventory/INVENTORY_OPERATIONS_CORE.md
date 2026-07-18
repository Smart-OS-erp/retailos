# Phase 1 M6 - Inventory Operations Core

## Scope

M6 turns the accepted Phase 1 inventory foundation into operational inventory
workflows:

- current inventory positions by SKU/location;
- movement history;
- stock adjustment request, approval, rejection, execution, and reversal;
- transfer request, approval, rejection, dispatch, partial receipt, full
  receipt, and discrepancy evidence;
- shared-shell inventory operations pages.

It does not add POS, procurement, finance, wholesale, forecasting, autonomous
execution, or broad dashboards.

## Balance model

`public.current_inventory_balances` derives balances from:

1. the latest approved inventory snapshot position for an organization, SKU,
   and location;
2. summed `inventory_movements.quantity_delta`;
3. approved transfer reservations that are not dispatched;
4. dispatched transfer quantities not yet received or damaged.

The UI reads this view instead of mutating dashboard constants or local state.

## Stock adjustment lifecycle

```text
pending_approval
  -> approved
  -> executed
  -> reversed

pending_approval
  -> rejected
```

Approval does not change stock. Execution writes movement rows with
`quantity_before`, `quantity_after`, source lineage, correlation ID, and
idempotency evidence. Reversal writes compensating movement rows and references
the original movement through `reverses_movement_id`.

## Transfer lifecycle

```text
pending_approval
  -> approved
  -> in_transit
  -> partially_received
  -> received

pending_approval
  -> rejected
```

Approval reserves source stock. Dispatch writes outbound movement rows and
places stock in transit. Receipt writes inbound movement rows. Partial receipt
keeps an open `short_receipt` discrepancy. Full receipt resolves that short
receipt discrepancy.

## Security controls

- All operational writes are database RPCs guarded by `auth.uid()`,
  `private.has_permission`, and `private.has_location_permission`.
- Tenant-owned operational tables have RLS enabled and forced.
- Direct browser writes to operational tables are not used.
- Stock-affecting functions lock `public.inventory_movements` conservatively
  while calculating and posting balances to avoid double-spend style races.
- Idempotency keys prevent duplicate execute, reverse, dispatch, and receipt
  submissions from double-posting ledger movements.
- Every workflow transition records `audit_events` evidence.

## UI controls

Phase 1 pages use:

- `AppShell`;
- `RetailDataGrid`;
- shared status presentation;
- shared market/currency/date formatting.

The pages are operational workflow surfaces, not final dashboards.
