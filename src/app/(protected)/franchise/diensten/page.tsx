import { type Metadata } from "next";
import Link from "next/link";
import { Clock, ArrowRight, AlertTriangle } from "lucide-react";
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
import { CoverageForecastBand } from "@/components/franchise/coverage-forecast-band";
import { buildCoverageForecast } from "@/lib/franchise/coverage-forecast";
import { plural } from "@/lib/plural";

export const metadata: Metadata = { title: "Diensten · Franchise" };

const DAY = 86_400_000;
// Een gepubliceerde dienst die zo lang openstaat zonder actieve plaatsing vraagt aandacht — de
// franchiser kan dan ingrijpen (extra ZZP'ers benaderen, tarief bijstellen) vóór hij onvervuld blijft.
const AT_RISK_DAYS = 7;

export default async function FranchiseDienstenPage() {
  const actor = await requireRole("FRANCHISER");
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

  // Dekking over de gepubliceerde diensten (concept/gesloten tellen niet mee in de vulgraad).
  const published = rows.filter((r) => r.published);
  const filledCount = published.filter((r) => r.filled).length;
  const openCount = published.length - filledCount;
  const atRiskCount = published.filter((r) => r.atRisk).length;
  const vulgraad = published.length > 0 ? Math.round((filledCount / published.length) * 100) : null;

  // Vooruitkijkende dekking: gepubliceerde diensten gebucket per komende roosterweek op startdatum.
  // Hergebruikt de al opgehaalde rijen (startDate is een scalar veld op Job) — geen extra query.
  const coverageForecast = buildCoverageForecast(
    published.map((r) => ({ jobId: r.d.id, startDate: r.d.startDate, filled: r.filled })),
    new Date(now),
  );

  // Aandacht eerst: open diensten met de langste looptijd bovenaan, dan de rest op aanmaakdatum.
  const sorted = [...rows].sort((a, b) => {
    const weight = (r: (typeof rows)[number]) =>
      r.published && !r.filled ? (r.openDays ?? 0) + 1000 : 0;
    return weight(b) - weight(a) || b.d.createdAt.getTime() - a.d.createdAt.getTime();
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
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

      {published.length > 0 && <CoverageForecastBand forecast={coverageForecast} />}

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
          {sorted.map(({ d, filled, openDays, atRisk }) => (
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
          ))}
        </div>
      )}
    </div>
  );
}
