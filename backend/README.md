# DocuMind FastAPI Backend

This backend exposes the API used by the existing React/TanStack frontend and invokes the already-published Microsoft Foundry agent. It does not create or modify Azure resources.

## Run locally

From this `backend/` directory:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API is available at `http://127.0.0.1:8000` and its OpenAPI docs are at `/docs`.

## Endpoints

- `GET /api/health`
- `GET /health`
- `POST /api/chat`
- `POST /api/search`
- `GET /api/documents`
- `POST /api/documents`
- `GET /api/knowledge/status`
- `GET /api/analytics/overview`

The chat endpoint invokes the existing published Microsoft Foundry agent `documindai`. It returns grounded answers and citations from the agent's connected knowledge base. If Foundry is unavailable or not configured, the API returns a safe `502` or `503` response; it never fabricates a chat answer. Documents created through `POST /api/documents` are held in memory and are lost when the process restarts.

## Structure

- `app/api/`: thin HTTP route handlers
- `app/services/`: local business logic and endpoint orchestration
- `app/models/`: Pydantic request and response schemas
- `app/integrations/`: Foundry integration boundary and citation mapping
- `app/core/`: environment-backed settings
- `tests/`: API tests
- `data/documents/`: future local document staging area

## Configuration

Copy `.env.example` to `.env` when environment-specific values are needed. The Foundry integration uses `DefaultAzureCredential`, so authentication comes from the active Azure CLI, managed identity, workload identity, or another supported Entra credential source.

To enable the real existing agent integration, provide:

- `AZURE_FOUNDRY_PROJECT_ENDPOINT`: the full Foundry project endpoint.
- `AZURE_FOUNDRY_AGENT_NAME`: the existing agent name, defaulting to `documindai`.

The backend does not create or modify agents, projects, knowledge bases, search services, or Azure resources. It also does not connect directly to Azure AI Search; the existing Foundry agent remains responsible for its configured knowledge access.

CORS allows the existing frontend origins `http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:8080`, and `http://127.0.0.1:8080` by default.

## Tests

From this directory:

```powershell
pytest
```
