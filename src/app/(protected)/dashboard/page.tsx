import { type Metadata } from "next";
import Link from "next/link";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { auth } from "@/auth";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { pendingTasks } from "@/lib/actions/pending-tasks";
import { loadDrawerData } from "@/lib/actions/drawer-data";
import { DashboardActions } from "@/components/actions/dashboard-actions";
import {
  type UserRole,
  type CollaborationStatus,
  type ContractStatus,
  type Availability,
} from "@/lib/enums";
import { type PerformanceState, type InvoiceLifecycleState } from "@/lib/lifecycles";
import { recommendedJobs, type JobMatch } from "@/lib/recommendations";
import { clientCredentialAlerts, shortCredentialAlert } from "@/lib/collaboration-alerts";
import { computeFreelancerCompleteness } from "@/lib/profile";
import { getCompletenessProfile } from "@/lib/data/freelancer-profile";
import { type NextActionTone } from "@/lib/next-actions";
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
interface RunningCollab {
  id: string;
  jobTitle: string;
  /** De andere partij: voor een ZZP'er de opdrachtgever, voor een opdrachtgever de ZZP'er. */
  counterpartyName: string;
  /** Compliance-waarschuwing voor deze samenwerking (bv. ZZP'er mist een vereist certificaat). */
  complianceWarning?: string;
  stage: CascadeStage;
}
interface DashboardData {
  stats: Stat[];
  running: RunningCollab[];
  week: WeekOverview | null;
  isNewAccount: boolean;
}

