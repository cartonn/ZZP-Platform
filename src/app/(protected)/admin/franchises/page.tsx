import { type Metadata } from "next";
import { requireRole } from "@/lib/authz";
import { PageHeader } from "@/components/ui/page-header";
import { BemiddelaarsPanel } from "@/components/admin/gebruikersbeheer/bemiddelaars-panel";

export const metadata: Metadata = { title: "Bemiddelingen · Handslag" };

export default async function FranchisesPage() {
  await requireRole("ADMIN");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="De controlekamer · franchises"
        title="Bemiddelingen"
        description="Bemiddelaars (tenant-admins) en hun tenants. Een bemiddelaar brengt eigen opdrachtgevers en ZZP'ers in het platform."
      />
      <BemiddelaarsPanel />
    </div>
  );
}
