import { describe, expect, it } from "vitest";
import {
  HOURS_ANOMALY_MIN_SAMPLE,
  HOURS_ANOMALY_THRESHOLD_PCT,
  detectHoursAnomalies,
  formatHoursNl,
  formatHoursAnomalyNotice,
  type HoursAnomaly,
  type PerformanceHoursRow,
} from "./performance-hours-anomaly";

let seq = 0;
function row(overrides: Partial<PerformanceHoursRow>): PerformanceHoursRow {
  return {
    id: `p${seq++}`,
    collaborationId: "c1",
    type: "HOURS",
    status: "APPROVED",
    hours: 40,
    ...overrides,
  };
}

/** N goedgekeurde urenstaten van `hours` uur op samenwerking `collab`. */
function approved(collab: string, hours: number, n: number): PerformanceHoursRow[] {
  return Array.from({ length: n }, () =>
    row({ collaborationId: collab, status: "APPROVED", hours }),
  );
}

describe("detectHoursAnomalies", () => {
  it("markeert een ingediende urenstaat die ruim boven de mediaan ligt", () => {
    const rows = [
      ...approved("c1", 36, HOURS_ANOMALY_MIN_SAMPLE),
      row({ id: "sub", collaborationId: "c1", status: "SUBMITTED", hours: 52 }),
    ];
    const anomalies = detectHoursAnomalies(rows);
    const a = anomalies.get("sub");
    expect(a).toBeDefined();
    expect(a!.hours).toBe(52);
    expect(a!.baselineHours).toBe(36);
    expect(a!.deltaPct).toBe(Math.round((52 / 36 - 1) * 100)); // 44
    expect(a!.sampleSize).toBe(HOURS_ANOMALY_MIN_SAMPLE);
  });

  it("markeert niet onder de minimum-steekproef", () => {
    const rows = [
      ...approved("c1", 36, HOURS_ANOMALY_MIN_SAMPLE - 1),
      row({ id: "sub", collaborationId: "c1", status: "SUBMITTED", hours: 60 }),
    ];
    expect(detectHoursAnomalies(rows).has("sub")).toBe(false);
  });

  it("markeert niet een normale week (binnen de drempel)", () => {
    const rows = [
      ...approved("c1", 40, HOURS_ANOMALY_MIN_SAMPLE),
      // +10% en +4 u: onder beide drempels
      row({ id: "sub", collaborationId: "c1", status: "SUBMITTED", hours: 44 }),
    ];
    expect(detectHoursAnomalies(rows).has("sub")).toBe(false);
  });

  it("vereist zowel de procentuele drempel als de absolute uren-vloer", () => {
    // Kleine week: 6 u vs mediaan 4 u = +50% (boven pct-drempel) maar slechts +2 u (onder vloer) → geen
    const smallWeek = [
      ...approved("c1", 4, HOURS_ANOMALY_MIN_SAMPLE),
      row({ id: "sub", collaborationId: "c1", status: "SUBMITTED", hours: 6 }),
    ];
    expect(detectHoursAnomalies(smallWeek).has("sub")).toBe(false);

    // Grote week met veel absolute uren erover maar net onder het percentage → geen
    const belowPct = [
      ...approved("c2", 100, HOURS_ANOMALY_MIN_SAMPLE),
      // +20% (onder 30%) ook al is +20 u ruim boven de vloer
      row({ id: "sub2", collaborationId: "c2", status: "SUBMITTED", hours: 120 }),
    ];
    expect(detectHoursAnomalies(belowPct).has("sub2")).toBe(false);
  });

  it("respecteert de exacte drempelwaarden (grens = geen signaal, net erboven = signaal)", () => {
    const baseline = 20;
    // Precies op de pct-grens (30% → 26 u) telt niet als 'ruim boven'
    const atThreshold = [
      ...approved("c1", baseline, HOURS_ANOMALY_MIN_SAMPLE),
      row({
        id: "edge",
        collaborationId: "c1",
        status: "SUBMITTED",
        hours: baseline * (1 + HOURS_ANOMALY_THRESHOLD_PCT / 100) - 0.01,
      }),
    ];
    expect(detectHoursAnomalies(atThreshold).has("edge")).toBe(false);

    // Net erboven, en ruim boven de uren-vloer → wel
    const over = [
      ...approved("c2", baseline, HOURS_ANOMALY_MIN_SAMPLE),
      row({ id: "over", collaborationId: "c2", status: "SUBMITTED", hours: baseline + 10 }),
    ];
    expect(detectHoursAnomalies(over).has("over")).toBe(true);
  });

  it("kruist geen samenwerkingen (baseline is per samenwerking)", () => {
    const rows = [
      // c1 draait rond 12 u; c2 rond 40 u
      ...approved("c1", 12, HOURS_ANOMALY_MIN_SAMPLE),
      ...approved("c2", 40, HOURS_ANOMALY_MIN_SAMPLE),
      // 30 u is normaal voor c2 maar zou een uitschieter zijn tegen c1's baseline
      row({ id: "sub", collaborationId: "c2", status: "SUBMITTED", hours: 30 }),
    ];
    expect(detectHoursAnomalies(rows).has("sub")).toBe(false);
  });

  it("negeert milestones en urenstaten zonder uren", () => {
    const rows = [
      ...approved("c1", 20, HOURS_ANOMALY_MIN_SAMPLE),
      row({ id: "ms", collaborationId: "c1", status: "SUBMITTED", type: "MILESTONE", hours: null }),
      row({ id: "nohours", collaborationId: "c1", status: "SUBMITTED", hours: null }),
    ];
    const anomalies = detectHoursAnomalies(rows);
    expect(anomalies.has("ms")).toBe(false);
    expect(anomalies.has("nohours")).toBe(false);
  });

  it("gebruikt alleen goedgekeurde urenstaten als baseline (niet afgekeurd/concept)", () => {
    const rows = [
      // Slechts 1 goedgekeurde + ruis in andere statussen → onder de steekproef
      row({ collaborationId: "c1", status: "APPROVED", hours: 20 }),
      row({ collaborationId: "c1", status: "REJECTED", hours: 20 }),
      row({ collaborationId: "c1", status: "DRAFT", hours: 20 }),
      row({ id: "sub", collaborationId: "c1", status: "SUBMITTED", hours: 60 }),
    ];
    expect(detectHoursAnomalies(rows).has("sub")).toBe(false);
  });

  it("geeft geen signaal bij een baseline-mediaan van 0", () => {
    const rows = [
      ...approved("c1", 0, HOURS_ANOMALY_MIN_SAMPLE),
      row({ id: "sub", collaborationId: "c1", status: "SUBMITTED", hours: 40 }),
    ];
    expect(detectHoursAnomalies(rows).has("sub")).toBe(false);
  });

  it("rekent de mediaan (niet het gemiddelde) van een scheve historie", () => {
    // 10, 10, 10, 10, 200 → mediaan 10 (gemiddelde 48). Een ingediende 20 u is dan wél een uitschieter.
    const rows = [
      row({ collaborationId: "c1", status: "APPROVED", hours: 10 }),
      row({ collaborationId: "c1", status: "APPROVED", hours: 10 }),
      row({ collaborationId: "c1", status: "APPROVED", hours: 10 }),
      row({ collaborationId: "c1", status: "APPROVED", hours: 10 }),
      row({ collaborationId: "c1", status: "APPROVED", hours: 200 }),
      row({ id: "sub", collaborationId: "c1", status: "SUBMITTED", hours: 20 }),
    ];
    const a = detectHoursAnomalies(rows).get("sub");
    expect(a).toBeDefined();
    expect(a!.baselineHours).toBe(10);
  });

  it("markeert meerdere ingediende urenstaten binnen dezelfde samenwerking onafhankelijk", () => {
    const rows = [
      ...approved("c1", 30, HOURS_ANOMALY_MIN_SAMPLE),
      row({ id: "ok", collaborationId: "c1", status: "SUBMITTED", hours: 31 }),
      row({ id: "high", collaborationId: "c1", status: "SUBMITTED", hours: 50 }),
    ];
    const anomalies = detectHoursAnomalies(rows);
    expect(anomalies.has("ok")).toBe(false);
    expect(anomalies.has("high")).toBe(true);
  });

  it("lege invoer levert een lege map", () => {
    expect(detectHoursAnomalies([]).size).toBe(0);
  });
});

