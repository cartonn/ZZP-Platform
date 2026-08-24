import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEuro } from "@/lib/invoices";
import {
  agingBucketBadgeVariant,
  type ClientFinancialRelation,
} from "@/lib/franchise/client-financials";

/**
 * "Financiële relatie" op het opdrachtgever-detail van de bemiddelaar. Presentationeel: alle waarden
 * (openstaand, te-laat, betaalreputatie, cijfers) komen server-side uit `buildClientFinancialRelation`.
 * Herstelt de financiële context die op de opdrachtgeverslijst wél per rij stond maar op het detail
 * wegviel. Rendert niets zonder signaal (`hasAny=false`) zodat een verse klant rustig blijft.
 */
export function ClientFinancialRelationCard({ relation }: { relation: ClientFinancialRelation }) {
  if (!relation.hasAny) return null;

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-tight">Financiële relatie</h2>
          {relation.paymentChip && (
            <Badge variant={relation.paymentChip.tone === "good" ? "success" : "warning"}>
              {relation.paymentChip.label}
            </Badge>
          )}
        </div>

        {relation.hasOutstanding ? (
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <div>
              <p className="text-xs text-muted-foreground">Openstaand bij je pool</p>
              <p className="text-lg font-semibold tabular-nums">
                {formatEuro(relation.totalOpenCents)}
              </p>
            </div>
            {relation.overdueCount > 0 && relation.worstBucket ? (
              <Badge variant={agingBucketBadgeVariant(relation.worstBucket)}>
                {formatEuro(relation.overdueCents)} te laat
              </Badge>
            ) : (
              <p className="text-sm text-muted-foreground">Niets te laat</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Geen openstaande posten.</p>
        )}

        {relation.historySentence && (
          <p className="text-sm text-muted-foreground">{relation.historySentence}</p>
        )}
      </CardContent>
    </Card>
  );
}
