import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, BookMarked, Command, LogOut, Sparkles } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { navItems } from "@/lib/documind-data";
import {
  getCurrentUser,
  getKnowledgeStatus,
  logout,
  type AuthUser,
  type KnowledgeStatusResponse,
} from "@/lib/api";
import { cn } from "@/lib/utils";

function formatDisplayName(email: string): string {
  const localPart = email.split("@")[0] || "User";
  const parts = localPart.split(/[._-]+/).filter(Boolean);
  if (parts.length === 0) return "User";
  return parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.charAt(0) ?? ""}${parts[1]?.charAt(0) ?? ""}`.toUpperCase();
  }
  return displayName.slice(0, 2).toUpperCase() || "U";
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [knowledge, setKnowledge] = useState<KnowledgeStatusResponse | null>(null);

  useEffect(() => {
    let active = true;
    void getCurrentUser()
      .then((user) => {
        if (active) setCurrentUser(user);
      })
      .catch(() => {});
    void getKnowledgeStatus()
      .then((k) => {
        if (active) setKnowledge(k);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const displayName = currentUser ? formatDisplayName(currentUser.email) : "User";
  const initials = getInitials(displayName);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      window.location.assign("/login");
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-border bg-surface/95 px-4 py-5 shadow-sm xl:block">
        <div className="flex items-center gap-3 px-2">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[var(--shadow-brand)]">
            <BookMarked className="size-5" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">DocuMind</p>
            <p className="text-xs text-muted-foreground">Product Documentation Assistant</p>
          </div>
        </div>

        <nav className="mt-8 space-y-1" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-[var(--shadow-brand)]"
                    : item.primary
                      ? "text-primary hover:bg-brand-soft"
                      : "text-muted-foreground hover:bg-surface-soft hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
                {item.primary ? <Sparkles className="ml-auto size-3.5 opacity-80" /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="absolute inset-x-4 bottom-5 rounded-lg border border-border bg-surface-soft p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span
              className={`size-2 rounded-full ${knowledge?.status === "healthy" ? "bg-success" : knowledge?.status === "degraded" ? "bg-warning" : "bg-muted-foreground"}`}
            />
            {knowledge?.status === "healthy"
              ? "Knowledge base healthy"
              : knowledge?.status === "degraded"
                ? "Knowledge base degraded"
                : "Knowledge base empty"}
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {knowledge
              ? knowledge.indexed_documents === 0
                ? "No documents indexed yet."
                : knowledge.coverage > 0
                  ? `${knowledge.coverage}% coverage · ${knowledge.indexed_documents} doc${knowledge.indexed_documents !== 1 ? "s" : ""} indexed.`
                  : `${knowledge.indexed_documents} doc${knowledge.indexed_documents !== 1 ? "s" : ""} indexed · coverage unavailable.`
              : "Loading knowledge status…"}
          </p>
        </div>
      </div>

      <div className="xl:pl-72">
        <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 xl:hidden">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <BookMarked className="size-4" />
                </div>
                <span className="font-semibold tracking-tight">DocuMind</span>
              </div>
            </div>

            <div className="hidden min-w-0 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted-foreground shadow-sm md:flex">
              <Command className="size-4 text-primary" />
              <span className="truncate">Ask, search, or open a documentation set</span>
              <kbd className="ml-8 rounded border border-border bg-surface-soft px-1.5 py-0.5 text-[11px] text-muted-foreground">
                ⌘K
              </kbd>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="size-4" />
              </Button>
              <div className="hidden items-center gap-3 rounded-lg border border-border bg-surface py-1.5 pl-2 pr-3 shadow-sm sm:flex">
                <div className="flex size-8 items-center justify-center rounded-md bg-accent text-accent-foreground text-sm font-semibold">
                  {initials}
                </div>
                <div className="text-sm leading-4">
                  <p className="font-medium text-foreground">{displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    {currentUser?.email ?? "Docs Operations"}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" aria-label="Log out" onClick={handleLogout}>
                <LogOut className="size-4" />
              </Button>
            </div>
          </div>
          <nav
            className="flex gap-2 overflow-x-auto border-t border-border px-4 py-2 xl:hidden"
            aria-label="Mobile navigation"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-surface-soft",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
