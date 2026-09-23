---
product: DocuMind Cloud
version: "3.2"
category: Troubleshooting
document_type: Troubleshooting Guide
updated_at: "2026-09-22"
---

# Troubleshooting

Collect the request ID, deployment ID, workspace ID, timestamp, endpoint, and client version for support. Redact tokens, API keys, secrets, and document content.

## Refresh Token Reuse

A `401 AUTH-006` means a refresh token was used after it had already been exchanged. Confirm that only one worker refreshes a session at a time, replace the stored token atomically, and revoke the affected token family. Require a new authorization flow rather than retrying the old refresh token.

## Search Result Parsing

If a v3.1 client reports missing results after upgrading, check whether it still reads the old flat result array or sends `top_k`. v3.2 requires `limit` and returns grouped `sources`. `400 API-008` identifies the removed `top_k` field. Update the parser and test `sources[].matches[]` before production rollout.

## No Results or Stale Content

Confirm document status is `ready`, collection permissions are correct, and `section_indexing` matches the client expectation. Inspect `indexing_version` and `content_hash` to determine whether the current content is indexed. Poll asynchronous jobs every five seconds for up to 12 attempts.

## Deployment Compatibility

A `DEPLOY-004` readiness failure means the client or deployment identity does not support v3.2. Verify `DOCUMIND_API_COMPATIBILITY=v3.2`, `DOCUMIND_DEPLOYMENT_ID`, image version, workload identity permissions, and the `/health/compatibility` response.

## Rate Limiting and Latency

For `429 API-007`, honor `Retry-After` and use exponential backoff with jitter. For slow grouped search responses, reduce `limit`, disable snippets when not needed, and request only required sections. Capture endpoint latency separately from indexing latency.

## Configuration Errors

`CFG-005` indicates a v3.1 setting that conflicts with v3.2 behavior, such as an unsupported refresh-token policy or invalid grouping mode. Export settings, remove the incompatible field, validate, and retry in a non-production workspace first.
