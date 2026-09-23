---
product: DocuMind Cloud
version: "3.1"
category: Troubleshooting
document_type: Troubleshooting Guide
updated_at: "2026-09-22"
---

# Troubleshooting

Use the request ID, workspace ID, timestamp, and endpoint when opening a support case. Redact bearer tokens, API keys, document content, and client secrets from logs and tickets.

## Authentication Failures

For `401 AUTH-001`, inspect the `Authorization` header, token expiry, issuer, and audience. For `401 AUTH-002`, verify the client ID, client secret, redirect URI, and that the authorization code has not already been used. For `403 AUTH-003`, request the missing scope from the workspace administrator.

## Search Returns No Results

Confirm the document status is `ready` with `GET /v3/documents/{document_id}`. Check that the caller can access the collection and that the query uses the expected language. If a recent upload is missing, inspect the indexing job and wait for completion before retrying. Reindexing the same document repeatedly can create conflicting versions.

## Upload or Indexing Problems

A `202` response means upload processing is asynchronous. Poll the job endpoint every five seconds, with a maximum of 12 attempts. `CFG-004` means the parser does not support the submitted content type. `API-006` means the payload exceeds the request limit; use the pre-signed upload URL for large content.

## Rate Limiting

For `429 API-007`, stop sending requests until `Retry-After` expires. Use exponential backoff starting at one second and cap retries at five attempts. Avoid retrying `400`, `401`, `403`, and `404` without changing the request.

## Slow Responses

Capture latency by endpoint and query size. Reduce `top_k`, omit snippets when not needed, and use cursor pagination. Check client connection pooling and DNS latency before changing service settings. A sustained search latency above 2 seconds should be escalated with request IDs.

## Deployment Health

If `/health/ready` fails, verify environment variables, outbound HTTPS, DNS, and secret-store access. `DEPLOY-001` indicates missing configuration; `DEPLOY-002` indicates network reachability; `DEPLOY-003` indicates the process started but dependencies are not ready.
