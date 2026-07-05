# Copilot Security

Copilot is a future capability. This document constrains its design; it does not authorize implementation.

## Invariants

- The caller's effective permissions bound retrieval, generation, and tools.
- Tenant identity is established server-side and cannot be changed by prompt text.
- Models do not receive service-role credentials or direct unrestricted database access.
- Retrieved content, uploaded documents, and tool output are untrusted and may contain prompt injection.
- High-impact actions require structured validation, explicit permission, human confirmation, idempotency, and audit.
- Answers identify sources/freshness and distinguish facts, calculations, proposals, and uncertainty.
- Sensitive input/output logging is minimized and redacted; provider retention/training settings require review.

## Tool design

Tools are narrow, typed, allowlisted, tenant-bound, rate-limited, and return only required fields. Authorization occurs inside each tool, not only in the orchestrating prompt. Separate read and write tools; default to read-only.

## Security evaluation

Test cross-tenant requests, indirect prompt injection, system-prompt extraction, secret requests, role spoofing, unsafe tool chaining, data reconstruction, excessive export, hallucinated metrics, and confirmation bypass.
