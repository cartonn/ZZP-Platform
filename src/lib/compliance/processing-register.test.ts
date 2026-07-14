import { describe, expect, it } from "vitest";
import {
  LEGAL_BASES,
  LEGAL_BASIS_LABEL,
  PROCESSING_REGISTER,
  PROCESSING_REGISTER_DISCLAIMER,
  RETENTION_SCHEDULE,
  filterByLegalBasis,
  summarizeRegister,
  type LegalBasis,
  type ProcessingActivity,
} from "@/lib/compliance/processing-register";

// --- LEGAL_BASES & LEGAL_BASIS_LABEL ----------------------------------------

describe("LEGAL_BASES", () => {
  it("bevat precies de vier rechtsgronden in de juiste volgorde", () => {
    expect(LEGAL_BASES).toEqual([
      "TOESTEMMING",
      "OVEREENKOMST",
      "WETTELIJKE_VERPLICHTING",
      "GERECHTVAARDIGD_BELANG",
    ]);
  });

  it("LEGAL_BASIS_LABEL bevat een label voor elke rechtsgrond", () => {
    for (const basis of LEGAL_BASES) {
      expect(LEGAL_BASIS_LABEL[basis]).toBeTruthy();
    }
  });

  it("labels bevatten het juiste artikelnummer", () => {
    expect(LEGAL_BASIS_LABEL.TOESTEMMING).toContain("art. 6 lid 1a");
    expect(LEGAL_BASIS_LABEL.OVEREENKOMST).toContain("art. 6 lid 1b");
    expect(LEGAL_BASIS_LABEL.WETTELIJKE_VERPLICHTING).toContain("art. 6 lid 1c");
    expect(LEGAL_BASIS_LABEL.GERECHTVAARDIGD_BELANG).toContain("art. 6 lid 1f");
  });
});

// --- PROCESSING_REGISTER — structuurvalidatie --------------------------------

