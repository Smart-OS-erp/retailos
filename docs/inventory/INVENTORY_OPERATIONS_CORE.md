# Phase 1 M6-M1.9 - Inventory Operations Core

## Scope

M6 turned the accepted Phase 1 inventory foundation into operational inventory
workflows. M1.9 completes the approved Phase 1 inventory-control slice:

- current inventory positions by SKU/location;
- movement history;
- stock adjustment request, approval, rejection, execution, and reversal;
- transfer request, approval, rejection, dispatch, partial receipt, full
  receipt, and discrepancy evidence;
- stock-count submission, review, reconciliation issue decisions, closure, and
  optional count-correction movement posting;
- persisted-evidence low/overstock/out-of-stock/in-transit watchlist;
- SKU, barcode, and product lookup within effective location scope;
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

## Stock-count lifecycle

```text
submitted
  -> reviewed
  -> closed

submitted
  -> cancelled
```

Submission records physical count evidence and creates reconciliation issues for
non-zero variances. Review marks the count as ready for closure. Closure requires
all open issues to be resolved or dismissed. If the reviewer chooses correction
posting, resolved issues create `count_correction` movement rows with
before/after quantities and idempotency evidence.

## Watchlist and lookup

`public.inventory_stock_watchlist` is derived from persisted current balances:

- `out_of_stock` when available quantity is zero or below;
- `low_stock` when available quantity is below the persisted sales-based watch
  threshold;
- `overstock` when on-hand quantity is high relative to persisted 90-day sales
  evidence;
- `in_transit` when units require receiving follow-up;
- `healthy` when no current watchlist issue is present.

These signals are operational alerts, not forecasts. They do not authorize
automatic replenishment, markdown, purchase, or POS activity.

`public.inventory_lookup_items` and `public.search_inventory_items` expose
tenant/location-scoped SKU, barcode, product, and current quantity lookup.

## Security controls

- All operational writes are database RPCs guarded by `auth.uid()`,
  `private.has_permission`, and `private.has_location_permission`.
- Tenant-owned operational tables have RLS enabled and forced.
- Direct browser writes to operational tables are not used.
- Stock-affecting functions lock `public.inventory_movements` conservatively
  while calculating and posting balances to avoid double-spend style races.
- Idempotency keys prevent duplicate execute, reverse, dispatch, receipt, and
  stock-count closure submissions from double-posting ledger movements.
- Every workflow transition records `audit_events` evidence.

## UI controls

Phase 1 pages use:

- `AppShell`;
- `RetailDataGrid`;
- shared status presentation;
- shared market/currency/date formatting.

The pages are operational workflow surfaces, not final dashboards.
