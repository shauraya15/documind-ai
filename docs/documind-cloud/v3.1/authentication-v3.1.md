---
product: DocuMind Cloud
version: "3.1"
category: Authentication
document_type: Authentication Guide
updated_at: "2026-09-22"
---

# Authentication

DocuMind Cloud v3.1 uses OAuth 2.0 for user-facing integrations and API keys for controlled service integrations. All requests must use HTTPS. The API identifies an application with its client ID and identifies a user or service with an access token.

## OAuth Authorization Code Flow

Use the authorization code flow for web applications. Register a redirect URI in the DocuMind Cloud console before sending users to the authorization endpoint.

1. Send the user to `GET https://auth.documind.example.com/oauth/authorize` with `client_id`, `redirect_uri`, `response_type=code`, `scope`, and a random `state` value.
2. Verify the returned `state` value, then exchange the code at `POST https://auth.documind.example.com/oauth/token`.
3. Store the access token on the server and send it in the `Authorization: Bearer <token>` header.
4. Discard the authorization code after one exchange. Codes expire after 60 seconds.

Example token request:

```http
POST /oauth/token HTTP/1.1
Host: auth.documind.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code=CODE&client_id=CLIENT_ID&client_secret=CLIENT_SECRET&redirect_uri=https%3A%2F%2Fapp.example.com%2Fcallback
```

Access tokens expire after 60 minutes. In v3.1, refresh tokens remain valid until revoked or until the client secret is rotated. Request a replacement access token with `grant_type=refresh_token`.

## API Keys

Create a restricted API key for server-to-server jobs that do not act on behalf of a user. Send it as `X-DocuMind-Api-Key`. Keys should be scoped to the smallest required workspace and rotated manually at least every 90 days.

## Scopes

Supported scopes include `docs:read`, `search:read`, `collections:write`, and `admin:read`. A token without the required scope receives `403 AUTH-003`.

## Common Errors

- `401 AUTH-001`: missing, expired, or malformed bearer token.
- `401 AUTH-002`: invalid client credentials or authorization code.
- `403 AUTH-003`: token does not include the required scope.
- `409 AUTH-004`: redirect URI does not match the registered URI.
- `429 AUTH-005`: authentication rate limit exceeded.

## Security Practices

Never put client secrets or API keys in browser code, mobile binaries, source control, or documentation examples used in production. Use a server-side secret store, validate TLS certificates, and log token subject and request ID rather than token values.
