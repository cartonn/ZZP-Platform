import { type Metadata } from "next";
import { requireActor } from "@/lib/authz";
import { getAllPublicFreelancers } from "@/lib/freelancer-search";
import { FreelancerBrowse } from "./freelancer-browse";

export const metadata: Metadata = { title: "ZZP'ers · ZZP Platform" };

export default async function FreelancersPage() {
  const actor = await requireActor();
  if (actor.role === "FREELANCER") {
    // ZZP'ers gebruiken de opdrachten-browse; stuur door
    const { redirect } = await import("next/navigation");
    redirect("/opdrachten");
  }

  const freelancers = await getAllPublicFreelancers();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">ZZP&apos;ers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Zoek beschikbare zelfstandigen voor uw opdrachten en bekijk hun profiel.
        </p>
      </div>
      <FreelancerBrowse freelancers={freelancers} />
    </div>
  );
}
