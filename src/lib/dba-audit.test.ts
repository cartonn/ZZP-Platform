import { describe, expect, it } from "vitest";
import {
  buildDbaAuditData,
  DBA_AUDIT_FOOTER,
  type DbaAuditCollaboration,
  type DbaAuditCredential,
  type DbaAuditParties,
} from "@/lib/dba-audit";

const now = new Date("2026-06-10T12:00:00.000Z");

const baseCol: DbaAuditCollaboration & {
  job: { title: string } & {
    dbaDirectSupervision: boolean;
    dbaEmbedded: boolean;
    dbaFixedSchedule: boolean;
    dbaNoSubstitution: boolean;
    dbaExclusive: boolean;
    dbaWeakEntrepreneurship: boolean;
    dbaDurationMonths: number | null;
  };
} = {
  id: "col-1",
  startDate: new Date("2025-12-10"),
  endDate: null,
  rate: 75,
  agreementType: "VRIJE_VERVANGING",
  agreementFreelancerSignedAt: new Date("2025-12-01"),
  agreementClientSignedAt: new Date("2025-12-02"),
  job: {
    title: "Senior Developer",
    dbaDirectSupervision: false,
    dbaEmbedded: false,
    dbaFixedSchedule: false,
    dbaNoSubstitution: false,
    dbaExclusive: false,
    dbaWeakEntrepreneurship: false,
    dbaDurationMonths: null,
  },
};

const baseParties: DbaAuditParties = {
  freelancerName: "Jan de Vries",
  companyName: "Acme BV",
  kvkNumber: "12345678",
  btwNumber: "NL001234567B01",
};

const verifiedCredential: DbaAuditCredential = {
  type: "VOG",
  title: "VOG 2025",
  status: "VERIFIED",
  verifiedAt: new Date("2025-06-01"),
  expiresAt: null,
};

const draftCredential: DbaAuditCredential = {
  type: "DIPLOMA",
  title: "HBO Verpleegkunde",
  status: "DRAFT",
  verifiedAt: null,
  expiresAt: null,
};

// VERIFIED in de DB, maar de vervaldatum ligt vóór `now` (2026-06-10) — de expiry-cron heeft de
// status nog niet naar EXPIRED geflipt. Server-side geldt dit als verlopen.
const expiredVerifiedCredential: DbaAuditCredential = {
  type: "VOG",
  title: "VOG 2024",
  status: "VERIFIED",
  verifiedAt: new Date("2024-06-01"),
  expiresAt: new Date("2026-06-09T12:00:00.000Z"),
};

describe("buildDbaAuditData — footer & disclaimer", () => {
  it("footer is altijd aanwezig en gelijk aan DBA_AUDIT_FOOTER", () => {
    const data = buildDbaAuditData(baseCol, baseParties, [], now);
    expect(data.footer).toBe(DBA_AUDIT_FOOTER);
    expect(data.footer).toContain("Hulpmiddel");
    expect(data.footer).toContain("geen juridisch advies");
    expect(data.footer).toContain("Belastingdienst");
  });

  it("dbaAssessment.disclaimer is altijd aanwezig en niet leeg", () => {
    const data = buildDbaAuditData(baseCol, baseParties, [], now);
    expect(data.dbaAssessment.disclaimer).toBeTruthy();
    expect(data.dbaAssessment.disclaimer.length).toBeGreaterThan(20);
  });
});

