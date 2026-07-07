import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { getForecastItemsForFreelancer } from "@/lib/data/income-forecast";
import { getRealizedRevenueThisMonthCents } from "@/lib/data/monthly-income";
import { summarizeIncomeGoal } from "@/lib/income-goal";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PrognosePanel } from "@/components/administratie/prognose-panel";
import { IncomeGoalCard } from "@/components/administratie/income-goal-card";

export const metadata: Metadata = { title: "Inkomstenprognose · ZZP Platform" };

export default async function PrognosePage() {
  const actor = await requireActor();

  if (actor.role !== "FREELANCER") {
    redirect("/administratie");
  }

  const now = new Date();
  const [items, profile, realizedCents] = await Promise.all([
    getForecastItemsForFreelancer(actor.id),
    prisma.freelancerProfile.findUnique({
      where: { userId: actor.id },
      select: { monthlyIncomeGoalCents: true },
    }),
    getRealizedRevenueThisMonthCents(actor.id, now),
  ]);

  // Nog te versturen concepten (DRAFT) tellen als het verwachte deel van het maanddoel.
  const expectedCents = items
    .filter((i) => i.stage === "DRAFT")
    .reduce((sum, i) => sum + i.grossCents, 0);

  const goalSummary = summarizeIncomeGoal({
    goalCents: profile?.monthlyIncomeGoalCents ?? null,
    realizedCents,
    expectedCents,
  });

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
      <IncomeGoalCard summary={goalSummary} />
      <PrognosePanel actor={actor} items={items} />
    </div>
  );
}
