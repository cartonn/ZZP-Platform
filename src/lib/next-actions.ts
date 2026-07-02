// Unified, deterministic "next best action" engine. Pure logic: no Prisma, no I/O.
// Takes plain typed inputs of primitive counts/flags (server computes these upstream)
// and produces a ranked list of actions. Thresholds mirror the dashboard exactly so a
// later swap is behaviour-preserving. Higher priority = more urgent = shown first.

import { plural } from "@/lib/plural";

export type NextActionTone = "attention" | "info" | "success";

export interface NextAction {
  id: string;
  title: string;
  href: string;
  tone: NextActionTone;
  /** Higher = more urgent. Equal priority preserves input order (stable). */
  priority: number;
}

/**
 * Stable sort by priority descending: equal priorities keep their input order.
 * `Array.prototype.sort` is stable in modern engines, but we guard order
 * explicitly via the original index so the contract holds regardless.
 */
export function rankNextActions(actions: NextAction[]): NextAction[] {
  return actions
    .map((action, index) => ({ action, index }))
    .sort((a, b) => b.action.priority - a.action.priority || a.index - b.index)
    .map(({ action }) => action);
}

/**
 * Vat de ontbrekende onderdelen samen voor in een actie-titel: maximaal `max` namen,
 * de rest als "+N meer". Zo weet de gebruiker concreet wát te doen om 100% te halen.
 */
export function formatMissing(items: readonly string[], max = 3): string {
  if (items.length <= max) return items.join(", ");
  return `${items.slice(0, max).join(", ")} +${items.length - max} meer`;
}

// Priority bands. Compliance/blocking items outrank cosmetic ones. Gaps leave
// room for future items without renumbering. Geëxporteerd zodat het item-niveau
// Actiecentrum (src/lib/actions/tasks.ts) exact dezelfde rangschikking gebruikt.
export const P = {
  blocking: 100, // profiel privé, AVG-verwijderverzoek
  identity: 90, // identiteit niet geverifieerd
  complianceRipple: 85, // lopende samenwerking met certificaat-alert
  mandatoryDoc: 84, // verplicht document (VOG/verzekering) ontbreekt of verlopen — blokkeert inzetbaarheid
  credentialRejected: 80, // afgewezen certificaat — opnieuw indienen
  disputeOpen: 76, // open dispuut — werkproces bevroren (admin)
  contractSign: 72, // contract ter ondertekening — deblokkeert de samenwerking
  credentialExpiring: 70, // certificaat verloopt binnenkort
  verificationQueue: 70, // wacht op verificatie (admin)
  supportOpen: 66, // openstaande supporttickets — onbeantwoord/nieuw (admin)
  overdueInvoice: 60, // factuur over de vervaldatum
  pendingUsers: 60, // gebruikers met PENDING-status (admin)
  credentialExpiryBatch: 58, // verlopen/verlopende certificaten — draai de expiry-check (admin)
  messagesAwaiting: 55, // berichten van de andere partij wachten op antwoord
  applications: 50, // nieuwe reacties
  completeness: 30, // profiel/bedrijf onvolledig (cosmetisch)
  drafts: 20, // concept-opdrachten
  // Franchiser-activatie: geleide opzet van een nieuwe tenant (begeleidend, niet alarmerend).
  // De banden zijn rol-geïsoleerd (alleen franchiser-acties), dus overlap met bovenstaande
  // semantische waarden is bewust en onschadelijk — ze worden nooit samen gerangschikt.
  franchiserFirstClient: 90, // nog geen opdrachtgever — de enige zinvolle eerste stap
  franchiserFirstService: 80, // opdrachtgever(s), maar nog geen enkele dienst uitgezet
  franchiserRoster: 70, // nog geen ZZP'ers in het roster
  franchiserClientsWithoutService: 40, // opdrachtgever(s) zonder diensten (doorlopende nudge)
  // Franchiser-operationeel: doorlopende tenant-taken zodra de franchise draait (item-niveau).
  franchiserCredentialExpiring: 70, // roster-certificaat van een tenant-ZZP'er verloopt binnenkort
  franchiserLeadFollowup: 50, // lead met verstreken geplande opvolgdatum
} as const;

