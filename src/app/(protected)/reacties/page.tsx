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
import { WaitSignal } from "@/components/applications/wait-signal";
import { ApplicantResponsivenessNote } from "@/components/applications/applicant-responsiveness-note";
import { getClientResponsivenessForCompanies } from "@/lib/data/client-responsiveness";
import {
  countApplicationsAwaitingAttention,
  summarizeApplicationWait,
} from "@/lib/application-wait";
import { ComplianceBadge } from "@/components/compliance-badge";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { summarizeApplicationOutcomes } from "@/lib/application-outcomes";
import {
  type ApplicationFilterGroup,
  applicationFilterParams,
  filterApplications,
  parseApplicationFilter,
  summarizeApplicationGroups,
} from "@/lib/application-filter";
import { canWithdrawApplication } from "@/lib/applications";
import { rejectionReasonFeedback } from "@/lib/rejection-reason";
import { summarizeRejectionPattern } from "@/lib/rejection-pattern";
import { RejectionPatternNote } from "@/components/applications/rejection-pattern-note";
import { type ApplicationStatus, type CredentialType, type CredentialStatus } from "@/lib/enums";
import { getTranslator } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/relative-time";
import { withdrawApplication } from "./actions";

export const metadata: Metadata = { title: "Mijn reacties · ZZP Platform" };

// Korte uitleg per status: wat betekent het en wat kun je verwachten.
const STATUS_HINT: Record<ApplicationStatus, string> = {
  NEW: "De opdrachtgever heeft je reactie nog niet bekeken.",
  VIEWED: "De opdrachtgever heeft je reactie bekeken.",
  SHORTLIST: "Je staat op de shortlist — je wordt mogelijk benaderd.",
  ACCEPTED: "Geaccepteerd! Houd je berichten in de gaten voor een samenwerkingsvoorstel.",
  REJECTED: "Deze keer niet geselecteerd. Reageer gerust op andere opdrachten.",
  WITHDRAWN: "Je hebt deze reactie ingetrokken.",
};

// Zodra er een samenwerking is, volgt de hint de actuele samenwerkingsstatus i.p.v. een vaste tekst.
const COLLAB_HINT: Record<string, string> = {
  PROPOSED: "Samenwerking voorgesteld — bekijk het voorstel.",
  ACTIVE: "Samenwerking gestart — bekijk de samenwerking.",
  COMPLETED: "Samenwerking afgerond — bekijk de samenwerking.",
  CANCELLED: "Samenwerking geannuleerd — bekijk de samenwerking.",
};

function filterHref(group: ApplicationFilterGroup): string {
  const qs = new URLSearchParams(applicationFilterParams(group)).toString();
  return qs ? `/reacties?${qs}` : "/reacties";
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "focus-ring inline-flex items-center rounded-md border px-3 py-1 text-sm transition-colors",
        active
          ? "border-accent-foreground/20 bg-accent text-accent-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </Link>
  );
}

