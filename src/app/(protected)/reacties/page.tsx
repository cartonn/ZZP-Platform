import { type Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { liveComplianceStatus } from "@/lib/matching";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ApplicationStatusBadge } from "@/components/applications/application-status-badge";
import { ComplianceBadge } from "@/components/compliance-badge";
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
          collaboration: { select: { id: true } },
        },
      })
    : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Mijn reacties" description="Je reacties op opdrachten en hun status." />

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
            // Live compliance uit de actuele certificaten i.p.v. de bevroren snapshot.
            const compliance = liveComplianceStatus(
              app.job.credentialRequirements
                .filter((r) => r.required)
                .map((r) => r.credentialType as CredentialType),
              myCredentials,
            );
            // Zodra er een samenwerking uit de reactie is voortgekomen, wijst de kaart naar het
            // werkproces (de logische volgende stap) i.p.v. terug naar de opdracht.
            const hint = app.collaboration
              ? "Samenwerking gestart — bekijk het werkproces."
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
                  {compliance && <ComplianceBadge status={compliance} />}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
