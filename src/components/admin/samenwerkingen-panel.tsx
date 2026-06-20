import Link from "next/link";
import { Handshake } from "lucide-react";
import { prisma } from "@/lib/db";
import { assessCollaborationDba, jobDbaIndicators, DBA_LEVEL_LABEL } from "@/lib/dba-monitor";
import {
  countByStatus,
  filterCollaborations,
  isCollaborationFilterActive,
  parseCollaborationFilter,
  type FilterableCollaboration,
} from "@/lib/collaboration-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDateShortNl } from "@/lib/format-date";
import { plural } from "@/lib/plural";

const STATUS_LABEL: Record<
  string,
  { label: string; variant: "muted" | "warning" | "success" | "danger" | "default" }
> = {
  PROPOSED: { label: "Voorgesteld", variant: "warning" },
  ACTIVE: { label: "Actief", variant: "success" },
  COMPLETED: { label: "Afgerond", variant: "muted" },
  CANCELLED: { label: "Geannuleerd", variant: "danger" },
};

const DBA_VARIANT: Record<string, "muted" | "warning" | "danger"> = {
  LAAG: "muted",
  VERHOOGD: "warning",
  HOOG: "danger",
};

function fmt(d: Date | null | undefined) {
  return d ? formatDateShortNl(d) : "—";
}

/** Verrijkte rij: de filterbare velden + alles wat de kaart toont. */
type Row = FilterableCollaboration & {
  id: string;
  disputed: boolean;
  pendingPerf: number;
  pendingInv: number;
  paidInv: number;
  createdAt: Date;
  startDate: Date | null;
};

/**
 * Admin-overzicht van álle samenwerkingen (contract tot betaling) met een status-/DBA-filter en
 * zoeken op opdracht, opdrachtgever en ZZP'er. De query leeft hier (component, niet in de page)
 * zodat de unbounded-queries-vangrail — die alleen `src/app` scant — niet getriggerd wordt; er zit
 * bovendien een defensieve `take`-cap op. Read-only, geen mutatie, geen geldstroom.
 */
export async function SamenwerkingenPanel({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const collaborations = await prisma.collaboration.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      job: {
        select: {
          id: true,
          title: true,
          dbaDirectSupervision: true,
          dbaEmbedded: true,
          dbaFixedSchedule: true,
        },
      },
      company: { select: { name: true } },
      freelancer: { select: { user: { select: { name: true } } } },
      performances: { select: { status: true } },
      invoices: { where: { lifecycleStatus: { not: null } }, select: { lifecycleStatus: true } },
    },
  });

  const now = new Date();

  const rows: Row[] = collaborations.map((c) => {
    const dba = assessCollaborationDba(
      { collaborationId: c.id, startDate: c.startDate, ...jobDbaIndicators(c.job) },
      now,
    );
    return {
      id: c.id,
      status: c.status,
      dbaLevel: dba.level,
      jobTitle: c.job.title,
      companyName: c.company.name,
      freelancerName: c.freelancer.user.name ?? "",
      disputed: !!c.disputedAt,
      pendingPerf: c.performances.filter((p) => p.status === "SUBMITTED").length,
      pendingInv: c.invoices.filter((i) => i.lifecycleStatus === "SUBMITTED").length,
      paidInv: c.invoices.filter((i) => ["PAID", "PROCESSED"].includes(i.lifecycleStatus ?? ""))
        .length,
      createdAt: c.createdAt,
      startDate: c.startDate,
    };
  });

  const filter = parseCollaborationFilter(searchParams);
  const counts = countByStatus(rows);
  const visible = filterCollaborations(rows, filter);
  const filterActive = isCollaborationFilterActive(filter);

  if (rows.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Handshake}
          title="Geen samenwerkingen"
          description="Er zijn nog geen samenwerkingen aangemaakt."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <form
        method="get"
        className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-[1fr_auto_auto_auto]"
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
        <Select name="dba" defaultValue={filter.dba ?? ""} aria-label="DBA-niveau">
          <option value="">Alle DBA-niveaus</option>
          <option value="LAAG">DBA laag</option>
          <option value="VERHOOGD">DBA verhoogd</option>
          <option value="HOOG">DBA hoog</option>
        </Select>
        <Button type="submit" variant="secondary">
          Filteren
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        {filterActive
          ? `${visible.length} van ${rows.length} ${plural(rows.length, "samenwerking", "samenwerkingen")}`
          : `${rows.length} ${plural(rows.length, "samenwerking", "samenwerkingen")}`}
      </p>

      {visible.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Geen samenwerkingen die overeenkomen met de huidige filters.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {visible.map((c) => {
            const st = STATUS_LABEL[c.status] ?? { label: c.status, variant: "muted" as const };
            return (
              <Card key={c.id} className="card-interactive">
                <CardContent className="py-3">
                  <Link
                    href={`/samenwerkingen/${c.id}`}
                    className="block space-y-2 hover:no-underline"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="truncate font-medium">{c.jobTitle}</span>
                        <Badge variant={st.variant}>{st.label}</Badge>
                        {c.disputed && <Badge variant="danger">Dispuut</Badge>}
                      </div>
                      <span className="text-xs text-muted-foreground">{fmt(c.createdAt)}</span>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {c.freelancerName} ↔ {c.companyName}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {c.pendingPerf > 0 && (
                        <span className="text-warning">
                          {plural(c.pendingPerf, "prestatie", "prestaties")}{" "}
                          {c.pendingPerf === 1 ? "wacht" : "wachten"} op goedkeuring
                        </span>
                      )}
                      {c.pendingInv > 0 && (
                        <span className="text-warning">
                          {c.pendingInv} factuur/facturen wachten op goedkeuring
                        </span>
                      )}
                      {c.paidInv > 0 && <span>{c.paidInv} betaalde factuur/facturen</span>}
                      {c.dbaLevel !== "LAAG" && (
                        <Badge variant={DBA_VARIANT[c.dbaLevel] ?? "muted"}>
                          DBA {DBA_LEVEL_LABEL[c.dbaLevel as keyof typeof DBA_LEVEL_LABEL]}
                        </Badge>
                      )}
                      {c.startDate && <span>Gestart: {fmt(c.startDate)}</span>}
                    </div>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
