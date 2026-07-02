import { describe, expect, it } from "vitest";
import { employabilitySummary } from "@/lib/employability-summary";
import { computeEngageability } from "@/lib/engageability";
import { mandatoryDocuments } from "@/lib/mandatory-documents";
import { type FreelancerCredential } from "@/lib/matching";

const now = new Date("2026-07-02T12:00:00Z");
const future = new Date("2027-01-01T00:00:00Z");
const past = new Date("2026-01-01T00:00:00Z");

const validMandatory: FreelancerCredential[] = [
  { type: "VOG", status: "VERIFIED", expiresAt: future },
  { type: "INSURANCE", status: "VERIFIED", expiresAt: future },
];

function summarize(credentials: FreelancerCredential[], completeness = 90) {
  const eng = computeEngageability(
    {
      credentials,
      completeness,
      availability: "AVAILABLE",
      identityVerified: true,
      lastActiveAt: now,
    },
    now,
  );
  return employabilitySummary(eng, mandatoryDocuments(credentials, now));
}

describe("employabilitySummary", () => {
  it("is ACTIEF zonder blocker en verwijst naar het certificaten-overzicht", () => {
    const s = summarize(validMandatory);
    expect(s.level).toBe("ACTIEF");
    expect(s.label).toBe("Inzetbaar");
    expect(s.labelWithBlocker).toBe("Inzetbaar");
    expect(s.blocker).toBeNull();
    expect(s.href).toBe("/certificaten");
  });

  it("benoemt de eerste blocker in labelWithBlocker als een verplicht document ontbreekt", () => {
    // Alleen INSURANCE aanwezig → VOG ontbreekt (eerste in de verplichte volgorde).
    const s = summarize([{ type: "INSURANCE", status: "VERIFIED", expiresAt: future }]);
    expect(s.level).toBe("INACTIEF");
    expect(s.label).toBe("Nog niet inzetbaar");
    expect(s.blocker).toBe("VOG ontbreekt");
    expect(s.labelWithBlocker).toBe("Nog niet inzetbaar — VOG ontbreekt");
  });

  it("deep-linkt naar het uploadformulier van het eerste ontbrekende verplichte type", () => {
    const s = summarize([{ type: "INSURANCE", status: "VERIFIED", expiresAt: future }]);
    expect(s.href).toBe("/certificaten/nieuw?type=VOG");
  });

  it("deep-linkt naar het verlopen verplichte document", () => {
    const s = summarize([
      { type: "VOG", status: "VERIFIED", expiresAt: future },
      { type: "INSURANCE", status: "VERIFIED", expiresAt: past },
    ]);
    expect(s.level).toBe("INACTIEF");
    expect(s.blocker).toBe("Verzekering is verlopen");
    expect(s.href).toBe("/certificaten/nieuw?type=INSURANCE");
  });

  it("leest een INGEDIEND (SUBMITTED) verplicht document als 'in beoordeling', niet als blocker", () => {
    // Regressie: dashboard (alle statussen) en profiel (owner-scoped, alle statussen) moeten
    // hetzelfde oordeel geven. Een SUBMITTED VOG mag geen harde 'ontbreekt'-blocker opleveren.
    const s = summarize([
      { type: "VOG", status: "SUBMITTED", expiresAt: null },
      { type: "INSURANCE", status: "VERIFIED", expiresAt: future },
    ]);
    expect(s.level).toBe("AANDACHT");
    expect(s.blocker).toBeNull();
    expect(s.labelWithBlocker).toBe("Aandacht nodig");
    expect(s.href).toBe("/certificaten");
  });

  it("toont bij AANDACHT (geen harde blocker) het kale label en geen deep-link", () => {
    // Alle verplichte documenten in orde, maar profiel onvolledig → AANDACHT, geen blocker.
    const s = summarize(validMandatory, 40);
    expect(s.level).toBe("AANDACHT");
    expect(s.label).toBe("Aandacht nodig");
    expect(s.blocker).toBeNull();
    expect(s.labelWithBlocker).toBe("Aandacht nodig");
    expect(s.href).toBe("/certificaten");
  });
});