export interface FreelancerActionInput {
  profilePrivate: boolean;
  identityVerified: boolean;
  completeness: number;
  /** Labels van de ontbrekende profielonderdelen (uit computeFreelancerCompleteness). */
  missingProfileItems: string[];
  rejectedCredentials: number;
  expiringCredentials: number;
  overdueInvoices: number;
  /** Samenwerkingen met een contract dat op ondertekening wacht (deblokkeert de cascade). */
  contractsAwaitingSignature: number;
  /** Gesprekken waarin een bericht van de andere partij op antwoord wacht. */
  messagesAwaitingReply: number;
}

export function freelancerNextActions(input: FreelancerActionInput): NextAction[] {
  const actions: NextAction[] = [];

  if (input.profilePrivate) {
    actions.push({
      id: "freelancer-profile-private",
      title: "Je profiel staat op privé — opdrachtgevers kunnen je niet vinden",
      href: "/profiel/bewerken",
      tone: "attention",
      priority: P.blocking,
    });
  }
  if (!input.identityVerified) {
    actions.push({
      id: "freelancer-identity-unverified",
      title: "Verifieer je identiteit voor een hoger vertrouwensniveau",
      href: "/account",
      tone: "attention",
      priority: P.identity,
    });
  }
  if (input.completeness < 100) {
    const todo = input.missingProfileItems.length
      ? `voeg toe: ${formatMissing(input.missingProfileItems)}`
      : "vul aan";
    actions.push({
      id: "freelancer-completeness",
      title: `Profiel is ${input.completeness}% compleet — ${todo}`,
      href: "/profiel/bewerken",
      tone: "info",
      priority: P.completeness,
    });
  }
  if (input.rejectedCredentials > 0) {
    actions.push({
      id: "freelancer-credentials-rejected",
      title: `${input.rejectedCredentials} certificaat/certificaten afgewezen — opnieuw indienen`,
      href: "/certificaten",
      tone: "attention",
      priority: P.credentialRejected,
    });
  }
  if (input.expiringCredentials > 0) {
    actions.push({
      id: "freelancer-credentials-expiring",
      title: `${plural(input.expiringCredentials, "certificaat", "certificaten")} ${input.expiringCredentials === 1 ? "verloopt" : "verlopen"} binnenkort — vernieuw`,
      href: "/certificaten",
      tone: "attention",
      priority: P.credentialExpiring,
    });
  }
  if (input.overdueInvoices > 0) {
    actions.push({
      id: "freelancer-overdue-invoices",
      title: `${plural(input.overdueInvoices, "factuur", "facturen")} over de vervaldatum — volg op`,
      href: "/facturen",
      tone: "attention",
      priority: P.overdueInvoice,
    });
  }
  if (input.contractsAwaitingSignature > 0) {
    actions.push({
      id: "freelancer-contracts-sign",
      title: `${plural(input.contractsAwaitingSignature, "contract", "contracten")} ${input.contractsAwaitingSignature === 1 ? "wacht" : "wachten"} op ondertekening`,
      href: "/samenwerkingen",
      tone: "attention",
      priority: P.contractSign,
    });
  }
  if (input.messagesAwaitingReply > 0) {
    actions.push({
      id: "freelancer-messages-awaiting",
      title: `${plural(input.messagesAwaitingReply, "bericht", "berichten")} ${input.messagesAwaitingReply === 1 ? "wacht" : "wachten"} op je antwoord`,
      href: "/berichten",
      tone: "attention",
      priority: P.messagesAwaiting,
    });
  }

  return rankNextActions(actions);
}

export interface ClientActionInput {
  companyCompleteness: number;
  /** Labels van de ontbrekende bedrijfsprofiel-onderdelen (uit computeCompanyCompleteness). */
  missingCompanyItems: string[];
  newApplications: number;
  draftJobs: number;
  overdueInvoices: number;
  /** Pre-rendered descriptions of credential alerts for active collaborations. */
  collaborationCredentialAlerts: string[];
  /** Samenwerkingen met een contract dat op ondertekening wacht. */
  contractsAwaitingSignature: number;
  /** Gesprekken waarin een bericht van de andere partij op antwoord wacht. */
  messagesAwaitingReply: number;
}

