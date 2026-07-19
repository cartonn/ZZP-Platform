// Actiecentrum — item-niveau taakmodel (puur, geen I/O). De server-enumerator (pending-tasks.ts)
// haalt de concrete openstaande items op en bouwt hiermee PendingTask[]; de resolver-registry
// (components/actions/resolvers.tsx) mapt elke taak naar de UI waarmee je 'm ter plekke afhandelt.
//
// Dit is een parallelle, item-niveau laag bovenop de aggregaat-engine (next-actions.ts): elk
// concreet ding-om-te-doen wordt één taak, zodat je op de actie kunt klikken en daar het werk doet.
// Dezelfde prioriteitsbanden (P) worden hergebruikt zodat de rangschikking nooit afwijkt.

import { P, type NextActionTone } from "@/lib/next-actions";
import { plural } from "@/lib/plural";
import { formatEuro } from "@/lib/invoices";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import { type CredentialType } from "@/lib/enums";
import { type CredentialAlert } from "@/lib/collaboration-alerts";
import { type VatDeadlineSummary } from "@/lib/administration/vat-deadline";
import { type StaleApplicationsSummary } from "@/lib/stale-applications";
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
  | (TaskBase & { kind: "mandatory-document"; docType: string; cause: "missing" | "expired" })
  | (TaskBase & { kind: "admin-verify-credential"; credId: string })
  | (TaskBase & { kind: "admin-activate-user"; userId: string })
  | (TaskBase & { kind: "admin-resolve-dispute"; collabId: string })
  | (TaskBase & { kind: "admin-deletion-request"; userId: string })
  | (TaskBase & { kind: "admin-judge-no-show"; reportId: string })
  | (TaskBase & { kind: "admin-suspend-no-show"; userId: string })
  | (TaskBase & { kind: "admin-support-ticket"; ticketId: string })
  | (TaskBase & { kind: "no-show-warning" })
  | (TaskBase & { kind: "overdue-invoice"; role: "FREELANCER" | "CLIENT" })
  | (TaskBase & { kind: "payment-due-soon" })
  | (TaskBase & { kind: "vat-deadline"; year: number; quarter: number })
  | (TaskBase & { kind: "client-compliance"; collabId: string })
  | (TaskBase & { kind: "review-leave"; collabId: string })
  | (TaskBase & { kind: "applications-review" })
  | (TaskBase & { kind: "propose-collaboration"; applicationId: string })
  | (TaskBase & { kind: "stale-applications" })
  | (TaskBase & { kind: "availability-refresh" })
  | (TaskBase & { kind: "draft-jobs" })
  | (TaskBase & { kind: "franchise-credential-expiry"; profileId: string })
  | (TaskBase & { kind: "franchise-open-dienst-acute" })
  | (TaskBase & { kind: "franchise-lead-followup" });

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
    priority: P.complianceRipple - 20, // = approve-band (65), conform cascade/next-actions.ts
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
): PendingTask {
  return {
    kind: "invoice-submit",
    id: `invoice-submit:${invId}`,
    title: rejected
      ? "Afgekeurde factuur corrigeren en opnieuw indienen"
      : "Concept-factuur indienen",
    subtitle: jobTitle,
    tone: "attention",
    priority: rejected ? P.credentialExpiring - 8 : P.messagesAwaiting, // 62 of 55
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
 * Verplicht document (VOG/verzekering) ontbreekt of is verlopen. Dit blokkeert de inzetbaarheid
 * van de ZZP'er — zonder deze taak zegt "Wat vraagt aandacht" ten onrechte "niets te doen" terwijl
 * de inzetbaarheidskaart rood "Nog niet inzetbaar" toont. In beoordeling = geen taak (wacht op admin).
 */
export function mandatoryDocumentTask(
  docType: string,
  label: string,
  cause: "missing" | "expired",
): PendingTask {
  return {
    kind: "mandatory-document",
    id: `mandatory-document:${docType}`,
    title:
      cause === "missing"
        ? `Verplicht document ontbreekt: ${label}`
        : `Verplicht document verlopen: ${label}`,
    subtitle: "Zonder dit document ben je niet inzetbaar — upload het bewijsstuk",
    tone: "attention",
    priority: P.mandatoryDoc,
    resolver: "link",
    href: `/certificaten/nieuw?type=${docType}`,
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

/** Waarschuwing voor de ZZP'er: ongegronde no-shows geregistreerd; bij de grens volgt uitschrijving. */
export function noShowWarningTask(unjustified: number, limit: number, href: string): PendingTask {
  return {
    kind: "no-show-warning",
    id: "no-show-warning",
    title: `Let op: ${plural(unjustified, "ongegronde no-show", "ongegronde no-shows")} geregistreerd`,
    subtitle: `Bij ${limit} ongegronde no-shows volgt uitschrijving van het platform.`,
    tone: "attention",
    priority: P.complianceRipple,
    resolver: "link",
    href,
  };
}

export function overdueInvoiceTask(count: number, role: "FREELANCER" | "CLIENT"): PendingTask {
  return {
    kind: "overdue-invoice",
    id: `overdue-invoice:${role}`,
    title: `${plural(count, "factuur", "facturen")} over de vervaldatum`,
    subtitle: role === "FREELANCER" ? "Volg op bij de opdrachtgever" : "Markeer als betaald",
    tone: "attention",
    priority: P.overdueInvoice,
    resolver: "link",
    href: "/facturen",
    role,
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
): PendingTask {
  return {
    kind: "propose-collaboration",
    id: `propose-collaboration:${applicationId}`,
    title: `Stuur ${freelancerName} een samenwerkingsvoorstel`,
    subtitle: `Je accepteerde de reactie op ${jobTitle} — rond de samenwerking af`,
    tone: "attention",
    priority: P.proposeCollaboration,
    resolver: "link",
    href: `/kandidaten?open=${applicationId}`,
    applicationId,
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
    priority: P.reviewPrompt,
    resolver: "link", // meerstaps formulier (score + toelichting) → naar de samenwerking
    href: collabHref(collabId),
    collabId,
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
