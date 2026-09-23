import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function Metric({
  label,
  value,
  detail,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface p-5 shadow-sm", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
        </div>
        <span className="rounded-md border border-border bg-surface-soft p-2 text-primary">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">{detail}</p>
    </div>
  );
}
