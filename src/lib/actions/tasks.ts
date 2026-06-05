// Actiecentrum — item-niveau taakmodel (puur, geen I/O). De server-enumerator (pending-tasks.ts)
// haalt de concrete openstaande items op en bouwt hiermee PendingTask[]; de resolver-registry
// (components/actions/resolvers.tsx) mapt elke taak naar de UI waarmee je 'm ter plekke afhandelt.
//
// Dit is een parallelle, item-niveau laag bovenop de aggregaat-engine (next-actions.ts): elk
// concreet ding-om-te-doen wordt één taak, zodat je op de actie kunt klikken en daar het werk doet.
// Dezelfde prioriteitsbanden (P) worden hergebruikt zodat de rangschikking nooit afwijkt.

import { P, type NextActionTone } from "@/lib/next-actions";
import { plural } from "@/lib/plural";

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
  | (TaskBase & { kind: "admin-verify-credential"; credId: string })
  | (TaskBase & { kind: "admin-activate-user"; userId: string })
  | (TaskBase & { kind: "admin-resolve-dispute"; collabId: string })
  | (TaskBase & { kind: "admin-deletion-request"; userId: string })
  | (TaskBase & { kind: "overdue-invoice"; role: "FREELANCER" | "CLIENT" })
  | (TaskBase & { kind: "applications-review" })
  | (TaskBase & { kind: "draft-jobs" });

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
    title: "Afgekeurde uren corrigeren en opnieuw indienen",
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

export function paymentConfirmTask(invId: string, collabId: string, jobTitle: string): PendingTask {
  return {
    kind: "payment-confirm",
    id: `payment-confirm:${invId}`,
    title: "Markeer de betaling zodra je bent betaald",
    subtitle: jobTitle,
    tone: "info",
    priority: P.overdueInvoice - 2, // payment-band (58)
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
    href: "/profiel",
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
    href: "/profiel",
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
        : "Certificaat vernieuwt binnenkort",
    subtitle: title,
    tone: "attention",
    priority: cause === "rejected" ? P.credentialRejected : P.credentialExpiring,
    resolver: "drawer",
    href: `/certificaten/${credId}/bewerken`,
    credId,
    cause,
  };
}

export function adminVerifyCredentialTask(credId: string, title: string): PendingTask {
  return {
    kind: "admin-verify-credential",
    id: `admin-verify-credential:${credId}`,
    title: "Beoordeel het ingediende certificaat",
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
    title: "Gebruiker goedkeuren",
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
    title: "Dispuut beoordelen — werkproces bevroren",
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
