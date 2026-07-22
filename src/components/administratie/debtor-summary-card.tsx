import { getTranslator } from "@/lib/i18n/server";
import { Users } from "lucide-react";
import { formatEuro } from "@/lib/invoices";
import { type DebtorSummary } from "@/lib/debtor-summary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Debiteuren-overzicht: openstaand saldo per opdrachtgever voor de ZZP'er. Vertaalt de enkele
 * "Openstaand"-totaalkaart naar "wie moet mij nog hoeveel betalen" met te-laat-signaal en
 * ouderdom. Read-only, geen mutatie; render alleen wanneer `shouldShowDebtorSummary` waar is.
 */
export async function DebtorSummaryCard({ summary }: { summary: DebtorSummary }) {
  const { t } = await getTranslator();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Users className="size-4 text-muted-foreground" aria-hidden />
          {t("Openstaand per opdrachtgever")}
        </CardTitle>
        {summary.totalOverdueCents > 0 && (
          <Badge variant="danger">
            {formatEuro(summary.totalOverdueCents)} {t("te laat")}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {summary.debtors.map((d) => (
            <li key={d.companyId} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{d.companyName}</p>
                <p className="text-xs text-muted-foreground">
                  {d.invoiceCount}{" "}
                  {d.invoiceCount === 1 ? t("openstaande factuur") : t("openstaande facturen")}
                  {d.oldestDaysOutstanding != null && d.oldestDaysOutstanding > 0
                    ? ` · ${t("langst open")} ${d.oldestDaysOutstanding} ${d.oldestDaysOutstanding === 1 ? t("dag") : t("dagen")}`
                    : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-sm font-semibold tabular-nums">
                  {formatEuro(d.outstandingCents)}
                </span>
                {d.overdueCents > 0 && (
                  <Badge variant="danger">
                    {d.overdueCount}{" "}
                    {d.overdueCount === 1 ? t("factuur te laat") : t("facturen te laat")}
                  </Badge>
                )}
                {/* Aanmaningsniveau (config-label, geen los te vertalen UI-string): toont hoe ver de
                    langst-te-late factuur op de aanmaningsladder staat, zodat de ZZP'er kan
                    prioriteren wie hij het hardst moet nabellen. */}
                {d.dunningLabel && (
                  <span className="text-xs text-muted-foreground">{d.dunningLabel}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
