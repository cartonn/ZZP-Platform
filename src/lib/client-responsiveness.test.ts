import { describe, it, expect } from "vitest";
import {
  computeClientResponsiveness,
  describeApplicantResponsiveness,
  type ResponseRow,
} from "@/lib/client-responsiveness";

const NOW = new Date("2026-06-17T12:00:00Z");

function daysAgo(n: number): Date {
  return new Date(NOW.getTime() - n * 86_400_000);
}

function row(status: string, ageDays = 1): ResponseRow {
  return { status, createdAt: daysAgo(ageDays) };
}

describe("computeClientResponsiveness", () => {
  it("geeft 'unknown' onder de steekproefgrens (< 3 reacties)", () => {
    const result = computeClientResponsiveness([row("VIEWED"), row("NEW")], NOW);
    expect(result.tone).toBe("unknown");
    expect(result.sampleSize).toBe(2);
    expect(result.handledPct).toBeNull();
    expect(result.oldestPendingDays).toBeNull();
  });

  it("telt handled vs pending en berekent het percentage", () => {
    const rows = [row("VIEWED"), row("SHORTLIST"), row("ACCEPTED"), row("NEW", 2)];
    const result = computeClientResponsiveness(rows, NOW);
    expect(result.sampleSize).toBe(4);
    expect(result.handled).toBe(3);
    expect(result.pending).toBe(1);
    expect(result.handledPct).toBe(75);
  });

  it("is 'good' bij ≥ 80% opgepakt en niets te lang open", () => {
    const rows = [row("VIEWED"), row("ACCEPTED"), row("REJECTED"), row("SHORTLIST"), row("NEW", 3)];
    const result = computeClientResponsiveness(rows, NOW);
    expect(result.handledPct).toBe(80);
    expect(result.stalePending).toBe(0);
    expect(result.tone).toBe("good");
  });

  it("is 'good' wanneer alles is opgepakt (geen open reacties)", () => {
    const rows = [row("VIEWED"), row("ACCEPTED"), row("REJECTED")];
    const result = computeClientResponsiveness(rows, NOW);
    expect(result.pending).toBe(0);
    expect(result.handledPct).toBe(100);
    expect(result.tone).toBe("good");
  });

  it("is 'warning' bij een reactie die langer dan 14 dagen op NEW staat", () => {
    const rows = [row("ACCEPTED"), row("VIEWED"), row("REJECTED"), row("NEW", 20)];
    const result = computeClientResponsiveness(rows, NOW);
    expect(result.handledPct).toBe(75);
    expect(result.stalePending).toBe(1);
    expect(result.oldestPendingDays).toBe(20);
    expect(result.tone).toBe("warning");
  });

  it("is 'warning' bij minder dan 50% opgepakt", () => {
    const rows = [row("VIEWED"), row("NEW", 2), row("NEW", 1), row("NEW", 3)];
    const result = computeClientResponsiveness(rows, NOW);
    expect(result.handledPct).toBe(25);
    expect(result.tone).toBe("warning");
  });

  it("is 'neutral' tussen de grenzen in zonder te-lang-open reactie", () => {
    // 4 van 6 opgepakt = 67% (≥50, <80), oudste open reactie 5 dagen (< 14) → neutral.
    const rows = [
      row("VIEWED"),
      row("ACCEPTED"),
      row("REJECTED"),
      row("SHORTLIST"),
      row("NEW", 5),
      row("NEW", 2),
    ];
    const result = computeClientResponsiveness(rows, NOW);
    expect(result.handledPct).toBe(67);
    expect(result.stalePending).toBe(0);
    expect(result.tone).toBe("neutral");
  });

  it("rapporteert de oudste openstaande leeftijd en het aantal stale reacties", () => {
    const rows = [row("ACCEPTED"), row("NEW", 16), row("NEW", 30), row("NEW", 2)];
    const result = computeClientResponsiveness(rows, NOW);
    expect(result.oldestPendingDays).toBe(30);
    expect(result.stalePending).toBe(2);
  });

  it("klemt een toekomstige createdAt (data-ruis) op 0 dagen", () => {
    const rows = [
      row("ACCEPTED"),
      row("VIEWED"),
      { status: "NEW", createdAt: new Date(NOW.getTime() + 86_400_000) },
    ];
    const result = computeClientResponsiveness(rows, NOW);
    expect(result.oldestPendingDays).toBe(0);
    expect(result.stalePending).toBe(0);
  });

  it("geeft 'unknown' bij een lege lijst", () => {
    const result = computeClientResponsiveness([], NOW);
    expect(result.sampleSize).toBe(0);
    expect(result.tone).toBe("unknown");
  });
});

