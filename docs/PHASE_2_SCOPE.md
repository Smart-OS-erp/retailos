# Phase 2 Scope - Merchandising & Planning OS

Status: active through M2.6 only.

Phase 2 turns RetailOS inventory and sales evidence into merchandising planning workflows. It is not positioned as a generic POS, finance system, wholesale module, purchase-order system, or forecasting engine. Later approved phases may add execution capabilities, but Phase 2 planning must not silently become purchasing, supplier, physical inventory, finance, POS, or external-system execution.

## Approved milestones in this slice

### M2.0 - Scope, architecture, and secure contracts

- Add merchandising permissions.
- Add navigation and shared shell entry points.
- Create secure tenant-scoped planning tables, views, and RPC contracts.

### M2.1 - Product productivity metrics

- Build `product_productivity_metrics` from persisted inventory, sales, and inventory-risk evidence.
- Show sell-through as a historical proxy only.
- Surface data confidence and planning signals honestly.

### M2.2 - Brand, category, and collection performance

- Build `merchandising_group_performance`.
- Brand/category rows use existing product metadata.
- Collection rows are meaningful only when products are assigned to Phase 2 collections; unassigned rows remain explicit.

### M2.3 - Markdown planning drafts

- Create markdown drafts from approved recommendation evidence.
- Drafts never execute price, POS, ecommerce, campaign, or promotion changes.

### M2.4 - Assortment and collection planning contracts

- Create planning cycles and assortment plan items.
- Approval means human planning acceptance only; it does not buy, transfer, publish, or notify.

### M2.5 - Allocation and replenishment recommendations

- Generate directionally useful recommendations from current evidence.
- Confidence must be shown as `insufficient_data`, `low`, `medium`, or `high`.
- Recommendations explain rationale and require human conversion/approval.

### M2.6 - Validation and acceptance evidence

- Provide local integration evidence.
- Verify hosted schema.
- Update reports and acceptance docs.
- Stop after M2.6.

## Non-goals

- POS or payments.
- Purchase orders or supplier management.
- Finance/accounting.
- Wholesale/B2B.
- Full warehouse management.
- Advanced forecasting or fake precision.
- Autonomous Copilot execution.
- Automatic campaign or markdown publishing.