// Mirror van profiel/page.tsx: talen staan als JSON-array-string opgeslagen.
function parseLanguages(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

async function dashboardData(role: UserRole, userId: string): Promise<DashboardData> {
  if (role === "FREELANCER") {
    // Gedeelde, request-gecachte profiel-load (zie getCompletenessProfile): dezelfde query
    // die pendingTasks() ophaalt wordt binnen deze render hergebruikt i.p.v. opnieuw gedraaid.
    const profile = await getCompletenessProfile(userId);
    const pid = profile?.id;
    // Live berekend (zelfde bron als de profielpagina) zodat we de ontbrekende onderdelen
    // concreet kunnen tonen — "voeg toe: Uurtarief, Talen, ...".
    const completeness = profile
      ? computeFreelancerCompleteness({
          headline: profile.headline,
          bio: profile.bio,
          hourlyRate: profile.hourlyRate,
          location: profile.location,
          availability: profile.availability as Availability,
          languages: parseLanguages(profile.languages),
          skillCount: profile.skills.length,
          industryCount: profile.industries.length,
        })
      : { score: 0, missing: [] };
    const now = new Date();
    const [applications, creds, runningRows] = await Promise.all([
      pid ? prisma.application.count({ where: { freelancerId: pid } }) : Promise.resolve(0),
      // Eén query voor alle certificaten van de ZZP'er; de telling leiden we in-memory af.
      pid
        ? prisma.credential.findMany({
            where: { freelancerProfileId: pid },
            select: { status: true },
          })
        : Promise.resolve<{ status: string }[]>([]),
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

    // Geverifieerde certificaten voor de statistiek-tegel (in-memory uit de findMany hierboven).
    const verified = creds.filter((c) => c.status === "VERIFIED").length;

    const running: RunningCollab[] = runningRows.map((c) => ({
      id: c.id,
      jobTitle: c.job.title,
      counterpartyName: c.company.name,
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
        { label: "Profiel compleet", value: `${completeness.score}%`, href: "/profiel" },
        { label: "Geverifieerde certificaten", value: verified, href: "/certificaten" },
        { label: "Mijn reacties", value: applications, href: "/reacties" },
      ],
      running,
      week,
      isNewAccount: applications === 0 && running.length === 0,
    };
  }

  if (role === "CLIENT") {
    const company = await prisma.company.findUnique({
      where: { userId },
      select: { id: true },
    });
    const cid = company?.id;
    const [openJobs, newApps, drafts, activeCollabs, runningRows] = await Promise.all([
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
      // Lopende samenwerkingen vanuit de opdrachtgever: dezelfde cascade, ander perspectief.
      prisma.collaboration.findMany({
        where: { company: { userId }, status: { in: ["PROPOSED", "ACTIVE"] } },
        select: {
          id: true,
          status: true,
          contractStatus: true,
          disputedAt: true,
          job: { select: { title: true } },
          freelancer: { select: { user: { select: { name: true } } } },
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
    // Compliance-waarschuwingen per lopende samenwerking (ZZP'er mist/verlopen vereist certificaat),
    // zodat de opdrachtgever dit ook op het dashboard ziet — niet alleen op /samenwerkingen.
    const complianceByCollab = new Map(
      (await clientCredentialAlerts(userId)).map((a) => [
        a.collaborationId,
        shortCredentialAlert(a.alert),
      ]),
    );
    const running: RunningCollab[] = runningRows.map((c) => ({
      id: c.id,
      jobTitle: c.job.title,
      counterpartyName: c.freelancer.user.name ?? "ZZP'er",
      complianceWarning: complianceByCollab.get(c.id),
      stage: cascadeStage({
        viewer: "CLIENT",
        collaborationId: c.id,
        collaborationStatus: c.status as CollaborationStatus,
        contractStatus: c.contractStatus as ContractStatus,
        disputed: c.disputedAt !== null,
        latestPerformanceStatus: (c.performances[0]?.status ?? null) as PerformanceState | null,
        latestInvoiceStatus: (c.invoices[0]?.lifecycleStatus ??
          null) as InvoiceLifecycleState | null,
      }),
    }));
    return {
      stats: [
        { label: "Gepubliceerde opdrachten", value: openJobs, href: "/opdrachten" },
        { label: "Nieuwe reacties", value: newApps, href: "/kandidaten" },
        { label: "Actieve samenwerkingen", value: activeCollabs, href: "/samenwerkingen" },
      ],
      running,
      week: null,
      isNewAccount: openJobs === 0 && drafts === 0 && activeCollabs === 0,
    };
  }

  const [pending, users, jobs] = await Promise.all([
    prisma.credential.count({ where: { status: "SUBMITTED" } }),
    prisma.user.count(),
    prisma.job.count(),
  ]);
  return {
    stats: [
      { label: "Openstaande verificaties", value: pending, href: "/admin/verificaties" },
      { label: "Gebruikers", value: users, href: "/admin/gebruikers" },
      { label: "Opdrachten", value: jobs, href: "/admin/opdrachten" },
    ],
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
          <p className="truncate text-xs text-muted-foreground">{collab.counterpartyName}</p>
        </div>
        <Badge variant={TONE_BADGE[stage.tone]}>{stage.label}</Badge>
      </div>
      {collab.complianceWarning && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-danger">
          <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
          {collab.complianceWarning}
        </p>
      )}
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
  const actor = await requireActor();
  const [{ stats, running, week, isNewAccount }, matches, tasks] = await Promise.all([
    dashboardData(role, user.id!),
    role === "FREELANCER" ? recommendedJobs(user.id!) : Promise.resolve<JobMatch[]>([]),
    pendingTasks(actor),
  ]);
  // Dezelfde item-niveau taken als /acties, hier inline-afhandelbaar in de aandacht-zone.
  const drawerData = await loadDrawerData(actor, tasks);

  const hasRunning = running.length > 0;
  const headerLead =
    tasks.length === 0
      ? hasRunning
        ? "Je lopende werk staat op schema."
        : intro.lead
      : tasks.length === 1
        ? "Er is 1 punt dat je aandacht vraagt."
        : `Er zijn ${tasks.length} punten die je aandacht vragen.`;

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

      {/* Zone 2 — Wat vraagt aandacht: de top-taken inline-afhandelbaar (zelfde resolvers + drawer
          als /acties). Voor de admin is dit de operationele wachtrij. */}
      <DashboardActions
        tasks={tasks}
        drawerData={drawerData}
        title={role === "ADMIN" ? "Operationele wachtrij" : "Wat vraagt aandacht"}
      />

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
