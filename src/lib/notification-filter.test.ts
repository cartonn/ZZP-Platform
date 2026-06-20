import { describe, expect, it } from "vitest";
import {
  filterNotifications,
  notificationFilterParams,
  parseNotificationFilter,
  summarizeNotifications,
  unreadInScope,
  type FilterableNotification,
} from "@/lib/notification-filter";

const N = (type: string, read: boolean): FilterableNotification => ({
  type,
  readAt: read ? new Date("2026-06-01T10:00:00Z") : null,
});

// 2× invoice (1 ongelezen), 1× payment (ongelezen), 1× workflow (gelezen), 1× onbekend → system (ongelezen)
const items: FilterableNotification[] = [
  N("INVOICE_SUBMITTED", false),
  N("INVOICE_APPROVED", true),
  N("PAYMENT_OVERDUE", false),
  N("CONTRACT_SIGNED", true),
  N("IETS_NIEUWS", false),
];

describe("parseNotificationFilter", () => {
  it("leest geldige categorie + ongelezen-status", () => {
    expect(parseNotificationFilter({ categorie: "invoice", status: "ongelezen" })).toEqual({
      category: "invoice",
      unreadOnly: true,
    });
  });

  it("valt terug op geen filter bij ontbrekende of ongeldige waarden", () => {
    expect(parseNotificationFilter({})).toEqual({ category: null, unreadOnly: false });
    expect(parseNotificationFilter({ categorie: "bestaat-niet", status: "alles" })).toEqual({
      category: null,
      unreadOnly: false,
    });
  });

  it("neemt de eerste waarde bij een array-param", () => {
    expect(parseNotificationFilter({ categorie: ["payment", "invoice"] }).category).toBe("payment");
  });
});

describe("filterNotifications", () => {
  it("zonder filter: alles, in de invoervolgorde", () => {
    const out = filterNotifications(items, { category: null, unreadOnly: false });
    expect(out).toHaveLength(5);
    expect(out[0]?.type).toBe("INVOICE_SUBMITTED");
  });

  it("filtert op categorie (incl. fallback naar system voor onbekend type)", () => {
    expect(
      filterNotifications(items, { category: "invoice", unreadOnly: false }).map((n) => n.type),
    ).toEqual(["INVOICE_SUBMITTED", "INVOICE_APPROVED"]);
    expect(
      filterNotifications(items, { category: "system", unreadOnly: false }).map((n) => n.type),
    ).toEqual(["IETS_NIEUWS"]);
  });

  it("filtert op alleen-ongelezen", () => {
    expect(
      filterNotifications(items, { category: null, unreadOnly: true }).map((n) => n.type),
    ).toEqual(["INVOICE_SUBMITTED", "PAYMENT_OVERDUE", "IETS_NIEUWS"]);
  });

  it("combineert categorie + ongelezen", () => {
    expect(
      filterNotifications(items, { category: "invoice", unreadOnly: true }).map((n) => n.type),
    ).toEqual(["INVOICE_SUBMITTED"]);
  });

  it("muteert de invoer niet", () => {
    const copy = [...items];
    filterNotifications(items, { category: "invoice", unreadOnly: true });
    expect(items).toEqual(copy);
  });
});

describe("summarizeNotifications", () => {
  it("telt totaal/ongelezen en per aanwezige categorie in canonieke volgorde", () => {
    const s = summarizeNotifications(items);
    expect(s.total).toBe(5);
    expect(s.unread).toBe(3);
    // canonieke volgorde: workflow < invoice < payment < system
    expect(s.categories.map((c) => c.category)).toEqual([
      "workflow",
      "invoice",
      "payment",
      "system",
    ]);
    const invoice = s.categories.find((c) => c.category === "invoice");
    expect(invoice).toMatchObject({ label: "Facturen", total: 2, unread: 1 });
  });

  it("lege invoer geeft geen categorieën", () => {
    expect(summarizeNotifications([])).toEqual({ total: 0, unread: 0, categories: [] });
  });
});

describe("unreadInScope", () => {
  const summary = summarizeNotifications(items);
  it("geeft het globale ongelezen-aantal zonder categorie", () => {
    expect(unreadInScope(summary, { category: null, unreadOnly: false })).toBe(3);
  });
  it("geeft het categorie-ongelezen-aantal mét categorie", () => {
    expect(unreadInScope(summary, { category: "invoice", unreadOnly: false })).toBe(1);
  });
  it("geeft 0 voor een afwezige categorie", () => {
    expect(unreadInScope(summary, { category: "dispute", unreadOnly: false })).toBe(0);
  });
});

describe("notificationFilterParams", () => {
  it("laat standaardwaarden weg", () => {
    expect(notificationFilterParams({ category: null, unreadOnly: false })).toEqual({});
  });
  it("zet categorie en status apart en samen", () => {
    expect(notificationFilterParams({ category: "payment", unreadOnly: false })).toEqual({
      categorie: "payment",
    });
    expect(notificationFilterParams({ category: null, unreadOnly: true })).toEqual({
      status: "ongelezen",
    });
    expect(notificationFilterParams({ category: "payment", unreadOnly: true })).toEqual({
      categorie: "payment",
      status: "ongelezen",
    });
  });
});
