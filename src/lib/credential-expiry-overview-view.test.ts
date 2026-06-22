import { describe, expect, it } from "vitest";
import { type ExpiryOverview, type ExpiryItem } from "@/lib/credential-expiry-overview";
import {
  EXPIRY_CARD_MAX_LISTED,
  expiryCardHidden,
  expiryChips,
  expiryDaysLabel,
  expiryRemaining,
} from "./credential-expiry-overview-view";

const item = (id: string, days: number): ExpiryItem => ({
  id,
  title: `Cert ${id}`,
  type: "VOG",
  expiresAt: new Date("2026-07-01"),
  days,
  window: days < 0 ? "EXPIRED" : days <= 30 ? "WITHIN_30" : days <= 60 ? "WITHIN_60" : "WITHIN_90",
});

const overview = (over: Partial<ExpiryOverview>): ExpiryOverview => ({
  total: 0,
  expired: 0,
  within30: 0,
  within60: 0,
  within90: 0,
  items: [],
  ...over,
});

describe("expiryDaysLabel", () => {
  it("toont 'verlopen' bij een negatief aantal dagen", () => {
    expect(expiryDaysLabel(-1)).toBe("verlopen");
    expect(expiryDaysLabel(-99)).toBe("verlopen");
  });

  it("toont 'verloopt vandaag' bij 0", () => {
    expect(expiryDaysLabel(0)).toBe("verloopt vandaag");
  });

  it("toont 'over N dag(en)' met correcte enkelvoud/meervoud", () => {
    expect(expiryDaysLabel(1)).toBe("over 1 dag");
    expect(expiryDaysLabel(5)).toBe("over 5 dagen");
  });
});

describe("expiryChips", () => {
  it("filtert lege buckets weg en behoudt de volgorde + tonen", () => {
    const chips = expiryChips(overview({ expired: 2, within30: 0, within60: 1, within90: 3 }));
    expect(chips).toEqual([
      { count: 2, label: "verlopen", tone: "danger" },
      { count: 1, label: "31–60 dagen", tone: "muted" },
      { count: 3, label: "61–90 dagen", tone: "muted" },
    ]);
  });

  it("geeft een lege lijst als alle buckets 0 zijn", () => {
    expect(expiryChips(overview({}))).toEqual([]);
  });
});

describe("expiryRemaining", () => {
  it("0 wanneer alles inline past", () => {
    const items = [item("a", 1), item("b", 2)];
    expect(expiryRemaining(overview({ total: 2, items }))).toBe(0);
  });

  it("telt wat ná de eerste vijf rest", () => {
    const items = Array.from({ length: 7 }, (_, i) => item(String(i), i));
    expect(expiryRemaining(overview({ total: 7, items }))).toBe(7 - EXPIRY_CARD_MAX_LISTED);
  });

  it("nooit negatief", () => {
    expect(expiryRemaining(overview({ total: 0, items: [] }))).toBe(0);
  });
});

describe("expiryCardHidden", () => {
  it("verbergt bij niets binnen de horizon", () => {
    expect(expiryCardHidden(overview({ total: 0 }))).toBe(true);
  });
  it("toont zodra er iets is", () => {
    expect(expiryCardHidden(overview({ total: 1, items: [item("a", 3)] }))).toBe(false);
  });
});
