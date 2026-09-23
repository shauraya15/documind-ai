# Product Documentation Assistant

DocuMind is a grounded product-documentation assistant. The existing React/TanStack chat UI sends questions to a local FastAPI service, which invokes the published Microsoft Foundry agent `documindai`. Foundry uses its connected knowledge base and Azure AI Search index to retrieve product documentation, then returns an answer with source citations.

## Architecture

```text
React/TanStack frontend
	-> FastAPI backend
	-> Microsoft Foundry published agent
	-> Foundry knowledge base
	-> Azure AI Search
	-> Product documentation
	-> grounded answer and citations
```

The project reuses the existing Foundry project, agent, knowledge base, models, and search index. The application does not create Azure resources or connect directly to Azure AI Search.

## Azure Services

- Microsoft Foundry project and published prompt agent `documindai`
- Foundry knowledge base `documind-kb`
- Azure AI Search index connected to the knowledge base
- Microsoft Entra authentication through `DefaultAzureCredential`
- Azure Blob Storage for document ingestion workflows where configured

## Local Setup

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

Sign in with an Azure credential supported by `DefaultAzureCredential`, such as Azure CLI, before using `/api/chat`. The backend requires the existing Foundry project endpoint and agent name in `backend/.env`.

### Frontend

From the repository root:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

The frontend API base URL is configured with `VITE_API_BASE_URL`, which defaults to `http://127.0.0.1:8001` in `.env.example`.

## Environment Variables

Backend values belong in `backend/.env` and must never be committed:

- `AZURE_FOUNDRY_PROJECT_ENDPOINT`: existing Foundry project endpoint.
- `AZURE_FOUNDRY_AGENT_NAME`: existing published agent name, normally `documindai`.
- `DOCUMIND_ALLOWED_ORIGINS`: comma-separated frontend origins.
- Azure authentication variables, if required by the selected `DefaultAzureCredential` source.

Frontend values belong in the root `.env`:

- `VITE_API_BASE_URL`: local FastAPI base URL.

No Azure credentials, API keys, tokens, or secrets are exposed to the frontend.

## RAG and Citations

`POST /api/chat` accepts a question and optional `conversation_id`. The backend sends the question to the existing Foundry agent using `agent_reference` and preserves `previous_response_id` when available. The response includes `answer`, `conversation_id`, `grounded`, and `citations`. Citation annotations are mapped to the frontend citation type and deduplicated when multiple retrieval chunks belong to the same source.

Questions unsupported by the connected documentation receive a clear no-result response rather than a fabricated answer.

## Example Questions

- What authentication methods does DocuMind Cloud support?
- Which version introduced refresh-token rotation?
- What changed in the v3.2 search API?
- How should a v3.2 deployment be configured?

## Testing

Backend tests:

```powershell
cd backend
pytest
```

Frontend checks:

```powershell
npx tsc --noEmit
npm run build
```

Health checks:

```powershell
Invoke-RestMethod http://127.0.0.1:8001/health
```

The end-to-end test should be run with Azure authentication active and the backend/frontend processes running. Open `http://localhost:8080/assistant` when Vite is using port 8080, or the port printed by `npm run dev`.
