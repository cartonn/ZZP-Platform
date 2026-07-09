import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users, CircleAlert, UserPlus, Check, Minus, Trophy } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { getDienstDetail } from "@/lib/franchise/dienst-detail";
import { getRosterCandidatesForDienst } from "@/lib/franchise/dienst-voordracht";
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
import { RATE_FIT_LABEL, RATE_FIT_VARIANT } from "@/lib/rate-fit";
import { plural } from "@/lib/plural";
import { setDienstStatus } from "../actions";
import { VoordragenSection } from "./voordragen";

export const metadata: Metadata = { title: "Dienst · Bemiddeling" };

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

  // Voordragen kan alleen op een open (gepubliceerde) dienst — anders geen actie te bieden.
  const rosterCandidates =
    dienst.status === "PUBLISHED" ? await getRosterCandidatesForDienst(actor, id) : null;

  // Beste match = de hoogst-scorende, nog niet aangenomen reactie (lijst is al op score gesorteerd).
  // Alleen markeren als er iets te kiezen valt (≥2 reacties) — bij één reactie is "beste" leeg.
  const bestMatchId =
    dienst.applicants.length > 1
      ? (dienst.applicants.find((a) => !a.hired)?.applicationId ?? null)
      : null;

  return (
    <div className="space-y-6">
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

      {/* Voordragen uit je roster — de bemiddelaar vult een open dienst actief door eigen ZZP'ers
          voor te dragen. Alleen zichtbaar bij een gepubliceerde dienst; inzetbaarheid inline, een
          niet-inzetbare ZZP'er is disabled (server-side ook geweigerd). */}
      {rosterCandidates != null && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <UserPlus className="size-4 text-muted-foreground" aria-hidden />
            Voordragen uit je roster
            {rosterCandidates.length > 0 && (
              <span className="text-muted-foreground">
                ({plural(rosterCandidates.length, "ZZP'er", "ZZP'ers")})
              </span>
            )}
          </div>

          {rosterCandidates.length === 0 ? (
            <Card>
              <EmptyState
                icon={UserPlus}
                title="Nog geen ZZP'ers in je roster"
                description="Voeg ZZP'ers toe aan je roster om ze op deze dienst voor te dragen."
              />
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <VoordragenSection jobId={id} candidates={rosterCandidates} />
              </CardContent>
            </Card>
          )}
        </section>
      )}

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
                    <p className="flex items-center gap-2 truncate text-sm font-medium">
                      <span className="truncate">{a.name}</span>
                      {a.applicationId === bestMatchId && (
                        <Badge variant="accent" className="inline-flex items-center gap-1">
                          <Trophy className="size-3" aria-hidden />
                          Beste match
                        </Badge>
                      )}
                      {a.hired && <Badge variant="success">Aangenomen</Badge>}
                    </p>
                    {a.headline && (
                      <p className="truncate text-xs text-muted-foreground">{a.headline}</p>
                    )}
                    {/* Waarom deze reactie past — troef + minpunt uit dezelfde matchmotor als de
                        voordraag-lijst en /kandidaten (verklaarbaar, geen black box). */}
                    {(a.topReason || a.topGap) && (
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        {a.topReason && (
                          <span className="inline-flex items-center gap-1 text-success">
                            <Check className="size-3 shrink-0" aria-hidden />
                            <span className="truncate">{a.topReason}</span>
                          </span>
                        )}
                        {a.topGap && (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <Minus className="size-3 shrink-0" aria-hidden />
                            <span className="truncate">{a.topGap}</span>
                          </span>
                        )}
                      </p>
                    )}
                    {/* Tariefvoorstel van de ZZP'er + budget-fit — de bemiddelaar adviseert de
                        opdrachtgever, dus tarief-passendheid hoort hier net als op /kandidaten. */}
                    {a.proposedRate != null && (
                      <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        Tariefvoorstel: € {a.proposedRate}/uur
                        {a.rateFit !== "unknown" && (
                          <Badge variant={RATE_FIT_VARIANT[a.rateFit]}>
                            {RATE_FIT_LABEL[a.rateFit]}
                          </Badge>
                        )}
                      </p>
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
