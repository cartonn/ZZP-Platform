// Nav-signalen: per rol berekent de server welke navigatie-items nú actie vragen.
// "Meedenken" zit hier: de gebruiker ziet vanaf elke pagina wat openstaat, zonder
// dat-ie het dashboard hoeft te openen. Server-side is de waarheid (deterministisch,
// zelfde drempels als het dashboard). De UI toont alleen wat hier wordt geteld.

import { Prisma } from "@prisma/client";

import { pendingCollaborationProposals } from "@/lib/accepted-proposal";
import { WAIT_ATTENTION_DAYS } from "@/lib/application-wait";
import { clientCredentialAlerts, clientHasComplianceAction } from "@/lib/collaboration-alerts";
import { prisma } from "@/lib/db";
import { type Availability, type UserRole } from "@/lib/enums";
import { computeEngageability } from "@/lib/engageability";
import { summarizeAcuteOpenDiensten, isStartAcute } from "@/lib/franchise/acute-open-diensten";
import { MANDATORY_CREDENTIAL_TYPES, mandatoryDocumentAlertCount } from "@/lib/mandatory-documents";
import { type FreelancerCredential } from "@/lib/matching";
import { NO_SHOW_LIMIT } from "@/lib/no-show";
import { paymentDueSoonWhere } from "@/lib/payment-due-soon";
import { summarizeStaleClientApplications } from "@/lib/stale-applications";
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
  newApplications?: number; // CLIENT: /kandidaten-acties (nieuwe reacties + stale + geaccepteerd-zonder-voorstel)
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
  rosterAlerts?: number; // FRANCHISER: niet-inzetbare roster-ZZP'ers + (bijna-)verlopende certificaten
  openDienstAlerts?: number; // FRANCHISER: acute + te-lang-open (stale) tenant-diensten
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
  rosterAlerts: "/franchise/zzpers",
  openDienstAlerts: "/franchise/diensten",
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
  // Niet-inzetbaar roster (plaatsing-blokkerend) en acute/te-lang-open diensten vragen actie.
  rosterAlerts: "attention",
  openDienstAlerts: "attention",
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

/** Drempel (dagen) waarna een ongedekte, gepubliceerde dienst als "te lang open" (stale) telt — gelijk aan `STALE_DIENST_DAYS` in pending-tasks.ts. */
const STALE_DIENST_DAYS = 7;

/** Max aparte stale-dienst-rijen op /acties; het residu (#4+) wordt gebundeld in één rollup-taak — gelijk aan `STALE_DIENST_SHOWN` in pending-tasks.ts. */
const STALE_DIENST_SHOWN = 3;

/** Harde bovengrens per lijst — gelijk aan de `MAX` in pending-tasks.ts (voorkomt zware queries). */
const CASCADE_SCAN_LIMIT = 50;

/**
 * /franchise/diensten-badge = exact het aantal losse diensten-taken dat het actiecentrum (`/acties`,
 * pending-tasks.ts `franchiserTasks`) toont: het acute-onbezet-aggregaat (max 1, `franchiseAcuteDienstTask`)
 * + de getoonde stale-rijen (max `STALE_DIENST_SHOWN`, `franchiseStaleDienstTask`) + één rollup-taak
 * zodra er stale-residu (#4+) is (`franchiseStaleDienstRollupTask`). `staleTaskCount` is het aantal
 * stale-diensten ná het verwijderen van de acute overlap (die diensten zitten al in het acute-aggregaat),
 * zodat de badge niet dubbeltelt. Pure functie, los testbaar.
 */
