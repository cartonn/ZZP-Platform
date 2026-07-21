import { type Metadata } from "next";
import {
  AlertTriangle,
  Gauge,
  Handshake,
  Wallet,
  Receipt,
  Briefcase,
  Bell,
  CheckCircle2,
  ShieldCheck,
  Inbox,
  Users,
} from "lucide-react";
import { auth } from "@/auth";
import {
  WorkspaceDashboard,
  type WsAction,
  type WsKpi,
  type WsWeekDay,
  type WsRow,
  type WsSealItem,
  type WsNotice,
} from "@/components/dashboard/workspace-dashboard";
import { noShowStandingNotice } from "@/lib/no-show";
import { getClientStats, fillRateHint } from "@/lib/client-stats";
import { getClientRevenueTrend, getFreelancerRevenueTrend } from "@/lib/revenue-trend";
import { getUnbilledInvoiceSummary } from "@/lib/data/unbilled-invoices";
import { formatDeltaPct, earningsDeltaTone } from "@/lib/revenue-delta";
import { getTranslator } from "@/lib/i18n/server";
import { avatarAccent } from "@/lib/avatar-accent";
import { formatEuro } from "@/lib/invoices";
import { summarizeIncomeGoal, incomeGoalGlance } from "@/lib/income-goal";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { pendingTasks } from "@/lib/actions/pending-tasks";
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
import {
  clientCredentialAlertsFromRows,
  COLLABORATION_ALERT_INCLUDE,
  shortCredentialAlert,
  summarizeClientCompliance,
  type ClientComplianceSnapshot,
} from "@/lib/collaboration-alerts";
import { computeFreelancerCompleteness } from "@/lib/profile";
import { getCompletenessProfile } from "@/lib/data/freelancer-profile";
import { type NextActionTone } from "@/lib/next-actions";
import {
  cascadeStage,
  isPerformanceNewerThanInvoice,
  type CascadeStage,
} from "@/lib/cascade/stage";
import { weekOverview, type WeekOverview } from "@/lib/week-overview";
import { buildWeekStrip } from "@/lib/week-strip";
import { RUNNING_ZONE_LIMIT, runningZonePlan } from "@/lib/running-zone";
import { parseWeekdays } from "@/lib/weekdays";
import { computeEngageability, type EngageabilityResult } from "@/lib/engageability";
import { employabilitySummary, type EmployabilitySummary } from "@/lib/employability-summary";
import { computeTrustLevel, type TrustLevel } from "@/lib/trust";
import { mandatoryDocuments } from "@/lib/mandatory-documents";
import { type FreelancerCredential } from "@/lib/matching";
import { parseLanguages } from "@/lib/parse-languages";

export const metadata: Metadata = { title: "Dashboard · ZZP Platform" };

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
  /** Geaggregeerde certificaat-compliance van lopende samenwerkingen (alleen CLIENT). */
  complianceSnapshot?: ClientComplianceSnapshot;
  /** Inzetbaarheidsstatus van de ZZP'er zelf (alleen FREELANCER). */
  engageability?: EngageabilityResult | null;
  /** Ingesteld maanddoel in centen (alleen FREELANCER; null zonder doel) — voedt de geldpuls-glance. */
  incomeGoalCents?: number | null;
  /** Afgeleide inzetbaarheids-samenvatting (alleen FREELANCER): één oordeel voor tegel + zegel. */
  employability?: EmployabilitySummary | null;
  /** Voorgestelde ZZP'ers voor de opdrachtgever (alleen CLIENT). */
  suggestedFreelancers?: ClientFreelancerSuggestion[];
  /** Profielkaart-gegevens voor de kop (publieke-profiel-stijl); per rol gevuld. */
  identity?: IdentityCard;
  /** Roster-lijst voor de #19-werkruimte (alleen FRANCHISER). */
  professionals?: WsRow[];
  /** Compliance-zegel voor de rail (alleen FRANCHISER; andere rollen bouwen 'm in de render). */
  seal?: { title: string; subtitle: string; items: WsSealItem[]; reportHref?: string };
  /** Passief rail-signaal (alleen FREELANCER): no-show-stand — historie, geen openstaande actie. */
  notice?: WsNotice | null;
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
// Badge-klasse voor een niet-inzetbare roster-ZZP'er op het bemiddelaar-dashboard (warning gaat vóór
// de kale beschikbaarheid — anders spreekt de lijst de rosterpagina tegen).
const ENGAGEABILITY_WARNING_CLS = "bg-warning/10 text-warning";

