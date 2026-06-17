import { type Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  AlertTriangle,
  Gauge,
  Handshake,
  Wallet,
  Briefcase,
  Bell,
  CheckCircle2,
  ShieldCheck,
  Inbox,
} from "lucide-react";
import { auth } from "@/auth";
import { WorkspaceDashboard, type WsAction } from "@/components/dashboard/workspace-dashboard";
import { getClientStats } from "@/lib/client-stats";
import { formatEuro } from "@/lib/invoices";
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
  type CredentialStatus,
} from "@/lib/enums";
import { activeVerifiedCount } from "@/lib/credentials";
import { type PerformanceState, type InvoiceLifecycleState } from "@/lib/lifecycles";
import { recommendedJobs, type JobMatch } from "@/lib/recommendations";
import { suggestedFreelancersForClient, type ClientFreelancerSuggestion } from "@/lib/suggestions";
import { TrustBadge } from "@/components/trust/trust-badge";
import {
  clientCredentialAlerts,
  shortCredentialAlert,
  summarizeClientCompliance,
  type ClientComplianceSnapshot,
} from "@/lib/collaboration-alerts";
import { computeFreelancerCompleteness } from "@/lib/profile";
import { getCompletenessProfile } from "@/lib/data/freelancer-profile";
import { franchiserNextActions, type NextAction, type NextActionTone } from "@/lib/next-actions";
import { cascadeStage, type CascadeStage } from "@/lib/cascade/stage";
import { weekOverview, type WeekOverview } from "@/lib/week-overview";
import { buildWeekStrip } from "@/lib/week-strip";
import { RUNNING_ZONE_LIMIT, runningZonePlan } from "@/lib/running-zone";
import { parseWeekdays } from "@/lib/weekdays";
import { computeEngageability, type EngageabilityResult } from "@/lib/engageability";
import { computeTrustLevel, type TrustLevel } from "@/lib/trust";
import { mandatoryDocuments } from "@/lib/mandatory-documents";
import { type FreelancerCredential } from "@/lib/matching";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { parseLanguages } from "@/lib/parse-languages";

export const metadata: Metadata = { title: "Dashboard · ZZP Platform" };

const WERKPLEK: Record<UserRole, string> = {
  FREELANCER: "ZZP-werkplek",
  CLIENT: "Opdrachtgever-werkplek",
  ADMIN: "Beheerwerkplek",
  FRANCHISER: "Bemiddelaar-werkplek",
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
  FRANCHISER: {
    lead: "Breng opdrachtgevers en ZZP'ers in je bemiddeling en zet diensten voor ze uit.",
    next: [
      "Voeg je eerste opdrachtgever toe met zijn afdelingen.",
      "Breng ZZP'ers in je roster.",
      "Zet diensten uit voor een afdeling.",
    ],
  },
};

interface Stat {
  label: string;
  value: string | number;
  href: string;
  /** Optionele verduidelijking onder het getal (bv. "excl. afgevallen"). */
  sub?: string;
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
  /** Lopende samenwerkingen buiten de zone-grens (doorverwijs-tegel "Nog n lopende …"). */
  runningOverflow: number;
  week: WeekOverview | null;
  isNewAccount: boolean;
  /** Geleide activatie-stappen (alleen franchiser); leeg zodra de franchise volledig staat. */
  activation: NextAction[];
  /** Geaggregeerde certificaat-compliance van lopende samenwerkingen (alleen CLIENT). */
  complianceSnapshot?: ClientComplianceSnapshot;
  /** Inzetbaarheidsstatus van de ZZP'er zelf (alleen FREELANCER). */
  engageability?: EngageabilityResult | null;
  /** Voorgestelde ZZP'ers voor de opdrachtgever (alleen CLIENT). */
  suggestedFreelancers?: ClientFreelancerSuggestion[];
  /** Profielkaart-gegevens voor de kop (publieke-profiel-stijl); per rol gevuld. */
  identity?: IdentityCard;
}

