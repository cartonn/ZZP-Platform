// Actiecentrum — item-niveau taakmodel (puur, geen I/O). De server-enumerator (pending-tasks.ts)
// haalt de concrete openstaande items op en bouwt hiermee PendingTask[]; de resolver-registry
// (components/actions/resolvers.tsx) mapt elke taak naar de UI waarmee je 'm ter plekke afhandelt.
//
// Dit is een parallelle, item-niveau laag bovenop de aggregaat-engine (next-actions.ts): elk
// concreet ding-om-te-doen wordt één taak, zodat je op de actie kunt klikken en daar het werk doet.
// Dezelfde prioriteitsbanden (P) worden hergebruikt zodat de rangschikking nooit afwijkt.

import { P, franchiserNextActions, type NextActionTone } from "@/lib/next-actions";
import { plural } from "@/lib/plural";
import { formatEuro } from "@/lib/invoices";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import { type CredentialType } from "@/lib/enums";
import { type CredentialAlert } from "@/lib/collaboration-alerts";
import { type CollaborationRenewalPhase } from "@/lib/collaboration-renewal";
import { type VatDeadlineSummary } from "@/lib/administration/vat-deadline";
import { type IncomeTaxDeadlineSummary } from "@/lib/administration/income-tax-deadline";
import { type HoursCriterionSummary } from "@/lib/tax/hours-criterion-summary";
import { type StaleApplicationsSummary } from "@/lib/stale-applications";
import { type FirstLookOverdueSummary } from "@/lib/client-first-look";
import { INVITATION_AGING_DAYS, invitationAgeLabel } from "@/lib/received-invitations";
import { UNBILLED_AGING_DAYS } from "@/lib/unbilled-invoices";
import { PROPOSAL_STALL_DAYS } from "@/lib/accepted-proposal";
import {
  acuteFillabilityHeadline,
  type AcuteFillabilitySummary,
} from "@/lib/franchise/acute-fillability";

export type TaskTone = NextActionTone;

/**
 * Hoe de UI de taak afhandelt:
 * - oneClick      : één knop → server-actie + revalidate
 * - approveReject : goedkeuren (één klik) + afwijzen (met verplichte reden) naast elkaar
 * - reply         : klein inline tekstveld (bericht beantwoorden)
 * - drawer        : slide-over met een bestaand formulier (profiel/prestatie/certificaat/…)
 * - link          : geen inline-resolver → deep-link naar de plek van de handeling (fallback)
 */
export type TaskResolver = "oneClick" | "approveReject" | "reply" | "drawer" | "link";

interface TaskBase {
  /** Stabiel + deterministisch: `${kind}:${entityId}` — React-key, dedupe en scroll-anchor. */
  id: string;
  title: string;
  subtitle?: string;
  tone: TaskTone;
  priority: number;
  resolver: TaskResolver;
  /** Altijd een werkbare deep-link, ook als de resolver inline is (fallback / "open op pagina"). */
  href: string;
  /**
   * Onomkeerbaar-met-deadline: een taak die na een naderende deadline **nooit meer** te doen is
   * (bv. een sluitend blind beoordelingsvenster). De prioriteitsband houdt zo'n taak bewust laag
   * (het is geen blokkerende compliance-taak), maar op de harde top-N dashboard-rail-slice mag hij
   * daardoor niet stil wegvallen — `selectDashboardTasks` reserveert er een floor-slot voor. Buiten
   * de rank-ordening (/acties, badges) verandert dit niets.
   */
  deadlineFloor?: boolean;
}

export type PendingTask =
  | (TaskBase & { kind: "contract-sign"; collabId: string })
  | (TaskBase & { kind: "performance-submit"; collabId: string })
  | (TaskBase & { kind: "performance-approve"; perfId: string; collabId: string })
  | (TaskBase & { kind: "performance-resubmit"; perfId: string; collabId: string })
  | (TaskBase & { kind: "invoice-submit"; invId: string; collabId: string })
  | (TaskBase & { kind: "invoice-approve"; invId: string; collabId: string })
  | (TaskBase & { kind: "payment-confirm"; invId: string; collabId: string })
  | (TaskBase & { kind: "message-reply"; conversationId: string })
  | (TaskBase & {
      kind: "profile-complete";
      section: "profile-private" | "profile-completeness" | "identity";
      missing?: string[];
    })
  | (TaskBase & { kind: "company-complete"; missing?: string[] })
  | (TaskBase & { kind: "credential-fix"; credId: string; cause: "rejected" | "expiring" })
  | (TaskBase & { kind: "credential-collab-expiry"; credId: string; collabId: string })
  | (TaskBase & { kind: "credential-collab-expired"; credId: string; collabId: string })
  | (TaskBase & { kind: "credential-collab-missing"; collabId: string })
  | (TaskBase & { kind: "mandatory-document"; docType: string; cause: "missing" | "expired" })
  | (TaskBase & { kind: "admin-verify-credential"; credId: string })
  | (TaskBase & { kind: "admin-activate-user"; userId: string })
  | (TaskBase & { kind: "admin-resolve-dispute"; collabId: string })
  | (TaskBase & { kind: "admin-deletion-request"; userId: string })
  | (TaskBase & { kind: "admin-judge-no-show"; reportId: string })
  | (TaskBase & { kind: "admin-suspend-no-show"; userId: string })
  | (TaskBase & { kind: "admin-support-ticket"; ticketId: string })
  | (TaskBase & { kind: "overdue-invoice"; role: "FREELANCER" | "CLIENT" })
  | (TaskBase & { kind: "client-overdue-payment"; invId: string; collabId: string })
  | (TaskBase & { kind: "payment-due-soon" })
  | (TaskBase & { kind: "vat-deadline"; year: number; quarter: number })
  | (TaskBase & { kind: "income-tax-deadline"; taxYear: number })
  | (TaskBase & { kind: "hours-criterion"; year: number })
  | (TaskBase & { kind: "client-compliance"; collabId: string })
  | (TaskBase & { kind: "review-leave"; collabId: string })
  | (TaskBase & { kind: "collaboration-renewal"; collabId: string; role: "FREELANCER" | "CLIENT" })
  | (TaskBase & { kind: "respond-invitation"; jobId: string })
  | (TaskBase & { kind: "applications-review" })
  | (TaskBase & { kind: "propose-collaboration"; applicationId: string })
  | (TaskBase & { kind: "first-look-overdue" })
  | (TaskBase & { kind: "stale-applications" })
  | (TaskBase & { kind: "availability-refresh" })
  | (TaskBase & { kind: "draft-jobs" })
  | (TaskBase & { kind: "job-needs-attention"; jobId: string })
  | (TaskBase & { kind: "franchise-credential-expiry"; profileId: string })
  | (TaskBase & { kind: "franchise-open-dienst-acute" })
  | (TaskBase & { kind: "franchise-lead-followup" })
  | (TaskBase & { kind: "franchise-not-engageable"; profileId: string })
  | (TaskBase & { kind: "franchise-stale-service"; jobId: string })
  | (TaskBase & { kind: "franchise-stale-service-rollup" })
  | (TaskBase & { kind: "franchise-collaboration-renewal"; collabId: string })
  | (TaskBase & { kind: "franchise-client-reengagement"; companyId: string })
  | (TaskBase & { kind: "franchise-guided-setup"; step: string })
  | (TaskBase & {
      kind: "shift-handoff-decide";
      handoffId: string;
      audience: "FRANCHISER" | "ADMIN";
    });

export type TaskKind = PendingTask["kind"];

/**
 * Stabiele sortering op prioriteit (aflopend); gelijke prioriteit behoudt invoervolgorde — exact
 * hetzelfde contract als rankNextActions, zodat de takenlijst en de aggregaat-lijst overeenkomen.
 */
export function rankTasks(tasks: PendingTask[]): PendingTask[] {
  return tasks
    .map((task, index) => ({ task, index }))
    .sort((a, b) => b.task.priority - a.task.priority || a.index - b.index)
    .map(({ task }) => task);
}

/**
 * Kies de taken voor de gesneden dashboard-rail (top-`max`), met een gereserveerde floor-slot voor
 * onomkeerbaar-met-deadline-taken (`deadlineFloor`). Zo'n taak (bv. een sluitend blind
 * beoordelingsvenster) heeft bewust een lage prioriteitsband — het is geen blokkerende compliance-
 * taak — maar mag na de deadline nooit meer worden ingevuld. Op de harde slice zou hij daardoor
 * achter persistente attentie-taken kunnen wegvallen; deze functie garandeert dat elke floor-taak
 * (tot `max`) in de getoonde set zit en verdringt daarvoor de laagst-gerankte niet-floor-taken.
 * De binnenkomende rank-volgorde blijft behouden (`tasks` wordt al door `rankTasks` gesorteerd);
 * buiten de rail (/acties, badges) verandert er niets.
 */
