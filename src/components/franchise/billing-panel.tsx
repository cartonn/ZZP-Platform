import { Download, Info } from "lucide-react";
import { type TenantBillingOverview } from "@/lib/tenant-billing/tenant-billing-overview";
import {
  type TenantFeeLine,
  sortTenantFeeLines,
  tenantFeeStatusLabel,
} from "@/lib/tenant-billing/tenant-fee-lines";
import { type TenantSubscriptionStatus } from "@/lib/enums";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatEuro } from "@/lib/invoices";
import { formatDateShortNl } from "@/lib/format-date";
import { plural } from "@/lib/plural";

const STATUS_LABEL: Record<TenantSubscriptionStatus, string> = {
  ACTIVE: "Actief",
  PAST_DUE: "Betaling open",
  SUSPENDED: "Opgeschort",
};

export function tenantBillingStatusLabel(status: TenantSubscriptionStatus): string {
  return STATUS_LABEL[status];
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

/**
 * Herbruikbaar facturatie-paneel voor één tenant (abonnement + transactie-fees). Wordt gerenderd
 * op de losse /franchise/facturatie-route én als tab in de bemiddeling-hub. Pure presentatie: de
 * aanroeper levert het al tenant-gescopete overzicht; hier wordt niets opnieuw opgehaald.
 */
export function BillingPanel({
  overview,
  feeLines,
}: {
  overview: TenantBillingOverview;
  feeLines: TenantFeeLine[];
}) {
  const lines = sortTenantFeeLines(feeLines);
  return (
    <div className="space-y-6">
      {/* De automatische incasso is nog niet gekoppeld (mensenwerk): het overzicht en de
          fee-berekening draaien, maar er wordt nog niets daadwerkelijk geïncasseerd. De disclaimer
          hoort dus zichtbaar te zijn zolang die koppeling ontbreekt — niet pas wanneer de
          fee-berekening uitstaat (toen verdween hij juist op het moment dat hij nodig was). */}
      <Card>
        <CardContent className="flex gap-3 p-4 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <p className="text-muted-foreground">
            De automatische incasso is nog niet actief. Het overzicht en de berekening zijn
            ingericht en de bedragen hieronder zijn indicatief; er wordt op dit moment nog niets
            daadwerkelijk geïncasseerd.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-2 text-sm font-semibold tracking-tight">Abonnement</h2>
          <div className="divide-y divide-border">
            <Row label="Plan" value={overview.planLabel} />
            <Row label="Per maand" value={formatEuro(overview.monthlyPriceCents)} />
            <Row
              label="Volgende factuurdatum"
              value={formatDateShortNl(overview.nextBillingDate)}
            />
            {overview.status === "PAST_DUE" && (
              <Row label="Achterstallig" value={plural(overview.daysOverdue, "dag", "dagen")} />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-2 text-sm font-semibold tracking-tight">Transactie-fees</h2>
          <div className="divide-y divide-border">
            <Row
              label={`Openstaand (${plural(overview.openFeesCount, "samenwerking", "samenwerkingen")})`}
              value={formatEuro(overview.openFeesCents)}
            />
            <Row label="Reeds gefactureerd" value={formatEuro(overview.invoicedFeesCents)} />
            <Row label="Totaal nu verschuldigd" value={formatEuro(overview.totalDueCents)} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Bedragen exclusief btw.</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold tracking-tight">Fees per samenwerking</h2>
            {lines.length > 0 && (
              <Button asChild size="sm" variant="secondary">
                <a href="/franchise/facturatie/export">
                  <Download className="mr-1.5 size-4" aria-hidden />
                  Exporteren
                </a>
              </Button>
            )}
          </div>
          {lines.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Er zijn nog geen transactie-fees geregistreerd. Zodra een samenwerking gevuld is,
              verschijnt de bijbehorende fee hier.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Opdracht</th>
                    <th className="py-2 pr-3 font-medium">Opdrachtgever</th>
                    <th className="py-2 pr-3 font-medium">ZZP&apos;er</th>
                    <th className="py-2 pr-3 font-medium">Vastgelegd</th>
                    <th className="py-2 pr-3 text-right font-medium">Fee</th>
                    <th className="py-2 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lines.map((l) => (
                    <tr key={l.collaborationId}>
                      <td className="py-2 pr-3">{l.jobTitle}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{l.clientName}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{l.freelancerName ?? "—"}</td>
                      <td className="py-2 pr-3 tabular-nums text-muted-foreground">
                        {formatDateShortNl(l.recordedAt)}
                      </td>
                      <td className="py-2 pr-3 text-right font-medium tabular-nums">
                        {formatEuro(l.feeCents)}
                      </td>
                      <td className="py-2 text-right text-xs text-muted-foreground">
                        {tenantFeeStatusLabel(l.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-muted-foreground">Bedragen exclusief btw.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
