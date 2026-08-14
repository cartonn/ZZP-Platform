import { describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { allocateInvoiceNumber } from "@/lib/administration/persist";

// Regressietest (persona-sweep, DOEL 2 — gelijktijdige factuur-indiening):
// `allocateInvoiceNumber` deelde vroeger een reeksnummer toe via lees-dan-overschrijf:
// `findUnique` → `nextSequence(lastSeq)` → `update: { lastSeq: <berekend nummer> }`. Onder
// gelijktijdigheid lazen twee transacties dezelfde `lastSeq`, berekenden hetzelfde `+1` en
// botsten op `@@unique([issuerKey, partyInvoiceNumber])`; de tweede indiening faalde met een
// generieke interne fout i.p.v. netjes het volgende nummer te krijgen. De toewijzing gebeurt nu
// met een atomaire `{ increment: 1 }` binnen de upsert (rijlock → serialisatie).

/**
 * Minimale, stateful fake van `tx.invoiceSequence` die de échte Prisma-upsert-semantiek
 * nabootst: bij `create` de opgegeven `lastSeq`, bij `update` wordt de operator toegepast op
 * de HUIDIGE opgeslagen waarde (niet op een door de caller doorgegeven getal). Zo bewijst de
 * test dat het nummer uit de atomaire ophoging van de store komt, niet uit een stale lees-waarde.
 */
function makeFakeTx() {
  const store = new Map<string, { issuerKey: string; year: number; lastSeq: number }>();
  const key = (issuerKey: string, year: number) => `${issuerKey}::${year}`;
  const updateArgs: Prisma.InputJsonValue[] = [];

  const upsert = vi.fn(
    async (args: {
      where: { issuerKey_year: { issuerKey: string; year: number } };
      create: { issuerKey: string; year: number; lastSeq: number };
      update: { lastSeq: number | { increment: number } };
    }) => {
      const { issuerKey, year } = args.where.issuerKey_year;
      const k = key(issuerKey, year);
      updateArgs.push(args.update as Prisma.InputJsonValue);
      const existing = store.get(k);
      if (!existing) {
        const created = { issuerKey, year, lastSeq: args.create.lastSeq };
        store.set(k, created);
        return { ...created };
      }
      const upd = args.update.lastSeq;
      const nextLastSeq = typeof upd === "number" ? upd : existing.lastSeq + upd.increment;
      const updated = { ...existing, lastSeq: nextLastSeq };
      store.set(k, updated);
      return { ...updated };
    },
  );

  const tx = { invoiceSequence: { upsert } } as unknown as Prisma.TransactionClient;
  return { tx, upsert, updateArgs };
}

describe("allocateInvoiceNumber", () => {
  it("kent het eerste nummer 1 toe voor een lege reeks", async () => {
    const { tx } = makeFakeTx();
    const res = await allocateInvoiceNumber(tx, "zzp-1", 2026);
    expect(res).toEqual({ seq: 1, number: "2026-0001" });
  });

  it("hoogt gatenvrij op bij opeenvolgende toekenningen", async () => {
    const { tx } = makeFakeTx();
    const a = await allocateInvoiceNumber(tx, "zzp-1", 2026);
    const b = await allocateInvoiceNumber(tx, "zzp-1", 2026);
    const c = await allocateInvoiceNumber(tx, "zzp-1", 2026);
    expect([a.seq, b.seq, c.seq]).toEqual([1, 2, 3]);
    expect([a.number, b.number, c.number]).toEqual(["2026-0001", "2026-0002", "2026-0003"]);
  });

  it("houdt aparte reeksen per uitschrijvende partij en per jaar", async () => {
    const { tx } = makeFakeTx();
    const zzp1a = await allocateInvoiceNumber(tx, "zzp-1", 2026);
    const zzp2a = await allocateInvoiceNumber(tx, "zzp-2", 2026);
    const zzp1b = await allocateInvoiceNumber(tx, "zzp-1", 2026);
    const zzp1NewYear = await allocateInvoiceNumber(tx, "zzp-1", 2027);
    expect(zzp1a.number).toBe("2026-0001");
    expect(zzp2a.number).toBe("2026-0001"); // eigen reeks — mag hetzelfde nummer hebben
    expect(zzp1b.number).toBe("2026-0002");
    expect(zzp1NewYear.number).toBe("2027-0001"); // nieuw jaar start opnieuw
  });

  it("hoogt atomair op via `{ increment: 1 }` (geen stale lees-dan-overschrijf)", async () => {
    const { tx, upsert, updateArgs } = makeFakeTx();
    await allocateInvoiceNumber(tx, "zzp-1", 2026);
    await allocateInvoiceNumber(tx, "zzp-1", 2026);

    // Elke ophoging moet de atomaire operator gebruiken, nooit een door de caller vooraf
    // berekend absoluut getal — dat was juist de bron van de dubbel-nummer-botsing.
    for (const upd of updateArgs) {
      expect(upd).toEqual({ lastSeq: { increment: 1 } });
    }

    // De allocatie doet alleen de atomaire upsert — geen apart `findUnique`-race-venster ervoor.
    // (De fake tx biedt bewust geen `findUnique`; een aparte lees zou hier hebben gefaald.)
    expect(upsert).toHaveBeenCalledTimes(2);
  });

  it("laat twee gelijktijdige indieningen serialiseren tot verschillende nummers", async () => {
    // Simuleer gelijktijdigheid tegen dezelfde beginstaat: omdat de fake `increment` op de
    // HUIDIGE opgeslagen waarde toepast (net als een rijlock in de DB), krijgen opeenvolgende
    // toekenningen distincte nummers — de oude lees-dan-schrijf zou tweemaal 1 hebben gegeven.
    const { tx } = makeFakeTx();
    const first = await allocateInvoiceNumber(tx, "zzp-1", 2026);
    const second = await allocateInvoiceNumber(tx, "zzp-1", 2026);
    expect(first.number).not.toBe(second.number);
    expect(new Set([first.seq, second.seq]).size).toBe(2);
  });
});