export function selectDashboardTasks(tasks: PendingTask[], max: number): PendingTask[] {
  if (max <= 0) return [];
  if (tasks.length <= max) return tasks;

  const chosen = new Set<PendingTask>();
  // Eerst de floor-taken (in rank-volgorde, want `tasks` is al gerankt), dan de rest opvullen.
  for (const task of tasks) {
    if (chosen.size >= max) break;
    if (task.deadlineFloor) chosen.add(task);
  }
  for (const task of tasks) {
    if (chosen.size >= max) break;
    if (!task.deadlineFloor) chosen.add(task);
  }
  // Filter over de reeds-gerankte invoer → de getoonde volgorde blijft de rank-volgorde.
  return tasks.filter((task) => chosen.has(task));
}

// --- Pure builders: ruwe primitieven → PendingTask. Los testbaar; gebruikt door de enumerator. ---

const collabHref = (id: string) => `/samenwerkingen/${id}`;

export function contractSignTask(collabId: string, jobTitle: string, party: string): PendingTask {
  return {
    kind: "contract-sign",
    id: `contract-sign:${collabId}`,
    title: "Contract ondertekenen",
    subtitle: `${jobTitle} · ${party}`,
    tone: "attention",
    priority: P.contractSign,
    resolver: "oneClick",
    href: collabHref(collabId),
    collabId,
  };
}

/**
 * De ZZP'er is aan zet om uren/oplevering in te dienen op een actieve samenwerking (getekend
 * contract, nog geen ingediende prestatie). Spiegelt de cascade-fase `performance-submit`
 * (`stage.ts`, `youAreUp:true`) die op detail/lijst/dashboard "Dien je uren/oplevering in" toont —
 * zonder deze taak sprak het actiecentrum die fase tegen ("niets te doen"). Deep-link naar de
 * samenwerking: het indienen (concept vastleggen → indienen, incl. ORT) gebeurt daar, niet in één klik.
 */
export function performanceSubmitTask(collabId: string, jobTitle: string): PendingTask {
  return {
    kind: "performance-submit",
    id: `performance-submit:${collabId}`,
    title: "Dien je uren/oplevering in",
    subtitle: jobTitle,
    tone: "attention",
    priority: P.messagesAwaiting, // submit-band (55) — gelijk aan de eerste factuur-indiening
    resolver: "link", // meerstaps (uren/ORT invullen → indienen) → naar de samenwerking
    href: collabHref(collabId),
    collabId,
  };
}

export function performanceApproveTask(
  perfId: string,
  collabId: string,
  jobTitle: string,
  freelancerName: string,
): PendingTask {
  return {
    kind: "performance-approve",
    id: `performance-approve:${perfId}`,
    title: "Keur de ingediende uren/oplevering",
    subtitle: `${jobTitle} · ${freelancerName}`,
    tone: "attention",
    priority: P.complianceRipple - 20, // = approve-band (65): goedkeuring vragen is urgenter dan eigen indienen
    resolver: "drawer", // inspecteer-dan-beslis: details inzien, dan goedkeuren/afwijzen
    href: collabHref(collabId),
    perfId,
    collabId,
  };
}

export function performanceResubmitTask(
  perfId: string,
  collabId: string,
  jobTitle: string,
): PendingTask {
  return {
    kind: "performance-resubmit",
    id: `performance-resubmit:${perfId}`,
    title: "Corrigeer de afgekeurde uren en dien opnieuw in",
    subtitle: jobTitle,
    tone: "attention",
    priority: P.credentialExpiring - 8, // = rejected-band (62)
    resolver: "drawer",
    href: collabHref(collabId),
    perfId,
    collabId,
  };
}

export function invoiceSubmitTask(
  invId: string,
  collabId: string,
  jobTitle: string,
  rejected: boolean,
  /**
   * Hele dagen dat een niet-ingediende concept-factuur al klaarstaat (alleen zinvol voor de
   * concept-tak, niet voor een afgekeurde factuur). Zodra dit ≥ UNBILLED_AGING_DAYS komt, escaleert
   * de taak — exact zoals de dashboard-tegel "Nog te factureren" naar warning draait bij dezelfde
   * drempel. Zo blijft /acties (+ badge + rail) niet stil op de vlakke prioriteit hangen terwijl het
   * dashboard al alarmeert. `undefined` = geen leeftijdsbesef (gedragsbehoudend).
   */
  agingDays?: number,
): PendingTask {
  const aging = !rejected && agingDays !== undefined && agingDays >= UNBILLED_AGING_DAYS;
  return {
    kind: "invoice-submit",
    id: `invoice-submit:${invId}`,
    title: rejected
      ? "Afgekeurde factuur corrigeren en opnieuw indienen"
      : "Concept-factuur indienen",
    subtitle: aging ? `${jobTitle} · al ${plural(agingDays, "dag", "dagen")} klaar` : jobTitle,
    tone: "attention",
    // Afgekeurd (62) > verouderde concept (59) > verse concept (55). De verouderde concept staat
    // net onder een reeds-verstreken factuur (overdueInvoice 60): het is eigen, nog-niet-verzonden geld.
    priority: rejected
      ? P.credentialExpiring - 8
      : aging
        ? P.conceptInvoiceAging
        : P.messagesAwaiting,
    resolver: "oneClick",
    href: collabHref(collabId),
    invId,
    collabId,
  };
}

export function invoiceApproveTask(invId: string, collabId: string, jobTitle: string): PendingTask {
  return {
    kind: "invoice-approve",
    id: `invoice-approve:${invId}`,
    title: "Keur de ingediende factuur",
    subtitle: jobTitle,
    tone: "attention",
    priority: P.complianceRipple - 20, // approve-band (65)
    resolver: "drawer", // inspecteer-dan-beslis: factuur inzien, dan goedkeuren/afwijzen
    href: collabHref(collabId),
    invId,
    collabId,
  };
}

export function paymentConfirmTask(
  invId: string,
  collabId: string,
  jobTitle: string,
  overdue = false,
): PendingTask {
  // Een APPROVED-factuur wacht op de betaal-registratie (ZZP'er, na rechtstreekse betaling); zodra de
  // vervaldatum verstrijkt draait de betaal-herinnering hem naar OVERDUE. In beide gevallen is exact
  // dezelfde ZZP-actie ("betaling markeren") aan zet — precies zoals cascade/stage.ts. Alleen bij OVERDUE
  // klimt de toon naar "attention" en de prioriteit naar de overdue-band, zodat het actiecentrum de
  // fase van het samenwerkingsscherm nooit tegenspreekt.
  return {
    kind: "payment-confirm",
    id: `payment-confirm:${invId}`,
    title: "Markeer de betaling zodra je bent betaald",
    subtitle: overdue ? `${jobTitle} · over de vervaldatum` : jobTitle,
    tone: overdue ? "attention" : "info",
    priority: overdue ? P.overdueInvoice : P.overdueInvoice - 2, // overdue-band (60) of payment-band (58)
    resolver: "oneClick",
    href: collabHref(collabId),
    invId,
    collabId,
  };
}

export function messageReplyTask(
  conversationId: string,
  withWhom: string,
  subject?: string | null,
): PendingTask {
  return {
    kind: "message-reply",
    id: `message-reply:${conversationId}`,
    title: `Beantwoord ${withWhom}`,
    subtitle: subject ? `Over: ${subject}` : "Nieuw bericht",
    tone: "attention",
    priority: P.messagesAwaiting,
    resolver: "reply",
    href: `/berichten/${conversationId}`,
    conversationId,
  };
}

export function profilePrivateTask(): PendingTask {
  return {
    kind: "profile-complete",
    id: "profile-complete:private",
    title: "Je profiel staat op privé — opdrachtgevers kunnen je niet vinden",
    tone: "attention",
    priority: P.blocking,
    resolver: "drawer",
    href: "/profiel/bewerken",
    section: "profile-private",
  };
}

