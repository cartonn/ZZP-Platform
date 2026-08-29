import { Download, Layers, Receipt, ReceiptText, TrendingUp } from "lucide-react";
import { type Actor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { formatEuro } from "@/lib/invoices";
import {
  EXPENSE_CATEGORY_LABEL,
  expenseCategoryShares,
  summarizeExpenses,
  type ExpenseCategory,
} from "@/lib/expense";
import { expenseTrend } from "@/lib/expense-trend";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { BarSeries } from "@/components/insight/bi";
import { UitgavenForm, DeleteExpenseButton } from "@/components/administratie/uitgaven-form";

/** Hoeveel maanden de kosten-per-maand-strip toont. */
const EXPENSE_TREND_MONTHS = 6;

/** Datum als NL `dd-mm-jjjj` (UTC — de uitgaven zijn op UTC-middernacht geboekt, geen tijdzone-drift). */
function formatDateNl(date: Date): string {
  const d = String(date.getUTCDate()).padStart(2, "0");
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const y = date.getUTCFullYear();
  return `${d}-${m}-${y}`;
}

function categoryLabel(category: string): string {
  return EXPENSE_CATEGORY_LABEL[category as ExpenseCategory] ?? EXPENSE_CATEGORY_LABEL.OVERIG;
}

/**
 * Uitgaven-paneel: de ZZP'er legt zakelijke kosten vast (netto + voorbelasting) zodat winst,
 * IB-schatting en btw-teruggave met de werkelijke kosten kloppen. Laadt zelf zijn data en rendert
 * geen eigen paginakop (de administratie-hub levert die). Alleen FREELANCER (de hub gate't de rol).
 */
export async function UitgavenPanel({ actor }: { actor: Actor }) {
  const now = new Date();
  const expenses = await prisma.expense.findMany({
    where: { userId: actor.id },
    orderBy: { occurredAt: "desc" },
    take: 200,
  });

  // De kosten-per-maand-strip mag niet afhangen van de 200-rij-lijstcap: laad de uitgaven in het
  // trendvenster apart (owner-gescoopt, alleen de velden die de trend nodig heeft).
  const trendFloor = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (EXPENSE_TREND_MONTHS - 1), 1),
  );
  const trendExpenses = await prisma.expense.findMany({
    where: { userId: actor.id, occurredAt: { gte: trendFloor } },
    select: { occurredAt: true, netCents: true },
  });
  const trend = expenseTrend(trendExpenses, now, EXPENSE_TREND_MONTHS);

  const summary = summarizeExpenses(expenses, { year: now.getUTCFullYear() });
  const categoryShares = expenseCategoryShares(summary);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Leg hier je zakelijke kosten vast. Vastgelegde uitgaven tellen mee voor je winst, de
        IB-schatting en de btw-teruggave (voorbelasting), zodat je administratie klopt.
      </p>

      {/* Kerncijfers */}
      <section className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="space-y-1 py-4">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Receipt className="size-3.5" aria-hidden /> Kosten dit jaar
            </p>
            <p className="text-lg font-semibold tabular-nums">{formatEuro(summary.netCents)}</p>
            <p className="text-xs text-muted-foreground">exclusief btw</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 py-4">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ReceiptText className="size-3.5" aria-hidden /> Aftrekbare btw
            </p>
            <p className="text-lg font-semibold tabular-nums">
              {formatEuro(summary.deductibleVatCents)}
            </p>
            <p className="text-xs text-muted-foreground">voorbelasting dit jaar</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 py-4">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Layers className="size-3.5" aria-hidden /> Aantal posten
            </p>
            <p className="text-lg font-semibold tabular-nums">{summary.count}</p>
            <p className="text-xs text-muted-foreground">dit jaar vastgelegd</p>
          </CardContent>
        </Card>
      </section>

      {/* Kosten per maand — wanneer piekten je kosten? */}
      {trend.hasData && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold">Kosten per maand</h2>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="size-3.5" aria-hidden />
              Laatste {EXPENSE_TREND_MONTHS} maanden · {formatEuro(trend.totalCents)}
            </span>
          </div>
          <Card>
            <CardContent className="py-4">
              <BarSeries
                data={trend.series.map((m) => ({ key: m.key, label: m.label, value: m.cents }))}
                formatValue={formatEuro}
                height={120}
                tone="accent"
                label="Netto kosten per maand"
              />
              <p className="mt-3 text-xs text-muted-foreground">
                Netto kosten (exclusief btw) per kalendermaand.
              </p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Kosten per categorie — waar gaat je geld heen? */}
      {categoryShares.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Kosten per categorie</h2>
          <Card>
            <CardContent className="space-y-3 py-4">
              {categoryShares.map((c) => (
                <div key={c.category} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span>{categoryLabel(c.category)}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatEuro(c.netCents)} · {c.sharePct}%
                    </span>
                  </div>
                  <div
                    className="h-2 w-full overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-valuenow={c.sharePct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${categoryLabel(c.category)}: ${c.sharePct}% van je kosten`}
                  >
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, c.sharePct)}%` }}
                    />
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Aandeel van je netto kosten dit jaar, per categorie.
              </p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Nieuwe uitgave */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Uitgave toevoegen</h2>
        <Card>
          <CardContent className="py-5">
            <UitgavenForm />
          </CardContent>
        </Card>
      </section>

      {/* Lijst */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold">Vastgelegde uitgaven</h2>
          {expenses.length > 0 && (
            <a
              href="/api/administratie/uitgaven"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
            >
              <Download className="size-3.5" aria-hidden /> Uitgaven CSV
            </a>
          )}
        </div>
        {expenses.length === 0 ? (
          <Card>
            <EmptyState
              icon={Receipt}
              title="Nog geen uitgaven"
              description="Leg hier je zakelijke kosten vast — reiskosten, materiaal, software — zodat je winst en IB-schatting kloppen en je de btw kunt terugvragen."
            />
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              {/* Horizontaal scrollbaar op smalle schermen — de tabel breekt nooit de layout. */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[36rem] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="px-4 py-2.5 font-medium">Datum</th>
                      <th className="px-4 py-2.5 font-medium">Omschrijving</th>
                      <th className="px-4 py-2.5 font-medium">Categorie</th>
                      <th className="px-4 py-2.5 text-right font-medium">Netto</th>
                      <th className="px-4 py-2.5 text-right font-medium">Btw</th>
                      <th className="px-4 py-2.5 text-right font-medium">
                        <span className="sr-only">Acties</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((e) => (
                      <tr key={e.id} className="border-b border-border last:border-0">
                        <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-muted-foreground">
                          {formatDateNl(e.occurredAt)}
                        </td>
                        <td className="px-4 py-2.5">
                          {e.description}
                          {e.kilometers != null && e.kilometers > 0 && (
                            <span className="ml-2 whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              {e.kilometers} km
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                          {categoryLabel(e.category)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">
                          {formatEuro(e.netCents)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                          {formatEuro(e.vatCents)}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex justify-end">
                            <DeleteExpenseButton id={e.id} description={e.description} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
