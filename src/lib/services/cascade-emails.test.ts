import { describe, it, expect } from "vitest";
import {
  buildContractSignedEmail,
  buildPerformanceSubmittedEmail,
  buildPerformanceApprovedEmail,
  buildPerformanceRejectedEmail,
  buildInvoiceSubmittedEmail,
  buildInvoiceApprovedEmail,
  buildInvoiceRejectedEmail,
  buildPaymentConfirmedEmail,
} from "@/lib/services/cascade-emails";

const freelancer = { name: "Sanne de Vries", email: "sanne@zzp.nl" };
const client = { name: "Acme BV", email: "inkoop@acme.nl" };
const link = "https://app.zzp-platform.nl/samenwerkingen/collab-1";

describe("buildContractSignedEmail", () => {
  it("bevat opdrachtnaam, link en ontvanger", () => {
    const msg = buildContractSignedEmail({
      recipient: client,
      jobTitle: "Verpleegkundige thuiszorg",
      link,
    });
    expect(msg.subject).toContain("Verpleegkundige thuiszorg");
    expect(msg.to).toContain("inkoop@acme.nl");
    expect(msg.text).toContain("contract");
    expect(msg.text).toContain(link);
    expect(msg.html).toContain("Verpleegkundige thuiszorg");
  });

  it("formatteert ontvanger met naam", () => {
    const msg = buildContractSignedEmail({ recipient: freelancer, jobTitle: "Job", link });
    expect(msg.to).toBe("Sanne de Vries <sanne@zzp.nl>");
  });

  it("gebruikt alleen e-mailadres als naam ontbreekt", () => {
    const msg = buildContractSignedEmail({
      recipient: { name: "", email: "test@zzp.nl" },
      jobTitle: "Job",
      link,
    });
    expect(msg.to).toBe("test@zzp.nl");
  });
});

describe("buildPerformanceSubmittedEmail", () => {
  it("noemt de naam van de ZZP'er en de opdrachtnaam", () => {
    const msg = buildPerformanceSubmittedEmail({
      recipient: client,
      freelancerName: "Sanne de Vries",
      jobTitle: "Zorgbegeleiding",
      link,
    });
    expect(msg.subject).toContain("Zorgbegeleiding");
    expect(msg.text).toContain("Sanne de Vries");
    expect(msg.text).toContain("urenstaat");
    expect(msg.html).toContain("Sanne de Vries");
  });
});

describe("buildPerformanceApprovedEmail", () => {
  it("vermeldt concept-factuur aangemaakt", () => {
    const msg = buildPerformanceApprovedEmail({
      recipient: freelancer,
      jobTitle: "Zorgbegeleiding",
      link,
    });
    expect(msg.subject).toContain("goedgekeurd");
    expect(msg.text).toContain("concept-factuur");
    expect(msg.html).toContain("concept-factuur");
  });
});

describe("buildPerformanceRejectedEmail", () => {
  it("bevat de afwijzingsreden in tekst en HTML", () => {
    const msg = buildPerformanceRejectedEmail({
      recipient: freelancer,
      jobTitle: "Zorgbegeleiding",
      reason: "Uren kloppen niet met de dienstroosters",
      link,
    });
    expect(msg.subject).toContain("afgekeurd");
    expect(msg.text).toContain("Uren kloppen niet met de dienstroosters");
    expect(msg.html).toContain("Uren kloppen niet met de dienstroosters");
  });

  it("escapet speciale tekens in de reden", () => {
    const msg = buildPerformanceRejectedEmail({
      recipient: freelancer,
      jobTitle: "Job",
      reason: "Bedrag > verwacht & < factuur",
      link,
    });
    expect(msg.html).toContain("&gt;");
    expect(msg.html).toContain("&amp;");
    expect(msg.html).toContain("&lt;");
  });
});

describe("buildInvoiceSubmittedEmail", () => {
  it("formateert het bedrag als euro (punt voor duizendtallen, komma voor decimalen)", () => {
    const msg = buildInvoiceSubmittedEmail({
      recipient: client,
      freelancerName: "Sanne de Vries",
      jobTitle: "Thuiszorg",
      totalCents: 123456,
      link,
    });
    expect(msg.text).toContain("1.234,56");
    expect(msg.subject).toContain("Factuur ontvangen");
    expect(msg.text).toContain("Sanne de Vries");
  });

  it("formateert ronde bedragen correct", () => {
    const msg = buildInvoiceSubmittedEmail({
      recipient: client,
      freelancerName: "Jan",
      jobTitle: "Job",
      totalCents: 100000,
      link,
    });
    expect(msg.text).toContain("1.000,00");
  });
});

describe("buildInvoiceApprovedEmail", () => {
  it("bevat bedrag en vervaldatum", () => {
    const msg = buildInvoiceApprovedEmail({
      recipient: freelancer,
      jobTitle: "Thuiszorg",
      totalCents: 50000,
      dueAt: new Date("2026-06-30"),
      link,
    });
    expect(msg.subject).toContain("goedgekeurd");
    expect(msg.text).toContain("500,00");
    expect(msg.text).toContain("30-06-2026");
    expect(msg.html).toContain("30-06-2026");
  });

  it("werkt zonder vervaldatum", () => {
    const msg = buildInvoiceApprovedEmail({
      recipient: freelancer,
      jobTitle: "Thuiszorg",
      totalCents: 50000,
      dueAt: null,
      link,
    });
    expect(msg.text).toContain("500,00");
    expect(msg.text).not.toContain("Betaaldatum");
  });
});

describe("buildInvoiceRejectedEmail", () => {
  it("bevat de reden in tekst en HTML", () => {
    const msg = buildInvoiceRejectedEmail({
      recipient: freelancer,
      jobTitle: "Thuiszorg",
      reason: "Verkeerd bedrag vermeld",
      link,
    });
    expect(msg.subject).toContain("afgekeurd");
    expect(msg.text).toContain("Verkeerd bedrag vermeld");
    expect(msg.html).toContain("Verkeerd bedrag vermeld");
  });
});

describe("buildPaymentConfirmedEmail", () => {
  it("bevat bedrag en opdrachtnaam", () => {
    const msg = buildPaymentConfirmedEmail({
      recipient: freelancer,
      jobTitle: "Thuiszorg",
      totalCents: 75000,
      link,
    });
    expect(msg.subject).toContain("Betaling bevestigd");
    expect(msg.text).toContain("750,00");
    expect(msg.text).toContain("Thuiszorg");
    expect(msg.html).toContain("750,00");
  });

  it("bevat de link naar de samenwerking", () => {
    const msg = buildPaymentConfirmedEmail({
      recipient: client,
      jobTitle: "Job",
      totalCents: 10000,
      link,
    });
    expect(msg.text).toContain(link);
    expect(msg.html).toContain(link);
  });
});
