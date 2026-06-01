import { describe, expect, it } from "vitest";
import { buildComplianceDossier, type DossierInput } from "@/lib/compliance/dossier";

const base: DossierInput = {
  jobTitle: "Verpleegkundige nachtdienst",
  freelancerName: "Fatima El Amrani",
  companyName: "Zorggroep X",
  contractStatus: "SIGNED",
  dbaRisk: "LAAG",
  dbaReasons: ["Vrije vervanging mogelijk"],
  modelAgreementType: "Geen werkgeversgezag",
  credentials: [
    {
      type: "LICENSE",
      title: "BIG-registratie",
      status: "VERIFIED",
      verifiedAt: new Date("2026-01-10"),
    },
  ],
  performances: [{ description: "Week 1", status: "APPROVED", approvedAt: new Date("2026-02-01") }],
  invoices: [
    {
      number: "2026-0001",
      lifecycleStatus: "PAID",
      totalCents: 121000,
      submittedAt: new Date("2026-02-05"),
    },
  ],
  startDate: new Date("2026-01-15"),
  createdAt: new Date("2026-01-01"),
};

describe("buildComplianceDossier", () => {
  it("bouwt alle zes de secties", () => {
    const d = buildComplianceDossier(base);
    expect(d.sections.map((s) => s.key)).toEqual([
      "dba",
      "model",
      "contract",
      "verificatie",
      "prestaties",
      "facturen",
    ]);
  });

  it("een schone samenwerking heeft geen aandachtspunten", () => {
    const d = buildComplianceDossier(base);
    expect(d.attentionCount).toBe(0);
  });

  it("HOOG DBA-risico zonder modelovereenkomst geeft aandachtspunten", () => {
    const d = buildComplianceDossier({ ...base, dbaRisk: "HOOG", modelAgreementType: null });
    expect(d.sections.find((s) => s.key === "dba")?.attention).toBe(true);
    expect(d.sections.find((s) => s.key === "model")?.attention).toBe(true);
    expect(d.attentionCount).toBeGreaterThanOrEqual(2);
  });

  it("verlopen certificaat en te late factuur zijn aandachtspunten", () => {
    const d = buildComplianceDossier({
      ...base,
      credentials: [{ type: "VOG", title: "VOG", status: "EXPIRED", verifiedAt: null }],
      invoices: [
        { number: "2026-0002", lifecycleStatus: "OVERDUE", totalCents: 50000, submittedAt: null },
      ],
    });
    expect(d.sections.find((s) => s.key === "verificatie")?.attention).toBe(true);
    expect(d.sections.find((s) => s.key === "facturen")?.attention).toBe(true);
  });

  it("ongetekend contract is een aandachtspunt", () => {
    const d = buildComplianceDossier({ ...base, contractStatus: "SENT" });
    expect(d.sections.find((s) => s.key === "contract")?.attention).toBe(true);
  });

  it("tijdlijn is chronologisch gesorteerd (oudste eerst)", () => {
    const d = buildComplianceDossier(base);
    const times = d.timeline.map((t) => t.at.getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(d.timeline[0]?.label).toContain("aangemaakt");
  });
});
