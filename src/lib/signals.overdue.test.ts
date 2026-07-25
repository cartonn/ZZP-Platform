import { beforeEach, describe, expect, it, vi } from "vitest";

// Vangt de `where` waarmee prisma.invoice.count wordt aangeroepen, zodat we de scoping van
// overdueInvoiceCount kunnen asserten (disputed-uitsluiting + partij-scope) zonder echte DB.
type CountArgs = { where: { collaboration: Record<string, unknown>; OR: unknown[] } };
const countMock = vi.fn((_args: CountArgs): Promise<number> => Promise.resolve(0));
vi.mock("@/lib/db", () => ({
  prisma: { invoice: { count: (args: CountArgs) => countMock(args) } },
}));

import { overdueInvoiceBreakdown, overdueInvoiceCount } from "./signals";

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
    // Cascade-facturen tellen alléén via lifecycleStatus=OVERDUE mee; het legacy status-veld geldt
    // uitsluitend voor facturen zonder lifecycle (lifecycleStatus=null). Zo kan een APPROVED
    // cascade-factuur (die als specifieke betaal-taak verschijnt) niet ook nog eens via het legacy
    // status-veld in de generieke overdue-roll-up belanden → geen dubbele next-action.
    expect(where.OR).toEqual([
      { lifecycleStatus: "OVERDUE" },
      { lifecycleStatus: null, status: "OVERDUE" },
      { lifecycleStatus: null, status: "SENT", dueAt: { lt: expect.any(Date) } },
    ]);
  });

  it("een APPROVED cascade-factuur met een legacy status=SENT-restant wordt NIET dubbel geteld", async () => {
    // Regressietest voor de dubbele next-action: vóór de fix telde de OR-tak `{status:'SENT', dueAt<now}`
    // een cascade-factuur mee die tegelijk lifecycleStatus=APPROVED had — die verschijnt al als
    // specifieke betaal-taak (pending-tasks APPROVED-tak) zonder `surfacedOverdue` te verhogen, dus
    // de roll-up telde 'm er nóg eens bij. De query mag zo'n factuur niet matchen: de SENT/legacy-tak
    // is nu geclausuleerd op lifecycleStatus=null.
    await overdueInvoiceCount("FREELANCER", "fr-1");
    const where = countMock.mock.calls[0]![0].where;
    for (const clause of where.OR as Array<Record<string, unknown>>) {
      // Elke tak die op het legacy status-veld leunt, moet lifecycleStatus=null eisen.
      if ("status" in clause) {
        expect(clause).toMatchObject({ lifecycleStatus: null });
      }
    }
    // De enige tak die cascade-facturen matcht, keyt op lifecycleStatus=OVERDUE (niet APPROVED).
    const cascadeClauses = (where.OR as Array<Record<string, unknown>>).filter(
      (c) => !("status" in c),
    );
    expect(cascadeClauses).toEqual([{ lifecycleStatus: "OVERDUE" }]);
  });

  it("CLIENT: gescoopt op eigen bedrijf én disputen uitgesloten", async () => {
    await overdueInvoiceCount("CLIENT", "cl-1");
    const where = countMock.mock.calls[0]![0].where;
    expect(where.collaboration).toMatchObject({
      company: { userId: "cl-1" },
      disputedAt: null,
    });
  });

  it("CLIENT: cascade-facturen (lifecycleStatus=OVERDUE) tellen NIET mee — geen dode 'Markeer als betaald'", async () => {
    // Regressietest: in de cascade registreert de ZZP'er de betaling (stage.ts stap 6,
    // `youAreUp:isFreelancer`); de opdrachtgever staat op "Wacht op betalingsbevestiging"
    // (`youAreUp:false`) en heeft nergens een "Markeer als betaald"-knop (`canPay = !cascade`).
    // Vóór de fix telde de CLIENT-roll-up de `{ lifecycleStatus: "OVERDUE" }`-tak wél mee → de
    // opdrachtgever kreeg een niet-verdwijnende "Markeer als betaald"-next-action die de cascade-fase
    // tegensprak en naar een knop wees die voor cascade-facturen niet bestaat.
    await overdueInvoiceCount("CLIENT", "cl-1");
    const where = countMock.mock.calls[0]![0].where;
    // De opdrachtgever telt uitsluitend legacy-/handmatige facturen (lifecycleStatus=null), waar hij
    // wél kan afrekenen. Geen enkele tak mag een cascade-factuur (lifecycleStatus=OVERDUE) matchen.
    expect(where.OR).toEqual([
      { lifecycleStatus: null, status: "OVERDUE" },
      { lifecycleStatus: null, status: "SENT", dueAt: { lt: expect.any(Date) } },
    ]);
    for (const clause of where.OR as Array<Record<string, unknown>>) {
      expect(clause).toMatchObject({ lifecycleStatus: null });
    }
  });
});

describe("overdueInvoiceBreakdown — legacy vs cascade splitsing (ZZP'er)", () => {
  beforeEach(() => countMock.mockReset());

  it("splitst in twee gescoopte count-queries en retourneert {legacy, cascade}", async () => {
    // De queries lopen via Promise.all in vaste volgorde [legacy, cascade]; de resultaatvolgorde blijft
    // behouden ongeacht welke count eerder resolvet.
    countMock.mockResolvedValueOnce(3).mockResolvedValueOnce(7);

    const result = await overdueInvoiceBreakdown("fr-1");
    expect(result).toEqual({ legacy: 3, cascade: 7 });
    expect(countMock).toHaveBeenCalledTimes(2);
  });

  it("beide takken zijn gescoopt op eigen samenwerkingen én disputen uitgesloten", async () => {
    await overdueInvoiceBreakdown("fr-1");
    for (const call of countMock.mock.calls) {
      expect(call[0].where.collaboration).toMatchObject({
        freelancer: { userId: "fr-1" },
        disputedAt: null,
      });
    }
    // Precies één legacy-tak (OR met alleen lifecycleStatus=null) en één cascade-tak (lifecycleStatus=OVERDUE).
    const legacy = countMock.mock.calls.find((c) => Array.isArray(c[0].where.OR))![0].where;
    expect(legacy.OR).toEqual([
      { lifecycleStatus: null, status: "OVERDUE" },
      { lifecycleStatus: null, status: "SENT", dueAt: { lt: expect.any(Date) } },
    ]);
    const cascade = countMock.mock.calls.find((c) => !Array.isArray(c[0].where.OR))![0]
      .where as Record<string, unknown>;
    expect(cascade.lifecycleStatus).toBe("OVERDUE");
  });
});
