import { describe, expect, it } from "vitest";

import { paymentDueSoonWhere, PAYMENT_DUE_SOON_WINDOW_DAYS } from "./payment-due-soon";

describe("paymentDueSoonWhere — scoping", () => {
  const now = new Date("2026-07-19T12:00:00.000Z");

  it("scopet op de opdrachtgever, niet in dispuut", () => {
    const where = paymentDueSoonWhere("client-1", now);
    expect(where.collaboration).toMatchObject({
      company: { userId: "client-1" },
      disputedAt: null,
    });
  });

  it("alleen legacy/handmatige facturen (geen cascade) waar de payer echt kan afrekenen", () => {
    // Cascade-facturen dragen een lifecycleStatus en worden door de ZZP'er betaald-gemarkeerd — een
    // pre-due nudge daarop zou een dode actie zijn. Alleen `lifecycleStatus: null` + `status: SENT`.
    const where = paymentDueSoonWhere("client-1", now);
    expect(where.lifecycleStatus).toBeNull();
    expect(where.status).toBe("SENT");
  });

  it("kijkt vooruit: dueAt tussen nu en nu + het venster (nog niet te laat)", () => {
    const where = paymentDueSoonWhere("client-1", now);
    const due = where.dueAt as { gte: Date; lte: Date };
    // `gte: now` sluit al-verstreken facturen uit — die dekt de post-due roll-up al, zodat één
    // factuur nooit beide nudges voedt.
    expect(due.gte).toEqual(now);
    const expectedEnd = new Date(now.getTime() + PAYMENT_DUE_SOON_WINDOW_DAYS * 86_400_000);
    expect(due.lte).toEqual(expectedEnd);
  });

  it("venster is instelbaar", () => {
    const where = paymentDueSoonWhere("client-1", now, 3);
    const due = where.dueAt as { gte: Date; lte: Date };
    expect(due.lte).toEqual(new Date(now.getTime() + 3 * 86_400_000));
  });

  it("standaardvenster is 7 dagen", () => {
    expect(PAYMENT_DUE_SOON_WINDOW_DAYS).toBe(7);
  });
});
