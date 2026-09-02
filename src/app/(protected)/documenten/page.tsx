import { type Metadata } from "next";
import { requireRole } from "@/lib/authz";
import { PageHeader } from "@/components/ui/page-header";
import { DocumentsPanel } from "@/components/documents/documents-panel";

export const metadata: Metadata = { title: "Documenten · Handslag" };

export default async function DocumentenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireRole("FREELANCER");
  const sp = await searchParams;
  const cursor = typeof sp.cursor === "string" ? sp.cursor : null;
  const kind = typeof sp.kind === "string" ? sp.kind : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Mijn profiel"
        title="Documenten"
        description="Je geüploade documenten. Alleen jij (en beheer) kunt ze openen."
      />

      <DocumentsPanel
        ownerId={actor.id}
        cursor={cursor}
        basePath="/documenten"
        kind={kind}
        showKindFilter
      />
    </div>
  );
}
