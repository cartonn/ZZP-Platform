import { describe, expect, it } from "vitest";
import {
  EXPIRY_HORIZON_DAYS,
  summarizeExpiry,
  type ExpiryCredentialInput,
} from "@/lib/credential-expiry-overview";

const NOW = new Date("2026-06-15T12:00:00.000Z");

function daysFromNow(days: number): Date {
  return new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000);
}

function cred(overrides: Partial<ExpiryCredentialInput> = {}): ExpiryCredentialInput {
  return {
    id: "c1",
    title: "VOG",
    type: "VOG",
    status: "VERIFIED",
    expiresAt: daysFromNow(10),
    ...overrides,
  };
}

describe("summarizeExpiry", () => {
  it("geeft een lege kalender bij geen certificaten", () => {
    const o = summarizeExpiry([], NOW);
    expect(o.total).toBe(0);
    expect(o.items).toEqual([]);
    expect([o.expired, o.within30, o.within60, o.within90]).toEqual([0, 0, 0, 0]);
  });

  it("plaatst een VERIFIED-certificaat in het juiste venster", () => {
    const o = summarizeExpiry(
      [
        cred({ id: "a", type: "VOG", expiresAt: daysFromNow(15) }),
        cred({ id: "b", type: "DIPLOMA", expiresAt: daysFromNow(45) }),
        cred({ id: "c", type: "CERTIFICATE", expiresAt: daysFromNow(75) }),
      ],
      NOW,
    );
    expect(o.within30).toBe(1);
    expect(o.within60).toBe(1);
    expect(o.within90).toBe(1);
    expect(o.total).toBe(3);
  });

  it("negeert certificaten ver buiten de horizon", () => {
    const o = summarizeExpiry([cred({ expiresAt: daysFromNow(EXPIRY_HORIZON_DAYS + 1) })], NOW);
    expect(o.total).toBe(0);
  });

  it("neemt een certificaat exact op de horizon nog mee", () => {
    const o = summarizeExpiry([cred({ expiresAt: daysFromNow(EXPIRY_HORIZON_DAYS) })], NOW);
    expect(o.within90).toBe(1);
    expect(o.total).toBe(1);
  });

  it("behandelt een VERIFIED maar al verstreken vervaldatum als verlopen", () => {
    const o = summarizeExpiry([cred({ status: "VERIFIED", expiresAt: daysFromNow(-2) })], NOW);
    expect(o.expired).toBe(1);
    expect(o.items[0]?.window).toBe("EXPIRED");
    expect(o.items[0]?.days).toBe(-2);
  });

  it("behandelt een EXPIRED-status altijd als verlopen, ook met een datum in de toekomst", () => {
    const o = summarizeExpiry([cred({ status: "EXPIRED", expiresAt: daysFromNow(5) })], NOW);
    expect(o.expired).toBe(1);
    expect(o.items[0]?.window).toBe("EXPIRED");
  });

  it("negeert statussen die niet kunnen verlopen", () => {
    const statuses = ["DRAFT", "SUBMITTED", "REJECTED"] as const;
    for (const status of statuses) {
      const o = summarizeExpiry([cred({ status, expiresAt: daysFromNow(5) })], NOW);
      expect(o.total).toBe(0);
    }
  });

  it("negeert certificaten zonder vervaldatum", () => {
    const o = summarizeExpiry([cred({ expiresAt: null })], NOW);
    expect(o.total).toBe(0);
  });

  it("sorteert meest urgent eerst en breekt gelijke dagen op titel", () => {
    const o = summarizeExpiry(
      [
        cred({ id: "later", type: "VOG", title: "Zeta", expiresAt: daysFromNow(40) }),
        cred({ id: "expired", type: "DIPLOMA", title: "Alpha", expiresAt: daysFromNow(-5) }),
        cred({ id: "tieB", type: "CERTIFICATE", title: "Bravo", expiresAt: daysFromNow(20) }),
        cred({ id: "tieA", type: "INSURANCE", title: "Alfa", expiresAt: daysFromNow(20) }),
      ],
      NOW,
    );
    expect(o.items.map((i) => i.id)).toEqual(["expired", "tieA", "tieB", "later"]);
  });

  it("muteert de invoer niet", () => {
    const input = Object.freeze([cred({ expiresAt: daysFromNow(10) })]);
    expect(() => summarizeExpiry(input, NOW)).not.toThrow();
  });

  describe("onderdrukt gedekte/superseded certificaten (geen valse vernieuw-nudge)", () => {
    it("onderdrukt een binnenkort-vervallend VERIFIED-cert dat door een onbeperkt exemplaar van hetzelfde type is gedekt", () => {
      const o = summarizeExpiry(
        [
          cred({ id: "dated", type: "VOG", expiresAt: daysFromNow(10) }),
          cred({ id: "permanent", type: "VOG", expiresAt: null }),
        ],
        NOW,
      );
      expect(o.total).toBe(0);
    });

    it("onderdrukt het eerder-vervallende exemplaar maar houdt het later-vervallende cover-cert", () => {
      const o = summarizeExpiry(
        [
          cred({ id: "early", type: "VOG", expiresAt: daysFromNow(10) }),
          cred({ id: "late", type: "VOG", expiresAt: daysFromNow(80) }),
        ],
        NOW,
      );
      expect(o.items.map((i) => i.id)).toEqual(["late"]);
      expect(o.within90).toBe(1);
      expect(o.total).toBe(1);
    });

    it("onderdrukt een verlopen exemplaar van een type dat een ander nu-geldig VERIFIED-cert al dekt", () => {
      const o = summarizeExpiry(
        [
          cred({ id: "expired", type: "VOG", status: "EXPIRED", expiresAt: daysFromNow(-5) }),
          cred({ id: "valid", type: "VOG", expiresAt: daysFromNow(200) }), // buiten horizon → geen eigen item
        ],
        NOW,
      );
      expect(o.total).toBe(0);
    });

    it("houdt een verlopen exemplaar zichtbaar als élk exemplaar van dat type verlopen is", () => {
      const o = summarizeExpiry(
        [
          cred({ id: "e1", type: "VOG", status: "EXPIRED", expiresAt: daysFromNow(-5) }),
          cred({ id: "e2", type: "VOG", status: "VERIFIED", expiresAt: daysFromNow(-2) }),
        ],
        NOW,
      );
      // e2 is computed-expired VERIFIED; geen enkel VOG-cert is nu geldig → type niet gedekt.
      expect(o.expired).toBe(2);
      expect(o.total).toBe(2);
    });

    it("onderdrukt het nu-geldige cover-cert zelf niet als dat binnenkort verloopt", () => {
      const o = summarizeExpiry(
        [cred({ id: "solo", type: "VOG", expiresAt: daysFromNow(15) })],
        NOW,
      );
      expect(o.items.map((i) => i.id)).toEqual(["solo"]);
      expect(o.within30).toBe(1);
      expect(o.total).toBe(1);
    });

    it("dekt niet over typegrenzen heen: een ander type onderdrukt niets", () => {
      const o = summarizeExpiry(
        [
          cred({ id: "vog", type: "VOG", expiresAt: daysFromNow(10) }),
          cred({ id: "diploma", type: "DIPLOMA", expiresAt: null }),
        ],
        NOW,
      );
      expect(o.items.map((i) => i.id)).toEqual(["vog"]);
      expect(o.total).toBe(1);
    });
  });
});
