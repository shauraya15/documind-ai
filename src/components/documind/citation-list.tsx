import { ChevronDown, FileText } from "lucide-react";

import type { Citation } from "@/lib/documind-data";

export function CitationList({ citations }: { citations: Citation[] }) {
  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Sources
      </p>
      <div className="grid gap-2 md:grid-cols-3">
        {citations.map((citation, index) => (
          <details
            key={citation.id}
            className="group rounded-md border border-border bg-surface-soft p-2.5 transition-colors hover:border-primary/35"
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
              <span className="flex min-w-0 gap-2">
                <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {citation.document.startsWith("http")
                      ? `Source ${index + 1}`
                      : citation.document}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {citation.product || "Documentation"}
                    {citation.version ? ` · v${citation.version}` : ""}
                  </span>
                </span>
              </span>
              <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-2 border-t border-border pt-2 text-xs leading-5 text-muted-foreground">
              <p className="font-medium text-foreground">{citation.section}</p>
              <p className="mt-2">{citation.excerpt}</p>
              <p className="mt-2 font-medium text-primary">
                {citation.confidence}% source confidence
              </p>
              {citation.page.startsWith("http") ? (
                <a
                  className="mt-2 block truncate font-medium text-primary hover:underline"
                  href={citation.page}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open source
                </a>
              ) : null}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
