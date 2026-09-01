// Nav-signalen: per rol berekent de server welke navigatie-items nú actie vragen.
// "Meedenken" zit hier: de gebruiker ziet vanaf elke pagina wat openstaat, zonder
// dat-ie het dashboard hoeft te openen. Server-side is de waarheid (deterministisch,
// zelfde drempels als het dashboard). De UI toont alleen wat hier wordt geteld.

import { Prisma } from "@prisma/client";

import { pendingCollaborationProposals } from "@/lib/accepted-proposal";
import { collaborationBlocksProposal } from "@/lib/collaboration-reproposal";
import { WAIT_ATTENTION_DAYS } from "@/lib/application-wait";
import { clientCredentialAlerts, clientHasComplianceAction } from "@/lib/collaboration-alerts";
import {
  countAttentionRenewals,
  RENEWAL_OVERDUE_GRACE_DAYS,
  RENEWAL_WINDOW_DAYS,
} from "@/lib/collaboration-renewal";
import { prisma } from "@/lib/db";
import { type CredentialStatus, type CredentialType, type UserRole } from "@/lib/enums";
import { collaborationPlacementBlocked } from "@/lib/collaborations";
import {
  collaborationRequiredCredentialGaps,
  type CollabCredentialInput,
} from "@/lib/collaboration-credential-expiry";
import {
  rosterExpiringByProfile,
  supersededVerifiedCredentialIds,
  coveredCredentialTypes,
} from "@/lib/credentials";
import {
  credentialCollabWhere,
  getFreelancerCascadeWorkCount,
} from "@/lib/data/freelancer-cascade-work";
import {
  ROSTER_ENGAGEABILITY_SELECT,
  evaluateRosterEngageability,
} from "@/lib/data/roster-engageability";
import { summarizeAcuteOpenDiensten, isStartAcute } from "@/lib/franchise/acute-open-diensten";
import { buildClientActivityInputs, summarizeClientHealth } from "@/lib/franchise/client-health";
import { MANDATORY_CREDENTIAL_TYPES, mandatoryDocumentAlertCount } from "@/lib/mandatory-documents";
import { type FreelancerCredential } from "@/lib/matching";
import { NO_SHOW_LIMIT } from "@/lib/no-show";
import { paymentDueSoonWhere } from "@/lib/payment-due-soon";
import { summarizeStaleClientApplications } from "@/lib/stale-applications";
import { getClientColdJobs } from "@/lib/data/client-cold-jobs";
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
  franchiseRenewals?: number; // FRANCHISER: aflopende plaatsingen die om een vervolg vragen (spiegelt /acties)
  attentionClients?: number; // FRANCHISER: stilgevallen opdrachtgevers die om re-engagement vragen (spiegelt /acties)
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
  franchiseRenewals: "/franchise/samenwerkingen",
  attentionClients: "/franchise/opdrachtgevers",
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
  // Een aflopende plaatsing vraagt actie van de bemiddelaar (vervolg plannen).
  franchiseRenewals: "attention",
  // Een stilgevallen opdrachtgever vraagt actie (re-engagement voor een vervolgopdracht).
  attentionClients: "attention",
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
 * Aantal vervolg-acties ("plan een vervolg") voor de `/samenwerkingen`-badge, exact gelijk aan de
 * `collaborationRenewalTask`-emissie op /acties + de dashboard-rail (`renewalTasks` in pending-tasks.ts).
 * Zonder deze telling was `cascadeWork` stiller dan /acties op een aflopende samenwerking — het "signaal
 * op één oppervlak"-anti-patroon (zie #1026/#1030). De query spiegelt `renewalTasks` één-op-één: dezelfde
 * partij-scope, `status:ACTIVE`, `disputedAt:null`, hetzelfde endDate-venster (`[overdueFloor, windowEnd]`,
 * de vloer één dag losser dan de `lapsed`-demping) en dezelfde cap/ordering; de pure `countAttentionRenewals`
 * past daarna de definitieve `attention`-grens toe → kan niet driften van /acties.
 */
