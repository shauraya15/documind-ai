---
product: DocuMind Cloud
version: "3.2"
category: Deployment
document_type: Deployment Guide
updated_at: "2026-09-22"
---

# Deployment

DocuMind Cloud v3.2 integrations should run in the customer's cloud or data center while DocuMind Cloud hosts the API and documentation index. v3.2 adds a required deployment identity and a startup compatibility check.

## Prerequisites

Use a Linux host or container platform with outbound HTTPS access to `api.documind.example.com` and `auth.documind.example.com`. Provide TLS, a secret store, a workspace, and a workload identity or service principal with only `docs:read` and `search:read` permissions.

## Environment Variables

```bash
DOCUMIND_API_URL=https://api.documind.example.com/v3
DOCUMIND_CLIENT_ID=replace-me
DOCUMIND_CLIENT_SECRET=replace-me
DOCUMIND_WORKSPACE_ID=workspace-id
DOCUMIND_DEPLOYMENT_ID=prod-eu-01
DOCUMIND_API_COMPATIBILITY=v3.2
DOCUMIND_LOG_LEVEL=info
```

`DOCUMIND_DEPLOYMENT_ID` is required in v3.2 for deployment inventory and audit correlation. Use workload identity where the platform supports it; otherwise inject the client secret from a managed secret store.

## Container Deployment

Deploy an immutable image with at least two replicas behind an HTTPS load balancer. v3.2 requires a startup check against `/health/compatibility` before readiness is reported. Set readiness to `/health/ready` and liveness to `/health/live`.

```bash
docker build --tag registry.example.com/documind-connector:3.2.0 .
docker push registry.example.com/documind-connector:3.2.0
kubectl apply -f deployment-v32.yaml
```

The v3.2 manifest should request 300m CPU and 768Mi memory to support grouped search responses. Use a rolling update with `maxUnavailable: 0`, `maxSurge: 1`, and a 60-second termination grace period so in-flight token refreshes can finish.

## Migration Rollout

First deploy the v3.2 client in compatibility mode, run `/health/compatibility`, and verify that search parsing supports grouped `sources`. Then enable v3.2 behavior, rotate credentials, and monitor search and authentication errors. Keep the v3.1 image available until the migration is stable.

## Deployment Errors

`DEPLOY-001` means a required variable is missing. `DEPLOY-002` means network reachability failed. `DEPLOY-003` means readiness failed. `DEPLOY-004` means the client or deployment identity does not support v3.2. Verify `DOCUMIND_DEPLOYMENT_ID`, compatibility setting, permissions, and image version.
