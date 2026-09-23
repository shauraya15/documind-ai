---
product: DocuMind Cloud
version: "3.1"
category: Configuration
document_type: Configuration Guide
updated_at: "2026-09-22"
---

# Configuration

DocuMind Cloud v3.1 configuration is workspace-scoped unless noted. Changes to security and indexing settings require an administrator role and are recorded in the audit log.

## Workspace Settings

The workspace settings endpoint is `GET /v3/workspace/settings`. Update supported settings with `PATCH /v3/workspace/settings`.

```json
{
  "default_collection": "engineering",
  "default_language": "en",
  "retention_days": 365,
  "search_result_limit": 10
}
```

`retention_days` accepts 30 through 2555. `search_result_limit` accepts 1 through 50 for interactive queries.

## Collections

A collection groups documents and controls access. Create one with `POST /v3/collections`:

```json
{
  "name": "engineering",
  "description": "Engineering runbooks and API references",
  "default_visibility": "workspace"
}
```

Collection names are lowercase letters, numbers, hyphens, and underscores. A document belongs to one collection at a time.

## Indexing Settings

Set `chunk_size` between 400 and 1200 tokens and `chunk_overlap` between 0 and 200 tokens. For technical documentation, 800 tokens and 100 tokens are recommended. Supported parsers are Markdown, HTML, PDF, and DOCX. Unsupported files receive `CFG-004`.

## Authentication Settings

Configure allowed redirect URIs, token scopes, and API key expiry policies in the console. v3.1 does not automatically rotate OAuth refresh tokens; administrators must revoke and recreate credentials during a planned rotation.

## Validation

Run `GET /v3/workspace/settings/validate` after a configuration change. A successful response includes `valid: true` and a list of warnings. `400 CFG-001` indicates invalid JSON, `409 CFG-002` indicates a conflicting collection name, `422 CFG-003` indicates a value outside its supported range, and `415 CFG-004` indicates an unsupported document format.

## Change Management

Test configuration changes in a non-production workspace. Export the current settings before a change, apply one related group at a time, validate, and record the change ticket in the audit log. Restore the previous JSON export if validation or retrieval quality degrades.
