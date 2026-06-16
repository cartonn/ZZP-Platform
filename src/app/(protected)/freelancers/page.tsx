import { type Metadata } from "next";
import { requireActor } from "@/lib/authz";
import { visibleFreelancersWhere } from "@/lib/tenancy";
import { getAllPublicFreelancers } from "@/lib/freelancer-search";
import { PageHeader } from "@/components/ui/page-header";
import { FreelancerBrowse } from "./freelancer-browse";

export const metadata: Metadata = { title: "ZZP'ers · ZZP Platform" };

export default async function FreelancersPage() {
  const actor = await requireActor();
  if (actor.role === "FREELANCER") {
    // ZZP'ers gebruiken de opdrachten-browse; stuur door
    const { redirect } = await import("next/navigation");
    redirect("/opdrachten");
  }

  // Gesloten per tenant: een tenant-opdrachtgever ziet alleen de eigen franchise-roster.
  const freelancers = await getAllPublicFreelancers(visibleFreelancersWhere(actor));

  return (
    <div className="space-y-6">
      <PageHeader
        title="ZZP'ers"
        description="Zoek beschikbare zelfstandigen voor uw opdrachten en bekijk hun profiel."
      />
      <FreelancerBrowse freelancers={freelancers} />
    </div>
  );
}
