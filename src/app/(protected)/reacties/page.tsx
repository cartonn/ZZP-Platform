import { type Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { computeCompliance } from "@/lib/matching";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ApplicationStatusBadge } from "@/components/applications/application-status-badge";
import { OutcomesSummary } from "@/components/applications/outcomes-summary";
import { ComplianceBadge } from "@/components/compliance-badge";
import { summarizeApplicationOutcomes } from "@/lib/application-outcomes";
import { type ApplicationStatus, type CredentialType, type CredentialStatus } from "@/lib/enums";

export const metadata: Metadata = { title: "Mijn reacties · ZZP Platform" };

// Korte uitleg per status: wat betekent het en wat kun je verwachten.
const STATUS_HINT: Record<ApplicationStatus, string> = {
  NEW: "De opdrachtgever heeft je reactie nog niet bekeken.",
  VIEWED: "De opdrachtgever heeft je reactie bekeken.",
  SHORTLIST: "Je staat op de shortlist — je wordt mogelijk benaderd.",
  ACCEPTED: "Geaccepteerd! Houd je berichten in de gaten voor een samenwerkingsvoorstel.",
  REJECTED: "Deze keer niet geselecteerd. Reageer gerust op andere opdrachten.",
};

// Zodra er een samenwerking is, volgt de hint de actuele samenwerkingsstatus i.p.v. een vaste tekst.
const COLLAB_HINT: Record<string, string> = {
  PROPOSED: "Samenwerking voorgesteld — bekijk het voorstel.",
  ACTIVE: "Samenwerking gestart — bekijk het werkproces.",
  COMPLETED: "Samenwerking afgerond — bekijk het werkproces.",
  CANCELLED: "Samenwerking geannuleerd — bekijk het werkproces.",
};

export default async function ReactiesPage() {
  const actor = await requireRole("FREELANCER");
  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId: actor.id },
    select: {
      id: true,
      credentials: { select: { type: true, status: true, expiresAt: true } },
    },
  });

  const myCredentials = (profile?.credentials ?? []).map((c) => ({
    type: c.type as CredentialType,
    status: c.status as CredentialStatus,
    expiresAt: c.expiresAt,
  }));

  const applications = profile
    ? await prisma.application.findMany({
        where: { freelancerId: profile.id },
        orderBy: { createdAt: "desc" },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              company: { select: { name: true } },
              credentialRequirements: { select: { credentialType: true, required: true } },
            },
          },
          collaboration: { select: { id: true, status: true } },
        },
      })
    : [];

  const outcomes = summarizeApplicationOutcomes(
    applications.map((app) => ({
      status: app.status as ApplicationStatus,
      hasCollaboration: app.collaboration != null,
    })),
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Mijn reacties" description="Je reacties op opdrachten en hun status." />

      <OutcomesSummary outcomes={outcomes} />

      {applications.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title="Nog geen reacties"
            description="Je hebt nog niet gereageerd op een opdracht."
            action={{ label: "Bekijk opdrachten", href: "/opdrachten" }}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            // Live compliance uit de actuele certificaten i.p.v. de bevroren snapshot. De volledige
            // uitsplitsing maakt voor de ZZP'er concreet wat hij nog moet regelen om te voldoen.
            const requiredTypes = app.job.credentialRequirements
              .filter((r) => r.required)
              .map((r) => r.credentialType as CredentialType);
            const compliance =
              requiredTypes.length > 0 ? computeCompliance(requiredTypes, myCredentials) : null;
            // Zodra er een samenwerking uit de reactie is voortgekomen, wijst de kaart naar het
            // werkproces (de logische volgende stap) i.p.v. terug naar de opdracht.
            const hint = app.collaboration
              ? (COLLAB_HINT[app.collaboration.status] ??
                "Samenwerking gestart — bekijk het werkproces.")
              : STATUS_HINT[app.status as ApplicationStatus];
            return (
              <Link
                key={app.id}
                href={
                  app.collaboration
                    ? `/samenwerkingen/${app.collaboration.id}`
                    : `/opdrachten/${app.job.id}`
                }
                className="card-interactive block rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{app.job.title}</p>
                    <p className="text-sm text-muted-foreground">{app.job.company.name}</p>
                  </div>
                  <ApplicationStatusBadge status={app.status as ApplicationStatus} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {app.matchScore != null && (
                    <Badge variant="accent">Match {app.matchScore}%</Badge>
                  )}
                  {compliance && <ComplianceBadge status={compliance.status} />}
                </div>
                {compliance && compliance.status !== "COMPLIANT" && (
                  <p className="mt-1.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    {compliance.missing.length > 0 && (
                      <span className="text-danger">
                        Je mist:{" "}
                        {compliance.missing.map((t) => CREDENTIAL_TYPE_LABEL[t]).join(", ")}
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
                <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
