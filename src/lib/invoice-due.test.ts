import { describe, expect, it } from "vitest";
import { INVOICE_DUE_SOON_DAYS, invoiceDueStatus } from "@/lib/invoice-due";

const now = new Date("2026-06-19T12:00:00Z");

function inDays(n: number): Date {
  return new Date(now.getTime() + n * 24 * 60 * 60 * 1000);
}

describe("invoiceDueStatus", () => {
  it("geeft null voor een niet-openstaande factuur", () => {
    expect(invoiceDueStatus({ dueAt: inDays(3), outstanding: false }, now)).toBeNull();
  });

  it("geeft null wanneer er geen vervaldatum is", () => {
    expect(invoiceDueStatus({ dueAt: null, outstanding: true }, now)).toBeNull();
  });

  it("telt te laat: hele dagen ná de vervaldag (danger)", () => {
    const res = invoiceDueStatus({ dueAt: inDays(-3), outstanding: true }, now);
    expect(res).toEqual({
      tense: "overdue",
      days: 3,
      label: "3 dagen te laat",
      variant: "danger",
    });
  });

  it("enkelvoud bij 1 dag te laat", () => {
    const res = invoiceDueStatus({ dueAt: inDays(-1), outstanding: true }, now);
    expect(res?.label).toBe("1 dag te laat");
    expect(res?.variant).toBe("danger");
  });

  it("net over de vervaldag (binnen 24u) toont 'Vervaldag verstreken'", () => {
    const due = new Date(now.getTime() - 60 * 60 * 1000); // 1 uur geleden
    const res = invoiceDueStatus({ dueAt: due, outstanding: true }, now);
    expect(res).toEqual({
      tense: "overdue",
      days: 0,
      label: "Vervaldag verstreken",
      variant: "danger",
    });
  });

  it("vervalt binnen 24u: 'Vervalt vandaag' (warning)", () => {
    const due = new Date(now.getTime() + 60 * 60 * 1000); // over 1 uur
    const res = invoiceDueStatus({ dueAt: due, outstanding: true }, now);
    expect(res).toEqual({
      tense: "today",
      days: 0,
      label: "Vervalt vandaag",
      variant: "warning",
    });
  });

  it("binnenkort verschuldigd (<= drempel) is warning", () => {
    const res = invoiceDueStatus({ dueAt: inDays(INVOICE_DUE_SOON_DAYS), outstanding: true }, now);
    expect(res?.tense).toBe("upcoming");
    expect(res?.days).toBe(INVOICE_DUE_SOON_DAYS);
    expect(res?.variant).toBe("warning");
    expect(res?.label).toBe(`Vervalt over ${INVOICE_DUE_SOON_DAYS} dagen`);
  });

  it("ver weg (> drempel) is muted", () => {
    const res = invoiceDueStatus(
      { dueAt: inDays(INVOICE_DUE_SOON_DAYS + 14), outstanding: true },
      now,
    );
    expect(res?.tense).toBe("upcoming");
    expect(res?.variant).toBe("muted");
  });

  it("enkelvoud bij 'Vervalt over 1 dag'", () => {
    const res = invoiceDueStatus({ dueAt: inDays(1), outstanding: true }, now);
    expect(res?.label).toBe("Vervalt over 1 dag");
    expect(res?.variant).toBe("warning");
  });
});