export function profileCompletenessTask(score: number, missing: string[]): PendingTask {
  return {
    kind: "profile-complete",
    id: "profile-complete:fields",
    title: `Profiel is ${score}% compleet`,
    subtitle: missing.length ? `Voeg toe: ${missing.slice(0, 3).join(", ")}` : undefined,
    tone: "info",
    priority: P.completeness,
    resolver: "drawer",
    href: "/profiel/bewerken",
    section: "profile-completeness",
    missing,
  };
}

export function identityVerifyTask(): PendingTask {
  return {
    kind: "profile-complete",
    id: "profile-complete:identity",
    title: "Verifieer je identiteit voor een hoger vertrouwensniveau",
    tone: "attention",
    priority: P.identity,
    resolver: "drawer",
    href: "/account",
    section: "identity",
  };
}

export function companyCompletenessTask(score: number, missing: string[]): PendingTask {
  return {
    kind: "company-complete",
    id: "company-complete:fields",
    title: `Bedrijfsprofiel is ${score}% compleet`,
    subtitle: missing.length ? `Voeg toe: ${missing.slice(0, 3).join(", ")}` : undefined,
    tone: "info",
    priority: P.completeness,
    resolver: "drawer",
    href: "/bedrijf",
    missing,
  };
}

export function credentialFixTask(
  credId: string,
  title: string,
  cause: "rejected" | "expiring",
): PendingTask {
  return {
    kind: "credential-fix",
    id: `credential-fix:${credId}`,
    title:
      cause === "rejected"
        ? "Afgewezen certificaat opnieuw indienen"
        : // Een certificaat vernieuwt zichzelf niet — het verloopt; consistent met de notificatie
          // ("Certificaat verloopt binnenkort") en de next-action-engine.
          "Certificaat verloopt binnenkort",
    subtitle: title,
    tone: "attention",
    priority: cause === "rejected" ? P.credentialRejected : P.credentialExpiring,
    resolver: "drawer",
    href: `/certificaten/${credId}/bewerken`,
    credId,
    cause,
  };
}

/**
 * Vooruitkijkende waarschuwing: een door een lopende/voorgestelde samenwerking VEREIST certificaat
 * verloopt binnenkort. Urgenter dan de generieke "certificaat verloopt binnenkort"-taak — er leunt
 * een concrete opdracht op — dus hoger geprioriteerd, en het noemt de samenwerking(en) op naam.
 * Deep-link naar het vernieuw-formulier van het certificaat (dezelfde actie als credentialFixTask).
 */
export function credentialCollabExpiryTask(input: {
  credId: string;
  credentialTitle: string;
  daysUntilExpiry: number;
  collabId: string;
  companyName: string;
  jobTitle: string;
  extraCollabCount: number;
}): PendingTask {
  const { daysUntilExpiry, companyName, jobTitle, extraCollabCount } = input;
  const when =
    daysUntilExpiry <= 0
      ? "Verloopt vandaag"
      : daysUntilExpiry === 1
        ? "Verloopt morgen"
        : `Verloopt over ${daysUntilExpiry} dagen`;
  const extra = extraCollabCount > 0 ? ` (+${extraCollabCount} andere)` : "";
  return {
    kind: "credential-collab-expiry",
    id: `credential-collab-expiry:${input.credId}`,
    title: `${input.credentialTitle} verloopt tijdens je opdracht`,
    subtitle: `${when} · vernieuw het voor je opdracht bij ${companyName} (${jobTitle})${extra}`,
    tone: "attention",
    priority: P.credentialExpiringForCollab,
    resolver: "link",
    href: `/certificaten/${input.credId}/bewerken`,
    credId: input.credId,
    collabId: input.collabId,
  };
}

/**
 * Acuut: een door een lopende/voorgestelde samenwerking VEREIST (niet-verplicht) certificaat is REEDS
 * verlopen, zonder geldige vervanger. Freelancer-spiegel van de opdrachtgever-alert (compliance-ripple):
 * de ZZP'er is de enige die het kan vernieuwen. Urgenter dan de vooruitkijkende "verloopt tijdens je
 * opdracht"-taak (die is nog niet verlopen) — dus hoger geprioriteerd. Deep-link naar het vernieuw-
 * formulier van het certificaat (dezelfde actie als credentialFixTask / credentialCollabExpiryTask).
 */
export function credentialCollabExpiredTask(input: {
  credId: string;
  credentialTitle: string;
  collabId: string;
  companyName: string;
  jobTitle: string;
  extraCollabCount: number;
}): PendingTask {
  const { companyName, jobTitle, extraCollabCount } = input;
  const extra = extraCollabCount > 0 ? ` (+${extraCollabCount} andere)` : "";
  return {
    kind: "credential-collab-expired",
    id: `credential-collab-expired:${input.credId}`,
    title: `${input.credentialTitle} is verlopen tijdens je opdracht`,
    subtitle: `Vernieuw het direct — je opdracht bij ${companyName} (${jobTitle})${extra} vereist dit certificaat`,
    tone: "attention",
    priority: P.credentialExpiredForCollab,
    resolver: "link",
    href: `/certificaten/${input.credId}/bewerken`,
    credId: input.credId,
    collabId: input.collabId,
  };
}

/**
 * Acuut: een door een lopende/voorgestelde samenwerking VEREIST (niet-verplicht) certificaattype
 * ONTBREEKT volledig — de ZZP'er heeft er geen bruikbaar bewijsstuk van (nooit aangeleverd, of alleen
 * een concept). Freelancer-spiegel van de opdrachtgever-alert (compliance-ripple "missing"): de ZZP'er
 * is de enige die het kan aanleveren, terwijl de opdrachtgever al "mist een vereist certificaat — vraag
 * om aan te leveren" ziet. Deep-link: een bestaand concept bewerken/indienen, of het aanmaak-formulier
 * met vooringevuld type. Iets minder urgent dan een REEDS-verlopen exemplaar (dat leunde al op een
 * eerder aangeleverd bewijsstuk), dus net eronder geprioriteerd.
 */
export function credentialCollabMissingTask(input: {
  type: CredentialType;
  draftCredentialId: string | null;
  collabId: string;
  companyName: string;
  jobTitle: string;
  extraCollabCount: number;
}): PendingTask {
  const { type, draftCredentialId, companyName, jobTitle, extraCollabCount } = input;
  const label = CREDENTIAL_TYPE_LABEL[type];
  const extra = extraCollabCount > 0 ? ` (+${extraCollabCount} andere)` : "";
  return {
    kind: "credential-collab-missing",
    id: `credential-collab-missing:${type}`,
    title: `Vereist certificaat ontbreekt: ${label}`,
    subtitle: `Lever het aan — je opdracht bij ${companyName} (${jobTitle})${extra} vereist dit certificaat`,
    tone: "attention",
    priority: P.credentialMissingForCollab,
    resolver: "link",
    href: draftCredentialId
      ? `/certificaten/${draftCredentialId}/bewerken`
      : `/certificaten/nieuw?type=${type}`,
    collabId: input.collabId,
  };
}

/**
 * Verplicht document (VOG/verzekering) ontbreekt of is verlopen. Dit blokkeert de inzetbaarheid
 * van de ZZP'er — zonder deze taak zegt "Wat vraagt aandacht" ten onrechte "niets te doen" terwijl
 * de inzetbaarheidskaart rood "Nog niet inzetbaar" toont. In beoordeling = geen taak (wacht op admin).
 */
export function mandatoryDocumentTask(
  docType: string,
  label: string,
  cause: "missing" | "expired",
  /**
   * Id van het bestaande (verlopen) certificaat. Alleen zinvol bij cause "expired": dan deep-linkt
   * de taak naar het VERLENGEN van dat document (bewerk-pagina) i.p.v. een nieuw aanmaken. Ontbreekt
   * het (of cause "missing"), dan valt de link terug op het aanmaak-formulier met vooringevuld type.
   */
  renewCredId?: string,
): PendingTask {
  return {
    kind: "mandatory-document",
    id: `mandatory-document:${docType}`,
    title:
      cause === "missing"
        ? `Verplicht document ontbreekt: ${label}`
        : `Verplicht document verlopen: ${label}`,
    subtitle:
      cause === "missing"
        ? "Zonder dit document ben je niet inzetbaar — upload het bewijsstuk"
        : "Zonder dit document ben je niet inzetbaar — vernieuw het bewijsstuk",
    tone: "attention",
    priority: P.mandatoryDoc,
    resolver: "link",
    href:
      cause === "expired" && renewCredId
        ? `/certificaten/${renewCredId}/bewerken`
        : `/certificaten/nieuw?type=${docType}`,
    docType,
    cause,
  };
}

