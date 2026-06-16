import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users, CircleAlert } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { getDienstDetail } from "@/lib/franchise/dienst-detail";
import { JOB_TRANSITIONS } from "@/lib/jobs";
import { type JobStatus, type ApplicationStatus, type WorkMode } from "@/lib/enums";
import { type ComplianceStatus } from "@/lib/matching";
import { type DbaRisk } from "@/lib/dba";
import { inzetvormSignaal } from "@/lib/inzetvorm-signaal";
import { DBA_DISCLAIMER } from "@/lib/config";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { ApplicationStatusBadge } from "@/components/applications/application-status-badge";
import { ComplianceBadge } from "@/components/compliance-badge";
import { plural } from "@/lib/plural";
import { setDienstStatus } from "../actions";

export const metadata: Metadata = { title: "Dienst · Franchise" };

const WORKMODE: Record<WorkMode, string> = {
  REMOTE: "Remote",
  ONSITE: "Op locatie",
  HYBRID: "Hybride",
};

// Wat de franchiser met de dienst-status kan doen (de uitzetter mag 'm ook weer terugtrekken).
const STATUS_ACTION_LABEL: Record<JobStatus, string> = {
  PUBLISHED: "Publiceren",
  CLOSED: "Sluiten",
  DRAFT: "Terug naar concept",
};

function rateLabel(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) return `€ ${min}–${max}/uur`;
  return `€ ${min ?? max}/uur`;
}

export default async function FranchiseDienstDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await requireRole("FRANCHISER");
  const dienst = await getDienstDetail(actor, id);
  if (!dienst) notFound();

  const rate = rateLabel(dienst.rateMin, dienst.rateMax);
  const signaal = inzetvormSignaal(dienst.dbaRisk as DbaRisk | null);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/franchise/diensten"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden /> Terug naar diensten
      </Link>

      <PageHeader
        title={dienst.title}
        description={`${dienst.companyName}${dienst.departmentName ? ` · ${dienst.departmentName}` : ""}`}
        action={<JobStatusBadge status={dienst.status as JobStatus} />}
      />

      <Card>
        <CardContent className="space-y-3 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="muted">
              {WORKMODE[dienst.workMode as WorkMode] ?? dienst.workMode}
            </Badge>
            {dienst.location && <Badge variant="muted">{dienst.location}</Badge>}
            {rate && <Badge variant="muted">{rate}</Badge>}
          </div>
          {dienst.description && (
            <p className="text-sm text-muted-foreground">{dienst.description}</p>
          )}
          {/* De franchiser die de dienst uitzette kan 'm ook sluiten/heropenen/depubliceren — voorheen
              kon alleen de opdrachtgever dat, waardoor een ongewenste live dienst niet terug te trekken was. */}
          <div className="flex flex-wrap gap-2 border-t border-border pt-3">
            {JOB_TRANSITIONS[dienst.status as JobStatus].map((to) => (
              <form key={to} action={setDienstStatus.bind(null, id, to)}>
                <Button
                  type="submit"
                  size="sm"
                  variant={to === "CLOSED" ? "destructive" : "secondary"}
                >
                  {STATUS_ACTION_LABEL[to]}
                </Button>
              </form>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Inzetvorm-signaal bij de plaatsingskeuze: synthese van het reeds berekende DBA-risico van de
          dienst. Signalering, geen juridisch oordeel — de DBA-disclaimer staat eronder. */}
      <Card
        className={
          signaal.tone === "danger"
            ? "border-danger/40"
            : signaal.tone === "warning"
              ? "border-warning/40"
              : "border-success/40"
        }
      >
        <CardContent className="space-y-2 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">Inzetvorm</p>
            <Badge variant={signaal.tone}>{signaal.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{signaal.hint}</p>
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {DBA_DISCLAIMER}
          </p>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Users className="size-4 text-muted-foreground" aria-hidden />
          Reacties
          {dienst.applicants.length > 0 && (
            <span className="text-muted-foreground">
              ({plural(dienst.applicants.length, "kandidaat", "kandidaten")})
            </span>
          )}
        </div>

        {dienst.applicants.length === 0 ? (
          <Card>
            <EmptyState
              icon={Users}
              title="Nog geen reacties"
              description="Zodra ZZP'ers op deze dienst reageren, zie je ze hier met hun match en compliance."
            />
          </Card>
        ) : (
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {dienst.applicants.map((a) => (
                <div
                  key={a.applicationId}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {a.name}
                      {a.hired && (
                        <Badge variant="success" className="ml-2">
                          Aangenomen
                        </Badge>
                      )}
                    </p>
                    {a.headline && (
                      <p className="truncate text-xs text-muted-foreground">{a.headline}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Badge variant="muted" className="tabular-nums">
                      Match {a.matchScore}
                    </Badge>
                    {a.complianceStatus && (
                      <ComplianceBadge status={a.complianceStatus as ComplianceStatus} />
                    )}
                    <ApplicationStatusBadge status={a.status as ApplicationStatus} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
