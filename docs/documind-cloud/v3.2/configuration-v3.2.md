---
product: DocuMind Cloud
version: "3.2"
category: Configuration
document_type: Configuration Guide
updated_at: "2026-09-22"
---

# Configuration

DocuMind Cloud v3.2 configuration is workspace-scoped unless noted. Administrative changes are validated before activation and recorded in the audit log.

## Workspace Settings

Use `GET /v3/workspace/settings` to inspect settings and `PATCH /v3/workspace/settings` to update them.

```json
{
  "default_collection": "engineering",
  "default_language": "en",
  "retention_days": 365,
  "search_result_limit": 10,
  "group_sources": true
}
```

`group_sources` is enabled by default in v3.2 and causes search responses to group matching chunks by document. `retention_days` accepts 30 through 2555.

## Collections and Indexing

Create collections with `POST /v3/collections`. Collection names use lowercase letters, numbers, hyphens, and underscores. Set `chunk_size` between 400 and 1200 tokens and `chunk_overlap` between 0 and 200 tokens. For technical documentation, use 800 and 100. Supported parsers are Markdown, HTML, PDF, and DOCX.

v3.2 adds `section_indexing: true`, which enables section-level retrieval through `/documents/{document_id}/sections/{section_id}`. Enable it for documentation with stable headings.

## Authentication Settings

Configure redirect URIs, scopes, API key expiry, and refresh-token reuse handling. Refresh-token rotation is always enabled for OAuth clients in v3.2. Set `refresh_token_grace_seconds` only for legacy clients during migration; the supported range is 0 through 30 seconds.

## Validation

Run `GET /v3/workspace/settings/validate` after a change. The response includes `valid`, `warnings`, and `effective_at`. `400 CFG-001` means invalid JSON, `409 CFG-002` a conflicting collection, `422 CFG-003` an out-of-range value, `415 CFG-004` an unsupported document format, and `422 CFG-005` an incompatible legacy setting.

## Change Management

Export settings, apply one related group at a time, validate, and inspect a sample search before promoting changes. During v3.1 migration, enable grouped sources in a test workspace first and update clients before enabling it in production.
