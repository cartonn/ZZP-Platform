import { describe, it, expect } from "vitest";
import { summarizeFirstLookOverdue } from "@/lib/client-first-look";
import { CANDIDATE_GHOSTING_RISK_DAYS } from "@/lib/client-application-funnel";

const NOW = new Date("2026-07-30T12:00:00.000Z");
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000);

describe("summarizeFirstLookOverdue", () => {
  it("geen reacties → null", () => {
    expect(summarizeFirstLookOverdue([], NOW)).toBeNull();
  });

  it("alle NEW-reacties verser dan de drempel → null (geen valse nudge)", () => {
    const inputs = [
      { createdAt: daysAgo(0) },
      { createdAt: daysAgo(CANDIDATE_GHOSTING_RISK_DAYS - 1) },
    ];
    expect(summarizeFirstLookOverdue(inputs, NOW)).toBeNull();
  });

  it("exact op de drempel telt mee", () => {
    const s = summarizeFirstLookOverdue(
      [{ createdAt: daysAgo(CANDIDATE_GHOSTING_RISK_DAYS) }],
      NOW,
    );
    expect(s).toEqual({ count: 1, oldestDays: CANDIDATE_GHOSTING_RISK_DAYS });
  });

  it("telt alleen de reacties voorbij de drempel en rapporteert de oudste", () => {
    const inputs = [
      { createdAt: daysAgo(1) }, // vers → telt niet
      { createdAt: daysAgo(6) }, // over de drempel
      { createdAt: daysAgo(12) }, // over de drempel, oudste
    ];
    expect(summarizeFirstLookOverdue(inputs, NOW)).toEqual({ count: 2, oldestDays: 12 });
  });

  it("createdAt in de toekomst (data-ruis) → 0 dagen, nooit negatief, telt niet mee", () => {
    expect(summarizeFirstLookOverdue([{ createdAt: daysAgo(-3) }], NOW)).toBeNull();
  });

  it("muteert de invoer niet", () => {
    const inputs = [{ createdAt: daysAgo(9) }];
    const snapshot = inputs.map((i) => i.createdAt.getTime());
    summarizeFirstLookOverdue(inputs, NOW);
    expect(inputs.map((i) => i.createdAt.getTime())).toEqual(snapshot);
  });
});
