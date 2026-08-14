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
import { computeEngageability } from "@/lib/engageability";
import { formatMissing } from "@/lib/next-actions";
import { startOfUtcDay } from "@/lib/signals";
import { type FreelancerCredential } from "@/lib/matching";
import {
  CREDENTIAL_TYPE_LABEL,
  rosterExpiringByProfile,
  supersededVerifiedCredentialIds,
} from "@/lib/credentials";
import { type CredentialType } from "@/lib/enums";
import { getCompletenessProfile } from "@/lib/data/freelancer-profile";
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
  jobNeedsAttentionTask,
  franchiseCredentialExpiryTask,
  franchiseAcuteDienstTask,
  franchiseLeadFollowupTask,
  franchiseNotEngageableTask,
  franchiseStaleDienstTask,
  franchiseStaleDienstRollupTask,
  franchiseCollaborationRenewalTask,
  franchiseGuidedSetupTasks,
  shiftHandoffTask,
  clientComplianceTask,
  clientCascadeOverduePaymentTask,
  reviewLeaveTask,
  collaborationRenewalTask,
  respondInvitationTask,
  vatDeadlineTask,
  incomeTaxDeadlineTask,
  type PendingTask,
} from "@/lib/actions/tasks";
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
import { getIncomeTaxDeadlineForActor } from "@/lib/data/income-tax-deadline";
import { incomeTaxDeadlineNeedsAction } from "@/lib/administration/income-tax-deadline";
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
  const participants = await prisma.conversationParticipant.findMany({
    where: { userId },
    select: { conversationId: true, lastReadAt: true },
  });
  if (participants.length === 0) return [];
  const grouped = await prisma.message.groupBy({
    by: ["conversationId"],
    where: {
      conversationId: { in: participants.map((p) => p.conversationId) },
      senderId: { not: userId },
    },
    _max: { createdAt: true },
  });
  const latest = new Map(grouped.map((g) => [g.conversationId, g._max.createdAt]));
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
  return rankTasks(await adminTasks());
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

    // Eén query voor álle certificaten: de fix-taken (afgewezen/verloopt) én de verplichte-
    // documentenstatus (VOG/verzekering) worden in-memory afgeleid — zelfde bron als de
    // inzetbaarheidskaart op het dashboard, zodat beide oppervlakken nooit tegenspreken.
    //
    // ONBEGRENSD (geen take): de /certificaten-nav-badge (signals.ts) telt ditzelfde dossier
    // onbegrensd (count REJECTED + het volledige VERIFIED-dossier + de verplichte-doc-rijen) en
    // claimt gelijkheid met /acties. Een `take: MAX` zou (a) zonder orderBy niet-deterministisch
    // zijn (Prisma garandeert geen rijvolgorde → welke MAX-van-N rijen /acties toont wisselt per
    // request) en (b) de badge tegenspreken zodra het dossier > MAX rijen telt: een afgewezen/
    // verlopend/ontbrekend-verplicht cert of een compliance-blokkerend cert van een lopende
    // samenwerking dat buiten de slice valt, verschijnt dan wél in de badge maar niet als next-action.
    // Bovendien heeft de superseded-detectie (`supersededVerifiedCredentialIds`) álle nu-geldige
    // VERIFIED-exemplaren van een type nodig — een cap zou het superseding-exemplaar kunnen missen.
    // Zelfde drift-klasse als #1022 (admin-wachtrijen), hier drift-proof gesloten door de badge te
    // spiegelen i.p.v. te cappen. unbounded-allow: eigenaar-scoped, inherent begrensd tot het
    // persoonlijke certificaatdossier.
    const creds = await prisma.credential.findMany({
      where: { freelancerProfileId: profile.id },
      select: { id: true, title: true, type: true, status: true, expiresAt: true },
    });
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
  }

  // Lopende/voorgestelde samenwerkingen (geen disputen — die zijn bevroren).
  const collabs = await prisma.collaboration.findMany({
    where: { freelancer: { userId }, status: { in: ["PROPOSED", "ACTIVE"] }, disputedAt: null },
    select: {
      id: true,
      status: true,
      job: {
        select: {
          title: true,
          credentialRequirements: { where: { required: true }, select: { credentialType: true } },
        },
      },
      company: { select: { name: true } },
      // Meest recente prestatie eerst: die bepaalt de fase (spiegelt cascade/stage.ts). We halen
      // de status op (niet alleen de REJECTED-rijen) zodat we óók "nog geen prestatie" kunnen zien.
      performances: {
        select: { id: true, status: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      invoices: {
        where: { lifecycleStatus: { in: ["DRAFT", "REJECTED", "APPROVED", "OVERDUE"] } },
        select: { id: true, lifecycleStatus: true, createdAt: true },
        // Expliciete ordering vóór de take-limiet: zonder `orderBy` garandeert Prisma geen rijvolgorde,
        // dus wélke MAX-van-N facturen terugkomen zou arbitrair zijn en een taak kon tussen requests
        // flappen (verschijnen/verdwijnen zonder afhandeling) zodra een samenwerking >5 openstaande
        // cascade-facturen heeft. Oudste-eerst: de langst-openstaande factuur-taak komt bovenaan.
        orderBy: { createdAt: "asc" },
        take: 5,
      },
    },
    orderBy: { updatedAt: "desc" },
    take: MAX,
  });
  // Overdue-facturen die hier een eigen, specifieke betaal-taak krijgen, worden niet nóg eens
  // als generieke "factuur over de vervaldatum"-rij getoond (zie de residu-aftrek onderaan).
  let surfacedOverdue = 0;
  for (const c of collabs) {
    if (c.status === "PROPOSED") {
      // Inzetbaarheid-gate (server-waarheid, contract-commands.ts): tekenen wordt geweigerd zolang
      // een vereist certificaat ontbreekt/verlopen is. De "Onderteken"-taak zou dan een dode knop
      // zijn (signContract gooit, de samenwerking blijft PROPOSED, de taak verdwijnt nooit) en spreekt
      // het samenwerkingsdetail tegen, dat de teken-knop in deze staat al verbergt. De ZZP'er krijgt
      // in plaats daarvan de vernieuw-/aanlever-taak (collaborationExpired/MissingRequiredCredentials
      // hieronder — dezelfde `collabs`, dus óók voor PROPOSED). Persona-sweep run 58.
      const requiredTypes = c.job.credentialRequirements.map(
        (r) => r.credentialType as CredentialType,
      );
      if (!collaborationPlacementBlocked(requiredTypes, allCreds, now)) {
        tasks.push(contractSignTask(c.id, c.job.title, c.company.name));
      }
      continue;
    }
    // ACTIVE ⟹ contract getekend. De meest recente prestatie bepaalt wie aan zet is, exact zoals de
    // cascade-fase (stage.ts): nog geen/DRAFT = de ZZP'er moet uren indienen; REJECTED = corrigeren
    // en opnieuw indienen; SUBMITTED = de opdrachtgever keurt (geen ZZP'er-taak); APPROVED = de
    // factuur-tak hieronder neemt over. Zonder de submit-taak sprak /acties de fase tegen.
    const latestPerf = c.performances[0];
    if (!latestPerf || latestPerf.status === "DRAFT") {
      tasks.push(performanceSubmitTask(c.id, c.job.title));
    }
    // Elke AFGEKEURDE prestatie vraagt om correctie + herindiening — óók een prestatie van een vorige
    // cyclus die door een nieuwere (APPROVED/SUBMITTED/DRAFT) prestatie uit `performances[0]` is
    // weggedrukt. `createPerformance` gate't alleen op ACTIVE + geen dispuut, dus op één samenwerking
    // kunnen meerdere cycli naast elkaar bestaan; keek de enumerator (zoals voorheen) enkel naar de
    // nieuwste prestatie, dan zag de ZZP'er de vastgelopen, afgekeurde uren nergens in het actiecentrum
    // (alleen nog op het samenwerkingsdetail) terwijl het geld muurvast zit — alleen een APPROVED-
    // prestatie wordt ooit een factuur. Symmetrisch met de factuur-lus hieronder, die al over álle
    // openstaande facturen itereert. `performanceResubmitTask` sleutelt per prestatie-id, dus meerdere
    // afgekeurde prestaties zijn dedupe-veilig. Persona-sweep run 76.
    for (const p of c.performances) {
      if (p.status === "REJECTED") {
        tasks.push(performanceResubmitTask(p.id, c.id, c.job.title));
      }
    }
    for (const inv of c.invoices) {
      // APPROVED én OVERDUE dragen dezelfde ZZP-actie (betaling markeren), exact zoals cascade/stage.ts:
      // een OVERDUE-factuur die uit de oude [DRAFT,REJECTED,APPROVED]-filter viel verdween eerder stil
      // uit /acties (de betaal-taak sprak de "attention"-fase van het samenwerkingsscherm tegen).
      if (inv.lifecycleStatus === "APPROVED") {
        tasks.push(paymentConfirmTask(inv.id, c.id, c.job.title));
      } else if (inv.lifecycleStatus === "OVERDUE") {
        tasks.push(paymentConfirmTask(inv.id, c.id, c.job.title, true));
        surfacedOverdue += 1;
      } else {
        // Verse concept vs. verouderde concept: de leeftijd (hele dagen sinds `createdAt`) laat de
        // taak escaleren zodra 'ie ≥ UNBILLED_AGING_DAYS blijft liggen — zelfde drempel als de
        // dashboard-tegel "Nog te factureren". Bij een afgekeurde factuur telt leeftijd niet.
        const rejected = inv.lifecycleStatus === "REJECTED";
        const agingDays = rejected ? undefined : daysSince(inv.createdAt, now);
        tasks.push(invoiceSubmitTask(inv.id, c.id, c.job.title, rejected, agingDays));
      }
    }
  }

  // Vereist certificaat van een lopende/voorgestelde samenwerking dat binnenkort verloopt: één
  // gerichte, samenwerking-gebonden taak per certificaat (urgenter dan de generieke verval-taak).
  // De gedekte certificaten worden hieronder van de generieke lijst afgetrokken → geen dubbele taak.
  const coveredExpiringCredIds = new Set<string>();
  const collabConcerns = collaborationCredentialExpiryConcerns({
    collaborations: collabs.map((c) => ({
      collaborationId: c.id,
      companyName: c.company.name,
      jobTitle: c.job.title,
      requiredTypes: c.job.credentialRequirements.map(
        (r) => r.credentialType as CollabCredentialInput["type"],
      ),
    })),
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
      collaborations: collabs.map((c) => ({
        collaborationId: c.id,
        companyName: c.company.name,
        jobTitle: c.job.title,
        requiredTypes: c.job.credentialRequirements.map(
          (r) => r.credentialType as CollabCredentialInput["type"],
        ),
      })),
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
  const firstLookWhere = {
    job: { company: { userId } },
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
    draftJobs,
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
    prisma.application.count({ where: { job: { company: { userId } }, status: "NEW" } }),
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
    prisma.job.count({ where: { company: { userId }, status: "DRAFT" } }),
    // unbounded-allow: eigenaar-scoped (job.company.userId) + take-limiet
    prisma.application.findMany({
      where: {
        job: { company: { userId } },
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

  const collabs = await prisma.collaboration.findMany({
    where: { company: { userId }, status: { in: ["PROPOSED", "ACTIVE"] }, disputedAt: null },
    select: {
      id: true,
      status: true,
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
      performances: { where: { status: "SUBMITTED" }, select: { id: true }, take: 5 },
      invoices: {
        where: { lifecycleStatus: "SUBMITTED", counterpartyUserId: userId },
        select: { id: true },
        take: 5,
      },
    },
    orderBy: { updatedAt: "desc" },
    take: MAX,
  });
  for (const c of collabs) {
    const name = c.freelancer.user.name ?? "ZZP'er";
    if (c.status === "PROPOSED") {
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
      continue;
    }
    for (const p of c.performances)
      tasks.push(performanceApproveTask(p.id, c.id, c.job.title, name));
    for (const inv of c.invoices) tasks.push(invoiceApproveTask(inv.id, c.id, c.job.title));
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
  if (draftJobs > 0) tasks.push(draftJobsTask(draftJobs));

  // Koud-lopende gepubliceerde opdrachten (geen/weinig kandidaten) — het vacaturetempo-signaal dat tot
  // nu toe alleen op de opdracht-lijst/-detail + als achtergrondnotificatie stond, nu ook als
  // next-action. Gedeelde `getClientColdJobs` → identiek aan de /opdrachten-nav-badge (geen drift).
  for (const cold of await getClientColdJobs(userId, new Date())) {
    tasks.push(jobNeedsAttentionTask(cold.jobId, cold.title, cold.headline));
  }

  // BTW-aangifte-deadline (zie freelancerTasks) — ook de opdrachtgever heeft een eigen grootboek.
  for (const vatDeadline of await getVatDeadlinesForActor(userId, "CLIENT")) {
    tasks.push(vatDeadlineTask(vatDeadline));
  }

  // Afgeronde samenwerkingen die nog beoordeeld kunnen worden (blind venster open) — reputatie-nudge.
  tasks.push(...(await reviewLeaveTasks(userId, "CLIENT", new Date())));

  // Lopende samenwerkingen die hun einddatum naderen/passeerden — plan tijdig een vervolg.
  tasks.push(...(await renewalTasks(userId, "CLIENT", new Date())));

  return tasks;
}

async function franchiserTasks(userId: string): Promise<PendingTask[]> {
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true } });
  const tenantId = me?.tenantId ?? null;
  if (!tenantId) return [];

  const tasks: PendingTask[] = [];
  const now = new Date();
  const soon = new Date(now.getTime() + EXPIRY_WINDOW_MS);

  const staleThreshold = new Date(now.getTime() - STALE_DIENST_DAYS * 86_400_000);

  const [
    expiringRosterCreds,
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
    // telt — voorheen alleen op de dashboard-rail. Zelfde helper/bron als /franchise/zzpers.
    prisma.freelancerProfile.findMany({
      where: { tenantId },
      select: {
        id: true,
        completeness: true,
        availability: true,
        user: { select: { name: true, identityVerifiedAt: true, lastLoginAt: true } },
        credentials: { select: { type: true, status: true, expiresAt: true } },
      },
      // Deterministische ordering, identiek aan de nav-badge-bron (signals.ts): beide cappen op 50
      // (MAX === CASCADE_SCAN_LIMIT). Zonder identieke `orderBy` pakken de twee onafhankelijke
      // roster-queries bij >50 roster-leden een ánder 50-rij-subset → de niet-inzetbaar-telling op
      // /acties kan driften van de zijbalk-badge. Zie signals.roster-order.test.ts.
      orderBy: { id: "asc" },
      take: MAX,
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
    // (tenant-eigenaar) is aan zet om te beoordelen (goedkeuren/afwijzen).
    prisma.shiftHandoff.findMany({
      where: { status: "OPEN", collaboration: { job: { tenantId } } },
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
    if (eng.status !== "INACTIEF") continue;
    const reason = eng.blockers.length
      ? formatMissing(eng.blockers)
      : "verificatie nog niet compleet";
    tasks.push(franchiseNotEngageableTask(f.id, f.user.name ?? "ZZP'er", reason));
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
    prisma.shiftHandoff.findMany({
      where: { status: "OPEN" },
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