/** Kopkaart in de stijl van het publieke profiel: subtitel, kerncijfers, zegel, publieke link. */
interface IdentityCard {
  subtitle: string | null;
  /** Kerncijfers-regel (bv. uurtarief); eerste item in mono. */
  meta: string[];
  trustLevel?: TrustLevel;
  /** Link naar profiel bewerken (alleen ZZP'er) — "Mijn profiel" toont al de publieke weergave. */
  editHref?: string;
}

function initials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

// Beschikbaarheid -> status-badge in de professionals-lijst (#19).
const AVAILABILITY_LABEL: Record<string, { label: string; cls: string }> = {
  AVAILABLE: { label: "Beschikbaar", cls: "bg-success/10 text-success" },
  LIMITED: { label: "Beperkt", cls: "bg-warning/10 text-warning" },
  UNAVAILABLE: { label: "Niet beschikbaar", cls: "bg-muted text-muted-foreground" },
};

const ACTION_ICON = { attention: AlertTriangle, info: Bell, success: CheckCircle2 } as const;
const ACTION_TONE = { attention: "warning", info: "primary", success: "success" } as const;
const WEEKDAY_NL: Record<string, string> = {
  MON: "ma",
  TUE: "di",
  WED: "wo",
  THU: "do",
  FRI: "vr",
  SAT: "za",
  SUN: "zo",
};

