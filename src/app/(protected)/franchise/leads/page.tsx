import { type Metadata } from "next";
import Link from "next/link";
import { Contact, Search } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { tenantScopeWhere } from "@/lib/tenancy";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/enums";
import {
  LEAD_STATUS_LABEL,
  LEAD_STATUS_VARIANT,
  compareLeadsForList,
  daysSinceContact,
  isLeadStale,
  showsContactSilence,
} from "@/lib/leads";
import { summarizeLeadPipeline } from "@/lib/lead-pipeline";
import { LeadPipelineStrip } from "@/components/franchise/lead-pipeline-strip";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateShortNl } from "@/lib/format-date";
import { plural } from "@/lib/plural";
import { LeadComposer } from "./lead-composer";

export const metadata: Metadata = { title: "Leads · Bemiddeling" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const isLeadStatus = (v: string): v is LeadStatus =>
  (LEAD_STATUSES as readonly string[]).includes(v);

export default async function FranchiseLeadsPage({ searchParams }: { searchParams: SearchParams }) {
  const actor = await requireRole("FRANCHISER");
  const sp = await searchParams;
  const statusParam = first(sp.status);
  const statusFilter = isLeadStatus(statusParam) ? statusParam : undefined;
  const q = first(sp.q).trim();
  const hasFilter = Boolean(statusFilter || q);

  // Eén tenant-gescopete query over de héle pijplijn: de samenvatting bovenaan moet de volledige
  // acquisitie tonen, onafhankelijk van het actieve status-/zoekfilter. Filteren + zoeken gebeurt
  // daarna in-memory (leadvolume per franchise is klein) — geen tweede query.
  const rows = await prisma.lead.findMany({
    where: tenantScopeWhere(actor),
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { contacts: true } },
      // Laatste contactmoment bepaalt de stilte-teller (anders: sinds aanmaak).
      contacts: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
    },
  });

  const now = new Date();
  // Verrijk met de "dagen geen contact"-teller en het stilte-signaal (server-side waarheid).
  const enriched = rows.map((l) => {
    const status = l.status as LeadStatus;
    const stillDays = daysSinceContact(now, l.createdAt, l.contacts[0]?.createdAt ?? null);
    return { ...l, status, stillDays, stale: isLeadStale(status, stillDays) };
  });

  // Volledige-pijplijn-samenvatting (per-stadium, aandacht = stil/te-laat, conversie) — over álle
  // leads, niet enkel de gefilterde weergave.
  const summary = summarizeLeadPipeline(
    enriched.map((l) => ({
      status: l.status,
      daysSinceContact: l.stillDays,
      nextFollowUp: l.nextFollowUp,
    })),
    now,
  );

  // Pas het gekozen status-/zoekfilter toe op de weergavelijst en sorteer stille warme leads
  // bovenaan via de pure comparator (zoeken case-insensitief op organisatie of contactpersoon).
  const qLower = q.toLowerCase();
  const leads = enriched
    .filter((l) => (statusFilter ? l.status === statusFilter : true))
    .filter((l) =>
      q
        ? l.organizationName.toLowerCase().includes(qLower) ||
          (l.contactName?.toLowerCase().includes(qLower) ?? false)
        : true,
    )
    .sort((a, b) =>
      compareLeadsForList(
        { status: a.status, daysSinceContact: a.stillDays, createdAt: a.createdAt },
        { status: b.status, daysSinceContact: b.stillDays, createdAt: b.createdAt },
      ),
    );

  // Een opvolgdatum vóór vandaag is "te laat" (op dagniveau, UTC-datuminvoer).
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const isOverdue = (d: Date | null) =>
    !!d && Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) < todayUTC;

  const tabs: { label: string; href: string; active: boolean }[] = [
    { label: "Alle", href: "/franchise/leads", active: !statusFilter },
    ...LEAD_STATUSES.map((s) => ({
      label: LEAD_STATUS_LABEL[s],
      href: `/franchise/leads?status=${s}`,
      active: statusFilter === s,
    })),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Je acquisitie-pijplijn: organisaties die je nog wilt binnenhalen, met hun contactgeschiedenis."
      />

      <LeadPipelineStrip summary={summary} />

      <LeadComposer />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((t) => (
            <Button key={t.href} asChild size="sm" variant={t.active ? "secondary" : "ghost"}>
              <Link href={t.href}>{t.label}</Link>
            </Button>
          ))}
        </div>
        <form className="relative" action="/franchise/leads">
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Zoek op organisatie of contact"
            className="h-9 w-56 pl-8"
            aria-label="Zoek leads"
          />
        </form>
      </div>

      {leads.length === 0 ? (
        <Card>
          <EmptyState
            icon={Contact}
            title={hasFilter ? "Geen leads gevonden" : "Nog geen leads"}
            description={
              hasFilter
                ? "Pas je filter of zoekopdracht aan."
                : "Leg je eerste prospect vast en houd de contactgeschiedenis bij tot hij klant wordt."
            }
          />
        </Card>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {leads.map((l) => (
            <Link
              key={l.id}
              href={`/franchise/leads/${l.id}`}
              className="card-interactive flex items-start justify-between gap-3 p-4"
            >
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <p className="truncate font-medium">{l.organizationName}</p>
                  <Badge variant={LEAD_STATUS_VARIANT[l.status]} className="shrink-0">
                    {LEAD_STATUS_LABEL[l.status]}
                  </Badge>
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {l.contactName || l.email || "Geen contactpersoon"}
                </p>
                {/* Stiltemeter alleen bij een actieve lead (koud/warm): bij een afgevallen of
                    binnengehaalde lead is "X dagen geen contact" betekenisloos en leest het als een
                    openstaande actie. Zelfde definitie als het "X stil"-signaal in de samenvatting. */}
                {showsContactSilence(l.status) && (
                  <p
                    className={`mt-0.5 text-xs ${l.stale ? "font-medium text-warning" : "text-muted-foreground"}`}
                  >
                    {l.stillDays === 0
                      ? "Vandaag nog contact gehad"
                      : `${plural(l.stillDays, "dag", "dagen")} geen contact`}
                  </p>
                )}
                {l.nextFollowUp && (
                  <p
                    className={`mt-0.5 text-xs ${isOverdue(l.nextFollowUp) ? "font-medium text-danger" : "text-muted-foreground"}`}
                  >
                    Opvolgen: {formatDateShortNl(l.nextFollowUp)}
                    {isOverdue(l.nextFollowUp) && " — te laat"}
                  </p>
                )}
              </div>
              <p className="shrink-0 text-right text-xs text-muted-foreground">
                {plural(l._count.contacts, "notitie", "notities")}
                <br />
                sinds {formatDateShortNl(l.createdAt)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
