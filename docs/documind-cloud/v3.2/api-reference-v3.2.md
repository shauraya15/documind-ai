---
product: DocuMind Cloud
version: "3.2"
category: API
document_type: API Reference
updated_at: "2026-09-22"
---

# API Reference

The DocuMind Cloud v3.2 REST API is available at `https://api.documind.example.com/v3`. Use HTTPS, `Authorization: Bearer <token>`, and a unique `X-Request-Id` for every request.

## Search Documents

`POST /search` remains the search endpoint, but v3.2 changes the request and response contract. `top_k` is replaced by `limit`, which accepts 1 through 50. The response now groups matching chunks under a document and returns `sources` with `document_id`, `title`, `sections`, and `matches`.

```json
{
  "query": "configure OAuth token rotation",
  "collection": "engineering",
  "limit": 10,
  "include_snippets": true,
  "include_sections": true
}
```

The old `top_k` field is rejected with `400 API-008`. Clients should send `limit` and handle grouped sources rather than assuming each result is a separate document.

## List Documents

`GET /documents` supports `collection`, `limit`, and `cursor`. The maximum limit is 100. Each item now includes `content_hash` and `indexing_version`, allowing clients to detect content changes without downloading the document.

## Upload a Document

`POST /documents` returns `202 Accepted` with `document_id`, `upload_url`, `job_id`, and `expires_at`. Upload URLs expire after 15 minutes in v3.2, extended from the v3.1 ten-minute window.

## Retrieve a Document

`GET /documents/{document_id}` returns metadata and indexing status. `GET /documents/{document_id}/content` returns extracted content when status is `ready`. Use `GET /documents/{document_id}/sections/{section_id}` for a focused section retrieval.

## Errors

Common errors are `400 API-001` invalid body, `400 API-008` removed or unknown search field, `401 API-002` unauthenticated, `403 API-003` insufficient permission, `404 API-004` not found, `409 API-005` conflict, `413 API-006` payload too large, and `429 API-007` rate limited. Responses contain `code`, `message`, `request_id`, and, for validation errors, `field_errors`.

## Rate Limits and Compatibility

The default workspace limit remains 600 requests per minute. Search is limited to 120 requests per minute. v3.1 clients must update `top_k` to `limit` and change result parsing before using v3.2 search responses.
