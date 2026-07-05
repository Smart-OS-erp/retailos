Next Task:
After this non-production foundation verification is reviewed:
- Configure custom SMTP or approve a Supabase plan that permits the token-hash confirmation email template, then verify valid, invalid, expired, and replayed confirmation links.
- Reconcile the SQL Editor deployment with Supabase migration history before any later `db push`.
- Configure the four environment variables separately for Vercel preview without exposing server-only values.
- Complete the Vercel account's GitHub login connection, connect `Smart-OS-erp/retailos`, then deploy and verify the already-protected preview, including sign-up, confirmation, sign-in, sign-out, onboarding, and authorization smoke tests.
- Keep production environment configuration and deployment approval separate.

Do not add dashboards, inventory intelligence, uploads, or future-phase modules until this foundation is accepted.
