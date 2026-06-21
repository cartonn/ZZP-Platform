import { describe, it, expect } from "vitest";
import {
  invoiceGroup,
  parseInvoiceFilter,
  filterInvoices,
  summarizeInvoiceGroups,
  INVOICE_FILTER_GROUPS,
} from "@/lib/invoice-filter";

const cascade = (lifecycleStatus: string) => ({ lifecycleStatus, status: "DRAFT" });
const legacy = (status: string) => ({ lifecycleStatus: null, status });

describe("invoiceGroup — cascade-facturen (via lifecycleStatus)", () => {
  it("DRAFT-concept → concept", () => {
    expect(invoiceGroup(cascade("DRAFT"))).toBe("concept");
  });

  it("SUBMITTED/APPROVED/OVERDUE → open", () => {
    expect(invoiceGroup(cascade("SUBMITTED"))).toBe("open");
    expect(invoiceGroup(cascade("APPROVED"))).toBe("open");
    expect(invoiceGroup(cascade("OVERDUE"))).toBe("open");
  });

  it("PAID en PROCESSED → paid", () => {
    expect(invoiceGroup(cascade("PAID"))).toBe("paid");
    expect(invoiceGroup(cascade("PROCESSED"))).toBe("paid");
  });

  it("REJECTED en CREDITED → afgehandeld", () => {
    expect(invoiceGroup(cascade("REJECTED"))).toBe("afgehandeld");
    expect(invoiceGroup(cascade("CREDITED"))).toBe("afgehandeld");
  });
});

describe("invoiceGroup — legacy-facturen (via status)", () => {
  it("DRAFT → concept", () => {
    expect(invoiceGroup(legacy("DRAFT"))).toBe("concept");
  });

  it("SENT en OVERDUE → open", () => {
    expect(invoiceGroup(legacy("SENT"))).toBe("open");
    expect(invoiceGroup(legacy("OVERDUE"))).toBe("open");
  });

  it("PAID → paid", () => {
    expect(invoiceGroup(legacy("PAID"))).toBe("paid");
  });

  it("CANCELLED → afgehandeld", () => {
    expect(invoiceGroup(legacy("CANCELLED"))).toBe("afgehandeld");
  });
});

describe("parseInvoiceFilter", () => {
  it("accepteert geldige groepen", () => {
    for (const g of INVOICE_FILTER_GROUPS) {
      expect(parseInvoiceFilter(g)).toBe(g);
    }
  });

  it("valt terug op all bij onbekend/leeg/undefined", () => {
    expect(parseInvoiceFilter("onzin")).toBe("all");
    expect(parseInvoiceFilter("")).toBe("all");
    expect(parseInvoiceFilter(undefined)).toBe("all");
  });
});

describe("filterInvoices", () => {
  const invoices = [
    cascade("DRAFT"),
    cascade("APPROVED"),
    legacy("PAID"),
    legacy("CANCELLED"),
    cascade("SUBMITTED"),
  ];

  it("all geeft de volledige lijst terug zonder te muteren", () => {
    const result = filterInvoices(invoices, "all");
    expect(result).toHaveLength(invoices.length);
    expect(result).not.toBe(invoices); // kopie, geen referentie
  });

  it("filtert op open en behoudt de invoervolgorde", () => {
    const result = filterInvoices(invoices, "open");
    expect(result).toEqual([cascade("APPROVED"), cascade("SUBMITTED")]);
  });

  it("filtert op afgehandeld", () => {
    expect(filterInvoices(invoices, "afgehandeld")).toEqual([legacy("CANCELLED")]);
  });

  it("muteert de invoer niet", () => {
    const snapshot = invoices.slice();
    filterInvoices(invoices, "paid");
    expect(invoices).toEqual(snapshot);
  });
});

describe("summarizeInvoiceGroups", () => {
  it("telt elke factuur in precies één groep; all is het totaal", () => {
    const invoices = [
      cascade("DRAFT"),
      cascade("APPROVED"),
      cascade("PAID"),
      legacy("PAID"),
      legacy("CANCELLED"),
      cascade("REJECTED"),
    ];
    const counts = summarizeInvoiceGroups(invoices);
    expect(counts.all).toBe(6);
    expect(counts.concept).toBe(1);
    expect(counts.open).toBe(1);
    expect(counts.paid).toBe(2);
    expect(counts.afgehandeld).toBe(2);
    expect(counts.concept + counts.open + counts.paid + counts.afgehandeld).toBe(counts.all);
  });

  it("lege lijst → alles nul", () => {
    const counts = summarizeInvoiceGroups([]);
    expect(counts).toEqual({ all: 0, concept: 0, open: 0, paid: 0, afgehandeld: 0 });
  });
});
