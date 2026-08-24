import { describe, it, expect } from "vitest";
import {
  summarizeDormantClients,
  DORMANT_CLIENT_DAYS,
  type DormantClientInput,
} from "@/lib/dormant-clients";

const NOW = new Date("2026-08-24T12:00:00.000Z");

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 86_400_000);
}

function client(over: Partial<DormantClientInput>): DormantClientInput {
  return {
    companyId: "c1",
    name: "Zorgcentrum De Linde",
    paidCents: 500_00,
    sharePct: 40,
    lastCompletedAt: daysAgo(120),
    hasActiveCollaboration: false,
    ...over,
  };
}

describe("summarizeDormantClients", () => {
  it("markeert een klant zonder lopende samenwerking en oude afronding als slapend", () => {
    const out = summarizeDormantClients([client({})], NOW);
    expect(out.dormantCount).toBe(1);
    expect(out.rows[0].daysSince).toBe(120);
    expect(out.rows[0].monthsSince).toBe(4);
    expect(out.dormantPaidCents).toBe(500_00);
  });

  it("sluit een klant met een lopende (PROPOSED/ACTIVE) samenwerking uit", () => {
    const out = summarizeDormantClients([client({ hasActiveCollaboration: true })], NOW);
    expect(out.dormantCount).toBe(0);
    expect(out.dormantPaidCents).toBe(0);
  });

  it("sluit een klant zonder afgeronde historie (lastCompletedAt null) uit", () => {
    const out = summarizeDormantClients([client({ lastCompletedAt: null })], NOW);
    expect(out.dormantCount).toBe(0);
  });

  it("sluit een klant uit die recenter dan de drempel afrondde", () => {
    const recent = summarizeDormantClients(
      [client({ lastCompletedAt: daysAgo(DORMANT_CLIENT_DAYS - 1) })],
      NOW,
    );
    expect(recent.dormantCount).toBe(0);
    // Exact op de drempel telt wél als slapend.
    const onThreshold = summarizeDormantClients(
      [client({ lastCompletedAt: daysAgo(DORMANT_CLIENT_DAYS) })],
      NOW,
    );
    expect(onThreshold.dormantCount).toBe(1);
  });

  it("sorteert op betaalde omzet aflopend, dan op leeftijd aflopend", () => {
    const out = summarizeDormantClients(
      [
        client({ companyId: "a", paidCents: 100_00, lastCompletedAt: daysAgo(200) }),
        client({ companyId: "b", paidCents: 900_00, lastCompletedAt: daysAgo(100) }),
        client({ companyId: "c", paidCents: 100_00, lastCompletedAt: daysAgo(300) }),
      ],
      NOW,
    );
    expect(out.rows.map((r) => r.companyId)).toEqual(["b", "c", "a"]);
    expect(out.dormantPaidCents).toBe(1_100_00);
  });

  it("klemt monthsSince op minimaal 1 en negeert een afronding in de toekomst", () => {
    const justOver = summarizeDormantClients(
      [client({ lastCompletedAt: daysAgo(DORMANT_CLIENT_DAYS) })],
      NOW,
    );
    expect(justOver.rows[0].monthsSince).toBe(Math.max(1, Math.floor(DORMANT_CLIENT_DAYS / 30)));

    const future = summarizeDormantClients([client({ lastCompletedAt: daysAgo(-5) })], NOW);
    expect(future.dormantCount).toBe(0);
  });

  it("geeft een lege samenvatting bij geen input", () => {
    const out = summarizeDormantClients([], NOW);
    expect(out).toEqual({ rows: [], dormantCount: 0, dormantPaidCents: 0 });
  });
});
