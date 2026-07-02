import { describe, it, expect } from "vitest";
import { ticketAgeLabel } from "./ticket-age";

describe("ticketAgeLabel", () => {
  const now = new Date("2026-07-02T12:00:00.000Z");

  it("toont 'zojuist' onder een minuut", () => {
    expect(ticketAgeLabel(new Date(now.getTime() - 30_000), now)).toBe("zojuist");
  });

  it("toont minuten onder een uur", () => {
    expect(ticketAgeLabel(new Date(now.getTime() - 5 * 60_000), now)).toBe("5 min");
  });

  it("toont uren onder een dag", () => {
    expect(ticketAgeLabel(new Date(now.getTime() - 3 * 60 * 60_000), now)).toBe("3 u");
  });

  it("toont dagen vanaf 24 uur", () => {
    expect(ticketAgeLabel(new Date(now.getTime() - 2 * 24 * 60 * 60_000), now)).toBe("2 d");
  });

  it("klemt negatieve verschillen naar 'zojuist'", () => {
    expect(ticketAgeLabel(new Date(now.getTime() + 60_000), now)).toBe("zojuist");
  });
});
