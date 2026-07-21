import { describe, expect, it } from "vitest";
import {
  runSelfTestSweep,
  safeSweepDetail,
  summarizeSweep,
  type SweepEntry,
  type SweepRunner,
} from "@/lib/services/selftest-sweep";

function entry(status: SweepEntry["status"], key: string = status): SweepEntry {
  return { key, label: key, status, mode: "x" };
}

describe("summarizeSweep", () => {
  it("telt per status en geeft GO als niets faalt", () => {
    const report = summarizeSweep([entry("pass", "a"), entry("skipped", "b"), entry("pass", "c")]);
    expect(report.counts).toEqual({ pass: 2, fail: 0, skipped: 1 });
    expect(report.testedCount).toBe(2);
    expect(report.verdict).toBe("go");
  });

  it("geeft NO-GO zodra één actieve zelftest faalt", () => {
    const report = summarizeSweep([entry("pass", "a"), entry("fail", "b"), entry("skipped", "c")]);
    expect(report.counts).toEqual({ pass: 1, fail: 1, skipped: 1 });
    expect(report.verdict).toBe("no-go");
  });

  it("blijft GO als alles op een fallback draait (niets getest, geen vals groen via testedCount)", () => {
    const report = summarizeSweep([entry("skipped", "a"), entry("skipped", "b")]);
    expect(report.verdict).toBe("go");
    expect(report.testedCount).toBe(0);
  });

  it("behoudt de volgorde van de entries", () => {
    const report = summarizeSweep([entry("pass", "z"), entry("fail", "a"), entry("skipped", "m")]);
    expect(report.entries.map((e) => e.key)).toEqual(["z", "a", "m"]);
  });

  it("telt correct bij een lege lijst", () => {
    const report = summarizeSweep([]);
    expect(report.counts).toEqual({ pass: 0, fail: 0, skipped: 0 });
    expect(report.testedCount).toBe(0);
    expect(report.verdict).toBe("go");
  });
});

describe("safeSweepDetail", () => {
  it("geeft alleen de error-naam terug (nooit het rauwe bericht met mogelijke secrets)", () => {
    class CredentialsProviderError extends Error {
      override name = "CredentialsProviderError";
    }
    const err = new CredentialsProviderError("https://secret@endpoint/verkeerde-sleutel");
    const detail = safeSweepDetail(err);
    expect(detail).toBe("CredentialsProviderError");
    expect(detail).not.toContain("secret");
    expect(detail).not.toContain("endpoint");
  });

  it("valt terug op 'Error' bij een niet-Error", () => {
    expect(safeSweepDetail("kapot")).toBe("Error");
    expect(safeSweepDetail(undefined)).toBe("Error");
  });
});

describe("runSelfTestSweep", () => {
  it("draait alle runners en behoudt hun volgorde in het rapport", async () => {
    const runners: SweepRunner[] = [
      { key: "storage", label: "Opslag", run: async () => ({ status: "pass", mode: "s3" }) },
      {
        key: "billing",
        label: "Betaling",
        run: async () => ({ status: "skipped", mode: "noop", detail: "demo" }),
      },
      { key: "db", label: "DB", run: async () => ({ status: "pass", mode: "postgresql" }) },
    ];
    const report = await runSelfTestSweep(runners);
    expect(report.entries.map((e) => e.key)).toEqual(["storage", "billing", "db"]);
    expect(report.verdict).toBe("go");
    expect(report.entries[1]).toMatchObject({ status: "skipped", mode: "noop", detail: "demo" });
  });

  it("vangt een werpende runner op als fail zonder de hele sweep om te zetten", async () => {
    class UpstashError extends Error {
      override name = "UpstashError";
    }
    const runners: SweepRunner[] = [
      { key: "ok", label: "OK", run: async () => ({ status: "pass", mode: "s3" }) },
      {
        key: "boom",
        label: "Boom",
        run: async () => {
          throw new UpstashError("https://token@redis/rotte-sleutel");
        },
      },
    ];
    const report = await runSelfTestSweep(runners);
    expect(report.verdict).toBe("no-go");
    const boom = report.entries.find((e) => e.key === "boom");
    expect(boom).toMatchObject({ status: "fail", mode: "onbekend", detail: "UpstashError" });
    // Geen secret/endpoint in de detail.
    expect(boom?.detail).not.toContain("token");
    expect(boom?.detail).not.toContain("redis");
    // De andere runner draaide gewoon door.
    expect(report.entries.find((e) => e.key === "ok")?.status).toBe("pass");
  });

  it("een afgewezen promise wordt eveneens een veilige fail-entry", async () => {
    const runners: SweepRunner[] = [
      { key: "reject", label: "Reject", run: () => Promise.reject(new TypeError("nope")) },
    ];
    const report = await runSelfTestSweep(runners);
    expect(report.entries[0]).toMatchObject({ status: "fail", detail: "TypeError" });
  });
});
