import { Handshake } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatMonthYearNl } from "@/lib/format-date";
import { sharedHistoryLabel, type SharedHistory } from "@/lib/candidate-history";

/**
 * Compacte chip die toont dat deze kandidaat al eerder met de opdrachtgever heeft samengewerkt —
 * een sterk, laag-risico vertrouwenssignaal bij de beslissing. De afronddatum staat in de tooltip
 * zodat de kop compact blijft. Rendert niets bij ontbrekende historie.
 */
export function CandidateHistoryBadge({
  history,
  className,
}: {
  history: SharedHistory | undefined;
  className?: string;
}) {
  if (!history || history.count < 1) return null;
  const last = history.lastCompletedAt ? formatMonthYearNl(history.lastCompletedAt) : null;
  return (
    <Badge
      variant="success"
      className={className}
      title={last ? `Laatst afgerond: ${last}` : undefined}
    >
      <Handshake className="mr-1 size-3" aria-hidden /> {sharedHistoryLabel(history.count)}
    </Badge>
  );
}