export function countFranchiseDienstAlerts(input: {
  hasAcute: boolean;
  staleTaskCount: number;
}): number {
  const shown = Math.min(input.staleTaskCount, STALE_DIENST_SHOWN);
  const residue = input.staleTaskCount - STALE_DIENST_SHOWN > 0 ? 1 : 0;
  return (input.hasAcute ? 1 : 0) + shown + residue;
}

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
 * prestatie die goedgekeurd moet worden, (c) elke SUBMITTED factuur die goedgekeurd moet worden, en
 * (d) elke lopende samenwerking met een compliance-ripple-actie (vereist certificaat ontbrekend/
 * verlopen/binnenkort-verlopend van de ZZP'er — de hoogst-wegende opdrachtgever-taak).
 * Symmetrisch met de FREELANCER-tak: de contract-onderteken-taak (PROPOSED) telde eerder NIET mee in
 * de /samenwerkingen-badge, terwijl /acties (pending-tasks.ts `contractSignTask`) én de cascade-fase
 * (stage.ts `youAreUp` op een niet-getekend contract) 'm wél tonen — dat liet de badge de andere
 * twee surfaces tegenspreken. Idem `complianceActions`: de compliance-taak (`clientComplianceTask`,
 * href `/samenwerkingen/{id}`) verscheen wél op /acties + de dashboard-rail maar ontbrak in de badge.
 *
 * Geen dedup op samenwerking: dit telt losse acties (net als de FREELANCER-tak meerdere facturen per
 * samenwerking telt), exact gelijk aan /acties dat per samenwerking zowel een prestatie-/factuur-taak
 * ÁLS een aparte compliance-taak toont. Deduppen zou de badge juist ónder /acties laten tellen — het
 * anti-patroon dat deze telling repareert. Wel telt `complianceActions` één actie per samenwerking
 * (niet per ontbrekend certificaat-type), gelijk aan de één-taak-per-samenwerking-emissie in de
 * item-engine. Pure functie, los testbaar.
 */
export function countClientCascadeWork(input: {
  proposedCollaborations: number;
  submittedPerformances: number;
  submittedInvoices: number;
  complianceActions: number;
}): number {
  return (
    input.proposedCollaborations +
    input.submittedPerformances +
    input.submittedInvoices +
    input.complianceActions
  );
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
// Legacy-/handmatige overdue-facturen (geen cascade-lifecycle): val terug op het legacy status-veld.
// Hier ís de opdrachtgever aan zet ("Markeer als betaald" bestaat alléén voor een !cascade-factuur —
// zie `facturen/[id]/page.tsx` canPay), dus deze takken gelden voor beide partijen. De ZZP'er kan hier
// niets doen behalve opvolgen bij de opdrachtgever.
function legacyOverdueOr(now: Date): Prisma.InvoiceWhereInput[] {
  return [
    { lifecycleStatus: null, status: "OVERDUE" },
    { lifecycleStatus: null, status: "SENT", dueAt: { lt: now } },
  ];
}

// Cascade-facturen (lifecycleStatus=OVERDUE) horen ALLEEN in de roll-up van de ZZP'er: in de cascade
// registreert de ZZP'er de betaling (`stage.ts` stap 6, `youAreUp:isFreelancer`), terwijl de
// opdrachtgever op "Wacht op betalingsbevestiging" staat (`youAreUp:false`) en nergens een "Markeer als
// betaald"-knop heeft (`canPay = !cascade`). Zou de opdrachtgever ze wél tellen, dan toont de generieke
// roll-up hem een dode, niet-verdwijnende "Markeer als betaald"-actie die de cascade-fase tegenspreekt.
// De ZZP-kant ontdubbelt met `surfacedOverdue` (zie pending-tasks.ts).
const CASCADE_OVERDUE_OR: Prisma.InvoiceWhereInput = { lifecycleStatus: "OVERDUE" };

export async function overdueInvoiceCount(role: UserRole, userId: string): Promise<number> {
  if (role === "ADMIN" || role === "FRANCHISER") return 0;
  const party = role === "FREELANCER" ? { freelancer: { userId } } : { company: { userId } };
  const or = legacyOverdueOr(new Date());
  if (role === "FREELANCER") or.unshift(CASCADE_OVERDUE_OR);
  return prisma.invoice.count({
    where: { collaboration: { ...party, disputedAt: null }, OR: or },
  });
}

/**
 * Splitst de overdue-facturen van de ZZP'er in twee categorieën met een verschillende actie, zodat de
 * generieke roll-up in het actiecentrum de juiste instructie kan tonen:
 * - `legacy` — handmatige/legacy-facturen waar de **opdrachtgever** aan zet is → "Volg op bij de
 *   opdrachtgever";
 * - `cascade` — cascade-facturen (lifecycleStatus=OVERDUE) waar de **ZZP'er zélf** de betaling
 *   registreert → "Markeer de betaling zodra je bent betaald".
 * Zonder deze splitsing kreeg een cascade-overdue-factuur ten onrechte de "volg op"-subtitel (de
 * opdrachtgever betaalt daar rechtstreeks en heeft geen betaalknop). Spiegelt exact de scope van
 * `overdueInvoiceCount("FREELANCER", …)` (som van beide) zodat de teller en de splitsing nooit driften.
 */
export async function overdueInvoiceBreakdown(
  userId: string,
): Promise<{ legacy: number; cascade: number }> {
  const collaboration = { freelancer: { userId }, disputedAt: null };
  const [legacy, cascade] = await Promise.all([
    prisma.invoice.count({ where: { collaboration, OR: legacyOverdueOr(new Date()) } }),
    prisma.invoice.count({ where: { collaboration, ...CASCADE_OVERDUE_OR } }),
  ]);
  return { legacy, cascade };
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
    // De /kandidaten-nav telt niet alleen NEW: `proposeCollaborationTask` (geaccepteerd, nog geen
    // voorstel) en `staleApplicationsTask` (VIEWED/SHORTLIST te lang onbeslist) verschijnen óók op
    // /acties + de dashboard-rail met href /kandidaten. Zonder ze mee te tellen was de nav-badge
    // stiller dan de item-engine — het "signaal op één oppervlak"-anti-patroon (zie run 46/47).
    // DB-side voorgefilterd op de kortste stale-drempel (VIEWED = 14 dagen); de pure
    // `summarizeStaleClientApplications` past daarna de exacte per-fase-regel toe (VIEWED ≥ 14 /
    // SHORTLIST ≥ 21). NEW valt hier bewust buiten — dat dekt de `newApplications`-telling al.
    const staleWindow = new Date(Date.now() - WAIT_ATTENTION_DAYS.VIEWED * 86_400_000);
    const [
      newApplications,
      draftJobs,
      unreadMessages,
      overdueInvoices,
      cascadeProposed,
      cascadePerf,
      cascadeInv,
      complianceAlerts,
      staleCandidates,
      acceptedCandidates,
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
      // cascade: compliance-ripple — lopende (ACTIVE, niet-bevroren) samenwerkingen waarvan de ZZP'er
      // een vereist certificaat mist/verlopen/binnenkort-verlopend heeft. Zelfde eigenaar-gescoopte
      // loader als /acties (pending-tasks.ts `clientCredentialAlerts`); zonder deze telling was de
      // /samenwerkingen-badge stiller dan /acties + de dashboard-rail (die de hoogst-geprioriteerde
      // `clientComplianceTask` tonen) — het "signaal op één oppervlak"-anti-patroon.
      clientCredentialAlerts(userId),
      // stale kandidaten (VIEWED/SHORTLIST te lang onbeslist) — exact het predicaat uit
      // pending-tasks.ts (`staleApplicationsTask`). Eigenaar-gescoopt + take-begrensd.
      prisma.application.findMany({
        where: {
          job: { companyId: company.id },
          status: { in: ["VIEWED", "SHORTLIST"] },
          createdAt: { lte: staleWindow },
        },
        select: { status: true, createdAt: true, collaboration: { select: { id: true } } },
        take: CASCADE_SCAN_LIMIT,
      }),
      // geaccepteerde reacties die nog een samenwerkingsvoorstel missen — exact het predicaat uit
      // pending-tasks.ts (`proposeCollaborationTask`). Reeds-voorgestelde (met collaboration) vallen af.
      prisma.application.findMany({
        where: { job: { companyId: company.id }, status: "ACCEPTED" },
        select: { id: true, collaboration: { select: { id: true } } },
        take: CASCADE_SCAN_LIMIT,
      }),
    ]);
    // Eén actie per samenwerking (niet per ontbrekend certificaat-type): exact gelijk aan de
    // één-taak-per-samenwerking-emissie in de item-engine. De `clientHasComplianceAction`-gate sluit
    // enkel-`inReview`-meldingen uit — die geven de opdrachtgever geen actie (de ADMIN verifieert),
    // net als in pending-tasks.ts, zodat de badge geen niet-afhandelbare taak toont.
    const complianceActions = complianceAlerts.filter((a) =>
      clientHasComplianceAction(a.alert),
    ).length;
    const cascadeWork = countClientCascadeWork({
      proposedCollaborations: cascadeProposed,
      submittedPerformances: cascadePerf,
      submittedInvoices: cascadeInv,
      complianceActions,
    });
    // /kandidaten-badge = alle acties op dat oppervlak (item-engine-pariteit). De drie predicaten
    // zijn niet-overlappend (statussen NEW / VIEWED+SHORTLIST / ACCEPTED), dus een simpele som is
    // geen dubbeltelling — gelijk aan de losse taken op /acties.
    const staleActions =
      summarizeStaleClientApplications(
        staleCandidates.map((a) => ({
          status: a.status,
          createdAt: a.createdAt,
          hasCollaboration: a.collaboration != null,
        })),
      )?.count ?? 0;
    const proposalActions = pendingCollaborationProposals(
      acceptedCandidates.map((a) => ({
        applicationId: a.id,
        freelancerName: "",
        jobTitle: "",
        hasCollaboration: a.collaboration != null,
      })),
    ).length;
    return buildBadges({
      newApplications: newApplications + staleActions + proposalActions,
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
    const now = new Date();
    const soon = new Date(now.getTime() + EXPIRY_WINDOW_MS);
    const staleThreshold = new Date(now.getTime() - STALE_DIENST_DAYS * 86_400_000);
    const [overdueLeads, openHandoffs, expiringCreds, roster, openDiensten, staleDiensten] =
      await Promise.all([
        // Actieve leads (KOUD/WARM — KLANT/NO_DEAL zijn afgerond) met een opvolgdatum vóór vandaag.
        prisma.lead.count({
          where: {
            tenantId,
            status: { in: ["KOUD", "WARM"] },
            nextFollowUp: { lt: startOfUtcDay(now) },
          },
        }),
        // Open shift-overname-aanvragen binnen de eigen tenant (via de opdracht van de samenwerking).
        prisma.shiftHandoff.count({
          where: { status: "OPEN", collaboration: { job: { tenantId } } },
        }),
        // /franchise/zzpers — (bijna-)verlopende geverifieerde certificaten van tenant-ZZP'ers: exact het
        // predicaat van `franchiseCredentialExpiryTask` (pending-tasks.ts, gte now / lte soon). Aggregatie
        // is per profiel (één taak per ZZP'er), dus alleen `freelancerProfileId` is nodig om de distinct
        // profielen te tellen.
        prisma.credential.findMany({
          where: {
            freelancerProfile: { tenantId },
            status: "VERIFIED",
            expiresAt: { gte: now, lte: soon },
          },
          select: { freelancerProfileId: true },
          // Zelfde `orderBy` als de /acties-bron (`franchiseCredentialExpiryTask`, pending-tasks.ts):
          // beide cappen op 50 (CASCADE_SCAN_LIMIT === MAX), dus zonder identieke ordering pakken de
          // twee queries boven 50 verlopende certificaten binnen één tenant een ándere 50-rij-subset →
          // een ander distinct-profiel-aantal → de /franchise/zzpers-badge divergeert van /acties.
          orderBy: { expiresAt: "asc" },
          take: CASCADE_SCAN_LIMIT,
        }),
        // /franchise/zzpers — roster-inzetbaarheid: exact de bron/velden die `franchiseNotEngageableTask`
        // (pending-tasks.ts) via `computeEngageability` gebruikt om een plaatsing-blokkerende (INACTIEF)
        // ZZP'er te herkennen. Zelfde helper als /franchise/zzpers, zodat de oppervlakken niet driften.
        prisma.freelancerProfile.findMany({
          where: { tenantId },
          select: {
            id: true,
            completeness: true,
            availability: true,
            user: { select: { identityVerifiedAt: true, lastLoginAt: true } },
            credentials: { select: { type: true, status: true, expiresAt: true } },
          },
          take: CASCADE_SCAN_LIMIT,
        }),
        // /franchise/diensten — gepubliceerde tenant-diensten + vulgraad (actieve samenwerking = gevuld) +
        // startdatum, voor het acute-onbezet-aggregaat (`franchiseAcuteDienstTask`). Zelfde definitie én
        // deterministische, acuut-eerst geordende slice als pending-tasks.ts (null-start + vroegst-startend
        // voorop), zodat een acute dienst niet buiten de slice valt.
        prisma.job.findMany({
          where: { tenantId, status: "PUBLISHED" },
          select: {
            id: true,
            startDate: true,
            _count: { select: { collaborations: { where: { status: "ACTIVE" } } } },
          },
          orderBy: [{ startDate: { sort: "asc", nulls: "first" } }, { createdAt: "asc" }],
          take: CASCADE_SCAN_LIMIT,
        }),
        // /franchise/diensten — ongedekte, gepubliceerde diensten die te lang open staan (stale): exact het
        // predicaat van `franchiseStaleDienstTask`/rollup (geen actieve samenwerking, ouder dan de drempel).
        // Alleen `id` is nodig om de acute overlap eruit te filteren en de rijen te tellen.
        prisma.job.findMany({
          where: {
            tenantId,
            status: "PUBLISHED",
            collaborations: { none: { status: "ACTIVE" } },
            createdAt: { lte: staleThreshold },
          },
          orderBy: { createdAt: "asc" },
          select: { id: true },
          take: CASCADE_SCAN_LIMIT,
        }),
      ]);

    // /franchise/zzpers-badge = distinct profielen met (bijna-)verlopende certificaten + niet-inzetbare
    // roster-ZZP'ers, exact de som van de losse item-taken. Géén dedup op profiel: één ZZP'er kan zowel
    // een verloop-taak (VERIFIED, verloopt binnenkort) ÁLS een niet-inzetbaar-taak (verplicht document
    // ontbreekt/verlopen) tonen — precies zoals `franchiserTasks` beide pusht.
    const expiringProfiles = new Set(expiringCreds.map((c) => c.freelancerProfileId)).size;
    let notEngageable = 0;
    for (const f of roster) {
      const eng = computeEngageability(
        {
          credentials: f.credentials.map((c) => ({
            type: c.type as FreelancerCredential["type"],
            status: c.status as FreelancerCredential["status"],
            expiresAt: c.expiresAt,
          })),
          completeness: f.completeness,
          availability: f.availability as Availability,
          identityVerified: f.user.identityVerifiedAt != null,
          lastActiveAt: f.user.lastLoginAt ?? null,
        },
        now,
      );
      if (eng.status === "INACTIEF") notEngageable += 1;
    }
    const rosterAlerts = expiringProfiles + notEngageable;

    // /franchise/diensten-badge = acuut-onbezet-aggregaat (max 1) + getoonde stale-rijen + rollup. De acute
    // diensten worden uit de stale-lijst gefilterd (ze zitten al in het aggregaat) — exact dezelfde
    // overlap-verwijdering als `franchiserTasks`, zodat de badge niet dubbeltelt. `readyMatches` beïnvloedt
    // alleen de vulbaar/werving-splitsing binnen het aggregaat, niet OF het aggregaat verschijnt, dus 0 is
    // hier voldoende voor de telling.
    const acuteSummary = summarizeAcuteOpenDiensten(
      openDiensten.map((d) => ({
        published: true,
        filled: d._count.collaborations > 0,
        startDate: d.startDate,
        readyMatches: 0,
      })),
      now,
    );
    const acuteDienstIds = new Set(
      openDiensten
        .filter((d) => d._count.collaborations === 0 && isStartAcute(d.startDate, now))
        .map((d) => d.id),
    );
    const staleTaskCount = staleDiensten.filter((d) => !acuteDienstIds.has(d.id)).length;
    const openDienstAlerts = countFranchiseDienstAlerts({
      hasAcute: acuteSummary != null,
      staleTaskCount,
    });

    return buildBadges({ overdueLeads, openHandoffs, rosterAlerts, openDienstAlerts });
  }

  const [
    pendingVerifications,
    openDisputes,
    openSupportTickets,
    pendingNoShowVerdicts,
    noShowAtLimit,
    openAdminHandoffs,
    pendingUsers,
    deletionRequests,
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
    // Gebruikers-wachtrij (nav /admin/gebruikersbeheer). Exact dezelfde predicaten als /acties
    // (pending-tasks.ts adminTasks): (1) accounts die op goedkeuring wachten, (2) openstaande
    // AVG-verwijderverzoeken. Zonder deze tellingen was de Gebruikers-nav stil terwijl /acties + de
    // dashboard-rail de goedkeur- én de (hoogst-geprioriteerde) verwijderverzoek-taak wél tonen.
    prisma.user.count({ where: { status: "PENDING" } }),
    prisma.user.count({
      where: { deletionRequestedAt: { not: null }, anonymizedAt: null, role: { not: "ADMIN" } },
    }),
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
  const badges = buildBadges({
    pendingVerifications,
    openDisputes,
    openSupportTickets,
    // De /admin/no-shows-nav dekt beide wachtrijen op die pagina: te-beoordelen meldingen én
    // te-nemen uitschrijf-besluiten — samen gelijk aan het aantal no-show-taken op /acties.
    openNoShows: pendingNoShowVerdicts + atLimitToSuspend,
    openAdminHandoffs,
  });
  // Gebruikers-nav-badge (/admin/gebruikersbeheer, het echte nav-item): goedkeur-wachtrij +
  // verwijderverzoeken samen, gelijk aan het aantal gebruikers-taken op /acties. Dynamische toon:
  // een AVG-verwijderverzoek is het blokkerende, hoogst-geprioriteerde signaal (attention); alleen
  // te-activeren accounts is een rustige wachtrij (info, gelijk aan de `adminActivateUserTask`-toon).
  // Verdwijnt vanzelf zodra beide 0 zijn. Dynamische toon kan niet via de statische SIGNAL_TONE-map,
  // dus hier direct gezet (zelfde na-bewerkingspatroon als `withActionCenterBadge`).
  const userQueue = pendingUsers + deletionRequests;
  if (userQueue > 0) {
    badges["/admin/gebruikersbeheer"] = {
      count: userQueue,
      tone: deletionRequests > 0 ? "attention" : "info",
    };
  }
  return badges;
}
