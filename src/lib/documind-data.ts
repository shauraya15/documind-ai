import {
  Activity,
  Bot,
  FileSearch,
  FolderOpen,
  Gauge,
  Library,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type DocumentType =
  | "Getting Started"
  | "Installation"
  | "Authentication"
  | "API Reference"
  | "Configuration"
  | "Troubleshooting"
  | "FAQ"
  | "Release Notes";

export type DocumentStatus = "Ready" | "Indexing" | "Processing" | "Failed" | "Indexed";

export type ProductDocument = {
  id: string;
  title: string;
  product: string;
  version: string;
  type: DocumentType;
  pages: number;
  status: DocumentStatus;
  updated: string;
  owner: string;
  coverage: number;
  sections: string[];
  summary: string;
};

export type Citation = {
  id: string;
  document: string;
  section: string;
  product: string;
  version: string;
  page: string;
  confidence: number;
  excerpt: string;
};

export type SearchResult = Citation & {
  title: string;
  relevance: number;
  matchedTerms: string[];
};

export type PipelineItem = {
  id: string;
  file: string;
  product: string;
  version: string;
  type: DocumentType;
  stage: "Uploading" | "Processing" | "Extracting content" | "Indexing" | "Ready" | "Failed";
  progress: number;
};

export const navItems: Array<{ label: string; to: string; icon: LucideIcon; primary?: boolean }> = [
  { label: "Dashboard", to: "/", icon: Gauge },
  { label: "Assistant", to: "/assistant", icon: Bot, primary: true },
  { label: "Documents", to: "/documents", icon: Library },
];

export const documents: ProductDocument[] = [
  {
    id: "doc-auth-31",
    title: "Authentication and OAuth Configuration",
    product: "Atlas API",
    version: "3.1",
    type: "Authentication",
    pages: 42,
    status: "Ready",
    updated: "Today, 09:18",
    owner: "Platform Docs",
    coverage: 97,
    sections: ["OAuth setup", "Token exchange", "Refresh policy", "AUTH-401 errors"],
    summary:
      "Explains OAuth client setup, callback URLs, token scopes, refresh handling, and common authentication failures.",
  },
  {
    id: "doc-auth-32",
    title: "Authentication and OAuth Configuration",
    product: "Atlas API",
    version: "3.2",
    type: "Authentication",
    pages: 48,
    status: "Ready",
    updated: "Yesterday, 16:40",
    owner: "Identity Team",
    coverage: 94,
    sections: ["PKCE defaults", "Rotating credentials", "Service accounts", "Migration notes"],
    summary:
      "Version 3.2 adds PKCE defaults, stricter redirect validation, and updated examples for service accounts.",
  },
  {
    id: "doc-install",
    title: "Cloud Relay Installation Guide",
    product: "Relay Cloud",
    version: "2.8",
    type: "Installation",
    pages: 64,
    status: "Indexing",
    updated: "Today, 07:52",
    owner: "Solutions Engineering",
    coverage: 71,
    sections: ["Prerequisites", "Network policy", "Container install", "Verification"],
    summary: "Deployment requirements and step-by-step installation instructions for private cloud environments.",
  },
  {
    id: "doc-api",
    title: "Atlas API Reference",
    product: "Atlas API",
    version: "3.2",
    type: "API Reference",
    pages: 318,
    status: "Ready",
    updated: "Sep 19, 2026",
    owner: "Developer Experience",
    coverage: 99,
    sections: ["Endpoints", "Error model", "Rate limits", "Webhooks"],
    summary: "Canonical REST endpoint reference with schemas, examples, pagination, and webhook contracts.",
  },
  {
    id: "doc-config",
    title: "Enterprise Configuration Guide",
    product: "Control Plane",
    version: "5.4",
    type: "Configuration",
    pages: 126,
    status: "Ready",
    updated: "Sep 18, 2026",
    owner: "Product Operations",
    coverage: 92,
    sections: ["Tenant policy", "Audit retention", "Regional routing", "Feature flags"],
    summary: "Administrative configuration for enterprise tenants, compliance retention, regions, and policy inheritance.",
  },
  {
    id: "doc-trouble",
    title: "Troubleshooting: Connectivity and Auth Errors",
    product: "Relay Cloud",
    version: "2.8",
    type: "Troubleshooting",
    pages: 58,
    status: "Ready",
    updated: "Sep 17, 2026",
    owner: "Customer Reliability",
    coverage: 89,
    sections: ["AUTH-401", "TLS handshake", "Proxy timeouts", "DNS checks"],
    summary: "Diagnostic playbooks for authentication, transport, proxy, and routing issues seen in production.",
  },
  {
    id: "doc-faq",
    title: "Administrator FAQ",
    product: "Control Plane",
    version: "5.4",
    type: "FAQ",
    pages: 27,
    status: "Processing",
    updated: "Today, 11:06",
    owner: "Support Enablement",
    coverage: 54,
    sections: ["Permissions", "Billing exports", "SSO", "Data residency"],
    summary: "Answers recurring administrator questions across account setup, access controls, and compliance workflows.",
  },
  {
    id: "doc-release",
    title: "Release Notes 3.2",
    product: "Atlas API",
    version: "3.2",
    type: "Release Notes",
    pages: 19,
    status: "Ready",
    updated: "Sep 16, 2026",
    owner: "Release Management",
    coverage: 96,
    sections: ["Breaking changes", "Authentication", "SDK updates", "Known issues"],
    summary: "Highlights changes between 3.1 and 3.2, including auth defaults, SDK updates, and deprecations.",
  },
  {
    id: "doc-start",
    title: "Getting Started with Atlas Workflows",
    product: "Atlas API",
    version: "3.2",
    type: "Getting Started",
    pages: 36,
    status: "Ready",
    updated: "Sep 15, 2026",
    owner: "Developer Experience",
    coverage: 93,
    sections: ["First request", "Project setup", "API keys", "Sandbox data"],
    summary: "A concise walkthrough for developers connecting to Atlas workflows for the first time.",
  },
  {
    id: "doc-failed",
    title: "Legacy Connector Manual",
    product: "Relay Cloud",
    version: "2.4",
    type: "Configuration",
    pages: 84,
    status: "Failed",
    updated: "Sep 13, 2026",
    owner: "Migration Team",
    coverage: 12,
    sections: ["Connector setup", "Legacy auth", "Migration map"],
    summary: "Older connector content requiring repair before it can be safely included in assistant answers.",
  },
];

export const citations: Citation[] = [
  {
    id: "cite-oauth",
    document: "Authentication and OAuth Configuration",
    section: "OAuth setup > Redirect URI validation",
    product: "Atlas API",
    version: "3.2",
    page: "p. 14",
    confidence: 96,
    excerpt:
      "OAuth clients must include an exact redirect URI match. Version 3.2 rejects wildcard hostnames and requires PKCE for browser-based flows.",
  },
  {
    id: "cite-auth401",
    document: "Troubleshooting: Connectivity and Auth Errors",
    section: "AUTH-401 diagnostic sequence",
    product: "Relay Cloud",
    version: "2.8",
    page: "section 4.2",
    confidence: 91,
    excerpt:
      "If AUTH-401 appears after a successful token request, compare the requested audience with the resource server identifier and confirm clock drift is under 60 seconds.",
  },
  {
    id: "cite-release",
    document: "Release Notes 3.2",
    section: "Breaking changes > Authentication",
    product: "Atlas API",
    version: "3.2",
    page: "p. 3",
    confidence: 88,
    excerpt:
      "The 3.2 release changes the default token lifetime to 30 minutes and enables PKCE by default for public clients.",
  },
];

export const searchResults: SearchResult[] = [
  {
    id: "cite-oauth",
    document: "Authentication and OAuth Configuration",
    section: "OAuth setup > Redirect URI validation",
    product: "Atlas API",
    version: "3.2",
    page: "p. 14",
    confidence: 96,
    excerpt:
      "OAuth clients must include an exact redirect URI match. Version 3.2 rejects wildcard hostnames and requires PKCE for browser-based flows.",
    title: "OAuth redirect validation now requires exact matches",
    relevance: 98,
    matchedTerms: ["OAuth", "redirect URI", "PKCE"],
  },
  {
    id: "cite-auth401",
    document: "Troubleshooting: Connectivity and Auth Errors",
    section: "AUTH-401 diagnostic sequence",
    product: "Relay Cloud",
    version: "2.8",
    page: "section 4.2",
    confidence: 91,
    excerpt:
      "If AUTH-401 appears after a successful token request, compare the requested audience with the resource server identifier and confirm clock drift is under 60 seconds.",
    title: "AUTH-401 after token exchange",
    relevance: 92,
    matchedTerms: ["AUTH-401", "audience", "clock drift"],
  },
  {
    id: "cite-release",
    document: "Release Notes 3.2",
    section: "Breaking changes > Authentication",
    product: "Atlas API",
    version: "3.2",
    page: "p. 3",
    confidence: 88,
    excerpt:
      "The 3.2 release changes the default token lifetime to 30 minutes and enables PKCE by default for public clients.",
    title: "Version 3.2 authentication changes",
    relevance: 87,
    matchedTerms: ["3.2", "token lifetime", "public clients"],
  },
];

export const agentSteps = [
  {
    title: "Understanding request",
    detail: "Detected an authentication configuration question and scoped it to Atlas API 3.2 unless another version is selected.",
  },
  {
    title: "Searching documentation",
    detail: "Matched OAuth setup, troubleshooting AUTH-401, and release-note sections with high semantic overlap.",
  },
  {
    title: "Checking relevant version",
    detail: "Prioritized version 3.2 sources, then compared against 3.1 where the behavior changed.",
  },
  {
    title: "Comparing sources",
    detail: "Resolved a conflict: release notes mention shorter token lifetime, while the auth guide includes the implementation details.",
  },
  {
    title: "Generating answer",
    detail: "Composed an operator-ready response with citations and a short validation checklist.",
  },
];

export const suggestedQuestions = [
  "How do I configure OAuth authentication?",
  "Why am I getting AUTH-401?",
  "What changed between version 3.1 and 3.2?",
  "How do I configure the API?",
];

export const conversations = [
  { id: "conv-1", title: "OAuth rollout checklist", meta: "6 messages · Atlas API 3.2" },
  { id: "conv-2", title: "AUTH-401 in Relay Cloud", meta: "4 messages · Relay Cloud 2.8" },
  { id: "conv-3", title: "3.1 to 3.2 comparison", meta: "8 messages · Release review" },
];

export const pipelineItems: PipelineItem[] = [
  {
    id: "pipe-1",
    file: "administrator-faq-control-plane-5-4.pdf",
    product: "Control Plane",
    version: "5.4",
    type: "FAQ",
    stage: "Extracting content",
    progress: 62,
  },
  {
    id: "pipe-2",
    file: "relay-cloud-installation-guide-2-8.pdf",
    product: "Relay Cloud",
    version: "2.8",
    type: "Installation",
    stage: "Indexing",
    progress: 81,
  },
  {
    id: "pipe-3",
    file: "legacy-connector-manual.docx",
    product: "Relay Cloud",
    version: "2.4",
    type: "Configuration",
    stage: "Failed",
    progress: 18,
  },
];

export const recentActivity = [
  { icon: ShieldCheck, title: "Atlas API 3.2 authentication sources verified", time: "12 min ago" },
  { icon: FileSearch, title: "42 searches referenced the OAuth setup guide", time: "38 min ago" },
  { icon: FolderOpen, title: "Release Notes 3.2 added to ready index", time: "1 hr ago" },
  { icon: Activity, title: "Knowledge coverage improved from 91% to 94%", time: "2 hrs ago" },
];

export const analyticsRows = [
  { label: "OAuth configuration", value: 184, delta: "+18%" },
  { label: "AUTH-401 troubleshooting", value: 141, delta: "+9%" },
  { label: "Version migration", value: 96, delta: "+22%" },
  { label: "API rate limits", value: 73, delta: "-3%" },
];
