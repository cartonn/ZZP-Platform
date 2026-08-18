import Link from "next/link";
import { formatEuro } from "@/lib/invoices";
import { plural } from "@/lib/plural";
import { type DienstenSummary } from "@/lib/diensten-summary";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Rustige samenvattingsstrip boven de ZZP'er-urenstatenlijst: hoeveel gewerkte waarde wacht op
 * goedkeuring bij de opdrachtgever, hoeveel is goedgekeurd, en wat er nog van de ZZP'er zelf nodig is
 * (concept indienen / afgekeurd herstellen). Display-only; de "nog van jou"-tellingen linken naar het
 * bestaande statusfilter zodat ze direct actioneerbaar zijn.
 */
export function DienstenSummaryStrip({ summary }: { summary: DienstenSummary }) {
  const todoCount = summary.draftCount + summary.rejectedCount;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Card>
        <CardContent className="space-y-1 p-4">
          <p className="text-xs text-muted-foreground">Wacht op goedkeuring</p>
          <p className="text-lg font-semibold tabular-nums">
            {formatEuro(summary.awaitingApprovalCents)}
          </p>
          <p className="text-xs text-muted-foreground">
            {summary.awaitingApprovalCount > 0
              ? `${plural(summary.awaitingApprovalCount, "urenstaat", "urenstaten")} bij je opdrachtgevers`
              : "niets ingediend"}
            {summary.awaitingWithoutAmount > 0
              ? ` · ${summary.awaitingWithoutAmount} zonder tarief nog niet meegerekend`
              : ""}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-1 p-4">
          <p className="text-xs text-muted-foreground">Goedgekeurd</p>
          <p className="text-lg font-semibold tabular-nums">{formatEuro(summary.approvedCents)}</p>
          <p className="text-xs text-muted-foreground">
            {summary.approvedCount > 0
              ? `${plural(summary.approvedCount, "urenstaat", "urenstaten")} vrijgegeven voor facturatie`
              : "nog niets goedgekeurd"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-1 p-4">
          <p className="text-xs text-muted-foreground">Nog van jou</p>
          {todoCount === 0 ? (
            <>
              <p className="text-lg font-semibold tabular-nums">0</p>
              <p className="text-xs text-muted-foreground">niets in te dienen of te herstellen</p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold tabular-nums">{todoCount}</p>
              <p className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                {summary.draftCount > 0 && (
                  <Link
                    href="/diensten?status=DRAFT"
                    className="underline-offset-2 hover:text-foreground hover:underline"
                  >
                    {plural(summary.draftCount, "concept", "concepten")} in te dienen
                  </Link>
                )}
                {summary.rejectedCount > 0 && (
                  <Link
                    href="/diensten?status=REJECTED"
                    className="text-danger underline-offset-2 hover:underline"
                  >
                    {plural(summary.rejectedCount, "afkeuring", "afkeuringen")} te herstellen
                  </Link>
                )}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
