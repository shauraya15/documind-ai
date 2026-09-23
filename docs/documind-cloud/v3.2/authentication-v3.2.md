---
product: DocuMind Cloud
version: "3.2"
category: Authentication
document_type: Authentication Guide
updated_at: "2026-09-22"
---

# Authentication

DocuMind Cloud v3.2 uses OAuth 2.0 for user-facing integrations and restricted API keys for service integrations. All requests must use HTTPS. v3.2 adds refresh-token rotation to reduce the impact of a stolen refresh token.

## OAuth Authorization Code Flow

Use `GET https://auth.documind.example.com/oauth/authorize` with `client_id`, `redirect_uri`, `response_type=code`, `scope`, and a random `state`. Exchange the single-use code at `POST https://auth.documind.example.com/oauth/token`. Authorization codes expire after 60 seconds.

```http
POST /oauth/token HTTP/1.1
Host: auth.documind.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code=CODE&client_id=CLIENT_ID&client_secret=CLIENT_SECRET&redirect_uri=https%3A%2F%2Fapp.example.com%2Fcallback
```

## Refresh Token Rotation

In v3.2, every successful refresh request returns a new refresh token and invalidates the previous one. The client must atomically replace the stored refresh token with the returned value. Never retry a refresh request with the old token after receiving a response.

```http
POST /oauth/token HTTP/1.1
Host: auth.documind.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&refresh_token=REFRESH_TOKEN&client_id=CLIENT_ID&client_secret=CLIENT_SECRET
```

Access tokens expire after 30 minutes. Refresh tokens have a 30-day inactivity window and are revoked if token reuse is detected. A reuse response is `401 AUTH-006`; require the user to authenticate again and investigate the client session.

## Scopes and API Keys

Scopes are `docs:read`, `search:read`, `collections:write`, and `admin:read`. API keys remain suitable for non-user service jobs and are sent as `X-DocuMind-Api-Key`. Keys can have an administrator-selected expiry and should still be rotated regularly.

## Common Errors

- `401 AUTH-001`: missing or expired access token.
- `401 AUTH-002`: invalid client credentials or authorization code.
- `403 AUTH-003`: missing scope.
- `409 AUTH-004`: redirect URI mismatch.
- `429 AUTH-005`: authentication rate limit exceeded.
- `401 AUTH-006`: refresh-token reuse detected; start a new authorization flow.

## Safe Client Handling

Use a server-side secret store, protect refresh-token replacement with a transaction or lock, and log token family ID and request ID rather than token values. Do not place client secrets or refresh tokens in browser storage.
