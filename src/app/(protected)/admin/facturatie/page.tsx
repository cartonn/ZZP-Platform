import { type Metadata } from "next";
import Link from "next/link";
import { Receipt } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { listPlatformBillingInvoices } from "@/lib/platform-billing/billing-data";
import { agingFor, summarizeAging } from "@/lib/platform-billing/aging";
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
  TENANT_FEE: "Bemiddelingsfee",
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

const VALID_STATUSES = ["DRAFT", "SENT", "PAID", "CANCELLED"] as const;
type ValidStatus = (typeof VALID_STATUSES)[number];

function isValidStatus(s: string | undefined): s is ValidStatus {
  return VALID_STATUSES.includes(s as ValidStatus);
}

const FILTER_TABS: { label: string; value: ValidStatus | null }[] = [
  { label: "Alle", value: null },
  { label: "Concept", value: "DRAFT" },
  { label: "Verzonden", value: "SENT" },
  { label: "Betaald", value: "PAID" },
  { label: "Geannuleerd", value: "CANCELLED" },
];

export default async function FacturatiePage({
  searchParams,
}: {
  searchParams: Promise<{ gegenereerd?: string; status?: string }>;
}) {
  await requireRole("ADMIN");
  const [{ gegenereerd, status: statusParam }, invoices] = await Promise.all([
    searchParams,
    listPlatformBillingInvoices(),
  ]);
  const generated = gegenereerd != null ? Number(gegenereerd) : null;
  const now = new Date();

  const activeStatus: ValidStatus | null = isValidStatus(statusParam) ? statusParam : null;

  // KPI berekeningen over de volledige lijst
  const open = invoices.filter((i) => i.status === "DRAFT" || i.status === "SENT");
  const openCents = open.reduce((s, i) => s + i.totalCents, 0);
  const paidCents = invoices
    .filter((i) => i.status === "PAID")
    .reduce((s, i) => s + i.totalCents, 0);

  // Counts per status (volledige lijst)
  const counts = {
    all: invoices.length,
    DRAFT: invoices.filter((i) => i.status === "DRAFT").length,
    SENT: invoices.filter((i) => i.status === "SENT").length,
    PAID: invoices.filter((i) => i.status === "PAID").length,
    CANCELLED: invoices.filter((i) => i.status === "CANCELLED").length,
  };

  // Gefilterde lijst voor de weergave
  const filtered = activeStatus ? invoices.filter((i) => i.status === activeStatus) : invoices;

  // Aging-samenvatting over de volledige lijst
  const aging = summarizeAging(invoices, now);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Facturatie"
        description="De facturen van het platform aan bemiddelingen (transactie-fee) en ZZP'ers (abonnement). Bundel de openstaande bijdragen en beheer de status. Er wordt nog niets automatisch geïncasseerd."
      />

      {generated != null && Number.isFinite(generated) && (
        <Card>
          <CardContent className="py-3 text-sm">
            {generated > 0
              ? `${generated} nieuwe ${generated === 1 ? "factuur" : "facturen"} aangemaakt.`
              : "Geen nieuwe facturen — alle openstaande bijdragen waren al gefactureerd."}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard
          label="Openstaand"
          value={formatEuro(openCents)}
          sub={`${open.length} factuur/facturen`}
        />
        <StatCard label="Betaald" value={formatEuro(paidCents)} tone="success" />
        <StatCard label="Totaal facturen" value={invoices.length} />
        <StatCard
          label="Te lang open"
          value={aging.overdueCount}
          sub={formatEuro(aging.overdueCents)}
          tone={aging.overdueCount > 0 ? "warning" : "default"}
        />
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <p className="text-sm font-medium">Facturen genereren</p>
            <p className="text-sm text-muted-foreground">
              Bundelt alle openstaande bijdragen tot nieuwe concept-facturen (één per bemiddeling en
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
          {/* Filter-tabs */}
          <div className="flex flex-wrap gap-1.5">
            {FILTER_TABS.map((tab) => {
              const active = activeStatus === tab.value;
              return (
                <Link
                  key={tab.label}
                  href={tab.value ? `/admin/facturatie?status=${tab.value}` : "/admin/facturatie"}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "focus-ring inline-flex items-center rounded-md border px-3 py-1 text-sm transition-colors",
                    active
                      ? "border-accent-foreground/20 bg-accent text-accent-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-muted",
                  ].join(" ")}
                >
                  {tab.label} ({tab.value ? counts[tab.value] : counts.all})
                </Link>
              );
            })}
          </div>

          {/* Lege staat bij filter zonder resultaten */}
          {filtered.length === 0 && invoices.length > 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                Geen facturen met deze status.
              </CardContent>
            </Card>
          ) : (
            filtered.map((i) => {
              const status = i.status as PlatformBillingStatus;
              const s = STATUS[i.status] ?? { label: i.status, variant: "muted" as const };
              const a = agingFor(i, now);
              return (
                <Card key={i.id}>
                  <CardContent className="space-y-2 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        {i.number}
                        <Badge variant="default">{KIND_LABEL[i.kind] ?? i.kind}</Badge>
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant={s.variant}>{s.label}</Badge>
                        {a.overdue ? (
                          <Badge variant="warning">
                            Betaaltermijn verlopen · {a.daysOverdue} d
                          </Badge>
                        ) : i.status === "SENT" && a.daysOutstanding != null ? (
                          <span className="text-xs text-muted-foreground">
                            {a.daysOutstanding} dagen open
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <p className="text-sm">
                      {i.tenantName ?? i.payerName}
                      {i.tenantName ? ` · ${i.payerName}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {i.periodLabel} · {formatDateShortNl(i.createdAt)} ·{" "}
                      <span className="font-medium text-foreground">
                        {formatEuro(i.totalCents)}
                      </span>{" "}
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
            })
          )}
        </div>
      )}
    </div>
  );
}