describe("PROCESSING_REGISTER", () => {
  it("heeft minstens 12 verwerkingsactiviteiten", () => {
    expect(PROCESSING_REGISTER.length).toBeGreaterThanOrEqual(12);
  });

  it("elke activiteit heeft een unieke key", () => {
    const keys = PROCESSING_REGISTER.map((a) => a.key);
    const unieke = new Set(keys);
    expect(unieke.size).toBe(keys.length);
  });

  it("elke activiteit heeft een niet-lege key in kebab-case", () => {
    for (const activity of PROCESSING_REGISTER) {
      expect(activity.key).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });

  it("elke activiteit heeft een niet-lege name", () => {
    for (const activity of PROCESSING_REGISTER) {
      expect(activity.name.trim().length).toBeGreaterThan(0);
    }
  });

  it("elke activiteit heeft een niet-leeg purpose", () => {
    for (const activity of PROCESSING_REGISTER) {
      expect(activity.purpose.trim().length).toBeGreaterThan(0);
    }
  });

  it("elke activiteit heeft een geldige rechtsgrond", () => {
    const validBases: readonly LegalBasis[] = LEGAL_BASES;
    for (const activity of PROCESSING_REGISTER) {
      expect(validBases).toContain(activity.legalBasis);
    }
  });

  it("elke activiteit heeft minimaal één betrokkene", () => {
    for (const activity of PROCESSING_REGISTER) {
      expect(activity.dataSubjects.length).toBeGreaterThan(0);
    }
  });

  it("elke activiteit heeft minimaal één gegevenscategorie", () => {
    for (const activity of PROCESSING_REGISTER) {
      expect(activity.dataCategories.length).toBeGreaterThan(0);
    }
  });

  it("elke activiteit heeft minimaal één ontvanger", () => {
    for (const activity of PROCESSING_REGISTER) {
      expect(activity.recipients.length).toBeGreaterThan(0);
    }
  });

  it("elke activiteit heeft een niet-lege bewaartermijn", () => {
    for (const activity of PROCESSING_REGISTER) {
      expect(activity.retention.trim().length).toBeGreaterThan(0);
    }
  });

  it("elke activiteit heeft minimaal één beveiligingsmaatregel", () => {
    for (const activity of PROCESSING_REGISTER) {
      expect(activity.securityMeasures.length).toBeGreaterThan(0);
    }
  });

  it("minstens één activiteit is gevoelig (VOG/documenten)", () => {
    const sensitiveActivities = PROCESSING_REGISTER.filter((a) => a.sensitive);
    expect(sensitiveActivities.length).toBeGreaterThanOrEqual(1);
  });

  it("certificaten & documentverificatie is gevoelig (art. 10 AVG)", () => {
    const certActivity = PROCESSING_REGISTER.find(
      (a) => a.key === "certificaten-documentverificatie",
    );
    expect(certActivity).toBeDefined();
    expect(certActivity?.sensitive).toBe(true);
  });

  it("facturatie heeft bewaartermijn van 7 jaar (fiscale bewaarplicht)", () => {
    const facturatie = PROCESSING_REGISTER.find(
      (a) => a.key === "facturatie-financiele-administratie",
    );
    expect(facturatie).toBeDefined();
    expect(facturatie?.retention).toContain("7 jaar");
    expect(facturatie?.legalBasis).toBe("WETTELIJKE_VERPLICHTING");
  });

  it("belastingaangifte via gemachtigde is geregistreerd (art. 30) op toestemming + 7 jaar", () => {
    const aangifte = PROCESSING_REGISTER.find((a) => a.key === "belastingaangifte-gemachtigde");
    expect(aangifte).toBeDefined();
    expect(aangifte?.legalBasis).toBe("TOESTEMMING");
    expect(aangifte?.retention).toContain("7 jaar");
    // De gemachtigde (verwerker) en de Belastingdienst moeten als ontvangers vermeld staan.
    expect(aangifte?.recipients.some((r) => r.toLowerCase().includes("gemachtigde"))).toBe(true);
    expect(aangifte?.recipients.some((r) => r.toLowerCase().includes("belastingdienst"))).toBe(
      true,
    );
  });

  it("de auditlog-verwerking gebruikt gerechtvaardigd belang", () => {
    const auditlog = PROCESSING_REGISTER.find(
      (a) => a.key === "beveiliging-auditlog-misbruikpreventie",
    );
    expect(auditlog).toBeDefined();
    expect(auditlog?.legalBasis).toBe("GERECHTVAARDIGD_BELANG");
  });

  it("betaalgedrag-reputatie is geregistreerd (art. 30) op gerechtvaardigd belang, live berekend, met steekproefvloer als waarborg", () => {
    const betaalgedrag = PROCESSING_REGISTER.find((a) => a.key === "betaalgedrag-reputatie");
    expect(betaalgedrag).toBeDefined();
    expect(betaalgedrag?.legalBasis).toBe("GERECHTVAARDIGD_BELANG");
    // Niet-gevoelig, maar wél over identificeerbare opdrachtgevers (incl. eenmanszaken).
    expect(betaalgedrag?.sensitive).toBe(false);
    expect(betaalgedrag?.dataSubjects.some((s) => s.toLowerCase().includes("opdrachtgever"))).toBe(
      true,
    );
    // Uitsluitend geaggregeerde betaaltiming — geen individuele factuur.
    expect(betaalgedrag?.dataCategories.length).toBe(1);
    expect(betaalgedrag?.dataCategories[0].toLowerCase()).toContain("geaggregeerd");
    // Live berekend, niet opgeslagen (geen aparte bewaartermijn).
    expect(betaalgedrag?.retention.toLowerCase()).toContain("niet opgeslagen");
    // De steekproefvloer moet als beveiligingsmaatregel benoemd zijn (spiegelt de markttarief-k-vloer).
    expect(betaalgedrag?.securityMeasures.some((m) => m.includes("PAYMENT_MIN_SAMPLE_SIZE"))).toBe(
      true,
    );
    // Beide ontvanger-kanten: browsende ZZP'ers én de opdrachtgever zelf.
    expect(betaalgedrag?.recipients.some((r) => r.toLowerCase().includes("zzp"))).toBe(true);
  });
});

// --- RETENTION_SCHEDULE — structuurvalidatie ---------------------------------

describe("RETENTION_SCHEDULE", () => {
  it("heeft minimaal 7 regels", () => {
    expect(RETENTION_SCHEDULE.length).toBeGreaterThanOrEqual(7);
  });

  it("elke regel heeft een unieke key", () => {
    const keys = RETENTION_SCHEDULE.map((r) => r.key);
    const unieke = new Set(keys);
    expect(unieke.size).toBe(keys.length);
  });

  it("elke regel heeft een niet-lege category, period en rationale", () => {
    for (const rule of RETENTION_SCHEDULE) {
      expect(rule.category.trim().length).toBeGreaterThan(0);
      expect(rule.period.trim().length).toBeGreaterThan(0);
      expect(rule.rationale.trim().length).toBeGreaterThan(0);
    }
  });

  it("financiële administratie heeft bewaartermijn van 7 jaar", () => {
    const fin = RETENTION_SCHEDULE.find((r) => r.key === "financiele-administratie-facturen");
    expect(fin).toBeDefined();
    expect(fin?.period).toContain("7 jaar");
    expect(fin?.rationale).toContain("52 AWR");
  });

  it("auditlog heeft bewaartermijn van 12 maanden", () => {
    const audit = RETENTION_SCHEDULE.find((r) => r.key === "auditlog-beveiligingslogboeken");
    expect(audit).toBeDefined();
    expect(audit?.period).toContain("12 maanden");
  });

  it("gevoelige documenten verwijzen naar dataminimalisatie of verificatiedoel", () => {
    const docs = RETENTION_SCHEDULE.find((r) => r.key === "gevoelige-documenten");
    expect(docs).toBeDefined();
    expect(docs?.period.toLowerCase()).toContain("noodzakelijk");
  });
});

// --- summarizeRegister -------------------------------------------------------

describe("summarizeRegister", () => {
  it("zonder argument: total === PROCESSING_REGISTER.length", () => {
    const summary = summarizeRegister();
    expect(summary.total).toBe(PROCESSING_REGISTER.length);
  });

  it("zonder argument: som van byLegalBasis === total", () => {
    const summary = summarizeRegister();
    const sum = Object.values(summary.byLegalBasis).reduce((a, b) => a + b, 0);
    expect(sum).toBe(summary.total);
  });

  it("alle vier rechtsgrond-sleutels zijn aanwezig in byLegalBasis", () => {
    const summary = summarizeRegister();
    for (const basis of LEGAL_BASES) {
      expect(summary.byLegalBasis).toHaveProperty(basis);
    }
  });

  it("byLegalBasis-waarden zijn getallen >= 0", () => {
    const summary = summarizeRegister();
    for (const basis of LEGAL_BASES) {
      expect(summary.byLegalBasis[basis]).toBeGreaterThanOrEqual(0);
    }
  });

  it("sensitiveCount telt sensitive === true correct", () => {
    const summary = summarizeRegister();
    const expected = PROCESSING_REGISTER.filter((a) => a.sensitive).length;
    expect(summary.sensitiveCount).toBe(expected);
  });

  it("sensitiveCount >= 1 (er is minstens één gevoelige verwerking)", () => {
    const summary = summarizeRegister();
    expect(summary.sensitiveCount).toBeGreaterThanOrEqual(1);
  });

  it("met een meegegeven subset: werkt correct over die subset", () => {
    const subset: ProcessingActivity[] = [
      {
        key: "test-toestemming",
        name: "Testverwerking A",
        purpose: "Testdoel",
        legalBasis: "TOESTEMMING",
        dataSubjects: ["Testpersonen"],
        dataCategories: ["Naam"],
        sensitive: false,
        recipients: ["Intern"],
        retention: "1 jaar",
        securityMeasures: ["Versleutelde opslag"],
      },
      {
        key: "test-overeenkomst",
        name: "Testverwerking B",
        purpose: "Testdoel",
        legalBasis: "OVEREENKOMST",
        dataSubjects: ["ZZP'ers"],
        dataCategories: ["E-mailadres"],
        sensitive: true,
        recipients: ["Intern"],
        retention: "3 jaar",
        securityMeasures: ["Toegang op rol (RBAC)"],
      },
    ];
    const summary = summarizeRegister(subset);
    expect(summary.total).toBe(2);
    expect(summary.byLegalBasis.TOESTEMMING).toBe(1);
    expect(summary.byLegalBasis.OVEREENKOMST).toBe(1);
    expect(summary.byLegalBasis.WETTELIJKE_VERPLICHTING).toBe(0);
    expect(summary.byLegalBasis.GERECHTVAARDIGD_BELANG).toBe(0);
    expect(summary.sensitiveCount).toBe(1);
  });

  it("met een lege subset: total === 0, sensitiveCount === 0, alle byLegalBasis === 0", () => {
    const summary = summarizeRegister([]);
    expect(summary.total).toBe(0);
    expect(summary.sensitiveCount).toBe(0);
    for (const basis of LEGAL_BASES) {
      expect(summary.byLegalBasis[basis]).toBe(0);
    }
  });
});

// --- filterByLegalBasis -------------------------------------------------------

describe("filterByLegalBasis", () => {
  it("filtert correct op een specifieke rechtsgrond", () => {
    const result = filterByLegalBasis(PROCESSING_REGISTER, "WETTELIJKE_VERPLICHTING");
    expect(result.every((a) => a.legalBasis === "WETTELIJKE_VERPLICHTING")).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("null geeft alle activiteiten terug (ongefilterd)", () => {
    const result = filterByLegalBasis(PROCESSING_REGISTER, null);
    expect(result.length).toBe(PROCESSING_REGISTER.length);
  });

  it("null-resultaat is een andere array-referentie (geen mutatie van invoer)", () => {
    const result = filterByLegalBasis(PROCESSING_REGISTER, null);
    expect(result).not.toBe(PROCESSING_REGISTER);
  });

  it("muteert de invoerlijst niet bij filteren op rechtsgrond", () => {
    const input: ProcessingActivity[] = [...PROCESSING_REGISTER];
    const lenVoor = input.length;
    filterByLegalBasis(input, "OVEREENKOMST");
    expect(input.length).toBe(lenVoor);
  });

  it("muteert de invoerlijst niet bij null-filter", () => {
    const input: ProcessingActivity[] = [...PROCESSING_REGISTER];
    const lenVoor = input.length;
    filterByLegalBasis(input, null);
    expect(input.length).toBe(lenVoor);
  });

  it("gefilterd resultaat bevat geen activiteiten van andere rechtsgronden", () => {
    for (const basis of LEGAL_BASES) {
      const result = filterByLegalBasis(PROCESSING_REGISTER, basis);
      for (const a of result) {
        expect(a.legalBasis).toBe(basis);
      }
    }
  });

  it("resultaat van OVEREENKOMST + WETTELIJKE_VERPLICHTING + GERECHTVAARDIGD_BELANG + TOESTEMMING === total", () => {
    let sum = 0;
    for (const basis of LEGAL_BASES) {
      sum += filterByLegalBasis(PROCESSING_REGISTER, basis).length;
    }
    expect(sum).toBe(PROCESSING_REGISTER.length);
  });

  it("werkt ook met een lege invoerlijst", () => {
    expect(filterByLegalBasis([], "OVEREENKOMST")).toEqual([]);
    expect(filterByLegalBasis([], null)).toEqual([]);
  });
});

// --- PROCESSING_REGISTER_DISCLAIMER ------------------------------------------

describe("PROCESSING_REGISTER_DISCLAIMER", () => {
  it("is een niet-lege string", () => {
    expect(typeof PROCESSING_REGISTER_DISCLAIMER).toBe("string");
    expect(PROCESSING_REGISTER_DISCLAIMER.trim().length).toBeGreaterThan(0);
  });

  it("vermeldt dat het geen juridisch advies is", () => {
    expect(PROCESSING_REGISTER_DISCLAIMER.toLowerCase()).toContain("juridisch advies");
  });

  it("vermeldt de verwerkingsverantwoordelijke", () => {
    expect(PROCESSING_REGISTER_DISCLAIMER.toLowerCase()).toContain("verwerkingsverantwoordelijke");
  });
});
