// Actiecentrum — server-enumerator. Haalt per rol de CONCRETE openstaande items op (findMany, niet
// count) en bouwt PendingTask[] via de pure builders in tasks.ts. Hergebruikt dezelfde queries/
// drempels als het dashboard (signals.ts, profile.ts). N+1-veilig: één query per kind met take-limiet.

import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { type Actor } from "@/lib/authz";
import { type Availability } from "@/lib/enums";
import { computeFreelancerCompleteness, computeCompanyCompleteness } from "@/lib/profile";
import { mandatoryDocuments, MANDATORY_CREDENTIAL_TYPES } from "@/lib/mandatory-documents";
import {
  ROSTER_ENGAGEABILITY_SELECT,
  evaluateRosterEngageability,
} from "@/lib/data/roster-engageability";
import { formatMissing } from "@/lib/next-actions";
import { startOfUtcDay } from "@/lib/signals";
import { type FreelancerCredential } from "@/lib/matching";
import {
  CREDENTIAL_TYPE_LABEL,
  rosterExpiringByProfile,
  rosterExpiredByProfile,
  supersededVerifiedCredentialIds,
  coveredCredentialTypes,
} from "@/lib/credentials";
import { type CredentialType, type CredentialStatus } from "@/lib/enums";
import { getCompletenessProfile } from "@/lib/data/freelancer-profile";
import {
  credentialCollabWhere,
  openInvoiceWhere,
  proposedCollabWhere,
  rejectedPerfWhere,
  submitCollabWhere,
} from "@/lib/data/freelancer-cascade-work";
import { overdueInvoiceBreakdown, overdueInvoiceCount, paymentDueSoonCount } from "@/lib/signals";
import { summarizeAvailabilityFreshness } from "@/lib/availability";
import { type AvailabilityWindowType } from "@/lib/enums";
import { NO_SHOW_LIMIT } from "@/lib/no-show";
import { parseLanguages } from "@/lib/parse-languages";
import { SUPPORT_OPEN_STATUSES, SUPPORT_STATUS_LABEL } from "@/lib/support/labels";
import { type SupportTicketStatus } from "@/lib/enums";
import {
  rankTasks,
  contractSignTask,
  performanceSubmitTask,
  performanceApproveTask,
  performanceResubmitTask,
  invoiceSubmitTask,
  invoiceApproveTask,
  paymentConfirmTask,
  messageReplyTask,
  profilePrivateTask,
  profileCompletenessTask,
  billingProfileTask,
  identityVerifyTask,
  companyCompletenessTask,
  credentialFixTask,
  credentialCollabExpiryTask,
  credentialCollabExpiredTask,
  credentialCollabMissingTask,
  mandatoryDocumentTask,
  adminVerifyCredentialTask,
  adminActivateUserTask,
  adminResolveDisputeTask,
  adminDeletionRequestTask,
  adminJudgeNoShowTask,
  adminSuspendNoShowTask,
  adminSupportTicketTask,
  overdueInvoiceTask,
  paymentDueSoonTask,
  applicationsReviewTask,
  proposeCollaborationTask,
  firstLookOverdueTask,
  staleApplicationsTask,
  availabilityRefreshTask,
  draftJobsTask,
  staleDraftJobTask,
  idleCapacityTask,
  jobNeedsAttentionTask,
  jobStaffingOverdueTask,
  franchiseCredentialExpiryTask,
  franchiseCredentialExpiredTask,
  franchiseAcuteDienstTask,
  franchiseLeadFollowupTask,
  franchiseNotEngageableTask,
  franchiseStaleDienstTask,
  franchiseStaleDienstRollupTask,
  franchiseCollaborationRenewalTask,
  franchiseClientReengagementTask,
  franchiseRosterReengagementTask,
  franchiseGuidedSetupTasks,
  shiftHandoffTask,
  clientComplianceTask,
  clientCascadeOverduePaymentTask,
  reviewLeaveTask,
  collaborationRenewalTask,
  respondInvitationTask,
  vatDeadlineTask,
  incomeTaxDeadlineTask,
  hoursCriterionTask,
  type PendingTask,
} from "@/lib/actions/tasks";
import {
  getCredentialDossier,
  getUnreadConversationState,
  getUserTenantId,
} from "@/lib/user-context";
import { getIdleCapacityForProfile } from "@/lib/data/freelancer-idle-capacity";
import { getBillingReadiness } from "@/lib/data/freelancer-billing-readiness";
import { getReceivedInvitations } from "@/lib/data/received-invitations";
import { invitationAgeDays } from "@/lib/received-invitations";
import { daysSince } from "@/lib/concept-invoice-reminders";
import { reviewPromptForCollaboration } from "@/lib/collaboration-review-prompt";
import {
  summarizeCollaborationRenewal,
  RENEWAL_WINDOW_DAYS,
  RENEWAL_OVERDUE_GRACE_DAYS,
} from "@/lib/collaboration-renewal";
import { reviewBlindDays } from "@/lib/config";
import { getVatDeadlinesForActor } from "@/lib/data/vat-deadline";
import { getClientColdJobs } from "@/lib/data/client-cold-jobs";
import { getClientOverdueJobs } from "@/lib/data/client-overdue-jobs";
import { getClientDraftJobs } from "@/lib/data/client-draft-jobs";
import { summarizeDraftJobAging } from "@/lib/draft-job-aging";
import { getIncomeTaxDeadlineForActor } from "@/lib/data/income-tax-deadline";
import { incomeTaxDeadlineNeedsAction } from "@/lib/administration/income-tax-deadline";
import {
  getHoursCriterionSummary,
  hoursCriterionNeedsAction,
} from "@/lib/tax/hours-criterion-summary";
import { clientCredentialAlerts, clientHasComplianceAction } from "@/lib/collaboration-alerts";
import { collaborationPlacementBlocked } from "@/lib/collaborations";
import {
  collaborationCredentialExpiryConcerns,
  collaborationRequiredCredentialGaps,
  type CollabCredentialInput,
} from "@/lib/collaboration-credential-expiry";
import { summarizeStaleClientApplications } from "@/lib/stale-applications";
import { summarizeFirstLookOverdue } from "@/lib/client-first-look";
import { CANDIDATE_GHOSTING_RISK_DAYS } from "@/lib/client-application-funnel";
import { pendingCollaborationProposals } from "@/lib/accepted-proposal";
import { collaborationBlocksProposal } from "@/lib/collaboration-reproposal";
import { WAIT_ATTENTION_DAYS } from "@/lib/application-wait";
import { getRosterFillSignalsForTenant } from "@/lib/franchise/dienst-fill-signal";
import { summarizeAcuteOpenDiensten, isStartAcute } from "@/lib/franchise/acute-open-diensten";
import {
  buildClientActivityInputs,
  classifyClientHealth,
  clientIdleDays,
} from "@/lib/franchise/client-health";
import { classifyRosterDormancy } from "@/lib/franchise/roster-dormancy";

/** Harde bovengrens per kind (voorkomt N+1/zware lijsten op /acties); "+N meer" buiten beschouwing. */
const MAX = 50;
const EXPIRY_WINDOW_MS = 30 * 86_400_000;
/** Drempel (dagen) waarna een ongedekte, gepubliceerde dienst als "te lang open" telt (zelfde als het dashboard). */
const STALE_DIENST_DAYS = 7;

/** Gesprekken met een onbeantwoord bericht van de andere partij (zelfde logica als signals). */
interface UnreadConversation {
  id: string;
  withWhom: string; // de andere deelnemer (afzender)
  subject: string | null; // de opdracht waar het gesprek over gaat, indien gekoppeld
}

async function unreadConversations(userId: string): Promise<UnreadConversation[]> {
  // Gedeelde, request-gecachte bron (user-context.ts): de `/berichten`-badge (signals.ts) draaide
  // dezelfde twee queries binnen dezelfde render. De deterministische `conversationId asc`-ordening
  // zit in die loader — nodig vóór de `.slice(0, MAX)` verderop: Prisma garandeert geen rijvolgorde
  // zonder orderBy, dus bij >MAX gelijktijdig-ongelezen gesprekken zou wisselen wélke MAX in het
  // venster landen en zou de berichttaak tussen requests flikkeren.
  const { participants, latestForeign: latest } = await getUnreadConversationState(userId);
  if (participants.length === 0) return [];
  const unreadIds = participants
    .filter((p) => {
      const at = latest.get(p.conversationId);
      return at && (!p.lastReadAt || at.getTime() > p.lastReadAt.getTime());
    })
    .slice(0, MAX)
    .map((p) => p.conversationId);
  if (unreadIds.length === 0) return [];

  // Verrijk met afzender + onderwerp zodat elke berichttaak onderscheidend is
  // (anders tonen meerdere openstaande berichten een identieke rij).
  const convos = await prisma.conversation.findMany({
    where: { id: { in: unreadIds } },
    select: {
      id: true,
      job: { select: { title: true } },
      participants: {
        where: { userId: { not: userId } },
        select: { user: { select: { name: true } } },
      },
    },
  });
  const byId = new Map(convos.map((c) => [c.id, c]));
  return unreadIds.map((id) => {
    const c = byId.get(id);
    return {
      id,
      withWhom: c?.participants[0]?.user.name ?? "Onbekende afzender",
      subject: c?.job?.title ?? null,
    };
  });
}

/**
 * Beoordelings-nudges: afgeronde samenwerkingen die de actor nog kan beoordelen (blind venster open,
 * nog niet zelf beoordeeld). Eén query per rol, DB-voorgefilterd op het open venster (completedAt ná
 * de vensterstart, óf legacy-rijen zonder completedAt) + take-limiet — N+1-veilig. De pure
 * `reviewPromptForCollaboration` past exact dezelfde eligibiliteit toe als de detailpagina, zodat de
 * takenlijst het beoordelingsformulier daar nooit tegenspreekt. `role` bepaalt de partij-scoping en
 * wie de tegenpartij (de beoordeelde) is.
 */
async function reviewLeaveTasks(
  userId: string,
  role: "FREELANCER" | "CLIENT",
  now: Date,
): Promise<PendingTask[]> {
  const blindDays = reviewBlindDays();
  // Venster kan alleen nog open zijn als het anker (afronding) ná dit moment ligt. completedAt=null
  // (legacy) valt op createdAt terug — die rijen laten we door de pure guard filteren.
  const windowStart = new Date(now.getTime() - blindDays * 86_400_000);
  const partyWhere = role === "FREELANCER" ? { freelancer: { userId } } : { company: { userId } };

  const collabs = await prisma.collaboration.findMany({
    where: {
      ...partyWhere,
      status: "COMPLETED",
      OR: [{ completedAt: { gte: windowStart } }, { completedAt: null }],
    },
    select: {
      id: true,
      completedAt: true,
      createdAt: true,
      job: { select: { title: true } },
      company: { select: { name: true } },
      freelancer: { select: { user: { select: { name: true } } } },
      // Heeft de actor deze samenwerking al beoordeeld? @@unique([collaborationId, authorId]).
      reviews: { where: { authorId: userId }, select: { id: true }, take: 1 },
    },
    orderBy: { completedAt: "desc" },
    take: MAX,
  });

  const tasks: PendingTask[] = [];
  for (const c of collabs) {
    const prompt = reviewPromptForCollaboration({
      collaborationStatus: "COMPLETED",
      completionAnchor: c.completedAt ?? c.createdAt,
      alreadyReviewedByActor: c.reviews.length > 0,
      blindDays,
      now,
    });
    if (!prompt) continue;
    const counterparty =
      role === "FREELANCER"
        ? (c.company.name ?? "de opdrachtgever")
        : (c.freelancer.user.name ?? "de ZZP'er");
    tasks.push(reviewLeaveTask(c.id, c.job.title, counterparty, prompt.daysLeft));
  }
  return tasks;
}

/**
 * Vervolgsignaal als next-action: een ACTIVE, niet-bevroren samenwerking waarvan de einddatum binnen
 * het vervolgvenster valt of al verstreken is. Eén taak per samenwerking, voor beide partijen — deep-
 * link naar het detail waar de volledige nudge staat. De pure `summarizeCollaborationRenewal` is de
 * enige bron voor fase/dagen (lijst en detail kunnen nooit divergeren); de query pre-filtert op
 * `endDate ∈ [grace-vloer, venstergrens]` (recent verstreken inbegrepen; null valt buiten de range)
 * en `disputedAt: null`. De grace-vloer staat één dag losser dan `summarizeCollaborationRenewal`
 * dempt, zodat de pure functie de definitieve `lapsed`-grens bepaalt (geen off-by-one op de UTC-dag)
 * en elke doorgelaten rij als `ending_soon` of `overdue` (aandacht) terugkomt.
 */
