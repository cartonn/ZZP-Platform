import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { getObligationItemsForClient } from "@/lib/data/payment-obligations";
import { getOwnPaymentBehaviorForClient } from "@/lib/data/payment-behavior";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { VerplichtingenPanel } from "@/components/administratie/verplichtingen-panel";
import { PaymentReputationCard } from "@/components/administratie/payment-reputation-card";

export const metadata: Metadata = { title: "Betaalverplichtingen · Handslag" };

export default async function VerplichtingenPage() {
  const actor = await requireActor();

  if (actor.role !== "CLIENT") {
    redirect("/financien");
  }

  const [items, ownPaymentBehavior] = await Promise.all([
    getObligationItemsForClient(actor.id),
    getOwnPaymentBehaviorForClient(actor.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administratie"
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
      {ownPaymentBehavior && <PaymentReputationCard behavior={ownPaymentBehavior} />}
      <VerplichtingenPanel actor={actor} items={items} />
    </div>
  );
}
