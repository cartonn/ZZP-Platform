import { describe, it, expect } from "vitest";
import {
  buildCredentialExpiryWarningEmail,
  buildCredentialExpiredEmail,
  buildPaymentReminderEmail,
  buildPaymentOverdueEmail,
  buildConceptInvoiceReminderEmail,
  buildVatReminderEmail,
} from "./reminder-emails";

const BASE = { name: "Sanne de Vries", email: "sanne@test.nl", loginUrl: "https://app.test" };

describe("reminder-emails", () => {
  describe("buildCredentialExpiryWarningEmail", () => {
    it("bevat daysLeft en certificaattitel in subject en tekst", () => {
      const msg = buildCredentialExpiryWarningEmail({ ...BASE, credentialTitle: "EHBO-diploma", daysLeft: 14 });
      expect(msg.subject).toContain("14 dag");
      expect(msg.subject).toContain("EHBO-diploma");
      expect(msg.text).toContain("EHBO-diploma");
      expect(msg.html).toContain("14 dag");
    });
    it("to-veld bevat naam én e-mail", () => {
      const msg = buildCredentialExpiryWarningEmail({ ...BASE, credentialTitle: "BIG", daysLeft: 7 });
      expect(msg.to).toBe("Sanne de Vries <sanne@test.nl>");
    });
    it("link verwijst naar /certificaten", () => {
      const msg = buildCredentialExpiryWarningEmail({ ...BASE, credentialTitle: "VOG", daysLeft: 5 });
      expect(msg.text).toContain("/certificaten");
      expect(msg.html).toContain("/certificaten");
    });
  });

  describe("buildCredentialExpiredEmail", () => {
    it("bevat certificaattitel en 'verlopen' in subject en tekst", () => {
      const msg = buildCredentialExpiredEmail({ ...BASE, credentialTitle: "BIG-certificaat" });
      expect(msg.subject).toContain("BIG-certificaat");
      expect(msg.text).toContain("verlopen");
      expect(msg.html).toContain("BIG-certificaat");
    });
    it("link verwijst naar /certificaten", () => {
      const msg = buildCredentialExpiredEmail({ ...BASE, credentialTitle: "VOG" });
      expect(msg.html).toContain("/certificaten");
    });
  });

  describe("buildPaymentReminderEmail", () => {
    it("bevat factuurnummer en daysLeft", () => {
      const msg = buildPaymentReminderEmail({ ...BASE, invoiceNumber: "2026-0001", daysLeft: 5 });
      expect(msg.subject).toContain("2026-0001");
      expect(msg.subject).toContain("5 dag");
      expect(msg.text).toContain("5 dag");
    });
    it("link verwijst naar /facturen", () => {
      const msg = buildPaymentReminderEmail({ ...BASE, invoiceNumber: "2026-0001", daysLeft: 3 });
      expect(msg.html).toContain("/facturen");
    });
  });

  describe("buildPaymentOverdueEmail", () => {
    it("freelancer-variant noemt aanmaning", () => {
      const msg = buildPaymentOverdueEmail({ ...BASE, role: "freelancer", invoiceNumber: "2026-0002" });
      expect(msg.subject).toContain("2026-0002");
      expect(msg.text).toContain("aanmaning");
    });
    it("client-variant vraagt te betalen", () => {
      const msg = buildPaymentOverdueEmail({ ...BASE, role: "client", invoiceNumber: "2026-0003" });
      expect(msg.text).toContain("Betaal rechtstreeks");
    });
    it("link verwijst naar /facturen", () => {
      const msg = buildPaymentOverdueEmail({ ...BASE, role: "client", invoiceNumber: "2026-0004" });
      expect(msg.html).toContain("/facturen");
    });
  });

  describe("buildConceptInvoiceReminderEmail", () => {
    it("bevat factuurnummer en daysSince", () => {
      const msg = buildConceptInvoiceReminderEmail({ ...BASE, invoiceNumber: "2026-0005", daysSince: 3 });
      expect(msg.subject).toContain("2026-0005");
      expect(msg.text).toContain("3 dag");
      expect(msg.html).toContain("3 dag");
    });
    it("link verwijst naar /facturen", () => {
      const msg = buildConceptInvoiceReminderEmail({ ...BASE, invoiceNumber: "2026-0005", daysSince: 7 });
      expect(msg.html).toContain("/facturen");
    });
  });

  describe("buildVatReminderEmail", () => {
    it("bevat kwartaal en jaar in subject, tekst en HTML", () => {
      const msg = buildVatReminderEmail({ ...BASE, quarter: 2, year: 2026 });
      expect(msg.subject).toContain("Q2 2026");
      expect(msg.text).toContain("Q2 2026");
      expect(msg.html).toContain("Q2 2026");
    });
    it("link verwijst naar /administratie", () => {
      const msg = buildVatReminderEmail({ ...BASE, quarter: 1, year: 2026 });
      expect(msg.html).toContain("/administratie");
    });
    it("to-veld is correct geformateerd", () => {
      const msg = buildVatReminderEmail({ ...BASE, quarter: 3, year: 2026 });
      expect(msg.to).toBe("Sanne de Vries <sanne@test.nl>");
    });
  });

  it("to-veld zonder naam: alleen e-mailadres", () => {
    const msg = buildVatReminderEmail({ name: "", email: "anon@test.nl", loginUrl: "https://app.test", quarter: 1, year: 2026 });
    expect(msg.to).toBe("anon@test.nl");
  });
});
