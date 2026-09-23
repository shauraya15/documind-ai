import type { Citation, PipelineItem, ProductDocument, SearchResult } from "@/lib/documind-data";

export type ChatRequest = {
  question: string;
  conversation_id: string | null;
  product: string | null;
  version: string | null;
};

export type ChatResponse = {
  answer: string;
  conversation_id: string;
  grounded: boolean;
  citations: Citation[];
};

export type DocumentListResponse = {
  total: number;
  documents: ProductDocument[];
};

export type SearchResponse = {
  query: string;
  total: number;
  results: SearchResult[];
};

export type KnowledgeStatusResponse = {
  status: "healthy" | "degraded" | "empty";
  coverage: number;
  indexed_documents: number;
  processing_documents: number;
  pipeline: PipelineItem[];
};

export type AnalyticsOverviewResponse = {
  metrics: Array<{ label: string; value: number; detail: string }>;
  topics: Array<{ label: string; value: number; delta: string }>;
  unanswered: string[];
};

export type AuthUser = {
  id: number;
  email: string;
  created_at: string;
};

export type DocumentConfigResponse = {
  configured: boolean;
  missing_variables: string[];
};

const apiBaseUrl = import.meta.env["VITE_API_BASE_URL"] || "http://127.0.0.1:8001";

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null) as { detail?: string } | null;
    throw new Error(errorBody?.detail ?? `API request failed with status ${response.status}.`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function signup(email: string, password: string) {
  return apiRequest<AuthUser>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string) {
  return apiRequest<AuthUser>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function logout() {
  return apiRequest<void>("/api/auth/logout", { method: "POST" });
}

export function getCurrentUser() {
  return apiRequest<AuthUser>("/api/auth/me");
}

export async function askChat(request: ChatRequest): Promise<ChatResponse> {
  return apiRequest<ChatResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function listDocuments() {
  return apiRequest<DocumentListResponse>("/api/documents");
}

export function uploadDocument(file: File) {
  const body = new FormData();
  body.append("file", file);
  return apiRequest<ProductDocument>("/api/documents/upload", { method: "POST", body });
}

export function getDocumentConfig() {
  return apiRequest<DocumentConfigResponse>("/api/documents/config");
}

export function createDocument(request: {
  title: string;
  product: string;
  version: string;
  type: ProductDocument["type"];
  owner?: string;
  summary?: string;
  sections?: string[];
  pages?: number;
}) {
  return apiRequest<ProductDocument>("/api/documents", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function searchDocuments(query: string, product?: string, version?: string) {
  return apiRequest<{ query: string; total: number; results: Array<Omit<SearchResult, "matchedTerms"> & { matched_terms: string[] }> }>("/api/search", {
    method: "POST",
    body: JSON.stringify({ query, product: product || null, version: version || null, limit: 20 }),
  }).then((response) => ({
    query: response.query,
    total: response.total,
    results: response.results.map(({ matched_terms, ...result }) => ({ ...result, matchedTerms: matched_terms })),
  }));
}

export function getKnowledgeStatus() {
  return apiRequest<KnowledgeStatusResponse>("/api/knowledge/status");
}

export function getAnalyticsOverview() {
  return apiRequest<AnalyticsOverviewResponse>("/api/analytics/overview");
}

export type ConversationSummary = {
  id: string;
  title: string;
  created_at: string;
};

export type ConversationListResponse = {
  total: number;
  conversations: ConversationSummary[];
};

export type ConversationMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
};

export type ConversationDetailResponse = {
  id: string;
  title: string;
  question: string;
  answer: string;
  citations: Citation[];
  created_at: string;
  messages: ConversationMessage[];
};

export function listConversations() {
  return apiRequest<ConversationListResponse>("/api/conversations");
}

export function getConversation(conversationId: string) {
  return apiRequest<ConversationDetailResponse>(`/api/conversations/${encodeURIComponent(conversationId)}`);
}
