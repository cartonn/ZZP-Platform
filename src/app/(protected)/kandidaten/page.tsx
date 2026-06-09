import { type Metadata } from "next";
import Link from "next/link";
import { Users, Check, TriangleAlert } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { APPLICATION_TRANSITIONS } from "@/lib/applications";
import { computeCompliance, scoreJobForFreelancer } from "@/lib/matching";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import { summarizeAvailability } from "@/lib/availability";
import { computeTrustLevel } from "@/lib/trust";
import { mandatoryDocuments } from "@/lib/mandatory-documents";
import { TrustBadge } from "@/components/trust/trust-badge";
import { type AvailabilityWindowType } from "@/lib/enums";
import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
  type Visibility,
  type CredentialType,
  type CredentialStatus,
} from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Textarea } from "@/components/ui/textarea";
import { ApplicationStatusBadge } from "@/components/applications/application-status-badge";
import { ComplianceBadge } from "@/components/compliance-badge";
import { changeApplicationStatus, saveApplicationNote } from "./actions";
import { startConversationForApplication } from "@/app/(protected)/berichten/actions";
import { ProposeCollaboration } from "./propose-collaboration";

export const metadata: Metadata = { title: "Kandidaten · ZZP Platform" };

const ACTION_LABEL: Record<ApplicationStatus, string> = {
  NEW: "Terug naar nieuw",
  VIEWED: "Markeer als bekeken",
  SHORTLIST: "Shortlist",
  ACCEPTED: "Accepteren",
  REJECTED: "Afwijzen",
};

