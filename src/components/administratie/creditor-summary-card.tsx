import { Users } from "lucide-react";
import { formatEuro } from "@/lib/invoices";
import { type CreditorSummary } from "@/lib/creditor-summary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Crediteuren-overzicht: te betalen saldo per leverancier voor de opdrachtgever. Vertaalt de enkele
 * "Totaal openstaand"-kaart naar "aan wie moet ik hoeveel betalen" met een te-laat-signaal en de
 * eerstvolgende vervaldatum. Read-only, geen mutatie; render alleen wanneer
 * `shouldShowCreditorSummary` waar is. Spiegel van de ZZP'er-`DebtorSummaryCard`.
 */
export function CreditorSummaryCard({ summary }: { summary: CreditorSummary }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Users className="size-4 text-muted-foreground" aria-hidden />
          Te betalen per leverancier
        </CardTitle>
        {summary.totalOverdueCents > 0 && (
          <Badge variant="danger">{formatEuro(summary.totalOverdueCents)} te laat</Badge>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {summary.creditors.map((c) => (
            <li key={c.supplierId} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{c.supplierName}</p>
                <p className="text-xs text-muted-foreground">
                  {c.invoiceCount}{" "}
                  {c.invoiceCount === 1 ? "openstaande factuur" : "openstaande facturen"}
                  {c.awaitingApprovalCents > 0
                    ? ` · ${formatEuro(c.awaitingApprovalCents)} goed te keuren`
                    : c.earliestDueDate != null && c.daysUntilEarliestDue != null
                      ? c.daysUntilEarliestDue <= 0
                        ? " · vervalt vandaag"
                        : ` · vervalt over ${c.daysUntilEarliestDue} ${c.daysUntilEarliestDue === 1 ? "dag" : "dagen"}`
                      : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-sm font-semibold tabular-nums">
                  {formatEuro(c.outstandingCents)}
                </span>
                {c.overdueCents > 0 && (
                  <Badge variant="danger">
                    {c.overdueCount} {c.overdueCount === 1 ? "factuur te laat" : "facturen te laat"}
                  </Badge>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
