// Notificatie-presentatie (PLATFORM_OVERHAUL.md §7: consistente status-/signaaltaal). Pure mapping
// van notificatietype → categorie + toon. Geen React hier; de UI kiest het icoon per categorie.

export const NOTIFICATION_CATEGORIES = [
  "workflow", //     contract/prestatie-stappen in het werkproces
  "invoice", //      factuur-lifecycle
  "payment", //      betaling (registratie/herinnering)
  "dba", //          DBA-signaal
  "dispute", //      dispuut/escalatie
  "credential", //   certificaat/verificatie
  "collaboration", //samenwerking
  "application", //   reactie op een opdracht (ontvangen/afgewezen/ingetrokken)
  "messages", //     bericht/gesprek (onbeantwoord, wacht op antwoord)
  "idea", //         ideeënbox (statuswijziging, reactie)
  "account", //      account & toegang (status, verwijderverzoek)
  "system", //       overig/systeem
] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export type NotificationTone = "attention" | "info" | "success";

export interface NotificationMeta {
  category: NotificationCategory;
  tone: NotificationTone;
}

const META: Record<string, NotificationMeta> = {
  CONTRACT_SIGNED: { category: "workflow", tone: "success" },
  PERFORMANCE_SUBMITTED: { category: "workflow", tone: "attention" },
  PERFORMANCE_APPROVED: { category: "workflow", tone: "success" },
  PERFORMANCE_REJECTED: { category: "workflow", tone: "attention" },
  PERFORMANCE_APPROVAL_REMINDER: { category: "workflow", tone: "attention" },
  PERFORMANCE_APPROVAL_ESCALATION: { category: "workflow", tone: "attention" },
  INVOICE_DRAFT_READY: { category: "invoice", tone: "attention" },
  INVOICE_SUBMITTED: { category: "invoice", tone: "attention" },
  INVOICE_APPROVED: { category: "invoice", tone: "success" },
  INVOICE_REJECTED: { category: "invoice", tone: "attention" },
  INVOICE_CREDITED: { category: "invoice", tone: "info" },
  INVOICE_WITHDRAWN: { category: "invoice", tone: "info" },
  PAYMENT_CONFIRMED: { category: "payment", tone: "success" },
  PAYMENT_OVERDUE: { category: "payment", tone: "attention" },
  PAYMENT_REMINDER: { category: "payment", tone: "info" },
  SUBSCRIPTION_PAST_DUE: { category: "payment", tone: "attention" },
  SUBSCRIPTION_DOWNGRADED: { category: "system", tone: "info" },
  DBA_SIGNAL: { category: "dba", tone: "info" },
  DISPUTE_OPENED: { category: "dispute", tone: "attention" },
  DISPUTE_RESOLVED: { category: "dispute", tone: "success" },
  CREDENTIAL_EXPIRED: { category: "credential", tone: "attention" },
  CREDENTIAL_EXPIRING: { category: "credential", tone: "info" },
  COLLABORATION_PROPOSED: { category: "collaboration", tone: "info" },
  COLLABORATION_STATUS: { category: "collaboration", tone: "info" },
  COLLABORATION_REPLACEMENT: { category: "collaboration", tone: "attention" },
  CREDENTIAL_REMINDER: { category: "credential", tone: "attention" }, // opdrachtgever verzoekt om een certificaat
  REVIEW_RECEIVED: { category: "collaboration", tone: "info" }, // uitnodiging om terug te beoordelen (zonder score)
  REVIEW_PUBLISHED: { category: "collaboration", tone: "success" }, // onthuld — score nu zichtbaar
  IDEA_STATUS: { category: "idea", tone: "info" },
  IDEA_COMMENT: { category: "idea", tone: "info" },
  VAT_REMINDER: { category: "system", tone: "info" },
  HOURS_CRITERION_REMINDER: { category: "system", tone: "attention" }, // urencriterium dreigt niet gehaald
  INVOICE_DRAFT_ESCALATION: { category: "invoice", tone: "attention" },
  JOB_MATCH: { category: "system", tone: "info" },
  JOB_COLD: { category: "system", tone: "attention" }, // opdracht koud: weinig respons, vraagt actie
  POOL_INVITE: { category: "collaboration", tone: "attention" },
  JOB_PROPOSAL: { category: "collaboration", tone: "attention" }, // bemiddelaar draagt ZZP'er voor op dienst
  JOB_INVITE: { category: "collaboration", tone: "attention" }, // opdrachtgever nodigt ZZP'er direct uit voor een opdracht
  JOB_CLOSED: { category: "system", tone: "info" }, // opdracht gesloten: open reactie is niet meer beschikbaar
  CONVERSATION_REPLY_REMINDER: { category: "messages", tone: "attention" }, // onbeantwoord bericht, gesprek ligt stil
  // Reactie-trechter (opdracht ↔ ZZP'er) — bij elkaar onder "Reacties".
  APPLICATION_RECEIVED: { category: "application", tone: "attention" }, // opdrachtgever: nieuwe reactie, vraagt actie
  APPLICATION_REJECTED: { category: "application", tone: "info" }, // ZZP'er: reactie afgewezen
  APPLICATION_WITHDRAWN: { category: "application", tone: "info" }, // ZZP'er trok zijn reactie in
  // Certificaat-verificatiebeslissingen.
  CREDENTIAL_VERIFIED: { category: "credential", tone: "success" },
  CREDENTIAL_REJECTED: { category: "credential", tone: "attention" },
  // Factuur-lifecycle (ontvangst + betaald).
  INVOICE_SENT: { category: "invoice", tone: "attention" }, // ontvanger: nieuwe factuur, actie (betalen)
  INVOICE_PAID: { category: "invoice", tone: "success" },
  // Berichten.
  MESSAGE: { category: "messages", tone: "attention" }, // nieuw bericht in een gesprek
  // Dispuut-escalatie (cascade blijft bevroren).
  DISPUTE_ESCALATION: { category: "dispute", tone: "attention" },
  // Werkproces — dienst-uitvoering (no-show + overname + auto-goedkeuring).
  PERFORMANCE_AUTO_APPROVED: { category: "workflow", tone: "info" }, // niet op tijd beoordeeld → auto-goedgekeurd
  NO_SHOW_REPORTED: { category: "workflow", tone: "attention" },
  NO_SHOW_JUDGED: { category: "workflow", tone: "info" },
  SHIFT_HANDOFF_REQUESTED: { category: "workflow", tone: "attention" },
  SHIFT_HANDOFF_APPROVED: { category: "workflow", tone: "success" },
  SHIFT_HANDOFF_REJECTED: { category: "workflow", tone: "attention" },
  // Abonnement (billing) — sluit aan bij SUBSCRIPTION_PAST_DUE onder "Betalingen".
  SUBSCRIPTION_RENEWAL: { category: "payment", tone: "info" }, // verloopt binnenkort — verleng
  SUBSCRIPTION_EXPIRED: { category: "payment", tone: "attention" }, // teruggezet naar Gratis
  // Account & toegang.
  ACCOUNT_STATUS: { category: "account", tone: "info" }, // welkom/status-/toegangswijziging
  ACCOUNT_DELETION_REQUESTED: { category: "account", tone: "attention" }, // admin: verwijderverzoek te verwerken
  // Helpdesk + platform-bewaking (blijven onder "Overig").
  SUPPORT_REPLY: { category: "system", tone: "info" }, // reactie van de helpdesk
  HEALTH_INCIDENT: { category: "system", tone: "attention" }, // platform-bewaking, admin
};

/** Of een notificatietype een expliciete presentatie kent (i.p.v. de neutrale system/info-fallback). */
export function isNotificationTypeKnown(type: string): boolean {
  return Object.prototype.hasOwnProperty.call(META, type);
}

/** Categorie + toon voor een notificatietype; valt terug op een neutrale systeem-categorie. */
export function notificationMeta(type: string): NotificationMeta {
  return META[type] ?? { category: "system", tone: "info" };
}

/** NL-label per categorie — voor groepskoppen in digest-e-mail en overzichten. */
export const NOTIFICATION_CATEGORY_LABEL: Record<NotificationCategory, string> = {
  workflow: "Werkproces",
  invoice: "Facturen",
  payment: "Betalingen",
  dba: "DBA-signalen",
  dispute: "Disputen",
  credential: "Certificaten",
  collaboration: "Samenwerkingen",
  application: "Reacties",
  messages: "Berichten",
  idea: "Ideeënbox",
  account: "Account",
  system: "Overig",
};
