// Unit-tests voor planNotificationDigests — bundeling van ongelezen notificaties per gebruiker.

import { describe, it, expect } from "vitest";
import {
  planNotificationDigests,
  MAX_TITLES_PER_CATEGORY,
  type DigestCandidate,
} from "@/lib/notification-digest";

const NOW = new Date("2026-06-10T12:00:00.000Z");

function candidate(overrides: Partial<DigestCandidate> & { id: string }): DigestCandidate {
  return {
    userId: "u-1",
    type: "PAYMENT_REMINDER",
    title: `Melding ${overrides.id}`,
    createdAt: new Date("2026-06-08T12:00:00.000Z"), // 48 uur oud — ruim over de drempel
    ...overrides,
  };
}

describe("planNotificationDigests", () => {
  it("lege invoer → geen digests", () => {
    expect(planNotificationDigests([], NOW)).toEqual({ digests: [] });
  });

  it("notificaties jonger dan de drempel worden overgeslagen", () => {
    const fresh = candidate({ id: "n-1", createdAt: new Date("2026-06-10T06:00:00.000Z") }); // 6u
    expect(planNotificationDigests([fresh], NOW).digests).toHaveLength(0);
  });

  it("notificatie precies op de drempel telt mee", () => {
    const onEdge = candidate({ id: "n-1", createdAt: new Date("2026-06-09T12:00:00.000Z") }); // 24u
    expect(planNotificationDigests([onEdge], NOW).digests).toHaveLength(1);
  });

  it("groepeert per gebruiker — één digest per gebruiker met alle ids", () => {
    const { digests } = planNotificationDigests(
      [
        candidate({ id: "n-1", userId: "u-1" }),
        candidate({ id: "n-2", userId: "u-2" }),
        candidate({ id: "n-3", userId: "u-1" }),
      ],
      NOW,
    );
    expect(digests).toHaveLength(2);
    const u1 = digests.find((d) => d.userId === "u-1")!;
    expect(u1.count).toBe(2);
    expect(u1.notificationIds).toEqual(expect.arrayContaining(["n-1", "n-3"]));
  });

  it("groepeert per categorie met NL-label en vaste volgorde (workflow vóór payment)", () => {
    const { digests } = planNotificationDigests(
      [
        candidate({ id: "n-1", type: "PAYMENT_OVERDUE" }),
        candidate({ id: "n-2", type: "PERFORMANCE_SUBMITTED" }),
      ],
      NOW,
    );
    const lines = digests[0]!.lines;
    expect(lines.map((l) => l.category)).toEqual(["workflow", "payment"]);
    expect(lines.map((l) => l.label)).toEqual(["Werkproces", "Betalingen"]);
  });

  it("onbekend type valt terug op categorie 'system'", () => {
    const { digests } = planNotificationDigests(
      [candidate({ id: "n-1", type: "ONBEKEND_TYPE" })],
      NOW,
    );
    expect(digests[0]!.lines[0]!.category).toBe("system");
    expect(digests[0]!.lines[0]!.label).toBe("Overig");
  });

  it("kapt voorbeeldtitels af op het maximum; count behoudt het totaal", () => {
    const many = Array.from({ length: MAX_TITLES_PER_CATEGORY + 2 }, (_, i) =>
      candidate({ id: `n-${i}`, title: `Titel ${i}` }),
    );
    const line = planNotificationDigests(many, NOW).digests[0]!.lines[0]!;
    expect(line.count).toBe(MAX_TITLES_PER_CATEGORY + 2);
    expect(line.titles).toHaveLength(MAX_TITLES_PER_CATEGORY);
  });

  it("titels staan nieuwste eerst", () => {
    const { digests } = planNotificationDigests(
      [
        candidate({ id: "oud", title: "Oud", createdAt: new Date("2026-06-01T00:00:00.000Z") }),
        candidate({ id: "nieuw", title: "Nieuw", createdAt: new Date("2026-06-08T00:00:00.000Z") }),
      ],
      NOW,
    );
    expect(digests[0]!.lines[0]!.titles).toEqual(["Nieuw", "Oud"]);
  });

  it("dedupeKey is deterministisch en gebaseerd op de nieuwste notificatie", () => {
    const input = [
      candidate({ id: "oud", createdAt: new Date("2026-06-01T00:00:00.000Z") }),
      candidate({ id: "nieuw", createdAt: new Date("2026-06-08T00:00:00.000Z") }),
    ];
    const a = planNotificationDigests(input, NOW).digests[0]!;
    const b = planNotificationDigests(input, NOW).digests[0]!;
    expect(a.dedupeKey).toBe("notification-digest-u-1-nieuw");
    expect(b.dedupeKey).toBe(a.dedupeKey);
  });
});
