import { type Metadata } from "next";
import Link from "next/link";
import { Clock, ArrowRight, AlertTriangle, UserCheck } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { tenantScopeWhere } from "@/lib/tenancy";
import { type JobStatus } from "@/lib/enums";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { plural } from "@/lib/plural";
import { buildDekkingsprognose, startOfIsoWeek } from "@/lib/franchise/dekkingsprognose";
import { getRosterFillSignals, dienstFillChip } from "@/lib/franchise/dienst-fill-signal";

export const metadata: Metadata = { title: "Diensten · Bemiddeling" };

const DAY = 86_400_000;
// Een gepubliceerde dienst die zo lang openstaat zonder actieve plaatsing vraagt aandacht — de
// franchiser kan dan ingrijpen (extra ZZP'ers benaderen, tarief bijstellen) vóór hij onvervuld blijft.
const AT_RISK_DAYS = 7;

export default async function FranchiseDienstenPage() {
  const actor = await requireRole("FRANCHISER");
  // unbounded-allow: franchise-tenant-scoped diensten; beheerbaar volume
  const diensten = await prisma.job.findMany({
    where: tenantScopeWhere(actor),
    orderBy: { createdAt: "desc" },
    include: {
      company: { select: { name: true } },
      department: { select: { name: true } },
      _count: { select: { applications: true } },
      // Vulgraad: een dienst is "gevuld" zodra er een actieve samenwerking op loopt.
      collaborations: { select: { status: true } },
    },
  });

  const now = Date.now();
  const rows = diensten.map((d) => {
    const filled = d.collaborations.some((c) => c.status === "ACTIVE");
    const published = d.status === "PUBLISHED";
    const openDays = published && !filled ? Math.floor((now - d.createdAt.getTime()) / DAY) : null;
    return { d, filled, published, openDays, atRisk: openDays != null && openDays >= AT_RISK_DAYS };
  });

  // Vulbaar-signaal per open (gepubliceerde, ongevulde) dienst: hoeveel vrij-inzetbare roster-vakmensen
  // matchen goed genoeg om nu voor te dragen? Eén gebundelde load (roster + dienst-matchvelden), geen N+1.
  const openDienstIds = rows.filter((r) => r.published && !r.filled).map((r) => r.d.id);
  const fillSignals = await getRosterFillSignals(actor, openDienstIds, new Date(now));

  // Dekking over de gepubliceerde diensten (concept/gesloten tellen niet mee in de vulgraad).
  const published = rows.filter((r) => r.published);
  const filledCount = published.filter((r) => r.filled).length;
  const openCount = published.length - filledCount;
  const atRiskCount = published.filter((r) => r.atRisk).length;
  const vulgraad = published.length > 0 ? Math.round((filledCount / published.length) * 100) : null;

  // Vooruitkijkende dekkingsprognose: welke aankomende periodes dreigen onbezet? Zelfde
  // filled/published-definitie als hierboven; new Date(now) zodat de buckets t.o.v. nu vallen.
  const prognose = buildDekkingsprognose(
    published.map((r) => ({ startDate: r.d.startDate, filled: r.filled })),
    new Date(now),
  );

  // Eén eenduidige regel per ongedekte dienst die NU aandacht vraagt (deze week, verstreken start, of
  // geen startdatum) — met "X dagen open" én een bucket-label, zodat de kaart nooit "alles gedekt"
  // naast een acute dienst zet. Zelfde weekgrenzen als de prognose (maandag-start).
  const thisWeekStart = startOfIsoWeek(new Date(now)).getTime();
  const nextWeekStart = thisWeekStart + 7 * DAY;
  const attentionNow = published
    .filter((r) => !r.filled)
    .map((r) => {
      const sd = r.d.startDate;
      const acute = sd == null || sd.getTime() < nextWeekStart; // geen datum of deze week / verleden
      const bucketLabel = sd == null ? "Geen startdatum" : "Deze week";
      return { r, acute, bucketLabel };
    })
    .filter((x) => x.acute)
    .sort((a, b) => (b.r.openDays ?? 0) - (a.r.openDays ?? 0));

  // Aandacht eerst: open diensten met de langste looptijd bovenaan, dan de rest op aanmaakdatum.
  const sorted = [...rows].sort((a, b) => {
    const weight = (r: (typeof rows)[number]) =>
      r.published && !r.filled ? (r.openDays ?? 0) + 1000 : 0;
    return weight(b) - weight(a) || b.d.createdAt.getTime() - a.d.createdAt.getTime();
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diensten"
        description="Een overzicht van alle diensten die je hebt uitgezet. Nieuwe diensten zet je uit bij een opdrachtgever."
        action={
          <Button asChild variant="secondary">
            <Link href="/franchise/opdrachtgevers">
              Naar opdrachtgevers <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        }
      />

      {published.length > 0 && (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-3 py-4">
            <div>
              <p className="text-xs text-muted-foreground">Vulgraad</p>
              <p className="text-2xl font-semibold tabular-nums">{vulgraad}%</p>
              <p className="text-xs text-muted-foreground">
                {filledCount} van {plural(published.length, "dienst", "diensten")} gevuld
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Open</p>
              <p className="text-2xl font-semibold tabular-nums">{openCount}</p>
              <p className="text-xs text-muted-foreground">wachten op een plaatsing</p>
            </div>
            {atRiskCount > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/5 px-3 py-2">
                <AlertTriangle className="size-4 shrink-0 text-warning" aria-hidden />
                <p className="text-sm text-foreground">
                  {plural(atRiskCount, "dienst staat", "diensten staan")} al {AT_RISK_DAYS}+ dagen
                  open — dreigt onvervuld.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {prognose.totalOpen > 0 && (
        <Card
          className={
            prognose.needsAttentionNow > 0
              ? "border-warning/40 bg-warning/5"
              : "border-border bg-card"
          }
        >
          <CardContent className="space-y-3 py-4">
            <div className="flex items-center gap-2">
              {prognose.needsAttentionNow > 0 && (
                <AlertTriangle className="size-4 shrink-0 text-warning" aria-hidden />
              )}
              <p className="text-sm font-medium text-foreground">Wat dreigt onbezet</p>
            </div>
            {prognose.needsAttentionNow > 0 ? (
              // Eén regel per acute dienst: titel + "X dagen open" + bucket-label. Geen kaal cijfer
              // meer dat een "geen startdatum"-dienst tegenspreekt.
              <ul className="space-y-1.5">
                {attentionNow.map(({ r, bucketLabel }) => (
                  <li key={r.d.id} className="flex items-baseline justify-between gap-3 text-sm">
                    <Link
                      href={`/franchise/diensten/${r.d.id}`}
                      className="truncate font-medium text-foreground hover:underline"
                    >
                      {r.d.title}
                    </Link>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {r.openDays === 0
                        ? "vandaag uitgezet"
                        : `${plural(r.openDays ?? 0, "dag", "dagen")} open`}
                      {" · "}
                      {bucketLabel}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                {plural(prognose.totalOpen, "open dienst", "open diensten")} in de planning,
                allemaal met een startdatum verderop. Deze week is alles gedekt.
              </p>
            )}
            {/* Vooruitblik: de latere periodes als context onder de acute regels (geen "deze week"-cijfer
                meer als los blok — dat staat nu expliciet per dienst hierboven). */}
            {prognose.buckets.some((b) => b.key === "VOLGENDE_WEEK" || b.key === "LATER") && (
              <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-border/60 pt-3">
                {prognose.buckets
                  .filter((b) => b.key === "VOLGENDE_WEEK" || b.key === "LATER")
                  .map((b) => (
                    <div key={b.key}>
                      <p className="text-lg font-semibold tabular-nums text-foreground">
                        {b.openCount}
                      </p>
                      <p className="text-xs text-muted-foreground">{b.label}</p>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {diensten.length === 0 ? (
        <Card>
          <EmptyState
            icon={Clock}
            title="Nog geen diensten"
            description="Zet diensten uit bij een opdrachtgever — per afdeling, met tarief, skills en vereiste certificaten."
            action={{ label: "Naar opdrachtgevers", href: "/franchise/opdrachtgevers" }}
          />
        </Card>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {sorted.map(({ d, filled, openDays, atRisk }) => {
            const fillChip = filled
              ? null
              : dienstFillChip(fillSignals.get(d.id) ?? { readyMatches: 0, idleReady: 0 });
            return (
              <Link
                key={d.id}
                href={`/franchise/diensten/${d.id}`}
                className="card-interactive flex items-start justify-between gap-3 p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{d.title}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {d.company.name}
                    {d.department ? ` · ${d.department.name}` : ""}
                  </p>
                  {openDays != null && (
                    <p
                      className={`mt-0.5 text-xs ${atRisk ? "text-warning" : "text-muted-foreground"}`}
                    >
                      {openDays === 0
                        ? "Vandaag uitgezet"
                        : `${plural(openDays, "dag", "dagen")} open`}
                      {d._count.applications === 0 ? " · nog geen reacties" : ""}
                    </p>
                  )}
                  {fillChip && (
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                      <UserCheck className="size-3" aria-hidden />
                      {fillChip.label}
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-muted-foreground">
                  {filled ? (
                    <Badge variant="success">Gevuld</Badge>
                  ) : (
                    <JobStatusBadge status={d.status as JobStatus} />
                  )}
                  {d._count.applications > 0 && (
                    <Badge variant="muted">
                      {plural(d._count.applications, "reactie", "reacties")}
                    </Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
