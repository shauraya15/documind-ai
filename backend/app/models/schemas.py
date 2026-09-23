from typing import Literal

from pydantic import BaseModel, Field, field_validator


DocumentStatus = Literal["Ready", "Indexing", "Processing", "Failed", "Indexed"]
DocumentType = Literal[
    "Getting Started",
    "Installation",
    "Authentication",
    "API Reference",
    "Configuration",
    "Troubleshooting",
    "FAQ",
    "Release Notes",
]
PipelineStage = Literal[
    "Uploading",
    "Processing",
    "Extracting content",
    "Indexing",
    "Ready",
    "Failed",
]


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: str
    environment: str


class AuthCredentials(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=8, max_length=256)


class UserResponse(BaseModel):
    id: int
    email: str
    created_at: str


class Citation(BaseModel):
    id: str
    document: str
    section: str
    product: str
    version: str
    page: str
    confidence: int = Field(ge=0, le=100)
    excerpt: str


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4000)
    conversation_id: str | None = None
    product: str | None = None
    version: str | None = None

    @field_validator("question")
    @classmethod
    def question_must_not_be_blank(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("question must not be blank")
        return normalized


class ChatResponse(BaseModel):
    answer: str
    conversation_id: str
    grounded: bool
    citations: list[Citation] = Field(default_factory=list)


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=4000)
    product: str | None = None
    version: str | None = None
    limit: int = Field(default=10, ge=1, le=50)


class SearchResult(Citation):
    title: str
    relevance: int = Field(ge=0, le=100)
    matched_terms: list[str] = Field(default_factory=list)


class SearchResponse(BaseModel):
    query: str
    total: int
    results: list[SearchResult] = Field(default_factory=list)


class Document(BaseModel):
    id: str
    title: str
    product: str
    version: str
    type: DocumentType
    pages: int = Field(ge=0)
    status: DocumentStatus
    updated: str
    owner: str
    coverage: int = Field(ge=0, le=100)
    sections: list[str] = Field(default_factory=list)
    summary: str


class DocumentCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    product: str = Field(min_length=1, max_length=120)
    version: str = Field(min_length=1, max_length=40)
    type: DocumentType
    owner: str = Field(default="Local ingestion", max_length=120)
    summary: str = Field(default="", max_length=2000)
    sections: list[str] = Field(default_factory=list)
    pages: int = Field(default=0, ge=0)


class DocumentListResponse(BaseModel):
    total: int
    documents: list[Document] = Field(default_factory=list)


class PipelineItem(BaseModel):
    id: str
    file: str
    product: str
    version: str
    type: DocumentType
    stage: PipelineStage
    progress: int = Field(ge=0, le=100)


class KnowledgeStatusResponse(BaseModel):
    status: Literal["healthy", "degraded", "empty"]
    coverage: int = Field(ge=0, le=100)
    indexed_documents: int = Field(ge=0)
    processing_documents: int = Field(ge=0)
    pipeline: list[PipelineItem] = Field(default_factory=list)


class AnalyticsMetric(BaseModel):
    label: str
    value: int | float
    detail: str


class AnalyticsTopic(BaseModel):
    label: str
    value: int
    delta: str


class AnalyticsOverviewResponse(BaseModel):
    metrics: list[AnalyticsMetric] = Field(default_factory=list)
    topics: list[AnalyticsTopic] = Field(default_factory=list)
    unanswered: list[str] = Field(default_factory=list)


class ConversationSummary(BaseModel):
    id: str
    title: str
    created_at: str


class ConversationListResponse(BaseModel):
    total: int
    conversations: list[ConversationSummary] = Field(default_factory=list)


class ConversationMessage(BaseModel):
    id: str
    role: Literal["user", "assistant"]
    content: str
    citations: list[Citation] = Field(default_factory=list)


class ConversationDetailResponse(BaseModel):
    id: str
    title: str
    question: str
    answer: str
    citations: list[Citation] = Field(default_factory=list)
    created_at: str
    messages: list[ConversationMessage] = Field(default_factory=list)
