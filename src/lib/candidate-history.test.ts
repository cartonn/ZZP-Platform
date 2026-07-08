import { describe, it, expect } from "vitest";
import {
  summarizeSharedHistory,
  sharedHistoryLabel,
  type SharedHistoryRow,
} from "./candidate-history";

const d = (iso: string) => new Date(iso);

describe("summarizeSharedHistory", () => {
  it("returns an empty map when there are no rows", () => {
    expect(summarizeSharedHistory([], ["f1", "f2"]).size).toBe(0);
  });

  it("counts one completed collaboration and uses completedAt as the last date", () => {
    const rows: SharedHistoryRow[] = [
      { freelancerId: "f1", completedAt: d("2026-05-10T00:00:00Z"), createdAt: d("2026-04-01") },
    ];
    const map = summarizeSharedHistory(rows, ["f1"]);
    expect(map.get("f1")).toEqual({ count: 1, lastCompletedAt: d("2026-05-10T00:00:00Z") });
  });

  it("aggregates multiple collaborations and keeps the most recent completion date", () => {
    const rows: SharedHistoryRow[] = [
      { freelancerId: "f1", completedAt: d("2026-01-15"), createdAt: d("2026-01-01") },
      { freelancerId: "f1", completedAt: d("2026-06-20"), createdAt: d("2026-06-01") },
      { freelancerId: "f1", completedAt: d("2026-03-05"), createdAt: d("2026-03-01") },
    ];
    const map = summarizeSharedHistory(rows, ["f1"]);
    expect(map.get("f1")).toEqual({ count: 3, lastCompletedAt: d("2026-06-20") });
  });

  it("falls back to createdAt when completedAt is null (legacy records)", () => {
    const rows: SharedHistoryRow[] = [
      { freelancerId: "f1", completedAt: null, createdAt: d("2026-02-02") },
    ];
    expect(summarizeSharedHistory(rows, ["f1"]).get("f1")).toEqual({
      count: 1,
      lastCompletedAt: d("2026-02-02"),
    });
  });

  it("takes the newer of completedAt-vs-createdAt across mixed rows", () => {
    const rows: SharedHistoryRow[] = [
      { freelancerId: "f1", completedAt: d("2026-04-01"), createdAt: d("2026-03-01") },
      { freelancerId: "f1", completedAt: null, createdAt: d("2026-07-01") }, // legacy, later
    ];
    expect(summarizeSharedHistory(rows, ["f1"]).get("f1")).toEqual({
      count: 2,
      lastCompletedAt: d("2026-07-01"),
    });
  });

  it("keeps profiles separate", () => {
    const rows: SharedHistoryRow[] = [
      { freelancerId: "f1", completedAt: d("2026-05-01"), createdAt: d("2026-04-01") },
      { freelancerId: "f2", completedAt: d("2026-06-01"), createdAt: d("2026-05-01") },
      { freelancerId: "f2", completedAt: d("2026-06-15"), createdAt: d("2026-06-01") },
    ];
    const map = summarizeSharedHistory(rows, ["f1", "f2"]);
    expect(map.get("f1")?.count).toBe(1);
    expect(map.get("f2")?.count).toBe(2);
    expect(map.get("f2")?.lastCompletedAt).toEqual(d("2026-06-15"));
  });

  it("ignores rows whose freelancer is not in the requested set (defensive)", () => {
    const rows: SharedHistoryRow[] = [
      { freelancerId: "stranger", completedAt: d("2026-05-01"), createdAt: d("2026-04-01") },
    ];
    expect(summarizeSharedHistory(rows, ["f1"]).size).toBe(0);
  });
});

describe("sharedHistoryLabel", () => {
  it("is sober for a single collaboration", () => {
    expect(sharedHistoryLabel(1)).toBe("Eerder samengewerkt");
  });

  it("shows the count for more than one", () => {
    expect(sharedHistoryLabel(3)).toBe("3× eerder samengewerkt");
  });

  it("treats 0 like the single-case label (defensive; never rendered)", () => {
    expect(sharedHistoryLabel(0)).toBe("Eerder samengewerkt");
  });
});
