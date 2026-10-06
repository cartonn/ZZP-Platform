import { describe, expect, it } from "vitest";

import { displayInvoiceNumber } from "@/lib/invoice-number";

describe("displayInvoiceNumber", () => {
  it("toont het toegekende partij-nummer onveranderd", () => {
    expect(
      displayInvoiceNumber({ partyInvoiceNumber: "2026-0007", number: "clabc123:2026-0007" }),
    ).toBe("2026-0007");
  });

  it("behoudt een leeg partij-nummer (spiegelt de oude ??-semantiek)", () => {
    // Een lege string is een toegekende waarde, geen afwezigheid — niet terugvallen op `number`.
    expect(displayInvoiceNumber({ partyInvoiceNumber: "", number: "clabc123:2026-0007" })).toBe("");
  });

  it("valt bij een cascade-concept terug op het CONCEPT-nummer", () => {
    expect(displayInvoiceNumber({ partyInvoiceNumber: null, number: "CONCEPT-clperf456" })).toBe(
      "CONCEPT-clperf456",
    );
  });

  it("toont een oud los nummer zonder prefix ongewijzigd", () => {
    expect(displayInvoiceNumber({ partyInvoiceNumber: null, number: "F-2024-001" })).toBe(
      "F-2024-001",
    );
  });

  describe("verdediging in de diepte — issuerKey-prefix lekt nooit", () => {
    it("stript een userId-prefix wanneer het partij-nummer ontbreekt", () => {
      expect(displayInvoiceNumber({ partyInvoiceNumber: null, number: "clabc123:2026-0007" })).toBe(
        "2026-0007",
      );
    });

    it("stript de PLATFORM-prefix van de fee-reeks", () => {
      expect(displayInvoiceNumber({ partyInvoiceNumber: null, number: "PLATFORM:2026-0042" })).toBe(
        "2026-0042",
      );
    });

    it("stript ook bij een volgnummer van meer dan vier cijfers", () => {
      expect(
        displayInvoiceNumber({ partyInvoiceNumber: null, number: "clabc123:2026-12345" }),
      ).toBe("2026-12345");
    });

    it("laat een waarde met dubbele punt maar zónder geldig partij-nummer ongemoeid", () => {
      // Geen vals-positief: alleen een echt partij-nummer-restant wordt gestript.
      expect(displayInvoiceNumber({ partyInvoiceNumber: null, number: "legacy:nota-7" })).toBe(
        "legacy:nota-7",
      );
    });

    it("stript niet wanneer alleen het jaar-deel klopt maar het volgnummer te kort is", () => {
      expect(displayInvoiceNumber({ partyInvoiceNumber: null, number: "x:2026-7" })).toBe(
        "x:2026-7",
      );
    });
  });
});