export function adminVerifyCredentialTask(
  credId: string,
  title: string,
  submitterName: string,
): PendingTask {
  return {
    kind: "admin-verify-credential",
    id: `admin-verify-credential:${credId}`,
    title: `Beoordeel het certificaat van ${submitterName}`,
    subtitle: title,
    tone: "attention",
    priority: P.verificationQueue,
    resolver: "drawer", // inspecteer-dan-beslis: bewijsstuk bekijken, dan goedkeuren/afwijzen
    href: "/admin/verificaties",
    credId,
  };
}

export function adminActivateUserTask(userId: string, name: string): PendingTask {
  return {
    kind: "admin-activate-user",
    id: `admin-activate-user:${userId}`,
    title: "Keur de gebruiker goed",
    subtitle: name,
    tone: "info",
    priority: P.pendingUsers,
    resolver: "oneClick",
    href: "/admin/gebruikers?status=PENDING",
    userId,
  };
}

export function adminResolveDisputeTask(collabId: string, jobTitle: string): PendingTask {
  return {
    kind: "admin-resolve-dispute",
    id: `admin-resolve-dispute:${collabId}`,
    title: "Beoordeel het dispuut — samenwerking bevroren",
    subtitle: jobTitle,
    tone: "attention",
    priority: P.disputeOpen,
    resolver: "oneClick",
    href: collabHref(collabId),
    collabId,
  };
}

export function adminDeletionRequestTask(userId: string, name: string): PendingTask {
  return {
    kind: "admin-deletion-request",
    id: `admin-deletion-request:${userId}`,
    title: "AVG-verwijderverzoek beoordelen",
    subtitle: name,
    tone: "attention",
    priority: P.blocking,
    resolver: "link", // onomkeerbaar → bewust achter de bevestigingsflow, niet één klik
    href: "/admin/gebruikers?deletion=1",
    userId,
  };
}

export function adminJudgeNoShowTask(
  reportId: string,
  freelancerName: string,
  jobTitle: string,
): PendingTask {
  return {
    kind: "admin-judge-no-show",
    id: `admin-judge-no-show:${reportId}`,
    title: "Beoordeel no-show-melding (gegrond/ongegrond)",
    subtitle: `${freelancerName} · ${jobTitle}`,
    tone: "attention",
    priority: P.disputeOpen,
    resolver: "link",
    href: "/admin/no-shows",
    reportId,
  };
}

export function adminSuspendNoShowTask(
  userId: string,
  name: string,
  unjustified: number,
): PendingTask {
  return {
    kind: "admin-suspend-no-show",
    id: `admin-suspend-no-show:${userId}`,
    title: "Uitschrijving beoordelen — grens ongegronde no-shows bereikt",
    subtitle: `${name} · ${unjustified} ongegronde no-shows`,
    tone: "attention",
    priority: P.blocking,
    resolver: "link", // schorsen is ingrijpend → bewust via de no-show-pagina, niet één klik
    href: "/admin/no-shows",
    userId,
  };
}

/**
 * Openstaand supportticket dat een medewerker moet oppakken (nieuw/onbeantwoord/geëscaleerd/heropend).
 * Eén taak per ticket zodat de admin het concreet ziet; de afhandeling (antwoorden/oplossen) gebeurt
 * op de helpdesk-pagina (link-resolver). Voorheen ontbrak deze taak volledig op /acties — de
 * helpdesk-wachtrij was daardoor onzichtbaar in het actiecentrum.
 */
export function adminSupportTicketTask(
  ticketId: string,
  subject: string,
  statusLabel: string,
): PendingTask {
  return {
    kind: "admin-support-ticket",
    id: `admin-support-ticket:${ticketId}`,
    title: "Beantwoord het supportticket",
    subtitle: `${subject} · ${statusLabel}`,
    tone: "attention",
    priority: P.supportOpen,
    resolver: "link",
    href: "/admin/support",
    ticketId,
  };
}

export function overdueInvoiceTask(
  count: number,
  role: "FREELANCER" | "CLIENT",
  variant: "chase" | "confirm" = "chase",
): PendingTask {
  // Twee ZZP-varianten met een verschillende actie (zie overdueInvoiceBreakdown):
  // - "confirm" (cascade-facturen): de ZZP'er registreert zélf de betaling zodra die binnen is — de
  //   opdrachtgever betaalt rechtstreeks en heeft geen "Markeer als betaald"-knop (canPay = !cascade).
  // - "chase" (legacy/handmatig): de opdrachtgever is aan zet, de ZZP'er volgt op.
  // De opdrachtgever ziet alleen legacy-facturen ("Markeer als betaald"). Distinct id per variant zodat
  // beide rollups naast elkaar kunnen bestaan zonder te dedupen op key.
  const confirm = variant === "confirm";
  const subtitle = confirm
    ? "Markeer de betaling zodra je bent betaald"
    : role === "FREELANCER"
      ? "Volg op bij de opdrachtgever"
      : "Markeer als betaald";
  return {
    kind: "overdue-invoice",
    id: `overdue-invoice:${role}${confirm ? ":cascade" : ""}`,
    title: `${plural(count, "factuur", "facturen")} over de vervaldatum`,
    subtitle,
    tone: "attention",
    priority: P.overdueInvoice,
    resolver: "link",
    href: "/facturen",
    role,
  };
}

/**
 * Opdrachtgever-signaal voor een cascade-factuur die OVER de vervaldatum staat (lifecycleStatus=OVERDUE).
 * Spiegelt `paymentConfirmTask(overdue)` van de ZZP'er: in de cascade betaalt de opdrachtgever rechtstreeks
 * (out-of-band) en heeft hij géén "Markeer als betaald"-knop (`canPay = !cascade`), terwijl de ZZP'er de
 * betaling registreert. Wordt een cascade-factuur OVERDUE, dan zag de opdrachtgever tot nu toe **niets** —
 * terwijl OVERDUE "betaald maar nog niet bevestigd" niet kan onderscheiden van "nooit betaald" (het
 * geparkeerde run-53 "Besluit 1"-gat). Deze read-only next-action wijst de opdrachtgever naar de samenwerking
 * zodat hij kan betalen (als dat nog niet gebeurd is) óf de ZZP'er kan vragen de betaling te bevestigen. De
 * taak verdwijnt zodra de ZZP'er de betaling registreert (→ PAID, geen OVERDUE meer): geen dode/blijvende knop.
 * Deep-link (`resolver:"link"`) naar het samenwerkingsdetail; géén nieuwe betaal-mutatie (het out-of-band-model
 * blijft ongewijzigd).
 */
export function clientCascadeOverduePaymentTask(
  invId: string,
  collabId: string,
  jobTitle: string,
  freelancerName: string,
): PendingTask {
  return {
    kind: "client-overdue-payment",
    id: `client-overdue-payment:${invId}`,
    title: `Betaling aan ${freelancerName} staat open`,
    subtitle: `${jobTitle} · over de vervaldatum — betaal 'm of laat de betaling bevestigen`,
    tone: "attention",
    priority: P.clientCascadeOverduePayment,
    resolver: "link",
    href: collabHref(collabId),
    invId,
    collabId,
  };
}

/**
 * Pre-due betaal-nudge voor de opdrachtgever: N facturen vervallen binnenkort (nog niet te laat).
 * Zachtere tegenhanger van `overdueInvoiceTask` (tone "info", lagere band) — op tijd betalen houdt
 * de zichtbare betaalreputatie sterk (`client-payment-reputation.ts`). Alleen legacy/handmatige
 * facturen (waar de opdrachtgever echt een "Markeer als betaald"-knop heeft); zie
 * `paymentDueSoonWhere` voor de scoping.
 */
export function paymentDueSoonTask(count: number): PendingTask {
  return {
    kind: "payment-due-soon",
    id: "payment-due-soon:CLIENT",
    title: `${plural(count, "factuur vervalt", "facturen vervallen")} binnenkort`,
    subtitle: "Betaal op tijd — dat houdt je betaalreputatie sterk",
    tone: "info",
    priority: P.paymentDueSoon,
    resolver: "link",
    href: "/facturen",
  };
}

export function applicationsReviewTask(count: number): PendingTask {
  return {
    kind: "applications-review",
    id: "applications-review",
    title: `${plural(count, "nieuwe reactie", "nieuwe reacties")}`,
    subtitle: "Beoordeel de kandidaten",
    tone: "attention",
    priority: P.applications,
    resolver: "link",
    href: "/kandidaten",
  };
}

