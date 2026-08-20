import { describe, expect, it } from "vitest";
import {
  PROPOSAL_STALE_DAYS,
  summarizeProposalAge,
  type ProposalAgeInput,
} from "./collaboration-proposal-age";

const NOW = new Date("2026-08-20T12:00:00Z");

function daysAgo(n: number): Date {
  return new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);
}

function base(overrides: Partial<ProposalAgeInput> = {}): ProposalAgeInput {
  return {
    status: "PROPOSED",
    contractStatus: "DRAFT",
    createdAt: daysAgo(0),
    now: NOW,
    ...overrides,
  };
}

describe("summarizeProposalAge", () => {
  it("zwijgt voor een vers voorstel onder de drempel", () => {
    const r = summarizeProposalAge(base({ createdAt: daysAgo(2) }));
    expect(r.phase).toBe("fresh");
    expect(r.attention).toBe(false);
    expect(r.label).toBeNull();
    expect(r.daysWaiting).toBe(2);
  });

  it("markeert een voorstel op of voorbij de drempel als stilstaand met label", () => {
    const r = summarizeProposalAge(base({ createdAt: daysAgo(PROPOSAL_STALE_DAYS) }));
    expect(r.phase).toBe("stalling");
    expect(r.attention).toBe(true);
    expect(r.daysWaiting).toBe(PROPOSAL_STALE_DAYS);
    expect(r.label).toBe(`Wacht al ${PROPOSAL_STALE_DAYS} dagen op ondertekening`);
  });

  it("telt hele dagen en spiegelt dat in het label", () => {
    const r = summarizeProposalAge(base({ createdAt: daysAgo(9) }));
    expect(r.daysWaiting).toBe(9);
    expect(r.label).toBe("Wacht al 9 dagen op ondertekening");
  });

  it("respecteert een aangepaste drempel", () => {
    const r = summarizeProposalAge(base({ createdAt: daysAgo(6), thresholdDays: 10 }));
    expect(r.phase).toBe("fresh");
    expect(r.attention).toBe(false);
  });

  it("zwijgt zodra het contract is ondertekend", () => {
    const r = summarizeProposalAge(base({ contractStatus: "SIGNED", createdAt: daysAgo(30) }));
    expect(r.phase).toBe("none");
    expect(r.attention).toBe(false);
    expect(r.label).toBeNull();
  });

  it("zwijgt voor een niet-PROPOSED samenwerking (ACTIVE/COMPLETED/CANCELLED)", () => {
    for (const status of ["ACTIVE", "COMPLETED", "CANCELLED"]) {
      const r = summarizeProposalAge(base({ status, createdAt: daysAgo(30) }));
      expect(r.phase).toBe("none");
      expect(r.attention).toBe(false);
    }
  });

  it("zwijgt bij een bevroren (dispuut) voorstel", () => {
    const r = summarizeProposalAge(base({ disputed: true, createdAt: daysAgo(30) }));
    expect(r.phase).toBe("none");
    expect(r.attention).toBe(false);
  });

  it("klemt klok-skew (createdAt in de toekomst) naar nul", () => {
    const r = summarizeProposalAge(base({ createdAt: new Date(NOW.getTime() + 86_400_000) }));
    expect(r.daysWaiting).toBe(0);
    expect(r.phase).toBe("fresh");
  });

  it("is TZ-robuust rond middernacht (hele UTC-dagen)", () => {
    const createdAt = new Date("2026-08-14T23:30:00Z");
    const now = new Date("2026-08-20T00:30:00Z");
    const r = summarizeProposalAge(base({ createdAt, now }));
    // 6 hele UTC-dagen tussen 14 en 20 augustus.
    expect(r.daysWaiting).toBe(6);
    expect(r.phase).toBe("stalling");
  });
});