const ACTION_ICON = { attention: AlertTriangle, info: Bell, success: CheckCircle2 } as const;
const ACTION_TONE = { attention: "primary", info: "primary", success: "success" } as const;

/** ISO-weeknummer (maandag-gebaseerd) — voor de "Week NN"-strip in de rail (#19). */
function isoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7; // ma=0 … zo=6
  d.setUTCDate(d.getUTCDate() - dayNum + 3); // donderdag van deze week
  const firstThursday = d.getTime();
  d.setUTCMonth(0, 1);
  if (d.getUTCDay() !== 4) d.setUTCMonth(0, 1 + ((4 - d.getUTCDay() + 7) % 7));
  return 1 + Math.ceil((firstThursday - d.getTime()) / 604800000);
}

/**
 * Huidige week (ma–zo) als #19-strip. `loadByDate` (sleutel YYYY-MM-DD) overlayt het echte
 * aantal diensten per dag; ontbreekt het, dan 0. De strip toont altijd de week + "vandaag".
 */
function buildCurrentWeek(
  now: Date,
  count: string,
  loadByDate?: Map<string, number>,
  t: (s: string) => string = (s) => s,
): { title: string; count: string; days: WsWeekDay[] } {
  const labels = ["ma", "di", "wo", "do", "vr", "za", "zo"];
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const days: WsWeekDay[] = labels.map((label, i) => {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    return {
      label: t(label),
      date: String(dt.getDate()),
      load: Math.min(loadByDate?.get(key) ?? 0, 3),
      today: dt.toDateString() === now.toDateString(),
    };
  });
  return { title: `${t("Week")} ${isoWeekNumber(now)}`, count, days };
}

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
    const [applications, creds, runningRows, me, runningTotal, noShowUnjustified, latestNoShow] =
      await Promise.all([
        pid ? prisma.application.count({ where: { freelancerId: pid } }) : Promise.resolve(0),
        // Eén query voor alle certificaten van de ZZP'er; de telling leiden we in-memory af.
        pid
          ? // unbounded-allow: dashboard-widget aggregatie; eigenaar-scoped, inherent begrensd
            prisma.credential.findMany({
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
            performances: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { status: true, createdAt: true },
            },
            invoices: {
              where: { lifecycleStatus: { not: null } },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { lifecycleStatus: true, createdAt: true },
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
        // No-show-stand: aantal ONGEGRONDE no-shows (blijvende historie). Passief signaal op het
        // dashboard i.p.v. een openstaande next-action — er is geen ZZP-actie die dit "afhandelt"
        // (uitschrijving is een adminbeslissing), dus het hoort niet in de /acties-inbox.
        pid
          ? prisma.noShowReport.count({
              where: { freelancerProfileId: pid, verdict: "UNJUSTIFIED" },
            })
          : Promise.resolve(0),
        // Meest recente ongegronde melding — deep-link zodat de reden + het oordeel terug te lezen zijn.
        pid
          ? prisma.noShowReport.findFirst({
              where: { freelancerProfileId: pid, verdict: "UNJUSTIFIED" },
              orderBy: { createdAt: "desc" },
              select: { collaborationId: true },
            })
          : Promise.resolve(null),
      ]);
    const noShowNotice = noShowStandingNotice(noShowUnjustified);

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
        performanceNewerThanInvoice: isPerformanceNewerThanInvoice(
          c.performances[0]?.createdAt ?? null,
          c.invoices[0]?.createdAt ?? null,
        ),
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

    const mandatoryCreds = creds.map(
      (c): FreelancerCredential => ({
        type: c.type as FreelancerCredential["type"],
        status: c.status as FreelancerCredential["status"],
        expiresAt: c.expiresAt,
      }),
    );
    const md = mandatoryDocuments(mandatoryCreds, now);
    const engageability = profile
      ? computeEngageability(
          {
            credentials: mandatoryCreds,
            completeness: completeness.score,
            availability: profile.availability as Availability,
            identityVerified: me?.identityVerifiedAt != null,
            lastActiveAt: me?.lastLoginAt ?? null,
          },
          now,
        )
      : null;
    // Eén afgeleid oordeel voor zowel de tegel als het inzetbaarheids-zegel, uit dezelfde bron.
    const employability = engageability ? employabilitySummary(engageability, md) : null;

    // Vertrouwenszegel — zelfde berekening als het publieke profiel en het deelbare dossier,
    // zodat de ZZP'er op het dashboard exact ziet wat een opdrachtgever ziet.
    const trust = computeTrustLevel({
      identityVerified: me?.identityVerifiedAt != null,
      verifiedCredentialCount: verified,
      mandatoryDocsComplete: md.allSatisfied,
    });

    // Eerste tegel = inzetbaarheid (het echte "sta ik er goed voor?"-oordeel), niet een los
    // profielpercentage — één statuswaarheid, met de blokkade benoemd en doorklik naar de stap.
    const employabilityStat: Stat = employability
      ? {
          label: "Inzetbaarheid",
          value: employability.label,
          href: employability.href,
          sub: employability.blocker ?? undefined,
        }
      : { label: "Profielvelden", value: `${completeness.score}%`, href: "/profiel/bewerken" };

    return {
      stats: [
        employabilityStat,
        { label: "Geverifieerde certificaten", value: verified, href: "/certificaten" },
        { label: "Mijn reacties", value: applications, href: "/reacties" },
      ],
      running,
      runningOverflow: zone.overflow,
      week,
      isNewAccount: applications === 0 && runningTotal === 0,
      engageability,
      employability,
      incomeGoalCents: profile?.monthlyIncomeGoalCents ?? null,
      identity: {
        subtitle: [profile?.headline, profile?.location].filter(Boolean).join(" · ") || null,
        meta: profile?.hourlyRate != null ? [`€ ${profile.hourlyRate}/uur`] : [],
        trustLevel: trust.level,
        editHref: "/profiel/bewerken",
      },
      notice: noShowNotice
        ? {
            tone: noShowNotice.tone,
            title: noShowNotice.title,
            detail: noShowNotice.detail,
            ...(latestNoShow
              ? {
                  href: `/samenwerkingen/${latestNoShow.collaborationId}`,
                  hrefLabel: "Bekijk de melding",
                }
              : {}),
          }
        : null,
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
      credentialAlertRows,
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
          performances: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { status: true, createdAt: true },
          },
          invoices: {
            where: { lifecycleStatus: { not: null } },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { lifecycleStatus: true, createdAt: true },
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
      // Actieve samenwerkingen met certificaat-context — dezelfde selectie als
      // clientCredentialAlerts, maar in deze parallelle batch (het bedrijf is al bekend, dus
      // geen tweede company-lookup). De volledige lijst (take 200) voedt zowel de per-kaart
      // melding als de geaggregeerde momentopname, ook buiten de top-6 zone.
      cid
        ? prisma.collaboration.findMany({
            // disputedAt: null → een in dispuut zijnde samenwerking is bevroren en levert geen
            // compliance-waarschuwing/next-action op (consistent met /acties + signals.ts); anders
            // toonde dezelfde kaart tegelijk "Dispuut — bevroren" én een compliance-actiebadge.
            where: { companyId: cid, status: "ACTIVE", disputedAt: null },
            take: 200,
            include: COLLABORATION_ALERT_INCLUDE,
          })
        : Promise.resolve([]),
    ]);
    // Compliance-waarschuwingen per lopende samenwerking (ZZP'er mist/verlopen vereist certificaat),
    // zodat de opdrachtgever dit ook op het dashboard ziet — niet alleen op /samenwerkingen.
    const credentialAlerts = clientCredentialAlertsFromRows(credentialAlertRows, new Date());
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
        performanceNewerThanInvoice: isPerformanceNewerThanInvoice(
          c.performances[0]?.createdAt ?? null,
          c.invoices[0]?.createdAt ?? null,
        ),
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
    const now = new Date();
    const soon = new Date(now);
    soon.setDate(now.getDate() + 30);
    const [
      companies,
      freelancers,
      openDiensten,
      activeCollabs,
      openLeads,
      verifiedFreelancers,
      expiringSoon,
    ] = tenantId
      ? await Promise.all([
          prisma.company.count({ where: { tenantId } }),
          prisma.freelancerProfile.count({ where: { tenantId } }),
          prisma.job.count({ where: { tenantId, status: "PUBLISHED" } }),
          prisma.collaboration.count({ where: { job: { tenantId }, status: "ACTIVE" } }),
          // Lopende acquisitie: leads die nog niet klant of afgevallen zijn.
          prisma.lead.count({ where: { tenantId, status: { in: ["KOUD", "WARM"] } } }),
          // Compliance-zegel: identiteit geverifieerd + bewijsstukken die binnenkort verlopen.
          prisma.freelancerProfile.count({
            where: { tenantId, user: { identityVerifiedAt: { not: null } } },
          }),
          prisma.credential.count({
            where: {
              freelancerProfile: { tenantId },
              status: "VERIFIED",
              expiresAt: { gte: now, lte: soon },
            },
          }),
        ])
      : [0, 0, 0, 0, 0, 0, 0];
    // Roster-selectie voor de #19-lijst (meest recent bewogen bovenaan, begrensd tot de zone).
    const rosterRaw = tenantId
      ? await prisma.freelancerProfile.findMany({
          where: { tenantId },
          orderBy: { updatedAt: "desc" },
          take: RUNNING_ZONE_LIMIT,
          select: {
            id: true,
            headline: true,
            location: true,
            hourlyRate: true,
            availability: true,
            completeness: true,
            user: {
              select: { name: true, identityVerifiedAt: true, lastLoginAt: true },
            },
            credentials: { select: { type: true, status: true, expiresAt: true } },
          },
        })
      : [];
    // Inzetbaarheid per roster-ZZP'er — zelfde helper/bron als /franchise/zzpers, zodat de
    // dashboard-lijst en de rosterpagina nooit tegenspreken.
    const rosterEng = rosterRaw.map((f) => {
      const fcreds = f.credentials.map(
        (c): FreelancerCredential => ({
          type: c.type as FreelancerCredential["type"],
          status: c.status as FreelancerCredential["status"],
          expiresAt: c.expiresAt,
        }),
      );
      const eng = computeEngageability(
        {
          credentials: fcreds,
          completeness: f.completeness,
          availability: f.availability as Availability,
          identityVerified: f.user.identityVerifiedAt != null,
          lastActiveAt: f.user.lastLoginAt ?? null,
        },
        now,
      );
      return { f, fcreds, eng };
    });
    const professionals: WsRow[] = rosterEng.map(({ f, fcreds, eng }) => {
      const trust = computeTrustLevel({
        identityVerified: f.user.identityVerifiedAt != null,
        verifiedCredentialCount: activeVerifiedCount(
          f.credentials.map((c) => ({
            status: c.status as CredentialStatus,
            expiresAt: c.expiresAt,
          })),
        ),
        mandatoryDocsComplete: mandatoryDocuments(fcreds, now).allSatisfied,
      });
      // Blokkerende inzetbaarheidsstatus gaat vóór de kale beschikbaarheid: een niet-inzetbare
      // ZZP'er mag hier nooit als "Beschikbaar" tonen (dat sprak de rosterpagina tegen).
      const av = AVAILABILITY_LABEL[f.availability];
      const status = eng.status === "INACTIEF" ? { label: eng.label, cls: ENGAGEABILITY_WARNING_CLS } : av; // prettier-ignore
      return {
        id: f.id,
        initials: initials(f.user.name ?? null),
        accent: avatarAccent(f.user.name ?? f.id),
        name: f.user.name ?? "—",
        verified: trust.level === "VOLLEDIG",
        role: f.headline ?? "ZZP'er",
        location: f.location,
        rate: f.hourlyRate,
        status: status?.label,
        statusClass: status?.cls,
        href: `/franchise/zzpers/${f.id}`,
      };
    });
    const seal = {
      title: "Roster-compliance",
      subtitle:
        freelancers === 0
          ? "Nog geen ZZP'ers"
          : `${verifiedFreelancers}/${freelancers} geverifieerd`,
      items: [
        {
          label: "Identiteit geverifieerd",
          value: `${verifiedFreelancers}/${freelancers}`,
          ok: freelancers > 0 && verifiedFreelancers === freelancers,
        },
        { label: "Verloopt binnenkort", value: String(expiringSoon), ok: expiringSoon === 0 },
      ],
      reportHref: "/franchise/zzpers",
    };
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
      professionals,
      seal,
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
        performances: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { status: true, createdAt: true },
        },
        invoices: {
          where: { lifecycleStatus: { not: null } },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { lifecycleStatus: true, createdAt: true },
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
      performanceNewerThanInvoice: isPerformanceNewerThanInvoice(
        c.performances[0]?.createdAt ?? null,
        c.invoices[0]?.createdAt ?? null,
      ),
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
  };
}

