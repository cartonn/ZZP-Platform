import { describe, expect, it } from "vitest";
import { buildPerformancePdf, type PerformancePdfData } from "@/lib/performance-pdf";

const hours: PerformancePdfData = {
  perfType: "HOURS",
  jobTitle: "Senior Developer",
  freelancerName: "Jan de Vries",
  clientName: "Acme BV",
  periodStart: "2026-01-06",
  periodEnd: "2026-01-10",
  hours: 40,
  rateCents: 8500,
  amountCents: null,
  milestoneTitle: null,
  description: "Werkzaamheden week 1",
  ortSegments: null,
  ortProfile: null,
  ortCustomRates: null,
  ortRatesSnapshot: null,
  submittedAt: "2026-01-11",
};

const pdfHeader = (b: Uint8Array) => String.fromCharCode(...b.slice(0, 5));

describe("buildPerformancePdf", () => {
  it("urenstaat → geldige PDF-bytes", async () => {
    const b = await buildPerformancePdf(hours);
    expect(pdfHeader(b)).toBe("%PDF-");
    expect(b.length).toBeGreaterThan(800);
  });

  it("oplevering (milestone) → geldige PDF", async () => {
    const b = await buildPerformancePdf({
      ...hours,
      perfType: "MILESTONE",
      hours: null,
      rateCents: null,
      amountCents: 150000,
      milestoneTitle: "Fase 1 opgeleverd",
    });
    expect(pdfHeader(b)).toBe("%PDF-");
  });

  it("urenstaat met ORT-segmenten → geldige PDF", async () => {
    const b = await buildPerformancePdf({
      ...hours,
      ortSegments: JSON.stringify([
        { category: "NORMAL", hours: 32 },
        { category: "EVENING", hours: 6 },
        { category: "SUNDAY", hours: 2 },
      ]),
    });
    expect(pdfHeader(b)).toBe("%PDF-");
  });

  it("bevroren ORT-snapshot → geldige PDF (snapshot wint van live profiel)", async () => {
    const b = await buildPerformancePdf({
      ...hours,
      ortSegments: JSON.stringify([
        { category: "NORMAL", hours: 6 },
        { category: "NIGHT", hours: 2 },
      ]),
      ortProfile: "GHZ", // ander profiel dan de snapshot → zou driften zonder snapshot
      ortRatesSnapshot: JSON.stringify({
        EVENING: 2200,
        NIGHT: 4900,
        SATURDAY: 3000,
        SUNDAY: 6000,
        HOLIDAY: 10000,
      }),
    });
    expect(pdfHeader(b)).toBe("%PDF-");
  });

  it("exotische tekens in de omschrijving crashen de generatie niet", async () => {
    const b = await buildPerformancePdf({ ...hours, description: "Emoji 🚀 漢字 — café ✓" });
    expect(pdfHeader(b)).toBe("%PDF-");
  });
});
