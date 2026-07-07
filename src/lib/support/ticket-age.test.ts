import { describe, it, expect } from "vitest";
import { ticketAgeLabel, ticketOpenDays, ticketSla, SLA_BREACH_DAYS } from "./ticket-age";

const DAY = 24 * 60 * 60_000;

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

describe("ticketOpenDays", () => {
  const now = new Date("2026-07-08T12:00:00.000Z");

  it("telt hele dagen sinds aanmaak", () => {
    expect(ticketOpenDays(new Date(now.getTime() - 3 * DAY), now)).toBe(3);
    expect(ticketOpenDays(new Date(now.getTime() - 0.5 * DAY), now)).toBe(0);
  });

  it("klemt de toekomst naar 0", () => {
    expect(ticketOpenDays(new Date(now.getTime() + DAY), now)).toBe(0);
  });
});

describe("ticketSla", () => {
  const now = new Date("2026-07-08T12:00:00.000Z");

  it("is niet verbroken op of onder de grens", () => {
    const sla = ticketSla(new Date(now.getTime() - SLA_BREACH_DAYS * DAY), now);
    expect(sla.breached).toBe(false);
    expect(sla.openDays).toBe(SLA_BREACH_DAYS);
  });

  it("is verbroken boven de grens en toont 'X dagen open'", () => {
    const sla = ticketSla(new Date(now.getTime() - (SLA_BREACH_DAYS + 26) * DAY), now);
    expect(sla.breached).toBe(true);
    expect(sla.openDays).toBe(SLA_BREACH_DAYS + 26);
    expect(sla.label).toBe(`${SLA_BREACH_DAYS + 26} dagen open`);
  });

  it("gebruikt enkelvoud bij precies 1 dag", () => {
    expect(ticketSla(new Date(now.getTime() - 1 * DAY), now).label).toBe("1 dag open");
  });
});
