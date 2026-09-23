---
product: DocuMind Cloud
version: "3.1"
category: Deployment
document_type: Deployment Guide
updated_at: "2026-09-22"
---

# Deployment

This guide describes a production deployment of a DocuMind Cloud v3.1 integration. The integration normally runs in the customer's cloud or data center while DocuMind Cloud hosts the documentation index and API.

## Prerequisites

Use a Linux host or container platform with outbound HTTPS access to `api.documind.example.com` and `auth.documind.example.com`. Provide a DNS name for the application, a TLS certificate, a secret store, and a workspace with `docs:read` and `search:read` permissions.

## Environment Variables

Configure these values outside the application image:

```bash
DOCUMIND_API_URL=https://api.documind.example.com/v3
DOCUMIND_CLIENT_ID=replace-me
DOCUMIND_CLIENT_SECRET=replace-me
DOCUMIND_WORKSPACE_ID=workspace-id
DOCUMIND_LOG_LEVEL=info
```

Do not bake `DOCUMIND_CLIENT_SECRET` into an image or commit it to source control.

## Container Deployment

Build an immutable image, scan it, and deploy with at least two replicas behind an HTTPS load balancer. Set a readiness probe to `/health/ready` and a liveness probe to `/health/live`. Route requests only after the readiness probe succeeds.

Example deployment command:

```bash
docker build --tag registry.example.com/documind-connector:3.1.0 .
docker push registry.example.com/documind-connector:3.1.0
kubectl apply -f deployment-v31.yaml
```

The v3.1 manifest should set CPU requests of 250m, memory requests of 512Mi, and a rolling update with `maxUnavailable: 0` and `maxSurge: 1`.

## Configuration Rollout

Apply secrets first, then deploy the connector, then run a smoke test against `/health/ready`, `/v3/documents`, and `/v3/search`. Keep the prior image available for rollback. Roll back if error rate exceeds 2 percent for five minutes or search latency exceeds the service objective.

## Observability

Record request ID, endpoint, status code, latency, and workspace ID. Do not log access tokens, API keys, document contents, or client secrets. Alert on repeated `DEPLOY-003` startup failures, elevated `401` responses, and queue backlog.

## Deployment Errors

`DEPLOY-001` means a required environment variable is absent. `DEPLOY-002` means the API host cannot be resolved or reached. `DEPLOY-003` means readiness failed after startup. Confirm DNS, outbound firewall rules, secret injection, and the configured workspace before retrying.
