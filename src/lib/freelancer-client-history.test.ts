import { describe, it, expect } from "vitest";
import {
  summarizeFreelancerClientHistory,
  freelancerClientHistoryLabel,
  type FreelancerClientHistoryRow,
} from "@/lib/freelancer-client-history";

const d = (iso: string) => new Date(iso);

describe("summarizeFreelancerClientHistory", () => {
  it("geeft null zonder afgeronde samenwerkingen", () => {
    expect(summarizeFreelancerClientHistory([])).toBeNull();
  });

  it("telt de afgeronde samenwerkingen en neemt de meest recente afronddatum", () => {
    const rows: FreelancerClientHistoryRow[] = [
      { completedAt: d("2026-01-10"), createdAt: d("2025-12-01") },
      { completedAt: d("2026-05-20"), createdAt: d("2026-04-01") },
      { completedAt: d("2026-03-15"), createdAt: d("2026-02-01") },
    ];
    const result = summarizeFreelancerClientHistory(rows);
    expect(result).not.toBeNull();
    expect(result?.count).toBe(3);
    expect(result?.lastCompletedAt.toISOString()).toBe(d("2026-05-20").toISOString());
  });

  it("valt terug op createdAt wanneer completedAt ontbreekt (legacy)", () => {
    const rows: FreelancerClientHistoryRow[] = [
      { completedAt: null, createdAt: d("2026-06-01") },
      { completedAt: d("2026-02-01"), createdAt: d("2026-01-01") },
    ];
    const result = summarizeFreelancerClientHistory(rows);
    expect(result?.count).toBe(2);
    // createdAt van rij 1 (juni) > completedAt van rij 2 (feb) → juni wint.
    expect(result?.lastCompletedAt.toISOString()).toBe(d("2026-06-01").toISOString());
  });

  it("werkt met één samenwerking", () => {
    const result = summarizeFreelancerClientHistory([
      { completedAt: d("2026-04-04"), createdAt: d("2026-03-03") },
    ]);
    expect(result?.count).toBe(1);
    expect(result?.lastCompletedAt.toISOString()).toBe(d("2026-04-04").toISOString());
  });
});

describe("freelancerClientHistoryLabel", () => {
  it("is sober bij één samenwerking", () => {
    expect(freelancerClientHistoryLabel(1)).toBe("Eerder samengewerkt");
  });

  it("toont de telling bij meerdere", () => {
    expect(freelancerClientHistoryLabel(3)).toBe("3× eerder samengewerkt");
  });
});
