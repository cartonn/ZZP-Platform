// Unit-tests voor missedWhileAway — het "terwijl je weg was"-venster in het notificatiecentrum.

import { describe, it, expect } from "vitest";
import { missedWhileAway } from "@/lib/missed-notifications";

const PREV = new Date("2026-06-01T10:00:00.000Z");
const LAST = new Date("2026-06-10T08:00:00.000Z");

function notif(createdAt: string, readAt: string | null = null) {
  return { createdAt: new Date(createdAt), readAt: readAt ? new Date(readAt) : null };
}

describe("missedWhileAway", () => {
  it("geen vorige login bekend → null (eerste bezoek of pre-feature account)", () => {
    const result = missedWhileAway({
      previousLoginAt: null,
      lastLoginAt: LAST,
      notifications: [notif("2026-06-05T12:00:00.000Z")],
    });
    expect(result).toBeNull();
  });

  it("telt ongelezen meldingen binnen het venster", () => {
    const result = missedWhileAway({
      previousLoginAt: PREV,
      lastLoginAt: LAST,
      notifications: [notif("2026-06-03T12:00:00.000Z"), notif("2026-06-09T12:00:00.000Z")],
    });
    expect(result).toEqual({ from: PREV, count: 2 });
  });

  it("gelezen meldingen tellen niet mee", () => {
    const result = missedWhileAway({
      previousLoginAt: PREV,
      lastLoginAt: LAST,
      notifications: [notif("2026-06-03T12:00:00.000Z", "2026-06-10T09:00:00.000Z")],
    });
    expect(result).toBeNull();
  });

  it("meldingen vóór de vorige login vallen buiten het venster", () => {
    const result = missedWhileAway({
      previousLoginAt: PREV,
      lastLoginAt: LAST,
      notifications: [notif("2026-05-20T12:00:00.000Z")],
    });
    expect(result).toBeNull();
  });

  it("meldingen ná de huidige login zijn niet gemist", () => {
    const result = missedWhileAway({
      previousLoginAt: PREV,
      lastLoginAt: LAST,
      notifications: [notif("2026-06-10T09:00:00.000Z")],
    });
    expect(result).toBeNull();
  });

  it("randwaarden: precies op previousLoginAt telt niet, precies op lastLoginAt wél", () => {
    const result = missedWhileAway({
      previousLoginAt: PREV,
      lastLoginAt: LAST,
      notifications: [notif(PREV.toISOString()), notif(LAST.toISOString())],
    });
    expect(result).toEqual({ from: PREV, count: 1 });
  });

  it("zonder lastLoginAt (defensief) telt alles ná de vorige login", () => {
    const result = missedWhileAway({
      previousLoginAt: PREV,
      lastLoginAt: null,
      notifications: [notif("2026-06-09T12:00:00.000Z")],
    });
    expect(result).toEqual({ from: PREV, count: 1 });
  });

  it("geen ongelezen meldingen in het venster → null (rustige standaard)", () => {
    const result = missedWhileAway({
      previousLoginAt: PREV,
      lastLoginAt: LAST,
      notifications: [],
    });
    expect(result).toBeNull();
  });
});