/**
 * De opdrachtgever heeft een reactie geaccepteerd maar er nog géén samenwerkingsvoorstel op gestuurd
 * (`proposeCollaboration`, ACCEPTED → PROPOSED-collaboration). Tot dat gebeurt bestaat er geen
 * collaboration en wacht de ZZP'er ("Geaccepteerd! Wacht op een samenwerkingsvoorstel") — een gemaakte
 * keuze blijft in limbo. Deze taak rondt de hire af: één taak per geaccepteerde-maar-onvoorgestelde
 * reactie, deep-link naar `/kandidaten?open=<applicationId>` (opent direct de rij met het
 * voorstelformulier). Priority net onder `contractSign` (het ná-voorstel-stap): een reeds-genomen
 * hire-beslissing weegt zwaarder dan nieuwe/oude reacties beoordelen, lager dan een al-voorgesteld
 * contract dat op een handtekening wacht.
 */
export function proposeCollaborationTask(
  applicationId: string,
  jobTitle: string,
  freelancerName: string,
  /**
   * Hele dagen dat de kandidaat al geaccepteerd is zónder samenwerkingsvoorstel. Zodra dit ≥
   * PROPOSAL_STALL_DAYS komt, escaleert de taak (prioriteit + subtitel) — de geaccepteerde ZZP'er
   * hangt dan in limbo. `undefined` = geen leeftijdsbesef (gedragsbehoudend).
   */
  agingDays?: number,
  /**
   * True = een re-voorstel: het vorige voorstel werd geannuleerd (nog vóór ondertekening) en mag
   * opnieuw. Past de copy aan zodat de opdrachtgever begrijpt dat het om een nieuw voorstel gaat.
   * Falsy = byte-identiek aan het oorspronkelijke gedrag.
   */
  reproposal?: boolean,
): PendingTask {
  const stalled = agingDays !== undefined && agingDays >= PROPOSAL_STALL_DAYS;
  return {
    kind: "propose-collaboration",
    id: `propose-collaboration:${applicationId}`,
    title: reproposal
      ? `Stuur ${freelancerName} een nieuw samenwerkingsvoorstel`
      : `Stuur ${freelancerName} een samenwerkingsvoorstel`,
    subtitle: reproposal
      ? stalled
        ? `${jobTitle} · vorige voorstel geannuleerd, al ${plural(agingDays, "dag", "dagen")} — rond de hire af`
        : `Je vorige voorstel voor ${jobTitle} is geannuleerd — stuur een nieuw voorstel`
      : stalled
        ? `${jobTitle} · al ${plural(agingDays, "dag", "dagen")} geaccepteerd — rond de hire af`
        : `Je accepteerde de reactie op ${jobTitle} — rond de samenwerking af`,
    tone: "attention",
    priority: stalled ? P.proposeCollaborationStalled : P.proposeCollaboration,
    resolver: "link",
    href: `/kandidaten?open=${applicationId}`,
    applicationId,
  };
}

/**
 * De opdrachtgever liet één of meer NEW-reacties al voorbij de ghosting-risicodrempel wachten op een
 * EERSTE blik (nog nooit bekeken). Urgenter dan de leeftijdloze "nieuwe reacties"-telling
 * (`applicationsReviewTask`, P.applications) én dan een reeds-bekeken kandidaat die op een beslissing
 * wacht (`staleApplicationsTask`, P.staleApplications): een reactie die nooit werd geopend is de
 * hardste responsiviteitsfaal. De enumerator trekt deze onbekeken-oude reacties af van de generieke
 * "nieuwe reacties"-telling, zodat dezelfde kandidaat nooit in beide taken opduikt. Deep-link naar de
 * kandidatenpagina waar de eerste blik valt.
 */
export function firstLookOverdueTask(summary: FirstLookOverdueSummary): PendingTask {
  return {
    kind: "first-look-overdue",
    id: "first-look-overdue",
    title: `${plural(summary.count, "kandidaat wacht", "kandidaten wachten")} op een eerste reactie`,
    subtitle: `Al ${plural(summary.oldestDays, "dag", "dagen")} niet bekeken — reageer voor ze afhaken`,
    tone: "attention",
    priority: P.firstLookOverdue,
    resolver: "link",
    href: "/kandidaten",
  };
}

/**
 * De opdrachtgever laat één of meer kandidaten (VIEWED/SHORTLIST) al langer dan gebruikelijk op een
 * beslissing wachten. Aparte taak naast "nieuwe reacties" (die alleen NEW dekt): een reeds-bekeken
 * kandidaat die blijft liggen haakt stil af. Tone "attention" met een deep-link naar de
 * kandidatenpagina waar de beslissing valt.
 */
export function staleApplicationsTask(summary: StaleApplicationsSummary): PendingTask {
  return {
    kind: "stale-applications",
    id: "stale-applications",
    title: `${plural(summary.count, "kandidaat wacht", "kandidaten wachten")} op je beslissing`,
    subtitle: `Al ${plural(summary.oldestDays, "dag", "dagen")} onbeslist — reageer voor je ze verliest`,
    tone: "attention",
    priority: P.staleApplications,
    resolver: "link",
    href: "/kandidaten",
  };
}

/**
 * De opdrachtgever werkt in een lopende samenwerking met een ZZP'er wiens vereist certificaat een
 * gat vertoont — ontbreekt/verlopen (NON_COMPLIANT: er is NÚ een compliance-gat op lopend werk) of
 * dreigt te vervallen (WARNING: binnenkort verlopend / in beoordeling). Dit is de zwaarst-wegende
 * opdrachtgever-actie (P.complianceRipple, spiegelt de aggregaat-engine `clientNextActions`): hij
 * moet de ZZP'er om vernieuwing vragen vóór het werk doorloopt — precies zoals de bemiddelaar de
 * `franchiseCredentialExpiryTask` krijgt voor zijn roster. Eén taak per samenwerking; deep-link naar
 * het samenwerkingsdetail waar de compliance-status en het gesprek staan. Zonder deze taak ontbrak
 * het hoogst-geprioriteerde compliance-signaal van de opdrachtgever volledig in `/acties`, de
 * "Volgende acties"-rail en de zijbalk-badge (die alle door de item-engine gevoed worden).
 */
export function clientComplianceTask(
  collabId: string,
  freelancerName: string,
  jobTitle: string,
  alert: CredentialAlert,
): PendingTask {
  const label = (list: readonly CredentialType[]) =>
    list.map((t) => CREDENTIAL_TYPE_LABEL[t]).join(", ");
  const gap = alert.missing.length > 0 || alert.expired.length > 0;
  let title: string;
  if (alert.missing.length > 0)
    title = `${freelancerName} mist een vereist certificaat (${label(alert.missing)})`;
  else if (alert.expired.length > 0)
    title = `Certificaat van ${freelancerName} is verlopen (${label(alert.expired)})`;
  else if (alert.expiringSoon.length > 0)
    title = `Certificaat van ${freelancerName} verloopt binnenkort (${label(alert.expiringSoon)})`;
  else title = `Certificaat van ${freelancerName} in beoordeling (${label(alert.inReview)})`;
  return {
    kind: "client-compliance",
    id: `client-compliance:${collabId}`,
    title,
    subtitle: gap
      ? `${jobTitle} · vraag de ZZP'er om te vernieuwen`
      : `${jobTitle} · handel vóór het certificaat vervalt`,
    tone: "attention",
    // NON_COMPLIANT = acuut gat op lopend werk (85, hoogste opdrachtgever-actie); WARNING = handel
    // vóór het vervalt (70, gelijk aan de ZZP-zijdige "certificaat verloopt binnenkort"-band).
    priority: gap ? P.complianceRipple : P.credentialExpiring,
    resolver: "link",
    href: collabHref(collabId),
    collabId,
  };
}

/**
 * Nodig een partij (ZZP'er óf opdrachtgever) uit om een afgeronde samenwerking te beoordelen zolang
 * het blinde venster nog open is. Vult het tweezijdige reputatiesysteem: zonder deze nudge bleef de
 * beoordeling stil op het samenwerkingsdetail staan en sloot het venster vaak ongebruikt. Zachte
 * reputatie-nudge (tone "info"); pas als het venster bijna sluit (≤ 3 dagen) attention, want daarna
 * kan niemand meer beoordelen (anti-vergeldingsslot). Deep-link naar het samenwerkingsdetail waar het
 * beoordelingsformulier onder exact dezelfde conditie (`canLeaveReview`) staat — geen nieuwe UI nodig.
 */