/** Open taken -> #19 "Volgende acties"-items voor de rechterrail. */
function tasksToActions(
  tasks: { title: string; subtitle?: string; tone: NextActionTone; href: string }[],
): WsAction[] {
  return tasks.slice(0, 6).map((t, i) => ({
    id: `${i}-${t.href}`,
    icon: ACTION_ICON[t.tone],
    title: t.title,
    detail: t.subtitle,
    href: t.href,
    tone: ACTION_TONE[t.tone],
  }));
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
    const [applications, creds, runningRows, me, runningTotal] = await Promise.all([
      pid ? prisma.application.count({ where: { freelancerId: pid } }) : Promise.resolve(0),
      // Eén query voor alle certificaten van de ZZP'er; de telling leiden we in-memory af.
      pid
        ? prisma.credential.findMany({
            where: { freelancerProfileId: pid },
            select: { type: true, status: true, expiresAt: true },
          })
        : Promise.resolve<{ type: string; status: string; expiresAt: Date | null }[]>([]),
      // Lopende samenwerkingen (niet-terminaal) met de gegevens om de cascade-fase af te leiden.
      // Bewust begrensd tot de zone-grens, meest recent bewogen bovenaan (audit T3) —
      // de volledige gepagineerde lijst staat op /samenwerkingen.
      prisma.collaboration.findMany({
        where: { freelancer: { userId }, status: { in: ["PROPOSED", "ACTIVE"] } },
        take: RUNNING_ZONE_LIMIT,
        select: {
          id: true,
          status: true,
          contractStatus: true,
          disputedAt: true,
          startDate: true,
          endDate: true,
          rate: true,
          weekdays: true,
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
        orderBy: { updatedAt: "desc" },
      }),
      // Identiteit + recency voor de inzetbaarheidsstatus (lichte select, geen extra joins).
      prisma.user.findUnique({
        where: { id: userId },
        select: { identityVerifiedAt: true, lastLoginAt: true },
      }),
      // Totaal lopende samenwerkingen, voor de eerlijke overloop-telling in de zone.
      prisma.collaboration.count({
        where: { freelancer: { userId }, status: { in: ["PROPOSED", "ACTIVE"] } },
      }),
    ]);

    // Geverifieerde certificaten voor de statistiek-tegel: VERIFIED én niet verlopen — consistent met
    // /certificaten, het publieke profiel en het vertrouwensniveau (een verlopen bewijs telt niet mee).
    const verified = activeVerifiedCount(
      creds.map((c) => ({ status: c.status as CredentialStatus, expiresAt: c.expiresAt })),
    );

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
    const zone = runningZonePlan(runningTotal);
    // Weekoverzicht alleen bij meerdere lopende samenwerkingen (anders voegt het niets toe)
    // én volledige data (boven de zone-grens zou de "Deze week"-telling liegen).
    const week = zone.showWeek
      ? weekOverview(
          runningRows.map((c) => ({
            collaborationId: c.id,
            clientId: c.company.id,
            clientName: c.company.name,
            jobTitle: c.job.title,
            startDate: c.startDate,
            endDate: c.endDate,
            rate: c.rate,
            weekdays: parseWeekdays(c.weekdays),
          })),
          now,
        )
      : null;

    const engageability = profile
      ? computeEngageability(
          {
            credentials: creds.map(
              (c): FreelancerCredential => ({
                type: c.type as FreelancerCredential["type"],
                status: c.status as FreelancerCredential["status"],
                expiresAt: c.expiresAt,
              }),
            ),
            completeness: completeness.score,
            availability: profile.availability as Availability,
            identityVerified: me?.identityVerifiedAt != null,
            lastActiveAt: me?.lastLoginAt ?? null,
          },
          now,
        )
      : null;

    // Vertrouwenszegel — zelfde berekening als het publieke profiel en het deelbare dossier,
    // zodat de ZZP'er op het dashboard exact ziet wat een opdrachtgever ziet.
    const trust = computeTrustLevel({
      identityVerified: me?.identityVerifiedAt != null,
      verifiedCredentialCount: verified,
      mandatoryDocsComplete: mandatoryDocuments(
        creds.map(
          (c): FreelancerCredential => ({
            type: c.type as FreelancerCredential["type"],
            status: c.status as FreelancerCredential["status"],
            expiresAt: c.expiresAt,
          }),
        ),
        now,
      ).allSatisfied,
    });

    return {
      stats: [
        { label: "Profielvelden", value: `${completeness.score}%`, href: "/profiel/bewerken" },
        { label: "Geverifieerde certificaten", value: verified, href: "/certificaten" },
        { label: "Mijn reacties", value: applications, href: "/reacties" },
      ],
      running,
      runningOverflow: zone.overflow,
      week,
      isNewAccount: applications === 0 && runningTotal === 0,
      activation: [],
      engageability,
      identity: {
        subtitle: [profile?.headline, profile?.location].filter(Boolean).join(" · ") || null,
        meta: profile?.hourlyRate != null ? [`€ ${profile.hourlyRate}/uur`] : [],
        trustLevel: trust.level,
        editHref: "/profiel/bewerken",
      },
    };
  }

  if (role === "CLIENT") {
    const company = await prisma.company.findUnique({
      where: { userId },
      select: { id: true, name: true, location: true },
    });
    const cid = company?.id;
    const [
      openJobs,
      newApps,
      drafts,
      activeCollabs,
      runningRows,
      suggestedFreelancers,
      runningTotal,
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
      // Lopende samenwerkingen vanuit de opdrachtgever: dezelfde cascade, ander perspectief.
      // Bewust begrensd tot de zone-grens, meest recent bewogen bovenaan (audit T3).
      prisma.collaboration.findMany({
        where: { company: { userId }, status: { in: ["PROPOSED", "ACTIVE"] } },
        take: RUNNING_ZONE_LIMIT,
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
        orderBy: { updatedAt: "desc" },
      }),
      // Voorgestelde ZZP'ers, geaggregeerd over de gepubliceerde opdrachten (zone 3).
      suggestedFreelancersForClient(userId, 4),
      // Totaal lopende samenwerkingen, voor de eerlijke overloop-telling in de zone.
      prisma.collaboration.count({
        where: { company: { userId }, status: { in: ["PROPOSED", "ACTIVE"] } },
      }),
    ]);
    // Compliance-waarschuwingen per lopende samenwerking (ZZP'er mist/verlopen vereist certificaat),
    // zodat de opdrachtgever dit ook op het dashboard ziet — niet alleen op /samenwerkingen.
    // De volledige lijst voedt zowel de per-kaart melding als de geaggregeerde momentopname,
    // zodat ook samenwerkingen buiten de top-6 zone in de telling meetellen.
    const credentialAlerts = await clientCredentialAlerts(userId);
    const complianceByCollab = new Map(
      credentialAlerts.map((a) => [a.collaborationId, shortCredentialAlert(a.alert)]),
    );
    const complianceSnapshot = summarizeClientCompliance(credentialAlerts);
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
      runningOverflow: runningZonePlan(runningTotal).overflow,
      week: null,
      isNewAccount: openJobs === 0 && drafts === 0 && activeCollabs === 0,
      activation: [],
      complianceSnapshot,
      suggestedFreelancers,
      identity: {
        subtitle: [company?.name, company?.location].filter(Boolean).join(" · ") || null,
        meta: [],
      },
    };
  }

  if (role === "FRANCHISER") {
    // Tenant-overzicht: opdrachtgevers + ZZP'ers + open diensten binnen de eigen franchise.
    const me = await prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true } });
    const tenantId = me?.tenantId ?? null;
    const [
      companies,
      freelancers,
      openDiensten,
      activeCollabs,
      companiesWithoutDiensten,
      openLeads,
    ] = tenantId
      ? await Promise.all([
          prisma.company.count({ where: { tenantId } }),
          prisma.freelancerProfile.count({ where: { tenantId } }),
          prisma.job.count({ where: { tenantId, status: "PUBLISHED" } }),
          prisma.collaboration.count({ where: { job: { tenantId }, status: "ACTIVE" } }),
          prisma.company.count({ where: { tenantId, jobs: { none: { status: "PUBLISHED" } } } }),
          // Lopende acquisitie: leads die nog niet klant of afgevallen zijn.
          prisma.lead.count({ where: { tenantId, status: { in: ["KOUD", "WARM"] } } }),
        ])
      : [0, 0, 0, 0, 0, 0];
    return {
      stats: [
        { label: "Opdrachtgevers", value: companies, href: "/franchise/opdrachtgevers" },
        { label: "ZZP'ers", value: freelancers, href: "/franchise/zzpers" },
        { label: "Open diensten", value: openDiensten, href: "/franchise/diensten" },
        { label: "Lopende samenwerkingen", value: activeCollabs, href: "/franchise/samenwerkingen" }, // prettier-ignore
        { label: "Open leads", value: openLeads, href: "/franchise/leads", sub: "excl. afgevallen" }, // prettier-ignore
      ],
      running: [],
      runningOverflow: 0,
      week: null,
      isNewAccount: companies === 0 && freelancers === 0,
      // Geleide opzet: verschijnt zolang de franchise nog niet volledig staat (ook bij gedeeltelijke
      // inrichting), en verdwijnt zodra er een opdrachtgever met diensten én een roster is.
      activation: franchiserNextActions({
        companies,
        publishedDiensten: openDiensten,
        rosterFreelancers: freelancers,
        companiesWithoutDiensten,
      }),
    };
  }

  const [pending, users, jobs, runningRows, runningTotal] = await Promise.all([
    prisma.credential.count({ where: { status: "SUBMITTED" } }),
    prisma.user.count(),
    prisma.job.count(),
    // Platformbrede lopende samenwerkingen — de admin ziet dezelfde "Wat loopt er nu"-zone
    // als de partijen, met de meest recent bewogen samenwerkingen bovenaan.
    prisma.collaboration.findMany({
      where: { status: { in: ["PROPOSED", "ACTIVE"] } },
      take: RUNNING_ZONE_LIMIT,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        status: true,
        contractStatus: true,
        disputedAt: true,
        job: { select: { title: true } },
        company: { select: { name: true } },
        freelancer: { select: { user: { select: { name: true } } } },
        performances: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true } },
        invoices: {
          where: { lifecycleStatus: { not: null } },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { lifecycleStatus: true },
        },
      },
    }),
    // Totaal lopende samenwerkingen op het platform, voor de overloop-telling in de zone.
    prisma.collaboration.count({ where: { status: { in: ["PROPOSED", "ACTIVE"] } } }),
  ]);
  const running: RunningCollab[] = runningRows.map((c) => ({
    id: c.id,
    jobTitle: c.job.title,
    // Beide partijen: de admin kijkt mee, niet vanuit één kant.
    counterpartyName: [c.freelancer.user.name, c.company.name].filter(Boolean).join(" · "),
    // Beschrijving vanuit het opdrachtgever-perspectief leest voor een meekijkende admin
    // het neutraalst ("wacht op uren/oplevering van de ZZP'er").
    stage: cascadeStage({
      viewer: "CLIENT",
      collaborationId: c.id,
      collaborationStatus: c.status as CollaborationStatus,
      contractStatus: c.contractStatus as ContractStatus,
      disputed: c.disputedAt !== null,
      latestPerformanceStatus: (c.performances[0]?.status ?? null) as PerformanceState | null,
      latestInvoiceStatus: (c.invoices[0]?.lifecycleStatus ?? null) as InvoiceLifecycleState | null,
    }),
  }));
  return {
    stats: [
      { label: "Openstaande verificaties", value: pending, href: "/admin/verificaties" },
      { label: "Gebruikers", value: users, href: "/admin/gebruikers" },
      { label: "Opdrachten", value: jobs, href: "/admin/opdrachten" },
    ],
    running,
    runningOverflow: runningZonePlan(runningTotal).overflow,
    week: null,
    isNewAccount: false,
    activation: [],
  };
}