export function clientNextActions(input: ClientActionInput): NextAction[] {
  const actions: NextAction[] = [];

  // Compliance van een lopende samenwerking weegt het zwaarst — bovenaan.
  input.collaborationCredentialAlerts.forEach((description, i) => {
    actions.push({
      id: `client-collaboration-alert-${i}`,
      title: description,
      href: "/samenwerkingen",
      tone: "attention",
      priority: P.complianceRipple,
    });
  });
  if (input.companyCompleteness < 100) {
    const todo = input.missingCompanyItems.length
      ? `voeg toe: ${formatMissing(input.missingCompanyItems)}`
      : "vul aan";
    actions.push({
      id: "client-company-completeness",
      title: `Bedrijfsprofiel is ${input.companyCompleteness}% compleet — ${todo}`,
      href: "/bedrijf",
      tone: "info",
      priority: P.completeness,
    });
  }
  if (input.newApplications > 0) {
    actions.push({
      id: "client-new-applications",
      title: `${plural(input.newApplications, "nieuwe reactie", "nieuwe reacties")} — beoordeel kandidaten`,
      href: "/kandidaten",
      tone: "attention",
      priority: P.applications,
    });
  }
  if (input.draftJobs > 0) {
    actions.push({
      id: "client-draft-jobs",
      title: `${plural(input.draftJobs, "concept-opdracht", "concept-opdrachten")} — publiceren?`,
      href: "/opdrachten",
      tone: "info",
      priority: P.drafts,
    });
  }
  if (input.overdueInvoices > 0) {
    actions.push({
      id: "client-overdue-invoices",
      title: `${plural(input.overdueInvoices, "openstaande factuur", "openstaande facturen")} over de vervaldatum — markeer als betaald`,
      href: "/facturen",
      tone: "attention",
      priority: P.overdueInvoice,
    });
  }
  if (input.contractsAwaitingSignature > 0) {
    actions.push({
      id: "client-contracts-sign",
      title: `${plural(input.contractsAwaitingSignature, "contract", "contracten")} ${input.contractsAwaitingSignature === 1 ? "wacht" : "wachten"} op ondertekening`,
      href: "/samenwerkingen",
      tone: "attention",
      priority: P.contractSign,
    });
  }
  if (input.messagesAwaitingReply > 0) {
    actions.push({
      id: "client-messages-awaiting",
      title: `${plural(input.messagesAwaitingReply, "bericht", "berichten")} ${input.messagesAwaitingReply === 1 ? "wacht" : "wachten"} op je antwoord`,
      href: "/berichten",
      tone: "attention",
      priority: P.messagesAwaiting,
    });
  }

  return rankNextActions(actions);
}

export interface AdminActionInput {
  deletionRequests: number;
  pendingVerifications: number;
  pendingUsers: number;
  /** Open disputen — het werkproces is bevroren tot opgelost. */
  openDisputes: number;
  /** Openstaande supporttickets (nieuw/onbeantwoord) die een medewerker moet oppakken. */
  openSupportTickets: number;
  /** VERIFIED-certificaten die al verlopen of binnenkort verlopen — draai de expiry-check. */
  expiringCredentials: number;
}

