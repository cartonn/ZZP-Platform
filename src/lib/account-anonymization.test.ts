import { describe, expect, it } from "vitest";
import {
  ANONYMIZED_NAME,
  AUDIT_PII_REDACTED,
  anonymizedEmail,
  canAnonymizeUser,
  companyAnonymizationData,
  freelancerProfileAnonymizationData,
  scrubAuditMetadataEmail,
  userAnonymizationData,
} from "@/lib/account-anonymization";

// ---------------------------------------------------------------------------
// scrubAuditMetadataEmail — AVG art. 17 dekt ook de auditlog
// ---------------------------------------------------------------------------

describe("scrubAuditMetadataEmail", () => {
  it("redact een exact matchend e-mailadres en behoudt andere velden", () => {
    const out = scrubAuditMetadataEmail(
      JSON.stringify({ role: "FREELANCER", email: "jan@bedrijf.nl" }),
      "jan@bedrijf.nl",
    );
    const parsed = JSON.parse(out!);
    expect(parsed.email).toBe(AUDIT_PII_REDACTED);
    expect(parsed.role).toBe("FREELANCER");
  });

  it("matcht hoofdletter-ongevoelig", () => {
    const out = scrubAuditMetadataEmail(
      JSON.stringify({ email: "Jan@Bedrijf.NL" }),
      "jan@bedrijf.nl",
    );
    expect(JSON.parse(out!).email).toBe(AUDIT_PII_REDACTED);
  });

  it("raakt een adres dat het doeladres slechts als substring bevat NIET aan", () => {
    const meta = JSON.stringify({ email: "boaz-jan@bedrijf.nl" });
    expect(scrubAuditMetadataEmail(meta, "jan@bedrijf.nl")).toBe(meta);
  });

  it("laat metadata zonder het adres ongewijzigd", () => {
    const meta = JSON.stringify({ from: "ACTIVE", to: "SUSPENDED" });
    expect(scrubAuditMetadataEmail(meta, "jan@bedrijf.nl")).toBe(meta);
  });

  it("geeft null/lege invoer veilig terug", () => {
    expect(scrubAuditMetadataEmail(null, "jan@bedrijf.nl")).toBeNull();
    expect(scrubAuditMetadataEmail("{}", "")).toBe("{}");
  });

  it("laat ongeldige JSON ongemoeid (defensief)", () => {
    expect(scrubAuditMetadataEmail("niet-json", "jan@bedrijf.nl")).toBe("niet-json");
  });
});

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

const adminActor = { id: "admin-1", role: "ADMIN" as const };

