import { AlertCircle, CheckCircle2, Clock3, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { DocumentStatus, PipelineItem } from "@/lib/documind-data";

type StatusKind = DocumentStatus | PipelineItem["stage"] | "Healthy" | "Needs review";

const styles: Record<string, string> = {
  Ready: "border-success/25 bg-success/10 text-success",
  Indexed: "border-success/25 bg-success/10 text-success",
  Healthy: "border-success/25 bg-success/10 text-success",
  Indexing: "border-info/25 bg-info/10 text-info",
  Processing: "border-info/25 bg-info/10 text-info",
  "Extracting content": "border-info/25 bg-info/10 text-info",
  Uploading: "border-info/25 bg-info/10 text-info",
  Failed: "border-destructive/25 bg-destructive/10 text-destructive",
  "Needs review": "border-warning/30 bg-warning/10 text-warning",
};

function IconForStatus({ status }: { status: StatusKind }) {
  if (status === "Ready" || status === "Indexed" || status === "Healthy")
    return <CheckCircle2 className="size-3.5" />;
  if (status === "Failed" || status === "Needs review") return <AlertCircle className="size-3.5" />;
  if (status === "Indexing" || status === "Processing")
    return <Loader2 className="size-3.5 animate-spin" />;
  return <Clock3 className="size-3.5" />;
}

export function StatusPill({ status, className }: { status: StatusKind; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium",
        styles[status] ?? "border-border bg-muted text-muted-foreground",
        className,
      )}
    >
      <IconForStatus status={status} />
      {status}
    </span>
  );
}