// --- Presentatie-helpers ---------------------------------------------------

const TONE_BADGE: Record<NextActionTone, "warning" | "muted" | "success"> = {
  attention: "warning",
  info: "muted",
  success: "success",
};

/** Overzichtslink van de "Wat loopt er nu"-zone, per rol. */
const SAMENWERKINGEN_HREF: Record<UserRole, string> = {
  FREELANCER: "/samenwerkingen",
  CLIENT: "/samenwerkingen",
  ADMIN: "/admin/samenwerkingen",
  FRANCHISER: "/franchise/samenwerkingen",
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
        <Badge variant={TONE_BADGE[stage.tone]} className="shrink-0" title={stage.label}>
          {stage.badgeLabel}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">{stage.label}</p>
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
    timeZone: "Europe/Amsterdam",
  });
  const actor = await requireActor();
  const [
    {
      stats,
      running,
      runningOverflow,
      week,
      activation,
      engageability,
      complianceSnapshot,
      suggestedFreelancers,
      identity,
    },
    matches,
    tasks,
  ] = await Promise.all([
    dashboardData(role, user.id!),
    role === "FREELANCER" ? recommendedJobs(user.id!) : Promise.resolve<JobMatch[]>([]),
    pendingTasks(actor),
  ]);
  // Dezelfde item-niveau taken als /acties, hier inline-afhandelbaar in de aandacht-zone.
  const drawerData = await loadDrawerData(actor, tasks);

  const hasRunning = running.length > 0;
  const weekStrip = week ? buildWeekStrip(week) : null;
  const headerLead =
    tasks.length === 0
      ? hasRunning
        ? "Je lopende werk staat op schema."
        : intro.lead
      : tasks.length === 1
        ? "Er is 1 punt dat je aandacht vraagt."
        : `Er zijn ${tasks.length} punten die je aandacht vragen.`;

  // Profielkop (gedeeld tussen de #19-workspace en de klassieke render).
  const profileHeader = (
    <header className="rounded-lg border border-border bg-card p-5 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {WERKPLEK[role]} · {today}
      </p>
      <div className="mt-3 flex items-start gap-4">
        <div
          aria-hidden
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-lg font-semibold text-primary"
        >
          {initials(user.name ?? null)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="break-words font-display text-2xl font-semibold tracking-tight">
              {user.name ?? `Welkom terug, ${firstName}`}
            </h1>
            {identity?.trustLevel && <TrustBadge level={identity.trustLevel} />}
          </div>
          {identity?.subtitle && (
            <p className="mt-0.5 text-sm text-muted-foreground">{identity.subtitle}</p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {identity?.meta.map((m, i) => (
              <span
                key={m}
                className={i === 0 ? "font-mono font-semibold" : "text-muted-foreground"}
              >
                {m}
              </span>
            ))}
            <span className="text-muted-foreground">{headerLead}</span>
          </div>
          {identity?.editHref && (
            <Link
              href={identity.editHref}
              className="focus-ring mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Bewerk jouw profiel
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          )}
        </div>
      </div>
    </header>
  );

  // KPI-tegelrij — gedeeld tussen de rol-workspaces.
  const kpiTiles = stats.length > 0 && (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {stats.map((s) => (
        <Link
          key={s.label}
          href={s.href}
          className="focus-ring hover:shadow-card-hover rounded-lg border border-border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5"
        >
          <p className="font-mono text-2xl font-semibold tracking-tight">{s.value}</p>
          <p className="mt-1 text-sm font-medium">{s.label}</p>
          {s.sub && <p className="mt-0.5 text-xs text-muted-foreground">{s.sub}</p>}
        </Link>
      ))}
    </div>
  );

  // Lopende samenwerkingen-sectie — gedeeld tussen de rol-workspaces.
  const runningSection = (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Wat loopt er nu
        </h2>
        <Link
          href={SAMENWERKINGEN_HREF[role]}
          className="focus-ring text-xs text-muted-foreground hover:text-foreground"
        >
          Alle samenwerkingen
        </Link>
      </div>
      {hasRunning ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {running.map((c) => (
            <RunningCard key={c.id} collab={c} />
          ))}
          {runningOverflow > 0 && (
            <Link
              href={SAMENWERKINGEN_HREF[role]}
              className="card-interactive flex items-center justify-center rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground"
            >
              Nog {runningOverflow} lopende samenwerkingen →
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground shadow-card">
          Nog geen lopende samenwerkingen.
        </div>
      )}
    </section>
  );

  // --- ZZP'ER: #19 drie-koloms workspace met echte data ---
  if (role === "FREELANCER") {
    const fKpiIcons = [Gauge, ShieldCheck, Inbox];
    const fKpis = stats.map((st, i) => ({
      icon: fKpiIcons[i] ?? Gauge,
      label: st.label,
      value: String(st.value),
    }));
    const rows = matches.map((m) => ({
      id: m.jobId,
      initials: initials(m.title),
      accent: "bg-primary/10 text-primary",
      name: m.title,
      role: m.companyName,
      match: m.score,
      status: AVAILABILITY_LABEL[m.availability]?.label,
      statusClass: AVAILABILITY_LABEL[m.availability]?.cls,
      href: `/opdrachten/${m.jobId}`,
    }));
    const wk =
      week && weekStrip?.hasAny
        ? {
            title: "Deze week",
            count: `${week.entries.length} ${week.entries.length === 1 ? "dienst" : "diensten"}`,
            days: weekStrip.days.map((d) => ({
              label: WEEKDAY_NL[d.weekday] ?? d.weekday,
              date: String(d.date.getUTCDate()),
              load: Math.min(d.entries.length, 3),
              today: d.isToday,
            })),
          }
        : undefined;
    const openPunten = engageability
      ? engageability.blockers.length + engageability.attention.length
      : 0;
    const seal = engageability
      ? {
          title: "Inzetbaarheid",
          subtitle: engageability.label,
          items: [
            { label: "Status", value: engageability.label, ok: engageability.status === "ACTIEF" },
            { label: "Open aandachtspunten", value: String(openPunten), ok: openPunten === 0 },
          ],
          reportHref: "/certificaten",
        }
      : undefined;
    return (
      <WorkspaceDashboard
        header={{
          title: user.name ?? "Werkruimte",
          subtitle: identity?.subtitle ?? undefined,
          primaryAction: { label: "Opdrachten zoeken", href: "/opdrachten" },
        }}
        kpis={fKpis}
        list={{
          title: "Opdrachten voor jou",
          href: "/opdrachten",
          rows,
          empty: "Nog geen passende opdrachten — maak je profiel compleet voor betere matches.",
        }}
        nextActions={tasksToActions(tasks)}
        week={wk}
        seal={seal}
      />
    );
  }

  // --- OPDRACHTGEVER: #19 drie-koloms workspace met echte data ---
  if (role === "CLIENT") {
    const cs = await getClientStats(user.id!);
    const clientKpis = cs
      ? [
          { icon: Gauge, label: "Vervullingsgraad", value: `${cs.fillRate}%` },
          {
            icon: Handshake,
            label: "Actieve samenwerkingen",
            value: String(cs.activeCollaborations),
          },
          { icon: Briefcase, label: "Geplaatste opdrachten", value: String(cs.publishedJobs) },
          { icon: Wallet, label: "Uitgaven", value: formatEuro(cs.spentCents) },
        ]
      : stats.map((st) => ({ icon: Briefcase, label: st.label, value: String(st.value) }));
    const rows = (suggestedFreelancers ?? []).map((fr) => ({
      id: fr.freelancerId,
      initials: initials(fr.name),
      accent: "bg-primary/10 text-primary",
      name: fr.name,
      verified: fr.trustLevel === "VOLLEDIG",
      role: fr.headline ?? fr.jobTitle,
      location: fr.location,
      rate: fr.rate,
      match: fr.score,
      status: AVAILABILITY_LABEL[fr.availability]?.label,
      statusClass: AVAILABILITY_LABEL[fr.availability]?.cls,
      href: `/zzp/${fr.freelancerId}`,
    }));
    const seal = complianceSnapshot
      ? {
          title: "Compliance-zegel",
          subtitle:
            complianceSnapshot.total === 0
              ? "Geen lopende inzetten"
              : `${complianceSnapshot.total - complianceSnapshot.nonCompliant - complianceSnapshot.warning}/${complianceSnapshot.total} inzetten in orde`,
          items: [
            {
              label: "Ontbrekend/verlopen",
              value: String(complianceSnapshot.missing + complianceSnapshot.expired),
              ok: complianceSnapshot.missing + complianceSnapshot.expired === 0,
            },
            {
              label: "Verloopt binnenkort",
              value: String(complianceSnapshot.expiringSoon),
              ok: complianceSnapshot.expiringSoon === 0,
            },
            {
              label: "In beoordeling",
              value: String(complianceSnapshot.inReview),
              ok: complianceSnapshot.inReview === 0,
            },
          ],
          reportHref: "/samenwerkingen",
        }
      : undefined;
    return (
      <WorkspaceDashboard
        header={{
          title: user.name ?? "Werkruimte",
          subtitle: identity?.subtitle ?? undefined,
          primaryAction: { label: "Nieuwe opdracht", href: "/opdrachten/nieuw" },
        }}
        kpis={clientKpis}
        list={{
          title: "Voorgestelde professionals",
          href: "/freelancers",
          rows,
          empty: "Plaats een opdracht om geschikte ZZP'ers voorgesteld te krijgen.",
        }}
        nextActions={tasksToActions(tasks)}
        seal={seal}
      />
    );
  }

  // --- BEMIDDELAAR: #19 drie-koloms workspace ---
  if (role === "FRANCHISER") {
    return (
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-5">
          {profileHeader}
          {kpiTiles}
          {activation.length > 0 && (
            <section className="rounded-lg border border-border bg-card p-5 shadow-card">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Aan de slag
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Richt je bemiddeling stap voor stap in.
              </p>
              <ul className="mt-3 space-y-1">
                {activation.map((a, i) => (
                  <li key={a.id}>
                    <Link
                      href={a.href}
                      className="focus-ring -mx-2 flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted/40"
                    >
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-border text-[11px] font-medium text-foreground">
                        {i + 1}
                      </span>
                      <span className="flex-1 font-medium">{a.title}</span>
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {runningSection}
        </div>
        <aside className="space-y-5">
          <DashboardActions tasks={tasks} drawerData={drawerData} title="Wat vraagt aandacht" />
        </aside>
      </div>
    );
  }

  // --- ADMIN: #19 drie-koloms workspace (operationele wachtrij in de rail) ---
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-5">
        {profileHeader}
        {kpiTiles}
        {runningSection}
      </div>
      <aside className="space-y-5">
        <DashboardActions tasks={tasks} drawerData={drawerData} title="Operationele wachtrij" />
      </aside>
    </div>
  );
}
