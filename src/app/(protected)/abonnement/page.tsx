import { type Metadata } from "next";
import { Check, Sparkles } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { formatEuro } from "@/lib/invoices";
import { type PlanKey, type UserRole } from "@/lib/enums";
import { tierInfo } from "@/lib/entitlements";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { changeSubscription } from "./actions";
import { subscriptionPurchaseAvailability } from "@/lib/billing/purchase-availability";

export const metadata: Metadata = { title: "Abonnement · Handslag" };

const ORDER: Record<string, number> = { FREE: 0, PRO: 1, BUSINESS: 2 };

export default async function AbonnementPage() {
  const actor = await requireActor();
  const role = actor.role as UserRole;
  const [plans, subscription] = await Promise.all([
    // unbounded-allow: vaste kleine referentietabel (3 plannen)
    prisma.plan.findMany(),
    prisma.subscription.findUnique({ where: { userId: actor.id }, include: { plan: true } }),
  ]);
  plans.sort((a, b) => (ORDER[a.key] ?? 99) - (ORDER[b.key] ?? 99));

  const currentKey = subscription?.status === "ACTIVE" ? subscription.plan.key : "FREE";
  const demo = process.env.DEPLOYMENT_STAGE === "demo";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Abonnement"
        description="Bekijk wat je kunt gebruiken en welke pakketten beschikbaar zijn."
      />

      {demo && (
        <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
          <p className="font-semibold">Je bekijkt de demo</p>
          <p className="mt-1 text-muted-foreground">
            De bedragen en dienstverlening zijn voorbeelden. Je kunt pakketten uitproberen zonder
            betaling; je sluit geen betaald abonnement af. Gebruik uitsluitend fictieve gegevens.
          </p>
        </div>
      )}

      <div className="grid items-start gap-4 sm:grid-cols-3">
        {plans.map((plan) => {
          const key = plan.key as PlanKey;
          const tier = tierInfo(key, role);
          if (!tier) return null;
          const isCurrent = plan.key === currentKey;
          const isFull = key === "BUSINESS";
          const availability = subscriptionPurchaseAvailability(plan);
          const unavailable = availability.kind === "unavailable";

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative",
                tier.highlighted && "border-primary ring-1 ring-primary",
                isFull && "border-primary/60",
              )}
            >
              {tier.highlighted && !unavailable && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-medium text-primary-foreground">
                  Aanbevolen
                </span>
              )}
              <CardContent className="flex h-full flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    {isFull && <Sparkles className="size-4 text-primary" aria-hidden />}
                    {tier.name}
                  </span>
                  {isCurrent && <Badge variant="success">Huidig</Badge>}
                </div>
                <p className="text-2xl font-semibold tabular-nums">
                  {unavailable
                    ? "Nog niet beschikbaar"
                    : plan.priceCents === 0
                      ? "Gratis"
                      : formatEuro(plan.priceCents)}
                  {!unavailable && plan.priceCents > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">/mnd</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{tier.tagline}</p>
                {unavailable && (
                  <p className="text-sm text-muted-foreground">{availability.reason}</p>
                )}
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-2">
                  {unavailable ? (
                    <Button variant="secondary" size="sm" className="w-full" disabled>
                      Nog niet beschikbaar
                    </Button>
                  ) : isCurrent ? (
                    <Button variant="secondary" size="sm" className="w-full" disabled>
                      Huidig plan
                    </Button>
                  ) : (
                    <form action={changeSubscription.bind(null, plan.key)}>
                      <Button
                        type="submit"
                        variant={key === "FREE" ? "secondary" : "primary"}
                        size="sm"
                        className="w-full"
                      >
                        Kies {tier.name}
                      </Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        <p>
          {
            "Betalingen lopen rechtstreeks tussen ZZP'er en opdrachtgever; het platform verwerkt geen geld uit de samenwerking. Het abonnement is een platformdienst, geen percentage over je omzet."
          }
        </p>
        <p>
          Een gratis pakket kun je direct gebruiken. Buiten de demo wordt een betaald pakket pas
          actief na bevestiging van de betaling. Aanvullende dienstverlening is pas beschikbaar
          wanneer dit uitdrukkelijk wordt aangeboden en afgesproken.
        </p>
      </div>
    </div>
  );
}
