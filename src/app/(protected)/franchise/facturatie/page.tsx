import { type Metadata } from "next";
import { Info, ReceiptText } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { getTenantBillingOverview } from "@/lib/franchise/billing";
import { type TenantSubscriptionStatus } from "@/lib/enums";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatEuro } from "@/lib/invoices";
import { formatDateShortNl } from "@/lib/format-date";
import { plural } from "@/lib/plural";

export const metadata: Metadata = { title: "Facturatie · Bemiddeling" };

const STATUS_LABEL: Record<TenantSubscriptionStatus, string> = {
  ACTIVE: "Actief",
  PAST_DUE: "Betaling open",
  SUSPENDED: "Opgeschort",
};
const STATUS_VARIANT: Record<TenantSubscriptionStatus, "success" | "warning" | "danger"> = {
  ACTIVE: "success",
  PAST_DUE: "warning",
  SUSPENDED: "danger",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

export default async function FranchiseFacturatiePage() {
  const actor = await requireRole("FRANCHISER");
  const overview = await getTenantBillingOverview(actor, new Date());

  if (!overview) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Facturatie"
          description="Het abonnement en de fees van je bemiddeling."
        />
        <Card>
          <EmptyState
            icon={ReceiptText}
            title="Geen bemiddeling gekoppeld"
            description="Dit overzicht is beschikbaar zodra je een bemiddeling beheert."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facturatie"
        description="Je abonnement en de transactie-fees per gevulde samenwerking."
        action={
          <Badge variant={STATUS_VARIANT[overview.status]} className="text-sm">
            Abonnement: {STATUS_LABEL[overview.status]}
          </Badge>
        }
      />

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
    </div>
  );
}
