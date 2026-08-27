import { describe, expect, it } from "vitest";
import { showsClientPaymentContext } from "./collaboration-payer-context";

describe("showsClientPaymentContext", () => {
  it("toont niets voor de opdrachtgever-partij, ongeacht status of facturen", () => {
    expect(
      showsClientPaymentContext({
        isFreelancer: false,
        collaborationStatus: "ACTIVE",
        invoiceCount: 3,
      }),
    ).toBe(false);
  });

  it("toont het blok voor de ZZP'er op een actieve inzet, ook zonder facturen", () => {
    expect(
      showsClientPaymentContext({
        isFreelancer: true,
        collaborationStatus: "ACTIVE",
        invoiceCount: 0,
      }),
    ).toBe(true);
  });

  it("verzwijgt het blok op een nog-voorgestelde samenwerking zonder facturen (niets te innen)", () => {
    expect(
      showsClientPaymentContext({
        isFreelancer: true,
        collaborationStatus: "PROPOSED",
        invoiceCount: 0,
      }),
    ).toBe(false);
  });

  it("toont het blok bij ten minste één factuur, ongeacht de status", () => {
    for (const collaborationStatus of ["PROPOSED", "COMPLETED", "CANCELLED"]) {
      expect(
        showsClientPaymentContext({
          isFreelancer: true,
          collaborationStatus,
          invoiceCount: 1,
        }),
      ).toBe(true);
    }
  });

  it("een afgeronde inzet zonder facturen toont niets (niets te innen)", () => {
    expect(
      showsClientPaymentContext({
        isFreelancer: true,
        collaborationStatus: "COMPLETED",
        invoiceCount: 0,
      }),
    ).toBe(false);
  });
});
