// Regressie: `allocateInvoiceNumber` moet het factuurnummer atomair toewijzen via een upsert-increment
// (`SET lastSeq = lastSeq + 1` onder de rij-lock), niet via een read-then-write met een in JS
// voor-berekende waarde. De oude vorm (`findUnique` → `update: { lastSeq: seq }`) was niet race-veilig
// onder Postgres READ COMMITTED: twee gelijktijdige submits lazen dezelfde `lastSeq`, berekenden
// hetzelfde volgnummer en botsten dan op de Invoice-uniekheid [issuerKey, partyInvoiceNumber] — de
// tweede submit faalde met een rauwe P2002. Deze tests borgen het atomaire contract met een mock die
// de upsert-semantiek (create-als-afwezig, anders increment) modelleert.

import { describe, expect, it, vi } from "vitest";
import type { Prisma } from "@prisma/client";
import { allocateInvoiceNumber } from "@/lib/administration/persist";

/** Minimale in-memory tx die de InvoiceSequence-upsert modelleert zoals Postgres/SQLite dat doen. */
function makeTx() {
  const store = new Map<string, { issuerKey: string; year: number; lastSeq: number }>();
  const findUnique = vi.fn();
  const upsert = vi.fn(
    async (args: {
      where: { issuerKey_year: { issuerKey: string; year: number } };
      create: { issuerKey: string; year: number; lastSeq: number };
      update: { lastSeq: { increment: number } };
    }) => {
      const { issuerKey, year } = args.where.issuerKey_year;
      const key = `${issuerKey}:${year}`;
      const existing = store.get(key);
      if (!existing) {
        const row = { ...args.create };
        store.set(key, row);
        return { ...row }; // DB geeft een rij-snapshot terug, geen levende referentie.
      }
      // Increment atomair op de opgeslagen waarde — niet op een van buiten meegegeven getal.
      existing.lastSeq += args.update.lastSeq.increment;
      return { ...existing };
    },
  );
  const tx = { invoiceSequence: { findUnique, upsert } } as unknown as Prisma.TransactionClient;
  return { tx, findUnique, upsert, store };
}

describe("allocateInvoiceNumber — atomaire, race-veilige toewijzing", () => {
  it("start een lege reeks op 1 en formatteert het nummer per partij/jaar", async () => {
    const { tx } = makeTx();
    const first = await allocateInvoiceNumber(tx, "f1", 2026);
    expect(first).toEqual({ seq: 1, number: "2026-0001" });
  });

  it("hoogt opeenvolgende toewijzingen op zonder gaten (1, 2, 3)", async () => {
    const { tx } = makeTx();
    const a = await allocateInvoiceNumber(tx, "f1", 2026);
    const b = await allocateInvoiceNumber(tx, "f1", 2026);
    const c = await allocateInvoiceNumber(tx, "f1", 2026);
    expect([a.seq, b.seq, c.seq]).toEqual([1, 2, 3]);
    expect([a.number, b.number, c.number]).toEqual(["2026-0001", "2026-0002", "2026-0003"]);
  });

  it("houdt reeksen per partij én per jaar gescheiden", async () => {
    const { tx } = makeTx();
    await allocateInvoiceNumber(tx, "f1", 2026);
    const f1Second = await allocateInvoiceNumber(tx, "f1", 2026);
    const f2First = await allocateInvoiceNumber(tx, "f2", 2026);
    const f1NextYear = await allocateInvoiceNumber(tx, "f1", 2027);
    expect(f1Second).toEqual({ seq: 2, number: "2026-0002" });
    expect(f2First).toEqual({ seq: 1, number: "2026-0001" });
    expect(f1NextYear).toEqual({ seq: 1, number: "2027-0001" });
  });

  it("delegeert het ophogen aan de DB (upsert-increment), niet aan een voor-gelezen waarde", async () => {
    // De kern van de fix: geen read-then-write. De functie mag NIET meer eerst findUnique doen en
    // dan een in JS berekend getal wegschrijven — dat was de race. Ze roept exact één upsert met
    // `update.lastSeq.increment` aan en gebruikt de teruggegeven rij-waarde.
    const { tx, findUnique, upsert } = makeTx();
    await allocateInvoiceNumber(tx, "f1", 2026);
    expect(findUnique).not.toHaveBeenCalled();
    expect(upsert).toHaveBeenCalledTimes(1);
    const [firstArg] = upsert.mock.calls[0] ?? [];
    const args = firstArg as { update: { lastSeq: { increment: number } } };
    expect(args.update).toEqual({ lastSeq: { increment: 1 } });
  });

  it("twee toewijzingen op dezelfde reeks geven altijd verschillende nummers (geen duplicaat)", async () => {
    // Modelleert de gelijktijdige submit-race: omdat het ophogen op de opgeslagen rij-waarde gebeurt,
    // kan geen tweede toewijzing hetzelfde nummer claimen — dus geen botsing op de Invoice-uniekheid.
    const { tx } = makeTx();
    const results = await Promise.all([
      allocateInvoiceNumber(tx, "f1", 2026),
      allocateInvoiceNumber(tx, "f1", 2026),
    ]);
    const numbers = results.map((r) => r.number);
    expect(new Set(numbers).size).toBe(2);
  });
});
