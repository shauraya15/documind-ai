import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  FileSearch,
  FileText,
  FolderOpen,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/documind/app-shell";
import { Metric } from "@/components/documind/metric";
import { PageHeading } from "@/components/documind/page-heading";
import { StatusPill } from "@/components/documind/status-pill";
import {
  getKnowledgeStatus,
  listConversations,
  listDocuments,
  type ConversationSummary,
} from "@/lib/api";
import { type ProductDocument } from "@/lib/documind-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DocuMind Dashboard — Documentation Knowledge Overview" },
      {
        name: "description",
        content:
          "Monitor DocuMind documentation coverage, indexing health, recent questions, and knowledge-base activity.",
      },
      { property: "og:title", content: "DocuMind Dashboard" },
      {
        property: "og:description",
        content:
          "A clean overview of documentation knowledge health and recent product-doc activity.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function formatFriendlyDate(raw: string): string {
  try {
    const date = new Date(raw);
    if (isNaN(date.getTime())) return raw;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return raw;
  }
}

function formatTimeAgo(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  } catch {
    return "";
  }
}

function getCleanProduct(doc: ProductDocument): string {
  if (doc.product === "Uploaded documentation") {
    return doc.title.replace(/^[0-9]+[.\-_ ]*/, "").replace(/\.[^/.]+$/, "") || "Documentation";
  }
  return doc.product;
}

