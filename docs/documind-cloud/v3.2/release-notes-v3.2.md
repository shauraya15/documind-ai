---
product: DocuMind Cloud
version: "3.2"
category: Release
document_type: Release Notes
updated_at: "2026-09-22"
---

# Release Notes

DocuMind Cloud v3.2 is the compatibility release after v3.1. It improves credential safety, groups retrieval results by source document, adds section retrieval, and strengthens deployment validation.

## Changes from v3.1 to v3.2

### Authentication

OAuth access tokens now expire after 30 minutes instead of 60 minutes. Refresh-token rotation is enabled: every successful refresh returns a replacement token and invalidates the old token. Reuse is rejected with `401 AUTH-006`.

### API

`POST /v3/search` replaces `top_k` with `limit` and returns grouped `sources` with nested matches instead of only a flat result list. Clients sending `top_k` receive `400 API-008`. Document metadata now includes `content_hash` and `indexing_version`. Section retrieval is available through `GET /documents/{document_id}/sections/{section_id}`.

### Deployment

Deployments must provide `DOCUMIND_DEPLOYMENT_ID` and `DOCUMIND_API_COMPATIBILITY=v3.2`. Startup now checks `/health/compatibility`. Recommended resource requests increase from 250m CPU and 512Mi memory to 300m CPU and 768Mi memory. Upload URL lifetime increases from 10 to 15 minutes.

### Configuration

Grouped source results are enabled by default with `group_sources: true`. Section indexing can be enabled with `section_indexing: true`. Legacy clients may use a short refresh-token grace period during migration, but rotation remains enabled.

## Upgrade Checklist

1. Update search requests from `top_k` to `limit`.
2. Update response parsing from flat results to `sources[].matches[]`.
3. Implement atomic refresh-token replacement and handle `AUTH-006`.
4. Add deployment ID and compatibility environment variables.
5. Increase deployment resource requests and add the compatibility health check.
6. Test settings, search, upload, and rollback in a non-production workspace.

## Known Limitations

The v3.2 API remains under `/v3`; clients must explicitly adopt the changed search contract. Search source grouping reduces duplicate document cards but does not merge content from unrelated documents with similar titles.