async function renewalTasks(
  userId: string,
  role: "FREELANCER" | "CLIENT",
  now: Date,
): Promise<PendingTask[]> {
  const windowEnd = new Date(now.getTime() + RENEWAL_WINDOW_DAYS * 86_400_000);
  // Verstreken vóór deze vloer → voorbij de grace → gedempt (`lapsed`); niet meer ophalen.
  const overdueFloor = new Date(now.getTime() - (RENEWAL_OVERDUE_GRACE_DAYS + 1) * 86_400_000);
  const partyWhere = role === "FREELANCER" ? { freelancer: { userId } } : { company: { userId } };

  const collabs = await prisma.collaboration.findMany({
    where: {
      ...partyWhere,
      status: "ACTIVE",
      disputedAt: null,
      endDate: { gte: overdueFloor, lte: windowEnd },
    },
    select: {
      id: true,
      endDate: true,
      job: { select: { title: true } },
      company: { select: { name: true } },
      freelancer: { select: { user: { select: { name: true } } } },
    },
    orderBy: { endDate: "asc" },
    take: MAX,
  });

  const tasks: PendingTask[] = [];
  for (const c of collabs) {
    const renewal = summarizeCollaborationRenewal({
      status: "ACTIVE",
      endDate: c.endDate,
      disputed: false,
      now,
    });
    if (!renewal.attention) continue;
    const counterparty =
      role === "FREELANCER"
        ? (c.company.name ?? "de opdrachtgever")
        : (c.freelancer.user.name ?? "de ZZP'er");
    tasks.push(
      collaborationRenewalTask(
        c.id,
        role,
        counterparty,
        c.job.title,
        renewal.phase,
        renewal.daysRemaining,
      ),
    );
  }
  return tasks;
}

// Request-gecachet (React.cache): de layout (sidebar-badge) en de pagina (dashboard/acties)
// vragen dezelfde tasks op binnen één render; zo wordt het maar één keer berekend.
const computeTasks = cache(async (userId: string, role: string): Promise<PendingTask[]> => {
  if (role === "FREELANCER") return rankTasks(await freelancerTasks(userId));
  if (role === "CLIENT") return rankTasks(await clientTasks(userId));
  // Bemiddelaar: doorlopende tenant-taken (roster-compliance + lead-opvolging). De fallthrough naar
  // de admin-taken blijft uitgesloten — een FRANCHISER ziet nooit platform-brede admin-items.
  if (role === "FRANCHISER") return rankTasks(await franchiserTasks(userId));
  if (role === "ADMIN") return rankTasks(await adminTasks());
  // Fail-closed op een onbekende rol. `adminTasks()` is bewust ongescoopt en geeft platform-brede,
  // gevoelige PII terug (AVG-verwijderverzoeken, disputen, no-show-meldingen, verificatie-inzenders,
  // supporttickets). Een fallthrough-default die "alles wat geen FREELANCER/CLIENT/FRANCHISER is"
  // als admin behandelt, is fail-open: rollen zijn strings (enums-als-strings, architectuurregel 6),
  // dus een bad migration, directe DB-write of een toekomstige 5e rol die deze switch niet bijwerkt
  // zou stil de volledige admin-takenlijst prijsgeven i.p.v. te weigeren. Onbekend → geen taken.
  // OWASP A01 (Broken Access Control — fail-open default). Alleen een expliciete ADMIN ziet adminTasks.
  return [];
});

export async function pendingTasks(actor: Actor): Promise<PendingTask[]> {
  return computeTasks(actor.id, actor.role);
}

/** Aantal openstaande taken — exact wat /acties toont, voor de sidebar-badge. */
export async function pendingTaskCount(userId: string, role: string): Promise<number> {
  return (await computeTasks(userId, role)).length;
}

