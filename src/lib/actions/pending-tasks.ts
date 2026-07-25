// Actiecentrum — server-enumerator. Haalt per rol de CONCRETE openstaande items op (findMany, niet
// count) en bouwt PendingTask[] via de pure builders in tasks.ts. Hergebruikt dezelfde queries/
// drempels als het dashboard (signals.ts, profile.ts). N+1-veilig: één query per kind met take-limiet.

import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { type Actor } from "@/lib/authz";
import { type Availability } from "@/lib/enums";
import { computeFreelancerCompleteness, computeCompanyCompleteness } from "@/lib/profile";
import { mandatoryDocuments } from "@/lib/mandatory-documents";
import { computeEngageability } from "@/lib/engageability";
import { formatMissing } from "@/lib/next-actions";
import { startOfUtcDay } from "@/lib/signals";
import { type FreelancerCredential } from "@/lib/matching";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
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
  staleApplicationsTask,
  availabilityRefreshTask,
  draftJobsTask,
  franchiseCredentialExpiryTask,
  franchiseAcuteDienstTask,
  franchiseLeadFollowupTask,
  franchiseNotEngageableTask,
  franchiseStaleDienstTask,
  franchiseStaleDienstRollupTask,
  franchiseGuidedSetupTasks,
  shiftHandoffTask,
  clientComplianceTask,
  reviewLeaveTask,
  collaborationRenewalTask,
  respondInvitationTask,
  vatDeadlineTask,
  type PendingTask,
} from "@/lib/actions/tasks";
import { getReceivedInvitations } from "@/lib/data/received-invitations";
import { invitationAgeDays } from "@/lib/received-invitations";
import { reviewPromptForCollaboration } from "@/lib/collaboration-review-prompt";
import {
  summarizeCollaborationRenewal,
  RENEWAL_WINDOW_DAYS,
  RENEWAL_OVERDUE_GRACE_DAYS,
} from "@/lib/collaboration-renewal";
import { reviewBlindDays } from "@/lib/config";
import { getVatDeadlinesForActor } from "@/lib/data/vat-deadline";
import { clientCredentialAlerts, clientHasComplianceAction } from "@/lib/collaboration-alerts";
import {
  collaborationCredentialExpiryConcerns,
  type CollabCredentialInput,
} from "@/lib/collaboration-credential-expiry";
import { summarizeStaleClientApplications } from "@/lib/stale-applications";
import { pendingCollaborationProposals } from "@/lib/accepted-proposal";
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
    const creds = await prisma.credential.findMany({
      where: { freelancerProfileId: profile.id },
      select: { id: true, title: true, type: true, status: true, expiresAt: true },
      take: MAX,
    });
    allCreds = creds.map((c) => ({
      id: c.id,
      title: c.title,
      type: c.type as CollabCredentialInput["type"],
      status: c.status as CollabCredentialInput["status"],
      expiresAt: c.expiresAt,
    }));
    for (const c of creds) {
      if (c.status === "REJECTED") tasks.push(credentialFixTask(c.id, c.title, "rejected"));
      else if (
        c.status === "VERIFIED" &&
        c.expiresAt !== null &&
        c.expiresAt > now &&
        c.expiresAt <= soon
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
        select: { id: true, lifecycleStatus: true },
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
      tasks.push(contractSignTask(c.id, c.job.title, c.company.name));
      continue;
    }
    // ACTIVE ⟹ contract getekend. De meest recente prestatie bepaalt wie aan zet is, exact zoals de
    // cascade-fase (stage.ts): nog geen/DRAFT = de ZZP'er moet uren indienen; REJECTED = corrigeren
    // en opnieuw indienen; SUBMITTED = de opdrachtgever keurt (geen ZZP'er-taak); APPROVED = de
    // factuur-tak hieronder neemt over. Zonder de submit-taak sprak /acties de fase tegen.
    const latestPerf = c.performances[0];
    if (!latestPerf || latestPerf.status === "DRAFT") {
      tasks.push(performanceSubmitTask(c.id, c.job.title));
    } else if (latestPerf.status === "REJECTED") {
      tasks.push(performanceResubmitTask(latestPerf.id, c.id, c.job.title));
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
        tasks.push(
          invoiceSubmitTask(inv.id, c.id, c.job.title, inv.lifecycleStatus === "REJECTED"),
        );
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
 * niet-beantwoord, gededupt, ≤ MAX_RECEIVED_INVITATIONS). Zonder deze taak leefde de uitnodiging alléén
 * op de find-work-pagina; nu ook op /acties, de zijbalk-badge en de dashboard-rail. Deep-link naar de
 * opdracht waar de reactie-flow staat — geen dubbele UI.
 */
async function invitationTasks(freelancerProfileId: string, now: Date): Promise<PendingTask[]> {
  const invitations = await getReceivedInvitations(freelancerProfileId, now);
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

  const [
    company,
    overdue,
    dueSoon,
    unread,
    newApplications,
    draftJobs,
    staleCandidates,
    acceptedCandidates,
    complianceAlerts,
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
        collaboration: { select: { id: true } },
        job: { select: { title: true } },
        freelancer: { select: { user: { select: { name: true } } } },
      },
      orderBy: { updatedAt: "asc" },
      take: MAX,
    }),
    // Compliance-ripple: lopende samenwerkingen waarvan de ZZP'er een vereist certificaat
    // mist/verlopen/binnenkort-verlopend heeft. Hergebruikt de geteste, eigenaar-gescoopte loader
    // (company → ACTIVE-collabs met vereiste certificaten + ZZP-certificaten, take-begrensd).
    clientCredentialAlerts(userId),
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
      job: { select: { title: true } },
      freelancer: { select: { user: { select: { name: true } } } },
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
      tasks.push(contractSignTask(c.id, c.job.title, name));
      continue;
    }
    for (const p of c.performances)
      tasks.push(performanceApproveTask(p.id, c.id, c.job.title, name));
    for (const inv of c.invoices) tasks.push(invoiceApproveTask(inv.id, c.id, c.job.title));
  }

  for (const u of unread) tasks.push(messageReplyTask(u.id, u.withWhom, u.subject));
  if (overdue > 0) tasks.push(overdueInvoiceTask(overdue, "CLIENT"));
  // Pre-due: facturen die binnenkort vervallen (nog niet te laat) — betaal op tijd. Vensters van
  // overdue (< now) en due-soon (>= now) raken elkaar niet, dus geen dubbele next-action.
  if (dueSoon > 0) tasks.push(paymentDueSoonTask(dueSoon));
  if (newApplications > 0) tasks.push(applicationsReviewTask(newApplications));
  // Geaccepteerd-maar-nog-niet-voorgesteld: rond de hire af met een samenwerkingsvoorstel.
  for (const p of pendingCollaborationProposals(
    acceptedCandidates.map((a) => ({
      applicationId: a.id,
      freelancerName: a.freelancer.user.name ?? "ZZP'er",
      jobTitle: a.job.title,
      hasCollaboration: a.collaboration != null,
    })),
  ))
    tasks.push(proposeCollaborationTask(p.applicationId, p.jobTitle, p.freelancerName));
  const staleApplications = summarizeStaleClientApplications(
    staleCandidates.map((a) => ({
      status: a.status,
      createdAt: a.createdAt,
      hasCollaboration: a.collaboration != null,
    })),
  );
  if (staleApplications) tasks.push(staleApplicationsTask(staleApplications));
  if (draftJobs > 0) tasks.push(draftJobsTask(draftJobs));

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
    expiringCreds,
    dueLeads,
    openDiensten,
    roster,
    staleDiensten,
    companies,
    freelancers,
    publishedDiensten,
    companiesWithoutDiensten,
    openHandoffs,
  ] = await Promise.all([
    // Geverifieerde, nog-geldige certificaten van tenant-ZZP'ers die binnenkort verlopen — zelfde
    // venster als de roster-compliance-zegel op het bemiddelaar-dashboard (gte now, lte soon).
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
    // Gepubliceerde tenant-diensten + hun vulgraad (actieve samenwerking = gevuld) + startdatum, voor de
    // acute-onbezet-taak. Zelfde bron/definitie als de "Wat dreigt onbezet"-kaart op /franchise/diensten.
    prisma.job.findMany({
      where: { tenantId, status: "PUBLISHED" },
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
  const expiringByProfile = new Map<string, { name: string; count: number }>();
  for (const c of expiringCreds) {
    const entry = expiringByProfile.get(c.freelancerProfileId) ?? {
      name: c.freelancerProfile.user.name ?? "ZZP'er",
      count: 0,
    };
    entry.count += 1;
    expiringByProfile.set(c.freelancerProfileId, entry);
  }
  for (const [profileId, e] of expiringByProfile)
    tasks.push(franchiseCredentialExpiryTask(profileId, e.name, e.count));

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
    prisma.credential.findMany({
      where: { status: "SUBMITTED" },
      select: {
        id: true,
        title: true,
        freelancerProfile: { select: { user: { select: { name: true } } } },
      },
      take: MAX,
    }),
    prisma.user.findMany({
      where: { status: "PENDING" },
      select: { id: true, name: true },
      take: MAX,
    }),
    prisma.collaboration.findMany({
      where: { disputedAt: { not: null } },
      select: { id: true, job: { select: { title: true } } },
      take: MAX,
    }),
    prisma.user.findMany({
      where: { deletionRequestedAt: { not: null }, anonymizedAt: null, role: { not: "ADMIN" } },
      select: { id: true, name: true },
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
