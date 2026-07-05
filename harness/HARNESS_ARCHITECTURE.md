# Harness Architecture

## Purpose

The harness is the control plane for how RetailOS is built. It makes phase scope, security requirements, validation evidence, and work state visible before application complexity arrives.

## Layers

- **Policy:** `AGENTS.md` defines agent behavior, phase control, prohibitions, gates, and handoff requirements.
- **Product specification:** `docs/` defines mission, active scope, business semantics, intelligence constraints, and future-compatible boundaries.
- **Security specification:** `docs/security/` defines trust boundaries, threats, platform controls, test expectations, and response preparation.
- **State:** `reports/` says what mode the repository is in, what happens next, and what is blocked or recently failed.
- **Automation:** `.github/workflows/` and `scripts/` expose honest placeholder quality/security checks until a toolchain exists.
- **Evidence boundaries:** `tests/`, `supabase/migrations/`, `plans/`, and `figma-handoff/` reserve reviewed locations without simulating implementation.

## Design constraints

The harness must remain lightweight and executable before an app exists. Checks identify not-applicable conditions and TODOs without reporting absent product validation as success. As implementation arrives, placeholders must be replaced with deterministic tooling and regression tests; they must not become permanent ceremonial gates.

## Change rule

Any change that weakens an invariant, changes a phase, introduces a new trust boundary, or suppresses a gate requires explicit human review and corresponding documentation/test updates.
