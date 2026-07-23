// Nav-signalen: per rol berekent de server welke navigatie-items nú actie vragen.
// "Meedenken" zit hier: de gebruiker ziet vanaf elke pagina wat openstaat, zonder
// dat-ie het dashboard hoeft te openen. Server-side is de waarheid (deterministisch,
// zelfde drempels als het dashboard). De UI toont alleen wat hier wordt geteld.

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { type UserRole } from "@/lib/enums";
import { MANDATORY_CREDENTIAL_TYPES, mandatoryDocumentAlertCount } from "@/lib/mandatory-documents";
import { type FreelancerCredential } from "@/lib/matching";
import { NO_SHOW_LIMIT } from "@/lib/no-show";
import { paymentDueSoonWhere } from "@/lib/payment-due-soon";
import { SUPPORT_OPEN_STATUSES } from "@/lib/support/labels";

export type BadgeTone = "attention" | "info";

export interface NavBadge {
  count: number;
  /** attention = vraagt actie (opvallend), info = neutrale telling (rustig). */
  tone: BadgeTone;
}

/** Badges per nav-href. Alleen items met openstaande actie staan erin. */
export type NavBadges = Record<string, NavBadge>;

/** Ruwe tellingen die de server ophaalt; key bepaalt href + toon. */
interface SignalCounts {
  credentialAlerts?: number; // FREELANCER: afgewezen + verloopt binnenkort
  newApplications?: number; // CLIENT: nieuwe reacties
  draftJobs?: number; // CLIENT: concept-opdrachten
  pendingVerifications?: number; // ADMIN: wacht op verificatie
  unreadMessages?: number; // FREELANCER + CLIENT: gesprekken met ongelezen berichten
  overdueInvoices?: number; // FREELANCER + CLIENT: facturen over de vervaldatum
  cascadeWork?: number; // FREELANCER + CLIENT: cascade-acties "aan zet" in werkproces
  openDisputes?: number; // ADMIN: open disputen die bemiddeling vragen
  pendingPerformances?: number; // CLIENT: ingediende prestaties wachten op goedkeuring
  savedJobs?: number; // FREELANCER: bewaarde opdrachten die nog open staan (PUBLISHED)
  overdueLeads?: number; // FRANCHISER: actieve leads met een verstreken opvolgdatum
  openHandoffs?: number; // FRANCHISER: open shift-overname-aanvragen binnen de tenant
  openSupportTickets?: number; // ADMIN: helpdesk-tickets die de helpdesk moet oppakken
  openNoShows?: number; // ADMIN: no-show-meldingen die op een oordeel wachten
  openAdminHandoffs?: number; // ADMIN: open shift-overname-aanvragen platform-breed
}

const SIGNAL_HREF: Record<keyof SignalCounts, string> = {
  credentialAlerts: "/certificaten",
  newApplications: "/kandidaten",
  draftJobs: "/opdrachten",
  pendingVerifications: "/admin/verificaties",
  unreadMessages: "/berichten",
  // Facturen zijn samengevoegd in de Administratie-hub (/financien); de overdue-badge hangt
  // daarom aan het hub-item in de zijbalk.
  overdueInvoices: "/financien",
  cascadeWork: "/samenwerkingen",
  openDisputes: "/admin/disputen",
  pendingPerformances: "/prestaties",
  savedJobs: "/opgeslagen",
  overdueLeads: "/franchise/leads",
  openHandoffs: "/franchise/shift-overnames",
  openSupportTickets: "/admin/support",
  openNoShows: "/admin/no-shows",
  openAdminHandoffs: "/admin/shift-overnames",
};

const SIGNAL_TONE: Record<keyof SignalCounts, BadgeTone> = {
  credentialAlerts: "attention",
  newApplications: "attention",
  draftJobs: "info",
  pendingVerifications: "attention",
  unreadMessages: "info",
  overdueInvoices: "attention",
  cascadeWork: "attention",
  openDisputes: "attention",
  pendingPerformances: "attention",
  // Bewaarde opdrachten zijn een rustige telling (de ZZP'er koos ze zelf), geen actie-alarm.
  savedJobs: "info",
  // Verstreken opvolg en open overname-aanvragen vragen actie van de franchiser.
  overdueLeads: "attention",
  openHandoffs: "attention",
  // Admin-wachtrijen die actie vragen (helpdesk, no-shows, dienst-overnames).
  openSupportTickets: "attention",
  openNoShows: "attention",
  openAdminHandoffs: "attention",
};

