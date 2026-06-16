import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { requireActor } from "@/lib/authz";
import { PageHeader } from "@/components/ui/page-header";
import { VerplichtingenPanel } from "@/components/administratie/verplichtingen-panel";

export const metadata: Metadata = { title: "Betaalverplichtingen · ZZP Platform" };

export default async function VerplichtingenPage() {
  const actor = await requireActor();

  if (actor.role !== "CLIENT") {
    redirect("/administratie");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Betaalverplichtingen"
        description="Wat je nog moet betalen, op een tijdlijn — inclusief facturen die je nog moet goedkeuren."
      />
      <VerplichtingenPanel actor={actor} />
    </div>
  );
}
