import Link from "next/link";
import { Download, FileText, Trash2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { type DocumentKind } from "@/lib/enums";
import { pageArgs, splitPage } from "@/lib/pagination";
import { formatDateShortNl } from "@/lib/format-date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { EmptyState } from "@/components/ui/empty-state";
import { DocumentForm } from "@/app/(protected)/documenten/document-form";
import { deleteDocument } from "@/app/(protected)/documenten/actions";

const KIND_LABEL: Record<DocumentKind, string> = {
  CREDENTIAL: "Credential",
  VOG: "VOG",
  INSURANCE: "Verzekering",
  CONTRACT: "Contract",
  OTHER: "Overig",
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Gedeeld documentenpaneel: uploadformulier + privélijst van de eigenaar.
 * Documenten zijn standaard privé — dit paneel mag uitsluitend voor de eigenaar
 * (ownerId === ingelogde gebruiker) gerenderd worden. Server-side gescoped op ownerId.
 * Wordt gebruikt op /documenten én op de eigenaar-only "Documenten"-tab van het profiel.
 *
 * @param ownerId  de ingelogde eigenaar; bepaalt server-side de scope van de query.
 * @param cursor   cursor voor paginatie (uit searchParams van de hostpagina).
 * @param basePath pad waar de "Meer laden"-link heen wijst (default /documenten).
 */
export async function DocumentsPanel({
  ownerId,
  cursor = null,
  basePath = "/documenten",
}: {
  ownerId: string;
  cursor?: string | null;
  basePath?: string;
}) {
  const rows = await prisma.document.findMany({
    where: { ownerId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    ...pageArgs(cursor),
    include: { _count: { select: { credentials: true } } },
  });

  const { items: documents, nextCursor } = splitPage(rows);

  return (
    <div className="space-y-6">
      <DocumentForm />

      {documents.length === 0 && !cursor ? (
        <Card>
          <EmptyState
            icon={FileText}
            title="Nog geen documenten geüpload"
            description="Gebruik het formulier hierboven om je eerste document toe te voegen."
          />
        </Card>
      ) : documents.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title="Geen verdere documenten"
            description="Je hebt alle documenten bekeken."
          />
        </Card>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {documents.map((doc) => {
            const linked = doc._count.credentials > 0;
            return (
              <div key={doc.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{doc.filename}</p>
                    <Badge variant="muted">{KIND_LABEL[doc.kind as DocumentKind]}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(doc.size)} · {formatDateShortNl(doc.createdAt)}
                    {linked ? " · gekoppeld aan een credential" : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button asChild variant="secondary" size="sm">
                    <a href={`/api/documents/${doc.id}`} target="_blank" rel="noreferrer">
                      <Download className="size-3.5" aria-hidden /> Openen
                    </a>
                  </Button>
                  {!linked && (
                    <ConfirmButton
                      action={deleteDocument.bind(null, doc.id)}
                      title="Document verwijderen?"
                      description="Dit document wordt permanent uit je opslag verwijderd. Dit kan niet ongedaan worden gemaakt."
                      confirmLabel="Verwijderen"
                      aria-label={`Verwijder ${doc.filename}`}
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </ConfirmButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {nextCursor && (
        <div className="flex justify-center py-2">
          <Button asChild variant="secondary">
            <Link href={`${basePath}?cursor=${nextCursor}`}>Meer laden</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
