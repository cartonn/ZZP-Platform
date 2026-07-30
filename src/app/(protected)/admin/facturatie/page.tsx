import { type Metadata } from "next";
import { requireRole } from "@/lib/authz";
import { PageHeader } from "@/components/ui/page-header";
import { FacturatiePanel } from "@/components/admin/financien/facturatie-panel";

export const metadata: Metadata = { title: "Facturatie · ZZP Platform" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function FacturatiePage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole("ADMIN");
  const sp = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="De controlekamer · facturatie"
        title="Facturatie"
        description="De facturen van het platform aan bemiddelingen (transactie-fee) en ZZP'ers (abonnement). Bundel de openstaande bijdragen en beheer de status. Er wordt nog niets automatisch geïncasseerd."
      />
      <FacturatiePanel searchParams={sp} basePath="/admin/facturatie" />
    </div>
  );
}
