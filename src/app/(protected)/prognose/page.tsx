import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { getForecastItemsForFreelancer } from "@/lib/data/income-forecast";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PrognosePanel } from "@/components/administratie/prognose-panel";

export const metadata: Metadata = { title: "Inkomstenprognose · ZZP Platform" };

export default async function PrognosePage() {
  const actor = await requireActor();

  if (actor.role !== "FREELANCER") {
    redirect("/administratie");
  }

  const items = await getForecastItemsForFreelancer(actor.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inkomstenprognose"
        description="Verwachte inkomsten op een tijdlijn — inclusief concepten die je nog moet factureren."
        action={
          items.length > 0 ? (
            <Button asChild size="sm" variant="secondary">
              <a href="/prognose/export">
                <Download className="mr-1.5 size-4" aria-hidden />
                Exporteren
              </a>
            </Button>
          ) : undefined
        }
      />
      <PrognosePanel actor={actor} items={items} />
    </div>
  );
}
