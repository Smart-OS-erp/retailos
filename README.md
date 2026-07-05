# RetailOS

RetailOS is secure operating intelligence for African fashion retail. The active build is **Phase 0 — Foundation: Inventory Recovery Intelligence**, currently in **Secure Technical Foundation** mode.

## Implemented foundation

- Next.js 16 App Router with strict TypeScript and security headers.
- Supabase cookie-based SSR clients for browser, server, and proxy boundaries.
- Email/password sign-in, sign-up, confirmation, sign-out, and server-side user verification.
- Minimal organization onboarding with no dashboard or future-phase product surface.
- Organizations, memberships, role permissions, audit events, forced RLS, and deny-by-default grants.
- Atomic organization creation that creates the owner membership and audit event together.
- Unit, source-boundary, and PostgreSQL-engine cross-tenant RLS tests.

The service-role key and database URL are server-only. The application does not create a service-role browser client or use privileged credentials for normal user requests.

## Local setup

1. Use Node 22.
2. Run `npm ci`.
3. Create an ignored `.env.local` from the names in `.env.example`.
4. Keep real values local or in managed deployment settings; never commit or paste them into chat, logs, screenshots, or fixtures.
5. Apply the reviewed migration to a non-production Supabase environment before exercising onboarding.
6. Run `npm run dev`.

Required names:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
```

## Validation

```bash
npm run lint
npm run typecheck
npm test
npm run security
npm run build
npm audit --audit-level=moderate
```

The local RLS suite runs on an embedded PostgreSQL engine with two synthetic tenants. Live Supabase migration, Auth configuration, and preview-deployment verification remain explicit release steps.

Read [`AGENTS.md`](AGENTS.md) and [`reports/CURRENT_STATE.md`](reports/CURRENT_STATE.md) before making changes.
