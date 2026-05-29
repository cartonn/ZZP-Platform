import { describe, expect, it } from "vitest";
import { StateTransitionError } from "@/lib/state-machine";
import {
  contractMachine,
  invoiceLifecycleMachine,
  paymentMachine,
  performanceMachine,
  workOrderMachine,
} from "@/lib/lifecycles";

describe("workOrderMachine (opdracht)", () => {
  it("volgt de happy-path concept -> gearchiveerd", () => {
    const path = ["DRAFT", "PUBLISHED", "MATCHED", "CONTRACTED", "IN_PROGRESS", "DELIVERED", "COMPLETED", "ARCHIVED"] as const;
    for (let i = 0; i < path.length - 1; i++) {
      expect(() => workOrderMachine.assert(path[i]!, path[i + 1]!)).not.toThrow();
    }
  });

  it("weigert sprongen die een stap overslaan", () => {
    expect(() => workOrderMachine.assert("DRAFT", "CONTRACTED")).toThrowError(StateTransitionError);
  });
});

describe("contractMachine", () => {
  it("getekend gaat naar actief, niet rechtstreeks van concept", () => {
    expect(contractMachine.can("SIGNED", "ACTIVE")).toBe(true);
    expect(contractMachine.can("DRAFT", "SIGNED")).toBe(false);
  });
});

describe("performanceMachine (urenstaat/oplevering)", () => {
  it("ingediend kan goedgekeurd of afgekeurd worden", () => {
    expect(performanceMachine.can("SUBMITTED", "APPROVED")).toBe(true);
    expect(performanceMachine.can("SUBMITTED", "REJECTED")).toBe(true);
  });

  it("afgekeurd kan opnieuw worden ingediend (herstel)", () => {
    expect(performanceMachine.can("REJECTED", "SUBMITTED")).toBe(true);
  });

  it("goedgekeurd is definitief (geen uitgaande overgangen)", () => {
    expect(performanceMachine.isTerminal("APPROVED")).toBe(true);
  });

  it("geen goedkeuring rechtstreeks vanuit concept (Besluit 3)", () => {
    expect(performanceMachine.can("DRAFT", "APPROVED")).toBe(false);
  });
});

describe("invoiceLifecycleMachine", () => {
  it("concept -> ingediend -> goedgekeurd -> betaald -> verwerkt", () => {
    const path = ["DRAFT", "SUBMITTED", "APPROVED", "PAID", "PROCESSED"] as const;
    for (let i = 0; i < path.length - 1; i++) {
      expect(invoiceLifecycleMachine.can(path[i]!, path[i + 1]!)).toBe(true);
    }
  });

  it("afgekeurd kan opnieuw worden ingediend", () => {
    expect(invoiceLifecycleMachine.can("REJECTED", "SUBMITTED")).toBe(true);
  });

  it("te laat kan alsnog betaald of gecrediteerd worden", () => {
    expect(invoiceLifecycleMachine.can("OVERDUE", "PAID")).toBe(true);
    expect(invoiceLifecycleMachine.can("OVERDUE", "CREDITED")).toBe(true);
  });

  it("weigert een verzonnen overgang (gecrediteerd is eindtoestand)", () => {
    expect(invoiceLifecycleMachine.isTerminal("CREDITED")).toBe(true);
    expect(() => invoiceLifecycleMachine.assert("CREDITED", "DRAFT")).toThrowError(StateTransitionError);
  });
});

describe("paymentMachine (registratie, geen geldverwerking)", () => {
  it("verwacht -> gemarkeerd -> bevestigd", () => {
    expect(paymentMachine.can("EXPECTED", "MARKED_PAID")).toBe(true);
    expect(paymentMachine.can("MARKED_PAID", "CONFIRMED")).toBe(true);
  });

  it("kan niet rechtstreeks van verwacht naar bevestigd", () => {
    expect(paymentMachine.can("EXPECTED", "CONFIRMED")).toBe(false);
  });

  it("te laat kan alsnog gemarkeerd/bevestigd worden", () => {
    expect(paymentMachine.can("OVERDUE", "MARKED_PAID")).toBe(true);
    expect(paymentMachine.can("OVERDUE", "CONFIRMED")).toBe(true);
  });
});
