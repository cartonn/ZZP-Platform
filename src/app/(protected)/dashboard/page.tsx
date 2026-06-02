import { type Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Info } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { type UserRole, type CollaborationStatus, type ContractStatus } from "@/lib/enums";
import { type PerformanceState, type InvoiceLifecycleState } from "@/lib/lifecycles";
import { recommendedJobs, type JobMatch } from "@/lib/recommendations";
import { clientCredentialAlerts, describeCredentialAlert } from "@/lib/collaboration-alerts";
import { overdueInvoiceCount, unreadConversationCount } from "@/lib/signals";
import { computeCompanyCompleteness } from "@/lib/profile";
import {
  adminNextActions,
  clientNextActions,
  freelancerNextActions,
  rankNextActions,
  type NextActionTone,
} from "@/lib/next-actions";
import { cascadeClientActions, cascadeFreelancerActions } from "@/lib/cascade/next-actions";
import { cascadeStage, type CascadeStage } from "@/lib/cascade/stage";
import { weekOverview, type WeekOverview } from "@/lib/week-overview";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ComplianceBadge } from "@/components/compliance-badge";
import { AvailabilityBadge } from "@/components/availability-badge";

export const metadata: Metadata = { title: "Dashboard · ZZP Platform" };

const WERKPLEK: Record<UserRole, string> = {
  FREELANCER: "ZZP-werkplek",
  CLIENT: "Opdrachtgever-werkplek",
  ADMIN: "Beheerwerkplek",
};

// Onboarding-checklist: alleen voor nieuwe accounts (zie isNewAccount).
const INTRO: Record<UserRole, { lead: string; next: string[] }> = {
  FREELANCER: {
    lead: "Beheer je profiel, certificaten en reacties op opdrachten op één plek.",
    next: [
      "Maak je profiel compleet zodat opdrachtgevers je vinden.",
      "Upload je VOG en diploma's en vraag verificatie aan.",
      "Reageer op opdrachten die bij je passen.",
    ],
  },
  CLIENT: {
    lead: "Plaats opdrachten en zie in één oogopslag welke kandidaten geverifieerd zijn.",
    next: [
      "Vul je bedrijfsprofiel aan.",
      "Plaats je eerste opdracht met de vereiste certificaten.",
      "Bekijk kandidaten en hun compliance-status.",
    ],
  },
  ADMIN: {
    lead: "Verifieer certificaten, beheer gebruikers en bewaak de kwaliteit van het platform.",
    next: [
      "Werk de verificatiequeue bij.",
      "Controleer gebruikers en rollen.",
      "Bekijk de audit trail van gevoelige acties.",
    ],
  },
};

interface Stat {
  label: string;
  value: string | number;
  href: string;
}
interface AttentionItem {
  label: string;
  href: string;
  tone: NextActionTone;
}
interface RunningCollab {
  id: string;
  jobTitle: string;
  clientName: string;
  stage: CascadeStage;
}
interface DashboardData {
  stats: Stat[];
  attention: AttentionItem[];
  running: RunningCollab[];
  week: WeekOverview | null;
  isNewAccount: boolean;
}

