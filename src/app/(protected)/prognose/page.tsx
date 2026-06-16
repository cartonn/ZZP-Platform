import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { requireActor } from "@/lib/authz";
import { PageHeader } from "@/components/ui/page-header";
import { PrognosePanel } from "@/components/administratie/prognose-panel";

export const metadata: Metadata = { title: "Inkomstenprognose · ZZP Platform" };

export default async function PrognosePage() {
  const actor = await requireActor();

  if (actor.role !== "FREELANCER") {
    redirect("/administratie");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inkomstenprognose"
        description="Verwachte inkomsten op een tijdlijn — inclusief concepten die je nog moet factureren."
      />
      <PrognosePanel actor={actor} />
    </div>
  );
}