async function renewalAttentionBadgeCount(
  partyWhere: Prisma.CollaborationWhereInput,
  now: Date,
): Promise<number> {
  const windowEnd = new Date(now.getTime() + RENEWAL_WINDOW_DAYS * 86_400_000);
  const overdueFloor = new Date(now.getTime() - (RENEWAL_OVERDUE_GRACE_DAYS + 1) * 86_400_000);
  const collabs = await prisma.collaboration.findMany({
    where: {
      ...partyWhere,
      status: "ACTIVE",
      disputedAt: null,
      endDate: { gte: overdueFloor, lte: windowEnd },
    },
    select: { endDate: true },
    orderBy: { endDate: "asc" },
    take: CASCADE_SCAN_LIMIT,
  });
  return countAttentionRenewals(collabs, now);
}

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

// De FREELANCER cascade-"aan zet"-telling voor de `/samenwerkingen`-nav-badge is verhuisd naar de
// gedeelde bron `@/lib/data/freelancer-cascade-work.ts` (`getFreelancerCascadeWorkCount`), die exact
// dezelfde status-gefilterde, self-healing queries draait als de /acties-emitters (pending-tasks.ts
// `freelancerTasks`). De vroegere pure `countFreelancerCascadeWork` las één gecombineerd
// `updatedAt desc, take: 50`-venster, wat een ouder-getekende ACTIVE-samenwerking met openstaand
// geld-/prestatiewerk buiten het venster liet vallen (permanent, niet self-healing) — badge stiller
// dan /acties. Zie het bestand voor de volledige achtergrond (persona-sweep run 82).

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
  overduePaymentNudges: number;
}): number {
  return (
    input.proposedCollaborations +
    input.submittedPerformances +
    input.submittedInvoices +
    input.complianceActions +
    // Cascade-facturen over de vervaldatum waarvan de opdrachtgever de betalende partij is: hij ziet op
    // /acties + de dashboard-rail de `clientCascadeOverduePaymentTask` (betaal 'm / laat bevestigen), dus
    // moet de /samenwerkingen-badge die actie ook tellen — anders is de badge stiller dan /acties (het
    // "signaal op één oppervlak"-anti-patroon). Eén nudge per OVERDUE-cascadefactuur, gelijk aan de
    // item-engine (die per factuur één taak emit). De generieke overdue-roll-up sluit deze cascade-
    // facturen bewust uit voor de opdrachtgever (geen betaalknop), dus geen dubbeltelling.
    input.overduePaymentNudges
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

/**
 * Aantal PROPOSED samenwerkingen van deze opdrachtgever waar het contract nog ondertekend kan worden.
 * Sluit — net als /acties (pending-tasks.ts `contractSignTask`) — de door een certificaat-gat
 * geblokkeerde plaatsingen uit: signContract weigert die server-side, dus de "Onderteken"-taak
 * verschijnt daar niet en de badge moet 'm ook niet tellen (badge↔lijst-pariteit). Gecapt op
 * CASCADE_SCAN_LIMIT, gelijk aan de list-slice, zodat beide op dezelfde rijen redeneren.
 */
async function countClientSignableProposals(userId: string, now: Date): Promise<number> {
  const proposed = await prisma.collaboration.findMany({
    where: { company: { userId }, status: "PROPOSED", disputedAt: null },
    select: {
      job: {
        select: {
          credentialRequirements: { where: { required: true }, select: { credentialType: true } },
        },
      },
      freelancer: {
        select: { credentials: { select: { type: true, status: true, expiresAt: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: CASCADE_SCAN_LIMIT,
  });
  let count = 0;
  for (const c of proposed) {
    const requiredTypes = c.job.credentialRequirements.map(
      (r) => r.credentialType as CredentialType,
    );
    const creds: FreelancerCredential[] = c.freelancer.credentials.map((cr) => ({
      type: cr.type as CredentialType,
      status: cr.status as FreelancerCredential["status"],
      expiresAt: cr.expiresAt,
    }));
    if (!collaborationPlacementBlocked(requiredTypes, creds, now)) count += 1;
  }
  return count;
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
      verifiedCreds,
      mandatoryCreds,
      unreadMessages,
      overdueInvoices,
      credentialCollabRows,
      savedJobs,
      renewalWork,
      placementCreds,
      cascadeWorkCount,
    ] = await Promise.all([
      prisma.credential.count({ where: { freelancerProfileId: profile.id, status: "REJECTED" } }),
      // Het volledige VERIFIED-dossier (niet enkel de in-venster verlopende rijen): superseded-
      // detectie heeft alle nu-geldige VERIFIED-certs van hetzelfde type nodig om te bepalen of het
      // verval van een exemplaar er nog toe doet. Zie de in-memory telling van `expiring` hieronder.
      prisma.credential.findMany({
        where: { freelancerProfileId: profile.id, status: "VERIFIED" },
        select: { id: true, type: true, status: true, expiresAt: true },
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
      // Lopende/voorgestelde samenwerkingen met een VERPLICHT certificaat-vereiste — de bron voor de
      // collab-vereist-certificaat-gaten (verlopen/ontbrekend) in de /certificaten-badge. Spiegelt de
      // ONGEWINDOWDE /acties-query `credentialCollabs` (pending-tasks.ts, run 79) via dezelfde gedeelde
      // WHERE (`credentialCollabWhere`) → geen `updatedAt`-venster, kan niet driften. Alleen `required`-
      // vereisten hoeven mee: samenwerkingen zonder vereist certificaat leveren nooit een gat op.
      prisma.collaboration.findMany({
        where: credentialCollabWhere(userId),
        select: {
          job: {
            select: {
              credentialRequirements: {
                where: { required: true },
                select: { credentialType: true },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
        take: CASCADE_SCAN_LIMIT,
      }),
      // bewaarde opdrachten die nog open staan (PUBLISHED) — gelijk aan de "open"-partitie op /opgeslagen
      prisma.savedJob.count({
        where: { freelancerProfileId: profile.id, job: { status: "PUBLISHED" } },
      }),
      // vervolgsignaal ("plan een vervolg"): exact de collaborationRenewalTask-emissie op /acties + de
      // dashboard-rail, zodat de /samenwerkingen-badge die actie meetelt (niet stiller dan /acties).
      renewalAttentionBadgeCount({ freelancer: { userId } }, now),
      // Volledige certificaatset (alle statussen) om per PROPOSED-samenwerking de plaatsings-blokkade
      // te bepalen én de collab-vereist-certificaat-gaten (verlopen/ontbrekend) te tellen — zelfde bron
      // als `allCreds` in pending-tasks.ts, zodat de badge-onderdrukking/-telling niet van de list-
      // onderdrukking/-telling kan driften. `id`/`title` nodig voor de gaten-helper (groepering per
      // certificaat).
      prisma.credential.findMany({
        where: { freelancerProfileId: profile.id },
        select: { id: true, title: true, type: true, status: true, expiresAt: true },
      }),
      // Cascade-"aan zet"-telling (contract ondertekenen / uren indienen / afgekeurde prestatie
      // herindienen / openstaande factuur) uit dezelfde gedeelde, status-gefilterde, self-healing
      // queries als de /acties-emitters (pending-tasks.ts `freelancerTasks`) → badge↔/acties-pariteit,
      // geen `updatedAt`-venster dat een ouder-getekende samenwerking met openstaand werk laat vallen.
      getFreelancerCascadeWorkCount(userId, now),
    ]);
    // Superseded-aware verval-telling voor de /certificaten-badge. `/acties` + de dashboard-rail
    // (pending-tasks.ts `freelancerTasks` → `supersededVerifiedCredentialIds`) sluiten een ouder,
    // bijna-verlopend VERIFIED-cert uit zodra een nieuwer, nu-geldig exemplaar van hetzelfde type de
    // compliance al draagt (de ZZP'er hoeft het niet te vernieuwen). Zonder dezelfde uitsluiting hier
    // telde de badge zo'n superseded cert wél als "verloopt binnenkort" → een valse, nooit-klarende
    // badge die /acties tegenspreekt. Zelfde drift-klasse als de franchiser-roster-badge (#1026),
    // hier op de ZZP-eigen certificatenbadge. Eén bron van waarheid: dezelfde pure helper.
    const supersededExpiringIds = supersededVerifiedCredentialIds(
      verifiedCreds.map((c) => ({
        id: c.id,
        type: c.type,
        status: c.status as CredentialStatus,
        expiresAt: c.expiresAt,
      })),
      now,
    );
    const expiring = verifiedCreds.filter(
      (c) =>
        c.expiresAt !== null &&
        c.expiresAt > now &&
        c.expiresAt <= soon &&
        !supersededExpiringIds.has(c.id),
    ).length;
    // De cascade-taaktelling komt uit de gedeelde `getFreelancerCascadeWorkCount` (zelfde queries als
    // /acties); het vervolgsignaal (`renewalWork`, aparte `endDate`-gebonden telling) telt daar bovenop.
    const cascadeWork = cascadeWorkCount + renewalWork;
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
    // Door een lopende/voorgestelde samenwerking VEREIST (niet-verplicht) certificaat dat de ZZP'er
    // mist of dat verlopen is: /acties (pending-tasks.ts) toont hiervoor een credentialCollabMissing/
    // -Expired-taak, maar `rejected + expiring(VERIFIED) + mandatoryAlerts` dekt zo'n gat niet → de
    // badge was stiller dan /acties (persona-sweep run 70, GEPARKEERD LOW). Zelfde gedeelde helper +
    // dezelfde certificaatset/mandatory-uitsluiting als /acties → kan niet driften. De expiry-tak
    // (nog-geldig-maar-verlopend VERIFIED) valt al onder `expiring` hierboven, dus alleen de
    // verlopen/ontbrekende gaten tellen hier extra mee.
    const collabCredList: CollabCredentialInput[] = placementCreds.map((c) => ({
      id: c.id,
      title: c.title,
      type: c.type as CredentialType,
      status: c.status as CredentialStatus,
      expiresAt: c.expiresAt,
    }));
    const collabCredGaps = collaborationRequiredCredentialGaps({
      collaborations: credentialCollabRows.map((c, i) => ({
        collaborationId: String(i),
        companyName: "",
        jobTitle: "",
        requiredTypes: c.job.credentialRequirements.map((r) => r.credentialType as CredentialType),
      })),
      credentials: collabCredList,
      mandatoryTypes: MANDATORY_CREDENTIAL_TYPES,
      now,
    });
    const collabCredentialAlerts = collabCredGaps.expired.length + collabCredGaps.missing.length;
    // Standalone verlopen niet-verplichte certs die géén samenwerking vereist: /acties toont hiervoor
    // de nieuwe credentialFixTask("expired"), maar `collabCredentialAlerts` telt ze niet mee (dat
    // zijn alleen collab-vereiste gaten). Zelfde filter als de dedup in pending-tasks.ts → badge kan
    // niet driften van /acties.
    const collabExpiredCredIds = new Set(collabCredGaps.expired.map((c) => c.credentialId));
    // Dekkings-uitsluiting (spiegelt pending-tasks.ts `freelancerTasks`): een verlopen cert waarvan
    // het type al door een nu-geldig VERIFIED-cert wordt gedragen, is geen actueel gat → geen
    // valse badge die /acties (dat het óók uitsluit) tegenspreekt. Zelfde gedeelde pure helper.
    const coveredTypes = coveredCredentialTypes(
      placementCreds.map((c) => ({
        id: c.id,
        type: c.type,
        status: c.status as CredentialStatus,
        expiresAt: c.expiresAt,
      })),
      now,
    );
    const standaloneExpiredAlerts = placementCreds.filter(
      (c) =>
        c.status === "EXPIRED" &&
        !MANDATORY_CREDENTIAL_TYPES.includes(
          c.type as (typeof MANDATORY_CREDENTIAL_TYPES)[number],
        ) &&
        !collabExpiredCredIds.has(c.id) &&
        !coveredTypes.has(c.type),
    ).length;
    return buildBadges({
      credentialAlerts:
        rejected + expiring + mandatoryAlerts + collabCredentialAlerts + standaloneExpiredAlerts,
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
    const now = new Date();
    const staleWindow = new Date(now.getTime() - WAIT_ATTENTION_DAYS.VIEWED * 86_400_000);
    const [
      newApplications,
      draftJobs,
      unreadMessages,
      overdueInvoices,
      cascadeProposed,
      cascadePerf,
      cascadeInv,
      cascadeOverduePayments,
      complianceAlerts,
      staleCandidates,
      acceptedCandidates,
      renewalWork,
      coldJobs,
    ] = await Promise.all([
      prisma.application.count({ where: { job: { companyId: company.id }, status: "NEW" } }),
      prisma.job.count({ where: { companyId: company.id, status: "DRAFT" } }),
      unreadConversationCount(userId),
      overdueInvoiceCount("CLIENT", userId),
      // cascade: contract ondertekenen — elke PROPOSED (niet-bevroren) samenwerking van deze
      // opdrachtgever wáár het contract nog ondertekend kan worden. Symmetrisch met de FREELANCER-tak
      // (PROPOSED → +1, behalve bij een plaatsings-blokkade) en met /acties (pending-tasks.ts
      // `contractSignTask`, run 58): een door een certificaat-gat geblokkeerde plaatsing kan niet
      // getekend worden, dus /acties onderdrukt de taak en de badge telt 'm niet — anders sprak de
      // /samenwerkingen-badge /acties + het samenwerkingsdetail tegen (fantoom-actie).
      countClientSignableProposals(userId, now),
      // cascade: prestaties goedkeuren (telt ook mee in pendingPerformances voor /prestaties-badge).
      // Bevroren (dispuut) samenwerkingen uitsluiten — symmetrisch met de FREELANCER-tak
      // (disputedAt: null hierboven) en met /acties (pending-tasks.ts): approvePerformance weigert
      // een bevroren deal (assertNotDisputed), dus die telt niet als werk "aan zet". De
      // `status: "ACTIVE"`-grens spiegelt de /acties-emitter exact (pending-tasks.ts
      // `approvePerformances`): een SUBMITTED-prestatie kan nu niet coëxisteren met een niet-ACTIVE
      // samenwerking (de complete/cancel-guards blokkeren dat), maar zónder deze grens zou een
      // toekomstige guard-wijziging het gat stil heropenen en zou de badge /acties tegenspreken.
      prisma.performance.count({
        where: {
          status: "SUBMITTED",
          collaboration: { company: { userId }, status: "ACTIVE", disputedAt: null },
        },
      }),
      // cascade: facturen goedkeuren — idem bevroren deals uitsluiten (approveInvoice weigert ze).
      // Zelfde `company: { userId }` + `status: "ACTIVE"`-scope als de /acties-emitter
      // (pending-tasks.ts `approveInvoices`) zodat de badge nooit van /acties kan driften.
      prisma.invoice.count({
        where: {
          counterpartyUserId: userId,
          lifecycleStatus: "SUBMITTED",
          collaboration: { company: { userId }, status: "ACTIVE", disputedAt: null },
        },
      }),
      // cascade: facturen over de vervaldatum waar de opdrachtgever de betalende partij is — voedt de
      // `clientCascadeOverduePaymentTask` op /acties + de dashboard-rail. Zelfde scope als die item-taak
      // (pending-tasks.ts) zodat de badge nooit driften kan; idem bevroren deals uitsluiten.
      prisma.invoice.count({
        where: {
          counterpartyUserId: userId,
          lifecycleStatus: "OVERDUE",
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
        // Deterministische slice, gelijk aan pending-tasks.ts (`staleApplicationsTask`): zonder orderBy
        // is welke CASCADE_SCAN_LIMIT-rijen Prisma teruggeeft niet-deterministisch, zodat de badge en
        // /acties bij >limit stale reacties een ander subset (en dus een andere telling) kunnen kiezen.
        orderBy: { createdAt: "asc" },
        take: CASCADE_SCAN_LIMIT,
      }),
      // geaccepteerde reacties die nog een samenwerkingsvoorstel missen — exact het predicaat uit
      // pending-tasks.ts (`proposeCollaborationTask`). Reeds-voorgestelde (met collaboration) vallen af.
      prisma.application.findMany({
        where: { job: { companyId: company.id }, status: "ACCEPTED" },
        // acceptedAt/updatedAt voeden de leeftijd-klok in `pendingCollaborationProposals`; de badge
        // gebruikt alleen het aantal (niet de aging), maar de helper vereist een niet-null klok.
        select: {
          id: true,
          // Reproposability-velden: een geannuleerd, nooit-ondertekend voorstel blokkeert geen nieuw
          // voorstel (collaboration-reproposal.ts) → de badge telt het als openstaande actie.
          collaboration: {
            select: {
              status: true,
              contractStatus: true,
              agreementClientSignedAt: true,
              agreementFreelancerSignedAt: true,
              completedAt: true,
              _count: { select: { invoices: true, performances: true } },
            },
          },
          acceptedAt: true,
          updatedAt: true,
        },
        // Deterministische slice, gelijk aan pending-tasks.ts (`proposeCollaborationTask`,
        // `orderBy:{updatedAt:"asc"}`): zonder orderBy kan de badge bij >limit geaccepteerde reacties een
        // ander subset kiezen dan /acties, en omdat `pendingCollaborationProposals` per rij de
        // collaboration-staat (reproposal) meeweegt, kan de resulterende telling driften.
        orderBy: { updatedAt: "asc" },
        take: CASCADE_SCAN_LIMIT,
      }),
      // vervolgsignaal ("plan een vervolg"): exact de collaborationRenewalTask-emissie op /acties + de
      // dashboard-rail (symmetrisch met de FREELANCER-tak), zodat de /samenwerkingen-badge die actie
      // meetelt en niet stiller is dan /acties op een aflopende samenwerking.
      renewalAttentionBadgeCount({ company: { userId } }, now),
      // koud-lopende gepubliceerde opdrachten (geen/weinig kandidaten) — exact de jobNeedsAttentionTask-
      // emissie op /acties + de dashboard-rail. Gedeelde `getClientColdJobs` (zelfde koud-drempels,
      // scan-cap en ordering) → de /opdrachten-badge kan niet driften van /acties.
      getClientColdJobs(userId, now),
    ]);
    // Eén actie per samenwerking (niet per ontbrekend certificaat-type): exact gelijk aan de
    // één-taak-per-samenwerking-emissie in de item-engine. De `clientHasComplianceAction`-gate sluit
    // enkel-`inReview`-meldingen uit — die geven de opdrachtgever geen actie (de ADMIN verifieert),
    // net als in pending-tasks.ts, zodat de badge geen niet-afhandelbare taak toont.
    const complianceActions = complianceAlerts.filter((a) =>
      clientHasComplianceAction(a.alert),
    ).length;
    const cascadeWork =
      countClientCascadeWork({
        proposedCollaborations: cascadeProposed,
        submittedPerformances: cascadePerf,
        submittedInvoices: cascadeInv,
        complianceActions,
        overduePaymentNudges: cascadeOverduePayments,
      }) + renewalWork;
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
        hasCollaboration: collaborationBlocksProposal(
          a.collaboration
            ? {
                status: a.collaboration.status,
                contractStatus: a.collaboration.contractStatus,
                agreementClientSignedAt: a.collaboration.agreementClientSignedAt,
                agreementFreelancerSignedAt: a.collaboration.agreementFreelancerSignedAt,
                completedAt: a.collaboration.completedAt,
                invoicesCount: a.collaboration._count?.invoices ?? 0,
                performancesCount: a.collaboration._count?.performances ?? 0,
              }
            : null,
        ),
        acceptedAt: a.acceptedAt ?? a.updatedAt,
      })),
    ).length;
    const badges = buildBadges({
      newApplications: newApplications + staleActions + proposalActions,
      draftJobs,
      unreadMessages,
      overdueInvoices,
      cascadeWork,
      pendingPerformances: cascadePerf,
    });
    // /opdrachten combineert concept-opdrachten (info) met koud-lopende gepubliceerde opdrachten die om
    // bijsturen vragen (attention) — exact de `jobNeedsAttentionTask`-emissie op /acties + de rail via
    // dezelfde gedeelde `getClientColdJobs` (geen drift). Zodra er een koude opdracht is wint de
    // attention-toon (spiegelt de dynamisch-getoonde /admin/gebruikersbeheer-badge); verdwijnt vanzelf
    // zodra beide 0 zijn. Zonder deze telling had /opdrachten een /acties-taak zonder badge — het
    // "signaal op één oppervlak"-anti-patroon.
    if (coldJobs.length > 0) {
      badges["/opdrachten"] = { count: draftJobs + coldJobs.length, tone: "attention" };
    }
    return badges;
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
    const [
      overdueLeads,
      openHandoffs,
      expiringCreds,
      roster,
      openDiensten,
      staleDiensten,
      franchiseRenewals,
      attentionClientRows,
      attentionPublishedJobs,
      attentionCollabActivity,
    ] = await Promise.all([
      // Actieve leads (KOUD/WARM — KLANT/NO_DEAL zijn afgerond) met een opvolgdatum vóór vandaag.
      prisma.lead.count({
        where: {
          tenantId,
          status: { in: ["KOUD", "WARM"] },
          nextFollowUp: { lt: startOfUtcDay(now) },
        },
      }),
      // Open shift-overname-aanvragen binnen de eigen tenant (via de opdracht van de samenwerking).
      // Scope óók op de samenwerking zelf (ACTIVE + niet in dispuut): een OPEN-aanvraag op een
      // terminale of bevroren inzet is geen openstaande governance-beslissing meer — spiegelt exact
      // de /acties-bron (`pendingTasks`) zodat badge en actiecentrum niet uiteenlopen.
      prisma.shiftHandoff.count({
        where: {
          status: "OPEN",
          collaboration: { status: "ACTIVE", disputedAt: null, job: { tenantId } },
        },
      }),
      // /franchise/zzpers — kandidaat-profielen met een (bijna-)verlopend geverifieerd certificaat van
      // tenant-ZZP'ers (venster gte now / lte soon), exact de eerste-stap-scope van de /acties-bron
      // (`expiringRosterCreds` in pending-tasks.ts). Dit is nog NIET het eindaantal: superseded exemplaren
      // worden hieronder uitgesloten via `rosterExpiringByProfile` (zelfde helper als /acties), zodat de
      // badge niet over-rapporteert t.o.v. /acties. Alleen `freelancerProfileId` nodig om de kandidaten
      // te bepalen.
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
      // (pending-tasks.ts) gebruikt om een plaatsing-blokkerende (INACTIEF) ZZP'er te herkennen.
      // Gedeelde select/evaluatie via `roster-engageability.ts`, zodat de `notEngageable`-telling op de
      // badge en op /acties per definitie niet kan driften. ONGEWINDOWD (geen `take`): capte eerder op
      // 50 (`id: asc`), waardoor een niet-inzetbaar roster-lid voorbij de 50e permanent uit de badge én
      // /acties viel (persona-sweep run 81, DOEL 1b). Per tenant een beheerbaar aantal profielen —
      // spiegelt de ongelimiteerde `company.findMany({ tenantId })`-scan verderop in deze berekening.
      prisma.freelancerProfile.findMany({
        where: { tenantId },
        select: ROSTER_ENGAGEABILITY_SELECT,
      }),
      // /franchise/diensten — gepubliceerde, ONGEVULDE tenant-diensten + startdatum, voor het
      // acute-onbezet-aggregaat (`franchiseAcuteDienstTask`). Zelfde definitie én deterministische,
      // acuut-eerst geordende slice als pending-tasks.ts (null-start + vroegst-startend voorop),
      // zodat een acute dienst niet buiten de slice valt. De `collaborations:none`-scope is
      // essentieel en spiegelt pending-tasks.ts: zonder die filter tellen óók gevulde diensten mee in
      // de `take`-slice, en omdat null-start diensten door `nulls:"first"` vooraan sorteren kan een
      // tenant met ≥CASCADE_SCAN_LIMIT gevulde, start-loze diensten een écht acute (ongevulde) dienst
      // uit de slice duwen → de badge undercount t.o.v. /acties + de rail. De zuster-query
      // `staleDiensten` hieronder scopet al net zo; `_count` blijft als defense-in-depth (self-correct
      // als een race intussen een ACTIVE-samenwerking toevoegt).
      prisma.job.findMany({
        where: {
          tenantId,
          status: "PUBLISHED",
          collaborations: { none: { status: "ACTIVE" } },
        },
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
      // /franchise/samenwerkingen — aflopende plaatsingen binnen de tenant die om een vervolg vragen.
      // Exact dezelfde bron als de /acties-taak (`franchiseCollaborationRenewalTask`, pending-tasks.ts):
      // tenant-scope via `job.tenantId`, `status:ACTIVE`, `disputedAt:null`, hetzelfde endDate-venster,
      // cap en ordering (via de gedeelde `renewalAttentionBadgeCount`-helper), en dezelfde pure
      // `countAttentionRenewals`-attentiegrens → de badge kan niet driften van /acties. Zonder deze
      // telling was `/franchise/samenwerkingen` het enige franchiser-navitem met een /acties-taak maar
      // zonder badge (het "signaal op één oppervlak"-anti-patroon; spiegelt de partij-fix #1034).
      renewalAttentionBadgeCount({ job: { tenantId } }, now),
      // /franchise/opdrachtgevers — relatiegezondheid-bron voor de re-engagement-badge: alle
      // tenant-opdrachtgevers + hun actieve samenwerkingen. Exact de scope/definitie van de
      // klantenlijst-pagina én de /acties-taak (`franchiseClientReengagementTask`, pending-tasks.ts):
      // `tenantScopeWhere` = `{ tenantId }`, ongelimiteerd (per tenant een beheerbaar aantal bedrijven).
      // De twee groupBy-aggregaten hieronder leveren de open-opdracht-telling + het laatste-activiteit-
      // moment. Zonder deze telling was `/franchise/opdrachtgevers` het enige bemiddeling-navitem met een
      // pagina-signaal maar zonder badge (het "signaal op één oppervlak"-anti-patroon).
      prisma.company.findMany({
        where: { tenantId },
        select: {
          id: true,
          createdAt: true,
          _count: { select: { collaborations: { where: { status: "ACTIVE" } } } },
        },
      }),
      prisma.job.groupBy({
        by: ["companyId"],
        where: { company: { tenantId }, status: "PUBLISHED" },
        _count: { _all: true },
        _max: { createdAt: true },
      }),
      prisma.collaboration.groupBy({
        by: ["companyId"],
        where: { company: { tenantId } },
        _max: { updatedAt: true },
      }),
    ]);

    // /franchise/opdrachtgevers-badge = aantal `attention`-klanten (stilgevallen: geen open dienst/
    // lopende plaatsing, ≥ CLIENT_IDLE_DAYS rustig), exact het aantal `franchiseClientReengagementTask`-
    // taken op /acties. Zelfde pure afleiding + classificatie (`buildClientActivityInputs` →
    // `summarizeClientHealth`) als de klantenlijst-pagina en pending-tasks.ts → kan niet driften.
    const attentionClients = summarizeClientHealth(
      [
        ...buildClientActivityInputs(
          attentionClientRows.map((c) => ({
            id: c.id,
            createdAt: c.createdAt,
            activeCollaborationCount: c._count.collaborations,
          })),
          attentionPublishedJobs,
          attentionCollabActivity,
        ).values(),
      ],
      now,
    ).attention;

    // /franchise/zzpers-badge = distinct profielen met (bijna-)verlopende certificaten + niet-inzetbare
    // roster-ZZP'ers, exact de som van de losse item-taken. Géén dedup op profiel: één ZZP'er kan zowel
    // een verloop-taak (VERIFIED, verloopt binnenkort) ÁLS een niet-inzetbaar-taak (verplicht document
    // ontbreekt/verlopen) tonen — precies zoals `franchiserTasks` beide pusht.
    //
    // Superseded exemplaren (een nieuwer, nu-geldig cert van hetzelfde type dekt de compliance al) tellen
    // NIET mee: anders divergeert de badge van /acties, dat via `rosterExpiringByProfile` superseded al
    // uitsluit. Voor de supersede-check hebben we per kandidaat-profiel het VOLLEDIGE VERIFIED-dossier
    // nodig (ook de langer-geldige/onbeperkte dekkers), gescoped op de kandidaat-ids — exact dezelfde
    // twee-staps-aanpak als `franchiserTasks` (pending-tasks.ts). Naam is voor de telling irrelevant.
    const candidateProfileIds = [...new Set(expiringCreds.map((c) => c.freelancerProfileId))];
    let expiringProfiles = 0;
    if (candidateProfileIds.length > 0) {
      const coverCreds = await prisma.credential.findMany({
        where: { status: "VERIFIED", freelancerProfileId: { in: candidateProfileIds } },
        select: { id: true, type: true, expiresAt: true, freelancerProfileId: true },
      });
      expiringProfiles = rosterExpiringByProfile(
        coverCreds.map((c) => ({
          id: c.id,
          type: c.type,
          status: "VERIFIED" as const,
          expiresAt: c.expiresAt,
          freelancerProfileId: c.freelancerProfileId,
          freelancerName: "",
        })),
        now,
        soon,
      ).length;
    }
    let notEngageable = 0;
    for (const f of roster) {
      if (evaluateRosterEngageability(f, now).status === "INACTIEF") notEngageable += 1;
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

    return buildBadges({
      overdueLeads,
      openHandoffs,
      rosterAlerts,
      openDienstAlerts,
      franchiseRenewals,
      attentionClients,
    });
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
    // Open dienst-overname-aanvragen, platform-breed (admin ziet ze allemaal). Scope óók op de
    // samenwerking zelf (ACTIVE + niet in dispuut) — spiegelt de /acties-bron (`pendingTasks`) zodat
    // de nav-badge geen aanvragen telt op een terminale of bevroren inzet.
    prisma.shiftHandoff.count({
      where: { status: "OPEN", collaboration: { status: "ACTIVE", disputedAt: null } },
    }),
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
