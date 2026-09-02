import { type Metadata } from "next";
import { Handshake, Download } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { hasTenant } from "@/lib/tenancy";
import { type CollaborationStatus } from "@/lib/enums";
import {
  countByStatus,
  filterCollaborations,
  isCollaborationFilterActive,
  parseCollaborationFilter,
  type FilterableCollaboration,
} from "@/lib/collaboration-filter";
import { summarizeCollaborationRenewal } from "@/lib/collaboration-renewal";
import {
  renewalRowBadge,
  summarizeFranchiseCollaborations,
} from "@/lib/franchise/collaboration-oversight";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CollaborationOversightStrip } from "@/components/franchise/collaboration-oversight-strip";
import { formatDateShortNl } from "@/lib/format-date";
import { plural } from "@/lib/plural";

export const metadata: Metadata = { title: "Samenwerkingen · Bemiddeling" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const STATUS: Record<
  CollaborationStatus,
  { label: string; variant: "muted" | "success" | "warning" | "danger" }
> = {
  // prettier-ignore
  PROPOSED: { label: "Voorgesteld", variant: "warning" },
  ACTIVE: { label: "Actief", variant: "success" },
  COMPLETED: { label: "Afgerond", variant: "muted" },
  CANCELLED: { label: "Geannuleerd", variant: "danger" },
};

/** Verrijkte rij: de filterbare velden + alles wat de kaart toont. */
type Row = FilterableCollaboration & {
  id: string;
  departmentName: string | null;
  companyUserId: string;
  contractStatus: string;
  createdAt: Date;
  updatedAt: Date;
  endDate: Date | null;
  disputedAt: Date | null;
  cancellationReason: string | null;
  cancelledAt: Date | null;
  cancelledById: string | null;
  cancellationChargeable: boolean;
};

export default async function FranchiseSamenwerkingenPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const actor = await requireRole("FRANCHISER");
  const sp = await searchParams;

  const collabs = hasTenant(actor)
    ? await prisma.collaboration.findMany({
        where: { job: { tenantId: actor.tenantId } },
        orderBy: { updatedAt: "desc" },
        take: 100,
        include: {
          job: { select: { title: true, department: { select: { name: true } } } },
          company: { select: { name: true, userId: true } },
          freelancer: { select: { user: { select: { name: true } } } },
        },
      })
    : [];

  const rows: Row[] = collabs.map((c) => ({
    id: c.id,
    status: c.status,
    dbaLevel: "",
    jobTitle: c.job.title,
    companyName: c.company.name,
    freelancerName: c.freelancer.user.name ?? "",
    departmentName: c.job.department?.name ?? null,
    companyUserId: c.company.userId,
    contractStatus: c.contractStatus,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    endDate: c.endDate,
    disputedAt: c.disputedAt,
    cancellationReason: c.cancellationReason,
    cancelledAt: c.cancelledAt,
    cancelledById: c.cancelledById,
    cancellationChargeable: c.cancellationChargeable,
  }));

  // Filter de DBA-dimensie bewust niet (die hoort bij het admin-overzicht); status + zoeken volstaat
  // voor het franchise-toezicht. De tellingen lopen over de volledige (ongefilterde) set.
  const filter = parseCollaborationFilter(sp);
  const counts = countByStatus(rows);
  const filterActive = isCollaborationFilterActive(filter);

  // Vervolgsignaal-overzicht over de volledige set (spiegelt de andere franchise-cockpits) + het
  // per-rij vervolgsignaal, uit dezelfde pure bron als de bemiddelaar-next-action → geen drift.
  const now = new Date();
  const oversight = summarizeFranchiseCollaborations(rows, now);
  const visible = filterCollaborations(rows, filter)
    .map((row) => ({
      row,
      renewal: summarizeCollaborationRenewal({
        status: row.status,
        endDate: row.endDate,
        disputed: row.disputedAt !== null,
        now,
      }),
    }))
    // Aandacht bovenaan: eerst voorbij de einddatum, dan het aflopende venster (meest urgent eerst);
    // de rest houdt de bijgewerkt-desc-volgorde (stabiele sort).
    .sort((a, b) => {
      const rank = (phase: string) => (phase === "overdue" ? 0 : phase === "ending_soon" ? 1 : 2);
      const byRank = rank(a.renewal.phase) - rank(b.renewal.phase);
      if (byRank !== 0) return byRank;
      if (a.renewal.attention && b.renewal.attention) {
        return (a.renewal.daysRemaining ?? 0) - (b.renewal.daysRemaining ?? 0);
      }
      return 0;
    });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bemiddeling"
        title="Samenwerkingen"
        description="Toezicht op de samenwerkingen die uit je diensten zijn voortgekomen."
        action={
          <a
            href="/franchise/agenda"
            download="roosteragenda.ics"
            className="focus-ring inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Download className="size-4" aria-hidden />
            Agenda (.ics)
          </a>
        }
      />

      {rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={Handshake}
            title="Nog geen samenwerkingen"
            description="Zodra een ZZP'er op een dienst reageert en je opdrachtgever akkoord gaat, verschijnt de samenwerking hier."
            action={{ label: "Bekijk je diensten", href: "/franchise/diensten" }}
          />
        </Card>
      ) : (
        <>
          <CollaborationOversightStrip summary={oversight} />

          <form
            method="get"
            className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-[1fr_auto_auto]"
          >
            <Input
              name="q"
              defaultValue={filter.q}
              placeholder="Zoek op opdracht, opdrachtgever of ZZP'er…"
              aria-label="Zoeken"
            />
            <Select name="status" defaultValue={filter.status ?? ""} aria-label="Status">
              <option value="">Alle statussen ({counts.all})</option>
              <option value="PROPOSED">Voorgesteld ({counts.PROPOSED})</option>
              <option value="ACTIVE">Actief ({counts.ACTIVE})</option>
              <option value="COMPLETED">Afgerond ({counts.COMPLETED})</option>
              <option value="CANCELLED">Geannuleerd ({counts.CANCELLED})</option>
            </Select>
            <Button type="submit" variant="secondary">
              Filteren
            </Button>
          </form>

          <p className="text-sm text-muted-foreground">
            {filterActive
              ? `${visible.length} van ${plural(rows.length, "samenwerking", "samenwerkingen")}`
              : plural(rows.length, "samenwerking", "samenwerkingen")}
          </p>

          {visible.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                Geen samenwerkingen die overeenkomen met de huidige filters.
              </CardContent>
            </Card>
          ) : (
            <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              {visible.map(({ row: c, renewal }) => {
                const status = STATUS[c.status as CollaborationStatus] ?? STATUS.PROPOSED;
                const renewalBadge = renewalRowBadge(renewal.phase, renewal.daysRemaining);
                return (
                  <div key={c.id} className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{c.jobTitle}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {c.companyName}
                          {c.departmentName ? ` · ${c.departmentName}` : ""} · {c.freelancerName}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          {renewalBadge && (
                            <Badge variant={renewalBadge.tone}>{renewalBadge.label}</Badge>
                          )}
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <span>
                          {c.endDate ? `einddatum ${formatDateShortNl(c.endDate)} · ` : ""}
                          bijgewerkt {formatDateShortNl(c.updatedAt)}
                        </span>
                      </div>
                    </div>
                    {/* Annuleringsregistratie voor het franchise-toezicht: wie, wanneer, waarom —
                        en of de 7-dagen-kostenregel geldt (productbesluit 12-6-2026). */}
                    {c.status === "CANCELLED" && c.cancellationReason && (
                      <div className="rounded-md border border-danger/20 bg-danger/5 px-3 py-2 text-xs">
                        <p className="font-medium">
                          Geannuleerd
                          {c.cancelledAt ? ` op ${formatDateShortNl(c.cancelledAt)}` : ""} door{" "}
                          {c.cancelledById === c.companyUserId ? "de opdrachtgever" : "de ZZP'er"}
                          {c.cancellationChargeable
                            ? " · betalingsverplichting van toepassing"
                            : ""}
                        </p>
                        <p className="mt-0.5 text-muted-foreground">
                          Reden: {c.cancellationReason}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
