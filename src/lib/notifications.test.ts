import { describe, expect, it } from "vitest";
import { notificationMeta, NOTIFICATION_CATEGORIES } from "@/lib/notifications";

describe("notificationMeta", () => {
  it("mapt cascade- en betaaltypes naar de juiste categorie", () => {
    expect(notificationMeta("INVOICE_SUBMITTED").category).toBe("invoice");
    expect(notificationMeta("PAYMENT_OVERDUE")).toEqual({ category: "payment", tone: "attention" });
    expect(notificationMeta("DBA_SIGNAL").category).toBe("dba");
    expect(notificationMeta("DISPUTE_OPENED").tone).toBe("attention");
  });

  it("valt terug op system/info voor onbekende types", () => {
    expect(notificationMeta("IETS_NIEUWS")).toEqual({ category: "system", tone: "info" });
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