function validTarget(overrides: Partial<Parameters<typeof canAnonymizeUser>[1]> = {}) {
  return {
    id: "user-42",
    role: "FREELANCER" as const,
    deletionRequestedAt: new Date("2026-05-01T00:00:00Z"),
    anonymizedAt: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// anonymizedEmail
// ---------------------------------------------------------------------------

describe("anonymizedEmail", () => {
  it("is deterministisch: zelfde input geeft zelfde output", () => {
    expect(anonymizedEmail("abc-123")).toBe(anonymizedEmail("abc-123"));
  });

  it("bevat de userId in het adres", () => {
    const id = "user-99";
    expect(anonymizedEmail(id)).toContain(id);
  });

  it("eindigt op @anoniem.invalid", () => {
    expect(anonymizedEmail("user-1")).toMatch(/@anoniem\.invalid$/);
  });

  it("twee verschillende ids leveren twee verschillende adressen", () => {
    expect(anonymizedEmail("id-A")).not.toBe(anonymizedEmail("id-B"));
  });

  it("behoudt unique-constraint: uniek per userId", () => {
    const ids = ["alfa", "beta", "gamma", "delta"];
    const addresses = ids.map(anonymizedEmail);
    const unique = new Set(addresses);
    expect(unique.size).toBe(ids.length);
  });
});

// ---------------------------------------------------------------------------
// canAnonymizeUser — happy path
// ---------------------------------------------------------------------------

describe("canAnonymizeUser — happy path", () => {
  it("staat toe: ADMIN op geldige niet-admin target met openstaand verzoek", () => {
    expect(canAnonymizeUser(adminActor, validTarget())).toEqual({ ok: true });
  });
});

// ---------------------------------------------------------------------------
// canAnonymizeUser — afwijzingen
// ---------------------------------------------------------------------------

describe("canAnonymizeUser — afwijzingen", () => {
  it("weigert een niet-beheerder als actor", () => {
    const result = canAnonymizeUser({ id: "user-1", role: "FREELANCER" }, validTarget());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason.length).toBeGreaterThan(0);
  });

  it("weigert wanneer actor.id === target.id (eigen account)", () => {
    const result = canAnonymizeUser(adminActor, validTarget({ id: adminActor.id }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason.length).toBeGreaterThan(0);
  });

  it("weigert wanneer target de rol ADMIN heeft", () => {
    const result = canAnonymizeUser(adminActor, validTarget({ role: "ADMIN" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason.length).toBeGreaterThan(0);
  });

  it("weigert wanneer target al geanonimiseerd is (anonymizedAt gezet)", () => {
    const result = canAnonymizeUser(
      adminActor,
      validTarget({ anonymizedAt: new Date("2026-04-01T00:00:00Z") }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason.length).toBeGreaterThan(0);
  });

  it("weigert wanneer er geen verwijderverzoek is (deletionRequestedAt null)", () => {
    const result = canAnonymizeUser(adminActor, validTarget({ deletionRequestedAt: null }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// userAnonymizationData
// ---------------------------------------------------------------------------

describe("userAnonymizationData", () => {
  const now = new Date("2026-05-31T10:00:00Z");
  const userId = "user-77";
  const data = userAnonymizationData(userId, now);

  it("zet name op ANONYMIZED_NAME", () => {
    expect(data.name).toBe(ANONYMIZED_NAME);
  });

  it("zet email op anonymizedEmail(userId)", () => {
    expect(data.email).toBe(anonymizedEmail(userId));
  });

  it("maakt passwordHash leeg zodat inloggen onmogelijk is", () => {
    expect(data.passwordHash).toBe("");
  });

  it("zet status op SUSPENDED", () => {
    expect(data.status).toBe("SUSPENDED");
  });

  it("zet anonymizedAt op het opgegeven tijdstip", () => {
    expect(data.anonymizedAt).toBe(now);
  });

  it("wist deletionRequestedAt", () => {
    expect(data.deletionRequestedAt).toBeNull();
  });

  it("wist identityVerifiedAt", () => {
    expect(data.identityVerifiedAt).toBeNull();
  });

  it("wist verifiedLegalName", () => {
    expect(data.verifiedLegalName).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// freelancerProfileAnonymizationData
// ---------------------------------------------------------------------------

describe("freelancerProfileAnonymizationData", () => {
  const data = freelancerProfileAnonymizationData();

  it("zet visibility op PRIVATE", () => {
    expect(data.visibility).toBe("PRIVATE");
  });

  it("wist alle vrije-tekst- en identificerende velden", () => {
    expect(data.headline).toBeNull();
    expect(data.bio).toBeNull();
    expect(data.location).toBeNull();
    expect(data.languages).toBeNull();
    expect(data.kvkNumber).toBeNull();
    expect(data.btwNumber).toBeNull();
    expect(data.hourlyRate).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// companyAnonymizationData
// ---------------------------------------------------------------------------

describe("companyAnonymizationData", () => {
  const data = companyAnonymizationData();

  it("zet name op ANONYMIZED_NAME", () => {
    expect(data.name).toBe(ANONYMIZED_NAME);
  });

  it("wist description, website, location en logoKey", () => {
    expect(data.description).toBeNull();
    expect(data.website).toBeNull();
    expect(data.location).toBeNull();
    expect(data.logoKey).toBeNull();
  });
});
