import { describe, expect, it } from "vitest";
import {
  INVOICE_REGISTER_CSV_HEADER,
  invoiceNetCents,
  invoiceRegisterCsv,
  invoiceVatCents,
  type InvoiceRegisterRow,
} from "@/lib/invoice-register-csv";

const base: InvoiceRegisterRow = {
  number: "2026-001",
  issuedAt: new Date("2026-03-10T10:00:00Z"),
  dueAt: new Date("2026-04-09T10:00:00Z"),
  counterpartyName: "Zorginstelling De Linde",
  description: "Nachtdiensten week 10",
  totalCents: 121000,
  subtotalCents: 100000,
  vatCents: 21000,
  status: "PAID",
  lifecycleStatus: "PAID",
  paidAt: new Date("2026-04-01T10:00:00Z"),
};

const parse = (csv: string) => csv.split("\r\n").map((line) => line.split(";"));

describe("invoiceNetCents / invoiceVatCents", () => {
  it("gebruikt de cascade-splitsing wanneer aanwezig", () => {
    expect(invoiceNetCents(base)).toBe(100000);
    expect(invoiceVatCents(base)).toBe(21000);
  });

  it("valt voor legacy losse facturen terug op totaal excl. + €0 btw (verzint geen splitsing)", () => {
    const legacy = { ...base, subtotalCents: null, vatCents: null };
    expect(invoiceNetCents(legacy)).toBe(legacy.totalCents);
    expect(invoiceVatCents(legacy)).toBe(0);
  });

  it("houdt de invariant excl. + btw = incl. bij cascade-facturen", () => {
    expect(invoiceNetCents(base) + invoiceVatCents(base)).toBe(base.totalCents);
  });
});

describe("invoiceRegisterCsv", () => {
  it("schrijft de vaste kop en één rij per factuur", () => {
    const rows = parse(invoiceRegisterCsv([base]));
    expect(rows[0]).toEqual([...INVOICE_REGISTER_CSV_HEADER]);
    expect(rows).toHaveLength(2);
    expect(rows[1]).toEqual([
      "2026-001",
      "2026-03-10",
      "2026-04-09",
      "Zorginstelling De Linde",
      "Nachtdiensten week 10",
      "1000.00",
      "210.00",
      "1210.00",
      "Betaald",
      "2026-04-01",
    ]);
  });

  it("sorteert oplopend op factuurdatum met concepten (zonder datum) onderaan", () => {
    const later = { ...base, number: "2026-002", issuedAt: new Date("2026-05-01T10:00:00Z") };
    const concept = {
      ...base,
      number: "concept-x",
      issuedAt: null,
      dueAt: null,
      status: "DRAFT",
      lifecycleStatus: "DRAFT",
      paidAt: null,
    };
    const rows = parse(invoiceRegisterCsv([concept, later, base]));
    expect(rows.slice(1).map((r) => r[0])).toEqual(["2026-001", "2026-002", "concept-x"]);
  });

  it("laat lege velden leeg voor een concept zonder datum/tegenpartij en gebruikt de groepslabel", () => {
    const concept: InvoiceRegisterRow = {
      ...base,
      number: "concept-1",
      issuedAt: null,
      dueAt: null,
      counterpartyName: null,
      description: null,
      status: "DRAFT",
      lifecycleStatus: "DRAFT",
      paidAt: null,
    };
    const rows = parse(invoiceRegisterCsv([concept]));
    expect(rows[1]).toEqual([
      "concept-1",
      "",
      "",
      "",
      "",
      "1000.00",
      "210.00",
      "1210.00",
      "Concept",
      "",
    ]);
  });

  it("beveiligt tegen CSV-formule-injectie in de tegenpartijnaam", () => {
    const nasty = { ...base, counterpartyName: "=SOM(A1:A9)" };
    const csv = invoiceRegisterCsv([nasty]);
    expect(csv).toContain("'=SOM(A1:A9)");
  });

  it("mapt een openstaande cascade-factuur op de groepslabel Openstaand", () => {
    const open = { ...base, status: "DRAFT", lifecycleStatus: "SUBMITTED", paidAt: null };
    const rows = parse(invoiceRegisterCsv([open]));
    expect(rows[1]![8]).toBe("Openstaand");
  });
});
