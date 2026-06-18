import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { getObligationItemsForClient } from "@/lib/data/payment-obligations";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { VerplichtingenPanel } from "@/components/administratie/verplichtingen-panel";

export const metadata: Metadata = { title: "Betaalverplichtingen · ZZP Platform" };

export default async function VerplichtingenPage() {
  const actor = await requireActor();

  if (actor.role !== "CLIENT") {
    redirect("/administratie");
  }

  const items = await getObligationItemsForClient(actor.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Betaalverplichtingen"
        description="Wat je nog moet betalen, op een tijdlijn — inclusief facturen die je nog moet goedkeuren."
        action={
          items.length > 0 ? (
            <Button asChild size="sm" variant="secondary">
              <a href="/verplichtingen/export">
                <Download className="mr-1.5 size-4" aria-hidden />
                Exporteren
              </a>
            </Button>
          ) : undefined
        }
      />
      <VerplichtingenPanel actor={actor} items={items} />
    </div>
  );
}
