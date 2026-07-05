# Phase 0 Scope — Foundation: Inventory Recovery Intelligence

## Goal

Create a secure foundation for inventory recovery intelligence and, after the harness PR is accepted, deliver the smallest trustworthy path from tenant-scoped inventory facts to explainable recovery opportunities.

## Harness milestone (current)

This change is limited to governance, documentation, reports, validation scaffolding, CI structure, reserved test/migration boundaries, and design handoff specifications. It intentionally contains no application scaffold or product implementation.

## In scope after harness acceptance

- Next.js technical scaffold.
- Supabase project integration and migration discipline.
- Authentication, organizations, memberships, roles, and RLS.
- Minimal onboarding skeleton needed to establish an organization and authorized membership.
- Security and tenant-isolation tests.
- Subsequent Phase 0 slices for inventory inputs, recovery classification, explanation, and authorized actions, each requiring separate acceptance.

## Out of scope now

- Full Next.js or Supabase scaffold.
- Dashboards, UI screens, and mock product experiences.
- Seeded demo analytics presented as real intelligence.
- Sales, POS, procurement, fulfilment, finance, CRM, workforce, integrations, forecasting, and autonomous Copilot actions.
- Implementing any Phase 1–5 capability.

## Phase 0 intelligence boundary

A future recovery result must be tenant-scoped, based on known data, include its calculation version and freshness, explain the contributing signals, and never mutate price, stock, or customer-facing channels without explicit permission and confirmation.

## Exit criteria

Phase 0 cannot exit until secure foundations and the agreed recovery workflow pass acceptance and security tests; RLS isolation has positive and negative evidence; recovery classifications are explainable; no future-phase implementation is bundled; and release, rollback, monitoring, and incident procedures are reviewed.
