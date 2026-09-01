import { describe, expect, it } from "vitest";
import {
  ANONYMIZED_JOB_DESCRIPTION,
  ANONYMIZED_JOB_TITLE,
  ANONYMIZED_NAME,
  AUDIT_PII_REDACTED,
  anonymizedEmail,
  canAnonymizeUser,
  companyAnonymizationData,
  freelancerProfileAnonymizationData,
  jobAnonymizationData,
  scrubAuditMetadataEmail,
  scrubAuditMetadataPii,
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
// scrubAuditMetadataPii — redact meerdere PII-waarden (e-mail + naam)
// ---------------------------------------------------------------------------

describe("scrubAuditMetadataPii", () => {
  it("redact zowel de naam als het e-mailadres (FRANCHISE_FREELANCER_ADDED-metadata)", () => {
    const out = scrubAuditMetadataPii(
      JSON.stringify({ tenantId: "t-1", name: "Jan de Vries", skills: 3 }),
      ["jan@bedrijf.nl", "Jan de Vries"],
    );
    const parsed = JSON.parse(out!);
    expect(parsed.name).toBe(AUDIT_PII_REDACTED);
    expect(parsed.tenantId).toBe("t-1");
    expect(parsed.skills).toBe(3);
  });

  it("negeert lege/whitespace PII-waarden (geen over-redactie van lege velden)", () => {
    const meta = JSON.stringify({ name: "", note: "iets" });
    expect(scrubAuditMetadataPii(meta, ["", "   ", null, undefined])).toBe(meta);
  });

  it("raakt een naam die de doelnaam slechts als substring bevat NIET aan", () => {
    const meta = JSON.stringify({ name: "Jan de Vries jr." });
    expect(scrubAuditMetadataPii(meta, ["Jan de Vries"])).toBe(meta);
  });

  it("geeft null/geen-doel veilig terug", () => {
    expect(scrubAuditMetadataPii(null, ["x"])).toBeNull();
    expect(scrubAuditMetadataPii("{}", [])).toBe("{}");
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

  it("weigert wanneer de betrokkene nog een vestiging bezit (ownsTenant) — anders blijft de tenant-PII/owner staan", () => {
    const result = canAnonymizeUser(
      adminActor,
      validTarget({ role: "FRANCHISER", ownsTenant: true }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/vestiging/i);
  });

  it("staat wél toe wanneer de vestiging is overgedragen/gesloten (ownsTenant false)", () => {
    expect(
      canAnonymizeUser(adminActor, validTarget({ role: "FRANCHISER", ownsTenant: false })),
    ).toEqual({ ok: true });
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

  it("wist de login-recency-gedragsmetadata (lastLoginAt/previousLoginAt) — art. 17", () => {
    // Login-recency is toewijsbare gedragsmetadata óver de betrokkene die inzetbaarheids-/
    // roster-dormancy-signalen aan derden voedt; blijft die staan na anonimisering, dan overleeft
    // ze een vergetelheidsverzoek (spiegel van lastReadAt, #1097).
    expect(data.lastLoginAt).toBeNull();
    expect(data.previousLoginAt).toBeNull();
  });

  it("wist het 2FA-geheim en de activeringsdatum (twoFactorSecret/twoFactorEnabledAt) — art. 17", () => {
    // Een geanonimiseerd account mag geen bruikbaar TOTP-geheim of actieve tweestapsverificatie
    // behouden; de herstelcodes worden als aparte rijen fysiek verwijderd in de erasure-transactie.
    expect(data.twoFactorSecret).toBeNull();
    expect(data.twoFactorEnabledAt).toBeNull();
  });

  it("wist de laatst-verbruikte TOTP-tijdteller (twoFactorLastUsedStep) — art. 17 / art. 5(1)(c)", () => {
    // De hoogst-verbruikte TOTP-step is `floor(unixtime/30)` van de laatste geslaagde 2FA-login: een
    // gedragsmetadatum met ~30s-resolutie dat aan de (hernoemde, maar behouden) `User.id` toewijsbaar
    // blijft. Spiegel van lastLoginAt/previousLoginAt (#1097) én van de self-service `disableTwoFactor`,
    // die dit veld al op null zet. Blijft het staan, dan overleeft het exacte inlogmoment een
    // vergetelheidsverzoek — herleidbaar tot de persoon via `step * 30`.
    expect(data.twoFactorLastUsedStep).toBeNull();
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

  it("wist de zelf-getypte quick-apply-standaardtekst (defaultMotivation, AVG art. 17)", () => {
    // Vrije tekst ≤2000 tekens die de betrokkene zelf schreef (spiegelbeeld van Application.motivation).
    // Zonder dit veld overleeft die PII de anonimisering op het profiel (rood→groen).
    expect(data.defaultMotivation).toBeNull();
  });

  it("wist het zelfgekozen financiële maanddoel (monthlyIncomeGoalCents, AVG art. 17)", () => {
    expect(data.monthlyIncomeGoalCents).toBeNull();
  });

  it("wist de publieke portfolio-/websitelink (website, AVG art. 17)", () => {
    // Een zelf-getypte portfolio-URL kan de betrokkene identificeren; zonder dit veld overleeft
    // die de anonimisering op het publieke profiel (rood→groen).
    expect(data.website).toBeNull();
  });

  it("wist de SEPA-betaalrekening (iban, AVG art. 17)", () => {
    // Het IBAN is een direct identificerend financieel persoonsgegeven (bankrekeningnummer van een
    // natuurlijke persoon) dat #970 aan het profiel toevoegde. Zonder dit veld in de
    // anonimiseringsdata overleeft de betaalrekening een verwijderverzoek — een onvolledige
    // art.17-verwijdering (rood→groen: verwijder `iban: null` uit freelancerProfileAnonymizationData
    // en deze assertie faalt).
    expect(data.iban).toBeNull();
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

// ---------------------------------------------------------------------------
// jobAnonymizationData — AVG art. 17: door de opdrachtgever getypte vrije tekst op de opdracht
// ---------------------------------------------------------------------------

describe("jobAnonymizationData", () => {
  const data = jobAnonymizationData();

  it("vervangt de door de opdrachtgever getypte titel en omschrijving door neutrale redactietekst", () => {
    // `title`/`description` zijn niet-nullable vrije tekst die de opdrachtgever zelf typte; bij een
    // eenmanszaak/ZZP-opdrachtgever kunnen ze eigen naam/telefoon/adres bevatten. Zonder deze redactie
    // overleeft die PII een verwijderverzoek en blijft — voor een PUBLISHED-opdracht — publiek
    // zichtbaar (rood→groen).
    expect(data.title).toBe(ANONYMIZED_JOB_TITLE);
    expect(data.description).toBe(ANONYMIZED_JOB_DESCRIPTION);
  });

  it("wist de vrije-tekst-locatie (location → null, AVG art. 17)", () => {
    expect(data.location).toBeNull();
  });
});
