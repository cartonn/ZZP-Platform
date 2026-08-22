import { describe, it, expect } from "vitest";
import {
  buildPayoutForecastMap,
  effectivePayoutDate,
  forecastForOpenInvoice,
  type OpenInvoiceForForecast,
  type PaidInvoiceForForecast,
} from "./payout-forecast";

const DAY = 86_400_000;
const d = (iso: string) => new Date(iso);

/** Bouwt `n` betaalde facturen die gemiddeld `avgDays` na de factuurdatum zijn betaald. */
function paidHistory(companyId: string, n: number, avgDays: number): PaidInvoiceForForecast[] {
  return Array.from({ length: n }, (_, i) => {
    const issuedAt = d(`2026-01-${String(i + 1).padStart(2, "0")}T00:00:00Z`);
    return {
      companyId,
      issuedAt,
      dueAt: new Date(issuedAt.getTime() + 14 * DAY),
      paidAt: new Date(issuedAt.getTime() + avgDays * DAY),
    };
  });
}

describe("buildPayoutForecastMap", () => {
  it("neemt een betrouwbare forecast op die later valt dan de vervaldag (trage betaler)", () => {
    const issuedAt = d("2026-06-01T00:00:00Z");
    const open: OpenInvoiceForForecast[] = [
      { id: "inv1", companyId: "c1", issuedAt, dueAt: new Date(issuedAt.getTime() + 14 * DAY) },
    ];
    // Gemiddeld 40 dagen betaaltermijn → verwacht rond issued+40, ver na de vervaldag (issued+14).
    const map = buildPayoutForecastMap(open, paidHistory("c1", 5, 40));
    const forecast = map.get("inv1");
    expect(forecast).toBeDefined();
    expect(forecast!.confident).toBe(true);
    expect(forecast!.expectedAt.getTime()).toBe(issuedAt.getTime() + 40 * DAY);
    expect(forecast!.daysAfterDue).toBe(26);
  });

  it("neemt GEEN forecast op wanneer de opdrachtgever gemiddeld vóór de vervaldag betaalt (snelle betaler)", () => {
    const issuedAt = d("2026-06-01T00:00:00Z");
    const open: OpenInvoiceForForecast[] = [
      { id: "inv1", companyId: "c1", issuedAt, dueAt: new Date(issuedAt.getTime() + 30 * DAY) },
    ];
    // Gemiddeld 5 dagen → verwacht rond issued+5, ruim vóór de vervaldag (issued+30). Geen correctie.
    const map = buildPayoutForecastMap(open, paidHistory("c1", 5, 5));
    expect(map.has("inv1")).toBe(false);
  });

  it("neemt GEEN forecast op bij onvoldoende betaalhistorie (niet-betrouwbaar)", () => {
    const issuedAt = d("2026-06-01T00:00:00Z");
    const open: OpenInvoiceForForecast[] = [
      { id: "inv1", companyId: "c1", issuedAt, dueAt: new Date(issuedAt.getTime() + 14 * DAY) },
    ];
    // Slechts 2 betaalde facturen → onder PAYMENT_MIN_SAMPLE_SIZE → behavior unknown.
    const map = buildPayoutForecastMap(open, paidHistory("c1", 2, 40));
    expect(map.has("inv1")).toBe(false);
  });

  it("slaat een openstaande factuur zonder opdrachtgever over", () => {
    const issuedAt = d("2026-06-01T00:00:00Z");
    const open: OpenInvoiceForForecast[] = [
      { id: "inv1", companyId: null, issuedAt, dueAt: new Date(issuedAt.getTime() + 14 * DAY) },
    ];
    const map = buildPayoutForecastMap(open, paidHistory("c1", 5, 40));
    expect(map.has("inv1")).toBe(false);
  });

  it("negeert betaalde rijen zonder opdrachtgever bij het afleiden van betaalgedrag", () => {
    const issuedAt = d("2026-06-01T00:00:00Z");
    const open: OpenInvoiceForForecast[] = [
      { id: "inv1", companyId: "c1", issuedAt, dueAt: new Date(issuedAt.getTime() + 14 * DAY) },
    ];
    const paid: PaidInvoiceForForecast[] = [
      ...paidHistory("c1", 5, 40),
      { companyId: null, issuedAt, dueAt: null, paidAt: new Date(issuedAt.getTime() + 999 * DAY) },
    ];
    const map = buildPayoutForecastMap(open, paid);
    // De null-company-rij mag het gemiddelde van c1 niet vervuilen.
    expect(map.get("inv1")!.expectedAt.getTime()).toBe(issuedAt.getTime() + 40 * DAY);
  });

  it("berekent betaalgedrag per opdrachtgever los van elkaar", () => {
    const issuedAt = d("2026-06-01T00:00:00Z");
    const open: OpenInvoiceForForecast[] = [
      { id: "slow", companyId: "c1", issuedAt, dueAt: new Date(issuedAt.getTime() + 14 * DAY) },
      { id: "fast", companyId: "c2", issuedAt, dueAt: new Date(issuedAt.getTime() + 14 * DAY) },
    ];
    const paid = [...paidHistory("c1", 5, 40), ...paidHistory("c2", 5, 3)];
    const map = buildPayoutForecastMap(open, paid);
    expect(map.has("slow")).toBe(true); // c1 traag → later dan vervaldag
    expect(map.has("fast")).toBe(false); // c2 snel → geen correctie
  });
});

