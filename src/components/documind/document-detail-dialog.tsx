import { BookOpen, FileText, Layers3 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import type { ProductDocument } from "@/lib/documind-data";
import { StatusPill } from "./status-pill";

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

export function DocumentDetailDialog({
  document,
  onOpenChange,
}: {
  document: ProductDocument | undefined;
  onOpenChange: (open: boolean) => void;
}) {
  if (!document) {
    return (
      <Dialog open={false} onOpenChange={onOpenChange}>
        <DialogContent className="hidden" />
      </Dialog>
    );
  }

  const cleanProduct =
    document.product === "Uploaded documentation"
      ? document.title.replace(/^[0-9]+[.\-_ ]*/, "").replace(/\.[^/.]+$/, "") || "Documentation"
      : document.product;
  const cleanVersion = document.version === "Latest" ? "1.0" : document.version;
  const pagesDisplay = document.pages > 0 ? String(document.pages) : "—";
  const coverageDisplay = document.coverage > 0 ? `${document.coverage}%` : "Unavailable";

  return (
    <Dialog open={Boolean(document)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-border bg-surface p-0 shadow-[var(--shadow-elevated)]">
        <div>
          <DialogHeader className="border-b border-border p-6 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={document.status} />
              <span className="rounded-md bg-brand-soft px-2 py-1 text-xs font-medium text-primary">
                {cleanProduct} · v{cleanVersion}
              </span>
            </div>
            <DialogTitle className="text-2xl tracking-tight text-foreground">
              {document.title}
            </DialogTitle>
            <DialogDescription className="leading-6">{document.summary}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 p-6 md:grid-cols-[1fr_0.8fr]">
            <div>
              <p className="text-sm font-semibold text-foreground">Indexed sections</p>
              <div className="mt-3 grid gap-2">
                {document.sections.map((section) => (
                  <div
                    key={section}
                    className="flex items-center gap-2 rounded-md border border-border bg-surface-soft px-3 py-2 text-sm"
                  >
                    <BookOpen className="size-4 text-primary" />
                    {section}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-surface-soft p-4">
              <p className="text-sm font-semibold text-foreground">Document metadata</p>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Type</dt>
                  <dd className="font-medium text-foreground">{document.type}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Pages</dt>
                  <dd className="font-medium text-foreground">{pagesDisplay}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Owner</dt>
                  <dd className="font-medium text-foreground">{document.owner}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Updated</dt>
                  <dd className="font-medium text-foreground">
                    {formatFriendlyDate(document.updated)}
                  </dd>
                </div>
              </dl>
              <div className="mt-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium text-foreground">
                    <Layers3 className="size-4 text-primary" />
                    Knowledge coverage
                  </span>
                  <span className="text-muted-foreground">{coverageDisplay}</span>
                </div>
                {document.coverage > 0 ? (
                  <Progress value={document.coverage} className="mt-3 bg-muted" />
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Coverage computation not available for this document.
                  </p>
                )}
              </div>
              <div className="mt-5 rounded-md border border-border bg-background p-3 text-xs leading-5 text-muted-foreground">
                <FileText className="mb-2 size-4 text-primary" />
                Ready for FastAPI-backed document preview, reprocessing, and source chunk
                inspection.
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
