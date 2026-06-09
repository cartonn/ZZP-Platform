import { type Metadata } from "next";
import { Download, FileText, Trash2 } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { type DocumentKind } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { DocumentForm } from "./document-form";
import { deleteDocument } from "./actions";
import { formatDateShortNl } from "@/lib/format-date";

export const metadata: Metadata = { title: "Documenten · ZZP Platform" };

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

export default async function DocumentenPage() {
  const actor = await requireRole("FREELANCER");
  const documents = await prisma.document.findMany({
    where: { ownerId: actor.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { credentials: true } } },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Documenten"
        description="Je geüploade documenten. Alleen jij (en beheer) kunt ze openen."
      />

      <DocumentForm />

      {documents.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title="Nog geen documenten geüpload"
            description="Gebruik het formulier hierboven om je eerste document toe te voegen."
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
    </div>
  );
}
