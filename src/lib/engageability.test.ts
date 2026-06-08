import { describe, expect, it } from "vitest";
import { computeEngageability, RECENCY_STALE_DAYS } from "@/lib/engageability";
import { type FreelancerCredential } from "@/lib/matching";

const now = new Date("2026-06-08T12:00:00Z");
const future = new Date("2027-01-01T00:00:00Z");
const past = new Date("2026-01-01T00:00:00Z");

// Beide verplichte documenten (VOG + INSURANCE) geldig geverifieerd.
const validMandatory: FreelancerCredential[] = [
  { type: "VOG", status: "VERIFIED", expiresAt: future },
  { type: "INSURANCE", status: "VERIFIED", expiresAt: future },
];

const base = {
  credentials: validMandatory,
  completeness: 90,
  availability: "AVAILABLE" as const,
  identityVerified: true,
  lastActiveAt: now,
};

describe("computeEngageability", () => {
  it("is ACTIEF als alle harde eisen voldaan zijn en er geen aandachtspunten zijn", () => {
    const r = computeEngageability(base, now);
    expect(r.status).toBe("ACTIEF");
    expect(r.label).toBe("Inzetbaar");
    expect(r.blockers).toEqual([]);
    expect(r.attention).toEqual([]);
  });

  it("is INACTIEF als een verplicht document ontbreekt", () => {
    const r = computeEngageability(
      { ...base, credentials: [{ type: "VOG", status: "VERIFIED", expiresAt: future }] },
      now,
    );
    expect(r.status).toBe("INACTIEF");
    expect(r.blockers.some((b) => b.includes("ontbreekt"))).toBe(true);
  });

  it("is INACTIEF als een verplicht document is verlopen", () => {
    const r = computeEngageability(
      {
        ...base,
        credentials: [
          { type: "VOG", status: "VERIFIED", expiresAt: past },
          { type: "INSURANCE", status: "VERIFIED", expiresAt: future },
        ],
      },
      now,
    );
    expect(r.status).toBe("INACTIEF");
    expect(r.blockers.some((b) => b.includes("verlopen"))).toBe(true);
  });

  it("is AANDACHT bij een verplicht document in beoordeling (geen harde blocker)", () => {
    const r = computeEngageability(
      {
        ...base,
        credentials: [
          { type: "VOG", status: "VERIFIED", expiresAt: future },
          { type: "INSURANCE", status: "SUBMITTED", expiresAt: null },
        ],
      },
      now,
    );
    expect(r.status).toBe("AANDACHT");
    expect(r.blockers).toEqual([]);
    expect(r.attention.some((a) => a.includes("beoordeling"))).toBe(true);
  });

  it("is AANDACHT bij een onvolledig profiel", () => {
    const r = computeEngageability({ ...base, completeness: 50 }, now);
    expect(r.status).toBe("AANDACHT");
    expect(r.attention.some((a) => a.includes("compleet"))).toBe(true);
  });

  it("is AANDACHT als de identiteit niet geverifieerd is", () => {
    const r = computeEngageability({ ...base, identityVerified: false }, now);
    expect(r.status).toBe("AANDACHT");
    expect(r.attention).toContain("Identiteit niet geverifieerd");
  });

  it("markeert lang-niet-ingelogd als aandachtspunt (recencyStale)", () => {
    const stale = new Date(now.getTime() - (RECENCY_STALE_DAYS + 5) * 86_400_000);
    const r = computeEngageability({ ...base, lastActiveAt: stale }, now);
    expect(r.recencyStale).toBe(true);
    expect(r.status).toBe("AANDACHT");
  });

  it("straft een onbekende laatste login (null) niet", () => {
    const r = computeEngageability({ ...base, lastActiveAt: null }, now);
    expect(r.recencyStale).toBe(false);
    expect(r.status).toBe("ACTIEF");
  });

  it("een harde blocker overschaduwt aandachtspunten (INACTIEF wint)", () => {
    const r = computeEngageability(
      { ...base, credentials: [], completeness: 40, identityVerified: false },
      now,
    );
    expect(r.status).toBe("INACTIEF");
  });
});
