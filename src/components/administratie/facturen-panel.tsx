import Link from "next/link";
import { Plus, Receipt } from "lucide-react";
import { type Actor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { formatEuro, invoiceableCollaborationsWhere } from "@/lib/invoices";
import { isInvoiceOutstanding } from "@/lib/administration/outstanding";
import { invoiceDueStatus } from "@/lib/invoice-due";
import { type InvoiceStatus } from "@/lib/enums";
import { type InvoiceLifecycleState } from "@/lib/lifecycles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { withParams } from "@/components/admin/base-path";
import {
  INVOICE_FILTER_LABEL,
  INVOICE_FILTER_ORDER,
  filterInvoices,
  parseInvoiceFilter,
  summarizeInvoiceGroups,
} from "@/lib/invoice-filter";

const CASCADE_LABEL: Record<
  InvoiceLifecycleState,
  { label: string; variant: "muted" | "warning" | "success" | "danger" }
> = {
  DRAFT: { label: "Concept", variant: "muted" },
  SUBMITTED: { label: "Ingediend", variant: "warning" },
  APPROVED: { label: "Goedgekeurd", variant: "success" },
  PAID: { label: "Betaald", variant: "success" },
  PROCESSED: { label: "Verwerkt", variant: "muted" },
  REJECTED: { label: "Afgekeurd", variant: "danger" },
  OVERDUE: { label: "Te laat", variant: "danger" },
  CREDITED: { label: "Gecrediteerd", variant: "danger" },
};

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/**
 * Facturen-paneel: opgestelde/ontvangen facturen van de actor (rol-bewust). Laadt zelf zijn data,
 * rendert geen eigen paginakop — de route en de Administratie-hub leveren de titel. Filtert op
 * status (concept/openstaand/betaald/afgehandeld) via de `status`-searchParam; de filter-pills
 * wijzen naar `basePath` (mag al een query bevatten, bv. `/financien?tab=facturen`) zodat het paneel
 * zowel standalone op `/facturen` als binnen de Administratie-hub werkt.
 */
export async function FacturenPanel({
  actor,
  searchParams = {},
  basePath = "/facturen",
}: {
  actor: Actor;
  searchParams?: Record<string, string | string[] | undefined>;
  basePath?: string;
}) {
  const isFreelancer = actor.role === "FREELANCER";
  const activeFilter = parseInvoiceFilter(first(searchParams.status));

  const where = isFreelancer
    ? { collaboration: { freelancer: { userId: actor.id } } }
    : { collaboration: { company: { userId: actor.id } } };

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      collaboration: {
        select: {
          job: { select: { title: true } },
          company: { select: { name: true } },
          freelancer: { select: { user: { select: { name: true } } } },
        },
      },
    },
  });

  const paidCents = invoices.reduce(
    (sum, inv) => (inv.status === "PAID" ? sum + inv.totalCents : sum),
    0,
  );
  // Cascade-bewust: cascade-facturen blijven status='DRAFT' en gelden als openstaand op hun
  // lifecycleStatus (SUBMITTED/APPROVED/OVERDUE) — alleen op `status` filteren mist ze allemaal.
  const openCents = invoices.reduce(
    (sum, inv) => (isInvoiceOutstanding(inv) ? sum + inv.totalCents : sum),
    0,
  );

  // "Nieuwe factuur" alleen tonen als er écht een samenwerking is om een LOSSE factuur uit op te
  // stellen (niet in de cascade). Anders loopt de knop dood op een lege keuzelijst — dezelfde regel
  // als /facturen/nieuw, gedeeld via invoiceableCollaborationsWhere.
  const canInvoice =
    isFreelancer &&
    (await prisma.collaboration.count({ where: invoiceableCollaborationsWhere(actor.id) })) > 0;

  // Tellingen over de volledige lijst (voor de pill-labels); gefilterde lijst voor de weergave.
  const groupCounts = summarizeInvoiceGroups(invoices);
  const filtered = filterInvoices(invoices, activeFilter);

  return (
    <div className="space-y-6">
      {canInvoice && (
        <div className="flex justify-end">
          <Button asChild>
            <Link href="/facturen/nieuw">
              <Plus className="size-4" aria-hidden /> Nieuwe factuur
            </Link>
          </Button>
        </div>
      )}

      {invoices.length > 0 && (
        <div className="flex gap-3">
          <Card className="flex-1">
            <CardContent className="space-y-1 p-4">
              <p className="text-xs text-muted-foreground">Betaald</p>
              <p className="text-lg font-semibold tabular-nums">{formatEuro(paidCents)}</p>
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardContent className="space-y-1 p-4">
              <p className="text-xs text-muted-foreground">Openstaand</p>
              <p className="text-lg font-semibold tabular-nums">{formatEuro(openCents)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {invoices.length === 0 ? (
        <Card>
          <EmptyState
            icon={Receipt}
            title={isFreelancer ? "Nog geen facturen" : "Nog geen facturen ontvangen"}
            description={
              isFreelancer
                ? canInvoice
                  ? "Stel een factuur op vanuit een actieve samenwerking."
                  : "Zodra een opdracht tot een samenwerking leidt, kun je hier factureren."
                : undefined
            }
            action={
              isFreelancer
                ? canInvoice
                  ? { label: "Factuur opstellen", href: "/facturen/nieuw" }
                  : { label: "Bekijk opdrachten", href: "/opdrachten" }
                : undefined
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Statusfilter — pills wijzen naar basePath zodat ze binnen de hub-tab blijven. */}
          <div className="flex flex-wrap gap-1.5">
            {INVOICE_FILTER_ORDER.map((group) => {
              const active = activeFilter === group;
              return (
                <Link
                  key={group}
                  href={group === "all" ? basePath : withParams(basePath, { status: group })}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "focus-ring inline-flex items-center rounded-md border px-3 py-1 text-sm transition-colors",
                    active
                      ? "border-accent-foreground/20 bg-accent text-accent-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-muted",
                  ].join(" ")}
                >
                  {INVOICE_FILTER_LABEL[group]} ({groupCounts[group]})
                </Link>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                Geen facturen met deze status.
              </CardContent>
            </Card>
          ) : (
            <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              {filtered.map((inv) => {
                const cascade = inv.lifecycleStatus != null;
                // Een rij in de facturenlijst toont factuurnummer + bedrag; klikken hoort het
                // factuurdetail te openen (met PDF/print), niet onverwacht naar het werkproces te springen.
                const href = `/facturen/${inv.id}`;
                const cascadeMeta = cascade
                  ? CASCADE_LABEL[inv.lifecycleStatus as InvoiceLifecycleState]
                  : null;
                const displayNumber = cascade
                  ? (inv.partyInvoiceNumber ?? "Concept-factuur")
                  : inv.number;
                // Real-time vervaldatum-aftelling voor een openstaande factuur; alleen tonen wanneer ze
                // aandacht vraagt (binnenkort verschuldigd of te laat), om de lijst rustig te houden.
                const due = invoiceDueStatus({
                  dueAt: inv.dueAt,
                  outstanding: isInvoiceOutstanding(inv),
                });
                const showDue = due != null && due.variant !== "muted";
                return (
                  <Link
                    key={inv.id}
                    href={href}
                    className="card-interactive flex items-center justify-between gap-4 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium tabular-nums">{displayNumber}</p>
                        {cascadeMeta ? (
                          <Badge variant={cascadeMeta.variant}>{cascadeMeta.label}</Badge>
                        ) : (
                          <InvoiceStatusBadge
                            status={inv.status as InvoiceStatus}
                            dueAt={inv.dueAt}
                          />
                        )}
                        {showDue && <Badge variant={due.variant}>{due.label}</Badge>}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {isFreelancer
                          ? inv.collaboration?.company.name
                          : inv.collaboration?.freelancer.user.name}
                        {inv.collaboration?.job.title ? ` · ${inv.collaboration.job.title}` : ""}
                        {cascade ? " · via werkproces" : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-semibold tabular-nums">
                        {formatEuro(inv.totalCents)}
                      </span>
                      <span className="block text-[10px] text-muted-foreground">incl. btw</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
