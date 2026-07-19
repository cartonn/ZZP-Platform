import { beforeEach, describe, expect, it, vi } from "vitest";

// Vangt de `where` waarmee prisma.invoice.count wordt aangeroepen, zodat we de scoping van
// paymentDueSoonCount kunnen asserten (payer-scope + legacy-only + vooruitkijkend venster) zonder
// echte DB.
type CountArgs = { where: Record<string, unknown> };
const countMock = vi.fn((_args: CountArgs): Promise<number> => Promise.resolve(3));
vi.mock("@/lib/db", () => ({
  prisma: { invoice: { count: (args: CountArgs) => countMock(args) } },
}));

import { paymentDueSoonCount } from "./signals";
import { PAYMENT_DUE_SOON_WINDOW_DAYS } from "./payment-due-soon";

describe("paymentDueSoonCount — scoping", () => {
  beforeEach(() => countMock.mockClear());

  it("telt via paymentDueSoonWhere: payer-scope, geen dispuut, legacy SENT, vooruit binnen venster", async () => {
    const now = new Date("2026-07-19T12:00:00.000Z");
    const result = await paymentDueSoonCount("client-9", now);
    expect(result).toBe(3);
    const where = countMock.mock.calls[0]![0].where;
    expect(where).toMatchObject({
      collaboration: { company: { userId: "client-9" }, disputedAt: null },
      lifecycleStatus: null,
      status: "SENT",
    });
    const due = where.dueAt as { gte: Date; lte: Date };
    // Vooruitkijkend: nog niet te laat (gte now) en binnen het venster — raakt de post-due
    // roll-up (dueAt < now) niet, dus geen dubbele next-action.
    expect(due.gte).toEqual(now);
    expect(due.lte).toEqual(new Date(now.getTime() + PAYMENT_DUE_SOON_WINDOW_DAYS * 86_400_000));
  });
});
