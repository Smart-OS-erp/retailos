# Intelligence Layer

## Purpose

The RetailOS intelligence layer turns permitted operational facts into explainable observations and proposed actions. Phase 0 begins with inventory recovery intelligence. The harness implements none of these services yet.

## Required pipeline

1. Resolve authenticated user, active organization, membership, and effective permissions.
2. Read tenant-scoped source data through RLS-protected access paths.
3. Validate provenance, freshness, units, currencies, and completeness.
4. Apply a versioned deterministic rule or approved model.
5. Produce a structured result containing evidence, confidence, caveats, and rule/model version.
6. Apply output authorization and redact inaccessible entities or fields.
7. Record auditable decision metadata without logging secrets or unnecessary sensitive content.
8. Require explicit approval for high-impact actions.

## Architecture rules

- Prefer deterministic, testable calculations for recovery classification before generative interpretation.
- Generative models may explain approved structured results but may not invent metrics or broaden retrieval scope.
- Every tool call and retrieval is permission-aware and tenant-bound server-side.
- Prompt text is untrusted input; it cannot override authorization, tool policy, or data boundaries.
- Evaluation includes accuracy, unsupported claims, cross-tenant leakage, prompt injection, and unsafe action attempts.

## Future-phase boundary

Forecasting, autonomous workflows, broad Copilot tools, and cross-domain intelligence remain future work even if their interfaces are documented for compatibility.
