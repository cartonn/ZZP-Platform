import { describe, expect, it } from "vitest";
import { SHIFT_HANDOFF_STATUSES, type ShiftHandoffStatus } from "@/lib/enums";
import {
  SHIFT_HANDOFF_TRANSITIONS,
  ShiftHandoffTransitionError,
  assertHandoffTransition,
  canRequestHandoff,
  canTransitionHandoff,
  shiftHandoffRejectedNotificationBody,
} from "@/lib/shift-handoff";

describe("SHIFT_HANDOFF_TRANSITIONS", () => {
  it("alleen OPEN heeft uitgaande overgangen; eindstatussen zijn terminaal", () => {
    expect(SHIFT_HANDOFF_TRANSITIONS.OPEN).toEqual(["APPROVED", "REJECTED", "CANCELLED"]);
    expect(SHIFT_HANDOFF_TRANSITIONS.APPROVED).toEqual([]);
    expect(SHIFT_HANDOFF_TRANSITIONS.REJECTED).toEqual([]);
    expect(SHIFT_HANDOFF_TRANSITIONS.CANCELLED).toEqual([]);
  });

  it("de map dekt exact alle enum-statussen", () => {
    expect(Object.keys(SHIFT_HANDOFF_TRANSITIONS).sort()).toEqual(
      [...SHIFT_HANDOFF_STATUSES].sort(),
    );
  });
});

describe("canTransitionHandoff", () => {
  it("staat de drie OPEN-overgangen toe", () => {
    expect(canTransitionHandoff("OPEN", "APPROVED")).toBe(true);
    expect(canTransitionHandoff("OPEN", "REJECTED")).toBe(true);
    expect(canTransitionHandoff("OPEN", "CANCELLED")).toBe(true);
  });

  it("weigert een no-op (OPEN -> OPEN) en elke overgang vanuit een eindstatus", () => {
    expect(canTransitionHandoff("OPEN", "OPEN")).toBe(false);
    expect(canTransitionHandoff("APPROVED", "REJECTED")).toBe(false);
    expect(canTransitionHandoff("REJECTED", "APPROVED")).toBe(false);
    expect(canTransitionHandoff("CANCELLED", "APPROVED")).toBe(false);
    expect(canTransitionHandoff("APPROVED", "CANCELLED")).toBe(false);
  });
});

describe("assertHandoffTransition", () => {
  it("laat een geldige overgang door", () => {
    expect(() => assertHandoffTransition("OPEN", "APPROVED")).not.toThrow();
  });

  it("laat OPEN → CANCELLED door (intrekken door de aanvrager) maar weigert het omgekeerde", () => {
    expect(() => assertHandoffTransition("OPEN", "CANCELLED")).not.toThrow();
    expect(() => assertHandoffTransition("CANCELLED", "OPEN")).toThrow(ShiftHandoffTransitionError);
    expect(() => assertHandoffTransition("CANCELLED", "APPROVED")).toThrow(
      ShiftHandoffTransitionError,
    );
  });

  it("werpt ShiftHandoffTransitionError bij een ongeldige overgang", () => {
    expect(() => assertHandoffTransition("APPROVED", "REJECTED")).toThrow(
      ShiftHandoffTransitionError,
    );
    expect(() => assertHandoffTransition("OPEN", "OPEN")).toThrow(ShiftHandoffTransitionError);
  });

  it("alle paren buiten de map worden geweigerd, alle paren in de map toegelaten", () => {
    const all = SHIFT_HANDOFF_STATUSES;
    for (const from of all) {
      for (const to of all) {
        const allowed = SHIFT_HANDOFF_TRANSITIONS[from as ShiftHandoffStatus].includes(to);
        if (allowed) {
          expect(() => assertHandoffTransition(from, to)).not.toThrow();
        } else {
          expect(() => assertHandoffTransition(from, to)).toThrow(ShiftHandoffTransitionError);
        }
      }
    }
  });
});

describe("canRequestHandoff", () => {
  it("alleen de huidige ZZP'er van een ACTIEVE samenwerking mag openen", () => {
    expect(canRequestHandoff({ collaborationStatus: "ACTIVE", isCurrentFreelancer: true })).toBe(
      true,
    );
  });

  it("een niet-ZZP'er (opdrachtgever/admin) mag niet openen, ook niet bij ACTIVE", () => {
    expect(canRequestHandoff({ collaborationStatus: "ACTIVE", isCurrentFreelancer: false })).toBe(
      false,
    );
  });

  it("op een niet-ACTIEVE samenwerking mag de ZZP'er niet openen", () => {
    for (const status of ["PROPOSED", "COMPLETED", "CANCELLED"]) {
      expect(canRequestHandoff({ collaborationStatus: status, isCurrentFreelancer: true })).toBe(
        false,
      );
    }
  });
});

// Locked-body-test: schrijver (rejectShiftHandoff) én AVG-erasure (anonymizeUser) reconstrueren deze
// exacte body om de afwijsreden op de aanvragersfeed te redacten. Wijzigt de body → dan matcht de
// erasure niet meer en overleeft de reden art. 17. Deze test vangt zo'n drift.
describe("shiftHandoffRejectedNotificationBody", () => {
  it("produceert de exacte, gelockte body (opdrachttitel + reden)", () => {
    expect(
      shiftHandoffRejectedNotificationBody({ jobTitle: "Nachtdienst ZZP", note: "Niet geschikt" }),
    ).toBe('De overname van "Nachtdienst ZZP" is afgewezen. Reden: Niet geschikt');
  });
});
