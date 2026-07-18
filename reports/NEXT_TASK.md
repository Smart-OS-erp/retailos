Next Task:
Finish Phase 1 visible workflow acceptance, then promote to Phase 2 and proceed milestone-by-milestone through M2.6.

Immediate Phase 1 acceptance release steps:

1. Open and review the Phase 1 acceptance PR.
2. Confirm CI quality/security and Vercel preview checks pass.
3. Merge the accepted PR into `main`.
4. Confirm production Vercel deployment is ready.
5. Smoke affected production routes:
   - `/login`
   - `/inventory`
   - `/inventory/counts`
   - `/inventory/search`
   - `/inventory/watchlist`
6. Inspect runtime errors where the available Vercel tooling permits it.
7. Record final production deployment evidence.

After Phase 1 acceptance is merged:

- Update `reports/CURRENT_STATE.md` to Phase 2 - Merchandising & Planning OS.
- Implement one Phase 2 milestone at a time.
- Stop after M2.6 is implemented, validated, documented, and handed off.

Approved Phase 2 sequence, subject to active-phase promotion:

1. M2.0 - Merchandising scope, architecture, and secure data contracts.
2. M2.1 - Product productivity metrics from persisted inventory/sales facts.
3. M2.2 - Category, brand, and collection performance read models.
4. M2.3 - Markdown planning drafts and approval-ready recommendations.
5. M2.4 - Assortment and collection planning contracts.
6. M2.5 - Allocation and replenishment recommendations with honest confidence.
7. M2.6 - Phase 2 validation evidence, documentation, and acceptance matrix.

Do not build POS, payments, finance/accounting, wholesale, autonomous Copilot execution, or fake forecasting precision.