export function adminNextActions(input: AdminActionInput): NextAction[] {
  const actions: NextAction[] = [];

  if (input.openDisputes > 0) {
    actions.push({
      id: "admin-open-disputes",
      title: `${input.openDisputes} open dispuut/disputen — samenwerking bevroren, beoordeel`,
      href: "/admin/disputen",
      tone: "attention",
      priority: P.disputeOpen,
    });
  }
  if (input.deletionRequests > 0) {
    actions.push({
      id: "admin-deletion-requests",
      title: `${plural(input.deletionRequests, "AVG-verwijderverzoek", "AVG-verwijderverzoeken")} — beoordeel`,
      href: "/admin/gebruikers?deletion=1",
      tone: "attention",
      priority: P.blocking,
    });
  }
  if (input.pendingVerifications > 0) {
    actions.push({
      id: "admin-pending-verifications",
      title: `${input.pendingVerifications} certificaat/certificaten wachten op verificatie`,
      href: "/admin/verificaties",
      tone: "attention",
      priority: P.verificationQueue,
    });
  }
  if (input.openSupportTickets > 0) {
    actions.push({
      id: "admin-open-support-tickets",
      title: `${plural(input.openSupportTickets, "supportticket", "supporttickets")} ${input.openSupportTickets === 1 ? "wacht" : "wachten"} op antwoord`,
      href: "/admin/support",
      tone: "attention",
      priority: P.supportOpen,
    });
  }
  if (input.pendingUsers > 0) {
    actions.push({
      id: "admin-pending-users",
      title: `${plural(input.pendingUsers, "gebruiker", "gebruikers")} ${input.pendingUsers === 1 ? "wacht" : "wachten"} op goedkeuring`,
      href: "/admin/gebruikers?status=PENDING",
      tone: "info",
      priority: P.pendingUsers,
    });
  }
  if (input.expiringCredentials > 0) {
    actions.push({
      id: "admin-expiring-credentials",
      title: `${input.expiringCredentials} certificaat/certificaten verlopen of verlopen binnenkort — draai de vervalcontrole`,
      href: "/admin/verificaties",
      tone: "info",
      priority: P.credentialExpiryBatch,
    });
  }

  return rankNextActions(actions);
}

export interface FranchiserActionInput {
  /** Opdrachtgevers (Company) in de tenant. */
  companies: number;
  /** Gepubliceerde diensten (Job PUBLISHED) in de tenant. */
  publishedDiensten: number;
  /** ZZP'ers in het eigen roster (FreelancerProfile). */
  rosterFreelancers: number;
  /** Opdrachtgevers zonder ook maar één gepubliceerde dienst. */
  companiesWithoutDiensten: number;
}

/**
 * Geleide opzet van een franchise: toont de eerstvolgende, concrete stap(pen) om de tenant
 * werkend te krijgen — opdrachtgever → dienst → roster. Begeleidend (tone "info"), niet
 * alarmerend, en leeg zodra de franchise staat (≥1 opdrachtgever met diensten én een roster).
 */
export function franchiserNextActions(input: FranchiserActionInput): NextAction[] {
  const actions: NextAction[] = [];

  // De opdrachtgever→dienst-tak: zonder opdrachtgever kan er nog niets uitgezet worden, dus toon dán
  // alleen "eerste opdrachtgever" (de dienst-stap zou zinloos zijn). Daarna de eerste/ontbrekende dienst.
  if (input.companies === 0) {
    actions.push({
      id: "franchiser-first-client",
      title: "Voeg je eerste opdrachtgever toe — met afdelingen en diensten in één doorloop",
      href: "/franchise/opdrachtgevers/nieuw",
      tone: "info",
      priority: P.franchiserFirstClient,
    });
  } else if (input.publishedDiensten === 0) {
    actions.push({
      id: "franchiser-first-service",
      title: "Zet je eerste dienst uit bij een opdrachtgever",
      href: "/franchise/opdrachtgevers",
      tone: "info",
      priority: P.franchiserFirstService,
    });
  } else if (input.companiesWithoutDiensten > 0) {
    actions.push({
      id: "franchiser-clients-without-service",
      title: `${plural(input.companiesWithoutDiensten, "opdrachtgever", "opdrachtgevers")} zonder diensten — zet diensten uit`,
      href: "/franchise/opdrachtgevers",
      tone: "info",
      priority: P.franchiserClientsWithoutService,
    });
  }

  // Het roster is een parallelle opzet-tak: ZZP'ers kun je los van opdrachtgevers al toevoegen.
  if (input.rosterFreelancers === 0) {
    actions.push({
      id: "franchiser-roster-empty",
      title: "Breng ZZP'ers in je roster om diensten te kunnen vervullen",
      href: "/franchise/zzpers",
      tone: "info",
      priority: P.franchiserRoster,
    });
  }

  return rankNextActions(actions);
}
