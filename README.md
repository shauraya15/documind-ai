# DocuMind AI

> AI-powered Product Documentation Assistant built with React, FastAPI, Microsoft Azure AI Search, and Microsoft Foundry.

DocuMind AI is an intelligent documentation assistant designed to help users search, understand, and interact with product documentation through a conversational AI interface.

Instead of manually searching through large documentation sets, users can ask questions in natural language and receive grounded answers with document citations.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Key Features](#2-key-features)
3. [System Architecture](#3-system-architecture)
4. [RAG Workflow](#4-rag-workflow)
5. [Technology Stack](#5-technology-stack)
6. [Project Structure](#6-project-structure)
7. [Backend API](#7-backend-api)
8. [Environment Variables](#8-environment-variables)
9. [Local Development](#9-local-development)
10. [Verification](#10-verification)
11. [Azure Deployment](#11-azure-deployment)
12. [Security Considerations](#12-security-considerations)
13. [Azure Services Used](#13-azure-services-used)
14. [Frontend-to-Backend Communication](#14-frontend-to-backend-communication)
15. [Design Principles](#15-design-principles)
16. [Current Project Status](#16-current-project-status)
17. [Project Goals](#17-project-goals)
18. [Future Improvements](#18-future-improvements)
19. [Evaluation Approach](#19-evaluation-approach)
20. [Example Use Case](#20-example-use-case)
21. [Repository](#21-repository)
22. [License](#22-license)
23. [Author](#23-author)
24. [Summary](#24-summary)

---

## 1. Project Overview

Product documentation can contain hundreds of pages covering multiple products, versions, configurations, troubleshooting procedures, and technical concepts.

Traditional keyword-based searching can make it difficult to quickly locate the exact information required.

**DocuMind AI** addresses this problem using a Retrieval-Augmented Generation (RAG) architecture.

The system:

1. Accepts product documentation.
2. Stores and indexes documentation using Azure services.
3. Retrieves relevant documentation based on the user's question.
4. Uses Microsoft Foundry to generate an AI response.
5. Grounds responses in retrieved documentation.
6. Displays citations so users can trace the answer back to its source.
7. Maintains conversations for continued interaction.
8. Provides authentication, document management, search, knowledge status, and analytics functionality.

---

## 2. Key Features

### AI Documentation Assistant

Users can ask natural-language questions about product documentation, e.g.:

> "How do I configure authentication for Product X?"

The system retrieves relevant documentation and generates a grounded response.

### Retrieval-Augmented Generation

DocuMind combines document retrieval with generative AI. The retrieval layer provides relevant documentation to the AI model before response generation, reducing reliance on unsupported model knowledge.

### Source Citations

Responses can include citations to the documents used to generate the answer, providing traceability and allowing users to verify the information.

### Product and Version Context

Questions can optionally be scoped using:

- Product
- Product version

This allows the retrieval process to focus on relevant documentation.

### Document Management

The backend supports:

- Listing documents
- Uploading documents
- Creating document metadata
- Checking document configuration
- Tracking document processing

### Authentication

The application includes backend authentication functionality:

- Signup
- Login
- Logout
- Current-user retrieval
- Secure authentication cookies

### Conversation Management

Users can:

- Create conversations through chat interaction
- List previous conversations
- Open individual conversations
- Continue contextual discussions

### Documentation Search

The application provides a dedicated search API for querying indexed documentation.

### Knowledge Status

The system exposes knowledge-base health information including:

- Indexed documents
- Processing documents
- Coverage
- Pipeline status

### Analytics

The backend provides an analytics overview containing:

- Metrics
- Popular topics
- Topic changes
- Unanswered questions

---

## 3. System Architecture

```
                         ┌──────────────────────────┐
                         │           User            │
                         │  Natural Language Query   │
                         └────────────┬──────────────┘
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │      React Frontend       │
                         │                            │
                         │ React 19                  │
                         │ TanStack Start             │
                         │ TanStack Router            │
                         │ Vite                       │
                         └────────────┬──────────────┘
                                      │
                                      │ REST API
                                      ▼
                         ┌──────────────────────────┐
                         │      FastAPI Backend      │
                         │                            │
                         │ Authentication             │
                         │ Chat                       │
                         │ Documents                  │
                         │ Search                     │
                         │ Conversations              │
                         │ Analytics                  │
                         └────────────┬──────────────┘
                                      │
                     ┌────────────────┼─────────────────┐
                     │                │                 │
                     ▼                ▼                 ▼
          ┌─────────────────┐ ┌───────────────┐ ┌─────────────────┐
          │ Azure AI Search │ │   Microsoft   │ │ Azure Blob      │
          │                 │ │    Foundry    │ │ Storage         │
          │ Document Index  │ │   AI Agent    │ │ Product Docs    │
          │ Retrieval       │ │               │ │                 │
          └────────┬────────┘ └───────┬───────┘ └─────────────────┘
                   │                  │
                   └──────────┬───────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │ Grounded AI Response │
                   │ + Citations          │
                   └──────────────────────┘
```

---

## 4. RAG Workflow

The core AI workflow follows a Retrieval-Augmented Generation architecture:

```
User Question
      │
      ▼
Question Processing
      │
      ▼
Azure AI Search
      │
      ▼
Relevant Documentation
      │
      ▼
Retrieved Context
      │
      ▼
Microsoft Foundry Agent
      │
      ▼
Grounded Answer
      │
      ▼
Answer + Citations
      │
      ▼
React UI
```

### Why RAG?

A documentation assistant should primarily answer using the organization's documentation rather than relying only on general-purpose model knowledge.

RAG separates the problem into two stages:

- **Retrieval** — Find relevant information from the documentation knowledge base.
- **Generation** — Use the retrieved information to generate a natural-language answer.

This architecture improves traceability and makes the system suitable for technical documentation use cases.

---

## 5. Technology Stack

### Frontend

- React 19
- TanStack Start
- TanStack Router
- Vite
- TypeScript
- React Query
- Tailwind CSS
- Radix UI
- Lucide React

### Backend

- Python
- FastAPI
- Uvicorn
- Pydantic
- Python Multipart

### Microsoft Azure

- Microsoft Foundry
- Azure AI Search
- Azure Blob Storage
- Azure App Service
- Azure Identity

### Development Tools

- VS Code
- Git
- GitHub
- npm
- Python virtual environment

---

## 6. Project Structure

```
documind-ai/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes.py
│   │   │   └── __init__.py
│   │   │
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── __init__.py
│   │   │
│   │   ├── integrations/
│   │   │   ├── azure_search.py
│   │   │   ├── document_ingestion.py
│   │   │   ├── foundry.py
│   │   │   └── __init__.py
│   │   │
│   │   ├── models/
│   │   │   ├── schemas.py
│   │   │   └── __init__.py
│   │   │
│   │   ├── services/
│   │   │   ├── analytics.py
│   │   │   ├── auth.py
│   │   │   ├── chat.py
│   │   │   ├── conversations.py
│   │   │   ├── documents.py
│   │   │   ├── health.py
│   │   │   ├── knowledge.py
│   │   │   ├── scope.py
│   │   │   ├── search.py
│   │   │   └── __init__.py
│   │   │
│   │   ├── main.py
│   │   └── __init__.py
│   │
│   └── requirements.txt
│
├── src/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   │   ├── api.ts
│   │   └── documind-data.ts
│   ├── routes/
│   ├── router.tsx
│   ├── routeTree.gen.ts
│   ├── server.ts
│   ├── start.ts
│   └── styles.css
│
├── public/
├── docs/
├── scripts/
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 7. Backend API

The FastAPI backend exposes REST endpoints for the application.

### Health

```
GET /health
```

Returns the current API health status.

```json
{
  "status": "ok",
  "service": "DocuMind API",
  "environment": "local"
}
```

### Authentication

```
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Chat

```
POST /api/chat
```

Example request:

```json
{
  "question": "How do I configure authentication?",
  "conversation_id": null,
  "product": "Product X",
  "version": "2.0"
}
```

Example response:

```json
{
  "answer": "The authentication configuration requires...",
  "conversation_id": "conversation-id",
  "grounded": true,
  "citations": []
}
```

### Documents

```
GET  /api/documents
POST /api/documents
POST /api/documents/upload
GET  /api/documents/config
```

### Search

```
POST /api/search
```

Searches the documentation knowledge base.

### Knowledge Status

```
GET /api/knowledge/status
```

Returns the current state of the documentation knowledge pipeline.

### Analytics

```
GET /api/analytics/overview
```

Returns analytics information for the application.

### Conversations

```
GET /api/conversations
GET /api/conversations/{conversation_id}
```

---

## 8. Environment Variables

Secrets and environment-specific configuration are intentionally excluded from Git. Create a local environment file using `.env.example`.

### Frontend

```env
VITE_API_BASE_URL=http://127.0.0.1:8001
```

For production, this should point to the deployed backend, e.g.:

```env
VITE_API_BASE_URL=https://<your-backend-domain>
```

### Backend

```env
DOCUMIND_APP_NAME=DocuMind API
DOCUMIND_ENVIRONMENT=local

DOCUMIND_ALLOWED_ORIGINS=http://localhost:5173

AZURE_FOUNDRY_PROJECT_ENDPOINT=
AZURE_FOUNDRY_AGENT_NAME=documindai
AZURE_FOUNDRY_AGENT_ID=

AZURE_SEARCH_ENDPOINT=
AZURE_SEARCH_ADMIN_KEY=
AZURE_SEARCH_INDEX_NAME=
AZURE_SEARCH_INDEXER_NAME=

AZURE_STORAGE_CONNECTION_STRING=
AZURE_STORAGE_CONTAINER_NAME=product-docs

DOCUMIND_AUTH_DATABASE_PATH=
DOCUMIND_AUTH_COOKIE_SECURE=false
```

> **Never commit real Azure keys, passwords, connection strings, or other credentials.**

---

## 9. Local Development

### Prerequisites

Install:

- Node.js
- npm
- Python 3.12+
- Git
- Azure CLI

### Clone the repository

```bash
git clone https://github.com/shauraya15/documind-ai.git
cd documind-ai
```

### Frontend Installation

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

The frontend will normally be available at:

```
http://localhost:5173
```

### Backend Setup

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install backend dependencies:

```bash
pip install -r backend\requirements.txt
```

Start FastAPI:

```bash
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8001 --reload
```

Backend health endpoint:

```
http://127.0.0.1:8001/health
```

---

## 10. Verification

### Backend Health Check

PowerShell:

```powershell
Invoke-WebRequest http://localhost:8000/health -UseBasicParsing
```

Expected response:

```json
{
  "status": "ok",
  "service": "DocuMind API",
  "environment": "local"
}
```

### Frontend Lint

```bash
npm run lint
```

### Production Build

```bash
npm run build
```

A successful build indicates that the frontend can be compiled for production deployment.

---

## 11. Azure Deployment

The backend is designed to run on Azure App Service.

Current deployment architecture:

```
Internet
   │
   ▼
Azure App Service
   │
   └── FastAPI + Uvicorn
          │
          ├── Microsoft Foundry
          ├── Azure AI Search
          └── Azure Blob Storage
```

The application can be configured using Azure App Service Application Settings rather than storing production secrets inside the repository.

---

## 12. Security Considerations

The project follows several basic security practices:

- Secrets are stored through environment variables.
- `.env` files are excluded from Git.
- Azure credentials are not stored in source code.
- Production authentication cookies can use the Secure flag.
- CORS origins are configurable.
- Local authentication data is excluded from version control.
- Azure service credentials are configured outside the source repository.

### Important

Never commit values such as:

- `AZURE_SEARCH_ADMIN_KEY`
- `AZURE_STORAGE_CONNECTION_STRING`
- client secrets
- API keys
- passwords
- tokens

to GitHub.

---

## 13. Azure Services Used

### Microsoft Foundry

Microsoft Foundry provides the AI layer used by DocuMind. The project uses a Foundry agent to process documentation-related questions and generate responses.

### Azure AI Search

Azure AI Search provides the document retrieval layer. The service is responsible for searching the indexed documentation and returning relevant results for the RAG pipeline.

### Azure Blob Storage

Blob Storage provides cloud storage for product documentation. The configured container is:

```
product-docs
```

### Azure App Service

Azure App Service hosts the FastAPI backend, which runs using:

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## 14. Frontend-to-Backend Communication

The frontend API client is located at:

```
src/lib/api.ts
```

The API base URL is controlled through:

```
VITE_API_BASE_URL
```

The frontend communicates with the FastAPI backend through REST APIs. For example:

```ts
export async function askChat(request: ChatRequest): Promise<ChatResponse> {
  return apiRequest<ChatResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify(request),
  });
}
```

This keeps frontend API communication centralized instead of scattering API calls throughout UI components.

---

## 15. Design Principles

### Grounded Responses

The assistant is designed to use retrieved documentation as the primary context for answering documentation questions.

### Traceability

Citations are returned with AI responses where available.

### Separation of Concerns

The application separates:

- UI
- API communication
- Backend routes
- Business services
- Azure integrations
- Data models
- Configuration

### Cloud-Ready Architecture

The application is structured so that the local development environment and Azure deployment environment can use the same backend architecture with environment-specific configuration.

---

## 16. Current Project Status

### Frontend

- [x] React application implemented
- [x] TanStack Start configured
- [x] TanStack Router configured
- [x] Chat interface implemented
- [x] API client implemented
- [x] Authentication UI integrated
- [x] Document management UI implemented
- [x] Search functionality integrated
- [x] Conversation functionality integrated

### Backend

- [x] FastAPI application implemented
- [x] Health endpoint implemented
- [x] Authentication routes implemented
- [x] Chat API implemented
- [x] Document APIs implemented
- [x] Search API implemented
- [x] Conversation APIs implemented
- [x] Knowledge status API implemented
- [x] Analytics API implemented
- [x] Azure integration modules implemented

### Cloud

- [x] Azure resource group configured
- [x] Azure App Service configured
- [x] Azure AI Search configured
- [x] Azure Blob Storage configured
- [x] Microsoft Foundry integration configured

---

## 17. Project Goals

DocuMind AI is intended to demonstrate how modern AI application architecture can combine:

- Generative AI
- Retrieval-Augmented Generation
- AI agents
- Enterprise search
- Cloud storage
- REST APIs
- Full-stack application development
- Authentication
- Conversation management
- Observability and knowledge-base status

The primary goal is to create a practical AI assistant for technical product documentation rather than a standalone chatbot.

---

## 18. Future Improvements

Potential future improvements include:

- Improved document ingestion pipelines
- More advanced retrieval and reranking
- Hybrid keyword + vector retrieval
- Better citation visualization
- Role-based access control
- Multi-tenant documentation spaces
- Automated document version management
- Improved evaluation datasets
- RAG evaluation metrics
- Response quality monitoring
- Feedback-based retrieval improvements
- Production-grade persistent database
- Automated CI/CD deployment
- Application monitoring and telemetry

---

## 19. Evaluation Approach

The system can be evaluated using documentation-focused test questions across the following dimensions:

| Dimension | Description |
|---|---|
| **Retrieval Accuracy** | Does the system retrieve the relevant documentation? |
| **Groundedness** | Is the generated response supported by the retrieved documentation? |
| **Citation Accuracy** | Do the cited documents actually support the answer? |
| **Answer Relevance** | Does the response directly address the user's question? |
| **Failure Handling** | Does the assistant appropriately handle questions for which the documentation does not contain sufficient information? |

---

## 20. Example Use Case

A technical support engineer needs to understand how a product feature works. Instead of manually searching multiple documentation pages:

```
User
  │
  │ "How do I configure feature X?"
  ▼
DocuMind AI
  │
  ▼
Azure AI Search
  │
  ▼
Relevant Documentation
  │
  ▼
Microsoft Foundry Agent
  │
  ▼
Grounded Response
  │
  ├── Explanation
  ├── Relevant configuration details
  └── Source citations
```

This reduces the amount of manual documentation searching required and provides a conversational interface for technical knowledge retrieval.

---

## 21. Repository

GitHub: [github.com/shauraya15/documind-ai](https://github.com/shauraya15/documind-ai)

---

## 22. License

This project is developed as an academic and portfolio project. License terms can be added if the project is later released for public redistribution.

---

## 23. Author

**Shauraya Vohra**
Computer Science Engineering — Artificial Intelligence & Machine Learning
Chitkara University

---

## 24. Summary

DocuMind AI is a full-stack AI-powered product documentation assistant that combines a modern React frontend with a FastAPI backend and Microsoft Azure AI services.

The system uses Retrieval-Augmented Generation to retrieve relevant documentation before generating responses, while citations provide traceability back to the underlying knowledge base.

The architecture is designed around practical enterprise AI concepts including:

- RAG
- AI Agents
- Azure AI Search
- Microsoft Foundry
- Azure Blob Storage
- FastAPI
- React
- Authentication
- Document management
- Conversational AI
- Cloud deployment