describe("buildDbaAuditData — modelovereenkomst-status", () => {
  it("vertaalt VRIJE_VERVANGING correct naar een label", () => {
    const data = buildDbaAuditData(baseCol, baseParties, [], now);
    expect(data.agreement.typeLabel).toBe("Vrije vervanging");
  });

  it("beide partijen ondertekend → bothSigned = true", () => {
    const data = buildDbaAuditData(baseCol, baseParties, [], now);
    expect(data.agreement.bothSigned).toBe(true);
    expect(data.agreement.freelancerSigned).toMatch(/Digitaal akkoord/);
    expect(data.agreement.clientSigned).toMatch(/Digitaal akkoord/);
  });

  it("geen handtekening ZZP'er → bothSigned = false", () => {
    const col = { ...baseCol, agreementFreelancerSignedAt: null };
    const data = buildDbaAuditData(col, baseParties, [], now);
    expect(data.agreement.bothSigned).toBe(false);
    expect(data.agreement.freelancerSigned).toBe("Nog niet ondertekend");
  });

  it("geen handtekening opdrachtgever → bothSigned = false", () => {
    const col = { ...baseCol, agreementClientSignedAt: null };
    const data = buildDbaAuditData(col, baseParties, [], now);
    expect(data.agreement.bothSigned).toBe(false);
    expect(data.agreement.clientSigned).toBe("Nog niet ondertekend");
  });

  it("geen overeenkomst-type → typeLabel = 'Niet vastgelegd'", () => {
    const col = { ...baseCol, agreementType: null };
    const data = buildDbaAuditData(col, baseParties, [], now);
    expect(data.agreement.typeLabel).toBe("Niet vastgelegd");
  });
});

describe("buildDbaAuditData — DBA-indicatoren", () => {
  it("6 indicatoren altijd aanwezig", () => {
    const data = buildDbaAuditData(baseCol, baseParties, [], now);
    expect(data.dbaAssessment.indicators).toHaveLength(6);
  });

  it("directe aansturing aan → HOOG niveau voor gezag-indicator", () => {
    const col = { ...baseCol, job: { ...baseCol.job, dbaDirectSupervision: true } };
    const data = buildDbaAuditData(col, baseParties, [], now);
    const ind = data.dbaAssessment.indicators.find((i) => i.key === "gezag");
    expect(ind?.level).toBe("HOOG");
    expect(ind?.value).toBe(true);
  });

  it("alle indicatoren uitgeschakeld → risicosignaal LAAG", () => {
    const data = buildDbaAuditData(baseCol, baseParties, [], now);
    // Startdatum is ~6 maanden geleden → VERHOOGD door duur
    // Maar de overige indicatoren zijn LAAG
    const gezag = data.dbaAssessment.indicators.find((i) => i.key === "gezag");
    expect(gezag?.level).toBe("LAAG");
    const inbedding = data.dbaAssessment.indicators.find((i) => i.key === "inbedding");
    expect(inbedding?.level).toBe("LAAG");
  });

  it("duur-indicator bevat het berekend aantal maanden", () => {
    const data = buildDbaAuditData(baseCol, baseParties, [], now);
    const duurInd = data.dbaAssessment.indicators.find((i) => i.key === "duur");
    // startDate = 2025-12-10, now = 2026-06-10 → 6 maanden
    expect(duurInd).toBeDefined();
    expect(duurInd?.reason).toMatch(/6 maanden/);
  });

  it("startDate null → duur-indicator value = null, reason vermeldt ontbrekend", () => {
    const col = { ...baseCol, startDate: null };
    const data = buildDbaAuditData(col, baseParties, [], now);
    const duurInd = data.dbaAssessment.indicators.find((i) => i.key === "duur");
    expect(duurInd?.value).toBeNull();
    expect(duurInd?.reason).toMatch(/niet vastgelegd/i);
  });

  it("supervisie + inbedding aan → risicosignaal HOOG", () => {
    const col = {
      ...baseCol,
      job: { ...baseCol.job, dbaDirectSupervision: true, dbaEmbedded: true },
    };
    const data = buildDbaAuditData(col, baseParties, [], now);
    expect(data.dbaAssessment.level).toBe("HOOG");
  });
});

describe("buildDbaAuditData — rechtsvermoeden tarieftoets", () => {
  it("tarief boven drempel → belowThreshold = false", () => {
    const data = buildDbaAuditData(baseCol, baseParties, [], now);
    // rate = 75 EUR = 7500 cent > 3800 cent drempel
    expect(data.rateThreshold.belowThreshold).toBe(false);
    expect(data.rateThreshold.rateCentsSnapshot).toBe(7500);
  });

  it("tarief onder drempel (€30) → belowThreshold = true", () => {
    const col = { ...baseCol, rate: 30 };
    const data = buildDbaAuditData(col, baseParties, [], now);
    expect(data.rateThreshold.belowThreshold).toBe(true);
    expect(data.rateThreshold.hint).toMatch(/onder de drempel/);
  });

  it("geen tarief → belowThreshold = false, rateCentsSnapshot = null", () => {
    const col = { ...baseCol, rate: null };
    const data = buildDbaAuditData(col, baseParties, [], now);
    expect(data.rateThreshold.belowThreshold).toBe(false);
    expect(data.rateThreshold.rateCentsSnapshot).toBeNull();
  });
});

