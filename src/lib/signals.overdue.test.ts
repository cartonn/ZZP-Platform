import { beforeEach, describe, expect, it, vi } from "vitest";

// Vangt de `where` waarmee prisma.invoice.count wordt aangeroepen, zodat we de scoping van
// overdueInvoiceCount kunnen asserten (disputed-uitsluiting + partij-scope) zonder echte DB.
type CountArgs = { where: { collaboration: Record<string, unknown>; OR: unknown[] } };
const countMock = vi.fn((_args: CountArgs): Promise<number> => Promise.resolve(0));
vi.mock("@/lib/db", () => ({
  prisma: { invoice: { count: (args: CountArgs) => countMock(args) } },
}));

import { overdueInvoiceCount } from "./signals";

describe("overdueInvoiceCount — scoping", () => {
  beforeEach(() => countMock.mockClear());

  it("ADMIN/FRANCHISER tellen nooit mee (0, geen query)", async () => {
    expect(await overdueInvoiceCount("ADMIN", "u1")).toBe(0);
    expect(await overdueInvoiceCount("FRANCHISER", "u1")).toBe(0);
    expect(countMock).not.toHaveBeenCalled();
  });

  it("FREELANCER: gescoopt op eigen samenwerkingen én disputen uitgesloten", async () => {
    await overdueInvoiceCount("FREELANCER", "fr-1");
    const where = countMock.mock.calls[0]![0].where;
    // Bevroren (disputed) samenwerkingen tellen niet mee — anders spreekt de generieke roll-up de
    // "Dispuut — werkproces bevroren"-fase tegen en faalt de knop server-side (assertNotDisputed).
    expect(where.collaboration).toMatchObject({
      freelancer: { userId: "fr-1" },
      disputedAt: null,
    });
    expect(where.OR).toEqual([
      { status: "OVERDUE" },
      { status: "SENT", dueAt: { lt: expect.any(Date) } },
    ]);
  });

  it("CLIENT: gescoopt op eigen bedrijf én disputen uitgesloten", async () => {
    await overdueInvoiceCount("CLIENT", "cl-1");
    const where = countMock.mock.calls[0]![0].where;
    expect(where.collaboration).toMatchObject({
      company: { userId: "cl-1" },
      disputedAt: null,
    });
  });
});
