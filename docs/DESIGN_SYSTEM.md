# Design System

This file records constraints for future product implementation. It does not authorize UI screens in the harness milestone.

## Principles

- Clear before clever: users should see what a metric means, when it was calculated, and what they can do.
- Operational density with calm hierarchy: support real retail work without decorative dashboards.
- Mobile-first resilience: core review and approval paths must work on small screens and tolerate interrupted workflows.
- Accessible by default: WCAG 2.2 AA minimum target, semantic structure, keyboard operation, visible focus, sufficient contrast, and non-color status cues.
- Local context: currencies, dates, timezones, names, addresses, and terminology must be configurable and correctly formatted.
- Trust surfaces: provenance, freshness, confidence, permission state, destructive impact, and confirmation are first-class components.

## Token source

Machine-readable starter tokens live in `figma-handoff/design-tokens.json`. They are documentation values, not a shipped UI theme. Token changes require design and accessibility review.

## Component expectations

Future components need documented states for loading, empty, partial, stale, error, offline/retry, forbidden, and success. Tables must remain understandable on mobile. Actions must distinguish proposal, approval, execution, and rollback state.

## Prohibition

Do not generate static dashboards or screens to imply product progress. Build UI only when a phase-approved vertical slice has real authorization, data, states, and tests.
