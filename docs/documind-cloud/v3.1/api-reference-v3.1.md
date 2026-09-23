---
product: DocuMind Cloud
version: "3.1"
category: API
document_type: API Reference
updated_at: "2026-09-22"
---

# API Reference

The DocuMind Cloud v3.1 REST API is available at `https://api.documind.example.com/v3`. Requests and responses use JSON unless an endpoint states otherwise. Include `Authorization: Bearer <token>` and a unique `X-Request-Id` on every request.

## List Documents

`GET /documents` returns documents visible to the authenticated workspace.

```http
GET /v3/documents?collection=engineering&limit=20&cursor=eyJwYWdlIjoyfQ==
Authorization: Bearer ACCESS_TOKEN
```

The response contains `items`, `next_cursor`, and `request_id`. The maximum `limit` is 100. Use the cursor exactly as returned; cursors expire after 15 minutes.

## Search Documents

`POST /search` performs keyword and semantic retrieval.

```json
{
  "query": "configure OAuth token rotation",
  "collection": "engineering",
  "top_k": 10,
  "include_snippets": true
}
```

Each result includes `document_id`, `title`, `section`, `score`, and an optional `snippet`. Results are ordered by relevance score unless `sort` is supplied.

## Upload a Document

`POST /documents` accepts a JSON metadata object and returns a processing job. Binary content is uploaded to the returned pre-signed URL.

```json
{
  "title": "Operations Runbook",
  "collection": "engineering",
  "content_type": "text/markdown"
}
```

A successful response is `202 Accepted` with `document_id`, `upload_url`, and `job_id`. Upload URLs expire after 10 minutes.

## Retrieve a Document

`GET /documents/{document_id}` returns metadata, indexing status, and section summaries. `GET /documents/{document_id}/content` returns extracted content only when status is `ready`.

## Pagination and Errors

List endpoints use cursor pagination. Common errors are `400 API-001` invalid query or body, `401 API-002` missing authentication, `403 API-003` insufficient permission, `404 API-004` document not found, `409 API-005` document already exists, `413 API-006` payload too large, and `429 API-007` rate limit exceeded. Error responses contain `code`, `message`, and `request_id`.

## Rate Limits

The default workspace limit is 600 requests per minute. Search is limited to 120 requests per minute. Respect `Retry-After` on `429` responses and use exponential backoff with jitter.
