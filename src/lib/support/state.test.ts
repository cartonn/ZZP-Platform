import { describe, it, expect } from "vitest";
import { canSupportTransition, assertSupportTransition, SupportTransitionError } from "./state";
import { SUPPORT_TICKET_STATUSES, SUPPORT_TICKET_TRANSITIONS } from "@/lib/enums";

describe("support-ticket state machine", () => {
  it("staat gedefinieerde overgangen toe", () => {
    expect(canSupportTransition("NEW", "TRIAGED")).toBe(true);
    expect(canSupportTransition("TRIAGED", "ESCALATED")).toBe(true);
    expect(canSupportTransition("AUTO_ANSWERED", "REOPENED")).toBe(true);
    expect(canSupportTransition("RESOLVED", "REOPENED")).toBe(true);
    expect(canSupportTransition("REOPENED", "TRIAGED")).toBe(true);
  });

  it("weigert overgangen die niet in de map staan", () => {
    expect(canSupportTransition("NEW", "RESOLVED")).toBe(false);
    expect(canSupportTransition("NEW", "ESCALATED")).toBe(false);
    expect(canSupportTransition("RESOLVED", "TRIAGED")).toBe(false);
  });

  it("geen enkele status gaat naar zichzelf", () => {
    for (const s of SUPPORT_TICKET_STATUSES) {
      expect(canSupportTransition(s, s)).toBe(false);
    }
  });

  it("assert gooit SupportTransitionError met from -> to in de boodschap", () => {
    expect(() => assertSupportTransition("NEW", "RESOLVED")).toThrow(SupportTransitionError);
    expect(() => assertSupportTransition("NEW", "RESOLVED")).toThrow("NEW -> RESOLVED");
  });

  it("assert is stil bij een geldige overgang", () => {
    expect(() => assertSupportTransition("NEW", "TRIAGED")).not.toThrow();
  });

  it("canSupportTransition komt voor elke (from, to) overeen met de map (drift-bewaking)", () => {
    for (const from of SUPPORT_TICKET_STATUSES) {
      for (const to of SUPPORT_TICKET_STATUSES) {
        expect(canSupportTransition(from, to)).toBe(SUPPORT_TICKET_TRANSITIONS[from].includes(to));
      }
    }
  });
});