function DashboardPage() {
  const [documents, setDocuments] = useState<ProductDocument[]>([]);
  const [knowledge, setKnowledge] = useState<{
    coverage: number;
    indexed_documents: number;
    status: string;
  }>();
  const [recentConversations, setRecentConversations] = useState<ConversationSummary[]>([]);
  const [questionCount, setQuestionCount] = useState<number | null>(null);

  const fetchAll = useCallback(() => {
    void Promise.all([listDocuments(), getKnowledgeStatus(), listConversations()])
      .then(([docRes, knowledgeRes, convRes]) => {
        setDocuments(docRes.documents);
        setKnowledge(knowledgeRes);
        setQuestionCount(convRes.total);
        setRecentConversations(convRes.conversations || []);
      })
      .catch(() => {});
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Re-fetch when the tab regains focus (user switched away and came back)
  useEffect(() => {
    const onFocus = () => fetchAll();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchAll]);

  // Poll every 10 s while the page is visible so status updates after uploads
  useEffect(() => {
    const id = window.setInterval(() => {
      if (!document.hidden) fetchAll();
    }, 10_000);
    return () => window.clearInterval(id);
  }, [fetchAll]);

  // Coverage detail label
  const coverageDetail = (() => {
    if (!knowledge) return "Loading…";
    const { coverage, indexed_documents } = knowledge;
    if (indexed_documents > 0 && coverage === 0) return "Coverage unavailable";
    if (indexed_documents === 0) return "No indexed documents yet";
    return `${coverage}% knowledge coverage`;
  })();

  const questionValue = questionCount === null ? "…" : String(questionCount);
  const questionDetail =
    questionCount === null
      ? "Loading…"
      : questionCount === 0
        ? "No questions asked yet."
        : `${questionCount} question${questionCount !== 1 ? "s" : ""} asked across all conversations.`;

  // Real live activity derived from documents and conversations
  const liveActivities: Array<{ icon: typeof FolderOpen; title: string; time: string }> = [];

  for (const doc of documents.slice(0, 3)) {
    liveActivities.push({
      icon: FolderOpen,
      title: `${doc.title} ${doc.status === "Indexed" ? "indexed in knowledge base" : "added to catalog"}`,
      time: formatTimeAgo(doc.updated),
    });
  }

  for (const conv of recentConversations.slice(0, 3)) {
    liveActivities.push({
      icon: FileSearch,
      title: `"${conv.title}" answered by assistant`,
      time: formatTimeAgo(conv.created_at),
    });
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeading
          eyebrow="Knowledge overview"
          title="Documentation intelligence"
          description="Track coverage, indexing health, recent questions, and the sources behind DocuMind answers."
          actions={
            <Button asChild>
              <Link to="/assistant">
                Open Assistant
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          }
        />

        <section className="grid gap-4 md:grid-cols-3">
          <Metric
            label="Documents"
            value={String(documents.length)}
            detail="Documents currently registered with the backend."
            icon={FileText}
          />
          <Metric
            label="Indexed documents"
            value={String(knowledge?.indexed_documents ?? 0)}
            detail={coverageDetail}
            icon={CheckCircle2}
          />
          <Metric
            label="Questions asked"
            value={questionValue}
            detail={questionDetail}
            icon={Bot}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  Knowledge base status
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Live document and indexing status from the backend.
                </p>
              </div>
              <StatusPill status={knowledge?.status === "healthy" ? "Healthy" : "Needs review"} />
            </div>
            <div className="mt-6 space-y-4">
              {documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No documents indexed yet. Upload a document to get started.
                </p>
              ) : (
                documents.slice(0, 5).map((document) => {
                  const productClean = getCleanProduct(document);
                  const versionClean = document.version === "Latest" ? "1.0" : document.version;
                  return (
                    <div
                      key={document.id}
                      className="grid gap-3 rounded-lg border border-border bg-surface-soft p-4 md:grid-cols-[1fr_auto] md:items-center"
                    >
                      <div>
                        <p className="font-medium text-foreground">{document.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {productClean} · v{versionClean} · {document.type}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {document.coverage > 0 ? (
                          <span className="text-sm font-medium text-muted-foreground">
                            {document.coverage}%
                          </span>
                        ) : (
                          <span className="text-sm font-medium text-muted-foreground">—</span>
                        )}
                        <StatusPill status={document.status} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Recent questions from the backend */}
            <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  Recent questions
                </h2>
                <Link to="/assistant" className="text-xs font-medium text-primary hover:underline">
                  View all in Assistant →
                </Link>
              </div>
              <div className="mt-5 space-y-3">
                {questionCount === null ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : recentConversations.length === 0 ? (
                  <div className="flex items-start gap-3 rounded-lg bg-surface-soft p-3">
                    <Search className="mt-0.5 size-4 text-muted-foreground" />
                    <p className="text-sm leading-6 text-muted-foreground">
                      No questions asked yet. Open the assistant to start a conversation.
                    </p>
                  </div>
                ) : (
                  recentConversations.slice(0, 3).map((conv) => (
                    <Link
                      key={conv.id}
                      to="/assistant"
                      className="flex items-start justify-between gap-3 rounded-lg bg-surface-soft p-3 transition-colors hover:bg-brand-soft/40"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <Search className="mt-1 size-3.5 shrink-0 text-primary" />
                        <span className="truncate text-sm text-foreground">{conv.title}</span>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatTimeAgo(conv.created_at)}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Real Documentation activity */}
            <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Documentation activity
              </h2>
              <div className="mt-5 space-y-4">
                {liveActivities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent activity recorded yet.</p>
                ) : (
                  liveActivities.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div key={`${item.title}-${idx}`} className="flex gap-3">
                        <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-soft text-primary">
                          <Icon className="size-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{item.time}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Recently added documents
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                New and updated sources moving into the knowledge system.
              </p>
            </div>
            <ShieldCheck className="size-5 text-primary" />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground col-span-3">
                No documents have been added yet.
              </p>
            ) : (
              documents.slice(0, 3).map((document) => {
                const productClean = getCleanProduct(document);
                const versionClean = document.version === "Latest" ? "1.0" : document.version;
                return (
                  <div
                    key={document.id}
                    className="rounded-lg border border-border bg-surface-soft p-4"
                  >
                    <StatusPill status={document.status} />
                    <p className="mt-4 font-semibold text-foreground">{document.title}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {productClean} · v{versionClean}
                    </p>
                    <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock3 className="size-3.5" />
                      {formatFriendlyDate(document.updated)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
