# Upload Security

Uploads are not part of the harness milestone. When activated, they require a dedicated threat review.

## Required controls

- Private buckets and tenant-scoped object policies.
- Server-issued, short-lived upload authorization after membership/permission checks.
- Allowlisted extensions and detected MIME/magic bytes; never trust the filename or browser MIME alone.
- Strict per-file and aggregate size limits, bounded counts, and rate limits.
- Random non-guessable storage keys prefixed/scoped by organization; normalize and discard unsafe path input.
- Quarantine and malware/content scanning for risky formats before availability.
- Safe image/document processing isolated from application workers where possible.
- Downloads require fresh authorization and safe content-disposition/type headers.
- Metadata and previews are sanitized; active content is not served from the primary application origin.
- Deletion, retention, orphan cleanup, audit, and incident handling are defined.

Tests must include polyglots, double extensions, traversal names, oversized files, decompression bombs, cross-tenant object IDs, malicious SVG/HTML, interrupted uploads, and scan failure.
