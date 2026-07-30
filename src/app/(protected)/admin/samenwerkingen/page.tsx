import { type Metadata } from "next";
import { requireRole } from "@/lib/authz";
import { PageHeader } from "@/components/ui/page-header";
import { SamenwerkingenPanel } from "@/components/admin/samenwerkingen-panel";

export const metadata: Metadata = { title: "Samenwerkingen overzicht · ZZP Platform" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminSamenwerkingenPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole("ADMIN");
  const sp = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="De controlekamer · samenwerkingen"
        title="Samenwerkingen"
        description="Overzicht van alle samenwerkingen — contract tot betaling. Filter op status of DBA-niveau, of zoek op opdracht, opdrachtgever en ZZP'er. Klik om naar de samenwerking te gaan."
      />
      <SamenwerkingenPanel searchParams={sp} />
    </div>
  );
}