/**
 * Begin van de UTC-dag — de grens voor "verstreken opvolgdatum". Een opvolgdatum vóór deze grens
 * (dus op een eerdere kalenderdag) is te laat; vandaag telt niet als te laat. Gelijk aan de
 * dag-vergelijking op de leads-pagina (`/franchise/leads`). Pure functie, los testbaar.
 */
export function startOfUtcDay(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

const EXPIRY_WINDOW_MS = 30 * 86_400_000; // 30 dagen, gelijk aan het dashboard

/** Harde bovengrens per lijst — gelijk aan de `MAX` in pending-tasks.ts (voorkomt zware queries). */
const CASCADE_SCAN_LIMIT = 50;

/**
 * Eén cascade-samenwerking van de ZZP'er, uitgedund tot wat de fase bepaalt: de status van de
 * samenwerking, de status van de meest recente prestatie (of `null` = nog geen prestatie) en de
 * lifecycle-status van de nog-openstaande facturen (DRAFT/REJECTED/APPROVED/OVERDUE). Pure invoer.
 */
export interface FreelancerCascadeCollab {
  status: "PROPOSED" | "ACTIVE";
  latestPerformanceStatus: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | null;
  openInvoiceStatuses: readonly ("DRAFT" | "REJECTED" | "APPROVED" | "OVERDUE")[];
}

/**
 * Aantal cascade-taken waar de ZZP'er "aan zet" is — exact de samenwerkingtaken die het actiecentrum
 * (`/acties`, pending-tasks.ts) toont, zodat de `/samenwerkingen`-nav-badge de "aan zet"-lijst niet
 * ondertelt. Spiegelt de fase-logica van `freelancerTasks`:
 *   - PROPOSED                → 1 (contract ondertekenen);
 *   - ACTIVE, geen/DRAFT-prestatie → 1 (uren/oplevering indienen);
 *   - ACTIVE, REJECTED-prestatie   → 1 (corrigeren en opnieuw indienen);
 *   - ACTIVE, SUBMITTED/APPROVED-prestatie → 0 vanuit de prestatiekant (opdrachtgever is aan zet);
 *   - per openstaande factuur (DRAFT/REJECTED indienen, APPROVED/OVERDUE betaling markeren) → +1.
 * OVERDUE draagt dezelfde ZZP-actie als APPROVED (betaling markeren) en telt daarom mee — anders
 * ondertelt de badge exact de over-de-vervaldatum-cascadefacturen die /acties (pending-tasks.ts) én
 * de cascade-fase (stage.ts, "aan zet"/attention) wél tonen. Pure functie, los testbaar.
 */
export function countFreelancerCascadeWork(collabs: readonly FreelancerCascadeCollab[]): number {
  let count = 0;
  for (const c of collabs) {
    if (c.status === "PROPOSED") {
      count += 1; // contract ondertekenen
      continue;
    }
    // ACTIVE ⟹ contract getekend; de meest recente prestatie bepaalt de fase.
    const perf = c.latestPerformanceStatus;
    if (perf === null || perf === "DRAFT" || perf === "REJECTED") count += 1;
    count += c.openInvoiceStatuses.length;
  }
  return count;
}

/**
 * CLIENT-tegenhanger van {@link countFreelancerCascadeWork}: de opdrachtgever is "aan zet" op
 * (a) elke PROPOSED samenwerking waar het contract nog ondertekend moet worden, (b) elke SUBMITTED
 * prestatie die goedgekeurd moet worden, en (c) elke SUBMITTED factuur die goedgekeurd moet worden.
 * Symmetrisch met de FREELANCER-tak: de contract-onderteken-taak (PROPOSED) telde eerder NIET mee in
 * de /samenwerkingen-badge, terwijl /acties (pending-tasks.ts `contractSignTask`) én de cascade-fase
 * (stage.ts `youAreUp` op een niet-getekend contract) 'm wél tonen — dat liet de badge de andere
 * twee surfaces tegenspreken. Pure functie, los testbaar.
 */
export function countClientCascadeWork(input: {
  proposedCollaborations: number;
  submittedPerformances: number;
  submittedInvoices: number;
}): number {
  return input.proposedCollaborations + input.submittedPerformances + input.submittedInvoices;
}

/** Pure mapping van ruwe tellingen → badges (filtert 0 weg). Testbaar zonder DB. */
export function buildBadges(counts: SignalCounts): NavBadges {
  const out: NavBadges = {};
  for (const key of Object.keys(counts) as (keyof SignalCounts)[]) {
    const count = counts[key] ?? 0;
    if (count > 0) out[SIGNAL_HREF[key]] = { count, tone: SIGNAL_TONE[key] };
  }
  return out;
}

/**
 * /acties-badge: het exacte aantal openstaande taken (precies wat de /acties-pagina toont).
 * De caller levert die telling aan (pendingTaskCount, request-gecachet) zodat de sidebar-badge
 * en de pagina nooit tegenspreken.
 */
export function withActionCenterBadge(badges: NavBadges, actionCount: number): NavBadges {
  if (actionCount > 0) badges["/acties"] = { count: actionCount, tone: "attention" };
  return badges;
}

interface ParticipantRead {
  conversationId: string;
  lastReadAt: Date | null;
}

/**
 * Aantal gesprekken met een ongelezen bericht van de andere partij. Pure functie:
 * `latestForeign` geeft per gesprek de tijd van het laatste bericht van iemand anders.
 */
export function countUnreadConversations(
  participants: readonly ParticipantRead[],
  latestForeign: ReadonlyMap<string, Date | null>,
): number {
  let unread = 0;
  for (const p of participants) {
    const at = latestForeign.get(p.conversationId);
    if (!at) continue;
    if (!p.lastReadAt || at.getTime() > p.lastReadAt.getTime()) unread++;
  }
  return unread;
}

/**
 * Facturen die actie vragen: expliciet OVERDUE óf verzonden en over de vervaldatum.
 * Vanuit de ZZP'er (herinneren) of de opdrachtgever (betalen). Eén indexed count.
 *
 * Disputen zijn uitgesloten (`disputedAt: null`): een dispuut bevriest het werkproces
 * (`cascade/stage.ts` → "Dispuut — werkproces bevroren", en `confirmPayment` weigert een betaling
 * op een disputed samenwerking via `assertNotDisputed`). Een generieke "volg op / markeer als
 * betaald"-roll-up voor zo'n bevroren factuur zou het samenwerkingsscherm tegenspreken en een taak
 * tonen waarvan de knop server-side sowieso faalt — dus telt hij niet mee.
 *
 * **Bron-van-waarheid per facturensoort (voorkomt een dubbele next-action):** cascade-facturen
 * dragen een `lifecycleStatus`; die is voor hen de waarheid. Een cascade-factuur is pas "over de
 * vervaldatum" als de payment-reminders-taak `lifecycleStatus→OVERDUE` heeft gezet (die koppelt in
 * één update `status` én `lifecycleStatus`, zie `payment-reminders-task.ts`). Een APPROVED
 * cascade-factuur telt hier daarom NIET mee via het legacy `status`-veld — anders zou dezelfde
 * factuur zowel als specifieke betaal-taak (`pending-tasks.ts` APPROVED-tak) áls in deze generieke
 * roll-up verschijnen, terwijl `surfacedOverdue` (dat op `lifecycleStatus === "OVERDUE"` telt) hem
 * niet aftrekt → een dubbele next-action. Legacy-/handmatige facturen (`facturen/actions.ts`, geen
 * cascade → `lifecycleStatus = null`) vallen terug op het legacy `status`-veld; die worden nooit als
 * specifieke betaal-taak getoond, dus alleen deze roll-up telt ze — precies één keer.
 */
export async function overdueInvoiceCount(role: UserRole, userId: string): Promise<number> {
  if (role === "ADMIN" || role === "FRANCHISER") return 0;
  const party = role === "FREELANCER" ? { freelancer: { userId } } : { company: { userId } };
  const or: Prisma.InvoiceWhereInput[] = [
    // Legacy-/handmatige facturen (geen lifecycle): val terug op het legacy status-veld. Hier ís de
    // opdrachtgever aan zet ("Markeer als betaald" bestaat alléén voor een !cascade-factuur — zie
    // `facturen/[id]/page.tsx` canPay), dus deze takken gelden voor beide partijen.
    { lifecycleStatus: null, status: "OVERDUE" },
    { lifecycleStatus: null, status: "SENT", dueAt: { lt: new Date() } },
  ];
  // Cascade-facturen (lifecycleStatus=OVERDUE) horen ALLEEN in de roll-up van de ZZP'er: in de
  // cascade registreert de ZZP'er de betaling (`stage.ts` stap 6, `youAreUp:isFreelancer`), terwijl de
  // opdrachtgever op "Wacht op betalingsbevestiging" staat (`youAreUp:false`) en nergens een
  // "Markeer als betaald"-knop heeft (`canPay = !cascade`). Zou de opdrachtgever ze wél tellen, dan
  // toont de generieke roll-up hem een dode, niet-verdwijnende "Markeer als betaald"-actie die de
  // cascade-fase tegenspreekt. De ZZP-kant ontdubbelt met `surfacedOverdue` (zie pending-tasks.ts).
  if (role === "FREELANCER") or.unshift({ lifecycleStatus: "OVERDUE" });
  return prisma.invoice.count({
    where: { collaboration: { ...party, disputedAt: null }, OR: or },
  });
}

/**
 * Facturen die de opdrachtgever BINNENKORT (nog niet te laat) moet betalen — voedt de pre-due
 * betaal-nudge. Tegenhanger van `overdueInvoiceCount` (post-due); de vensters raken elkaar niet
 * (`dueAt >= now` vs. `< now`), dus één factuur voedt nooit beide. Scoping in `paymentDueSoonWhere`
 * (één bron van waarheid): alleen legacy/handmatige facturen waar de payer echt aan zet is, niet in
 * dispuut. Eén indexed count.
 */
export async function paymentDueSoonCount(userId: string, now: Date = new Date()): Promise<number> {
  return prisma.invoice.count({ where: paymentDueSoonWhere(userId, now) });
}

/** Twee begrensde queries (geen N+1): deelnemerschap + laatste vreemde bericht per gesprek. */
export async function unreadConversationCount(userId: string): Promise<number> {
  const participants = await prisma.conversationParticipant.findMany({
    where: { userId },
    select: { conversationId: true, lastReadAt: true },
  });
  if (participants.length === 0) return 0;

  const grouped = await prisma.message.groupBy({
    by: ["conversationId"],
    where: {
      conversationId: { in: participants.map((p) => p.conversationId) },
      senderId: { not: userId },
    },
    _max: { createdAt: true },
  });
  const latestForeign = new Map<string, Date | null>(
    grouped.map((g) => [g.conversationId, g._max.createdAt]),
  );
  return countUnreadConversations(participants, latestForeign);
}

export async function navBadges(role: UserRole, userId: string): Promise<NavBadges> {
  if (role === "FREELANCER") {
    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) return {};
    const now = new Date();
    const soon = new Date(now.getTime() + EXPIRY_WINDOW_MS);
    const [
      rejected,
      expiring,
      mandatoryCreds,
      unreadMessages,
      overdueInvoices,
      cascadeCollabs,
      savedJobs,
    ] = await Promise.all([
      prisma.credential.count({ where: { freelancerProfileId: profile.id, status: "REJECTED" } }),
      prisma.credential.count({
        where: {
          freelancerProfileId: profile.id,
          status: "VERIFIED",
          expiresAt: { gt: now, lte: soon },
        },
      }),
      // Verplichte-document-rijen (VOG/verzekering) om ontbrekend/verlopen te classificeren. Zonder
      // deze telling was de /certificaten-badge stil terwijl /acties + de dashboard-rail wél een
      // "Verplicht document ontbreekt"-taak toonden (bv. een verse ZZP'er zonder certificaten) —
      // het "signaal op één oppervlak"-anti-patroon. Zelfde bron als pending-tasks.ts.
      prisma.credential.findMany({
        where: {
          freelancerProfileId: profile.id,
          type: { in: [...MANDATORY_CREDENTIAL_TYPES] },
        },
        select: { type: true, status: true, expiresAt: true },
      }),
      unreadConversationCount(userId),
      overdueInvoiceCount("FREELANCER", userId),
      // Cascade-werkproces: dezelfde scope als het actiecentrum (pending-tasks.ts) — lopende/
      // voorgestelde, niet-bevroren samenwerkingen. De meest recente prestatie + openstaande
      // facturen bepalen wie aan zet is; countFreelancerCascadeWork telt de ZZP'er-taken.
      prisma.collaboration.findMany({
        where: {
          freelancer: { userId },
          status: { in: ["PROPOSED", "ACTIVE"] },
          disputedAt: null,
        },
        select: {
          status: true,
          performances: {
            select: { status: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          invoices: {
            where: { lifecycleStatus: { in: ["DRAFT", "REJECTED", "APPROVED", "OVERDUE"] } },
            select: { lifecycleStatus: true },
            take: 5,
          },
        },
        take: CASCADE_SCAN_LIMIT,
      }),
      // bewaarde opdrachten die nog open staan (PUBLISHED) — gelijk aan de "open"-partitie op /opgeslagen
      prisma.savedJob.count({
        where: { freelancerProfileId: profile.id, job: { status: "PUBLISHED" } },
      }),
    ]);
    const cascadeWork = countFreelancerCascadeWork(
      cascadeCollabs.map((c) => ({
        status: c.status as FreelancerCascadeCollab["status"],
        latestPerformanceStatus:
          (c.performances[0]?.status as FreelancerCascadeCollab["latestPerformanceStatus"]) ?? null,
        openInvoiceStatuses: c.invoices.map(
          (i) => i.lifecycleStatus as "DRAFT" | "REJECTED" | "APPROVED" | "OVERDUE",
        ),
      })),
    );
    // Ontbrekende/verlopen verplichte documenten tellen óók mee in de /certificaten-badge, zodat de
    // badge niet stiller is dan /acties + de dashboard-rail (die de mandatoryDocumentTask tonen). De
    // pure helper dedupt tegen REJECTED-types (die al in `rejected` zitten) → geen dubbeltelling.
    const mandatoryAlerts = mandatoryDocumentAlertCount(
      mandatoryCreds.map(
        (c): FreelancerCredential => ({
          type: c.type as FreelancerCredential["type"],
          status: c.status as FreelancerCredential["status"],
          expiresAt: c.expiresAt,
        }),
      ),
      now,
    );
    return buildBadges({
      credentialAlerts: rejected + expiring + mandatoryAlerts,
      unreadMessages,
      overdueInvoices,
      cascadeWork,
      savedJobs,
    });
  }

  if (role === "CLIENT") {
    const company = await prisma.company.findUnique({ where: { userId }, select: { id: true } });
    if (!company) return {};
    const [
      newApplications,
      draftJobs,
      unreadMessages,
      overdueInvoices,
      cascadeProposed,
      cascadePerf,
      cascadeInv,
    ] = await Promise.all([
      prisma.application.count({ where: { job: { companyId: company.id }, status: "NEW" } }),
      prisma.job.count({ where: { companyId: company.id, status: "DRAFT" } }),
      unreadConversationCount(userId),
      overdueInvoiceCount("CLIENT", userId),
      // cascade: contract ondertekenen — elke PROPOSED (niet-bevroren) samenwerking van deze
      // opdrachtgever. Symmetrisch met de FREELANCER-tak (PROPOSED → +1) en met /acties
      // (pending-tasks.ts `contractSignTask`); zonder deze telling sprak de /samenwerkingen-badge
      // /acties + de cascade-fase tegen op een deal die nog op ondertekening wacht.
      prisma.collaboration.count({
        where: { company: { userId }, status: "PROPOSED", disputedAt: null },
      }),
      // cascade: prestaties goedkeuren (telt ook mee in pendingPerformances voor /prestaties-badge).
      // Bevroren (dispuut) samenwerkingen uitsluiten — symmetrisch met de FREELANCER-tak
      // (disputedAt: null hierboven) en met /acties (pending-tasks.ts): approvePerformance weigert
      // een bevroren deal (assertNotDisputed), dus die telt niet als werk "aan zet".
      prisma.performance.count({
        where: {
          status: "SUBMITTED",
          collaboration: { company: { userId }, disputedAt: null },
        },
      }),
      // cascade: facturen goedkeuren — idem bevroren deals uitsluiten (approveInvoice weigert ze).
      prisma.invoice.count({
        where: {
          counterpartyUserId: userId,
          lifecycleStatus: "SUBMITTED",
          collaboration: { disputedAt: null },
        },
      }),
    ]);
    const cascadeWork = countClientCascadeWork({
      proposedCollaborations: cascadeProposed,
      submittedPerformances: cascadePerf,
      submittedInvoices: cascadeInv,
    });
    return buildBadges({
      newApplications,
      draftJobs,
      unreadMessages,
      overdueInvoices,
      cascadeWork,
      pendingPerformances: cascadePerf,
    });
  }

  if (role === "FRANCHISER") {
    // Tenant-gescopete actiesignalen. Zonder franchise (tenantId) zijn er geen tenant-lijsten,
    // dus geen badges. Ongelezen berichten lopen al via de notificatiebel (geen /berichten-nav).
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    });
    if (!user?.tenantId) return {};
    const tenantId = user.tenantId;
    const [overdueLeads, openHandoffs] = await Promise.all([
      // Actieve leads (KOUD/WARM — KLANT/NO_DEAL zijn afgerond) met een opvolgdatum vóór vandaag.
      prisma.lead.count({
        where: {
          tenantId,
          status: { in: ["KOUD", "WARM"] },
          nextFollowUp: { lt: startOfUtcDay(new Date()) },
        },
      }),
      // Open shift-overname-aanvragen binnen de eigen tenant (via de opdracht van de samenwerking).
      prisma.shiftHandoff.count({
        where: { status: "OPEN", collaboration: { job: { tenantId } } },
      }),
    ]);
    return buildBadges({ overdueLeads, openHandoffs });
  }

  const [
    pendingVerifications,
    openDisputes,
    openSupportTickets,
    pendingNoShowVerdicts,
    noShowAtLimit,
    openAdminHandoffs,
  ] = await Promise.all([
    prisma.credential.count({ where: { status: "SUBMITTED" } }),
    prisma.collaboration.count({ where: { disputedAt: { not: null } } }),
    // Helpdesk-tickets die de medewerker aan zet houden (zelfde bron als /acties).
    prisma.supportTicket.count({ where: { status: { in: [...SUPPORT_OPEN_STATUSES] } } }),
    // No-show-meldingen die op een oordeel wachten (te beoordelen).
    prisma.noShowReport.count({ where: { verdict: "PENDING" } }),
    // ZZP'ers op/over de grens van ongegronde no-shows → een uitschrijf-besluit wacht. Exact dezelfde
    // groupBy als /acties (pending-tasks.ts adminSuspendNoShowTask); zonder deze telling toonde de
    // /admin/no-shows-badge 0 terwijl /acties + de pagina "Grens bereikt — beoordeel uitschrijving"
    // wél een actie toonden (het "signaal op één oppervlak"-anti-patroon).
    prisma.noShowReport.groupBy({
      by: ["freelancerProfileId"],
      where: { verdict: "UNJUSTIFIED" },
      _count: { _all: true },
      having: { freelancerProfileId: { _count: { gte: NO_SHOW_LIMIT } } },
    }),
    // Open dienst-overname-aanvragen, platform-breed (admin ziet ze allemaal).
    prisma.shiftHandoff.count({ where: { status: "OPEN" } }),
  ]);
  // Alleen nog-ACTIEVE accounts leveren een uitschrijf-besluit op (een al geschorste ZZP'er niet) —
  // symmetrisch met de ACTIVE-filter in pending-tasks.ts, zodat badge en /acties gelijk tellen.
  const atLimitToSuspend =
    noShowAtLimit.length > 0
      ? await prisma.freelancerProfile.count({
          where: {
            id: { in: noShowAtLimit.map((r) => r.freelancerProfileId) },
            user: { status: "ACTIVE" },
          },
        })
      : 0;
  return buildBadges({
    pendingVerifications,
    openDisputes,
    openSupportTickets,
    // De /admin/no-shows-nav dekt beide wachtrijen op die pagina: te-beoordelen meldingen én
    // te-nemen uitschrijf-besluiten — samen gelijk aan het aantal no-show-taken op /acties.
    openNoShows: pendingNoShowVerdicts + atLimitToSuspend,
    openAdminHandoffs,
  });
}