describe("buildDbaAuditData — ondernemerschap-signalen", () => {
  it("geverifieerde certificaten worden meegeteld", () => {
    const data = buildDbaAuditData(
      baseCol,
      baseParties,
      [verifiedCredential, draftCredential],
      now,
    );
    expect(data.entrepreneurship.verifiedCredentialCount).toBe(1);
  });

  it("geen geverifieerde certificaten → count = 0", () => {
    const data = buildDbaAuditData(baseCol, baseParties, [draftCredential], now);
    expect(data.entrepreneurship.verifiedCredentialCount).toBe(0);
  });

  it("een VERIFIED-certificaat met gepasseerde vervaldatum telt niet mee (server-verlopen)", () => {
    const data = buildDbaAuditData(baseCol, baseParties, [expiredVerifiedCredential], now);
    expect(data.entrepreneurship.verifiedCredentialCount).toBe(0);
    expect(data.entrepreneurship.trustLevel).toBe("BASIS");
  });

  it("een VERIFIED-certificaat met vervaldatum in de toekomst telt wél mee", () => {
    const future: DbaAuditCredential = {
      ...expiredVerifiedCredential,
      expiresAt: new Date("2027-06-10T12:00:00.000Z"),
    };
    const data = buildDbaAuditData(baseCol, baseParties, [future], now);
    expect(data.entrepreneurship.verifiedCredentialCount).toBe(1);
    expect(data.entrepreneurship.trustLevel).toBe("DEELS");
  });

  it("verlopen én geldig gemengd → alleen de geldige telt", () => {
    const data = buildDbaAuditData(
      baseCol,
      baseParties,
      [expiredVerifiedCredential, verifiedCredential],
      now,
    );
    expect(data.entrepreneurship.verifiedCredentialCount).toBe(1);
  });

  it("KvK en BTW aanwezig → hasKvk en hasBtw true", () => {
    const data = buildDbaAuditData(baseCol, baseParties, [], now);
    expect(data.entrepreneurship.hasKvk).toBe(true);
    expect(data.entrepreneurship.hasBtw).toBe(true);
  });

  it("geen KvK of BTW → false", () => {
    const parties = { ...baseParties, kvkNumber: null, btwNumber: null };
    const data = buildDbaAuditData(baseCol, parties, [], now);
    expect(data.entrepreneurship.hasKvk).toBe(false);
    expect(data.entrepreneurship.hasBtw).toBe(false);
  });
});

describe("buildDbaAuditData — header-metadata", () => {
  it("job-titel en partijen in de header", () => {
    const data = buildDbaAuditData(baseCol, baseParties, [], now);
    expect(data.header.jobTitle).toBe("Senior Developer");
    expect(data.header.freelancerName).toBe("Jan de Vries");
    expect(data.header.companyName).toBe("Acme BV");
  });

  it("periodeLabel met einddatum", () => {
    const col = { ...baseCol, endDate: new Date("2026-12-31") };
    const data = buildDbaAuditData(col, baseParties, [], now);
    expect(data.header.periodLabel).toMatch(/t\/m/);
  });

  it("periodeLabel zonder einddatum", () => {
    const data = buildDbaAuditData(baseCol, baseParties, [], now);
    expect(data.header.periodLabel).toMatch(/Vanaf/);
  });

  it("collaborationId is meegegeven", () => {
    const data = buildDbaAuditData(baseCol, baseParties, [], now);
    expect(data.collaborationId).toBe("col-1");
  });

  it("generatedAt is de meegegeven 'now'", () => {
    const data = buildDbaAuditData(baseCol, baseParties, [], now);
    expect(data.generatedAt).toBe(now);
  });
});