export function reviewLeaveTask(
  collabId: string,
  jobTitle: string,
  counterparty: string,
  daysLeft: number,
): PendingTask {
  const closingSoon = daysLeft <= 3;
  const window =
    daysLeft <= 0
      ? "venster sluit vandaag"
      : `nog ${plural(daysLeft, "dag", "dagen")} om te beoordelen`;
  return {
    kind: "review-leave",
    id: `review-leave:${collabId}`,
    title: `Beoordeel ${counterparty}`,
    subtitle: `${jobTitle} · ${window}`,
    tone: closingSoon ? "attention" : "info",
    // Als het venster bijna sluit escaleert niet alleen de toon maar óók de prioriteit: een blind
    // beoordelingsvenster dat straks dicht is, kan daarna nóóit meer worden ingevuld — het mag dus
    // niet onder cosmetische info-nudges (completeness/beschikbaarheid) van de 6-item dashboardrail
    // vallen. Buiten dat venster blijft het een rustige reputatie-nudge onderaan.
    priority: closingSoon ? P.reviewPromptClosing : P.reviewPrompt,
    // Bijna-gesloten venster = onomkeerbaar-met-deadline: reserveer een floor-slot op de dashboard-
    // rail zodat het niet achter persistente attentie-taken (mandatoryDoc … applications) wegvalt.
    ...(closingSoon ? { deadlineFloor: true } : {}),
    resolver: "link", // meerstaps formulier (score + toelichting) → naar de samenwerking
    href: collabHref(collabId),
    collabId,
  };
}

/**
 * Een lopende (ACTIVE) samenwerking nadert (`ending_soon`) of passeerde (`overdue`) haar einddatum:
 * plan tijdig een vervolg zodat de inzet niet stilvalt (opdrachtgever raakt een goede ZZP'er niet
 * kwijt; de ZZP'er lijnt de volgende opdracht op tijd op — benchmark Temper/Pidz "verleng je serie").
 * Symmetrisch voor beide partijen. Zonder deze taak leefde het vervolgsignaal alléén op het
 * samenwerkingsdetail (`RenewalNudge`) en ontbrak het in `/acties`, de zijbalk-badge én de dashboard-
 * rail (alle door de item-engine gevoed). Deep-link naar het samenwerkingsdetail, waar de volledige
 * nudge met de rol-passende vervolgactie (vervolgopdracht plaatsen / beschikbaarheid bijwerken) staat —
 * geen dubbele UI. Advies, geen blokkade: `overdue` → attention, `ending_soon` → info.
 */
export function collaborationRenewalTask(
  collabId: string,
  role: "FREELANCER" | "CLIENT",
  counterparty: string,
  jobTitle: string,
  phase: CollaborationRenewalPhase,
  daysRemaining: number | null,
): PendingTask {
  const overdue = phase === "overdue";
  let window: string;
  if (overdue) window = "einddatum verstreken";
  else if (daysRemaining === 0) window = "loopt vandaag af";
  else if (daysRemaining === 1) window = "loopt morgen af";
  else window = `loopt over ${plural(daysRemaining ?? 0, "dag", "dagen")} af`;
  return {
    kind: "collaboration-renewal",
    id: `collaboration-renewal:${collabId}`,
    title: `Plan een vervolg met ${counterparty}`,
    subtitle: `${jobTitle} · ${window}`,
    tone: overdue ? "attention" : "info",
    priority: P.collaborationRenewal,
    resolver: "link", // rol-passende vervolgactie staat op het samenwerkingsdetail
    href: collabHref(collabId),
    collabId,
    role,
  };
}

/**
 * Een opdrachtgever heeft de ZZP'er dírect uitgenodigd voor een opdracht (`JOB_INVITED`) en hij heeft
 * er nog niet op gereageerd. Dat is de hoogst-intente inbound lead op een marktplaats (benchmark
 * LinkedIn/Malt/Upwork "invited to apply"): iemand koos jóu specifiek. Tot nu leefde die uitnodiging
 * alleen als band op `/opdrachten` (find-work) — wie die pagina niet opende, miste 'm en de gerichte
 * invite verliep stil. Deze taak brengt 'm naar /acties, de zijbalk-badge én de dashboard-rail (alle
 * door de item-engine gevoed), met een deep-link naar de opdracht waar de ZZP'er reageert. Advies,
 * geen blokkade: `info`, maar `attention` zodra de uitnodiging ≥ `INVITATION_AGING_DAYS` dagen stil
 * blijft (de kans dat de opdracht aan een ander gaat groeit).
 */
export function respondInvitationTask(
  jobId: string,
  jobTitle: string,
  companyName: string,
  ageDays: number,
): PendingTask {
  const aging = ageDays >= INVITATION_AGING_DAYS;
  return {
    kind: "respond-invitation",
    id: `respond-invitation:${jobId}`,
    title: `Reageer op de uitnodiging van ${companyName}`,
    subtitle: `${jobTitle} · ${invitationAgeLabel(ageDays)}`,
    tone: aging ? "attention" : "info",
    priority: P.respondInvitation,
    resolver: "link", // meerstaps (motivatie schrijven → reageren) → naar de opdracht
    href: `/opdrachten/${jobId}`,
    jobId,
  };
}

/**
 * De ZZP'er heeft een beschikbaarheidsagenda gedeeld die volledig is verlopen (alle vensters in het
 * verleden). Opdrachtgevers zien daardoor niet meer wanneer hij kan starten — een verholen rem op de
 * matching. Zachte findability-nudge (tone "info"): deep-link naar de beschikbaarheidspagina.
 */
export function availabilityRefreshTask(): PendingTask {
  return {
    kind: "availability-refresh",
    id: "availability-refresh:stale",
    title: "Je gedeelde beschikbaarheid is verlopen",
    subtitle: "Werk je agenda bij zodat opdrachtgevers zien wanneer je kunt starten",
    tone: "info",
    priority: P.availabilityStale,
    resolver: "link",
    href: "/beschikbaarheid",
  };
}

export function draftJobsTask(count: number): PendingTask {
  return {
    kind: "draft-jobs",
    id: "draft-jobs",
    title: `${plural(count, "concept-opdracht", "concept-opdrachten")}`,
    subtitle: "Publiceren?",
    tone: "info",
    priority: P.drafts,
    resolver: "link",
    href: "/opdrachten",
  };
}

/**
 * Een gepubliceerde opdracht die koud loopt — geen of te weinig kandidaten voor de tijd dat hij open
 * staat (`summarizeVacancyPerformance.attention`). Tot nu toe zag de opdrachtgever dat alleen op de
 * opdracht-lijst/-detail en als achtergrondnotificatie; hier wordt het een concrete next-action zodat
 * het naast de rest van "wat moet ik nu doen" komt. `headline` is de pace-kop uit het gedeelde
 * vacaturetempo-signaal ("Weinig respons" / "Traag tempo"); deep-link naar het opdracht-detail waar de
 * tarief-/eisen-diagnose én de bijstuur-knoppen staan.
 */
export function jobNeedsAttentionTask(
  jobId: string,
  jobTitle: string,
  headline: string,
): PendingTask {
  return {
    kind: "job-needs-attention",
    id: `job-needs-attention:${jobId}`,
    title: jobTitle,
    subtitle: `${headline} — stel het tarief, de eisen of de zichtbaarheid bij`,
    tone: "attention",
    priority: P.jobNeedsAttention,
    resolver: "link", // bijsturen is meerstaps (tarief/eisen/omschrijving) → naar het opdracht-detail
    href: `/opdrachten/${jobId}`,
    jobId,
  };
}

// --- Bemiddelaar (FRANCHISER) — doorlopende tenant-taken ------------------------------------------

/**
 * Eén taak per tenant-ZZP'er met geverifieerde certificaten die binnenkort verlopen — de
 * bemiddelaar staat in voor de roster-compliance. Geaggregeerd per ZZP'er (niet per certificaat)
 * zodat de lijst rustig blijft; deep-link naar het ZZP'er-detail om de vernieuwing op te volgen.
 */
export function franchiseCredentialExpiryTask(
  profileId: string,
  name: string,
  count: number,
): PendingTask {
  return {
    kind: "franchise-credential-expiry",
    id: `franchise-credential-expiry:${profileId}`,
    title: `${name}: ${plural(count, "certificaat verloopt", "certificaten verlopen")} binnenkort`,
    subtitle: "Vraag de ZZP'er om te vernieuwen — roster-compliance",
    tone: "attention",
    priority: P.franchiserCredentialExpiring,
    resolver: "link",
    href: `/franchise/zzpers/${profileId}`,
    profileId,
  };
}

