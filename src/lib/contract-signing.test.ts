import { describe, expect, it } from "vitest";
import {
  CONTRACT_SIGNING_STALE_DAYS,
  summarizeContractSigning,
  contractSigningStaleThreshold,
  daysWaiting,
  waitingLabel,
} from "@/lib/contract-signing";

const DAY = 24 * 60 * 60 * 1000;

function daysAgo(now: number, days: number): Date {
  return new Date(now - days * DAY);
}

describe("contract-signing — re-exports", () => {
  it("daysWaiting/waitingLabel zijn beschikbaar via deze module", () => {
    const now = Date.UTC(2026, 5, 15);
    expect(daysWaiting(daysAgo(now, 3), now)).toBe(3);
    expect(waitingLabel(0)).toBe("vandaag ingediend");
    expect(waitingLabel(1)).toBe("1 dag wachtend");
    expect(waitingLabel(6)).toBe("6 dagen wachtend");
  });
});

describe("summarizeContractSigning", () => {
  const now = Date.UTC(2026, 5, 15);

  it("lege invoer → nullen", () => {
    expect(summarizeContractSigning([], now)).toEqual({
      pending: 0,
      oldestDays: 0,
      staleCount: 0,
    });
  });

  it("telt elk voorstel als pending (anker = createdAt)", () => {
    const result = summarizeContractSigning(
      [{ createdAt: daysAgo(now, 1) }, { createdAt: daysAgo(now, 2) }],
      now,
    );
    expect(result.pending).toBe(2);
  });

  it("oldestDays is de langst wachtende, ongeacht volgorde", () => {
    const result = summarizeContractSigning(
      [
        { createdAt: daysAgo(now, 2) },
        { createdAt: daysAgo(now, 9) },
        { createdAt: daysAgo(now, 4) },
      ],
      now,
    );
    expect(result.oldestDays).toBe(9);
  });

  it("staleCount telt alleen voorstellen >= CONTRACT_SIGNING_STALE_DAYS", () => {
    const result = summarizeContractSigning(
      [
        { createdAt: daysAgo(now, CONTRACT_SIGNING_STALE_DAYS - 1) }, // niet stale
        { createdAt: daysAgo(now, CONTRACT_SIGNING_STALE_DAYS) }, // precies op de grens → stale
        { createdAt: daysAgo(now, CONTRACT_SIGNING_STALE_DAYS + 3) }, // stale
      ],
      now,
    );
    expect(result.pending).toBe(3);
    expect(result.staleCount).toBe(2);
  });

  it("een vandaag-aangemaakt voorstel telt mee maar is niet stale", () => {
    const result = summarizeContractSigning([{ createdAt: new Date(now) }], now);
    expect(result).toEqual({ pending: 1, oldestDays: 0, staleCount: 0 });
  });

  it("muteert de invoer niet", () => {
    const items = [{ createdAt: daysAgo(now, 3) }];
    const snapshot = items.map((i) => i.createdAt.getTime());
    summarizeContractSigning(items, now);
    expect(items.map((i) => i.createdAt.getTime())).toEqual(snapshot);
  });
});

describe("contractSigningStaleThreshold", () => {
  it("ligt CONTRACT_SIGNING_STALE_DAYS dagen vóór nu", () => {
    const now = Date.UTC(2026, 5, 15);
    expect(contractSigningStaleThreshold(now).getTime()).toBe(
      now - CONTRACT_SIGNING_STALE_DAYS * DAY,
    );
  });

  it("een createdAt op/vóór de drempel is precies de stale-grens", () => {
    const now = Date.UTC(2026, 5, 15);
    const threshold = contractSigningStaleThreshold(now);
    // Een voorstel aangemaakt op de drempel wacht exact CONTRACT_SIGNING_STALE_DAYS dagen.
    expect(daysWaiting(threshold, now)).toBe(CONTRACT_SIGNING_STALE_DAYS);
  });
});
