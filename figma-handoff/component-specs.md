# Component Specifications

Documentation only; no component implementation or Figma library is created in the harness milestone.

## Foundation components for future Phase 0 work

- **App shell:** authenticated organization context, responsive navigation, skip link, and clear session/permission state.
- **Organization switcher:** shows only active memberships; switching invalidates organization-scoped cache and reauthorizes server requests.
- **Data status:** exposes source, last-updated time, coverage, stale/partial/error state, and refresh behavior.
- **Metric:** label, formatted value, unit/currency, definition, comparison window, confidence/provenance, and unavailable state.
- **Recovery reason:** structured signals and rule version; never a free-floating unsupported claim.
- **Permission boundary:** forbidden/approval-required state with no data leakage.
- **Confirmation:** describes actor, tenant, target, impact, reversibility, and required permission for high-impact action.

All components require keyboard, screen-reader, responsive, loading, empty, partial, error, stale, and forbidden specifications before implementation.