/** Leads waarvan de geplande opvolgdatum is verstreken (acquisitie-nudge voor de bemiddelaar). */
const QUARTER_ORDINAL = ["1e", "2e", "3e", "4e"] as const;
const VAT_DEADLINE_DATE = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

/**
 * BTW-aangifte-deadline als taak: het meest recent afgesloten kwartaal moet uiterlijk op de
 * indieningsdatum aangegeven én betaald zijn. Verschijnt alleen wanneer de deadline nadert of
 * verstreken is en er een saldo te melden is (zie `vatDeadlineNeedsAction`). Deep-link naar de
 * boekhouding, waar het kwartaalsaldo en de aangifte-details staan. Geen fiscaal advies.
 */
export function vatDeadlineTask(summary: VatDeadlineSummary): PendingTask {
  const qLabel = `${QUARTER_ORDINAL[summary.quarter - 1]} kwartaal ${summary.year}`;
  const amount =
    summary.balanceCents >= 0
      ? `${formatEuro(summary.balanceCents)} af te dragen`
      : `${formatEuro(-summary.balanceCents)} terug te vorderen`;
  const timing =
    summary.status === "overdue"
      ? `${plural(Math.abs(summary.daysUntil), "dag", "dagen")} te laat`
      : summary.daysUntil <= 0
        ? `uiterlijk vandaag (${VAT_DEADLINE_DATE.format(summary.deadline)})`
        : `voor ${VAT_DEADLINE_DATE.format(summary.deadline)} · nog ${plural(summary.daysUntil, "dag", "dagen")}`;
  return {
    kind: "vat-deadline",
    id: `vat-deadline:${summary.year}-Q${summary.quarter}`,
    title: `BTW-aangifte ${qLabel}`,
    subtitle: `${timing} · ${amount}`,
    tone: "attention",
    priority: summary.status === "overdue" ? P.vatDeadlineOverdue : P.vatDeadlineDueSoon,
    resolver: "link", // aangifte doe je bij de Belastingdienst; hier de boekhouding met de cijfers
    href: "/administratie",
    year: summary.year,
    quarter: summary.quarter,
  };
}

const INCOME_TAX_DEADLINE_DATE = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Aangifte-inkomstenbelasting-deadline als taak: de aangifte over het net-afgesloten belastingjaar moet
 * uiterlijk 1 mei worden ingediend. Verschijnt alléén wanneer die deadline nadert (binnen
 * `INCOME_TAX_DEADLINE_SOON_DAYS`; zie `incomeTaxDeadlineNeedsAction`) — jaarrond zou het ruis zijn.
 * Bewust forward-looking (nooit "te laat"): het systeem kent geen "ingediend"-vlag (aangifte gebeurt
 * buiten het platform via DigiD/fiscaal dienstverlener). Deep-link naar het aangifte-scherm, waar de
 * IB-schatting en het startpunt staan. Geen fiscaal advies.
 */
export function incomeTaxDeadlineTask(summary: IncomeTaxDeadlineSummary): PendingTask {
  const timing =
    summary.daysUntil <= 0
      ? `uiterlijk vandaag (${INCOME_TAX_DEADLINE_DATE.format(summary.deadline)})`
      : `voor ${INCOME_TAX_DEADLINE_DATE.format(summary.deadline)} · nog ${plural(summary.daysUntil, "dag", "dagen")}`;
  return {
    kind: "income-tax-deadline",
    id: `income-tax-deadline:${summary.taxYear}`,
    title: `Aangifte inkomstenbelasting ${summary.taxYear}`,
    subtitle: `${timing} · je jaaroverzicht staat klaar`,
    tone: "attention",
    priority: P.incomeTaxDeadlineDueSoon,
    resolver: "link", // aangifte doe je bij de Belastingdienst; hier de cijfers + het startpunt
    href: "/ontzorgd/aangifte",
    taxYear: summary.taxYear,
  };
}

/**
 * Urencriterium-taak: het criterium (1.225 uur → zelfstandigenaftrek) dreigt dit jaar niet gehaald te
 * worden, maar is nog realistisch bij te sturen. Verschijnt alléén wanneer bijsturen zin heeft — in het
 * seizoen H2/Q4, met activiteit, niet-op-koers en haalbaar (`hoursCriterionNeedsAction`). Anders dan de
 * BTW/IB-aangifte is dit geen filing-deadline maar een gedragsnudge: boek meer uren of registreer je
 * indirecte uren. Deep-link naar `/ontzorgd/uren`, waar je die indirecte uren vastlegt. Geen fiscaal advies.
 */
export function hoursCriterionTask(summary: HoursCriterionSummary): PendingTask {
  return {
    kind: "hours-criterion",
    id: `hours-criterion:${summary.year}`,
    title: `Urencriterium ${summary.year}: nog ${summary.remainingHours} uur`,
    subtitle: `≈ ${summary.hoursPerWeekNeeded} uur/week tot het jaareinde voor de zelfstandigenaftrek — registreer ook je indirecte uren`,
    tone: "attention",
    priority: P.hoursCriterionDueSoon,
    resolver: "link", // de zelfstandigenaftrek loopt via de aangifte; hier registreer je de (indirecte) uren
    href: "/ontzorgd/uren",
    year: summary.year,
  };
}

/**
 * Aggregaat-taak: N open diensten dreigen NU onbezet (start deze week/verstreken/geen startdatum). Dit
 * is het operationeel-urgentste item van de bemiddelaar — een dienst die dreigt leeg te vallen laat een
 * opdrachtgever zonder bezetting. Eén taak (geen rij-per-dienst, rustige lijst); de subtitel splitst
 * direct-vulbaar-uit-je-roster vs. werving nodig zodat de eerstvolgende stap meteen duidelijk is. Tone
 * `attention` zodra minstens één dienst werving vraagt (geen druk-op-de-knop-oplossing), anders `info`
 * (alles is met een voordracht te vullen). Deep-link naar de diensten-pagina met de "dreigt onbezet"-kaart.
 */
export function franchiseAcuteDienstTask(summary: AcuteFillabilitySummary): PendingTask {
  const { total, needsRecruiting } = summary;
  return {
    kind: "franchise-open-dienst-acute",
    id: "franchise-open-dienst-acute",
    title: `${plural(total, "dienst dreigt", "diensten dreigen")} onbezet`,
    subtitle: acuteFillabilityHeadline(summary) ?? undefined,
    tone: needsRecruiting > 0 ? "attention" : "info",
    priority: P.franchiserServiceAcute,
    resolver: "link",
    href: "/franchise/diensten",
  };
}

export function franchiseLeadFollowupTask(count: number): PendingTask {
  return {
    kind: "franchise-lead-followup",
    id: "franchise-lead-followup",
    title: `${plural(count, "lead wacht", "leads wachten")} op opvolging`,
    subtitle: "De geplande opvolgdatum is verstreken",
    tone: "attention",
    priority: P.franchiserLeadFollowup,
    resolver: "link",
    href: "/franchise/leads",
  };
}

/**
 * Roster-ZZP'er die (nog) niet inzetbaar is — een verplicht document ontbreekt/verlopen of de
 * verificatie is niet compleet, wat plaatsing blokkeert. Operationeel attentiepunt voor de
 * bemiddelaar; deep-link naar het roster-profiel waar de ontbrekende stukken aangevuld worden.
 * Zelfde tone/prioriteit/tekst als de dashboard-rail, zodat /acties, de zijbalk-badge en het
 * dashboard één bron delen (voorheen alleen op het dashboard zichtbaar).
 */
export function franchiseNotEngageableTask(
  profileId: string,
  name: string,
  reason: string,
): PendingTask {
  return {
    kind: "franchise-not-engageable",
    id: `franchise-not-engageable:${profileId}`,
    title: `${name} is nog niet inzetbaar — ${reason}`,
    subtitle: "Blokkeert plaatsing — vul de ontbrekende verificatie aan",
    tone: "attention",
    priority: P.franchiserRosterNotEngageable,
    resolver: "link",
    href: `/franchise/zzpers/${profileId}`,
    profileId,
  };
}

/**
 * Gepubliceerde dienst die te lang open staat zonder plaatsing (geen actieve samenwerking).
 * Operationeel attentiepunt; deep-link naar de dienst zodat de bemiddelaar een ZZP'er kan voordragen
 * of werven. Als item-taak telt hij nu óók mee op /acties en in de badge (voorheen dashboard-only).
 */
