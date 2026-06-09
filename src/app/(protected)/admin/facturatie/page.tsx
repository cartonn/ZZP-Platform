import { type Metadata } from "next";
import { Receipt } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { listPlatformBillingInvoices } from "@/lib/platform-billing/billing-data";
import { formatEuro } from "@/lib/invoices";
import { formatDateShortNl } from "@/lib/format-date";
import { type PlatformBillingStatus } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { generateBillingAction, setBillingStatusAction } from "./actions";

export const metadata: Metadata = { title: "Facturatie · ZZP Platform" };

const KIND_LABEL: Record<string, string> = {
  TENANT_FEE: "Franchise-fee",
  ZZP_MEMBERSHIP: "ZZP-abonnement",
};
const STATUS: Record<
  string,
  { label: string; variant: "muted" | "warning" | "success" | "danger" }
> = {
  DRAFT: { label: "Concept", variant: "muted" },
  SENT: { label: "Verzonden", variant: "warning" },
  PAID: { label: "Betaald", variant: "success" },
  CANCELLED: { label: "Geannuleerd", variant: "danger" },
};

export default async function FacturatiePage() {
  await requireRole("ADMIN");
  const invoices = await listPlatformBillingInvoices();

  const open = invoices.filter((i) => i.status === "DRAFT" || i.status === "SENT");
  const openCents = open.reduce((s, i) => s + i.totalCents, 0);
  const paidCents = invoices
    .filter((i) => i.status === "PAID")
    .reduce((s, i) => s + i.totalCents, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Facturatie"
        description="De facturen van het platform aan franchises (transactie-fee) en ZZP'ers (abonnement). Bundel de openstaande bijdragen en beheer de status. Er wordt nog niets automatisch geïncasseerd."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Openstaand"
          value={formatEuro(openCents)}
          sub={`${open.length} factuur/facturen`}
        />
        <StatCard label="Betaald" value={formatEuro(paidCents)} tone="success" />
        <StatCard label="Totaal facturen" value={invoices.length} />
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <p className="text-sm font-medium">Facturen genereren</p>
            <p className="text-sm text-muted-foreground">
              Bundelt alle openstaande bijdragen tot nieuwe concept-facturen (één per franchise en
              per ZZP&apos;er). Veilig om te herhalen — al gefactureerde bijdragen worden
              overgeslagen.
            </p>
          </div>
          <form action={generateBillingAction}>
            <Button type="submit" size="sm">
              Genereer facturen
            </Button>
          </form>
        </CardContent>
      </Card>

      {invoices.length === 0 ? (
        <Card>
          <EmptyState
            icon={Receipt}
            title="Nog geen facturen"
            description="Zodra er bijdragen openstaan en je op 'Genereer facturen' klikt, verschijnen ze hier."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((i) => {
            const status = i.status as PlatformBillingStatus;
            const s = STATUS[i.status] ?? { label: i.status, variant: "muted" as const };
            return (
              <Card key={i.id}>
                <CardContent className="space-y-2 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {i.number}
                      <Badge variant="default">{KIND_LABEL[i.kind] ?? i.kind}</Badge>
                    </span>
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </div>
                  <p className="text-sm">
                    {i.tenantName ?? i.payerName}
                    {i.tenantName ? ` · ${i.payerName}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {i.periodLabel} · {formatDateShortNl(i.createdAt)} ·{" "}
                    <span className="font-medium text-foreground">{formatEuro(i.totalCents)}</span>{" "}
                    incl. btw
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button asChild variant="ghost" size="sm">
                      <a
                        href={`/api/admin/facturatie/${i.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        PDF
                      </a>
                    </Button>
                    {status === "DRAFT" && (
                      <form action={setBillingStatusAction.bind(null, i.id, "SENT")}>
                        <Button type="submit" variant="secondary" size="sm">
                          Markeer verzonden
                        </Button>
                      </form>
                    )}
                    {status === "SENT" && (
                      <form action={setBillingStatusAction.bind(null, i.id, "PAID")}>
                        <Button type="submit" size="sm">
                          Markeer betaald
                        </Button>
                      </form>
                    )}
                    {(status === "DRAFT" || status === "SENT") && (
                      <form action={setBillingStatusAction.bind(null, i.id, "CANCELLED")}>
                        <Button type="submit" variant="ghost" size="sm">
                          Annuleer
                        </Button>
                      </form>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