async function freelancerTasks(userId: string): Promise<PendingTask[]> {
  const tasks: PendingTask[] = [];
  const now = new Date();
  const soon = new Date(now.getTime() + EXPIRY_WINDOW_MS);
  // Alle certificaten (voor de samenwerking-gebonden verval-check verderop) + de generieke
  // verlopende certificaten (uitgesteld: pas emitten zodra we weten welke door een samenwerking
  // worden gedekt, zodat hetzelfde certificaat niet dubbel verschijnt).
  let allCreds: CollabCredentialInput[] = [];
  const expiringCreds: { id: string; title: string }[] = [];
  // Uitgesteld: pas emitten na de collab-gap-check (dedup tegen credentialCollabExpiredTask).
  const expiredNonMandatoryCreds: { id: string; title: string }[] = [];

  const [profile, account, overdue, unread] = await Promise.all([
    // Gedeelde, request-gecachte profiel-load (zie getCompletenessProfile): op het dashboard
    // deelt deze query één render met dashboardData i.p.v. het profiel tweemaal op te halen.
    getCompletenessProfile(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { identityVerifiedAt: true } }),
    overdueInvoiceBreakdown(userId),
    unreadConversations(userId),
  ]);

  if (profile) {
    if (profile.visibility === "PRIVATE") tasks.push(profilePrivateTask());
    if (!account?.identityVerifiedAt) tasks.push(identityVerifyTask());
    const { score, missing } = computeFreelancerCompleteness({
      headline: profile.headline,
      bio: profile.bio,
      hourlyRate: profile.hourlyRate,
      location: profile.location,
      availability: profile.availability as Availability,
      languages: parseLanguages(profile.languages),
      skillCount: profile.skills.length,
      industryCount: profile.industries.length,
    });
    if (score < 100)
      tasks.push(
        profileCompletenessTask(
          score,
          missing.map((m) => m.label),
        ),
      );

    // Proactieve facturatie-gereedheid: zodra de ZZP'er dáádwerkelijk factureert maar zijn profiel een
    // hard facturatie-gegeven mist (btw-id/IBAN), gaat élke uitgaande (auto-)factuur juridisch
    // onvolledig (art. 35a Wet OB) of onbetaalbaar de deur uit. Evidence-based (leunt op de echte
    // uitgeschreven facturen → geen valse KOR-melding); dedupt niet met de per-factuur-compliancekaart
    // (die toetst één bestaande factuur, dit stuurt vooruit op het profiel).
    const billing = await getBillingReadiness({
      userId,
      btwNumber: profile.btwNumber,
      iban: profile.iban,
    });
    if (!billing.ready) tasks.push(billingProfileTask(billing.gaps));

    // Eén query voor álle certificaten: de fix-taken (afgewezen/verloopt) én de verplichte-
    // documentenstatus (VOG/verzekering) worden in-memory afgeleid — zelfde bron als de
    // inzetbaarheidskaart op het dashboard, zodat beide oppervlakken nooit tegenspreken.
    //
    // De query zelf staat nu in de gedeelde, request-gecachte `getCredentialDossier`
    // (user-context.ts) — exact dezelfde set die de /certificaten-nav-badge (signals.ts) gebruikt,
    // zodat badge en lijst per definitie op dezelfde rijen redeneren en de shell het dossier nog maar
    // één keer ophaalt. Dáár staat ook waarom die set ONBEGRENSD is (een cap zou niet-deterministisch
    // zijn én de badge tegenspreken zodra het dossier groter wordt dan de cap; zelfde drift-klasse als
    // #1022). Wat hier telt: `creds` bevat gegarandeerd het VOLLEDIGE dossier, zodat de
    // superseded-detectie hieronder álle nu-geldige VERIFIED-exemplaren van een type ziet.
    const creds = await getCredentialDossier(profile.id);
    allCreds = creds.map((c) => ({
      id: c.id,
      title: c.title,
      type: c.type as CollabCredentialInput["type"],
      status: c.status as CollabCredentialInput["status"],
      expiresAt: c.expiresAt,
    }));
    // Een ouder VERIFIED-certificaat waarvan een nieuwer, nu-geldig exemplaar van hetzelfde type de
    // compliance al draagt, is superseded: het verval ervan is niet meer relevant, dus géén
    // "verloopt binnenkort"-nudge (dat zou een valse melding zijn die nooit nuttig verdwijnt).
    const supersededIds = supersededVerifiedCredentialIds(allCreds, now);
    // Typen die nú al door een geldig VERIFIED-cert gedekt zijn: een reeds-verlopen (of afgewezen)
    // exemplaar van datzelfde type is geen actueel gat → geen verleng-taak. De superseded-check
    // hierboven dekt alleen VERIFIED-maar-overbodige exemplaren; een cert met status EXPIRED valt
    // daar buiten (die is niet VERIFIED), dus de verlopen-tak heeft de bredere type-dekkingsregel
    // nodig — identiek aan de bemiddelaar-zijde (`rosterExpiredByProfile`), zodat beide surfaces
    // niet tegenspreken.
    const coveredTypes = coveredCredentialTypes(allCreds, now);
    for (const c of creds) {
      if (c.status === "REJECTED") tasks.push(credentialFixTask(c.id, c.title, "rejected"));
      else if (
        c.status === "VERIFIED" &&
        c.expiresAt !== null &&
        c.expiresAt > now &&
        c.expiresAt <= soon &&
        !supersededIds.has(c.id)
      )
        // Uitgesteld: kan een samenwerking-gebonden verval-taak worden (dedup verderop).
        expiringCreds.push({ id: c.id, title: c.title });
      else if (
        // Verval-detectie is server-berekend, niet afhankelijk van de batch-flip VERIFIED→EXPIRED:
        // een VERIFIED-cert waarvan `expiresAt` al voorbij is, is feitelijk verlopen (zelfde
        // computed-check als isExpired/computeCompliance/de verplicht-document-verlengkandidaat
        // hieronder) — anders zou het cert tussen de expiry-cron-runs door geen verleng-actie krijgen
        // terwijl het vertrouwensniveau al is gedaald.
        (c.status === "EXPIRED" ||
          (c.status === "VERIFIED" && c.expiresAt !== null && c.expiresAt <= now)) &&
        !MANDATORY_CREDENTIAL_TYPES.includes(
          c.type as (typeof MANDATORY_CREDENTIAL_TYPES)[number],
        ) &&
        // Dekkings-uitsluiting: een verlopen cert waarvan het type al door een nu-geldig VERIFIED-cert
        // wordt gedragen, is geen actueel gat (compliance blijft COMPLIANT) → geen valse verleng-taak.
        !coveredTypes.has(c.type)
      )
        // Uitgesteld: een door een samenwerking vereist verlopen certificaat krijgt hieronder de
        // hogere-band credentialCollabExpiredTask — de expired-fix-taak dedupt daar dan tegen,
        // net zoals expiringCreds dedupten tegen coveredExpiringCredIds.
        expiredNonMandatoryCreds.push({ id: c.id, title: c.title });
    }
    // Ontbrekend/verlopen verplicht document = taak (blokkeert inzetbaarheid). In beoordeling
    // = geen taak: daar is de admin aan zet, niet de ZZP'er.
    const mandatory = mandatoryDocuments(
      creds.map(
        (c): FreelancerCredential => ({
          type: c.type as FreelancerCredential["type"],
          status: c.status as FreelancerCredential["status"],
          expiresAt: c.expiresAt,
        }),
      ),
      now,
    );
    // Een AFGEWEZEN verplicht document (VOG/verzekering) valt in de "missing"-emmer van
    // computeCompliance (het is niet VERIFIED/SUBMITTED/EXPIRED). Het krijgt hierboven al de
    // credentialFixTask ("Afgewezen certificaat opnieuw indienen" → /certificaten/{id}/bewerken) —
    // de enige canonieke actie voor dat type. Zonder onderdrukking zou hetzelfde type een tweede,
    // tegenstrijdige rij opleveren (mandatory-taak → /certificaten/nieuw). Dat geldt niet alleen als
    // het type verder ontbreekt ("missing"), maar óók als er dáárnaast een VERIFIED-maar-verlopen cert
    // van dat type bestaat: dan classificeert computeCompliance het type als "expired" en verscheen de
    // mandatory-taak tóch naast de fix-taak. We onderdrukken de mandatory-taak daarom voor élke
    // niet-satisfied staat (missing én expired) zodra een afgewezen cert van dat type bestaat.
    const rejectedTypes = new Set(creds.filter((c) => c.status === "REJECTED").map((c) => c.type));
    // Voor een verlopen verplicht document deep-linken we naar het VERLENGEN van het bestaande
    // certificaat (bewerk-pagina) i.p.v. een nieuw aanmaken. Kies bij meerdere verlopen exemplaren van
    // een type het meest recent verlopen exemplaar (de logische verleng-kandidaat).
    const expiredCredIdByType = new Map<string, string>();
    for (const c of creds) {
      const expiredNow =
        c.status === "EXPIRED" ||
        (c.status === "VERIFIED" && c.expiresAt !== null && c.expiresAt <= now);
      if (!expiredNow) continue;
      const prevId = expiredCredIdByType.get(c.type);
      if (prevId === undefined) {
        expiredCredIdByType.set(c.type, c.id);
      } else {
        const prev = creds.find((x) => x.id === prevId);
        const prevExp = prev?.expiresAt?.getTime() ?? -Infinity;
        const curExp = c.expiresAt?.getTime() ?? -Infinity;
        if (curExp > prevExp) expiredCredIdByType.set(c.type, c.id);
      }
    }
    for (const doc of mandatory.items) {
      if ((doc.state === "missing" || doc.state === "expired") && rejectedTypes.has(doc.type))
        continue;
      if (doc.state === "missing" || doc.state === "expired")
        tasks.push(
          mandatoryDocumentTask(
            doc.type,
            CREDENTIAL_TYPE_LABEL[doc.type as CredentialType],
            doc.state,
            doc.state === "expired" ? expiredCredIdByType.get(doc.type) : undefined,
          ),
        );
    }

    // Beschikbaarheidsagenda verlopen? Alleen zinvol voor een vindbaar (niet-privé) profiel: een
    // privé-profiel krijgt al de profilePrivateTask en is toch niet vindbaar. Alleen bij een volledig
    // verlopen agenda (nooit gedeeld = onboarding, geen nudge hier).
    if (profile.visibility !== "PRIVATE") {
      const windows = await prisma.availabilityWindow.findMany({
        where: { freelancerProfileId: profile.id },
        select: { startDate: true, endDate: true, type: true },
        take: MAX,
      });
      const freshness = summarizeAvailabilityFreshness(
        windows.map((w) => ({ ...w, type: w.type as AvailabilityWindowType })),
        now,
      );
      if (freshness.status === "expired") tasks.push(availabilityRefreshTask());
    }

    // Onbenutte beschikbaarheid als actie: de open dagen die de ZZP'er als inzetbaar deelde maar
    // waar (nog) geen samenwerking op loopt. Zelfde bron + poort (findIdleCapacity → hasAny) als de
    // /beschikbaarheid-kaart "Onbenutte beschikbaarheid", maar als actiegerichte nudge om ze te
    // vullen via de marktplaats — geen drift met die kaart.
    const idle = await getIdleCapacityForProfile(profile.id, now);
    if (idle.hasAny) tasks.push(idleCapacityTask(idle.totalOpenDays));
  }

  // Overdue-facturen die hier een eigen, specifieke betaal-taak krijgen, worden niet nóg eens
  // als generieke "factuur over de vervaldatum"-rij getoond (zie de residu-aftrek onderaan).
  let surfacedOverdue = 0;

  // Onderteken-taak (PROPOSED) — bewust LOSGEKOPPELD van een gecapt `updatedAt`-venster, exact zoals
  // `rejectedPerfs`/`openInvoices`/`credentialCollabs` (run 76-79). Een eerdere `orderBy: updatedAt desc,
  // take: MAX`-samenwerkings-query voedde deze taak; `Collaboration.updatedAt` is echter een @updatedAt-
  // kolom die ALLEEN bij een directe mutatie op de rij wordt bijgewerkt (tekenen, dispuut, annuleren,
  // auto-afronding). Een PROPOSED-samenwerking staat dus bevroren op het VOORSTEL-moment, en bij >MAX
  // gelijktijdige PROPOSED+ACTIVE-samenwerkingen viel een ouder-voorgestelde samenwerking buiten het
  // venster → de "Onderteken"-taak verdween PERMANENT uit /acties, de badge én de dashboard-rail, terwijl
  // het samenwerkingsdetail 'm nog wél als "aan zet" toonde (het tekenen zelf bumpt het venster niet →
  // niet self-healing). Een status-gefilterde, ongewindowde `PROPOSED`-query (`createdAt asc`, oudste
  // blijft staan) heelt self-healing: een rij verlaat de lijst pas als 'ie niet langer PROPOSED is.
  // Persona-sweep run 81.
  const proposedCollabs = await prisma.collaboration.findMany({
    where: proposedCollabWhere(userId),
    select: {
      id: true,
      job: {
        select: {
          title: true,
          credentialRequirements: { where: { required: true }, select: { credentialType: true } },
        },
      },
      company: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
    take: MAX,
  });
  for (const c of proposedCollabs) {
    // Inzetbaarheid-gate (server-waarheid, contract-commands.ts): tekenen wordt geweigerd zolang
    // een vereist certificaat ontbreekt/verlopen is. De "Onderteken"-taak zou dan een dode knop
    // zijn (signContract gooit, de samenwerking blijft PROPOSED, de taak verdwijnt nooit) en spreekt
    // het samenwerkingsdetail tegen, dat de teken-knop in deze staat al verbergt. De ZZP'er krijgt
    // in plaats daarvan de vernieuw-/aanlever-taak (collaborationExpired/MissingRequiredCredentials
    // hieronder — óók voor PROPOSED via `credentialCollabs`). Persona-sweep run 58.
    const requiredTypes = c.job.credentialRequirements.map(
      (r) => r.credentialType as CredentialType,
    );
    if (!collaborationPlacementBlocked(requiredTypes, allCreds, now)) {
      tasks.push(contractSignTask(c.id, c.job.title, c.company.name));
    }
  }

  // Uren-indienen-taak (ACTIVE zonder ingediende prestatie) — óók losgekoppeld van het `updatedAt`-
  // venster, zelfde outer-window-blindheid als hierboven: het indienen van een prestatie raakt
  // `Collaboration.updatedAt` niet, dus bij >MAX gelijktijdige samenwerkingen viel een ouder-getekende
  // ACTIVE-samenwerking die nog uren moet indienen buiten het venster en verdween de submit-taak
  // permanent (het geld kwam er nooit — alleen een APPROVED-prestatie wordt ooit een factuur). De
  // DB-filter (`performances: none` OF `some DRAFT`) laat alleen samenwerkingen toe die een submit-taak
  // KÚNNEN opleveren het venster vullen; de fase-bepaling (meest recente prestatie DRAFT/geen) spiegelt
  // cascade/stage.ts en houdt de taak weg zodra de laatste prestatie SUBMITTED/APPROVED is. `createdAt
  // asc` → self-healing. Persona-sweep run 81.
  const submitCollabs = await prisma.collaboration.findMany({
    where: submitCollabWhere(userId),
    select: {
      id: true,
      job: { select: { title: true } },
      // Meest recente prestatie eerst: die bepaalt de fase (spiegelt cascade/stage.ts). Nog geen/DRAFT =
      // de ZZP'er moet uren indienen; REJECTED = `rejectedPerfs` (apart); SUBMITTED = de opdrachtgever
      // keurt (geen ZZP'er-taak); APPROVED = de factuur-tak (`openInvoices`) neemt over.
      performances: { select: { status: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "asc" },
    take: MAX,
  });
  for (const c of submitCollabs) {
    const latestPerf = c.performances[0];
    if (!latestPerf || latestPerf.status === "DRAFT") {
      tasks.push(performanceSubmitTask(c.id, c.job.title));
    }
  }

  // Elke AFGEKEURDE prestatie vraagt om correctie + herindiening — óók een prestatie van een vorige
  // cyclus. `createPerformance` gate't alleen op ACTIVE + geen dispuut, dus op één samenwerking kunnen
  // meerdere cycli naast elkaar bestaan en het geld zit muurvast tot de afgekeurde uren opnieuw worden
  // ingediend (alleen een APPROVED-prestatie wordt ooit een factuur). Deze query staat bewust LOS van
  // de `collabs`-relatie hierboven: die haalt de prestaties `desc, take: 5` op (nodig om via
  // performances[0] de fase te bepalen), waardoor een afgekeurde prestatie uit een oude cyclus uit dat
  // venster viel zodra ≥5 nieuwere prestaties bestonden — en dan stil uit /acties, de badge én de
  // dashboard-rail verdween (alleen nog zichtbaar op het samenwerkingsdetail). Een status-gefilterde,
  // ongewindowde query is self-healing: een rij verlaat de lijst pas als 'ie niet langer REJECTED is.
  // Spiegelt de factuur-lus, die óók eerst op status filtert vóór de take-limiet. `performanceResubmit-
  // Task` sleutelt per prestatie-id → dedupe-veilig. Persona-sweep run 76 (positioneel) + 77 (venster).
  const rejectedPerfs = await prisma.performance.findMany({
    where: rejectedPerfWhere(userId),
    select: {
      id: true,
      collaborationId: true,
      collaboration: { select: { job: { select: { title: true } } } },
    },
    orderBy: { createdAt: "asc" },
    take: MAX,
  });
  for (const p of rejectedPerfs) {
    tasks.push(performanceResubmitTask(p.id, p.collaborationId, p.collaboration.job.title));
  }

  // Betaal-/concept-factuur-taken van lopende samenwerkingen — bewust LOSGEKOPPELD van de `collabs`-
  // relatie hierboven, net als `rejectedPerfs`. Die `collabs`-query ordent `updatedAt desc, take: MAX`,
  // maar `Collaboration.updatedAt` is een @updatedAt-kolom die ALLEEN bij een directe mutatie op de
  // samenwerkingsrij wordt bijgewerkt (contract tekenen, dispuut openen/sluiten, annuleren, auto-
  // afronding). Het indienen/goedkeuren van een factuur (of prestatie) raakt de samenwerkingsrij nooit,
  // dus voor een ACTIVE-samenwerking staat `updatedAt` effectief bevroren op het teken-moment: outer-
  // window-blindheid. Bij >MAX gelijktijdige samenwerkingen ordent het venster dan puur op "hoe recent
  // is het contract getekend" — blind voor welke samenwerking openstaand geldwerk heeft. Een ouder-
  // getekende samenwerking die net een APPROVED/OVERDUE-factuur kreeg valt buiten `take: MAX` en —
  // anders dan de inner-window-bugs (run 76/77) — heelt dit NIET vanzelf (de factuur afhandelen bumpt
  // `updatedAt` niet), zodat het geld muurvast blijft. Een status-gefilterde, ongewindowde query scopet
  // direct op de samenwerkings-eigenaar en heelt self-healing. `paymentConfirm/invoiceSubmitTask`
  // sleutelen per factuur-id → dedupe-veilig. Persona-sweep run 78 (outer-window-blindheid).
  const openInvoices = await prisma.invoice.findMany({
    where: openInvoiceWhere(userId),
    select: {
      id: true,
      lifecycleStatus: true,
      createdAt: true,
      collaborationId: true,
      collaboration: { select: { job: { select: { title: true } } } },
    },
    orderBy: { createdAt: "asc" },
    take: MAX,
  });
  for (const inv of openInvoices) {
    // De collaboration-relatie is optioneel op Invoice (legacy-facturen zonder samenwerking); de
    // where-scope garandeert 'm hier, maar de guard houdt de types nauw en slaat een verweesde rij over.
    if (!inv.collaboration || !inv.collaborationId) continue;
    const jobTitle = inv.collaboration.job.title;
    // APPROVED én OVERDUE dragen dezelfde ZZP-actie (betaling markeren), exact zoals cascade/stage.ts.
    if (inv.lifecycleStatus === "APPROVED") {
      tasks.push(paymentConfirmTask(inv.id, inv.collaborationId, jobTitle));
    } else if (inv.lifecycleStatus === "OVERDUE") {
      tasks.push(paymentConfirmTask(inv.id, inv.collaborationId, jobTitle, true));
      surfacedOverdue += 1;
    } else {
      // Verse concept vs. verouderde concept: de leeftijd (hele dagen sinds `createdAt`) laat de
      // taak escaleren zodra 'ie ≥ UNBILLED_AGING_DAYS blijft liggen — zelfde drempel als de
      // dashboard-tegel "Nog te factureren". Bij een afgekeurde factuur telt leeftijd niet.
      const rejected = inv.lifecycleStatus === "REJECTED";
      const agingDays = rejected ? undefined : daysSince(inv.createdAt, now);
      tasks.push(invoiceSubmitTask(inv.id, inv.collaborationId, jobTitle, rejected, agingDays));
    }
  }

  // Samenwerkingen met een VERPLICHT certificaat-vereiste — bewust LOSGEKOPPELD van de `collabs`-
  // relatie hierboven, exact zoals `rejectedPerfs`/`openInvoices` (run 76-78). Die `collabs`-query
  // ordent `updatedAt desc, take: MAX`, maar `Collaboration.updatedAt` volgt certificaat-activiteit
  // niet: een certificaat dat verloopt/wordt afgekeurd/nooit wordt aangeleverd raakt de
  // samenwerkingsrij nooit, dus voor een lopende/voorgestelde samenwerking staat `updatedAt`
  // bevroren op het teken-/voorstel-moment (outer-window-blindheid). Bij >MAX gelijktijdige
  // samenwerkingen viel de ouder-getekende — met net een verlopen/ontbrekend vereist certificaat —
  // buiten `take: MAX`, en dan verdween de compliance-taak (credentialCollabExpiry/Expired/Missing)
  // stil uit /acties, de badge én de dashboard-rail, terwijl het geld/de inzet muurvast zit én de
  // opdrachtgever de spiegel-alert (clientComplianceTask) wél zag — permanent, niet self-healing.
  // Deze query filtert op `credentialRequirements: { some: { required: true } }` (alleen
  // samenwerkingen die überhaupt een compliance-taak kúnnen opleveren vullen het venster) en ordent
  // `createdAt asc` (deterministisch, oudste blijft staan → self-healing). Persona-sweep run 79.
  const credentialCollabs = await prisma.collaboration.findMany({
    where: credentialCollabWhere(userId),
    select: {
      id: true,
      // Einddatum verankert de mid-plaatsing-verval-waarschuwing (spiegel van de opdrachtgever-alert):
      // een vereist certificaat dat ná het venster maar vóór de einddatum lapt, is ook een zorg.
      endDate: true,
      job: {
        select: {
          title: true,
          credentialRequirements: { where: { required: true }, select: { credentialType: true } },
        },
      },
      company: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
    take: MAX,
  });
  const credentialCollabInputs = credentialCollabs.map((c) => ({
    collaborationId: c.id,
    companyName: c.company.name,
    jobTitle: c.job.title,
    placementEnd: c.endDate,
    requiredTypes: c.job.credentialRequirements.map(
      (r) => r.credentialType as CollabCredentialInput["type"],
    ),
  }));

  // Vereist certificaat van een lopende/voorgestelde samenwerking dat binnenkort verloopt: één
  // gerichte, samenwerking-gebonden taak per certificaat (urgenter dan de generieke verval-taak).
  // De gedekte certificaten worden hieronder van de generieke lijst afgetrokken → geen dubbele taak.
  const coveredExpiringCredIds = new Set<string>();
  const collabConcerns = collaborationCredentialExpiryConcerns({
    collaborations: credentialCollabInputs,
    credentials: allCreds,
    now,
  });
  for (const concern of collabConcerns) {
    coveredExpiringCredIds.add(concern.credentialId);
    const [primary, ...rest] = concern.collaborations;
    if (!primary) continue; // collaborations is altijd ≥ 1 (invariant), maar houdt de types nauw
    tasks.push(
      credentialCollabExpiryTask({
        credId: concern.credentialId,
        credentialTitle: concern.credentialTitle,
        daysUntilExpiry: concern.daysUntilExpiry,
        collabId: primary.collaborationId,
        companyName: primary.companyName,
        jobTitle: primary.jobTitle,
        extraCollabCount: rest.length,
        duringPlacementOnly: concern.duringPlacementOnly,
      }),
    );
  }
  // Reeds VERLOPEN én volledig ONTBREKEND vereist certificaat van een lopende/voorgestelde
  // samenwerking: freelancer-spiegel van de opdrachtgever-alert (clientComplianceTask/complianceRipple).
  // Zonder dit zag de opdrachtgever "certificaat verlopen/ontbreekt — vraag om vernieuwing/aanleveren"
  // terwijl de ZZP'er — de enige die kan handelen — niets in zijn actielijst had (asymmetrie, persona-
  // sweep run 56/57). De gedeelde helper past de uitsluitingsfilter toe (verplichte typen → eigen
  // mandatoryDocumentTask; afgewezen typen → eigen credentialFixTask) én is dezelfde bron die de
  // /certificaten-nav-badge (signals.ts) telt → badge kan niet driften van /acties (run 70).
  const { expired: expiredRequired, missing: missingRequired } =
    collaborationRequiredCredentialGaps({
      collaborations: credentialCollabInputs,
      credentials: allCreds,
      mandatoryTypes: MANDATORY_CREDENTIAL_TYPES,
      now,
    });
  for (const concern of expiredRequired) {
    const [primary, ...rest] = concern.collaborations;
    if (!primary) continue; // collaborations is altijd ≥ 1 (invariant), maar houdt de types nauw
    tasks.push(
      credentialCollabExpiredTask({
        credId: concern.credentialId,
        credentialTitle: concern.credentialTitle,
        collabId: primary.collaborationId,
        companyName: primary.companyName,
        jobTitle: primary.jobTitle,
        extraCollabCount: rest.length,
      }),
    );
  }
  // Het volledig ONTBREKEND-gat (geen bruikbaar exemplaar — nooit aangeleverd of alleen een concept)
  // komt uit dezelfde `collaborationRequiredCredentialGaps`-aanroep hierboven (`missingRequired`). De
  // pure functie sluit typen met een geldig/in-beoordeling/verlopen exemplaar al uit → geen overlap
  // met de expiry-/expired-taken.
  for (const concern of missingRequired) {
    const [primary, ...rest] = concern.collaborations;
    if (!primary) continue; // collaborations is altijd ≥ 1 (invariant), maar houdt de types nauw
    tasks.push(
      credentialCollabMissingTask({
        type: concern.type,
        draftCredentialId: concern.draftCredentialId,
        collabId: primary.collaborationId,
        companyName: primary.companyName,
        jobTitle: primary.jobTitle,
        extraCollabCount: rest.length,
      }),
    );
  }

  // Verlopen niet-verplichte certificaten: dedup tegen de collab-gedekte set — een cert dat al een
  // credentialCollabExpiredTask kreeg (hogere band, samenwerking-context) moet geen tweede,
  // lagere-band credentialFixTask opleveren naar hetzelfde /certificaten/{id}/bewerken.
  const coveredExpiredCredIds = new Set(expiredRequired.map((c) => c.credentialId));
  for (const ec of expiredNonMandatoryCreds) {
    if (coveredExpiredCredIds.has(ec.id)) continue;
    tasks.push(credentialFixTask(ec.id, ec.title, "expired"));
  }

  // Generieke "certificaat verloopt binnenkort"-taken voor de certificaten die géén lopende
  // samenwerking dekt (anders zou hetzelfde certificaat dubbel verschijnen).
  for (const ec of expiringCreds) {
    if (coveredExpiringCredIds.has(ec.id)) continue;
    tasks.push(credentialFixTask(ec.id, ec.title, "expiring"));
  }

  for (const u of unread) tasks.push(messageReplyTask(u.id, u.withWhom, u.subject));
  // Alleen de overdue-facturen die géén eigen betaal-taak kregen (bv. op een samenwerking voorbij
  // de `take: MAX`-grens) verschijnen nog als generieke roll-up — anders zag de ZZP'er dezelfde
  // factuur dubbel (specifieke betaal-taak + generieke rij). Disputen tellen niet mee: ze zijn uit
  // `overdueInvoiceCount` gefilterd (bevroren werkproces), consistent met de disputed-uitsluiting
  // van de collabs-query hierboven.
  // Splits het residu op actie: cascade-facturen (waar de ZZP'er zélf de betaling markeert) krijgen de
  // "markeer de betaling"-instructie, legacy-facturen (waar de opdrachtgever aan zet is) de "volg op"-
  // instructie. Zonder deze splitsing kreeg een residu van cascade-facturen ten onrechte de "volg op bij
  // de opdrachtgever"-subtitel — een misleidende instructie (de opdrachtgever betaalt daar rechtstreeks
  // en heeft geen betaalknop). Alleen cascade-facturen worden hierboven met een eigen taak "surfaced";
  // legacy-facturen komen nooit uit de collabs-loop, dus die vallen volledig in het residu.
  const residualCascadeOverdue = Math.max(0, overdue.cascade - surfacedOverdue);
  if (residualCascadeOverdue > 0)
    tasks.push(overdueInvoiceTask(residualCascadeOverdue, "FREELANCER", "confirm"));
  if (overdue.legacy > 0) tasks.push(overdueInvoiceTask(overdue.legacy, "FREELANCER", "chase"));

  // No-show-stand (productbesluit 12-6-2026): ongegronde no-shows zijn blijvende historie (het
  // oordeel is een adminbeslissing) — er is geen ZZP-actie die dit "afhandelt". Daarom géén
  // openstaande next-action hier (die zou nooit verdwijnen en botst met "afgehandelde acties
  // verdwijnen vanzelf"); het dashboard toont de stand als passief historie-signaal
  // (`noShowStandingNotice`).

  // BTW-aangifte-deadline: elk onafgewikkeld kwartaal moet uiterlijk op de indieningsdatum aangegeven
  // zijn. Alleen wanneer die deadline nadert/verstreken is én er een saldo te melden is (harde
  // fiscale deadline; anders leeft dit signaal alleen in het boekhoudpaneel). Scant meerdere kwartalen
  // terug zodat een overgeslagen kwartaal niet stil verdwijnt bij de rollover (één taak per kwartaal).
  for (const vatDeadline of await getVatDeadlinesForActor(userId, "FREELANCER", now)) {
    tasks.push(vatDeadlineTask(vatDeadline));
  }

  // Aangifte-inkomstenbelasting-deadline: de jaarlijkse aangifte (uiterlijk 1 mei) is dé grote
  // administratie-deadline. Alleen surfacen wanneer hij nadert (binnen INCOME_TAX_DEADLINE_SOON_DAYS)
  // én er in dat belastingjaar omzet is geboekt — buiten dat venster leeft het signaal in de agenda-feed
  // en het ontzorg-overzicht. Forward-looking (nooit "te laat"): geen "ingediend"-vlag in het systeem.
  const incomeTaxDeadline = await getIncomeTaxDeadlineForActor(userId, "FREELANCER", now);
  if (incomeTaxDeadline && incomeTaxDeadlineNeedsAction(incomeTaxDeadline)) {
    tasks.push(incomeTaxDeadlineTask(incomeTaxDeadline));
  }

  // Urencriterium (1.225 uur → zelfstandigenaftrek): het passieve standssignaal staat al op /inzicht,
  // maar ontbrak als next-action. Alleen surfacen wanneer bijsturen zin heeft én realistisch is (seizoen
  // H2/Q4, activiteit, niet-op-koers, nog haalbaar — zie hoursCriterionNeedsAction). getHoursCriterionSummary
  // geeft null zonder de IB_VOORBEREIDING-entitlement, dus de taak verschijnt alleen voor wie het instrument heeft.
  const hoursCriterion = await getHoursCriterionSummary(userId, now);
  if (hoursCriterion && hoursCriterionNeedsAction(hoursCriterion, now)) {
    tasks.push(hoursCriterionTask(hoursCriterion));
  }

  // Afgeronde samenwerkingen die nog beoordeeld kunnen worden (blind venster open) — reputatie-nudge.
  tasks.push(...(await reviewLeaveTasks(userId, "FREELANCER", now)));

  // Lopende samenwerkingen die hun einddatum naderen/passeerden — plan tijdig een vervolg.
  tasks.push(...(await renewalTasks(userId, "FREELANCER", now)));

  // Directe uitnodigingen die nog op een reactie wachten — de hoogst-intente inbound lead.
  if (profile) tasks.push(...(await invitationTasks(profile.id, now)));

  return tasks;
}

/**
 * Directe uitnodigingen (`JOB_INVITED`) waarop de ZZP'er nog niet reageerde, als next-action. Leunt op
 * de bestaande, begrensde en eigenaar-gescopete `getReceivedInvitations`-datalaag (dezelfde bron als de
 * "Uitgenodigd"-band op `/opdrachten`) — één plek die bepaalt wat een open uitnodiging is (gepubliceerd,
 * niet-beantwoord, gededupt). De strakke `MAX_RECEIVED_INVITATIONS`-band-cap (=6) is puur UI om de
 * find-work-pagina rustig te houden; de action-engine mag níét stil op 6 afkappen (dan zou een ZZP'er
 * met 7+ open uitnodigingen een te lage badge-telling zien). Daarom geven we — net als elke andere
 * begrensde bron hier — de harde bovengrens `MAX` mee. Zonder deze taak leefde de uitnodiging alléén op
 * de find-work-pagina; nu ook op /acties, de zijbalk-badge en de dashboard-rail. Deep-link naar de
 * opdracht waar de reactie-flow staat — geen dubbele UI.
 */
async function invitationTasks(freelancerProfileId: string, now: Date): Promise<PendingTask[]> {
  const invitations = await getReceivedInvitations(freelancerProfileId, now, MAX);
  return invitations.map((inv) =>
    respondInvitationTask(
      inv.jobId,
      inv.jobTitle,
      inv.companyName,
      invitationAgeDays(inv.invitedAt, now),
    ),
  );
}

async function clientTasks(userId: string): Promise<PendingTask[]> {
  const tasks: PendingTask[] = [];

  // Reeds-bekeken kandidaten die al langer dan gebruikelijk op een beslissing wachten. DB-side
  // voorgefilterd op de kortste drempel (VIEWED = 14 dagen) zodat alleen echt-oude reacties terugkomen;
  // de pure `summarizeStaleClientApplications` past daarna de exacte per-fase-regel toe (VIEWED ≥ 14 /
  // SHORTLIST ≥ 21). NEW valt hier bewust buiten — dat dekt `applicationsReviewTask` al.
  const staleWindow = new Date(Date.now() - WAIT_ATTENTION_DAYS.VIEWED * 86_400_000);
  // Onbekeken NEW-reacties die de ghosting-risicodrempel bereikten (nog geen eerste blik). DB-side
  // voorgefilterd op exact dezelfde grens (`CANDIDATE_GHOSTING_RISK_DAYS`) die de trechter op /inzicht
  // gebruikt; de pure `summarizeFirstLookOverdue` past daarna de floor-regel toe (één bron, geen drift).
  const firstLookWindow = new Date(Date.now() - CANDIDATE_GHOSTING_RISK_DAYS * 86_400_000);
  // job.status: "PUBLISHED" — kandidaat-beoordeeltaken horen alleen bij een LIVE opdracht. Sluit de
  // opdrachtgever de opdracht (PUBLISHED→CLOSED, `changeJobStatus`) of zet hem terug naar concept
  // (PUBLISHED→DRAFT), dan blijven de open reacties (NEW/VIEWED/SHORTLIST) in de DB staan — het sluiten
  // stuurt ze alleen een notificatie, transitioneert ze niet. Zonder deze poort bleef "beoordeel de
  // kandidaten" eeuwig hangen op een gesloten/concept-opdracht, in tegenspraak met de server-side
  // status (en met de "de opdracht is weg"-melding die die kandidaten al kregen). Spiegelt de
  // PUBLISHED-scoping van de opdracht-nudges (`getClientColdJobs`/`getClientOverdueJobs`).
  const firstLookWhere = {
    job: { company: { userId }, status: "PUBLISHED" as const },
    status: "NEW" as const,
    createdAt: { lte: firstLookWindow },
  };

  const [
    company,
    overdue,
    dueSoon,
    unread,
    newApplications,
    agingNewCount,
    agingNewApplications,
    draftJobList,
    staleCandidates,
    acceptedCandidates,
    complianceAlerts,
    cascadeOverduePayments,
  ] = await Promise.all([
    prisma.company.findUnique({
      where: { userId },
      select: {
        description: true,
        location: true,
        website: true,
        industryId: true,
        logoKey: true,
      },
    }),
    overdueInvoiceCount("CLIENT", userId),
    paymentDueSoonCount(userId),
    unreadConversations(userId),
    prisma.application.count({
      where: { job: { company: { userId }, status: "PUBLISHED" }, status: "NEW" },
    }),
    // Exacte telling van de onbekeken-oude reacties (ongebonden) — de bron voor de residu-aftrek en de
    // getoonde count, zodat een client met >MAX oude reacties er nooit een deel als "vers" ziet weglekken.
    prisma.application.count({ where: firstLookWhere }),
    // Alleen voor de leeftijd van de oudst-wachtende reactie: oplopend gesorteerd, dus de oudste rij zit
    // altijd in de eerste MAX. unbounded-allow: eigenaar-scoped (job.company.userId) + take-limiet.
    prisma.application.findMany({
      where: firstLookWhere,
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
      take: MAX,
    }),
    // Concept-opdrachten (met updatedAt-klok) voor de leeftijd-bewuste concept-nudge — de loader is
    // eigenaar-gescoped + begrensd; `summarizeDraftJobAging` splitst stil vs. vers hieronder.
    getClientDraftJobs(userId),
    // unbounded-allow: eigenaar-scoped (job.company.userId) + take-limiet
    prisma.application.findMany({
      where: {
        // Zie `firstLookWhere`: alleen LIVE opdrachten — een reeds-bekeken kandidaat op een gesloten/
        // concept-opdracht is geen openstaande beslissing meer.
        job: { company: { userId }, status: "PUBLISHED" },
        status: { in: ["VIEWED", "SHORTLIST"] },
        createdAt: { lte: staleWindow },
      },
      select: { status: true, createdAt: true, collaboration: { select: { id: true } } },
      orderBy: { createdAt: "asc" },
      take: MAX,
    }),
    // Geaccepteerde reacties die nog op een samenwerkingsvoorstel wachten. De opdrachtgever accepteert
    // (ACCEPTED) maar moet daarna nog `proposeCollaboration` doen; tot dan is er geen collaboration en
    // wacht de ZZP'er. Oudst-eerst zodat de langst-wachtende kandidaat bovenaan de taken komt; de pure
    // `pendingCollaborationProposals` filtert defensief de reeds-voorgestelde eruit.
    // BEWUST géén `job.status: "PUBLISHED"`-poort (anders dan de beoordeeltaken hierboven): een
    // ACCEPTED-reactie is een gemaakte hire-toezegging die het sluiten van de opdracht overleeft
    // (ACCEPTED valt buiten `OPEN_APPLICATION_STATUSES`, dus die kandidaat kreeg géén "de opdracht is
    // weg"-melding). Sluit de opdrachtgever de listing na acceptatie, dan blijft het voorstel
    // legitiem verschuldigd — die taak verbergen zou echt werk laten verdwijnen.
    // unbounded-allow: eigenaar-scoped (job.company.userId) + take-limiet
    prisma.application.findMany({
      where: { job: { company: { userId } }, status: "ACCEPTED" },
      select: {
        id: true,
        // Reproposability-velden: onderscheid een blokkerende collaboration van een geannuleerd,
        // nog-nooit-ondertekend voorstel dat opnieuw verstuurd mag worden (collaboration-reproposal.ts).
        collaboration: {
          select: {
            status: true,
            contractStatus: true,
            agreementClientSignedAt: true,
            agreementFreelancerSignedAt: true,
            completedAt: true,
            cancelledAt: true,
            _count: { select: { invoices: true, performances: true } },
          },
        },
        job: { select: { title: true } },
        freelancer: { select: { user: { select: { name: true } } } },
        // `acceptedAt` = de klok voor "wacht op een samenwerkingsvoorstel". Legacy-rijen (geaccepteerd
        // vóór dit veld bestond) hebben `null` → val terug op `updatedAt` (voor een ACCEPTED-reactie
        // zonder collaboration is de acceptatie doorgaans de laatste mutatie, dus een goede benadering).
        acceptedAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "asc" },
      take: MAX,
    }),
    // Compliance-ripple: lopende samenwerkingen waarvan de ZZP'er een vereist certificaat
    // mist/verlopen/binnenkort-verlopend heeft. Hergebruikt de geteste, eigenaar-gescoopte loader
    // (company → ACTIVE-collabs met vereiste certificaten + ZZP-certificaten, take-begrensd).
    clientCredentialAlerts(userId),
    // Cascade-facturen die OVER de vervaldatum staan waarvan deze opdrachtgever de betalende partij is
    // (counterpartyUserId). In de cascade betaalt de opdrachtgever rechtstreeks; wordt de factuur OVERDUE
    // dan zag hij tot nu toe niets (de generieke overdue-roll-up sluit cascade uit, want geen betaalknop).
    // Bevroren (dispuut) samenwerkingen uitgesloten — symmetrisch met de andere cascade-tellingen.
    // Index-backed via @@index([counterpartyUserId, lifecycleStatus]).
    // unbounded-allow: eigenaar-scoped (counterpartyUserId) + take-limiet
    prisma.invoice.findMany({
      where: {
        counterpartyUserId: userId,
        lifecycleStatus: "OVERDUE",
        collaboration: { disputedAt: null },
      },
      select: {
        id: true,
        collaboration: {
          select: {
            id: true,
            job: { select: { title: true } },
            freelancer: { select: { user: { select: { name: true } } } },
          },
        },
      },
      // Deterministisch ordenen bij de take-limiet: Prisma garandeert geen rijvolgorde zonder orderBy,
      // dus bij >MAX gelijktijdige cascade-overdue-facturen zou wisselen wélke MAX het venster vullen —
      // de betaal-nudge flikkert dan tussen requests (verschijnt/verdwijnt), tegen de badge-telling in.
      // `createdAt asc` (oudste blijft staan → self-healing) volgt de conventie van de andere gewindowde
      // queries in dit bestand (openInvoices, credentialCollabs).
      orderBy: { createdAt: "asc" },
      take: MAX,
    }),
  ]);

  // Compliance-taken bovenaan: het zwaarst-wegende opdrachtgever-signaal (lopend werk met een
  // certificaat-gat). Eén taak per samenwerking; de rangschikking (P.complianceRipple/expiring)
  // regelt rankTasks. Sluit gemiste/verlopen (gap) vóór binnenkort-verlopend (warning).
  // `clientHasComplianceAction`-gate: een melding die enkel `inReview` (verse SUBMITTED-indiening)
  // is, geeft de opdrachtgever géén taak — de ADMIN verifieert, de opdrachtgever kan niets doen en
  // de taak zou nooit verdwijnen (niet-afhandelbare badge-inflatie + tegenstrijdige vervalsubtitel).
  for (const a of complianceAlerts)
    if (clientHasComplianceAction(a.alert))
      tasks.push(clientComplianceTask(a.collaborationId, a.freelancerName, a.jobTitle, a.alert));

  if (company) {
    const { score, missing } = computeCompanyCompleteness({
      description: company.description,
      location: company.location,
      website: company.website,
      hasIndustry: !!company.industryId,
      hasLogo: !!company.logoKey,
    });
    if (score < 100)
      tasks.push(
        companyCompletenessTask(
          score,
          missing.map((m) => m.label),
        ),
      );
  }

  // Onderteken-taak (PROPOSED, opdrachtgever-zijde) — spiegelt de ZZP'er-fix: losgekoppeld van het
  // `updatedAt`-venster (outer-window-blindheid, zie de ZZP'er-doc-comment). Bij >MAX gelijktijdige
  // PROPOSED+ACTIVE-samenwerkingen viel een ouder-voorgestelde samenwerking buiten het gecapte venster en
  // verdween de teken-taak permanent bij de opdrachtgever. Status-gefilterde, ongewindowde `PROPOSED`-
  // query (`createdAt asc`) → self-healing. De te-keuren prestaties/facturen (SUBMITTED) komen apart en
  // ONGEWINDOWD uit `approvePerformances`/`approveInvoices` verderop. Persona-sweep run 81.
  const proposedCollabs = await prisma.collaboration.findMany({
    where: { company: { userId }, status: "PROPOSED", disputedAt: null },
    select: {
      id: true,
      job: {
        select: {
          title: true,
          credentialRequirements: { where: { required: true }, select: { credentialType: true } },
        },
      },
      freelancer: {
        select: {
          user: { select: { name: true } },
          credentials: { select: { type: true, status: true, expiresAt: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: MAX,
  });
  for (const c of proposedCollabs) {
    const name = c.freelancer.user.name ?? "ZZP'er";
    // Onderdruk de "Onderteken"-taak zolang de plaatsing door een certificaat-gat geblokkeerd is:
    // signContract weigert dan (server-waarheid), dus de knop kan nooit slagen én de opdrachtgever
    // is niet de partij die het gat kan dichten (alleen de ZZP'er levert het bewijsstuk aan). Zonder
    // deze gate zag de opdrachtgever op /acties/dashboard/badge een dode teken-knop, terwijl het
    // samenwerkingsdetail hem in deze staat al geen knop toont. Persona-sweep run 58.
    const requiredTypes = c.job.credentialRequirements.map(
      (r) => r.credentialType as CredentialType,
    );
    const creds: FreelancerCredential[] = c.freelancer.credentials.map((cr) => ({
      type: cr.type as CredentialType,
      status: cr.status as FreelancerCredential["status"],
      expiresAt: cr.expiresAt,
    }));
    if (!collaborationPlacementBlocked(requiredTypes, creds)) {
      tasks.push(contractSignTask(c.id, c.job.title, name));
    }
  }

  // Te-keuren prestaties/facturen van lopende samenwerkingen — bewust LOSGEKOPPELD van de `collabs`-
  // relatie hierboven. Die query ordent `updatedAt desc, take: MAX`, maar `Collaboration.updatedAt` is
  // een @updatedAt-kolom die ALLEEN bij een directe mutatie op de samenwerkingsrij wordt bijgewerkt
  // (contract tekenen, dispuut openen/sluiten, annuleren, auto-afronding). Het indienen van een prestatie
  // of factuur raakt de samenwerkingsrij nooit, dus voor een ACTIVE-samenwerking staat `updatedAt`
  // effectief bevroren op het teken-moment: outer-window-blindheid. Bij >MAX gelijktijdige samenwerkingen
  // ordent het venster puur op "hoe recent is het contract getekend" — blind voor welke samenwerking een
  // te-keuren indiening heeft. Een ouder-getekende samenwerking die net een SUBMITTED-prestatie/-factuur
  // kreeg valt buiten `take: MAX` en — anders dan de inner-window-bugs (run 77) — heelt dit NIET vanzelf
  // (het keuren bumpt `updatedAt` niet), zodat de goedkeuring muurvast blijft. Status-gefilterde,
  // ongewindowde queries scopen direct op de samenwerkings-eigenaar en helen self-healing.
  // `performanceApprove/invoiceApproveTask` sleutelen per id → dedupe-veilig. Persona-sweep run 78.
  const approvePerformances = await prisma.performance.findMany({
    where: {
      status: "SUBMITTED",
      collaboration: { company: { userId }, status: "ACTIVE", disputedAt: null },
    },
    select: {
      id: true,
      collaborationId: true,
      collaboration: {
        select: {
          job: { select: { title: true } },
          freelancer: { select: { user: { select: { name: true } } } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: MAX,
  });
  for (const p of approvePerformances) {
    const name = p.collaboration.freelancer.user.name ?? "ZZP'er";
    tasks.push(performanceApproveTask(p.id, p.collaborationId, p.collaboration.job.title, name));
  }

  const approveInvoices = await prisma.invoice.findMany({
    where: {
      lifecycleStatus: "SUBMITTED",
      counterpartyUserId: userId,
      collaboration: { company: { userId }, status: "ACTIVE", disputedAt: null },
    },
    select: {
      id: true,
      collaborationId: true,
      collaboration: { select: { job: { select: { title: true } } } },
    },
    orderBy: { createdAt: "asc" },
    take: MAX,
  });
  for (const inv of approveInvoices) {
    // De collaboration-relatie is optioneel op Invoice; de where-scope garandeert 'm, de guard houdt de
    // types nauw en slaat een eventuele verweesde rij over.
    if (!inv.collaboration || !inv.collaborationId) continue;
    tasks.push(invoiceApproveTask(inv.id, inv.collaborationId, inv.collaboration.job.title));
  }

  for (const u of unread) tasks.push(messageReplyTask(u.id, u.withWhom, u.subject));
  if (overdue > 0) tasks.push(overdueInvoiceTask(overdue, "CLIENT"));
  // Cascade-facturen over de vervaldatum: de opdrachtgever betaalt out-of-band (geen betaalknop), maar
  // moet weten dát er een openstaande betaling is — betaal 'm of laat de ZZP'er de betaling bevestigen.
  // Verdwijnt zodra de ZZP'er de betaling registreert (→ PAID). Deep-link naar het samenwerkingsdetail.
  for (const inv of cascadeOverduePayments) {
    const col = inv.collaboration;
    if (!col) continue;
    tasks.push(
      clientCascadeOverduePaymentTask(
        inv.id,
        col.id,
        col.job.title,
        col.freelancer.user.name ?? "de ZZP'er",
      ),
    );
  }
  // Pre-due: facturen die binnenkort vervallen (nog niet te laat) — betaal op tijd. Vensters van
  // overdue (< now) en due-soon (>= now) raken elkaar niet, dus geen dubbele next-action.
  if (dueSoon > 0) tasks.push(paymentDueSoonTask(dueSoon));
  // Onbekeken NEW-reacties voorbij de ghosting-drempel krijgen een eigen, urgentere eerste-reactie-taak;
  // trek ze af van de generieke "nieuwe reacties"-telling zodat dezelfde kandidaat niet in beide taken
  // verschijnt (residu-aftrek, symmetrisch met de overdue-factuur-roll-up). Verse NEW-reacties (< drempel)
  // blijven de leeftijdloze "nieuwe reacties"-nudge voeden. De getoonde count + de aftrek leunen op de
  // EXACTE `agingNewCount` (niet de MAX-gecapte findMany); die findMany levert enkel de oudste-leeftijd.
  const oldestFirstLook = summarizeFirstLookOverdue(agingNewApplications);
  if (agingNewCount > 0 && oldestFirstLook)
    tasks.push(
      firstLookOverdueTask({ count: agingNewCount, oldestDays: oldestFirstLook.oldestDays }),
    );
  const freshApplications = Math.max(0, newApplications - agingNewCount);
  if (freshApplications > 0) tasks.push(applicationsReviewTask(freshApplications));
  // Geaccepteerd-maar-nog-niet-voorgesteld: rond de hire af met een samenwerkingsvoorstel.
  for (const p of pendingCollaborationProposals(
    acceptedCandidates.map((a) => {
      const state = a.collaboration
        ? {
            status: a.collaboration.status,
            contractStatus: a.collaboration.contractStatus,
            agreementClientSignedAt: a.collaboration.agreementClientSignedAt,
            agreementFreelancerSignedAt: a.collaboration.agreementFreelancerSignedAt,
            completedAt: a.collaboration.completedAt,
            invoicesCount: a.collaboration._count?.invoices ?? 0,
            performancesCount: a.collaboration._count?.performances ?? 0,
          }
        : null;
      return {
        applicationId: a.id,
        freelancerName: a.freelancer.user.name ?? "ZZP'er",
        jobTitle: a.job.title,
        // Een geannuleerd, nooit-ondertekend voorstel blokkeert niet → de propose-taak resurfacet.
        hasCollaboration: collaborationBlocksProposal(state),
        // Er ís een collaboration maar die blokkeert niet → een herbruikbaar geannuleerd voorstel.
        reproposal: state != null && !collaborationBlocksProposal(state),
        // Voor een re-voorstel loopt de leeftijd-klok vanaf het annuleringsmoment.
        reproposalSince: a.collaboration?.cancelledAt ?? null,
        // Fallback op updatedAt voor legacy-rijen zonder acceptedAt — nooit een null-klok.
        acceptedAt: a.acceptedAt ?? a.updatedAt,
      };
    }),
    new Date(),
  ))
    tasks.push(
      proposeCollaborationTask(
        p.applicationId,
        p.jobTitle,
        p.freelancerName,
        p.agingDays,
        p.reproposal,
      ),
    );
  const staleApplications = summarizeStaleClientApplications(
    staleCandidates.map((a) => ({
      status: a.status,
      createdAt: a.createdAt,
      hasCollaboration: a.collaboration != null,
    })),
  );
  if (staleApplications) tasks.push(staleApplicationsTask(staleApplications));
  // Concept-opdrachten leeftijd-bewust: een lang stilstaand concept (≥14 dagen) krijgt een eigen,
  // deep-linkte nudge; verse concepten blijven samen de rustige aggregaat-telling. Zo verdwijnt een
  // vergeten, half-afgemaakte vacature niet meer in een platte telling.
  const draftAging = summarizeDraftJobAging(draftJobList, new Date());
  for (const stale of draftAging.stale) {
    tasks.push(staleDraftJobTask(stale.jobId, stale.title, stale.ageDays));
  }
  if (draftAging.freshCount > 0) tasks.push(draftJobsTask(draftAging.freshCount));

  // Overdue-onbezette opdrachten (startdatum verstreken, nog niemand vastgelegd) — het verstreken-
  // planning-deadline-signaal dat al op het opdracht-detail (`JobStaffingRiskCard`) en de lijstbadge
  // stond, nu ook als next-action. Gedeelde `summarizeStaffingRisk` → identiek aan het detailscherm.
  // Vóór de koud-tak berekend zodat die zijn opdrachten kan ontdubbelen (zie hieronder).
  const overdueJobs = await getClientOverdueJobs(userId, new Date());
  for (const overdue of overdueJobs) {
    tasks.push(
      jobStaffingOverdueTask(overdue.jobId, overdue.title, overdue.daysUntilStart, overdue.action),
    );
  }
  const overdueJobIds = new Set(overdueJobs.map((o) => o.jobId));

  // Koud-lopende gepubliceerde opdrachten (geen/weinig kandidaten) — het vacaturetempo-signaal dat tot
  // nu toe alleen op de opdracht-lijst/-detail + als achtergrondnotificatie stond, nu ook als
  // next-action. Gedeelde `getClientColdJobs` → identiek aan de /opdrachten-nav-badge (geen drift).
  // Ontdubbeling: een opdracht die al als overdue-onbezet is gesignaleerd, tonen we níét óók als koud.
  // De verstreken-planning-taak (P=51) is het urgentere, dominante signaal voor dezelfde opdracht/partij
  // en subsumeert de zachtere "weinig respons"-nudge (P=44); beide tonen zou dezelfde deep-link twee keer
  // geven en de badge (`pendingTaskCount`) opblazen. Spiegelt de acute/stale-dienst-ontdubbeling (bemiddelaar).
  for (const cold of await getClientColdJobs(userId, new Date())) {
    if (overdueJobIds.has(cold.jobId)) continue;
    tasks.push(jobNeedsAttentionTask(cold.jobId, cold.title, cold.headline));
  }

  // Bewust GEEN BTW-aangifte-taak voor de opdrachtgever (die staat alleen in `freelancerTasks`).
  // Een zorginstelling is meestal btw-vrijgesteld (art. 11 lid 1 sub c/g Wet OB) en laat haar
  // aangifte hoe dan ook door een accountant doen — het platform-grootboek is voor haar een
  // registratie van inkoop, geen aangifteplicht die wij kunnen overzien. Een deadline-taak op onze
  // deelverzameling van haar administratie was daardoor structureel onjuist: hij toont een saldo dat
  // niet haar aangifte is, en hij is niet afvinkbaar. Wél weggehaald, niet stilgezet: de
  // BTW-overzichten op /financien blijven bestaan voor wie ze wil zien. Scheelt bovendien één query
  // per shell-render voor elke opdrachtgever (zie query-budget.test.ts).

  // Afgeronde samenwerkingen die nog beoordeeld kunnen worden (blind venster open) — reputatie-nudge.
  tasks.push(...(await reviewLeaveTasks(userId, "CLIENT", new Date())));

  // Lopende samenwerkingen die hun einddatum naderen/passeerden — plan tijdig een vervolg.
  tasks.push(...(await renewalTasks(userId, "CLIENT", new Date())));

  return tasks;
}

async function franchiserTasks(userId: string): Promise<PendingTask[]> {
  // Gedeelde, request-gecachte tenant-lookup (user-context.ts): de bemiddelaar-badges (signals.ts)
  // beginnen met exact dezelfde query in dezelfde render.
  const tenantId = await getUserTenantId(userId);
  if (!tenantId) return [];

  const tasks: PendingTask[] = [];
  const now = new Date();
  const soon = new Date(now.getTime() + EXPIRY_WINDOW_MS);

  const staleThreshold = new Date(now.getTime() - STALE_DIENST_DAYS * 86_400_000);

  const [
    expiringRosterCreds,
    expiredRosterCreds,
    dueLeads,
    openDiensten,
    roster,
    staleDiensten,
    companies,
    freelancers,
    publishedDiensten,
    companiesWithoutDiensten,
    openHandoffs,
    endingCollabs,
    reengageCompanies,
    reengagePublishedJobs,
    reengageCollabActivity,
  ] = await Promise.all([
    // De in-venster (now, soon] verlopende VERIFIED-certs van tenant-ZZP'ers — de kandidaat-nudges.
    // Alleen op dit venster filteren (niet álle certs) is bewust: onbeperkt-geldige certs
    // (`expiresAt = null`, in de zorg gangbaar bij BIG-registraties) vallen buiten `gte/lte` en
    // consumeren dus géén MAX-slot. Zo kan een grote roster met veel onbeperkt-geldige certs geen
    // echte verloop-taak verdringen. De superseded-check (dekkend cert van hetzelfde type) gebeurt
    // hierna op een aparte, op de kandidaat-profielen gescopete query.
    prisma.credential.findMany({
      where: {
        freelancerProfile: { tenantId },
        status: "VERIFIED",
        expiresAt: { gte: now, lte: soon },
      },
      select: {
        freelancerProfileId: true,
        freelancerProfile: { select: { user: { select: { name: true } } } },
      },
      orderBy: { expiresAt: "asc" },
      take: MAX,
    }),
    // De REEDS verlopen, NIET-verplichte VERIFIED/EXPIRED-certs van tenant-ZZP'ers — de tegenhanger
    // van `expiringRosterCreds`, zodat het compliance-signaal niet verdwijnt zodra een cert de
    // vervaldatum passeert (persona-sweep: de "verloopt binnenkort"-taak viel weg juist toen de gap
    // actief werd). Verval is server-berekend: `status = EXPIRED` (batch-geflipt) óf een VERIFIED-cert
    // waarvan `expiresAt < now` (computed, tussen de expiry-cron-runs door). Verplichte typen
    // (VOG/verzekering) blijven buiten scope: die dekt de engageability-tak al. Alleen kandidaat-
    // profielen selecteren; de dekkende (nu-geldige) certs volgen hierna op een gescopete query.
    prisma.credential.findMany({
      where: {
        freelancerProfile: { tenantId },
        type: { notIn: [...MANDATORY_CREDENTIAL_TYPES] },
        OR: [{ status: "EXPIRED" }, { status: "VERIFIED", expiresAt: { lt: now } }],
      },
      select: {
        freelancerProfileId: true,
        freelancerProfile: { select: { user: { select: { name: true } } } },
      },
      orderBy: { expiresAt: "asc" },
      take: MAX,
    }),
    // Leads met een verstreken geplande opvolgdatum (alleen lopende acquisitie: KOUD/WARM).
    // Dagniveau-grens (`< startOfUtcDay`) — identiek aan de nav-badge (`overdueLeads`, signals.ts)
    // en aan de "— te laat"-markering op /franchise/leads. Een timestamp-grens (`lte: now`) telde
    // een lead die eerder vandaag verviel al als taak in /acties, terwijl de badge én de leadpagina
    // 'm pas ná middernacht "te laat" noemen — één bron van waarheid (DOEL 1b, drie surfaces gelijk).
    prisma.lead.count({
      where: {
        tenantId,
        status: { in: ["KOUD", "WARM"] },
        nextFollowUp: { not: null, lt: startOfUtcDay(now) },
      },
    }),
    // Open (gepubliceerde, ONGEVULDE) tenant-diensten + startdatum, voor de acute-onbezet-taak. Zelfde
    // bron/definitie als de "Wat dreigt onbezet"-kaart op /franchise/diensten. De `collaborations:none`-
    // scope is essentieel: zonder die filter tellen óók gevulde diensten mee in de `take: MAX`-slice, en
    // omdat null-start diensten door `nulls:"first"` vooraan sorteren kan een tenant met ≥MAX gevulde,
    // start-loze diensten een écht acute (ongevulde) dienst uit de slice duwen → die verschijnt dan niet
    // op /acties, de rail of de badge (undercount). De zuster-query `staleDiensten` hieronder scopet al
    // net zo; nu gelijkgetrokken zodat de volledige MAX-ruimte voor echt-open diensten is. `_count` blijft
    // als defense-in-depth (self-correct als een race intussen een ACTIVE-samenwerking toevoegt).
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
      // Deterministische, acuut-eerst geordende slice: `isStartAcute` (acute-open-diensten.ts) telt een
      // dienst als acuut wanneer startDate ontbreekt óf vóór het acute-venster valt, dus zetten we
      // null-start en de vroegst-startende diensten voorop. Zonder orderBy was welke MAX-rijen de query
      // teruggaf niet-deterministisch → een acute dienst kon buiten de slice vallen en verkeerd
      // gebucket worden (undercount t.o.v. de onbegrensde /franchise/diensten-pagina).
      orderBy: [{ startDate: { sort: "asc", nulls: "first" } }, { createdAt: "asc" }],
      take: MAX,
    }),
    // Roster-inzetbaarheid: alle tenant-ZZP'ers met de signalen die computeEngageability nodig heeft,
    // zodat een niet-inzetbare (plaatsing-blokkerende) ZZP'er óók op /acties en in de zijbalk-badge
    // telt — voorheen alleen op de dashboard-rail. Gedeelde select/evaluatie met de nav-badge
    // (signals.ts) via `roster-engageability.ts`, zodat de telling niet kan driften.
    //
    // ONGEWINDOWD (geen `take`): de scan capte eerder op 50 (`id: asc`), waardoor een niet-inzetbaar
    // roster-lid voorbij de 50e permanent buiten /acties, de badge én de rail viel — de blokkerende
    // actie (ontbrekend/verlopen verplicht document) bumpt geen venster, dus niet self-healing
    // (persona-sweep run 81, DOEL 1b). `orderBy: { id: "asc" }` blijft voor een stabiele volgorde van de
    // losse taken. Per tenant een beheerbaar aantal profielen (spiegelt de ongelimiteerde tenant-scans).
    prisma.freelancerProfile.findMany({
      where: { tenantId },
      // De inzetbaarheidsvelden (gedeeld met de nav-badge) + de bench-telling voor het
      // re-engagement-signaal: een ZZP'er met een lopende (ACTIVE) samenwerking is engaged via het
      // werk en telt nooit als stilgevallen (`classifyRosterDormancy`). Zelfde `_count`-definitie als de
      // /franchise/zzpers-lijst, zodat de dormancy-tier tussen de oppervlakken niet kan driften.
      select: {
        ...ROSTER_ENGAGEABILITY_SELECT,
        _count: { select: { collaborations: { where: { status: "ACTIVE" } } } },
      },
      orderBy: { id: "asc" },
    }),
    // Ongedekte diensten die te lang open staan (gepubliceerd, geen actieve samenwerking, ouder dan de
    // drempel). Oudste eerst — zelfde definitie/drempel als de dashboard-rail.
    prisma.job.findMany({
      where: {
        tenantId,
        status: "PUBLISHED",
        collaborations: { none: { status: "ACTIVE" } },
        createdAt: { lte: staleThreshold },
      },
      orderBy: { createdAt: "asc" },
      select: { id: true, title: true, createdAt: true },
      take: MAX,
    }),
    // Geleide-opzet-tellingen (opdrachtgever → dienst → roster). Zelfde bron/definitie als het
    // bemiddelaar-dashboard, zodat de geleide stappen op /acties + badge exact de rail spiegelen.
    prisma.company.count({ where: { tenantId } }),
    prisma.freelancerProfile.count({ where: { tenantId } }),
    prisma.job.count({ where: { tenantId, status: "PUBLISHED" } }),
    prisma.company.count({ where: { tenantId, jobs: { none: { status: "PUBLISHED" } } } }),
    // Open dienst-overname-aanvragen binnen de eigen tenant — exact dezelfde scoping als de
    // nav-badge (`openHandoffs`, signals.ts): via de opdracht van de samenwerking. De bemiddelaar
    // (tenant-eigenaar) is aan zet om te beoordelen (goedkeuren/afwijzen). Scope óók op de
    // samenwerking zelf (`status: "ACTIVE", disputedAt: null`) — een overname kan alleen op een
    // ACTIEVE inzet worden geopend (`canRequestHandoff`), maar niets sluit de OPEN-aanvraag als de
    // samenwerking daarna terminaal wordt (annuleren/afronden) of in dispuut gaat (werkproces
    // bevroren). Zonder deze scope bleef de beslis-taak eeuwig hangen op een dode/bevroren inzet —
    // recht tegen de server-side status in (spiegelt de run-103 job.status-fix voor de kandidaat-taken).
    prisma.shiftHandoff.findMany({
      where: {
        status: "OPEN",
        collaboration: { status: "ACTIVE", disputedAt: null, job: { tenantId } },
      },
      select: {
        id: true,
        collaboration: {
          select: {
            job: { select: { title: true } },
            freelancer: { select: { user: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: MAX,
    }),
    // Aflopende plaatsingen binnen de tenant — het vervolgsignaal voor de bemiddelaar. Tenant-scope
    // via `job.tenantId` (spiegelt het franchise-samenwerkingoverzicht + shift-handoff-scope). Zelfde
    // vensterbegrenzing als de partij-taak (`renewalTasks`): binnen het venster vóór het einde óf tot
    // één dag voorbij de grace ná het einde (rijen daarbuiten zijn `lapsed` → geen aandacht, niet
    // ophalen). De pure `summarizeCollaborationRenewal` bepaalt hierna de definitieve attentie-grens.
    prisma.collaboration.findMany({
      where: {
        job: { tenantId },
        status: "ACTIVE",
        disputedAt: null,
        endDate: {
          gte: new Date(now.getTime() - (RENEWAL_OVERDUE_GRACE_DAYS + 1) * 86_400_000),
          lte: new Date(now.getTime() + RENEWAL_WINDOW_DAYS * 86_400_000),
        },
      },
      select: {
        id: true,
        endDate: true,
        job: { select: { title: true } },
        company: { select: { name: true } },
        freelancer: { select: { user: { select: { name: true } } } },
      },
      orderBy: { endDate: "asc" },
      take: MAX,
    }),
    // Relatiegezondheid-bron voor de re-engagement-taak: alle tenant-opdrachtgevers + hun actieve
    // samenwerkingen. `unbounded-allow`: exact de scope/definitie van /franchise/opdrachtgevers
    // (`tenantScopeWhere` = `{ tenantId }`; per tenant een beheerbaar aantal bedrijven), zodat /acties,
    // de badge en de klantenlijst-pagina niet driften. De twee groupBy-aggregaten hieronder leveren de
    // open-opdracht-telling en het laatste-activiteitsmoment.
    prisma.company.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
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

  // Geleide opzet: de eerstvolgende concrete opzet-stap(pen) zolang de franchise nog niet volledig
  // staat. Via de item-engine (voorheen dashboard-rail-only via `activation`) → één bron voor
  // /acties, de zijbalk-badge én de dashboard-rail.
  tasks.push(
    ...franchiseGuidedSetupTasks({
      companies,
      publishedDiensten,
      rosterFreelancers: freelancers,
      companiesWithoutDiensten,
    }),
  );

  // Aggregeer per ZZP'er: één taak per professional met het aantal (bijna-)verlopende certificaten.
  // Superseded exemplaren (een nieuwer, nu-geldig cert van hetzelfde type dekt de compliance al)
  // tellen niet mee — anders een valse verloop-nudge die nooit nuttig verdwijnt. Voor de
  // superseded-check hebben we per kandidaat-ZZP'er álle VERIFIED-certs nodig (ook de langer-geldige
  // en onbeperkte dekkers), maar alléén voor de profielen die een in-venster verlopend cert hebben —
  // gescoped op die ids, zodat onbeperkt-geldige certs van ándere roster-leden de query niet vullen.
  const candidateNames = new Map<string, string>();
  for (const c of expiringRosterCreds)
    candidateNames.set(c.freelancerProfileId, c.freelancerProfile.user.name ?? "ZZP'er");

  if (candidateNames.size > 0) {
    const coverCreds = await prisma.credential.findMany({
      where: {
        status: "VERIFIED",
        freelancerProfileId: { in: [...candidateNames.keys()] },
      },
      select: { id: true, type: true, expiresAt: true, freelancerProfileId: true },
    });
    const rosterExpiry = rosterExpiringByProfile(
      coverCreds.map((c) => ({
        id: c.id,
        type: c.type,
        status: "VERIFIED" as const,
        expiresAt: c.expiresAt,
        freelancerProfileId: c.freelancerProfileId,
        freelancerName: candidateNames.get(c.freelancerProfileId) ?? "ZZP'er",
      })),
      now,
      soon,
    );
    for (const e of rosterExpiry)
      tasks.push(franchiseCredentialExpiryTask(e.profileId, e.name, e.count));
  }

  // Zelfde patroon voor de REEDS verlopen roster-certs: per kandidaat-ZZP'er alle VERIFIED/EXPIRED-
  // certs ophalen (verlopen exemplaren om te tellen + nu-geldige om dekking van hetzelfde type te
  // detecteren). `rosterExpiredByProfile` past de computed verval-grens (`expiresAt <= now`) en de
  // dekkings- én verplicht-type-uitsluiting toe, zodat een cert nooit tegelijk als "binnenkort" én
  // "verlopen" telt (mutueel exclusief op exact dezelfde grens die de "binnenkort"-tak hanteert).
  const expiredCandidateNames = new Map<string, string>();
  for (const c of expiredRosterCreds)
    expiredCandidateNames.set(c.freelancerProfileId, c.freelancerProfile.user.name ?? "ZZP'er");

  if (expiredCandidateNames.size > 0) {
    const expiredCoverCreds = await prisma.credential.findMany({
      where: {
        status: { in: ["VERIFIED", "EXPIRED"] },
        freelancerProfileId: { in: [...expiredCandidateNames.keys()] },
      },
      select: { id: true, type: true, status: true, expiresAt: true, freelancerProfileId: true },
    });
    const rosterExpired = rosterExpiredByProfile(
      expiredCoverCreds.map((c) => ({
        id: c.id,
        type: c.type,
        status: c.status as CredentialStatus,
        expiresAt: c.expiresAt,
        freelancerProfileId: c.freelancerProfileId,
        freelancerName: expiredCandidateNames.get(c.freelancerProfileId) ?? "ZZP'er",
      })),
      now,
      MANDATORY_CREDENTIAL_TYPES,
    );
    for (const e of rosterExpired)
      tasks.push(franchiseCredentialExpiredTask(e.profileId, e.name, e.count));
  }

  if (dueLeads > 0) tasks.push(franchiseLeadFollowupTask(dueLeads));

  // Acute-onbezet: open diensten die deze week/verstreken starten of geen startdatum hebben. Laadt het
  // vulbaar-signaal alleen voor de open (ongevulde) diensten (één gebundelde load, geen N+1) en bouwt
  // één aggregaat-taak met de vulbaar/werving-splitsing. Geen open dienst → geen extra roster-load.
  const openDienstIds = openDiensten.filter((d) => d._count.collaborations === 0).map((d) => d.id);
  const fillSignals = await getRosterFillSignalsForTenant(tenantId, openDienstIds, now);
  const acuteSummary = summarizeAcuteOpenDiensten(
    openDiensten.map((d) => ({
      published: true,
      filled: d._count.collaborations > 0,
      startDate: d.startDate,
      readyMatches: fillSignals.get(d.id)?.readyMatches ?? 0,
    })),
    now,
  );
  if (acuteSummary) tasks.push(franchiseAcuteDienstTask(acuteSummary));

  // Diensten die al in de acute-aggregaattaak zitten (ongevuld + start deze week/verleden): die zijn
  // hieronder ook stale (te lang open) als ze de drempel halen. Zonder deze set telt zo'n dienst twee
  // keer op /acties + in de badge — één keer in het acute-aggregaat én één keer als specifieke
  // stale-taak. De acute-tak is het urgentere, gebundelde signaal en wint; de stale-lijst toont alleen
  // de resterende lang-open diensten die (nog) niet acuut zijn (starten later). Zelfde acuut-definitie
  // (`isStartAcute`) als het aggregaat, zodat de twee oppervlakken niet driften.
  const acuteDienstIds = new Set(
    openDiensten
      .filter((d) => d._count.collaborations === 0 && isStartAcute(d.startDate, now))
      .map((d) => d.id),
  );

  // Niet-inzetbare roster-ZZP'ers (verplicht document ontbreekt/verlopen of verificatie incompleet) —
  // blokkeert plaatsing. Zelfde helper/bron (computeEngageability) als /franchise/zzpers en het
  // dashboard, zodat de oppervlakken elkaar nooit tegenspreken.
  for (const f of roster) {
    const eng = evaluateRosterEngageability(f, now);
    if (eng.status === "INACTIEF") {
      // Niet-inzetbaar (verplicht document ontbreekt/verlopen of verificatie incompleet) — een
      // plaatsing-blokkerende actie die deze ZZP'er al met hoge prioriteit oppervlakt. Geen tweede
      // (lager-geprioriteerde) re-engagement-nudge voor dezelfde persoon: rust boven ruis, en
      // "benaderen" heeft weinig zin zolang de inzetbaarheid nog blokkeert.
      const reason = eng.blockers.length
        ? formatMissing(eng.blockers)
        : "verificatie nog niet compleet";
      tasks.push(franchiseNotEngageableTask(f.id, f.user.name ?? "ZZP'er", reason));
      continue;
    }
    // Inzetbaar, maar op de bench (geen lopende opdracht) én afgekoeld (≥ DORMANT_IDLE_DAYS niet
    // ingelogd) → re-engagement: benader de vakmens vóór hij afhaakt. Aanbod-spiegel van de klant-
    // variant hieronder; zelfde pure `classifyRosterDormancy` als de /franchise/zzpers-lijst, dus de
    // oppervlakken driften niet. Alleen de `dormant`-tier levert een taak — de `cooling`-tier blijft
    // een zacht lijst-only signaal (geen /acties-ruis).
    const dormancy = classifyRosterDormancy(
      { lastActiveAt: f.user.lastLoginAt, activeCollaborations: f._count.collaborations },
      now,
    );
    if (dormancy.tier === "dormant" && dormancy.daysIdle != null) {
      tasks.push(franchiseRosterReengagementTask(f.id, f.user.name ?? "ZZP'er", dormancy.daysIdle));
    }
  }

  // Ongedekte diensten die te lang open staan — oudste eerst, max 3 als aparte rij (rustige lijst; de
  // volledige lijst staat op /franchise/diensten). Het residu (#4+) wordt gebundeld in één rollup-taak
  // (spiegelt franchiseAcuteDienstTask) zodat lang-open voorraad níét stil van /acties, de badge
  // (`pendingTaskCount`) en de rail valt — voorheen viel #4+ volledig weg (undercount).
  const staleTasks = staleDiensten.filter((d) => !acuteDienstIds.has(d.id));
  const STALE_DIENST_SHOWN = 3;
  for (const d of staleTasks.slice(0, STALE_DIENST_SHOWN)) {
    const openDays = Math.floor((now.getTime() - d.createdAt.getTime()) / 86_400_000);
    tasks.push(franchiseStaleDienstTask(d.id, d.title, openDays));
  }
  const staleResidue = staleTasks.length - STALE_DIENST_SHOWN;
  if (staleResidue > 0) tasks.push(franchiseStaleDienstRollupTask(staleResidue));

  // Open dienst-overname-aanvragen binnen de tenant — de bemiddelaar beslist (goedkeuren/afwijzen).
  // Eén taak per aanvraag; deep-link naar het gedeelde beoordelingsscherm (dezelfde href als de badge).
  for (const h of openHandoffs)
    tasks.push(
      shiftHandoffTask(
        h.id,
        "FRANCHISER",
        h.collaboration.job.title,
        h.collaboration.freelancer.user.name ?? "ZZP'er",
      ),
    );

  // Aflopende plaatsingen — het vervolgsignaal voor de bemiddelaar. De query is al op het venster
  // begrensd; de pure `summarizeCollaborationRenewal` bepaalt de definitieve attentie-grens (een enkele
  // doorgelaten rij één dag over de grace kan alsnog `lapsed` zijn → dan geen taak). Zelfde pure bron
  // als de opdrachtgever/ZZP'er-taak, dus de drie oppervlakken driften niet.
  for (const c of endingCollabs) {
    const renewal = summarizeCollaborationRenewal({
      status: "ACTIVE",
      endDate: c.endDate,
      disputed: false,
      now,
    });
    if (!renewal.attention) continue;
    tasks.push(
      franchiseCollaborationRenewalTask(
        c.id,
        c.freelancer.user.name ?? "de ZZP'er",
        c.company.name ?? "de opdrachtgever",
        c.job.title,
        renewal.phase,
        renewal.daysRemaining,
      ),
    );
  }

  // Stilgevallen opdrachtgevers (geen open dienst/lopende plaatsing, ≥ CLIENT_IDLE_DAYS rustig) — het
  // re-engagement-signaal. Zelfde pure afleiding + classificatie (`buildClientActivityInputs`/
  // `classifyClientHealth`) als de klantenlijst-strip en de nav-badge, dus de drie oppervlakken driften
  // niet. Eén taak per `attention`-klant; de badge telt exact dit aantal.
  const clientActivity = buildClientActivityInputs(
    reengageCompanies.map((c) => ({
      id: c.id,
      createdAt: c.createdAt,
      activeCollaborationCount: c._count.collaborations,
    })),
    reengagePublishedJobs,
    reengageCollabActivity,
  );
  for (const c of reengageCompanies) {
    const activity = clientActivity.get(c.id);
    if (!activity || classifyClientHealth(activity, now) !== "attention") continue;
    tasks.push(franchiseClientReengagementTask(c.id, c.name, clientIdleDays(activity, now)));
  }

  return tasks;
}

async function adminTasks(): Promise<PendingTask[]> {
  const tasks: PendingTask[] = [];
  const [
    creds,
    pendingUsers,
    disputes,
    deletions,
    noShowReports,
    noShowAtLimit,
    supportTickets,
    openHandoffs,
  ] = await Promise.all([
    // Deterministische `orderBy` (oudst eerst) is verplicht náást `take: MAX`: zonder expliciete
    // ordering garandeert Prisma geen rijvolgorde, dus wélke MAX-van-N rijen terugkomen is arbitrair
    // en kan per request verschuiven. De nav-badges (signals.ts) tellen deze wachtrijen exact/onbegrensd
    // en claimen gelijkheid met /acties; zonder deze ordering valt zodra een wachtrij >MAX groeit een
    // concrete, actie-behoevende rij willekeurig weg — een "ontbrekende taak" die de badge tegenspreekt.
    // Zelfde bug-klasse als de run-61-fix (franchiser acute-onbezet undercount); consistent met de
    // zuster-queries (noShowReports/supportTickets/openHandoffs) verderop in deze Promise.all.
    prisma.credential.findMany({
      where: { status: "SUBMITTED" },
      select: {
        id: true,
        title: true,
        freelancerProfile: { select: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "asc" },
      take: MAX,
    }),
    prisma.user.findMany({
      where: { status: "PENDING" },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
      take: MAX,
    }),
    prisma.collaboration.findMany({
      where: { disputedAt: { not: null } },
      select: { id: true, job: { select: { title: true } } },
      orderBy: { createdAt: "asc" },
      take: MAX,
    }),
    prisma.user.findMany({
      where: { deletionRequestedAt: { not: null }, anonymizedAt: null, role: { not: "ADMIN" } },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
      take: MAX,
    }),
    // No-show-meldingen die op een oordeel wachten (gegrond/ongegrond).
    prisma.noShowReport.findMany({
      where: { verdict: "PENDING" },
      select: {
        id: true,
        freelancer: { select: { user: { select: { name: true } } } },
        collaboration: { select: { job: { select: { title: true } } } },
      },
      orderBy: { createdAt: "asc" },
      take: MAX,
    }),
    // ZZP'ers op/over de grens van ongegronde no-shows → uitschrijf-taak (handmatig besluit).
    prisma.noShowReport.groupBy({
      by: ["freelancerProfileId"],
      where: { verdict: "UNJUSTIFIED" },
      _count: { _all: true },
      having: { freelancerProfileId: { _count: { gte: NO_SHOW_LIMIT } } },
    }),
    // Openstaande supporttickets waar de helpdesk aan zet is (nieuw/onbeantwoord/geëscaleerd/
    // heropend). Oudst-bijgewerkt eerst zodat het langst stille ticket bovenaan komt.
    prisma.supportTicket.findMany({
      where: { status: { in: [...SUPPORT_OPEN_STATUSES] } },
      select: { id: true, subject: true, status: true },
      orderBy: { updatedAt: "asc" },
      take: MAX,
    }),
    // Open dienst-overname-aanvragen, platform-breed — exact dezelfde scoping als de nav-badge
    // (`openAdminHandoffs`, signals.ts). De admin beoordeelt ze allemaal (goedkeuren/afwijzen).
    // Scope óók op de samenwerking zelf (`status: "ACTIVE", disputedAt: null`): een OPEN-aanvraag op
    // een terminale (geannuleerd/afgerond) of bevroren (dispuut) samenwerking is moot — de
    // herplaatsing/annulering is dan al gebeurd, en beslissen tijdens een dispuut doorbreekt de
    // werkproces-freeze. Zonder deze scope bleef de beslis-taak + badge eeuwig hangen.
    prisma.shiftHandoff.findMany({
      where: { status: "OPEN", collaboration: { status: "ACTIVE", disputedAt: null } },
      select: {
        id: true,
        collaboration: {
          select: {
            job: { select: { title: true } },
            freelancer: { select: { user: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: MAX,
    }),
  ]);
  for (const c of creds)
    tasks.push(
      adminVerifyCredentialTask(c.id, c.title, c.freelancerProfile.user.name ?? "Onbekend"),
    );
  for (const u of pendingUsers) tasks.push(adminActivateUserTask(u.id, u.name ?? "Gebruiker"));
  for (const d of disputes) tasks.push(adminResolveDisputeTask(d.id, d.job.title));
  for (const u of deletions) tasks.push(adminDeletionRequestTask(u.id, u.name ?? "Gebruiker"));
  for (const r of noShowReports)
    tasks.push(
      adminJudgeNoShowTask(r.id, r.freelancer.user.name ?? "ZZP'er", r.collaboration.job.title),
    );
  for (const t of supportTickets)
    tasks.push(
      adminSupportTicketTask(
        t.id,
        t.subject,
        SUPPORT_STATUS_LABEL[t.status as SupportTicketStatus],
      ),
    );
  // Open dienst-overname-aanvragen (platform-breed) — de admin beslist. Eén taak per aanvraag;
  // deep-link naar het admin-beoordelingsscherm (dezelfde href als de nav-badge).
  for (const h of openHandoffs)
    tasks.push(
      shiftHandoffTask(
        h.id,
        "ADMIN",
        h.collaboration.job.title,
        h.collaboration.freelancer.user.name ?? "ZZP'er",
      ),
    );
  if (noShowAtLimit.length > 0) {
    // Alleen nog-actieve accounts: een al geschorste ZZP'er heeft geen uitschrijf-taak meer.
    const profiles = await prisma.freelancerProfile.findMany({
      where: {
        id: { in: noShowAtLimit.map((r) => r.freelancerProfileId) },
        user: { status: "ACTIVE" },
      },
      select: { id: true, user: { select: { id: true, name: true } } },
    });
    const countByProfile = new Map(
      noShowAtLimit.map((r) => [r.freelancerProfileId, r._count._all]),
    );
    for (const p of profiles)
      tasks.push(
        adminSuspendNoShowTask(
          p.user.id,
          p.user.name ?? "ZZP'er",
          countByProfile.get(p.id) ?? NO_SHOW_LIMIT,
        ),
      );
  }
  return tasks;
}
