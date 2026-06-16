import { type Metadata } from "next";
import { requireRole } from "@/lib/authz";
import { PageHeader } from "@/components/ui/page-header";
import { DocumentsPanel } from "@/components/documents/documents-panel";

export const metadata: Metadata = { title: "Documenten · ZZP Platform" };

export default async function DocumentenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireRole("FREELANCER");
  const sp = await searchParams;
  const cursor = typeof sp.cursor === "string" ? sp.cursor : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Documenten"
        description="Je geüploade documenten. Alleen jij (en beheer) kunt ze openen."
      />

      <DocumentsPanel ownerId={actor.id} cursor={cursor} basePath="/documenten" />
    </div>
  );
}
