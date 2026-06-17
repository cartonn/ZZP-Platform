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
  "idea", //         ideeënbox (statuswijziging, reactie)
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
  INVOICE_DRAFT_READY: { category: "invoice", tone: "attention" },
  INVOICE_SUBMITTED: { category: "invoice", tone: "attention" },
  INVOICE_APPROVED: { category: "invoice", tone: "success" },
  INVOICE_REJECTED: { category: "invoice", tone: "attention" },
  INVOICE_CREDITED: { category: "invoice", tone: "info" },
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
  REVIEW_RECEIVED: { category: "collaboration", tone: "info" }, // uitnodiging om terug te beoordelen (zonder score)
  REVIEW_PUBLISHED: { category: "collaboration", tone: "success" }, // onthuld — score nu zichtbaar
  IDEA_STATUS: { category: "idea", tone: "info" },
  IDEA_COMMENT: { category: "idea", tone: "info" },
  VAT_REMINDER: { category: "system", tone: "info" },
  INVOICE_DRAFT_ESCALATION: { category: "invoice", tone: "attention" },
  JOB_MATCH: { category: "system", tone: "info" },
  JOB_COLD: { category: "system", tone: "attention" }, // opdracht koud: weinig respons, vraagt actie
  POOL_INVITE: { category: "collaboration", tone: "attention" },
};

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
  idea: "Ideeënbox",
  system: "Overig",
};