export default async function KandidatenPage() {
  const actor = await requireRole("CLIENT");

  const applications = await prisma.application.findMany({
    where: { job: { company: { userId: actor.id } } },
    // Beste match eerst; de werkstroom-volgorde (NEW vóór afgehandelde) zetten we in-memory, want
    // `status` is een string-kolom — DB-`asc` zou lexicografisch sorteren (ACCEPTED bovenaan).
    orderBy: { matchScore: "desc" },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          rateMin: true,
          rateMax: true,
          workMode: true,
          location: true,
          skills: { select: { skillId: true, required: true } },
          credentialRequirements: { select: { credentialType: true, required: true } },
        },
      },
      freelancer: {
        select: {
          id: true,
          headline: true,
          visibility: true,
          hourlyRate: true,
          workMode: true,
          location: true,
          maxTravelMinutes: true,
          availability: true,
          user: { select: { name: true, identityVerifiedAt: true } },
          skills: { select: { skillId: true } },
          availabilityWindows: { select: { startDate: true, endDate: true, type: true } },
          credentials: { select: { type: true, status: true, expiresAt: true } },
        },
      },
      collaboration: { select: { id: true } },
    },
  });

  // Werkstroom-volgorde: NEW → VIEWED → SHORTLIST → REJECTED → ACCEPTED (actie-vragend eerst,
  // afgehandeld onderaan). Stabiel, dus binnen één status blijft de match-volgorde (hoogste eerst) staan.
  applications.sort(
    (a, b) =>
      APPLICATION_STATUSES.indexOf(a.status as ApplicationStatus) -
      APPLICATION_STATUSES.indexOf(b.status as ApplicationStatus),
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Kandidaten"
        description="Reacties op je opdrachten, met match en compliance."
      />

      {applications.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="Nog geen reacties"
            description="Zodra ZZP'ers reageren op je opdrachten, zie je ze hier."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const status = app.status as ApplicationStatus;
            // Live compliance: actuele certificaatstatus, niet de bevroren snapshot van het
            // reactiemoment (een VOG kan intussen verlopen zijn). De volledige uitsplitsing
            // (missing/expired/inReview) maakt voor de opdrachtgever concreet WAT er ontbreekt.
            const requiredTypes = app.job.credentialRequirements
              .filter((r) => r.required)
              .map((r) => r.credentialType as CredentialType);
            const compliance =
              requiredTypes.length > 0
                ? computeCompliance(
                    requiredTypes,
                    app.freelancer.credentials.map((c) => ({
                      type: c.type as CredentialType,
                      status: c.status as CredentialStatus,
                      expiresAt: c.expiresAt,
                    })),
                  )
                : null;
            const isPublic = (app.freelancer.visibility as Visibility) === "PUBLIC";
            const nowMs = Date.now();
            const trust = computeTrustLevel({
              identityVerified: !!app.freelancer.user.identityVerifiedAt,
              verifiedCredentialCount: app.freelancer.credentials.filter(
                (c) => c.status === "VERIFIED" && (!c.expiresAt || c.expiresAt.getTime() > nowMs),
              ).length,
              mandatoryDocsComplete: mandatoryDocuments(
                app.freelancer.credentials.map((c) => ({
                  type: c.type as CredentialType,
                  status: c.status as CredentialStatus,
                  expiresAt: c.expiresAt,
                })),
              ).allSatisfied,
            });
            // Live onderbouwing van de match (waarom past deze kandidaat) — dezelfde server-side
            // regels als de ZZP'er op de opdracht ziet, zodat de opdrachtgever niet alleen "Match X%" leest.
            const fitReasons = scoreJobForFreelancer(app.job, app.freelancer).reasons;
            return (
              <Card key={app.id}>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {isPublic ? (
                          <Link
                            href={`/zzp/${app.freelancer.id}`}
                            target="_blank"
                            className="font-medium underline-offset-4 hover:underline"
                          >
                            {app.freelancer.user.name}
                          </Link>
                        ) : (
                          <span className="font-medium">{app.freelancer.user.name}</span>
                        )}
                        <ApplicationStatusBadge status={status} />
                        <TrustBadge level={trust.level} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {app.freelancer.headline ?? "—"} · op{" "}
                        <Link
                          href={`/opdrachten/${app.job.id}`}
                          className="underline-offset-4 hover:underline"
                        >
                          {app.job.title}
                        </Link>
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {app.matchScore != null && (
                        <Badge variant="accent">Match {app.matchScore}%</Badge>
                      )}
                      {compliance && <ComplianceBadge status={compliance.status} />}
                    </div>
                  </div>

                  {compliance && compliance.status !== "COMPLIANT" && (
                    <p className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      {compliance.missing.length > 0 && (
                        <span className="text-danger">
                          Mist: {compliance.missing.map((t) => CREDENTIAL_TYPE_LABEL[t]).join(", ")}
                        </span>
                      )}
                      {compliance.expired.length > 0 && (
                        <span className="text-danger">
                          Verlopen:{" "}
                          {compliance.expired.map((t) => CREDENTIAL_TYPE_LABEL[t]).join(", ")}
                        </span>
                      )}
                      {compliance.inReview.length > 0 && (
                        <span className="text-warning">
                          In beoordeling:{" "}
                          {compliance.inReview.map((t) => CREDENTIAL_TYPE_LABEL[t]).join(", ")}
                        </span>
                      )}
                    </p>
                  )}

                  {fitReasons.length > 0 && (
                    <details className="text-sm">
                      <summary className="focus-ring cursor-pointer text-muted-foreground">
                        Waarom deze match?
                      </summary>
                      <ul className="mt-2 space-y-1.5">
                        {fitReasons.map((r, i) => (
                          <li key={i} className="flex items-start gap-2">
                            {r.kind === "positive" ? (
                              <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                            ) : (
                              <TriangleAlert
                                className="mt-0.5 size-4 shrink-0 text-warning"
                                aria-hidden
                              />
                            )}
                            <span className={r.kind === "gap" ? "text-muted-foreground" : ""}>
                              {r.label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}

                  <p className="whitespace-pre-line text-sm">{app.motivation}</p>
                  <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                    {app.proposedRate != null && (
                      <span>Tariefvoorstel: € {app.proposedRate}/uur</span>
                    )}
                    {app.availability && <span>Aangegeven bij reactie: {app.availability}</span>}
                    {(() => {
                      const s = summarizeAvailability(
                        app.freelancer.availabilityWindows.map((w) => ({
                          ...w,
                          type: w.type as AvailabilityWindowType,
                        })),
                      );
                      return s ? <span>Agenda: {s}</span> : null;
                    })()}
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                    {APPLICATION_TRANSITIONS[status].map((to) => (
                      <form key={to} action={changeApplicationStatus.bind(null, app.id, to)}>
                        <Button
                          type="submit"
                          size="sm"
                          variant={
                            to === "ACCEPTED"
                              ? "primary"
                              : to === "REJECTED"
                                ? "danger"
                                : "secondary"
                          }
                        >
                          {ACTION_LABEL[to]}
                        </Button>
                      </form>
                    ))}
                  </div>

                  <form action={saveApplicationNote.bind(null, app.id)} className="space-y-2">
                    <Textarea
                      name="note"
                      rows={2}
                      defaultValue={app.note ?? ""}
                      placeholder="Interne notitie (alleen voor jou)…"
                      maxLength={2000}
                    />
                    <Button type="submit" variant="secondary" size="sm">
                      Notitie opslaan
                    </Button>
                  </form>

                  <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                    <form action={startConversationForApplication.bind(null, app.id)}>
                      <Button type="submit" variant="secondary" size="sm">
                        Bericht sturen
                      </Button>
                    </form>
                    {app.collaboration && (
                      <Button asChild variant="secondary" size="sm">
                        <Link href={`/samenwerkingen/${app.collaboration.id}`}>
                          Bekijk samenwerking
                        </Link>
                      </Button>
                    )}
                  </div>
                  {status === "ACCEPTED" && !app.collaboration && (
                    <ProposeCollaboration applicationId={app.id} />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