export function franchiseStaleDienstTask(
  jobId: string,
  title: string,
  openDays: number,
): PendingTask {
  return {
    kind: "franchise-stale-service",
    id: `franchise-stale-service:${jobId}`,
    title: `Dienst ${title} staat ${plural(openDays, "dag", "dagen")} open zonder plaatsing`,
    subtitle: "Nog geen plaatsing — draag een ZZP'er voor of werf",
    tone: "attention",
    priority: P.franchiserServiceStale,
    resolver: "link",
    href: `/franchise/diensten/${jobId}`,
    jobId,
  };
}

/**
 * Rollup voor de resterende lang-open diensten voorbij de per-dienst-slice: de item-lijst toont de
 * oudste (max 3) diensten als aparte rij, maar zonder deze rollup verdwenen #4+ volledig van /acties,
 * de zijbalk-badge (`pendingTaskCount`) én de dashboard-rail — een undercount van échte, verouderende
 * voorraad (de onbegrensde `/franchise/diensten`-pagina toonde ze wél). Spiegelt de bundeling van
 * `franchiseAcuteDienstTask`: één aggregaat-taak met de restant-telling, deep-link naar de volledige
 * lijst. Lagere prioriteit dan de per-dienst-taak zodat de specifieke, oudste diensten voorop blijven.
 */
export function franchiseStaleDienstRollupTask(count: number): PendingTask {
  return {
    kind: "franchise-stale-service-rollup",
    id: "franchise-stale-service-rollup",
    title: `Nog ${plural(count, "dienst staat", "diensten staan")} lang open zonder plaatsing`,
    subtitle: "Bekijk de volledige lijst — draag ZZP'ers voor of werf",
    tone: "attention",
    priority: P.franchiserServiceStaleRollup,
    resolver: "link",
    href: "/franchise/diensten",
  };
}

/**
 * Een lopende plaatsing (ACTIVE samenwerking uit een tenant-dienst) nadert of passeert haar
 * einddatum. De opdrachtgever én de ZZP'er krijgen dit vervolgsignaal al (`collaborationRenewalTask`);
 * de bemiddelaar — die de plaatsing brokerde en er de fee op verdient — kreeg niets, terwijl een
 * aflopende plaatsing juist zijn hoogste-leverage-moment is (verlengen, opdrachtgever behouden, geen
 * onverwacht bezettingsgat). Anders dan de partij-taak toont de bemiddelaar beide kanten
 * (ZZP'er + opdrachtgever) en deep-linkt hij naar het franchise-toezichtoverzicht (er is geen
 * bemiddelaar-detailpagina per samenwerking). Advies, geen blokkade: `info`, `attention` zodra de
 * einddatum verstreken is. Dezelfde pure fase-classificatie (`summarizeCollaborationRenewal`) als de
 * twee partij-taken, zodat de drie oppervlakken niet driften.
 */
export function franchiseCollaborationRenewalTask(
  collabId: string,
  freelancerName: string,
  companyName: string,
  jobTitle: string,
  phase: CollaborationRenewalPhase,
  daysRemaining: number | null,
): PendingTask {
  const overdue = phase === "overdue";
  let window: string;
  if (overdue) window = "einddatum verstreken";
  else if (daysRemaining === 0) window = "loopt vandaag af";
  else if (daysRemaining === 1) window = "loopt morgen af";
  else window = `loopt over ${plural(daysRemaining ?? 0, "dag", "dagen")} af`;
  return {
    kind: "franchise-collaboration-renewal",
    id: `franchise-collaboration-renewal:${collabId}`,
    title: `Plan een vervolg: ${freelancerName} bij ${companyName}`,
    subtitle: `${jobTitle} · ${window}`,
    tone: overdue ? "attention" : "info",
    priority: P.franchiserCollaborationRenewal,
    resolver: "link", // deep-link naar het franchise-samenwerkingoverzicht (geen detailpagina per inzet)
    href: "/franchise/samenwerkingen?status=ACTIVE",
    collabId,
  };
}

/**
 * Een opdrachtgever is stilgevallen: geen open dienst en geen lopende samenwerking, en de laatste
 * activiteit (of, als er nooit iets liep, de aanmelddatum) is ≥ `CLIENT_IDLE_DAYS` geleden. Dé
 * re-engagement-actie van de bemiddelaar — een warme, bestaande relatie opnieuw benaderen voor een
 * vervolgopdracht is hoger-leverage dan koude acquisitie (benchmark Bullhorn/PIDZ-regiokantoor). De
 * relatiegezondheid stond al op de klantenlijst-strip én het klantdetail, maar niet op /acties of in
 * een badge — het "signaal op één oppervlak"-anti-patroon dat de codebase herhaaldelijk dicht. Zelfde
 * pure classificatie (`classifyClientHealth`) als die twee oppervlakken, dus de drie surfaces driften
 * niet. Deep-link naar het klantdetail waar de bemiddelaar de relatie kan opvolgen.
 */
export function franchiseClientReengagementTask(
  companyId: string,
  companyName: string,
  idleDays: number,
): PendingTask {
  return {
    kind: "franchise-client-reengagement",
    id: `franchise-client-reengagement:${companyId}`,
    title: `${companyName} is stilgevallen — benader voor een vervolgopdracht`,
    subtitle: `Geen open dienst of lopende plaatsing · ${plural(idleDays, "dag", "dagen")} rustig`,
    tone: "attention",
    priority: P.franchiserClientReengagement,
    resolver: "link",
    href: `/franchise/opdrachtgevers/${companyId}`,
    companyId,
  };
}

/**
 * Geleide-opzet-stappen (opdrachtgever → dienst → roster) als item-taken. Hergebruikt de guided-tak
 * van `franchiserNextActions` als ENIGE bron van waarheid voor tekst/href/tone/prioriteit; alleen de
 * guided inputs worden meegegeven (geen operationele items — die emit `franchiserTasks` al apart).
 * Zo tonen `/acties`, de zijbalk-badge én de dashboard-rail exact dezelfde geleide stappen (voorheen
 * leefden die alleen op de rail via `activation`, waardoor de single-source-invariant brak). De
 * resolver is een deep-link (`link` → `default`-tak van de resolver-registry, geen UI-wiring nodig).
 */
export function franchiseGuidedSetupTasks(input: {
  companies: number;
  publishedDiensten: number;
  rosterFreelancers: number;
  companiesWithoutDiensten: number;
}): PendingTask[] {
  return franchiserNextActions(input).map((na) => ({
    kind: "franchise-guided-setup",
    id: `franchise-guided-setup:${na.id}`,
    step: na.id,
    title: na.title,
    tone: na.tone,
    priority: na.priority,
    resolver: "link",
    href: na.href,
  }));
}

/**
 * Een ZZP'er kan een actieve inzet niet voortzetten en heeft die ter overname aangeboden (OPEN
 * dienst-overname). De governance-partij is nu aan zet om de aanvraag te beoordelen: de bemiddelaar
 * (tenant-eigenaar) óf een admin keurt goed/af (zie shift-handoff.ts). Zonder deze taak telde de
 * nav-badge (`openHandoffs`/`openAdminHandoffs`, signals.ts) de aanvraag wél, maar zweeg het
 * actiecentrum (/acties, dashboard-rail, badge-telling) erover — één-oppervlak-signaal (DOEL 1b).
 * `audience` bepaalt de deep-link naar het beoordelingsscherm (bemiddelaar vs. admin), exact de
 * href die de nav-badge gebruikt. Prioriteit gelijk aan een open dispuut: een governance-beslissing
 * waar de tegenpartij op wacht. Resolver `link` — inspecteer-dan-beslis (afwijzen vereist een reden)
 * gebeurt op het gedeelde governance-scherm, niet in één klik.
 */
export function shiftHandoffTask(
  handoffId: string,
  audience: "FRANCHISER" | "ADMIN",
  jobTitle: string,
  freelancerName: string,
): PendingTask {
  return {
    kind: "shift-handoff-decide",
    id: `shift-handoff-decide:${handoffId}`,
    title: "Beoordeel de dienst-overname",
    subtitle: `${jobTitle} · ${freelancerName} kan de inzet niet voortzetten`,
    tone: "attention",
    priority: P.disputeOpen, // governance-beslissing waar de ZZP'er op wacht (gelijk aan een open dispuut)
    resolver: "link",
    href: audience === "ADMIN" ? "/admin/shift-overnames" : "/franchise/shift-overnames",
    handoffId,
    audience,
  };
}
