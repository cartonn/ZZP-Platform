import { describe, it, expect } from "vitest";
import {
  clientOutstandingByCompany,
  poolOutstandingTotals,
  poolOverdueAging,
  type ClientOutstandingInvoice,
} from "@/lib/franchise/client-outstanding";

// Vast referentiemoment; alle vervaldatums worden hier relatief tegen afgezet.
const NOW = new Date("2026-08-21T12:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86400000);
const daysAhead = (n: number) => new Date(NOW.getTime() + n * 86400000);

describe("clientOutstandingByCompany", () => {
  it("groepeert openstaande bedragen per opdrachtgever", () => {
    const invoices: ClientOutstandingInvoice[] = [
      { companyId: "a", amountCents: 100_00, dueAt: daysAhead(5) },
      { companyId: "a", amountCents: 250_00, dueAt: daysAgo(10) },
      { companyId: "b", amountCents: 400_00, dueAt: daysAhead(3) },
    ];
    const map = clientOutstandingByCompany(invoices, NOW);

    expect(map.get("a")?.totalOpenCents).toBe(350_00);
    expect(map.get("b")?.totalOpenCents).toBe(400_00);
    expect(map.size).toBe(2);
  });

  it("telt alleen vervallen posten als te laat en kiest de zwaarste bucket", () => {
    const invoices: ClientOutstandingInvoice[] = [
      { companyId: "a", amountCents: 100_00, dueAt: daysAhead(5) }, // niet vervallen
      { companyId: "a", amountCents: 200_00, dueAt: daysAgo(20) }, // 1–30 dagen te laat
      { companyId: "a", amountCents: 300_00, dueAt: daysAgo(95) }, // 90+ dagen te laat
    ];
    const client = clientOutstandingByCompany(invoices, NOW).get("a");

    expect(client?.overdueCents).toBe(500_00);
    expect(client?.overdueCount).toBe(2);
    expect(client?.worstBucket).toBe("d90plus");
  });

  it("behandelt een ontbrekende vervaldatum als niet-vervallen", () => {
    const client = clientOutstandingByCompany(
      [{ companyId: "a", amountCents: 500_00, dueAt: null }],
      NOW,
    ).get("a");

    expect(client?.totalOpenCents).toBe(500_00);
    expect(client?.overdueCents).toBe(0);
    expect(client?.overdueCount).toBe(0);
    expect(client?.worstBucket).toBe("notDue");
  });

  it("levert een lege map voor geen facturen", () => {
    expect(clientOutstandingByCompany([], NOW).size).toBe(0);
  });
});

describe("poolOutstandingTotals", () => {
  it("aggregeert de per-opdrachtgever-map naar pool-totalen", () => {
    const invoices: ClientOutstandingInvoice[] = [
      { companyId: "a", amountCents: 100_00, dueAt: daysAhead(5) },
      { companyId: "a", amountCents: 200_00, dueAt: daysAgo(20) },
      { companyId: "b", amountCents: 400_00, dueAt: daysAgo(40) },
      { companyId: "c", amountCents: 50_00, dueAt: daysAhead(2) }, // niets te laat
    ];
    const totals = poolOutstandingTotals(clientOutstandingByCompany(invoices, NOW));

    expect(totals.totalOpenCents).toBe(750_00);
    expect(totals.overdueCents).toBe(600_00);
    expect(totals.overdueCount).toBe(2);
    expect(totals.clientsOverdue).toBe(2); // a en b, niet c
  });

  it("levert nul-totalen voor een lege map", () => {
    const totals = poolOutstandingTotals(new Map());
    expect(totals).toEqual({
      totalOpenCents: 0,
      overdueCents: 0,
      overdueCount: 0,
      clientsOverdue: 0,
    });
  });
});

describe("poolOverdueAging", () => {
  it("somt het te late geld pool-breed per bucket op, oplopend in ouderdom", () => {
    const invoices: ClientOutstandingInvoice[] = [
      { companyId: "a", amountCents: 200_00, dueAt: daysAgo(10) }, // 1–30
      { companyId: "b", amountCents: 100_00, dueAt: daysAgo(20) }, // 1–30 (zelfde bucket, andere klant)
      { companyId: "a", amountCents: 300_00, dueAt: daysAgo(45) }, // 31–60
      { companyId: "c", amountCents: 400_00, dueAt: daysAgo(95) }, // 90+
    ];
    const buckets = poolOverdueAging(invoices, NOW);

    expect(buckets.map((b) => b.key)).toEqual(["d0_30", "d31_60", "d90plus"]);
    expect(buckets.map((b) => b.totalCents)).toEqual([300_00, 300_00, 400_00]);
    expect(buckets.find((b) => b.key === "d0_30")?.count).toBe(2);
  });

  it("laat niet-vervallen posten volledig buiten de uitsplitsing", () => {
    const invoices: ClientOutstandingInvoice[] = [
      { companyId: "a", amountCents: 500_00, dueAt: daysAhead(5) },
      { companyId: "b", amountCents: 250_00, dueAt: null },
    ];
    expect(poolOverdueAging(invoices, NOW)).toEqual([]);
  });

  it("laat lege buckets weg (alleen buckets met een bedrag > 0)", () => {
    const buckets = poolOverdueAging(
      [{ companyId: "a", amountCents: 150_00, dueAt: daysAgo(75) }], // 61–90
      NOW,
    );
    expect(buckets.map((b) => b.key)).toEqual(["d61_90"]);
    expect(buckets[0]?.totalCents).toBe(150_00);
  });

  it("levert een lege lijst voor geen facturen", () => {
    expect(poolOverdueAging([], NOW)).toEqual([]);
  });
});
