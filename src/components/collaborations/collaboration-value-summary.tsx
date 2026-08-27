import { Banknote } from "lucide-react";
import { formatEuro } from "@/lib/invoices";
import { Card, CardContent } from "@/components/ui/card";
import type { CollaborationValueSummary } from "@/lib/collaboration-value";

function formatHours(hours: number): string {
  return hours.toLocaleString("nl-NL", { maximumFractionDigits: 2 });
}

/**
 * Compact waarde-/voortgangsoverzicht van één samenwerking: goedgekeurd werk, betaald, openstaand en
 * (indien aanwezig) nog in concept. Presentationeel — de cijfers komen kant-en-klaar uit
 * `summarizeCollaborationValue` (server-side waarheid). Rendert niets als er nog niets te tonen valt.
 */
export function CollaborationValueSummary({ summary }: { summary: CollaborationValueSummary }) {
  const workParts: string[] = [];
  if (summary.approvedHours > 0) workParts.push(`${formatHours(summary.approvedHours)} uur`);
  if (summary.approvedDeliverables > 0) {
    workParts.push(
      `${summary.approvedDeliverables} ${summary.approvedDeliverables === 1 ? "oplevering" : "opleveringen"}`,
    );
  }

  const cells: React.ReactNode[] = [];

  cells.push(
    <div key="werk" className="min-w-[140px] flex-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Goedgekeurd
      </p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">
        {workParts.length > 0 ? workParts.join(" · ") : "Nog niets"}
      </p>
      {summary.pendingPerformances > 0 && (
        <p className="mt-0.5 text-xs tabular-nums text-warning">
          {summary.pendingPerformances} nog ter goedkeuring
        </p>
      )}
    </div>,
  );

  cells.push(
    <div key="betaald" className="min-w-[140px] flex-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Betaald</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{formatEuro(summary.paidCents)}</p>
    </div>,
  );

  cells.push(
    <div key="openstaand" className="min-w-[140px] flex-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Openstaand
      </p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">
        {formatEuro(summary.outstandingCents)}
      </p>
      {summary.overdueCents > 0 && (
        <p className="mt-0.5 text-xs font-medium tabular-nums text-danger">
          waarvan {formatEuro(summary.overdueCents)} te laat
        </p>
      )}
    </div>,
  );

  if (summary.draftCents > 0) {
    cells.push(
      <div key="concept" className="min-w-[140px] flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Concept</p>
        <p className="mt-0.5 text-lg font-semibold tabular-nums text-muted-foreground">
          {formatEuro(summary.draftCents)}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">nog in te dienen</p>
      </div>,
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="flex items-center gap-2">
          <Banknote className="size-4 text-muted-foreground" aria-hidden />
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Waarde van deze samenwerking
          </h2>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3">{cells}</div>
      </CardContent>
    </Card>
  );
}
