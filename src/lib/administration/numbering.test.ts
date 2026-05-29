import { describe, expect, it } from "vitest";
import {
  formatPartyInvoiceNumber,
  nextSequence,
  isGapFree,
  PLATFORM_ISSUER,
} from "@/lib/administration/numbering";

describe("formatPartyInvoiceNumber", () => {
  it("formatteert jaargebonden met padding", () => {
    expect(formatPartyInvoiceNumber(2026, 7)).toBe("2026-0007");
    expect(formatPartyInvoiceNumber(2026, 1234)).toBe("2026-1234");
  });
  it("weigert ongeldig jaar of volgnummer", () => {
    expect(() => formatPartyInvoiceNumber(1999, 1)).toThrow();
    expect(() => formatPartyInvoiceNumber(2026, 0)).toThrow();
  });
});

describe("nextSequence", () => {
  it("start op 1 bij lege reeks", () => {
    expect(nextSequence(null)).toBe(1);
    expect(nextSequence(undefined)).toBe(1);
    expect(nextSequence(0)).toBe(1);
  });
  it("hoogt op", () => {
    expect(nextSequence(6)).toBe(7);
  });
});

describe("isGapFree", () => {
  it("herkent een gatenvrije reeks", () => {
    expect(isGapFree([1, 2, 3, 4])).toBe(true);
    expect(isGapFree([3, 1, 2])).toBe(true);
  });
  it("herkent een gat", () => {
    expect(isGapFree([1, 2, 4])).toBe(false);
  });
});

describe("per-partij reeksen", () => {
  it("twee uitschrijvers mogen hetzelfde nummer hebben (uniek per partij, niet globaal)", () => {
    const zzpA = formatPartyInvoiceNumber(2026, 1);
    const zzpB = formatPartyInvoiceNumber(2026, 1);
    const platform = formatPartyInvoiceNumber(2026, 1);
    expect(zzpA).toBe(zzpB);
    expect(platform).toBe("2026-0001");
    expect(PLATFORM_ISSUER).toBe("PLATFORM");
  });
});
