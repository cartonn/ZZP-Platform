import { type Metadata } from "next";
import { requireRole } from "@/lib/authz";
import { PageHeader } from "@/components/ui/page-header";
import { BewakingPanel, countOpenIncidents } from "@/components/admin/bewaking-panel";

export const metadata: Metadata = { title: "Platform-bewaking · Handslag" };

export default async function BewakingPage() {
  await requireRole("ADMIN");
  const open = await countOpenIncidents();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="De controlekamer · bewaking"
        title="Platform-bewaking"
        description={
          <>
            Beveiligings- en gezondheidssignalen, automatisch gedetecteerd uit de audit-log.
            {open > 0 ? ` ${open} open.` : " Alles rustig."}
          </>
        }
      />

      <BewakingPanel />
    </div>
  );
}
