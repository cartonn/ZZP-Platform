import { describe, expect, it } from "vitest";
import {
  notificationMeta,
  isNotificationTypeKnown,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CATEGORY_LABEL,
} from "@/lib/notifications";

// Alle notificatietypes die in de codebase via prisma.notification.create worden uitgestuurd.
// Elk MOET een expliciete presentatie (icoon/toon/categorie) hebben — anders valt de melding op
// /notificaties terug op de generieke "Overig"/Bell-fallback. Bij een nieuw type: voeg het toe aan
// META (src/lib/notifications.ts) én aan deze lijst zodat de drift-test blijft dekken.
const EMITTED_NOTIFICATION_TYPES = [
  "ACCOUNT_DELETION_REQUESTED",
  "ACCOUNT_STATUS",
  "APPLICATION_RECEIVED",
  "APPLICATION_REJECTED",
  "APPLICATION_WITHDRAWN",
  "COLLABORATION_PROPOSED",
  "COLLABORATION_REPLACEMENT",
  "COLLABORATION_STATUS",
  "CONTRACT_SIGNED",
  "CONVERSATION_REPLY_REMINDER",
  "CREDENTIAL_EXPIRED",
  "CREDENTIAL_EXPIRING",
  "CREDENTIAL_REJECTED",
  "CREDENTIAL_REMINDER",
  "CREDENTIAL_VERIFIED",
  "DBA_SIGNAL",
  "DISPUTE_ESCALATION",
  "DISPUTE_OPENED",
  "DISPUTE_RESOLVED",
  "HEALTH_INCIDENT",
  "HOURS_CRITERION_REMINDER",
  "IDEA_COMMENT",
  "IDEA_STATUS",
  "INVOICE_DRAFT_ESCALATION",
  "INVOICE_DRAFT_READY",
  "INVOICE_PAID",
  "INVOICE_SENT",
  "JOB_CLOSED",
  "JOB_COLD",
  "JOB_INVITE",
  "JOB_MATCH",
  "JOB_PROPOSAL",
  "MESSAGE",
  "NO_SHOW_JUDGED",
  "NO_SHOW_REPORTED",
  "PAYMENT_OVERDUE",
  "PAYMENT_REMINDER",
  "PERFORMANCE_APPROVAL_ESCALATION",
  "PERFORMANCE_AUTO_APPROVED",
  "POOL_INVITE",
  "REVIEW_PUBLISHED",
  "REVIEW_RECEIVED",
  "SHIFT_HANDOFF_APPROVED",
  "SHIFT_HANDOFF_REJECTED",
  "SHIFT_HANDOFF_REQUESTED",
  "SUBSCRIPTION_DOWNGRADED",
  "SUBSCRIPTION_EXPIRED",
  "SUBSCRIPTION_PAST_DUE",
  "SUBSCRIPTION_RENEWAL",
  "SUPPORT_REPLY",
  "VAT_REMINDER",
] as const;

describe("notificationMeta", () => {
  it("mapt cascade- en betaaltypes naar de juiste categorie", () => {
    expect(notificationMeta("INVOICE_SUBMITTED").category).toBe("invoice");
    expect(notificationMeta("PAYMENT_OVERDUE")).toEqual({ category: "payment", tone: "attention" });
    expect(notificationMeta("DBA_SIGNAL").category).toBe("dba");
    expect(notificationMeta("DISPUTE_OPENED").tone).toBe("attention");
  });

  it("valt terug op system/info voor onbekende types", () => {
    expect(notificationMeta("IETS_NIEUWS")).toEqual({ category: "system", tone: "info" });
    expect(isNotificationTypeKnown("IETS_NIEUWS")).toBe(false);
  });

  it("elk uitgestuurd notificatietype heeft een expliciete presentatie (geen fallback)", () => {
    for (const type of EMITTED_NOTIFICATION_TYPES) {
      expect(isNotificationTypeKnown(type), `${type} ontbreekt in META`).toBe(true);
      expect(NOTIFICATION_CATEGORIES).toContain(notificationMeta(type).category);
    }
  });

  it("groepeert de reactie-trechter, account-events en billing consistent", () => {
    expect(notificationMeta("APPLICATION_RECEIVED")).toEqual({
      category: "application",
      tone: "attention",
    });
    expect(notificationMeta("APPLICATION_WITHDRAWN").category).toBe("application");
    expect(notificationMeta("CREDENTIAL_VERIFIED")).toEqual({
      category: "credential",
      tone: "success",
    });
    expect(notificationMeta("MESSAGE").category).toBe("messages");
    expect(notificationMeta("ACCOUNT_DELETION_REQUESTED").category).toBe("account");
    // Abonnementsverval sluit aan bij de betaal-familie.
    expect(notificationMeta("SUBSCRIPTION_EXPIRED").category).toBe("payment");
  });

  it("elke categorie heeft een NL-label", () => {
    for (const category of NOTIFICATION_CATEGORIES) {
      expect(NOTIFICATION_CATEGORY_LABEL[category]).toBeTruthy();
    }
  });

  it("alle gemapte categorieën zijn geldig", () => {
    for (const type of [
      "CONTRACT_SIGNED",
      "INVOICE_APPROVED",
      "CREDENTIAL_EXPIRED",
      "COLLABORATION_STATUS",
    ]) {
      expect(NOTIFICATION_CATEGORIES).toContain(notificationMeta(type).category);
    }
  });
});
