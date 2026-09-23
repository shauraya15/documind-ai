import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, AlertTriangle, CheckCircle2, Eye, FileText, Loader2, Search, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppShell } from "@/components/documind/app-shell";
import { DocumentDetailDialog } from "@/components/documind/document-detail-dialog";
import { PageHeading } from "@/components/documind/page-heading";
import { StatusPill } from "@/components/documind/status-pill";
import { getDocumentConfig, listDocuments, uploadDocument, type DocumentConfigResponse } from "@/lib/api";
import type { ProductDocument } from "@/lib/documind-data";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "DocuMind Documents — Product Documentation Library" },
      { name: "description", content: "Browse, search, filter, and inspect mock product documentation metadata in DocuMind." },
      { property: "og:title", content: "DocuMind Documentation Library" },
      { property: "og:description", content: "Explore product manuals, API references, FAQs, release notes, and indexing status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DocumentsPage,
});

const allValue = "All";
const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".md", ".markdown", ".txt"];

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

function DocumentsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<ProductDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [product, setProduct] = useState(allValue);
  const [version, setVersion] = useState(allValue);
  const [type, setType] = useState(allValue);
  const [status, setStatus] = useState(allValue);
  const [selected, setSelected] = useState<ProductDocument>();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [ingestionConfig, setIngestionConfig] = useState<DocumentConfigResponse | null>(null);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(null);

    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      setUploadError("Only PDF, DOCX, Markdown, and TXT files are supported.");
      return;
    }

    setUploading(true);
    setUploadSuccess(`Uploading ${file.name}...`);
    try {
      const document = await uploadDocument(file);
      setDocuments((current) => [document, ...current.filter((d) => d.id !== document.id)]);
      setUploadSuccess(`${document.title}: ${document.status}`);

      let pollCount = 0;
      const pollInterval = window.setInterval(() => {
        pollCount++;
        void listDocuments().then((response) => {
          setDocuments(response.documents);
          const updated = response.documents.find((item) => item.id === document.id);
          if (updated) {
            setUploadSuccess(`${updated.title}: ${updated.status}`);
            if (updated.status === "Ready" || updated.status === "Indexed" || updated.status === "Failed") {
              window.clearInterval(pollInterval);
            }
          }
        });
        if (pollCount >= 15) {
          window.clearInterval(pollInterval);
        }
      }, 2000);
    } catch (err) {
      setUploadSuccess(null);
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    void listDocuments()
      .then((response) => setDocuments(response.documents))
      .catch(() => setError("Documents could not be loaded right now."))
      .finally(() => setLoading(false));

    void getDocumentConfig()
      .then((config) => setIngestionConfig(config))
      .catch(() => {});
  }, []);

  const products = Array.from(new Set(documents.map((document) => document.product)));
  const versions = Array.from(new Set(documents.map((document) => document.version)));
  const types = Array.from(new Set(documents.map((document) => document.type)));
  const statuses = Array.from(new Set(documents.map((document) => document.status)));

  const filteredDocuments = useMemo(
    () =>
      documents.filter((document) => {
        const matchesQuery = `${document.title} ${document.summary} ${document.sections.join(" ")}`.toLowerCase().includes(query.toLowerCase());
        return (
          matchesQuery &&
          (product === allValue || document.product === product) &&
          (version === allValue || document.version === version) &&
          (type === allValue || document.type === type) &&
          (status === allValue || document.status === status)
        );
      }),
    [documents, product, query, status, type, version],
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeading
          eyebrow="Documents"
          title="A curated library for product knowledge."
          description="Browse documents prepared for knowledge mining, indexing, source attribution, and future FastAPI retrieval endpoints."
          actions={
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.md,.markdown,.txt"
                disabled={uploading}
                onChange={handleUpload}
              />
              <Button
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex cursor-pointer items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="size-4" />
                    Upload Document
                  </>
                )}
              </Button>
            </div>
          }
        />

        {ingestionConfig && !ingestionConfig.configured ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <AlertTriangle className="size-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Azure Document Ingestion Not Configured</p>
              <p className="mt-1 text-xs opacity-90">
                Missing required environment variables in backend/.env: {ingestionConfig.missing_variables.join(", ")}.
                Document upload requires Azure Blob Storage and AI Search indexer configuration.
              </p>
            </div>
          </div>
        ) : null}

        {uploadError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive flex items-start gap-3">
            <AlertCircle className="size-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Upload Error</p>
              <p className="mt-1 text-xs opacity-90">{uploadError}</p>
            </div>
          </div>
        ) : null}

        {uploadSuccess ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
            <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Upload Status</p>
              <p className="mt-1 text-xs opacity-90">{uploadSuccess}</p>
            </div>
          </div>
        ) : null}

        <section className="rounded-lg border border-border bg-surface p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1.6fr_repeat(4,1fr)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search documents, sections, or topics" className="pl-9" />
            </div>
            <FilterSelect label="Product" value={product} values={products} onValueChange={setProduct} />
            <FilterSelect label="Version" value={version} values={versions} onValueChange={setVersion} />
            <FilterSelect label="Type" value={type} values={types} onValueChange={setType} />
            <FilterSelect label="Status" value={status} values={statuses} onValueChange={setStatus} />
          </div>
        </section>

        <section className="grid gap-3">
          {loading ? <p className="rounded-lg border border-border bg-surface p-6 text-sm text-muted-foreground">Loading documents...</p> : null}
          {!loading && error ? <p className="rounded-lg border border-destructive/25 bg-destructive/5 p-6 text-sm text-destructive">{error}</p> : null}
          {!loading && !error && filteredDocuments.length === 0 ? <p className="rounded-lg border border-border bg-surface p-6 text-sm text-muted-foreground">No documents match the current filters.</p> : null}

          {filteredDocuments.map((document) => {
            const cleanProduct = document.product === "Uploaded documentation"
              ? document.title.replace(/^[0-9]+[\.\-_ ]*/, "").replace(/\.[^/.]+$/, "") || "Documentation"
              : document.product;
            const cleanVersion = document.version === "Latest" ? "1.0" : document.version;
            const pagesDisplay = document.pages > 0 ? String(document.pages) : "—";
            const coverageDisplay = document.coverage > 0 ? `${document.coverage}%` : "Unavailable";

            return (
              <article key={document.id} className="rounded-lg border border-border bg-surface p-5 shadow-sm transition-colors hover:border-primary/25">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill status={document.status} />
                      <span className="rounded-md bg-surface-soft px-2 py-1 text-xs font-medium text-muted-foreground">{document.type}</span>
                    </div>
                    <h2 className="mt-3 text-xl font-semibold tracking-tight text-foreground">{document.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{document.summary}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {document.sections.slice(0, 4).map((section) => (
                        <span key={section} className="rounded-md border border-border bg-surface-soft px-2.5 py-1 text-xs text-muted-foreground">
                          {section}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-4 lg:min-w-96">
                    <Meta label="Product" value={cleanProduct} />
                    <Meta label="Version" value={cleanVersion} />
                    <Meta label="Pages" value={pagesDisplay} />
                    <Meta label="Coverage" value={coverageDisplay} />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="size-4" />
                    Updated {formatFriendlyDate(document.updated)} by {document.owner}
                  </p>
                  <Button variant="outline" onClick={() => setSelected(document)}>
                    <Eye className="size-4" />
                    Open details
                  </Button>
                </div>
              </article>
            );
          })}
        </section>

        <DocumentDetailDialog document={selected} onOpenChange={(open) => !open && setSelected(undefined)} />
      </div>
    </AppShell>
  );
}

function FilterSelect({ label, value, values, onValueChange }: { label: string; value: string; values: string[]; onValueChange: (value: string) => void }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger aria-label={label}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={allValue}>{label}</SelectItem>
        {values.map((item) => (
          <SelectItem key={item} value={item}>
            {item}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-soft p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