describe("computeClientResponsiveness — WITHDRAWN", () => {
  it("sluit ingetrokken reacties uit de steekproef uit", () => {
    // 3 echte reacties (2 opgepakt, 1 open) + 1 ingetrokken die niet mag meetellen.
    const rows = [row("VIEWED"), row("SHORTLIST"), row("NEW"), row("WITHDRAWN")];
    const result = computeClientResponsiveness(rows, NOW);
    expect(result.sampleSize).toBe(3);
    expect(result.handled).toBe(2);
    expect(result.pending).toBe(1);
  });

  it("telt een ingetrokken reactie niet als 'opgepakt'", () => {
    // Zonder uitsluiting zou WITHDRAWN (status !== NEW) ten onrechte als handled meetellen.
    const rows = [row("NEW"), row("NEW"), row("NEW"), row("WITHDRAWN")];
    const result = computeClientResponsiveness(rows, NOW);
    expect(result.sampleSize).toBe(3);
    expect(result.handled).toBe(0);
    expect(result.handledPct).toBe(0);
  });
});

describe("describeApplicantResponsiveness", () => {
  it("geeft een geruststellende noot bij tone 'good'", () => {
    // 4 opgepakt, 0 open → 100% opgepakt, niets stale → good.
    const rows = [row("VIEWED"), row("SHORTLIST"), row("ACCEPTED"), row("REJECTED")];
    const responsiveness = computeClientResponsiveness(rows, NOW);
    expect(responsiveness.tone).toBe("good");
    const note = describeApplicantResponsiveness(responsiveness);
    expect(note).not.toBeNull();
    expect(note?.tone).toBe("good");
    expect(note?.label).toContain("doorgaans");
  });

  it("waarschuwt met percentage bij tone 'warning' (weinig opgepakt)", () => {
    // 3 open, 1 opgepakt → 25% opgepakt → warning.
    const rows = [row("NEW"), row("NEW"), row("NEW"), row("VIEWED")];
    const responsiveness = computeClientResponsiveness(rows, NOW);
    expect(responsiveness.tone).toBe("warning");
    const note = describeApplicantResponsiveness(responsiveness);
    expect(note?.tone).toBe("warning");
    expect(note?.label).toContain("25% opgepakt");
    expect(note?.label).toContain("andere opdrachten");
  });

  it("waarschuwt ook bij een reactie die te lang blijft liggen (stale)", () => {
    // Hoog oppak-percentage maar één reactie > 14 dagen op NEW → warning.
    const rows = [row("VIEWED"), row("SHORTLIST"), row("ACCEPTED"), row("NEW", 20)];
    const responsiveness = computeClientResponsiveness(rows, NOW);
    expect(responsiveness.tone).toBe("warning");
    expect(describeApplicantResponsiveness(responsiveness)?.tone).toBe("warning");
  });

  it("geeft null bij een neutraal signaal (geen beslissingswaarde)", () => {
    // 2 opgepakt, 2 open → 50% opgepakt, niets stale → neutral.
    const rows = [row("VIEWED"), row("SHORTLIST"), row("NEW"), row("NEW")];
    const responsiveness = computeClientResponsiveness(rows, NOW);
    expect(responsiveness.tone).toBe("neutral");
    expect(describeApplicantResponsiveness(responsiveness)).toBeNull();
  });

  it("geeft null bij te weinig historie (unknown)", () => {
    const responsiveness = computeClientResponsiveness([row("VIEWED"), row("NEW")], NOW);
    expect(responsiveness.tone).toBe("unknown");
    expect(describeApplicantResponsiveness(responsiveness)).toBeNull();
  });
});