export default async function ReactiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireRole("FREELANCER");
  const { t } = await getTranslator();
  const filter = parseApplicationFilter(await searchParams);
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
    ? // unbounded-allow: eigenaar-scoped, inherent begrensd
      await prisma.application.findMany({
        where: { freelancerId: profile.id },
        orderBy: { createdAt: "desc" },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              company: { select: { id: true, name: true } },
              credentialRequirements: { select: { credentialType: true, required: true } },
            },
          },
          collaboration: { select: { id: true, status: true } },
        },
      })
    : [];

  // status komt als string uit Prisma; cast één keer naar de enum zodat de pure helpers (filter +
  // samenvatting) hun nauwere type houden. De overige velden blijven behouden voor de weergave.
  const typed = applications.map((app) => ({ ...app, status: app.status as ApplicationStatus }));

  const outcomes = summarizeApplicationOutcomes(
    typed.map((app) => ({ status: app.status, hasCollaboration: app.collaboration != null })),
  );

  // Tellingen over álle reacties; de filter werkt server-side op de al opgehaalde set.
  const groupSummary = summarizeApplicationGroups(typed);
  const visible = filterApplications(typed, filter);

  // Terugkerend patroon in de afwijzingsredenen: welke reden noemden opdrachtgevers het vaakst?
  // Server-berekend uit de al opgehaalde reacties (geen extra query); null zonder betekenisvol
  // patroon zodat het scherm rustig blijft.
  const rejectionPattern = summarizeRejectionPattern(
    typed.map((app) => ({ status: app.status, rejectionReason: app.rejectionReason })),
  );

  // Hoeveel eigen reacties liggen langer dan gebruikelijk onbeslist? Server-berekend uit de
  // onveranderlijke createdAt + status (geen extra query); stuurt de strip boven de lijst.
  const awaitingAttention = countApplicationsAwaitingAttention(
    typed.map((app) => ({
      status: app.status,
      createdAt: app.createdAt,
      hasCollaboration: app.collaboration != null,
    })),
  );

  // Reactiebereidheid van de opdrachtgever, alleen voor nog-openstaande reacties (die waarbij
  // afwachten nog aan de orde is). Eén gebatchte query over de betrokken opdrachtgevers (geen N+1);
  // de set is inherent klein. Geeft de ZZP'er context om door te wachten of verder te kijken.
  const pendingCompanyIds = typed
    .filter(
      (app) => app.collaboration == null && ["NEW", "VIEWED", "SHORTLIST"].includes(app.status),
    )
    .map((app) => app.job.company.id);
  const responsivenessByCompany = await getClientResponsivenessForCompanies(pendingCompanyIds);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Mijn reacties")}
        description={t("Je reacties op opdrachten en hun status.")}
      />

      <OutcomesSummary outcomes={outcomes} />

      <RejectionPatternNote pattern={rejectionPattern} t={t} />

      {awaitingAttention > 0 && (
        <p className="rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning">
          {awaitingAttention === 1
            ? t("1 reactie wacht al langer dan gebruikelijk — overweeg ook andere opdrachten.")
            : `${awaitingAttention} ${t("reacties wachten al langer dan gebruikelijk — overweeg ook andere opdrachten.")}`}
        </p>
      )}

      {applications.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title={t("Nog geen reacties")}
            description={t("Je hebt nog niet gereageerd op een opdracht.")}
            action={{ label: t("Bekijk opdrachten"), href: "/opdrachten" }}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Statusfilter — server-side via de URL (deelbaar/herlaadbaar). */}
          <div className="flex flex-wrap gap-1.5">
            <FilterPill href={filterHref("all")} active={filter === "all"}>
              {t("Alle")} ({groupSummary.total})
            </FilterPill>
            {groupSummary.groups.map((g) => (
              <FilterPill key={g.group} href={filterHref(g.group)} active={filter === g.group}>
                {t(g.label)} ({g.count})
              </FilterPill>
            ))}
          </div>

          {visible.length === 0 ? (
            <Card>
              <EmptyState
                icon={FileText}
                title={t("Geen reacties in dit filter")}
                description={t("Pas het filter aan om je andere reacties te zien.")}
                action={{ label: t("Alle reacties"), href: "/reacties" }}
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {visible.map((app) => {
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
                    "Samenwerking gestart — bekijk de samenwerking.")
                  : STATUS_HINT[app.status];
                // De ZZP'er kan zijn reactie intrekken zolang de opdrachtgever nog geen beslissing nam en
                // er geen samenwerking uit voortkwam. Server-side blijft dit de waarheid (zie actions.ts).
                const canWithdraw = !app.collaboration && canWithdrawApplication(app.status);
                // Wachttijd-signaal: ligt deze reactie langer dan gebruikelijk onbeslist?
                const wait = summarizeApplicationWait({
                  status: app.status,
                  createdAt: app.createdAt,
                  hasCollaboration: app.collaboration != null,
                });
                // Alleen bij een nog-openstaande reactie (wait != null) is de reactiebereidheid van
                // de opdrachtgever relevant voor de wacht-beslissing.
                const responsiveness = wait
                  ? responsivenessByCompany.get(app.job.company.id)
                  : undefined;
                return (
                  <div key={app.id} className="rounded-lg border border-border bg-card p-4">
                    <Link
                      href={
                        app.collaboration
                          ? `/samenwerkingen/${app.collaboration.id}`
                          : `/opdrachten/${app.job.id}`
                      }
                      className="block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{app.job.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {app.job.company.name} · {t("Gereageerd")}{" "}
                            {relativeTime(app.createdAt, t)}
                          </p>
                        </div>
                        <ApplicationStatusBadge status={app.status} />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {app.matchScore != null && (
                          <Badge variant="accent">
                            {t("Match")} {app.matchScore}%
                          </Badge>
                        )}
                        {compliance && <ComplianceBadge status={compliance.status} />}
                      </div>
                      {compliance && compliance.status !== "COMPLIANT" && (
                        <p className="mt-1.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                          {compliance.missing.length > 0 && (
                            <span className="text-danger">
                              {t("Je mist:")}{" "}
                              {compliance.missing
                                .map((type) => t(CREDENTIAL_TYPE_LABEL[type]))
                                .join(", ")}
                            </span>
                          )}
                          {compliance.expired.length > 0 && (
                            <span className="text-danger">
                              {t("Verlopen:")}{" "}
                              {compliance.expired
                                .map((type) => t(CREDENTIAL_TYPE_LABEL[type]))
                                .join(", ")}
                            </span>
                          )}
                          {compliance.inReview.length > 0 && (
                            <span className="text-warning">
                              {t("In beoordeling:")}{" "}
                              {compliance.inReview
                                .map((type) => t(CREDENTIAL_TYPE_LABEL[type]))
                                .join(", ")}
                            </span>
                          )}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">{t(hint)}</p>
                      {app.status === "REJECTED" &&
                        !app.collaboration &&
                        (() => {
                          // Constructieve afwijzingsreden van de opdrachtgever (optioneel meegegeven).
                          // Geen black-box afwijzing: de ZZP'er weet waaróm en kan er iets mee.
                          const feedback = rejectionReasonFeedback(app.rejectionReason);
                          return feedback ? (
                            <p className="mt-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-foreground">
                              <span className="font-medium">{t("Feedback opdrachtgever:")}</span>{" "}
                              {t(feedback)}
                            </p>
                          ) : null;
                        })()}
                    </Link>
                    {wait && <WaitSignal wait={wait} t={t} />}
                    {responsiveness && (
                      <ApplicantResponsivenessNote responsiveness={responsiveness} />
                    )}
                    {canWithdraw && (
                      <div className="mt-3 flex justify-end border-t border-border pt-3">
                        <ConfirmButton
                          action={withdrawApplication.bind(null, app.id)}
                          triggerVariant="ghost"
                          size="xs"
                          title={t("Reactie intrekken?")}
                          description={t(
                            "Je reactie verdwijnt uit de selectie van de opdrachtgever. Je kunt later opnieuw op deze opdracht reageren.",
                          )}
                          confirmLabel={t("Intrekken")}
                        >
                          {t("Reactie intrekken")}
                        </ConfirmButton>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
