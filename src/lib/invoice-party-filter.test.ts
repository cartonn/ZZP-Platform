import { describe, it, expect } from "vitest";

import {
  filterInvoicesByParty,
  invoiceParty,
  parsePartyFilter,
  summarizeInvoiceParties,
  type PartyInvoiceLike,
} from "@/lib/invoice-party-filter";

/** Factory: factuurrij met beide kanten van de samenwerking. */
function row(
  companyId: string | null,
  companyName: string,
  freelancerId: string | null,
  freelancerName: string | null,
): PartyInvoiceLike {
  return {
    collaboration: {
      company: companyId ? { id: companyId, name: companyName } : null,
      freelancer: freelancerId ? { id: freelancerId, user: { name: freelancerName } } : null,
    },
  };
}

/** Factory: factuurrij zonder samenwerking. */
function orphan(): PartyInvoiceLike {
  return { collaboration: null };
}

describe("invoiceParty", () => {
  it("geeft de opdrachtgever voor de ZZP'er-weergave", () => {
    expect(invoiceParty(row("c1", "Acme BV", "f1", "Jan"), true)).toEqual({
      id: "c1",
      name: "Acme BV",
    });
  });

  it("geeft de ZZP'er (id + naam) voor de opdrachtgever-weergave", () => {
    expect(invoiceParty(row("c1", "Acme BV", "f1", "Jan"), false)).toEqual({
      id: "f1",
      name: "Jan",
    });
  });

  it("geeft null bij een ontbrekende samenwerking", () => {
    expect(invoiceParty(orphan(), true)).toBeNull();
    expect(invoiceParty(orphan(), false)).toBeNull();
  });

  it("valt terug op lege naam als de freelancer-gebruikersnaam ontbreekt", () => {
    expect(invoiceParty(row("c1", "Acme BV", "f1", null), false)).toEqual({ id: "f1", name: "" });
  });
});

describe("filterInvoicesByParty", () => {
  const invoices = [
    row("c1", "Acme BV", "f1", "Jan"),
    row("c2", "Bravo NV", "f2", "Piet"),
    row("c1", "Acme BV", "f3", "Kees"),
  ];

  it("geeft bij null/'' een kopie ongewijzigd terug (geen mutatie, niet dezelfde referentie)", () => {
    const outNull = filterInvoicesByParty(invoices, null, true);
    const outEmpty = filterInvoicesByParty(invoices, "", true);
    expect(outNull).toEqual(invoices);
    expect(outNull).not.toBe(invoices);
    expect(outEmpty).toEqual(invoices);
  });

  it("filtert op een specifiek id met behoud van de invoervolgorde", () => {
    const out = filterInvoicesByParty(invoices, "c1", true);
    expect(out).toEqual([invoices[0], invoices[2]]);
  });

  it("muteert de invoerlijst niet", () => {
    const snapshot = [...invoices];
    filterInvoicesByParty(invoices, "c1", true);
    expect(invoices).toEqual(snapshot);
  });
});

describe("summarizeInvoiceParties", () => {
  const invoices = [
    row("c2", "Bravo NV", "f1", "Jan"),
    row("c1", "acme bv", "f2", "Piet"),
    row("c2", "Bravo NV", "f3", "Kees"),
    orphan(),
  ];

  it("telt distinct partijen, sorteert op naam (nl, case-insensitive) en slaat null-partijen over", () => {
    expect(summarizeInvoiceParties(invoices, true)).toEqual([
      { id: "c1", name: "acme bv", count: 1 },
      { id: "c2", name: "Bravo NV", count: 2 },
    ]);
  });

  it("is rolbewust: dezelfde rijen leveren voor de opdrachtgever de freelancers op", () => {
    const summary = summarizeInvoiceParties(invoices, false);
    // Gesorteerd op naam (nl): Jan (f1) < Kees (f3) < Piet (f2).
    expect(summary.map((p) => p.id)).toEqual(["f1", "f3", "f2"]);
    expect(summary.every((p) => p.count === 1)).toBe(true);
  });
});

describe("parsePartyFilter", () => {
  const invoices = [row("c1", "Acme BV", "f1", "Jan")];

  it("geeft null bij undefined of lege string", () => {
    expect(parsePartyFilter(undefined, invoices, true)).toBeNull();
    expect(parsePartyFilter("", invoices, true)).toBeNull();
  });

  it("geeft null bij een onbekend id (anti-oracle)", () => {
    expect(parsePartyFilter("onbekend", invoices, true)).toBeNull();
  });

  it("geeft het id terug als het bij een partij in de lijst hoort", () => {
    expect(parsePartyFilter("c1", invoices, true)).toBe("c1");
    expect(parsePartyFilter("f1", invoices, false)).toBe("f1");
  });
});
