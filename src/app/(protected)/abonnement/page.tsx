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

export const metadata: Metadata = { title: "Abonnement · ZZP Platform" };

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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Het grootboek · abonnement"
        title="Abonnement"
        description={
          role === "CLIENT"
            ? "Van zelf inhuren tot de volledige inhuuradministratie uitbesteden."
            : "Van zelf je administratie doen tot volledig ontzorgd worden — jij werkt, wij rekenen voor."
        }
      />

      <div className="grid items-start gap-4 sm:grid-cols-3">
        {plans.map((plan) => {
          const key = plan.key as PlanKey;
          const tier = tierInfo(key, role);
          if (!tier) return null;
          const isCurrent = plan.key === currentKey;
          const isFull = key === "BUSINESS";

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative",
                tier.highlighted && "border-primary ring-1 ring-primary",
                isFull && "border-primary/60",
              )}
            >
              {tier.highlighted && (
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
                  {plan.priceCents === 0 ? "Gratis" : formatEuro(plan.priceCents)}
                  {plan.priceCents > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">/mnd</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{tier.tagline}</p>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-2">
                  {isCurrent ? (
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
          De voorbereiding en indiening van aangiftes in Volledig Ontzorgd is dienstverlening; je
          blijft zelf eindverantwoordelijk. Een plan wijzigen gaat direct in; je ziet de wijziging
          meteen terug in je abonnement.
        </p>
      </div>
    </div>
  );
}
