import { createFileRoute } from "@tanstack/react-router";
import { Bot, Clock3, Loader2, MessageSquarePlus, Plus, Send, UserRound } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AppShell } from "@/components/documind/app-shell";
import { CitationList } from "@/components/documind/citation-list";
import { PageHeading } from "@/components/documind/page-heading";
import { askChat, getConversation, listConversations, type ConversationSummary } from "@/lib/api";
import { type Citation } from "@/lib/documind-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "DocuMind Assistant — Cited Documentation Answers" },
      {
        name: "description",
        content: "Ask DocuMind questions about product documentation and review grounded answers with source citations.",
      },
      { property: "og:title", content: "DocuMind Assistant" },
      {
        property: "og:description",
        content: "A documentation assistant with grounded answers and source citations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AssistantPage,
});

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
};

function cleanAnswer(content?: string) {
  if (!content) return "";
  return content.replace(/【[^】]+】/g, "").replace(/\n{3,}/g, "\n\n").trim();
}

function formatTime(isoString: string): string {
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

function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ConversationSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [loadingConv, setLoadingConv] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversation history from the backend
  const refreshHistory = useCallback(() => {
    void listConversations()
      .then((r) => setHistory(r.conversations))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, []);

  const openConversation = useCallback(async (id: string) => {
    setLoadingConv(true);
    setError(null);
    setConversationId(id);
    try {
      const data = await getConversation(id);
      setMessages(data.messages || []);
    } catch {
      setError("Failed to load conversation history.");
    } finally {
      setLoadingConv(false);
    }
  }, []);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  async function submitQuestion(question?: string) {
    const content = question ?? draft.trim();
    if (!content || thinking) return;
    setDraft("");
    setError(null);
    setMessages((current) => [...current, { id: `u-${Date.now()}`, role: "user", content }]);
    setThinking(true);
    try {
      const response = await askChat({
        question: content,
        conversation_id: conversationId,
        product: null,
        version: null,
      });
      setConversationId(response.conversation_id);
      setMessages((current) => [
        ...current,
        { id: `a-${Date.now()}`, role: "assistant", content: response.answer, citations: response.citations },
      ]);
      setThinking(false);
      // Refresh the history sidebar so the new conversation appears immediately
      refreshHistory();
    } catch (err) {
      console.error("Assistant chat error:", err);
      setThinking(false);
      setError(
        err instanceof Error
          ? err.message
          : "The assistant is unavailable right now. Check that the backend is running and try again."
      );
    }
  }

  function startNewConversation() {
    setMessages([]);
    setDraft("");
    setThinking(false);
    setConversationId(null);
    setError(null);
    setLoadingConv(false);
  }

  return (
    <AppShell>
      <div className="space-y-3">
        <PageHeading
          eyebrow="Documentation assistant"
          title="Assistant"
          description="Ask questions and get grounded answers from your documentation."
          actions={
            <Button onClick={startNewConversation} variant="outline">
              <MessageSquarePlus className="size-4" />
              New conversation
            </Button>
          }
        />

        <section className="grid h-[calc(100dvh-11.5rem)] min-h-[28rem] min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-4 lg:grid-cols-[18rem_1fr] lg:grid-rows-1">
          {/* History sidebar */}
          <aside className="max-h-32 min-w-0 overflow-y-auto rounded-lg border border-border bg-surface p-4 shadow-sm lg:max-h-none lg:overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">History</h2>
              <Button variant="ghost" size="icon" aria-label="Start new conversation" onClick={startNewConversation}>
                <Plus className="size-4" />
              </Button>
            </div>
            <div className="mt-4 space-y-2">
              {historyLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                  <Loader2 className="size-3 animate-spin" />
                  Loading history…
                </div>
              ) : history.length === 0 ? (
                <p className="text-xs text-muted-foreground px-1 leading-5">
                  No conversations yet. Ask a question to get started.
                </p>
              ) : (
                history.map((conv) => (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => void openConversation(conv.id)}
                    className={cn(
                      "w-full rounded-lg border p-3 text-left transition-colors",
                      conv.id === conversationId
                        ? "border-primary/40 bg-brand-soft ring-1 ring-primary/20"
                        : "border-border bg-surface-soft hover:border-primary/25",
                    )}
                  >
                    <span className="block truncate text-sm font-medium text-foreground">{conv.title}</span>
                    <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock3 className="size-3" />
                      {formatTime(conv.created_at)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </aside>

          {/* Chat panel */}
          <div className="flex min-h-0 min-w-0 flex-col rounded-lg border border-border bg-surface shadow-sm">
            <div className="border-b border-border px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[var(--shadow-brand)]">
                    <Bot className="size-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">DocuMind Assistant</h2>
                    <p className="text-sm text-muted-foreground">Grounded in indexed documentation and version-aware citations.</p>
                  </div>
                </div>
                <span className="rounded-md border border-success/25 bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                  Retrieval ready
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-5">
              {loadingConv ? (
                <div className="flex min-h-[180px] items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-5 animate-spin text-primary" />
                  Loading conversation…
                </div>
              ) : messages.length === 0 ? (
                <div className="flex min-h-[180px] items-center justify-center px-4 text-center">
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight text-foreground">Start a conversation</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">Ask anything about your product documentation.</p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <article key={message.id} className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}>
                      {message.role === "assistant" ? (
                        <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                          <Bot className="size-4" />
                        </div>
                      ) : null}
                      <div className={cn("max-w-3xl rounded-lg border p-4", message.role === "user" ? "border-primary/20 bg-brand-soft" : "border-border bg-surface-soft")}>
                        <div className="prose-doc text-sm leading-7 text-foreground">
                          {cleanAnswer(message.content).split("\n").map((line, index) => (
                            <p key={`${message.id}-${index}`} className="mb-2 last:mb-0">
                              {line.replaceAll("**", "")}
                            </p>
                          ))}
                        </div>
                        {message.role === "assistant" && message.citations?.length ? <CitationList citations={message.citations} /> : null}
                      </div>
                      {message.role === "user" ? (
                        <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                          <UserRound className="size-4" />
                        </div>
                      ) : null}
                    </article>
                  ))}
                  {thinking ? (
                    <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin text-primary" />
                      Searching your documentation...
                    </div>
                  ) : null}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <div className="border-t border-border p-4">
              <div className="rounded-lg border border-border bg-background p-2 shadow-sm">
                <Textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void submitQuestion();
                    }
                  }}
                  placeholder="Ask about your uploaded documentation, OAuth, API configuration, release notes, or troubleshooting…"
                  className="min-h-14 max-h-32 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
                />
                <div className="flex flex-wrap items-center justify-between gap-3 px-2 pb-2">
                  <p className="text-xs text-muted-foreground">Enter to send · Shift+Enter for a new line</p>
                  <Button onClick={() => submitQuestion()} disabled={!draft.trim() || thinking}>
                    Ask DocuMind
                    <Send className="size-4" />
                  </Button>
                </div>
                {error ? <p className="px-2 pb-2 text-sm text-destructive">{error}</p> : null}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
