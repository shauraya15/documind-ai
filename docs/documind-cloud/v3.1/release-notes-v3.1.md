---
product: DocuMind Cloud
version: "3.1"
category: Release
document_type: Release Notes
updated_at: "2026-09-22"
---

# Release Notes

DocuMind Cloud v3.1 establishes the initial production REST API, OAuth authorization code integration, document collections, and asynchronous indexing workflow.

## Highlights

- Added OAuth 2.0 authorization code authentication and scoped API keys.
- Added document upload, metadata retrieval, collection management, and search endpoints under `/v3`.
- Added cursor pagination for document lists.
- Added Markdown, HTML, PDF, and DOCX indexing pipelines.
- Added container deployment guidance with readiness and liveness probes.

## Authentication Behavior

Access tokens expire after 60 minutes. Refresh tokens remain valid until revoked or client-secret rotation. Token rotation is a manual administrator procedure in v3.1.

## API Behavior

`POST /v3/search` accepts `query`, `collection`, `top_k`, and `include_snippets`. Document uploads return `202 Accepted` and a job ID. The default workspace request limit is 600 requests per minute.

## Known Limitations

- OAuth refresh tokens are not rotated automatically.
- Search results expose chunk-level snippets and may include several results from the same document.
- Configuration changes are workspace-scoped and require explicit validation.
- Large binary uploads must use the pre-signed upload flow.

## Upgrade Planning

Before upgrading to v3.2, inventory clients that use `/v3/search`, record current redirect URIs, export workspace settings, and confirm deployment automation can supply the new v3.2 environment values. Review the v3.2 release notes for token rotation, API response changes, and deployment requirements.
