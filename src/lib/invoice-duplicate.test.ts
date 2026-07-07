import { describe, expect, it } from "vitest";
import { buildInvoiceDuplicateInitial } from "./invoice-duplicate";
import { eurosToCents } from "./invoices";

describe("buildInvoiceDuplicateInitial", () => {
  it("neemt de samenwerking en alle regels over", () => {
    const initial = buildInvoiceDuplicateInitial({
      collaborationId: "collab-1",
      lines: [
        { description: "Consultancy juni", quantity: 40, unitCents: 8500 },
        { description: "Onkosten", quantity: 1, unitCents: 5000 },
      ],
    });
    expect(initial.collaborationId).toBe("collab-1");
    expect(initial.lines).toEqual([
      { description: "Consultancy juni", quantity: "40", unit: "85.00" },
      { description: "Onkosten", quantity: "1", unit: "50.00" },
    ]);
  });

  it("laat het factuurnummer, de status en de datums bewust weg", () => {
    const initial = buildInvoiceDuplicateInitial({
      collaborationId: "collab-2",
      lines: [{ description: "Werk", quantity: 2, unitCents: 10000 }],
    });
    // Geen enkel veld buiten collaborationId + lines lekt mee.
    expect(Object.keys(initial).sort()).toEqual(["collaborationId", "lines"]);
    expect(initial.lines).toEqual([{ description: "Werk", quantity: "2", unit: "100.00" }]);
  });

  it("levert een lege regellijst voor een factuur zonder regels", () => {
    const initial = buildInvoiceDuplicateInitial({ collaborationId: "c", lines: [] });
    expect(initial.lines).toEqual([]);
  });

  it("brengt tarieven terug naar de invoerstring die exact terug-rondt naar centen", () => {
    const initial = buildInvoiceDuplicateInitial({
      collaborationId: "c",
      lines: [{ description: "Regel", quantity: 3, unitCents: 2345 }],
    });
    expect(initial.lines).toEqual([{ description: "Regel", quantity: "3", unit: "23.45" }]);
    // Terug-ronden zoals de server-actie doet: euro-invoer → centen.
    expect(eurosToCents(23.45)).toBe(2345);
  });
});
