import { describe, expect, it } from "vitest";
import {
  assertCollaborationTransition,
  canTransitionCollaboration,
  complianceBlocksPlacement,
  CollaborationTransitionError,
} from "@/lib/collaborations";

describe("complianceBlocksPlacement (inzetbaarheid-gate)", () => {
  it("blokkeert plaatsing alleen bij NON_COMPLIANT", () => {
    expect(complianceBlocksPlacement("NON_COMPLIANT")).toBe(true);
    expect(complianceBlocksPlacement("WARNING")).toBe(false);
    expect(complianceBlocksPlacement("COMPLIANT")).toBe(false);
  });
});

describe("samenwerking-statusovergangen", () => {
  it("staat geldige overgangen toe", () => {
    expect(canTransitionCollaboration("PROPOSED", "ACTIVE")).toBe(true);
    expect(canTransitionCollaboration("PROPOSED", "CANCELLED")).toBe(true);
    expect(canTransitionCollaboration("ACTIVE", "COMPLETED")).toBe(true);
    expect(canTransitionCollaboration("ACTIVE", "CANCELLED")).toBe(true);
  });

  it("weigert ongeldige en terminale overgangen", () => {
    expect(canTransitionCollaboration("PROPOSED", "COMPLETED")).toBe(false);
    expect(canTransitionCollaboration("COMPLETED", "ACTIVE")).toBe(false);
    expect(canTransitionCollaboration("CANCELLED", "ACTIVE")).toBe(false);
    expect(() => assertCollaborationTransition("COMPLETED", "ACTIVE")).toThrow(
      CollaborationTransitionError,
    );
  });

  it("houdt CANCELLED→PROPOSED bewust buiten de canonieke map (her-voorstel loopt uitsluitend via de REPROPOSABLE_CANCELLED_WHERE-guard)", () => {
    // Vangrail tegen stille drift: de her-voorstel-reset in `proposeCollaboration` is een bewuste,
    // guard-gebonden uitzondering (src/lib/collaboration-reproposal.ts) — géén generieke overgang.
    // Wie deze overgang aan de map wil toevoegen, zet hem daarmee óók open voor paden zonder die
    // guard; dat mag alleen na een expliciete beslissing (zie de comment bij COLLABORATION_TRANSITIONS).
    expect(canTransitionCollaboration("CANCELLED", "PROPOSED")).toBe(false);
    expect(() => assertCollaborationTransition("CANCELLED", "PROPOSED")).toThrow(
      CollaborationTransitionError,
    );
  });
});