// --- Presentatie-helpers ---------------------------------------------------

/** Cascade-fase-toon → status-chip-klasse voor de #19-lijst (admin "Wat loopt er nu"). */
const STAGE_STATUS_CLASS: Record<NextActionTone, string> = {
  attention: "bg-primary/10 text-primary",
  info: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
};

export default async function DashboardPage() {
  const session = await auth();
  const user = session!.user;
  const [actor, { t }] = await Promise.all([requireActor(), getTranslator()]);
  // Server-side waarheid (CLAUDE.md regel 1): vertak op de LIVE DB-rol uit requireActor(), niet op
  // de mogelijk verouderde rol in de JWT. De sessie is een stateless JWT (max. 8u geldig, geen
  // server-side revocatie); een rolwijziging in de DB — de enige weg waarop een ADMIN/FRANCHISER-rol
  // verandert — mag een nog-geldige oude sessie niet het platformbrede admin-dashboard (kruis-tenant
  // gebruikers-/opdracht-tellingen + namen van andere partijen) laten tonen. OWASP A01 / CWE-613.
  const role = actor.role;
  const [
    {
      stats,
      running,
      week,
      engageability,
      employability,
      incomeGoalCents,
      complianceSnapshot,
      suggestedFreelancers,
      identity,
      professionals,
      seal: franchiserSeal,
      notice,
    },
    matches,
    tasks,
    freelancerRevenueTrend,
    unbilledInvoices,
  ] = await Promise.all([
    dashboardData(role, user.id!),
    role === "FREELANCER" ? recommendedJobs(user.id!) : Promise.resolve<JobMatch[]>([]),
    pendingTasks(actor),
    role === "FREELANCER" ? getFreelancerRevenueTrend(user.id!) : Promise.resolve(null),
    role === "FREELANCER" ? getUnbilledInvoiceSummary(user.id!) : Promise.resolve(null),
  ]);
  const weekStrip = week ? buildWeekStrip(week) : null;

  // --- ZZP'ER: #19 drie-koloms workspace met echte data ---
  if (role === "FREELANCER") {
    const fKpiIcons = [Gauge, ShieldCheck, Inbox];
    const fKpis: WsKpi[] = stats.map((st, i) => ({
      icon: fKpiIcons[i] ?? Gauge,
      label: t(st.label),
      value: String(st.value),
      // Eerste tegel = inzetbaarheid: de delta-toon volgt exact het niveau — INACTIEF benoemt de
      // blokkade (warning), AANDACHT toont het aandachtspunt-signaal (warning), ACTIEF bevestigt
      // inzetbaarheid (success). Zo staat de status nooit met een tegenstrijdig gekleurd signaal.
      ...(i === 0 && employability
        ? employability.level === "ACTIEF"
          ? { delta: t("Inzetbaar"), deltaTone: "success" as const }
          : {
              delta: t(employability.blocker ?? "Aandacht nodig"),
              deltaTone: "warning" as const,
            }
        : {}),
    }));
    // Geldpuls: wat heb ik deze maand gefactureerd, met de maand-op-maand-delta. Leunt op de
    // al-geteste omzet-trend (`getFreelancerRevenueTrend`); de ZZP'er had geen geld-KPI op het
    // startscherm — dit is zijn meest-gewenste blik. €0 zonder basis toont geen delta-chip.
    // Heeft de ZZP'er een maanddoel ingesteld (/prognose), dan vervangt de doel-glance de
    // maand-op-maand-chip: "haal ik mijn doel?" is de meest motiverende dagelijkse blik. Het
    // verwachte deel komt uit de openstaande concepten (unbilledInvoices); server-berekend.
    if (freelancerRevenueTrend) {
      const goalGlance =
        incomeGoalCents != null
          ? incomeGoalGlance(
              summarizeIncomeGoal({
                goalCents: incomeGoalCents,
                realizedCents: freelancerRevenueTrend.currentCents,
                expectedCents: unbilledInvoices?.grossCents ?? 0,
              }),
              formatEuro,
            )
          : null;
      fKpis.push({
        icon: Wallet,
        label: t("Deze maand gefactureerd"),
        value: formatEuro(freelancerRevenueTrend.currentCents),
        hint: goalGlance
          ? goalGlance.hint
          : `${t("deze maand")} · ${freelancerRevenueTrend.series.at(-1)?.label ?? ""}`,
        delta: goalGlance ? goalGlance.delta : formatDeltaPct(freelancerRevenueTrend.deltaPct),
        deltaTone: goalGlance
          ? goalGlance.tone
          : earningsDeltaTone(freelancerRevenueTrend.deltaPct),
      });
    }
    // Nog te factureren: geleverd/goedgekeurd werk staat als concept-factuur klaar maar het geld is
    // nog niet in beweging (blijft liggen). Eén bedrag-op-het-startscherm — /prognose toont het passief
    // en /acties per samenwerking, maar nergens als glance-KPI. Aging-signaal (oudste ≥ drempel) zet de
    // toon op waarschuwing. Alleen tonen bij ≥1 concept (geen ruis).
    if (unbilledInvoices) {
      fKpis.push({
        icon: Receipt,
        label: t("Nog te factureren"),
        value: formatEuro(unbilledInvoices.grossCents),
        hint: `${unbilledInvoices.count} ${unbilledInvoices.count === 1 ? t("concept-factuur") : t("concept-facturen")} · ${t("dien in voor betaling")}`,
        ...(unbilledInvoices.aging
          ? {
              delta: `${unbilledInvoices.oldestAgeDays} ${t("dagen oud")}`,
              deltaTone: "warning" as const,
            }
          : {}),
      });
    }
    const rows = matches.map((m) => {
      const av = AVAILABILITY_LABEL[m.availability];
      return {
        id: m.jobId,
        initials: initials(m.title),
        accent: avatarAccent(m.jobId),
        name: m.title,
        role: m.companyName,
        match: m.score,
        status: av ? t(av.label) : undefined,
        statusClass: av?.cls,
        href: `/opdrachten/${m.jobId}`,
      };
    });
    // Week-strip: altijd de huidige week (#19); echte dienst-belasting waar bekend.
    const loadByDate = new Map<string, number>();
    if (weekStrip?.hasAny) {
      for (const d of weekStrip.days) {
        const dt = d.date;
        const key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
        loadByDate.set(key, d.entries.length);
      }
    }
    const weekCount = week
      ? `${week.entries.length} ${t(week.entries.length === 1 ? "dienst" : "diensten")}`
      : `0 ${t("diensten")}`;
    const wk = buildCurrentWeek(new Date(), weekCount, loadByDate, t);
    const openPunten = engageability
      ? engageability.blockers.length + engageability.attention.length
      : 0;
    // Het zegel gebruikt exact dezelfde afgeleide samenvatting als de tegel — geen tweede oordeel.
    // Eén bron van prominentie: bij een harde blokkade (bv. verzekering ontbreekt) draagt het
    // actie-item in "Volgende acties" de enige herstelknop ("Upload verzekering"). Het zegel toont
    // dan alleen de status en krijgt géén eigen "Rapport openen"-knop naar diezelfde plek, zodat de
    // waarschuwing niet drie keer met drie knoppen verschijnt. Zonder blokkade is de rapport-link
    // (naar het certificaten-overzicht) geen duplicaat en blijft hij staan.
    const seal = engageability
      ? {
          title: t("Inzetbaarheid"),
          subtitle: employability ? t(employability.label) : t(engageability.label),
          items: [
            {
              label: t("Status"),
              value: employability ? t(employability.labelWithBlocker) : t(engageability.label),
              ok: engageability.status === "ACTIEF",
            },
            {
              label: t("Open aandachtspunten"),
              value: String(openPunten),
              ok: openPunten === 0,
            },
          ],
          ...(employability?.blocker ? {} : { reportHref: "/certificaten" }),
        }
      : undefined;
    return (
      <WorkspaceDashboard
        header={{
          title: user.name ?? t("Werkruimte"),
          subtitle: identity?.subtitle ?? undefined,
        }}
        kpis={fKpis}
        list={{
          title: t("Opdrachten voor jou"),
          href: "/opdrachten",
          rows,
          empty: t("Nog geen passende opdrachten — maak je profiel compleet voor betere matches."),
        }}
        nextActions={tasksToActions(tasks)}
        week={wk}
        seal={seal}
        notice={notice}
      />
    );
  }

  // --- OPDRACHTGEVER: #19 drie-koloms workspace met echte data ---
  if (role === "CLIENT") {
    const [cs, clientRevenueTrend] = await Promise.all([
      getClientStats(user.id!),
      getClientRevenueTrend(user.id!),
    ]);
    const clientKpis: WsKpi[] = cs
      ? [
          {
            icon: Gauge,
            label: t("Vervullingsgraad"),
            value: `${cs.fillRate}%`,
            hint: fillRateHint(cs.filledJobs, cs.publishedJobs),
          },
          {
            icon: Handshake,
            label: t("Actieve samenwerkingen"),
            value: String(cs.activeCollaborations),
          },
          { icon: Briefcase, label: t("Geplaatste opdrachten"), value: String(cs.publishedJobs) },
          {
            // Geldpuls voor de opdrachtgever: uitgaven déze maand met de maand-op-maand-delta i.p.v.
            // een levenslang cumulatief totaal (dat als context in de hint blijft staan). Bewust een
            // neutrale delta-toon — meer uitgeven is niet "goed" of "slecht".
            icon: Wallet,
            label: t("Uitgaven"),
            value: formatEuro(clientRevenueTrend.currentCents),
            hint: `${t("deze maand")} · ${t("totaal")} ${formatEuro(cs.spentCents)}`,
            delta: formatDeltaPct(clientRevenueTrend.deltaPct),
          },
        ]
      : stats.map((st) => ({ icon: Briefcase, label: t(st.label), value: String(st.value) }));
    const rows = (suggestedFreelancers ?? []).map((fr) => ({
      id: fr.freelancerId,
      initials: initials(fr.name),
      accent: avatarAccent(fr.freelancerId),
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
          title: t("Compliance-zegel"),
          subtitle:
            complianceSnapshot.total === 0
              ? t("Geen lopende diensten")
              : `${complianceSnapshot.total - complianceSnapshot.nonCompliant - complianceSnapshot.warning}/${complianceSnapshot.total} ${t("diensten in orde")}`,
          items: [
            {
              label: t("Ontbrekend/verlopen"),
              value: String(complianceSnapshot.missing + complianceSnapshot.expired),
              ok: complianceSnapshot.missing + complianceSnapshot.expired === 0,
            },
            {
              label: t("Verloopt binnenkort"),
              value: String(complianceSnapshot.expiringSoon),
              ok: complianceSnapshot.expiringSoon === 0,
            },
            {
              label: t("In beoordeling"),
              value: String(complianceSnapshot.inReview),
              ok: complianceSnapshot.inReview === 0,
            },
          ],
          reportHref: "/samenwerkingen",
        }
      : undefined;
    const activeCount = cs?.activeCollaborations ?? 0;
    const wk = buildCurrentWeek(
      new Date(),
      `${activeCount} ${t(activeCount === 1 ? "dienst" : "diensten")}`,
      undefined,
      t,
    );
    return (
      <WorkspaceDashboard
        header={{
          title: user.name ?? t("Werkruimte"),
          subtitle: identity?.subtitle ?? undefined,
        }}
        kpis={clientKpis}
        list={{
          title: t("Voorgestelde ZZP'ers"),
          href: "/freelancers",
          rows,
          empty: t("Plaats een opdracht om geschikte ZZP'ers voorgesteld te krijgen."),
        }}
        nextActions={tasksToActions(tasks)}
        week={wk}
        seal={seal}
      />
    );
  }

  // --- BEMIDDELAAR: #19 drie-koloms workspace met echte data ---
  if (role === "FRANCHISER") {
    const fKpiIcons = [Briefcase, Users, Inbox, Gauge];
    const fKpis = stats.slice(0, 4).map((st, i) => ({
      icon: fKpiIcons[i] ?? Gauge,
      label: st.label,
      value: String(st.value),
    }));
    const openD = Number(stats.find((s) => s.label === "Open diensten")?.value ?? 0);
    const wk = buildCurrentWeek(new Date(), `${openD} ${openD === 1 ? "dienst" : "diensten"}`);
    // Volgende acties uit één bron: de item-engine (`tasks`) levert de geleide opzet, roster-
    // compliance, leads én de operationele attentiepunten (niet-inzetbare ZZP'ers, te lang open
    // diensten) — al gerangschikt op de prioriteitsbanden. `/acties`, de badge en deze rail tonen
    // exact hetzelfde.
    const fActions = tasksToActions(tasks);
    return (
      <WorkspaceDashboard
        header={{ title: user.name ?? "Werkruimte", subtitle: "Bemiddeling" }}
        kpis={fKpis}
        list={{
          title: "ZZP'ers in je bemiddeling",
          href: "/franchise/zzpers",
          rows: professionals ?? [],
          empty: "Breng ZZP'ers in je roster om ze hier te zien.",
        }}
        nextActions={fActions}
        week={wk}
        seal={franchiserSeal}
      />
    );
  }

  // --- ADMIN: #19 drie-koloms workspace met echte data ---
  const aKpiIcons = [ShieldCheck, Users, Briefcase];
  const aKpis = stats.map((st, i) => ({
    icon: aKpiIcons[i] ?? Gauge,
    label: st.label,
    value: String(st.value),
  }));
  const aRows = running.map((c) => ({
    id: c.id,
    initials: initials(c.jobTitle),
    accent: avatarAccent(c.id),
    name: c.jobTitle,
    role: c.counterpartyName,
    status: c.stage.badgeLabel,
    statusClass: STAGE_STATUS_CLASS[c.stage.tone],
    href: c.stage.cta.href,
  }));
  const aWk = buildCurrentWeek(
    new Date(),
    `${running.length} ${running.length === 1 ? "dienst" : "diensten"}`,
  );
  const pendingVerifications = Number(stats[0]?.value ?? 0);
  const aSeal = {
    title: "Platformstatus",
    subtitle:
      pendingVerifications === 0
        ? "Geen openstaande verificaties"
        : `${pendingVerifications} ter verificatie`,
    items: [
      {
        label: "Open verificaties",
        value: String(stats[0]?.value ?? 0),
        ok: pendingVerifications === 0,
      },
      { label: "Gebruikers", value: String(stats[1]?.value ?? 0), ok: true },
      { label: "Opdrachten", value: String(stats[2]?.value ?? 0), ok: true },
    ],
    reportHref: "/admin/verificaties",
  };
  return (
    <WorkspaceDashboard
      header={{ title: user.name ?? "Beheer", subtitle: "Platformbeheer" }}
      kpis={aKpis}
      list={{
        title: "Wat loopt er nu",
        href: "/admin/samenwerkingen",
        rows: aRows,
        empty: "Geen lopende samenwerkingen op het platform.",
      }}
      nextActions={tasksToActions(tasks)}
      week={aWk}
      seal={aSeal}
    />
  );
}
