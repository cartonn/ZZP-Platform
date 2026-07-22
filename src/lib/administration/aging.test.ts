import { describe, it, expect } from "vitest";
import {
  daysOverdue,
  agingBucketKey,
  buildAgingReport,
  agingCsv,
  AGING_BUCKETS,
  type OpenInvoice,
} from "@/lib/administration/aging";

// Vaste referentiedatum voor deterministische tests.
const NOW = new Date("2026-05-31T12:00:00.000Z");

// Hulpfunctie om een OpenInvoice te bouwen met minimale velden.
function makeInvoice(
  overrides: Partial<OpenInvoice> & { id: string; amountCents: number },
): OpenInvoice {
  return {
    number: overrides.id,
    counterpartyName: "Test BV",
    jobTitle: null,
    dueAt: null,
    collaborationId: null,
    isCascade: false,
    ...overrides,
  };
}

// Datum N dagen vóór NOW (zodat de factuur N dagen te laat is).
function daysAgo(n: number): Date {
  return new Date(NOW.getTime() - n * 86400000);
}

// Datum N dagen NA NOW (factuur nog niet vervallen).
function daysFromNow(n: number): Date {
  return new Date(NOW.getTime() + n * 86400000);
}

// ---------------------------------------------------------------------------
// daysOverdue
// ---------------------------------------------------------------------------

