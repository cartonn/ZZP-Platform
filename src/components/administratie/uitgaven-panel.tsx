import { Layers, Receipt, ReceiptText } from "lucide-react";
import { type Actor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { formatEuro } from "@/lib/invoices";
import { EXPENSE_CATEGORY_LABEL, summarizeExpenses, type ExpenseCategory } from "@/lib/expense";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { UitgavenForm, DeleteExpenseButton } from "@/components/administratie/uitgaven-form";

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
  const expenses = await prisma.expense.findMany({
    where: { userId: actor.id },
    orderBy: { occurredAt: "desc" },
    take: 200,
  });

  const summary = summarizeExpenses(expenses, { year: new Date().getUTCFullYear() });

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
        <h2 className="text-sm font-semibold">Vastgelegde uitgaven</h2>
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
                        <td className="px-4 py-2.5">{e.description}</td>
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
