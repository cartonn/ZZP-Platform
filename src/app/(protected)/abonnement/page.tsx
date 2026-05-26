import { type Metadata } from "next";
import { Check } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { formatEuro } from "@/lib/invoices";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { changeSubscription } from "./actions";

export const metadata: Metadata = { title: "Abonnement · ZZP Platform" };

const ORDER: Record<string, number> = { FREE: 0, PRO: 1, BUSINESS: 2 };
const limit = (n: number) => (n < 0 ? "onbeperkt" : String(n));

export default async function AbonnementPage() {
  const actor = await requireActor();
  const [plans, subscription] = await Promise.all([
    prisma.plan.findMany(),
    prisma.subscription.findUnique({ where: { userId: actor.id }, include: { plan: true } }),
  ]);
  plans.sort((a, b) => (ORDER[a.key] ?? 99) - (ORDER[b.key] ?? 99));

  const currentKey = subscription?.status === "ACTIVE" ? subscription.plan.key : "FREE";
  const isFreelancer = actor.role === "FREELANCER";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Abonnement</h1>
        <p className="text-sm text-muted-foreground">
          Je huidige plan bepaalt limieten zoals het aantal {isFreelancer ? "reacties" : "actieve opdrachten"}.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.key === currentKey;
          return (
            <Card key={plan.id} className={cn(isCurrent && "border-primary ring-1 ring-primary")}>
              <CardContent className="flex h-full flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{plan.name}</span>
                  {isCurrent && <Badge variant="success">Huidig</Badge>}
                </div>
                <p className="text-2xl font-semibold tabular-nums">
                  {plan.priceCents === 0 ? "Gratis" : formatEuro(plan.priceCents)}
                  {plan.priceCents > 0 && <span className="text-sm font-normal text-muted-foreground">/mnd</span>}
                </p>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><Check className="size-3.5 text-success" aria-hidden /> {limit(plan.maxApplications)} reacties</li>
                  <li className="flex items-center gap-2"><Check className="size-3.5 text-success" aria-hidden /> {limit(plan.maxJobs)} opdrachten</li>
                </ul>
                <div className="mt-auto pt-2">
                  {isCurrent ? (
                    <Button variant="secondary" size="sm" className="w-full" disabled>Huidig plan</Button>
                  ) : (
                    <form action={changeSubscription.bind(null, plan.key)}>
                      <Button type="submit" variant={plan.key === "FREE" ? "secondary" : "primary"} size="sm" className="w-full">
                        Kies {plan.name}
                      </Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Let op: dit is een demo zonder echte betaling. Een plan wijzigen activeert het direct.
      </p>
    </div>
  );
}
