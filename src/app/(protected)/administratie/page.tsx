import { type Metadata } from "next";
import { requireActor } from "@/lib/authz";
import { PageHeader } from "@/components/ui/page-header";
import { BoekhoudingPanel } from "@/components/administratie/boekhouding-panel";

export const metadata: Metadata = { title: "Boekhouding · ZZP Platform" };

export default async function AdministratiePage() {
  const actor = await requireActor();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Het grootboek · boekhouding"
        title="Boekhouding"
        description="Automatisch afgeleid uit goedgekeurde prestaties en facturen. Betaling verloopt rechtstreeks; het platform houdt alleen de status bij."
      />
      <BoekhoudingPanel actor={actor} />
    </div>
  );
}
