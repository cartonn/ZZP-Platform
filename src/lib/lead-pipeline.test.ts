import { describe, it, expect } from "vitest";
import {
  summarizeLeadPipeline,
  LEAD_CONVERSION_MIN_SAMPLE,
  type LeadPipelineInput,
} from "@/lib/lead-pipeline";
import { LEAD_STALE_WARN_DAYS } from "@/lib/leads";

const NOW = new Date("2026-07-05T12:00:00.000Z");

function lead(overrides: Partial<LeadPipelineInput> = {}): LeadPipelineInput {
  return {
    status: "KOUD",
    daysSinceContact: 0,
    nextFollowUp: null,
    ...overrides,
  };
}

describe("summarizeLeadPipeline", () => {
  it("levert een lege, veilige samenvatting bij geen leads", () => {
    const s = summarizeLeadPipeline([], NOW);
    expect(s.total).toBe(0);
    expect(s.byStatus).toEqual({ KOUD: 0, WARM: 0, KLANT: 0, NO_DEAL: 0 });
    expect(s.active).toBe(0);
    expect(s.won).toBe(0);
    expect(s.decided).toBe(0);
    expect(s.attention).toBe(0);
    expect(s.conversionRate).toBeNull();
  });

  it("telt per stadium en bepaalt de actieve pijplijn (koud + warm)", () => {
    const s = summarizeLeadPipeline(
      [
        lead({ status: "KOUD" }),
        lead({ status: "KOUD" }),
        lead({ status: "WARM" }),
        lead({ status: "KLANT" }),
        lead({ status: "NO_DEAL" }),
      ],
      NOW,
    );
    expect(s.total).toBe(5);
    expect(s.byStatus).toEqual({ KOUD: 2, WARM: 1, KLANT: 1, NO_DEAL: 1 });
    expect(s.active).toBe(3);
    expect(s.won).toBe(1);
    expect(s.decided).toBe(2);
  });

  it("telt een stille warme lead (≥ drempel dagen) als aandacht, koud niet", () => {
    const s = summarizeLeadPipeline(
      [
        lead({ status: "WARM", daysSinceContact: LEAD_STALE_WARN_DAYS }),
        lead({ status: "WARM", daysSinceContact: LEAD_STALE_WARN_DAYS - 1 }),
        // Een koude lead die lang stil is telt bewust niet als "stil" (isLeadStale = alleen WARM).
        lead({ status: "KOUD", daysSinceContact: 999 }),
      ],
      NOW,
    );
    expect(s.stale).toBe(1);
    expect(s.attention).toBe(1);
  });

  it("telt een te-late opvolging op een actieve lead als aandacht", () => {
    const s = summarizeLeadPipeline(
      [
        lead({ status: "KOUD", nextFollowUp: new Date("2026-07-04T00:00:00.000Z") }), // gisteren → te laat
        lead({ status: "WARM", nextFollowUp: new Date("2026-07-06T00:00:00.000Z") }), // morgen → op tijd
        lead({ status: "KOUD", nextFollowUp: new Date("2026-07-05T00:00:00.000Z") }), // vandaag → niet te laat
      ],
      NOW,
    );
    expect(s.overdueFollowUps).toBe(1);
    expect(s.attention).toBe(1);
  });

  it("negeert een te-late opvolgdatum op een beslíste lead (klant/afgevallen)", () => {
    const past = new Date("2026-06-01T00:00:00.000Z");
    const s = summarizeLeadPipeline(
      [
        lead({ status: "KLANT", nextFollowUp: past }),
        lead({ status: "NO_DEAL", nextFollowUp: past }),
      ],
      NOW,
    );
    expect(s.overdueFollowUps).toBe(0);
    expect(s.attention).toBe(0);
  });

  it("telt een lead die zowel stil als te laat is maar één keer als aandacht", () => {
    const s = summarizeLeadPipeline(
      [
        lead({
          status: "WARM",
          daysSinceContact: LEAD_STALE_WARN_DAYS + 5,
          nextFollowUp: new Date("2026-06-20T00:00:00.000Z"),
        }),
      ],
      NOW,
    );
    expect(s.stale).toBe(1);
    expect(s.overdueFollowUps).toBe(1);
    expect(s.attention).toBe(1);
  });

  it("berekent de conversieratio (klant / beslist) boven de steekproefdrempel", () => {
    const leads: LeadPipelineInput[] = [
      ...Array.from({ length: 3 }, () => lead({ status: "KLANT" })),
      ...Array.from({ length: 1 }, () => lead({ status: "NO_DEAL" })),
      lead({ status: "WARM" }), // niet beslist → telt niet mee in de ratio
    ];
    const s = summarizeLeadPipeline(leads, NOW);
    expect(s.decided).toBe(4);
    expect(s.decided).toBeGreaterThanOrEqual(LEAD_CONVERSION_MIN_SAMPLE);
    expect(s.conversionRate).toBe(75); // 3 / 4
  });

  it("onderdrukt de conversieratio onder de steekproefdrempel (voorkomt misleidende 100%)", () => {
    const s = summarizeLeadPipeline([lead({ status: "KLANT" }), lead({ status: "NO_DEAL" })], NOW);
    expect(s.decided).toBe(2);
    expect(s.conversionRate).toBeNull();
  });
});
