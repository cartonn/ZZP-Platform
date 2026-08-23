import { describe, expect, it } from "vitest";
import {
  PERFORMANCE_WAIT_ATTENTION_DAYS,
  countPerformancesAwaitingAttention,
  performanceWaitLabel,
  summarizePerformanceWait,
  type PerformanceWaitInput,
} from "@/lib/performance-wait";

const NOW = new Date("2026-08-23T12:00:00.000Z");

/** Een Date `days` dagen vóór NOW. */
function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 86_400_000);
}

describe("summarizePerformanceWait", () => {
  it("geeft null voor een concept (DRAFT) — nog aan de ZZP'er zelf", () => {
    expect(summarizePerformanceWait({ status: "DRAFT", submittedAt: null }, NOW)).toBeNull();
  });

  it("geeft null voor een goedgekeurde urenstaat — wacht niet meer", () => {
    expect(
      summarizePerformanceWait({ status: "APPROVED", submittedAt: daysAgo(3) }, NOW),
    ).toBeNull();
  });

  it("geeft null voor een afgekeurde urenstaat — toont al zijn reden", () => {
    expect(
      summarizePerformanceWait({ status: "REJECTED", submittedAt: daysAgo(3) }, NOW),
    ).toBeNull();
  });

  it("geeft null voor een onbekende/onverwachte status (defensief)", () => {
    expect(
      summarizePerformanceWait({ status: "ONBEKEND", submittedAt: daysAgo(3) }, NOW),
    ).toBeNull();
  });

  it("geeft null voor SUBMITTED zonder submittedAt (data-ruis, geen leeftijd afleidbaar)", () => {
    expect(summarizePerformanceWait({ status: "SUBMITTED", submittedAt: null }, NOW)).toBeNull();
  });

  it("telt hele wachtdagen voor een ingediende urenstaat", () => {
    const wait = summarizePerformanceWait({ status: "SUBMITTED", submittedAt: daysAgo(4) }, NOW);
    expect(wait).toEqual({ daysWaiting: 4, attention: false });
  });

  it("markeert aandacht zodra de drempel (dag 7) is bereikt", () => {
    const wait = summarizePerformanceWait(
      { status: "SUBMITTED", submittedAt: daysAgo(PERFORMANCE_WAIT_ATTENTION_DAYS) },
      NOW,
    );
    expect(wait?.attention).toBe(true);
  });

  it("markeert geen aandacht één dag onder de drempel", () => {
    const wait = summarizePerformanceWait(
      { status: "SUBMITTED", submittedAt: daysAgo(PERFORMANCE_WAIT_ATTENTION_DAYS - 1) },
      NOW,
    );
    expect(wait?.attention).toBe(false);
  });

  it("klemt een submittedAt in de toekomst op 0 dagen (nooit negatief)", () => {
    const future = new Date(NOW.getTime() + 3 * 86_400_000);
    const wait = summarizePerformanceWait({ status: "SUBMITTED", submittedAt: future }, NOW);
    expect(wait).toEqual({ daysWaiting: 0, attention: false });
  });
});

describe("performanceWaitLabel", () => {
  it("toont 'Vandaag ingediend' op dag 0 (geen misleidend '0 dagen')", () => {
    expect(performanceWaitLabel({ daysWaiting: 0, attention: false })).toBe(
      "Vandaag ingediend, wacht op goedkeuring",
    );
  });

  it("gebruikt enkelvoud op dag 1", () => {
    expect(performanceWaitLabel({ daysWaiting: 1, attention: false })).toBe(
      "Wacht al 1 dag op goedkeuring",
    );
  });

  it("gebruikt meervoud vanaf dag 2", () => {
    expect(performanceWaitLabel({ daysWaiting: 9, attention: true })).toBe(
      "Wacht al 9 dagen op goedkeuring",
    );
  });
});

describe("countPerformancesAwaitingAttention", () => {
  it("telt alleen ingediende urenstaten voorbij de drempel", () => {
    const inputs: PerformanceWaitInput[] = [
      { status: "SUBMITTED", submittedAt: daysAgo(PERFORMANCE_WAIT_ATTENTION_DAYS + 2) }, // telt
      { status: "SUBMITTED", submittedAt: daysAgo(PERFORMANCE_WAIT_ATTENTION_DAYS) }, // telt
      { status: "SUBMITTED", submittedAt: daysAgo(1) }, // te vers
      { status: "DRAFT", submittedAt: null }, // geen wachtsignaal
      { status: "APPROVED", submittedAt: daysAgo(30) }, // besloten
    ];
    expect(countPerformancesAwaitingAttention(inputs, NOW)).toBe(2);
  });

  it("geeft 0 voor een lege set", () => {
    expect(countPerformancesAwaitingAttention([], NOW)).toBe(0);
  });
});
