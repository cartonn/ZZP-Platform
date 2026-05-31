import { describe, it, expect } from "vitest";

// Status-mapping en nummeringslogica van scripts/migrate-legacy-invoices.mjs (puur, DB-vrij)

const STATUS_MAP: Record<string, string> = {
  DRAFT: "DRAFT",
  SENT: "SUBMITTED",
  OVERDUE: "OVERDUE",
  PAID: "PROCESSED",
  CANCELLED: "CREDITED",
};

function mapStatus(s: string): string {
  const mapped = STATUS_MAP[s];
  if (!mapped) throw new Error(`Onbekende legacy-status: ${s}`);
  return mapped;
}

function formatPartyNumber(year: number, seq: number): string {
  return `${year}-${String(seq).padStart(4, "0")}`;
}

// Simuleert de groeperingslogica: geeft per (issuerKey, year) een Map terug
// met gesorteerde (chronologisch) invoice-entries.
function assignNumbers(
  invoices: { id: string; issuerKey: string; year: number; sortKey: number }[],
): Map<string, { id: string; partyInvoiceNumber: string }[]> {
  const groups = new Map<string, typeof invoices>();
  for (const inv of invoices) {
    const key = `${inv.issuerKey}::${inv.year}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(inv);
  }
  // Sorteer elke groep op sortKey (issuedAt timestamp)
  for (const [, entries] of groups) {
    entries.sort((a, b) => a.sortKey - b.sortKey);
  }
  const result = new Map<string, { id: string; partyInvoiceNumber: string }[]>();
  for (const [key, entries] of groups) {
    let seq = 0;
    const numbered = entries.map((e) => {
      seq += 1;
      const [, yearStr] = key.split("::");
      return { id: e.id, partyInvoiceNumber: formatPartyNumber(Number(yearStr), seq) };
    });
    result.set(key, numbered);
  }
  return result;
}

describe("migrate-legacy-invoices — statusmapping", () => {
  it("mapt elke legacy-status correct op de lifecycle", () => {
    expect(mapStatus("DRAFT")).toBe("DRAFT");
    expect(mapStatus("SENT")).toBe("SUBMITTED");
    expect(mapStatus("OVERDUE")).toBe("OVERDUE");
    expect(mapStatus("PAID")).toBe("PROCESSED");
    expect(mapStatus("CANCELLED")).toBe("CREDITED");
  });

  it("gooit bij onbekende status", () => {
    expect(() => mapStatus("UNKNOWN")).toThrow("Onbekende legacy-status");
  });
});

describe("migrate-legacy-invoices — nummering per partij", () => {
  it("kent doorlopende nummers toe per (issuerKey, jaar)", () => {
    const invoices = [
      { id: "inv-a", issuerKey: "user-1", year: 2026, sortKey: 1 },
      { id: "inv-b", issuerKey: "user-1", year: 2026, sortKey: 2 },
      { id: "inv-c", issuerKey: "user-2", year: 2026, sortKey: 1 },
    ];
    const result = assignNumbers(invoices);
    const user1 = result.get("user-1::2026") ?? [];
    expect(user1[0]).toEqual({ id: "inv-a", partyInvoiceNumber: "2026-0001" });
    expect(user1[1]).toEqual({ id: "inv-b", partyInvoiceNumber: "2026-0002" });
    const user2 = result.get("user-2::2026") ?? [];
    expect(user2[0]).toEqual({ id: "inv-c", partyInvoiceNumber: "2026-0001" });
  });

  it("sorteert chronologisch zodat het oudste nummer het laagste krijgt", () => {
    const invoices = [
      { id: "inv-new", issuerKey: "user-1", year: 2026, sortKey: 100 },
      { id: "inv-old", issuerKey: "user-1", year: 2026, sortKey: 1 },
    ];
    const result = assignNumbers(invoices);
    const entries = result.get("user-1::2026") ?? [];
    expect(entries[0]?.id).toBe("inv-old");
    expect(entries[0]?.partyInvoiceNumber).toBe("2026-0001");
    expect(entries[1]?.id).toBe("inv-new");
    expect(entries[1]?.partyInvoiceNumber).toBe("2026-0002");
  });

  it("houdt jaarreeksen gescheiden", () => {
    const invoices = [
      { id: "inv-25", issuerKey: "user-1", year: 2025, sortKey: 1 },
      { id: "inv-26", issuerKey: "user-1", year: 2026, sortKey: 1 },
    ];
    const result = assignNumbers(invoices);
    expect((result.get("user-1::2025") ?? [])[0]?.partyInvoiceNumber).toBe("2025-0001");
    expect((result.get("user-1::2026") ?? [])[0]?.partyInvoiceNumber).toBe("2026-0001");
  });

  it("verwerkt tien facturen en produceert een gatenvrije reeks", () => {
    const invoices = Array.from({ length: 10 }, (_, i) => ({
      id: `inv-${i}`,
      issuerKey: "user-1",
      year: 2026,
      sortKey: i,
    }));
    const result = assignNumbers(invoices);
    const entries = result.get("user-1::2026") ?? [];
    expect(entries).toHaveLength(10);
    for (let i = 0; i < 10; i++) {
      expect(entries[i]?.partyInvoiceNumber).toBe(`2026-${String(i + 1).padStart(4, "0")}`);
    }
  });
});