describe("formatHoursNl", () => {
  it("toont hele uren zonder decimaal", () => {
    expect(formatHoursNl(40)).toBe("40");
  });

  it("toont maximaal één decimaal met nl-komma", () => {
    expect(formatHoursNl(37.5)).toBe("37,5");
  });
});

describe("formatHoursAnomalyNotice", () => {
  const anomaly: HoursAnomaly = {
    performanceId: "sub",
    hours: 50,
    baselineHours: 10,
    deltaPct: 400,
    sampleSize: 3,
  };

  it("bouwt één rustige controleer-even-zin met percentage, uren en mediaan", () => {
    expect(formatHoursAnomalyNotice(anomaly)).toBe(
      "≈400% meer uren dan gebruikelijk (50 u vs. mediaan 10 u) — controleer even.",
    );
  });

  it("gebruikt de nl-uren-notatie (komma-decimaal) voor niet-hele uren", () => {
    expect(formatHoursAnomalyNotice({ ...anomaly, hours: 37.5, baselineHours: 22.5 })).toBe(
      "≈400% meer uren dan gebruikelijk (37,5 u vs. mediaan 22,5 u) — controleer even.",
    );
  });

  it("blijft consistent met de detector (dezelfde tekst voor een gedetecteerde uitschieter)", () => {
    const rows = [
      ...approved("c1", 10, HOURS_ANOMALY_MIN_SAMPLE),
      row({ id: "sub", collaborationId: "c1", status: "SUBMITTED", hours: 50 }),
    ];
    const detected = detectHoursAnomalies(rows).get("sub");
    expect(detected).toBeDefined();
    expect(formatHoursAnomalyNotice(detected!)).toContain("controleer even.");
  });
});
