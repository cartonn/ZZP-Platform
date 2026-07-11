import { describe, expect, it } from "vitest";
import { buildIncomeForecast, exportForecastCsv, type ForecastItem } from "@/lib/income-forecast";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal ForecastItem with sensible defaults. */
function item(overrides: Partial<ForecastItem> & { invoiceId: string }): ForecastItem {
  return {
    stage: "APPROVED",
    netCents: 1000,
    vatCents: 210,
    grossCents: 1210,
    expectedDate: null,
    counterpartyName: "Test BV",
    number: "F-001",
    jobTitle: "Opdracht",
    ...overrides,
  };
}

/** UTC midnight for a given year/month/day. */
function utc(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

// The "now" used in most tests: 2026-06-15 (mid-June 2026).
const NOW = utc(2026, 6, 15);

// ---------------------------------------------------------------------------
// Empty input
// ---------------------------------------------------------------------------

describe("buildIncomeForecast — empty input", () => {
  it("returns empty buckets and all totals 0", () => {
    const forecast = buildIncomeForecast([], NOW);
    expect(forecast.buckets).toEqual([]);
    expect(forecast.totalNetCents).toBe(0);
    expect(forecast.totalVatCents).toBe(0);
    expect(forecast.totalGrossCents).toBe(0);
    expect(forecast.unbilledGrossCents).toBe(0);
    expect(forecast.inFlightGrossCents).toBe(0);
    expect(forecast.overdueGrossCents).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Single-item bucket placement
// ---------------------------------------------------------------------------

describe("buildIncomeForecast — DRAFT item", () => {
  it("goes to UNSCHEDULED and counts as unbilled", () => {
    const forecast = buildIncomeForecast(
      [item({ invoiceId: "inv-1", stage: "DRAFT", expectedDate: null })],
      NOW,
    );

    expect(forecast.buckets).toHaveLength(1);
    expect(forecast.buckets[0]!.key).toBe("UNSCHEDULED");
    expect(forecast.unbilledGrossCents).toBe(1210);
    expect(forecast.inFlightGrossCents).toBe(0);
    expect(forecast.overdueGrossCents).toBe(0);
  });
});

describe("buildIncomeForecast — SUBMITTED item", () => {
  it("goes to UNSCHEDULED and counts as inFlight", () => {
    const forecast = buildIncomeForecast(
      [item({ invoiceId: "inv-2", stage: "SUBMITTED", expectedDate: null })],
      NOW,
    );

    expect(forecast.buckets).toHaveLength(1);
    expect(forecast.buckets[0]!.key).toBe("UNSCHEDULED");
    expect(forecast.unbilledGrossCents).toBe(0);
    expect(forecast.inFlightGrossCents).toBe(1210);
    expect(forecast.overdueGrossCents).toBe(0);
  });
});

describe("buildIncomeForecast — APPROVED, dueAt this month", () => {
  it("goes to THIS_MONTH and counts as inFlight", () => {
    const forecast = buildIncomeForecast(
      [
        item({
          invoiceId: "inv-3",
          stage: "APPROVED",
          expectedDate: utc(2026, 6, 28),
        }),
      ],
      NOW,
    );

    expect(forecast.buckets).toHaveLength(1);
    expect(forecast.buckets[0]!.key).toBe("THIS_MONTH");
    expect(forecast.inFlightGrossCents).toBe(1210);
    expect(forecast.overdueGrossCents).toBe(0);
    expect(forecast.unbilledGrossCents).toBe(0);
  });
});

describe("buildIncomeForecast — APPROVED, dueAt next month (July)", () => {
  it("goes to NEXT_MONTH", () => {
    const forecast = buildIncomeForecast(
      [
        item({
          invoiceId: "inv-4",
          stage: "APPROVED",
          expectedDate: utc(2026, 7, 10),
        }),
      ],
      NOW,
    );

    expect(forecast.buckets).toHaveLength(1);
    expect(forecast.buckets[0]!.key).toBe("NEXT_MONTH");
    expect(forecast.inFlightGrossCents).toBe(1210);
  });
});

describe("buildIncomeForecast — December → January year-wrap", () => {
  const decNow = utc(2026, 12, 10); // December 2026

  it("January item goes to NEXT_MONTH", () => {
    const forecast = buildIncomeForecast(
      [
        item({
          invoiceId: "inv-5",
          stage: "APPROVED",
          expectedDate: utc(2027, 1, 5), // January 2027
        }),
      ],
      decNow,
    );

    expect(forecast.buckets).toHaveLength(1);
    expect(forecast.buckets[0]!.key).toBe("NEXT_MONTH");
    expect(forecast.buckets[0]!.label).toBe("Volgende maand");
  });

  it("February item goes to LATER", () => {
    const forecast = buildIncomeForecast(
      [
        item({
          invoiceId: "inv-6",
          stage: "APPROVED",
          expectedDate: utc(2027, 2, 5), // February 2027
        }),
      ],
      decNow,
    );

    expect(forecast.buckets).toHaveLength(1);
    expect(forecast.buckets[0]!.key).toBe("LATER");
  });
});

describe("buildIncomeForecast — APPROVED, dueAt further in future", () => {
  it("goes to LATER", () => {
    const forecast = buildIncomeForecast(
      [
        item({
          invoiceId: "inv-7",
          stage: "APPROVED",
          expectedDate: utc(2026, 9, 1), // September 2026
        }),
      ],
      NOW,
    );

    expect(forecast.buckets).toHaveLength(1);
    expect(forecast.buckets[0]!.key).toBe("LATER");
    expect(forecast.inFlightGrossCents).toBe(1210);
  });
});

describe("buildIncomeForecast — APPROVED with dueAt before today (stage APPROVED)", () => {
  it("goes to OVERDUE and counts as overdueGross", () => {
    const forecast = buildIncomeForecast(
      [
        item({
          invoiceId: "inv-8",
          stage: "APPROVED",
          expectedDate: utc(2026, 6, 1), // June 1 — before June 15
        }),
      ],
      NOW,
    );

    expect(forecast.buckets).toHaveLength(1);
    expect(forecast.buckets[0]!.key).toBe("OVERDUE");
    expect(forecast.overdueGrossCents).toBe(1210);
    expect(forecast.inFlightGrossCents).toBe(0);
    expect(forecast.unbilledGrossCents).toBe(0);
  });
});

describe("buildIncomeForecast — stage OVERDUE", () => {
  it("goes to OVERDUE bucket regardless of expectedDate", () => {
    const forecast = buildIncomeForecast(
      [
        item({
          invoiceId: "inv-9",
          stage: "OVERDUE",
          expectedDate: utc(2026, 7, 1), // future date but stage is OVERDUE
        }),
      ],
      NOW,
    );

    expect(forecast.buckets).toHaveLength(1);
    expect(forecast.buckets[0]!.key).toBe("OVERDUE");
    expect(forecast.overdueGrossCents).toBe(1210);
  });
});

// ---------------------------------------------------------------------------
// Partition invariant
// ---------------------------------------------------------------------------

describe("buildIncomeForecast — partition invariant", () => {
  it("unbilled + inFlight + overdue === totalGross, and totalNet + totalVat === totalGross", () => {
    const items: ForecastItem[] = [
      item({
        invoiceId: "a",
        stage: "DRAFT",
        netCents: 500,
        vatCents: 105,
        grossCents: 605,
        expectedDate: null,
      }),
      item({
        invoiceId: "b",
        stage: "SUBMITTED",
        netCents: 800,
        vatCents: 168,
        grossCents: 968,
        expectedDate: null,
      }),
      item({
        invoiceId: "c",
        stage: "APPROVED",
        netCents: 1000,
        vatCents: 210,
        grossCents: 1210,
        expectedDate: utc(2026, 6, 20),
      }),
      item({
        invoiceId: "d",
        stage: "APPROVED",
        netCents: 2000,
        vatCents: 420,
        grossCents: 2420,
        expectedDate: utc(2026, 7, 5),
      }),
      item({
        invoiceId: "e",
        stage: "APPROVED",
        netCents: 300,
        vatCents: 63,
        grossCents: 363,
        expectedDate: utc(2026, 6, 1),
      }), // overdue by date
      item({
        invoiceId: "f",
        stage: "OVERDUE",
        netCents: 400,
        vatCents: 84,
        grossCents: 484,
        expectedDate: utc(2026, 5, 1),
      }),
      item({
        invoiceId: "g",
        stage: "APPROVED",
        netCents: 600,
        vatCents: 126,
        grossCents: 726,
        expectedDate: utc(2026, 9, 10),
      }),
    ];

    const forecast = buildIncomeForecast(items, NOW);

    expect(
      forecast.unbilledGrossCents + forecast.inFlightGrossCents + forecast.overdueGrossCents,
    ).toBe(forecast.totalGrossCents);

    expect(forecast.totalNetCents + forecast.totalVatCents).toBe(forecast.totalGrossCents);
  });
});

// ---------------------------------------------------------------------------
// Sorting within buckets
// ---------------------------------------------------------------------------

describe("buildIncomeForecast — sorting within buckets", () => {
  it("sorts scheduled items by expectedDate asc, then grossCents desc, then invoiceId asc", () => {
    const items: ForecastItem[] = [
      item({
        invoiceId: "z-3",
        stage: "APPROVED",
        grossCents: 500,
        netCents: 413,
        vatCents: 87,
        expectedDate: utc(2026, 6, 20),
      }),
      item({
        invoiceId: "a-1",
        stage: "APPROVED",
        grossCents: 1210,
        netCents: 1000,
        vatCents: 210,
        expectedDate: utc(2026, 6, 20),
      }),
      item({
        invoiceId: "a-2",
        stage: "APPROVED",
        grossCents: 1210,
        netCents: 1000,
        vatCents: 210,
        expectedDate: utc(2026, 6, 20),
      }),
      item({
        invoiceId: "m-4",
        stage: "APPROVED",
        grossCents: 800,
        netCents: 661,
        vatCents: 139,
        expectedDate: utc(2026, 6, 18),
      }),
    ];

    const forecast = buildIncomeForecast(items, NOW);
    const bucket = forecast.buckets.find((b) => b.key === "THIS_MONTH")!;
    expect(bucket).toBeDefined();

    const ids = bucket.items.map((i) => i.invoiceId);
    // June 18 first, then June 20 items ordered by grossCents desc (1210, 1210, 500), tiebreak invoiceId
    expect(ids).toEqual(["m-4", "a-1", "a-2", "z-3"]);
  });

  it("sorts unscheduled items DRAFT before SUBMITTED, then grossCents desc, then invoiceId asc", () => {
    const items: ForecastItem[] = [
      item({
        invoiceId: "s-2",
        stage: "SUBMITTED",
        grossCents: 2000,
        netCents: 1653,
        vatCents: 347,
        expectedDate: null,
      }),
      item({
        invoiceId: "d-1",
        stage: "DRAFT",
        grossCents: 500,
        netCents: 413,
        vatCents: 87,
        expectedDate: null,
      }),
      item({
        invoiceId: "s-1",
        stage: "SUBMITTED",
        grossCents: 3000,
        netCents: 2479,
        vatCents: 521,
        expectedDate: null,
      }),
      item({
        invoiceId: "d-2",
        stage: "DRAFT",
        grossCents: 500,
        netCents: 413,
        vatCents: 87,
        expectedDate: null,
      }),
    ];

    const forecast = buildIncomeForecast(items, NOW);
    const bucket = forecast.buckets.find((b) => b.key === "UNSCHEDULED")!;
    expect(bucket).toBeDefined();

    const ids = bucket.items.map((i) => i.invoiceId);
    // DRAFTs first (grossCents equal → invoiceId asc: d-1, d-2), then SUBMITTED (grossCents desc: s-1, s-2)
    expect(ids).toEqual(["d-1", "d-2", "s-1", "s-2"]);
  });
});

// ---------------------------------------------------------------------------
// Bucket ordering and empty-bucket filtering
// ---------------------------------------------------------------------------

describe("buildIncomeForecast — bucket ordering and empty-bucket filtering", () => {
  it("outputs buckets in fixed order and omits empty ones", () => {
    const items: ForecastItem[] = [
      item({ invoiceId: "x-1", stage: "DRAFT", expectedDate: null }),
      item({ invoiceId: "x-2", stage: "APPROVED", expectedDate: utc(2026, 9, 1) }), // LATER
    ];

    const forecast = buildIncomeForecast(items, NOW);

    // Should have LATER before UNSCHEDULED; THIS_MONTH and NEXT_MONTH are absent.
    expect(forecast.buckets.map((b) => b.key)).toEqual(["LATER", "UNSCHEDULED"]);
  });

  it("OVERDUE appears before THIS_MONTH when both present", () => {
    const items: ForecastItem[] = [
      item({ invoiceId: "ov-1", stage: "OVERDUE", expectedDate: null }),
      item({ invoiceId: "tm-1", stage: "APPROVED", expectedDate: utc(2026, 6, 28) }),
    ];

    const forecast = buildIncomeForecast(items, NOW);
    expect(forecast.buckets.map((b) => b.key)).toEqual(["OVERDUE", "THIS_MONTH"]);
  });
});

// ---------------------------------------------------------------------------
// Bucket labels (NL)
// ---------------------------------------------------------------------------

describe("buildIncomeForecast — bucket labels", () => {
  it("uses Dutch labels", () => {
    const items: ForecastItem[] = [
      item({ invoiceId: "l-1", stage: "OVERDUE", expectedDate: null }),
      item({ invoiceId: "l-2", stage: "APPROVED", expectedDate: utc(2026, 6, 28) }),
      item({ invoiceId: "l-3", stage: "APPROVED", expectedDate: utc(2026, 7, 5) }),
      item({ invoiceId: "l-4", stage: "APPROVED", expectedDate: utc(2026, 9, 1) }),
      item({ invoiceId: "l-5", stage: "DRAFT", expectedDate: null }),
    ];

    const forecast = buildIncomeForecast(items, NOW);
    const labelsByKey = Object.fromEntries(forecast.buckets.map((b) => [b.key, b.label]));

    expect(labelsByKey["OVERDUE"]).toBe("Te laat");
    expect(labelsByKey["THIS_MONTH"]).toBe("Deze maand");
    expect(labelsByKey["NEXT_MONTH"]).toBe("Volgende maand");
    expect(labelsByKey["LATER"]).toBe("Later");
    expect(labelsByKey["UNSCHEDULED"]).toBe("Nog te plannen");
  });
});

// ---------------------------------------------------------------------------
// Bucket subtotals
// ---------------------------------------------------------------------------

describe("buildIncomeForecast — bucket subtotals", () => {
  it("computes per-bucket sums correctly", () => {
    const items: ForecastItem[] = [
      item({
        invoiceId: "b-1",
        stage: "APPROVED",
        netCents: 1000,
        vatCents: 210,
        grossCents: 1210,
        expectedDate: utc(2026, 6, 20),
      }),
      item({
        invoiceId: "b-2",
        stage: "APPROVED",
        netCents: 2000,
        vatCents: 420,
        grossCents: 2420,
        expectedDate: utc(2026, 6, 28),
      }),
    ];

    const forecast = buildIncomeForecast(items, NOW);
    const thisMonth = forecast.buckets.find((b) => b.key === "THIS_MONTH")!;

    expect(thisMonth.netCents).toBe(3000);
    expect(thisMonth.vatCents).toBe(630);
    expect(thisMonth.grossCents).toBe(3630);
  });
});

// ---------------------------------------------------------------------------
// Edge: dueAt exactly at start of today is NOT overdue
// ---------------------------------------------------------------------------

describe("buildIncomeForecast — boundary: dueAt exactly at UTC midnight today", () => {
  it("is not overdue when expectedDate equals start of today", () => {
    const forecast = buildIncomeForecast(
      [
        item({
          invoiceId: "edge-1",
          stage: "APPROVED",
          expectedDate: utc(2026, 6, 15), // exactly NOW's start of day
        }),
      ],
      NOW,
    );

    // Should be THIS_MONTH, not OVERDUE.
    expect(forecast.buckets[0]!.key).toBe("THIS_MONTH");
    expect(forecast.overdueGrossCents).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// CSV-export
// ---------------------------------------------------------------------------

const CSV_HEADER =
  "Categorie;Status;Tegenpartij;Opdracht;Factuurnummer;Verwachte datum;Netto (EUR);BTW (EUR);Bruto (EUR)";

describe("exportForecastCsv", () => {
  it("emits the header row first", () => {
    const csv = exportForecastCsv([], NOW);
    expect(csv.split("\r\n")[0]).toBe(CSV_HEADER);
  });

  it("empty items → header only", () => {
    const csv = exportForecastCsv([], NOW);
    expect(csv).toBe(CSV_HEADER);
    expect(csv.split("\r\n")).toHaveLength(1);
  });

  it("emits one row per item plus the header", () => {
    const items: ForecastItem[] = [
      item({ invoiceId: "c-1", stage: "APPROVED", expectedDate: utc(2026, 6, 20) }),
      item({ invoiceId: "c-2", stage: "DRAFT", expectedDate: null }),
      item({ invoiceId: "c-3", stage: "OVERDUE", expectedDate: null }),
    ];
    const lines = exportForecastCsv(items, NOW).split("\r\n");
    expect(lines).toHaveLength(4); // header + 3 items
  });

  it("uses the bucket label as Categorie", () => {
    const csv = exportForecastCsv(
      [item({ invoiceId: "tm-1", stage: "APPROVED", expectedDate: utc(2026, 6, 28) })],
      NOW,
    );
    const row = csv.split("\r\n")[1]!;
    expect(row.startsWith("Deze maand;")).toBe(true);
    expect(row).toContain(";Goedgekeurd;");
  });

  it("formats euro amounts with comma decimals and ISO expected date", () => {
    const csv = exportForecastCsv(
      [
        item({
          invoiceId: "e-1",
          stage: "APPROVED",
          netCents: 1000,
          vatCents: 210,
          grossCents: 1210,
          expectedDate: utc(2026, 6, 20),
        }),
      ],
      NOW,
    );
    const cols = csv.split("\r\n")[1]!.split(";");
    expect(cols[5]).toBe("2026-06-20");
    expect(cols[6]).toBe("10,00");
    expect(cols[7]).toBe("2,10");
    expect(cols[8]).toBe("12,10");
  });
});

// ---------------------------------------------------------------------------
// realisticDate — betaalgedrag-gecorrigeerde bucketing
// ---------------------------------------------------------------------------

describe("buildIncomeForecast — realisticDate schuift het item naar de realistische maand", () => {
  it("een deze-maand-vervaldag met realistische betaaldatum volgende maand valt in NEXT_MONTH", () => {
    const forecast = buildIncomeForecast(
      [
        item({
          invoiceId: "inv-r1",
          stage: "APPROVED",
          expectedDate: utc(2026, 6, 28), // vervaldag in juni
          realisticDate: utc(2026, 7, 12), // realistisch pas in juli
        }),
      ],
      NOW,
    );
    expect(forecast.buckets.map((b) => b.key)).toEqual(["NEXT_MONTH"]);
    expect(forecast.behaviorAdjustedCount).toBe(1);
    // Bedrag blijft onderweg (niet te laat, niet concept).
    expect(forecast.inFlightGrossCents).toBe(1210);
  });

  it("zonder realisticDate blijft het item op de vervaldag (identiek oud gedrag)", () => {
    const forecast = buildIncomeForecast(
      [item({ invoiceId: "inv-r2", stage: "APPROVED", expectedDate: utc(2026, 6, 28) })],
      NOW,
    );
    expect(forecast.buckets.map((b) => b.key)).toEqual(["THIS_MONTH"]);
    expect(forecast.behaviorAdjustedCount).toBe(0);
  });

  it("een reeds verlopen vervaldag blijft OVERDUE, ook met een latere realisticDate", () => {
    const forecast = buildIncomeForecast(
      [
        item({
          invoiceId: "inv-r3",
          stage: "APPROVED",
          expectedDate: utc(2026, 6, 1), // vóór NOW (15 juni) → te laat
          realisticDate: utc(2026, 6, 25), // latere verwachting mag dit niet maskeren
        }),
      ],
      NOW,
    );
    expect(forecast.buckets.map((b) => b.key)).toEqual(["OVERDUE"]);
    expect(forecast.overdueGrossCents).toBe(1210);
    // realisticDate is niet later dan de vervaldag in dit scenario? Het is wél later → telt mee.
    expect(forecast.behaviorAdjustedCount).toBe(1);
  });

  it("negeert een realisticDate VÓÓR de vervaldag (snel-betaler, lange termijn) → blijft op de vervaldag", () => {
    // Regressie: forecastInvoicePayout clamt niet naar dueAt, dus een verwachting vóór de vervaldag
    // is mogelijk. effectiveDate mag zo'n item nooit naar voren (of naar een verleden-maand) schuiven.
    const forecast = buildIncomeForecast(
      [
        item({
          invoiceId: "inv-fast",
          stage: "APPROVED",
          expectedDate: utc(2026, 7, 20), // vervaldag in juli
          realisticDate: utc(2026, 6, 30), // "realistisch" eerder (in juni) — moet genegeerd worden
        }),
      ],
      NOW, // 15 juni
    );
    // Vervaldag 20 juli → NEXT_MONTH (t.o.v. juni), NIET LATER/verleden.
    expect(forecast.buckets.map((b) => b.key)).toEqual(["NEXT_MONTH"]);
    // Geen correctie geteld (realisticDate niet later dan de vervaldag).
    expect(forecast.behaviorAdjustedCount).toBe(0);
    // Blijft "onderweg", niet te laat.
    expect(forecast.inFlightGrossCents).toBe(1210);
  });

  it("de CSV-export valt terug op de vervaldag als realisticDate eerder is", () => {
    const csv = exportForecastCsv(
      [
        item({
          invoiceId: "e-fast",
          stage: "APPROVED",
          expectedDate: utc(2026, 7, 20),
          realisticDate: utc(2026, 6, 30),
        }),
      ],
      NOW,
    );
    const cols = csv.split("\r\n")[1]!.split(";");
    expect(cols[5]).toBe("2026-07-20");
  });

  it("sorteert binnen een bucket op de realistische datum", () => {
    const forecast = buildIncomeForecast(
      [
        item({
          invoiceId: "b",
          stage: "APPROVED",
          expectedDate: utc(2026, 6, 20),
          realisticDate: utc(2026, 6, 30), // realistisch later
        }),
        item({
          invoiceId: "a",
          stage: "APPROVED",
          expectedDate: utc(2026, 6, 25),
          realisticDate: utc(2026, 6, 26), // realistisch eerder dan "b"
        }),
      ],
      NOW,
    );
    const thisMonth = forecast.buckets.find((x) => x.key === "THIS_MONTH")!;
    expect(thisMonth.items.map((x) => x.invoiceId)).toEqual(["a", "b"]);
  });

  it("de CSV-export gebruikt de realistische datum in de kolom 'Verwachte datum'", () => {
    const csv = exportForecastCsv(
      [
        item({
          invoiceId: "e-r",
          stage: "APPROVED",
          expectedDate: utc(2026, 6, 20),
          realisticDate: utc(2026, 7, 3),
        }),
      ],
      NOW,
    );
    const cols = csv.split("\r\n")[1]!.split(";");
    expect(cols[5]).toBe("2026-07-03");
  });
});
