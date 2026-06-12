import { type Metadata } from "next";
import Link from "next/link";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { auth } from "@/auth";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { pendingTasks } from "@/lib/actions/pending-tasks";
import { loadDrawerData } from "@/lib/actions/drawer-data";
import { getActivitySignal } from "@/lib/activity-signal";
import { DashboardActions } from "@/components/actions/dashboard-actions";
import { ActivitySignalBar } from "@/components/dashboard/activity-signal";
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
import { startConversationWithFreelancer } from "@/app/(protected)/berichten/actions";
import { clientCredentialAlerts, shortCredentialAlert } from "@/lib/collaboration-alerts";
import { computeFreelancerCompleteness } from "@/lib/profile";
import { getCompletenessProfile } from "@/lib/data/freelancer-profile";
import { franchiserNextActions, type NextAction, type NextActionTone } from "@/lib/next-actions";
import { cascadeStage, type CascadeStage } from "@/lib/cascade/stage";
import { weekOverview, type WeekOverview } from "@/lib/week-overview";
import { parseWeekdays, formatWeekdays } from "@/lib/weekdays";
import { computeEngageability, type EngageabilityResult } from "@/lib/engageability";
import { computeTrustLevel, type TrustLevel } from "@/lib/trust";
import { mandatoryDocuments } from "@/lib/mandatory-documents";
import { type FreelancerCredential } from "@/lib/matching";
import { Badge } from "@/components/ui/badge";
import { MatchMeter } from "@/components/ui/match-meter";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ComplianceBadge } from "@/components/compliance-badge";
import { AvailabilityBadge } from "@/components/availability-badge";
import { EngageabilityExplanation } from "@/components/engageability-explanation";
import { plural } from "@/lib/plural";

export const metadata: Metadata = { title: "Dashboard · ZZP Platform" };