async function dashboardData(role: UserRole, userId: string): Promise<DashboardData> {
  const attention: AttentionItem[] = [];

  if (role === "FREELANCER") {
    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId },
      select: { id: true, completeness: true, visibility: true },
    });
    const pid = profile?.id;
    const soon = new Date(Date.now() + 30 * 86400_000);
    const now = new Date();
    const [
      applications,
      verified,
      rejected,
      expiring,
      account,
      overdue,
      draftInvoices,
      approvedInvoices,
      rejectedInvoices,
      rejectedPerformances,
      contractsToSign,
      messagesAwaitingReply,
      runningRows,
    ] = await Promise.all([
      pid ? prisma.application.count({ where: { freelancerId: pid } }) : Promise.resolve(0),
      pid
        ? prisma.credential.count({ where: { freelancerProfileId: pid, status: "VERIFIED" } })
        : Promise.resolve(0),
      pid
        ? prisma.credential.count({ where: { freelancerProfileId: pid, status: "REJECTED" } })
        : Promise.resolve(0),
      pid
        ? prisma.credential.count({
            where: {
              freelancerProfileId: pid,
              status: "VERIFIED",
              expiresAt: { gt: now, lte: soon },
            },
          })
        : Promise.resolve(0),
      prisma.user.findUnique({ where: { id: userId }, select: { identityVerifiedAt: true } }),
      overdueInvoiceCount("FREELANCER", userId),
      // Cascade (lifecycleStatus = de cascade-flow; oude losse-status-facturen tellen niet mee).
      prisma.invoice.count({ where: { issuerUserId: userId, lifecycleStatus: "DRAFT" } }),
      prisma.invoice.count({ where: { issuerUserId: userId, lifecycleStatus: "APPROVED" } }),
      prisma.invoice.count({ where: { issuerUserId: userId, lifecycleStatus: "REJECTED" } }),
      prisma.performance.count({
        where: { status: "REJECTED", collaboration: { freelancer: { userId } } },
      }),
      prisma.collaboration.count({ where: { contractStatus: "SENT", freelancer: { userId } } }),
      unreadConversationCount(userId),
      // Lopende samenwerkingen (niet-terminaal) met de gegevens om de cascade-fase af te leiden.
      prisma.collaboration.findMany({
        where: { freelancer: { userId }, status: { in: ["PROPOSED", "ACTIVE"] } },
        select: {
          id: true,
          status: true,
          contractStatus: true,
          disputedAt: true,
          startDate: true,
          endDate: true,
          rate: true,
          company: { select: { id: true, name: true } },
          job: { select: { title: true } },
          performances: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true } },
          invoices: {
            where: { lifecycleStatus: { not: null } },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { lifecycleStatus: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Base- en cascade-acties samen ranken zodat de juiste "aan zet" bovenaan staat.
    const freelancerActions = rankNextActions([
      ...freelancerNextActions({
        profilePrivate: profile?.visibility === "PRIVATE",
        identityVerified: !!account?.identityVerifiedAt,
        completeness: profile?.completeness ?? 0,
        rejectedCredentials: rejected,
        expiringCredentials: expiring,
        overdueInvoices: overdue,
        contractsAwaitingSignature: contractsToSign,
        messagesAwaitingReply,
      }),
      ...cascadeFreelancerActions({
        draftInvoices,
        approvedInvoices,
        rejectedPerformances,
        rejectedInvoices,
      }),
    ]);
    for (const a of freelancerActions) {
      attention.push({ label: a.title, href: a.href, tone: a.tone });
    }

    const running: RunningCollab[] = runningRows.map((c) => ({
      id: c.id,
      jobTitle: c.job.title,
      clientName: c.company.name,
      stage: cascadeStage({
        viewer: "FREELANCER",
        collaborationId: c.id,
        collaborationStatus: c.status as CollaborationStatus,
        contractStatus: c.contractStatus as ContractStatus,
        disputed: c.disputedAt !== null,
        latestPerformanceStatus: (c.performances[0]?.status ?? null) as PerformanceState | null,
        latestInvoiceStatus: (c.invoices[0]?.lifecycleStatus ??
          null) as InvoiceLifecycleState | null,
      }),
    }));
    // Weekoverzicht alleen bij meerdere lopende samenwerkingen (anders voegt het niets toe).
    const week =
      runningRows.length >= 2
        ? weekOverview(
            runningRows.map((c) => ({
              collaborationId: c.id,
              clientId: c.company.id,
              clientName: c.company.name,
              jobTitle: c.job.title,
              startDate: c.startDate,
              endDate: c.endDate,
              rate: c.rate,
            })),
            now,
          )
        : null;

    return {
      stats: [
        { label: "Profiel compleet", value: `${profile?.completeness ?? 0}%`, href: "/profiel" },
        { label: "Geverifieerde certificaten", value: verified, href: "/certificaten" },
        { label: "Mijn reacties", value: applications, href: "/reacties" },
      ],
      attention,
      running,
      week,
      isNewAccount: applications === 0 && running.length === 0,
    };
  }

  if (role === "CLIENT") {
    const company = await prisma.company.findUnique({
      where: { userId },
      select: {
        id: true,
        description: true,
        location: true,
        website: true,
        industryId: true,
        logoKey: true,
      },
    });
    const cid = company?.id;
    const companyCompleteness = company
      ? computeCompanyCompleteness({
          description: company.description,
          location: company.location,
          website: company.website,
          hasIndustry: !!company.industryId,
          hasLogo: !!company.logoKey,
        }).score
      : 0;
    const [
      openJobs,
      newApps,
      drafts,
      activeCollabs,
      credentialAlerts,
      overdue,
      performancesToApprove,
      invoicesToApprove,
      contractsToSign,
      messagesAwaitingReply,
    ] = await Promise.all([
      cid
        ? prisma.job.count({ where: { companyId: cid, status: "PUBLISHED" } })
        : Promise.resolve(0),
      cid
        ? prisma.application.count({ where: { job: { companyId: cid }, status: "NEW" } })
        : Promise.resolve(0),
      cid ? prisma.job.count({ where: { companyId: cid, status: "DRAFT" } }) : Promise.resolve(0),
      cid
        ? prisma.collaboration.count({ where: { companyId: cid, status: "ACTIVE" } })
        : Promise.resolve(0),
      clientCredentialAlerts(userId),
      overdueInvoiceCount("CLIENT", userId),
      // Cascade: prestaties/facturen die op de goedkeuring van deze opdrachtgever wachten.
      prisma.performance.count({
        where: { status: "SUBMITTED", collaboration: { company: { userId } } },
      }),
      prisma.invoice.count({ where: { counterpartyUserId: userId, lifecycleStatus: "SUBMITTED" } }),
      prisma.collaboration.count({ where: { contractStatus: "SENT", company: { userId } } }),
      unreadConversationCount(userId),
    ]);
    const clientActions = rankNextActions([
      ...clientNextActions({
        companyCompleteness,
        newApplications: newApps,
        draftJobs: drafts,
        overdueInvoices: overdue,
        collaborationCredentialAlerts: credentialAlerts.map((a) =>
          describeCredentialAlert(a.freelancerName, a.jobTitle, a.alert),
        ),
        contractsAwaitingSignature: contractsToSign,
        messagesAwaitingReply,
      }),
      ...cascadeClientActions({ performancesToApprove, invoicesToApprove }),
    ]);
    for (const a of clientActions) {
      attention.push({ label: a.title, href: a.href, tone: a.tone });
    }
    return {
      stats: [
        { label: "Gepubliceerde opdrachten", value: openJobs, href: "/opdrachten" },
        { label: "Nieuwe reacties", value: newApps, href: "/kandidaten" },
        { label: "Actieve samenwerkingen", value: activeCollabs, href: "/samenwerkingen" },
      ],
      attention,
      running: [],
      week: null,
      isNewAccount: openJobs === 0 && drafts === 0 && activeCollabs === 0,
    };
  }

  const [pending, users, jobs, deletionRequests, pendingUsers, openDisputes] = await Promise.all([
    prisma.credential.count({ where: { status: "SUBMITTED" } }),
    prisma.user.count(),
    prisma.job.count(),
    prisma.user.count({ where: { deletionRequestedAt: { not: null } } }),
    prisma.user.count({ where: { status: "PENDING" } }),
    prisma.collaboration.count({ where: { disputedAt: { not: null } } }),
  ]);
  for (const a of adminNextActions({
    deletionRequests,
    pendingVerifications: pending,
    pendingUsers,
    openDisputes,
  })) {
    attention.push({ label: a.title, href: a.href, tone: a.tone });
  }
  return {
    stats: [
      { label: "Openstaande verificaties", value: pending, href: "/admin/verificaties" },
      { label: "Gebruikers", value: users, href: "/admin/gebruikers" },
      { label: "Opdrachten", value: jobs, href: "/admin/opdrachten" },
    ],
    attention,
    running: [],
    week: null,
    isNewAccount: false,
  };
}

// --- Presentatie-helpers ---------------------------------------------------

const TONE_BADGE: Record<NextActionTone, "warning" | "muted" | "success"> = {
  attention: "warning",
  info: "muted",
  success: "success",
};

function ToneIcon({ tone }: { tone: NextActionTone }) {
  if (tone === "attention")
    return <AlertTriangle className="size-4 shrink-0 text-warning" aria-hidden />;
  if (tone === "success")
    return <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />;
  return <Info className="size-4 shrink-0 text-muted-foreground" aria-hidden />;
}

const TIMING_LABEL: Record<string, string> = {
  ongoing: "Loopt",
  "starts-this-week": "Start deze week",
  "ends-this-week": "Eindigt deze week",
  "starts-and-ends": "Deze week",
};

function RunningCard({ collab }: { collab: RunningCollab }) {
  const { stage } = collab;
  const pct = Math.round((stage.step / stage.totalSteps) * 100);
  return (
    <Link
      href={stage.cta.href}
      className="focus-ring flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{collab.jobTitle}</p>
          <p className="truncate text-xs text-muted-foreground">{collab.clientName}</p>
        </div>
        <Badge variant={TONE_BADGE[stage.tone]}>{stage.label}</Badge>
      </div>
      <div className="space-y-1">
        <Progress value={pct} />
        <p className="text-xs text-muted-foreground">
          Stap {stage.step} van {stage.totalSteps}
        </p>
      </div>
      <span
        className={
          stage.youAreUp
            ? "inline-flex items-center gap-1 text-sm font-medium text-foreground"
            : "inline-flex items-center gap-1 text-sm text-muted-foreground"
        }
      >
        {stage.youAreUp ? stage.cta.label : "Wacht op de andere partij"}
        <ArrowRight className="size-4" aria-hidden />
      </span>
    </Link>
  );
}

function MatchesSection({ matches, prominent }: { matches: JobMatch[]; prominent: boolean }) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div>
          <h2 className="text-sm font-medium">Wat kan ik oppakken</h2>
          {prominent && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Opdrachten die bij je profiel passen — reageer direct.
            </p>
          )}
        </div>
        <Link
          href="/opdrachten"
          className="focus-ring text-xs text-muted-foreground hover:text-foreground"
        >
          Alle opdrachten
        </Link>
      </div>
      <ul className="divide-y divide-border">
        {matches.map((m) => (
          <li key={m.jobId}>
            <Link
              href={`/opdrachten/${m.jobId}`}
              className="focus-ring flex items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-muted/40"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{m.title}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {m.companyName}
                </span>
                {m.related ? (
                  <span className="block truncate text-xs text-primary">
                    Sluit inhoudelijk aan op je profiel
                  </span>
                ) : null}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <AvailabilityBadge status={m.availability} />
                <ComplianceBadge status={m.compliance} />
                <Badge variant="accent">Match {m.score}%</Badge>
                <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AttentionSection({ attention }: { attention: AttentionItem[] }) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-medium">Wat vraagt aandacht</h2>
      </div>
      {attention.length === 0 ? (
        <div className="flex items-center gap-2 px-5 py-6 text-sm text-muted-foreground">
          <CheckCircle2 className="size-4 text-success" aria-hidden />
          Niets dat nu aandacht vraagt. Goed bezig.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {attention.map((a) => (
            <li key={a.label}>
              <Link
                href={a.href}
                className="focus-ring flex items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-muted/40"
              >
                <span className="flex items-center gap-2">
                  <ToneIcon tone={a.tone} />
                  {a.label}
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  const user = session!.user;
  const role = user.role as UserRole;
  const intro = INTRO[role];
  const firstName = (user.name ?? "").split(" ")[0] || "daar";
  const today = new Date().toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const [{ stats, attention, running, week, isNewAccount }, matches] = await Promise.all([
    dashboardData(role, user.id!),
    role === "FREELANCER" ? recommendedJobs(user.id!) : Promise.resolve<JobMatch[]>([]),
  ]);

  const hasRunning = running.length > 0;
  const headerLead =
    attention.length === 0
      ? hasRunning
        ? "Je lopende werk staat op schema."
        : intro.lead
      : attention.length === 1
        ? "Er is 1 punt dat je aandacht vraagt."
        : `Er zijn ${attention.length} punten die je aandacht vragen.`;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {WERKPLEK[role]} · {today}
        </p>
        <h1 className="text-xl font-semibold tracking-tight">Welkom terug, {firstName}</h1>
        <p className="text-sm text-muted-foreground">{headerLead}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="focus-ring rounded-lg border border-border bg-card p-5 transition-colors hover:bg-muted/40"
          >
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</p>
          </Link>
        ))}
      </section>

      {/* Zone 1 — Wat loopt er nu (lopende samenwerkingen + cascade-fase). */}
      {hasRunning && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium">Wat loopt er nu</h2>
            {week && (
              <p className="text-xs text-muted-foreground">
                Deze week: {week.entries.length} samenwerking(en) bij {week.clientCount}{" "}
                opdrachtgever(s)
              </p>
            )}
            <Link
              href="/samenwerkingen"
              className="focus-ring text-xs text-muted-foreground hover:text-foreground"
            >
              Alle samenwerkingen
            </Link>
          </div>
          {week && (
            <ul className="flex flex-wrap gap-2">
              {week.entries.map((e) => (
                <li key={e.collaborationId}>
                  <Badge variant="muted">
                    {e.clientName} · {TIMING_LABEL[e.timing] ?? "Loopt"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {running.map((c) => (
              <RunningCard key={c.id} collab={c} />
            ))}
          </div>
        </section>
      )}

      {/* Zone 3 prominent — bij weinig lopend werk eerst de matches. */}
      {role === "FREELANCER" && !hasRunning && matches.length > 0 && (
        <MatchesSection matches={matches} prominent />
      )}

      {/* Zone 2 — Wat vraagt aandacht (gerangschikte next-actions met tone). */}
      <AttentionSection attention={attention} />

      {/* Zone 3 compact — naast lopend werk de matches eronder. */}
      {role === "FREELANCER" && hasRunning && matches.length > 0 && (
        <MatchesSection matches={matches} prominent={false} />
      )}

      {/* Aan de slag — onboarding alleen voor nieuwe accounts. */}
      {isNewAccount && (
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-medium">Aan de slag</h2>
          <ul className="mt-3 space-y-2">
            {intro.next.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-border text-[11px] font-medium text-foreground">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
