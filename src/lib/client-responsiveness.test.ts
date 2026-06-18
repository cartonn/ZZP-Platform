import { describe, it, expect } from "vitest";
import { computeClientResponsiveness, type ResponseRow } from "@/lib/client-responsiveness";

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