const WERKPLEK: Record<UserRole, string> = {
  FREELANCER: "ZZP-werkplek",
  CLIENT: "Opdrachtgever-werkplek",
  ADMIN: "Beheerwerkplek",
  FRANCHISER: "Franchise-werkplek",
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
    lead: "Breng opdrachtgevers en ZZP'ers in je franchise en zet diensten voor ze uit.",
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
  week: WeekOverview | null;
  isNewAccount: boolean;
  /** Geleide activatie-stappen (alleen franchiser); leeg zodra de franchise volledig staat. */
  activation: NextAction[];
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
    const [applications, creds, runningRows, me] = await Promise.all([
      pid ? prisma.application.count({ where: { freelancerId: pid } }) : Promise.resolve(0),
      // Eén query voor alle certificaten van de ZZP'er; de telling leiden we in-memory af.
      pid
        ? prisma.credential.findMany({
            where: { freelancerProfileId: pid },
            select: { type: true, status: true, expiresAt: true },
          })
        : Promise.resolve<{ type: string; status: string; expiresAt: Date | null }[]>([]),
      // Lopende samenwerkingen (niet-terminaal) met de gegevens om de cascade-fase af te leiden.
      // Interim-cap tegen onbegrensde groei (audit QW3); echte cursor-paginatie volgt in T3.
      prisma.collaboration.findMany({
        where: { freelancer: { userId }, status: { in: ["PROPOSED", "ACTIVE"] } },
        take: 100,
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
        orderBy: { createdAt: "desc" },
      }),
      // Identiteit + recency voor de inzetbaarheidsstatus (lichte select, geen extra joins).
      prisma.user.findUnique({
        where: { id: userId },
        select: { identityVerifiedAt: true, lastLoginAt: true },
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
      week,
      isNewAccount: applications === 0 && running.length === 0,
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
    const [openJobs, newApps, drafts, activeCollabs, runningRows, suggestedFreelancers] =
      await Promise.all([
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
        // Interim-cap tegen onbegrensde groei (audit QW3); echte cursor-paginatie volgt in T3.
        prisma.collaboration.findMany({
          where: { company: { userId }, status: { in: ["PROPOSED", "ACTIVE"] } },
          take: 100,
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
        // Voorgestelde ZZP'ers, geaggregeerd over de gepubliceerde opdrachten (zone 3).
        suggestedFreelancersForClient(userId, 4),
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
      activation: [],
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

  const [pending, users, jobs, runningRows] = await Promise.all([
    prisma.credential.count({ where: { status: "SUBMITTED" } }),
    prisma.user.count(),
    prisma.job.count(),
    // Platformbrede lopende samenwerkingen — de admin ziet dezelfde "Wat loopt er nu"-zone
    // als de partijen, met de meest recent bewogen samenwerkingen bovenaan.
    prisma.collaboration.findMany({
      where: { status: { in: ["PROPOSED", "ACTIVE"] } },
      take: 6,
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

/** Lege staat van de "Wat loopt er nu"-zone: wat is de eerstvolgende stap richting lopend werk? */
const NO_RUNNING: Record<UserRole, { text: string; cta?: { label: string; href: string } }> = {
  FREELANCER: {
    text: "Geen lopende samenwerkingen. Reageer op een opdracht die bij je past om te starten.",
    cta: { label: "Bekijk opdrachten", href: "/opdrachten" },
  },
  CLIENT: {
    text: "Geen lopende samenwerkingen. Plaats een opdracht om ZZP'ers voorgesteld te krijgen.",
    cta: { label: "Opdracht plaatsen", href: "/opdrachten/nieuw" },
  },
  ADMIN: { text: "Geen lopende samenwerkingen op het platform." },
  FRANCHISER: {
    text: "Geen lopende samenwerkingen in je franchise. Zet een dienst uit om te starten.",
    cta: { label: "Naar diensten", href: "/franchise/diensten" },
  },
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

function MatchesSection({ matches, prominent }: { matches: JobMatch[]; prominent: boolean }) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div>
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Wat kan ik oppakken
          </h2>
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
                {m.reason ? (
                  <span className="block truncate text-xs text-primary">{m.reason}</span>
                ) : m.related ? (
                  <span className="block truncate text-xs text-primary">
                    Sluit inhoudelijk aan op je profiel
                  </span>
                ) : null}
              </span>
              <span className="flex shrink-0 items-center gap-3">
                {/* Rustig houden: badges alleen als ze iets signaleren — "beschikbaar" en
                    "voldoet aan eisen" zijn de norm en hoeven geen aandacht te vragen. */}
                {m.availability !== "AVAILABLE" && <AvailabilityBadge status={m.availability} />}
                {m.compliance !== "COMPLIANT" && <ComplianceBadge status={m.compliance} />}
                <span className="flex flex-col items-end gap-1">
                  <span className="font-mono text-sm font-semibold tracking-tight text-primary">
                    {m.score}%
                  </span>
                  <MatchMeter score={m.score} />
                </span>
                <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ClientSuggestionsSection({
  suggestions,
  prominent,
}: {
  suggestions: ClientFreelancerSuggestion[];
  prominent: boolean;
}) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div>
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Wat kan ik oppakken
          </h2>
          {prominent && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Geschikte ZZP&apos;ers voor je opdrachten — benader ze direct.
            </p>
          )}
        </div>
        <Link
          href="/kandidaten"
          className="focus-ring text-xs text-muted-foreground hover:text-foreground"
        >
          Alle kandidaten
        </Link>
      </div>
      <ul className="divide-y divide-border">
        {suggestions.map((f) => (
          <li key={f.freelancerId} className="px-5 py-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-1.5">
                  <Link
                    href={`/zzp/${f.freelancerId}`}
                    target="_blank"
                    className="focus-ring truncate font-medium hover:text-primary"
                  >
                    {f.name}
                  </Link>
                  <TrustBadge level={f.trustLevel} />
                </span>
                {f.related && (
                  <span className="block truncate text-xs text-primary">
                    Sluit inhoudelijk aan op je opdracht
                  </span>
                )}
                <span className="block truncate text-xs text-muted-foreground">{f.jobTitle}</span>
              </span>
              <span className="flex shrink-0 flex-wrap items-center gap-3">
                {/* Rustig: badges alleen als ze iets signaleren — beschikbaar/compliant is de norm. */}
                {f.availability !== "AVAILABLE" && <AvailabilityBadge status={f.availability} />}
                {f.compliance !== "COMPLIANT" && <ComplianceBadge status={f.compliance} />}
                <span className="flex flex-col items-end gap-1">
                  <span className="font-mono text-sm font-semibold tracking-tight text-primary">
                    {f.score}%
                  </span>
                  <MatchMeter score={f.score} />
                </span>
                <form action={startConversationWithFreelancer.bind(null, f.jobId, f.freelancerId)}>
                  <Button type="submit" variant="secondary" size="sm">
                    Bericht sturen
                  </Button>
                </form>
              </span>
            </div>
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
    timeZone: "Europe/Amsterdam",
  });
  const actor = await requireActor();
  const [
    {
      stats,
      running,
      week,
      isNewAccount,
      activation,
      engageability,
      suggestedFreelancers,
      identity,
    },
    matches,
    tasks,
    activity,
  ] = await Promise.all([
    dashboardData(role, user.id!),
    role === "FREELANCER" ? recommendedJobs(user.id!) : Promise.resolve<JobMatch[]>([]),
    pendingTasks(actor),
    role === "FREELANCER" || role === "CLIENT" ? getActivitySignal() : Promise.resolve(null),
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
      {/* Profielkaart — zelfde taal als de publieke-profielkop (/zzp/[id]): avatar, naam +
          zegel, subtitel, kerncijfers. Elke rol krijgt dezelfde opzet; de inhoud verschilt. */}
      <header className="rounded-lg border border-border bg-card p-5">
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

      {/* Zone 1 — Wat vraagt aandacht: direct onder de profielkaart, voor élke rol (voor de
          admin is dit de operationele wachtrij). Inline-afhandelbaar, zelfde resolvers als /acties. */}
      <DashboardActions
        tasks={tasks}
        drawerData={drawerData}
        title={role === "ADMIN" ? "Operationele wachtrij" : "Wat vraagt aandacht"}
      />

      {/* Zone 2 — Wat loopt er nu (lopende samenwerkingen + cascade-fase). Altijd zichtbaar,
          voor elke rol dezelfde plek; zonder lopend werk een lege staat met de eerstvolgende stap. */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Wat loopt er nu
          </h2>
          {week && (
            <p className="text-xs text-muted-foreground">
              Deze week: {plural(week.entries.length, "samenwerking", "samenwerkingen")} bij{" "}
              {plural(week.clientCount, "opdrachtgever", "opdrachtgevers")}
            </p>
          )}
          <Link
            href={SAMENWERKINGEN_HREF[role]}
            className="focus-ring text-xs text-muted-foreground hover:text-foreground"
          >
            Alle samenwerkingen
          </Link>
        </div>
        {week && (
          <ul className="flex flex-wrap gap-2">
            {week.entries.map((e) => {
              const rooster = e.weekdays?.length ? formatWeekdays(e.weekdays) : null;
              return (
                <li key={e.collaborationId}>
                  <Badge variant="muted" className="block max-w-[18rem] truncate">
                    {e.clientName} · {rooster ?? TIMING_LABEL[e.timing] ?? "Loopt"}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
        {hasRunning ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {running.map((c) => (
              <RunningCard key={c.id} collab={c} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">{NO_RUNNING[role].text}</p>
            {NO_RUNNING[role].cta && (
              <Button asChild size="sm" variant="secondary" className="mt-3">
                <Link href={NO_RUNNING[role].cta.href}>{NO_RUNNING[role].cta.label}</Link>
              </Button>
            )}
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="focus-ring rounded-lg border border-border bg-card p-5 transition-colors hover:bg-muted/40"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {s.label}
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">{s.value}</p>
            {s.sub && <p className="mt-0.5 text-xs text-muted-foreground">{s.sub}</p>}
          </Link>
        ))}
      </section>

      {/* Live, geanonimiseerd liquiditeitssignaal: een ZZP'er ziet de hoeveelheid werk, een
          opdrachtgever het beschikbare aanbod. Verbergt zichzelf zonder relevante activiteit. */}
      {activity && <ActivitySignalBar signal={activity} role={role} />}

      {/* Eigen inzetbaarheid — toont de ZZP'er wat een opdrachtgever ziet, met een concreet herstelpad.
          Verschijnt alleen als er iets te verbeteren valt (rustig houden zodra je inzetbaar bent). */}
      {role === "FREELANCER" && engageability && engageability.status !== "ACTIEF" && (
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Jouw inzetbaarheid
          </h2>
          <EngageabilityExplanation result={engageability} self />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="secondary">
              <Link href="/certificaten">Naar certificaten</Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href="/profiel/bewerken">Profiel aanvullen</Link>
            </Button>
          </div>
        </section>
      )}

      {/* Franchiser-activatie — geleide opzet van de franchise. Klikbare stappen die de eerstvolgende
          concrete actie tonen (opdrachtgever → dienst → roster); verdwijnt zodra de franchise staat. */}
      {role === "FRANCHISER" && activation.length > 0 && (
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Aan de slag
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Richt je franchise stap voor stap in.
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

      {/* Zone 3 prominent — bij weinig lopend werk eerst de matches. */}
      {role === "FREELANCER" && !hasRunning && matches.length > 0 && (
        <MatchesSection matches={matches} prominent />
      )}

      {/* Zone 3 prominent (CLIENT) — geschikte ZZP'ers wanneer er weinig loopt. */}
      {role === "CLIENT" && !hasRunning && (suggestedFreelancers?.length ?? 0) > 0 && (
        <ClientSuggestionsSection suggestions={suggestedFreelancers!} prominent />
      )}

      {/* Zone 3 leeg (CLIENT) — geen lopend werk en geen suggesties: nodig uit tot plaatsen.
          Niet tonen bovenop het onboarding-scherm (isNewAccount zonder taken). */}
      {role === "CLIENT" &&
        !hasRunning &&
        (suggestedFreelancers?.length ?? 0) === 0 &&
        !(isNewAccount && tasks.length === 0) && (
          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Wat kan ik oppakken
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Plaats een opdracht om geschikte ZZP&apos;ers voorgesteld te krijgen.
            </p>
            <Button asChild size="sm" variant="secondary" className="mt-3">
              <Link href="/opdrachten/nieuw">Opdracht plaatsen</Link>
            </Button>
          </section>
        )}

      {/* Zone 3 compact — naast lopend werk de matches eronder. */}
      {role === "FREELANCER" && hasRunning && matches.length > 0 && (
        <MatchesSection matches={matches} prominent={false} />
      )}
      {role === "CLIENT" && hasRunning && (suggestedFreelancers?.length ?? 0) > 0 && (
        <ClientSuggestionsSection suggestions={suggestedFreelancers!} prominent={false} />
      )}

      {/* Aan de slag — onboarding alleen voor nieuwe accounts, en alleen als het actiecentrum
          niets concreets toont (anders verschijnen profiel/identiteit dubbel). De franchiser heeft
          hierboven al zijn eigen, klikbare activatie-sectie. */}
      {isNewAccount && tasks.length === 0 && role !== "FRANCHISER" && (
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Aan de slag
          </h2>
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