describe("daysOverdue", () => {
  it("geeft 0 als dueAt null is", () => {
    expect(daysOverdue(null, NOW)).toBe(0);
  });

  it("geeft 0 als de vervaldatum in de toekomst ligt", () => {
    expect(daysOverdue(daysFromNow(5), NOW)).toBe(0);
  });

  it("geeft 0 als de vervaldatum exact vandaag is (geen hele dag verstreken)", () => {
    // Vervaldatum gelijk aan NOW: verschil is 0 ms → 0 dagen.
    expect(daysOverdue(NOW, NOW)).toBe(0);
  });

  it("geeft 1 als de factuur precies 1 dag te laat is", () => {
    expect(daysOverdue(daysAgo(1), NOW)).toBe(1);
  });

  it("geeft 45 als de factuur 45 dagen te laat is", () => {
    expect(daysOverdue(daysAgo(45), NOW)).toBe(45);
  });

  it("geeft het getal afgerond naar beneden (Math.floor)", () => {
    // 1.5 dag verschil → 1
    const halfDay = new Date(NOW.getTime() - 1.5 * 86400000);
    expect(daysOverdue(halfDay, NOW)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// agingBucketKey — grenzen
// ---------------------------------------------------------------------------

describe("agingBucketKey", () => {
  it("0 dagen te laat → notDue", () => {
    expect(agingBucketKey(daysFromNow(1), NOW)).toBe("notDue");
  });

  it("null dueAt → notDue", () => {
    expect(agingBucketKey(null, NOW)).toBe("notDue");
  });

  it("exact vandaag (daysOverdue=0) → notDue", () => {
    expect(agingBucketKey(NOW, NOW)).toBe("notDue");
  });

  it("1 dag te laat → d0_30", () => {
    expect(agingBucketKey(daysAgo(1), NOW)).toBe("d0_30");
  });

  it("30 dagen te laat → d0_30 (bovengrens)", () => {
    expect(agingBucketKey(daysAgo(30), NOW)).toBe("d0_30");
  });

  it("31 dagen te laat → d31_60 (ondergrens)", () => {
    expect(agingBucketKey(daysAgo(31), NOW)).toBe("d31_60");
  });

  it("60 dagen te laat → d31_60 (bovengrens)", () => {
    expect(agingBucketKey(daysAgo(60), NOW)).toBe("d31_60");
  });

  it("61 dagen te laat → d61_90 (ondergrens)", () => {
    expect(agingBucketKey(daysAgo(61), NOW)).toBe("d61_90");
  });

  it("90 dagen te laat → d61_90 (bovengrens)", () => {
    expect(agingBucketKey(daysAgo(90), NOW)).toBe("d61_90");
  });

  it("91 dagen te laat → d90plus", () => {
    expect(agingBucketKey(daysAgo(91), NOW)).toBe("d90plus");
  });

  it("200 dagen te laat → d90plus", () => {
    expect(agingBucketKey(daysAgo(200), NOW)).toBe("d90plus");
  });
});

// ---------------------------------------------------------------------------
// buildAgingReport
// ---------------------------------------------------------------------------

describe("buildAgingReport", () => {
  it("lege lijst → alle 5 buckets aanwezig, alles 0", () => {
    const report = buildAgingReport([], NOW);
    expect(report.rows).toHaveLength(0);
    expect(report.buckets).toHaveLength(5);
    expect(report.totalOpenCents).toBe(0);
    expect(report.overdueCents).toBe(0);
    expect(report.overdueCount).toBe(0);

    // Alle bucket-keys aanwezig in de juiste volgorde.
    const keys = report.buckets.map((b) => b.key);
    expect(keys).toEqual(AGING_BUCKETS.map((b) => b.key));

    // Alle totalen zijn 0.
    for (const bucket of report.buckets) {
      expect(bucket.count).toBe(0);
      expect(bucket.totalCents).toBe(0);
    }
  });

  it("sorteert rijen: meest te laat eerst, dan amountCents aflopend", () => {
    const invoices: OpenInvoice[] = [
      makeInvoice({ id: "a", amountCents: 100_00, dueAt: daysAgo(5) }), // 5 dagen te laat
      makeInvoice({ id: "b", amountCents: 200_00, dueAt: daysAgo(45) }), // 45 dagen te laat
      makeInvoice({ id: "c", amountCents: 300_00, dueAt: daysAgo(5) }), // 5 dagen te laat, hoger bedrag
      makeInvoice({ id: "d", amountCents: 150_00, dueAt: daysFromNow(3) }), // nog niet vervallen
    ];
    const report = buildAgingReport(invoices, NOW);

    // Volgorde: b (45d), c (5d, €300), a (5d, €100), d (0d notDue)
    expect(report.rows.map((r) => r.id)).toEqual(["b", "c", "a", "d"]);
  });

  it("berekent totalOpenCents, overdueCents en overdueCount correct", () => {
    const invoices: OpenInvoice[] = [
      makeInvoice({ id: "x", amountCents: 500_00, dueAt: daysAgo(10) }), // te laat
      makeInvoice({ id: "y", amountCents: 300_00, dueAt: daysFromNow(5) }), // nog niet vervallen
      makeInvoice({ id: "z", amountCents: 200_00, dueAt: daysAgo(95) }), // d90plus
    ];
    const report = buildAgingReport(invoices, NOW);

    expect(report.totalOpenCents).toBe(1000_00);
    expect(report.overdueCents).toBe(700_00); // x + z
    expect(report.overdueCount).toBe(2);
  });

  it("alle 5 buckets aanwezig ook als sommige leeg zijn", () => {
    const invoices: OpenInvoice[] = [
      makeInvoice({ id: "p", amountCents: 100_00, dueAt: daysAgo(10) }), // alleen d0_30
    ];
    const report = buildAgingReport(invoices, NOW);
    expect(report.buckets).toHaveLength(5);

    const d0_30 = report.buckets.find((b) => b.key === "d0_30")!;
    expect(d0_30.count).toBe(1);
    expect(d0_30.totalCents).toBe(100_00);

    const notDue = report.buckets.find((b) => b.key === "notDue")!;
    expect(notDue.count).toBe(0);
    expect(notDue.totalCents).toBe(0);
  });

  it("bucket-labels komen overeen met AGING_BUCKETS", () => {
    const report = buildAgingReport([], NOW);
    for (let i = 0; i < AGING_BUCKETS.length; i++) {
      expect(report.buckets[i]!.label).toBe(AGING_BUCKETS[i]!.label);
    }
  });

  it("verdeelt facturen over de juiste buckets", () => {
    const invoices: OpenInvoice[] = [
      makeInvoice({ id: "n", amountCents: 100_00, dueAt: daysFromNow(1) }), // notDue
      makeInvoice({ id: "a", amountCents: 200_00, dueAt: daysAgo(15) }), // d0_30
      makeInvoice({ id: "b", amountCents: 300_00, dueAt: daysAgo(45) }), // d31_60
      makeInvoice({ id: "c", amountCents: 400_00, dueAt: daysAgo(75) }), // d61_90
      makeInvoice({ id: "d", amountCents: 500_00, dueAt: daysAgo(120) }), // d90plus
    ];
    const report = buildAgingReport(invoices, NOW);

    const totals = Object.fromEntries(report.buckets.map((b) => [b.key, b.totalCents]));
    expect(totals["notDue"]).toBe(100_00);
    expect(totals["d0_30"]).toBe(200_00);
    expect(totals["d31_60"]).toBe(300_00);
    expect(totals["d61_90"]).toBe(400_00);
    expect(totals["d90plus"]).toBe(500_00);
  });
});

// ---------------------------------------------------------------------------
// agingCsv
// ---------------------------------------------------------------------------

describe("agingCsv", () => {
  it("lege report → alleen kopregel", () => {
    const report = buildAgingReport([], NOW);
    const csv = agingCsv(report);
    expect(csv).toBe("nummer;tegenpartij;opdracht;vervaldatum;dagen_te_laat;bucket;bedrag");
  });

  it("kopregel bevat alle 7 veldnamen in de juiste volgorde", () => {
    const report = buildAgingReport([], NOW);
    const csv = agingCsv(report);
    const header = csv.split("\r\n")[0]!;
    expect(header).toBe("nummer;tegenpartij;opdracht;vervaldatum;dagen_te_laat;bucket;bedrag");
  });

  it("rij met bekende waarden klopt", () => {
    const dueDate = new Date("2026-04-30T00:00:00.000Z"); // 31 dagen vóór NOW (d31_60)
    const inv = makeInvoice({
      id: "F-2026-001",
      number: "F-2026-001",
      counterpartyName: "Klant NV",
      jobTitle: "Webontwikkeling",
      amountCents: 101640,
      dueAt: dueDate,
      collaborationId: null,
      isCascade: true,
    });
    const report = buildAgingReport([inv], NOW);
    const csv = agingCsv(report);
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(2); // kop + 1 rij

    const row = lines[1]!.split(";");
    expect(row[0]).toBe("F-2026-001"); // nummer
    expect(row[1]).toBe("Klant NV"); // tegenpartij
    expect(row[2]).toBe("Webontwikkeling"); // opdracht
    expect(row[3]).toBe("2026-04-30"); // vervaldatum
    // dagen_te_laat: NOW=2026-05-31, dueDate=2026-04-30 → 31 dagen
    expect(Number(row[4])).toBe(31);
    expect(row[5]).toBe("31–60 dagen te laat"); // bucket label (NL)
    expect(row[6]).toBe("1016.40"); // bedrag
  });

  it("null dueAt en null jobTitle geven lege velden in CSV", () => {
    const inv = makeInvoice({
      id: "F-000",
      amountCents: 5000,
      dueAt: null,
      jobTitle: null,
    });
    const report = buildAgingReport([inv], NOW);
    const csv = agingCsv(report);
    const row = csv.split("\r\n")[1]!.split(";");
    expect(row[2]).toBe(""); // jobTitle leeg
    expect(row[3]).toBe(""); // vervaldatum leeg
    expect(row[5]).toBe("Nog niet vervallen"); // bucket label
  });

  it("rijen staan in dezelfde volgorde als report.rows", () => {
    const invoices: OpenInvoice[] = [
      makeInvoice({ id: "late", amountCents: 100_00, dueAt: daysAgo(50) }),
      makeInvoice({ id: "early", amountCents: 200_00, dueAt: daysAgo(5) }),
    ];
    const report = buildAgingReport(invoices, NOW);
    const csv = agingCsv(report);
    const dataLines = csv.split("\r\n").slice(1);
    // report.rows is gesorteerd: late (50d) vóór early (5d)
    expect(dataLines[0]!.split(";")[0]).toBe(report.rows[0]!.number);
    expect(dataLines[1]!.split(";")[0]).toBe(report.rows[1]!.number);
  });
});

// ---------------------------------------------------------------------------
// relations rollup (per debiteur/crediteur)
// ---------------------------------------------------------------------------

describe("buildAgingReport — relations", () => {
  it("groepeert facturen per tegenpartij-id en telt bedragen op", () => {
    const invoices: OpenInvoice[] = [
      makeInvoice({
        id: "a1",
        amountCents: 100_00,
        counterpartyId: "c-a",
        counterpartyName: "Alfa BV",
        dueAt: daysFromNow(5),
      }),
      makeInvoice({
        id: "a2",
        amountCents: 250_00,
        counterpartyId: "c-a",
        counterpartyName: "Alfa BV",
        dueAt: daysAgo(40),
      }),
      makeInvoice({
        id: "b1",
        amountCents: 300_00,
        counterpartyId: "c-b",
        counterpartyName: "Beta NV",
        dueAt: daysFromNow(2),
      }),
    ];
    const report = buildAgingReport(invoices, NOW);

    expect(report.relations).toHaveLength(2);
    const alfa = report.relations.find((r) => r.counterpartyId === "c-a")!;
    expect(alfa.count).toBe(2);
    expect(alfa.totalOpenCents).toBe(350_00);
    expect(alfa.overdueCents).toBe(250_00); // alleen a2 is te laat
    expect(alfa.overdueCount).toBe(1);
    expect(alfa.maxDaysOverdue).toBe(40);
    expect(alfa.worstBucket).toBe("d31_60");
  });

  it("sorteert relaties op te-laat-bedrag aflopend, dan openstaand bedrag", () => {
    const invoices: OpenInvoice[] = [
      // Groot openstaand maar niets te laat.
      makeInvoice({
        id: "big",
        amountCents: 900_00,
        counterpartyId: "c-big",
        counterpartyName: "Groot BV",
        dueAt: daysFromNow(10),
      }),
      // Kleiner openstaand maar wél te laat → moet eerst staan.
      makeInvoice({
        id: "late",
        amountCents: 100_00,
        counterpartyId: "c-late",
        counterpartyName: "Traag BV",
        dueAt: daysAgo(20),
      }),
    ];
    const report = buildAgingReport(invoices, NOW);
    expect(report.relations.map((r) => r.counterpartyId)).toEqual(["c-late", "c-big"]);
  });

  it("groepeert op naam als er geen id is en houdt relaties met verschillende naam gescheiden", () => {
    const invoices: OpenInvoice[] = [
      makeInvoice({ id: "n1", amountCents: 100_00, counterpartyName: "Zonder Id A" }),
      makeInvoice({ id: "n2", amountCents: 150_00, counterpartyName: "Zonder Id A" }),
      makeInvoice({ id: "n3", amountCents: 200_00, counterpartyName: "Zonder Id B" }),
    ];
    const report = buildAgingReport(invoices, NOW);
    expect(report.relations).toHaveLength(2);
    const a = report.relations.find((r) => r.counterpartyName === "Zonder Id A")!;
    expect(a.counterpartyId).toBeNull();
    expect(a.count).toBe(2);
    expect(a.totalOpenCents).toBe(250_00);
  });

  it("lege report → geen relaties", () => {
    const report = buildAgingReport([], NOW);
    expect(report.relations).toEqual([]);
  });
});
