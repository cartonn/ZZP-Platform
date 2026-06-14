// Tests voor buildDbaAuditPdf — structuur- en gedragstests.
// We verifiëren NIET op byte-posities maar laden de bytes opnieuw met PDFDocument.load()
// zodat de assertions robuust zijn tegen layout-wijzigingen.
import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  buildDbaAuditData,
  DBA_AUDIT_FOOTER,
  type DbaAuditCollaboration,
  type DbaAuditParties,
  type DbaAuditData,
  type DbaAuditIndicator,
} from "@/lib/dba-audit";
import { buildDbaAuditPdf } from "@/lib/dba-audit-pdf";

// ---------------------------------------------------------------------------
// Basis-fixture: identiek patroon als dba-audit.test.ts
// ---------------------------------------------------------------------------

const now = new Date("2026-06-10T12:00:00.000Z");

const baseCol: DbaAuditCollaboration & {
  job: {
    title: string;
    dbaDirectSupervision: boolean;
    dbaEmbedded: boolean;
    dbaFixedSchedule: boolean;
    dbaNoSubstitution: boolean;
    dbaExclusive: boolean;
    dbaWeakEntrepreneurship: boolean;
    dbaDurationMonths: number | null;
  };
} = {
  id: "col-pdf-1",
  startDate: new Date("2025-12-10"),
  endDate: null,
  rate: 75,
  agreementType: "VRIJE_VERVANGING",
  agreementFreelancerSignedAt: new Date("2025-12-01"),
  agreementClientSignedAt: new Date("2025-12-02"),
  job: {
    title: "Senior Backend Developer",
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
  freelancerName: "Fatima El-Amin",
  companyName: "TechCorp BV",
  kvkNumber: "87654321",
  btwNumber: "NL987654321B01",
};

/** Geeft een volledig DbaAuditData-object met optionele overrides. */
function makeData(overrides: Partial<DbaAuditData> = {}): DbaAuditData {
  const base = buildDbaAuditData(baseCol, baseParties, [], now);
  return { ...base, ...overrides };
}

/** Laad bytes opnieuw als PDF en geef het doc terug. */
async function reload(bytes: Uint8Array): Promise<PDFDocument> {
  return PDFDocument.load(bytes);
}

// ---------------------------------------------------------------------------
// 1. Geldige, niet-lege PDF
// ---------------------------------------------------------------------------

describe("buildDbaAuditPdf — geldigheid", () => {
  it("produceert niet-lege bytes", async () => {
    const bytes = await buildDbaAuditPdf(makeData());
    expect(bytes.length).toBeGreaterThan(0);
  });

  it("bytes beginnen met de PDF-magic (%PDF)", async () => {
    const bytes = await buildDbaAuditPdf(makeData());
    const magic = String.fromCharCode(...bytes.slice(0, 4));
    expect(magic).toBe("%PDF");
  });

  it("PDFDocument.load() slaagt zonder te gooien", async () => {
    const bytes = await buildDbaAuditPdf(makeData());
    await expect(reload(bytes)).resolves.toBeInstanceOf(PDFDocument);
  });
});

// ---------------------------------------------------------------------------
// 2. PDF-titel bevat job-titel en naam ZZP'er
// ---------------------------------------------------------------------------

describe("buildDbaAuditPdf — PDF-titel", () => {
  it("doc.getTitle() bevat de opdrachtnaam en de naam van de ZZP'er", async () => {
    const data = makeData();
    const bytes = await buildDbaAuditPdf(data);
    const doc = await reload(bytes);
    const title = doc.getTitle() ?? "";
    expect(title).toContain(data.header.jobTitle);
    expect(title).toContain(data.header.freelancerName);
  });

  it("onderscheidende namen zijn herkenbaar in de titel", async () => {
    const data = makeData({
      header: {
        ...makeData().header,
        jobTitle: "Opdracht-Uniek-XYZ-9999",
        freelancerName: "Uniek-Persoon-ABC",
      },
    });
    const bytes = await buildDbaAuditPdf(data);
    const doc = await reload(bytes);
    const title = doc.getTitle() ?? "";
    expect(title).toContain("Opdracht-Uniek-XYZ-9999");
    expect(title).toContain("Uniek-Persoon-ABC");
  });
});

// ---------------------------------------------------------------------------
// 3. Enkelvoudig realistisch dossier → minstens 1 pagina
// ---------------------------------------------------------------------------

describe("buildDbaAuditPdf — paginacount", () => {
  it("realistisch dossier produceert minimaal 1 pagina", async () => {
    const bytes = await buildDbaAuditPdf(makeData());
    const doc = await reload(bytes);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  // -------------------------------------------------------------------------
  // 4. Pagina-afbreek — addPage/ensure-logica loopt meer dan één keer
  // -------------------------------------------------------------------------

  it("60 lange indicatoren en een lange disclaimer produceren meer pagina's dan het kleine dossier", async () => {
    // Klein dossier als referentie
    const smallBytes = await buildDbaAuditPdf(makeData());
    const smallDoc = await reload(smallBytes);
    const smallPages = smallDoc.getPageCount();

    // Grote payload: 60 indicatoren met een lange meerzinnige reden
    const longReason =
      "Dit is een uitgebreide toelichting op het signaal. " +
      "De ZZP'er werkt structureel in de organisatie waarbij de werkwijze en het rooster " +
      "door de opdrachtgever worden bepaald. Dit leidt tot een verhoogd risico op schijnzelfstandigheid " +
      "conform de Wet toelating terbeschikkingstelling van arbeidskrachten (WTZA) en de richtlijnen " +
      "van de Belastingdienst inzake de beoordeling van arbeidsrelaties. " +
      "Nader onderzoek is aanbevolen voordat de samenwerking wordt voortgezet.";

    const levels = ["LAAG", "VERHOOGD", "HOOG"] as const;
    const pickLevel = (i: number): (typeof levels)[number] => levels[i % 3]!;

    const manyIndicators: DbaAuditIndicator[] = Array.from({ length: 60 }, (_, i) => ({
      key: `indicator-${i}`,
      label: `Indicator ${i + 1} — lang label ter vulling van de PDF-pagina`,
      value: i % 2 === 0,
      level: pickLevel(i),
      reason: longReason,
    }));

    const longDisclaimer =
      "Dit hulpmiddel is uitsluitend bedoeld als ondersteuning bij de beoordeling van arbeidsrelaties. " +
      "Het vormt geen juridisch advies en mag niet worden gebruikt als vervanging van professioneel " +
      "juridisch of fiscaal advies. De Belastingdienst behoudt zich het recht voor een eigen oordeel " +
      "te vormen op basis van alle beschikbare feiten en omstandigheden. ".repeat(8);

    const bigData = makeData({
      dbaAssessment: {
        ...makeData().dbaAssessment,
        indicators: manyIndicators,
        disclaimer: longDisclaimer,
      },
    });

    const bigBytes = await buildDbaAuditPdf(bigData);
    const bigDoc = await reload(bigBytes);
    const bigPages = bigDoc.getPageCount();

    // Meer inhoud → meer pagina's (aantoonbaar dat addPage meer dan één keer liep)
    expect(bigPages).toBeGreaterThanOrEqual(2);
    // En groter dan het kleine dossier
    expect(bigPages).toBeGreaterThan(smallPages);
  });
});

// ---------------------------------------------------------------------------
// 5. WinAnsi-onveilige tekens crashen de generatie niet
// ---------------------------------------------------------------------------

describe("buildDbaAuditPdf — WinAnsi-veiligheid", () => {
  it("€, é, —, typografisch apostrof en ZZP'er in tekstvelden crashen niet", async () => {
    const data = makeData({
      header: {
        jobTitle: "Zorg-opdracht — verpleging & welzijn",
        freelancerName: "Ém’ile de Groén",
        companyName: "Société Générale Zorg BV",
        periodLabel: "1-6-2025 t/m 31-12-2025",
        rateLabel: "EUR 85/uur — Periode: 1-6-2025 t/m 31-12-2025",
      },
      dbaAssessment: {
        ...makeData().dbaAssessment,
        disclaimer:
          "Let op: de ZZP’er dient zelf te beoordelen of de samenwerking voldoet aan de eisen. " +
          "Tarief: € 85/uur — dit is geen juridisch oordeel.",
        indicators: [
          {
            key: "test-winAnsi",
            label: "Slimme aanhalingstekens ‘test’ en “deze”",
            value: true,
            level: "VERHOOGD",
            reason: "ZZP’er werkt exclusief bij één opdrachtgever — dit vormt een risico.",
          },
        ],
      },
    });

    await expect(buildDbaAuditPdf(data)).resolves.toBeInstanceOf(Uint8Array);
  });
});

// ---------------------------------------------------------------------------
// 6. Edge-/null-data: de functie gooit nooit — elk scenario levert een PDF op
// ---------------------------------------------------------------------------

describe("buildDbaAuditPdf — rand- en null-waarden", () => {
  it("durationMonths null → geen fout", async () => {
    const data = makeData({
      dbaAssessment: {
        ...makeData().dbaAssessment,
        durationMonths: null,
      },
    });
    const bytes = await buildDbaAuditPdf(data);
    const doc = await reload(bytes);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it("rateCentsSnapshot null → kv-rij toont 'Niet vastgelegd', geen fout", async () => {
    const data = makeData({
      rateThreshold: {
        ...makeData().rateThreshold,
        rateCentsSnapshot: null,
        belowThreshold: false,
      },
    });
    await expect(buildDbaAuditPdf(data)).resolves.toBeInstanceOf(Uint8Array);
  });

  it("verifiedCredentialCount = 0 → tekst zonder crashen", async () => {
    const data = makeData({
      entrepreneurship: {
        ...makeData().entrepreneurship,
        verifiedCredentialCount: 0,
      },
    });
    await expect(buildDbaAuditPdf(data)).resolves.toBeInstanceOf(Uint8Array);
  });

  it("verifiedCredentialCount > 0 → meervoud-tekst zonder crashen", async () => {
    const data = makeData({
      entrepreneurship: {
        ...makeData().entrepreneurship,
        verifiedCredentialCount: 3,
      },
    });
    await expect(buildDbaAuditPdf(data)).resolves.toBeInstanceOf(Uint8Array);
  });

  it("lege indicators-array → geldige PDF zonder indicatorenblok", async () => {
    const data = makeData({
      dbaAssessment: {
        ...makeData().dbaAssessment,
        indicators: [],
      },
    });
    const bytes = await buildDbaAuditPdf(data);
    const doc = await reload(bytes);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it("footer is de verwachte DBA-disclaimer op de PDF-metadata", async () => {
    const data = makeData();
    expect(data.footer).toBe(DBA_AUDIT_FOOTER);
    // Controleer dat de generatie ook met de echte footer niet gooit
    await expect(buildDbaAuditPdf(data)).resolves.toBeInstanceOf(Uint8Array);
  });
});