describe("effectivePayoutDate", () => {
  it("geeft de forecast-datum wanneer aanwezig", () => {
    const issuedAt = d("2026-06-01T00:00:00Z");
    const open: OpenInvoiceForForecast[] = [
      { id: "inv1", companyId: "c1", issuedAt, dueAt: new Date(issuedAt.getTime() + 14 * DAY) },
    ];
    const map = buildPayoutForecastMap(open, paidHistory("c1", 5, 40));
    const eff = effectivePayoutDate("inv1", new Date(issuedAt.getTime() + 14 * DAY), map);
    expect(eff!.getTime()).toBe(issuedAt.getTime() + 40 * DAY);
  });

  it("valt terug op de vervaldatum zonder forecast", () => {
    const due = d("2026-06-15T00:00:00Z");
    const eff = effectivePayoutDate("unknown", due, new Map());
    expect(eff).toBe(due);
  });

  it("geeft null wanneer er noch forecast noch vervaldatum is", () => {
    expect(effectivePayoutDate("unknown", null, new Map())).toBeNull();
  });
});

describe("forecastForOpenInvoice", () => {
  const issuedAt = d("2026-06-01T00:00:00Z");
  const open: OpenInvoiceForForecast = {
    id: "inv1",
    companyId: "c1",
    issuedAt,
    dueAt: new Date(issuedAt.getTime() + 14 * DAY),
  };

  it("geeft de betrouwbare forecast bij een trage betaler (later dan de vervaldag)", () => {
    const forecast = forecastForOpenInvoice(open, paidHistory("c1", 5, 40));
    expect(forecast).not.toBeNull();
    expect(forecast!.confident).toBe(true);
    expect(forecast!.expectedAt.getTime()).toBe(issuedAt.getTime() + 40 * DAY);
    expect(forecast!.daysAfterDue).toBe(26);
  });

  it("geeft null bij een snelle betaler (verwacht niet vóór de vervaldag tonen)", () => {
    expect(forecastForOpenInvoice(open, paidHistory("c1", 5, 3))).toBeNull();
  });

  it("geeft null bij onvoldoende historie (< drempel)", () => {
    expect(forecastForOpenInvoice(open, paidHistory("c1", 2, 40))).toBeNull();
  });

  it("negeert betaalhistorie van een andere opdrachtgever", () => {
    expect(forecastForOpenInvoice(open, paidHistory("c2", 5, 40))).toBeNull();
  });
});
