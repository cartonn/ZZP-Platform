import { describe, expect, it } from "vitest";
import { EXPIRY_REMINDER_WINDOW_DAYS, planExpiryRun, type ExpiryCandidate } from "@/lib/expiry";

// Vaste referentiedatum voor deterministische tests.
const now = new Date("2026-05-25T12:00:00Z");

/** Helper om snel een testkandidate te maken met sensible defaults. */
function makeCandidate(
  overrides: Partial<ExpiryCandidate> & Pick<ExpiryCandidate, "id">,
): ExpiryCandidate {
  return {
    status: "VERIFIED",
    expiresAt: null,
    expiryReminderFor: null,
    title: `Certificaat ${overrides.id}`,
    userId: `user-${overrides.id}`,
    ...overrides,
  };
}

describe("planExpiryRun", () => {
  // 1. VERIFIED credential met vervaldatum in het verleden → toExpire, niet toRemind.
  it("plaatst een verlopen VERIFIED credential in toExpire", () => {
    const candidate = makeCandidate({
      id: "c1",
      status: "VERIFIED",
      expiresAt: new Date("2026-01-15T00:00:00Z"), // ver in het verleden
    });

    const plan = planExpiryRun([candidate], now);

    expect(plan.toExpire).toHaveLength(1);
    expect(plan.toExpire.at(0)?.id).toBe("c1");
    expect(plan.toRemind).toHaveLength(0);
  });

  // 2. VERIFIED credential die binnen 30 dagen verloopt, nog geen herinnering → toRemind.
  it("plaatst een bijna-verlopen credential zonder herinnering in toRemind", () => {
    // 16 dagen na now
    const expiresAt = new Date("2026-06-10T12:00:00Z");
    const candidate = makeCandidate({
      id: "c2",
      status: "VERIFIED",
      expiresAt,
      expiryReminderFor: null,
    });

    const plan = planExpiryRun([candidate], now);

    expect(plan.toRemind).toHaveLength(1);
    const item = plan.toRemind.at(0);
    expect(item?.id).toBe("c2");
    expect(item?.expiresAt).toEqual(expiresAt);
    expect(item?.daysLeft).toBe(16);
    expect(plan.toExpire).toHaveLength(0);
  });

  // 3. Dedup: expiryReminderFor gelijk aan expiresAt → NIET in toRemind.
  it("slaat een herinnering over als expiryReminderFor overeenkomt met expiresAt", () => {
    const expiresAt = new Date("2026-06-10T12:00:00Z");
    const candidate = makeCandidate({
      id: "c3",
      status: "VERIFIED",
      expiresAt,
      expiryReminderFor: expiresAt, // zelfde object-tijdstip = al herinnerd
    });

    const plan = planExpiryRun([candidate], now);

    expect(plan.toRemind).toHaveLength(0);
    expect(plan.toExpire).toHaveLength(0);
  });

  // 4. Hernieuwd herinneren: expiryReminderFor verwijst naar een oudere datum,
  //    huidige expiresAt is anders → WEL opnieuw herinneren.
  it("herinnert opnieuw als expiryReminderFor een andere datum heeft dan expiresAt", () => {
    const expiresAt = new Date("2026-06-10T12:00:00Z");
    const oldReminderDate = new Date("2025-12-31T00:00:00Z"); // vorig jaar, andere datum
    const candidate = makeCandidate({
      id: "c4",
      status: "VERIFIED",
      expiresAt,
      expiryReminderFor: oldReminderDate,
    });

    const plan = planExpiryRun([candidate], now);

    expect(plan.toRemind).toHaveLength(1);
    expect(plan.toRemind.at(0)?.id).toBe("c4");
  });

  // 5. VERIFIED credential die ver in de toekomst verloopt (200 dagen) → geen van beide.
  it("raakt een credential die ver in de toekomst verloopt niet aan", () => {
    const expiresAt = new Date("2026-12-11T12:00:00Z"); // ~200 dagen na now
    const candidate = makeCandidate({
      id: "c5",
      status: "VERIFIED",
      expiresAt,
    });

    const plan = planExpiryRun([candidate], now);

    expect(plan.toExpire).toHaveLength(0);
    expect(plan.toRemind).toHaveLength(0);
  });

  // 6. Niet-VERIFIED statussen met een verlopen of bijna-verlopen datum → geen van beide.
  it("negeert niet-VERIFIED credentials ongeacht de vervaldatum", () => {
    const past = new Date("2026-01-01T00:00:00Z");
    const soon = new Date("2026-06-05T12:00:00Z");

    const candidates: ExpiryCandidate[] = [
      makeCandidate({ id: "s1", status: "SUBMITTED", expiresAt: past }),
      makeCandidate({ id: "s2", status: "DRAFT", expiresAt: past }),
      makeCandidate({ id: "s3", status: "REJECTED", expiresAt: soon }),
      makeCandidate({ id: "s4", status: "EXPIRED", expiresAt: past }),
    ];

    const plan = planExpiryRun(candidates, now);

    expect(plan.toExpire).toHaveLength(0);
    expect(plan.toRemind).toHaveLength(0);
  });

  // 7. Al-verlopen credential staat in toExpire en NIET in toRemind (wederzijdse uitsluiting).
  it("plaatst een verlopen credential uitsluitend in toExpire, nooit ook in toRemind", () => {
    // Verlopen, maar toch expiryReminderFor = null (zou normaal niet voor komen,
    // maar logisch bewijs van wederzijdse uitsluiting).
    const candidate = makeCandidate({
      id: "c7",
      status: "VERIFIED",
      expiresAt: new Date("2026-05-01T00:00:00Z"), // 24 dagen geleden
      expiryReminderFor: null,
    });

    const plan = planExpiryRun([candidate], now);

    const expireIds = plan.toExpire.map((x) => x.id);
    expect(expireIds).toContain("c7");
    expect(plan.toRemind.map((x) => x.id)).not.toContain("c7");
  });

  // 8. Gemengde batch → correcte partitionering (aantallen + ids).
  it("verdeelt een gemengde batch correct", () => {
    const past = new Date("2026-01-01T00:00:00Z");
    const soon = new Date("2026-06-10T12:00:00Z"); // 16 dagen
    const far = new Date("2026-12-31T00:00:00Z"); // ~220 dagen
    const soonDedup = new Date("2026-06-10T12:00:00Z"); // zelfde als soon

    const candidates: ExpiryCandidate[] = [
      // Moet verlopen
      makeCandidate({ id: "exp1", status: "VERIFIED", expiresAt: past }),
      makeCandidate({
        id: "exp2",
        status: "VERIFIED",
        expiresAt: new Date("2026-03-01T00:00:00Z"),
      }),
      // Moet herinnerd worden
      makeCandidate({ id: "rem1", status: "VERIFIED", expiresAt: soon, expiryReminderFor: null }),
      // Dedup: al herinnerd voor dezelfde datum
      makeCandidate({
        id: "dup1",
        status: "VERIFIED",
        expiresAt: soonDedup,
        expiryReminderFor: soonDedup,
      }),
      // Ver weg: niets doen
      makeCandidate({ id: "far1", status: "VERIFIED", expiresAt: far }),
      // Geen vervaldatum: niets doen
      makeCandidate({ id: "nul1", status: "VERIFIED", expiresAt: null }),
      // Niet-VERIFIED: niets doen
      makeCandidate({ id: "sub1", status: "SUBMITTED", expiresAt: past }),
    ];

    const plan = planExpiryRun(candidates, now);

    expect(plan.toExpire).toHaveLength(2);
    expect(plan.toExpire.map((x) => x.id).sort()).toEqual(["exp1", "exp2"]);

    expect(plan.toRemind).toHaveLength(1);
    expect(plan.toRemind.at(0)?.id).toBe("rem1");
    expect(plan.toRemind.at(0)?.daysLeft).toBe(16);
  });

  // Controleer dat de geëxporteerde constante de verwachte waarde heeft.
  it("exporteert EXPIRY_REMINDER_WINDOW_DAYS als 30", () => {
    expect(EXPIRY_REMINDER_WINDOW_DAYS).toBe(30);
  });

  // windowDays-parameter overschrijft het standaard venster.
  it("respecteert een aangepast windowDays-argument", () => {
    // Credential verloopt over 10 dagen; standaard venster (30) zou het herinneren,
    // een venster van 7 dagen niet.
    const expiresAt = new Date("2026-06-04T12:00:00Z"); // 10 dagen na now
    const candidate = makeCandidate({ id: "w1", status: "VERIFIED", expiresAt });

    const planSmall = planExpiryRun([candidate], now, 7);
    expect(planSmall.toRemind).toHaveLength(0);

    const planDefault = planExpiryRun([candidate], now);
    expect(planDefault.toRemind).toHaveLength(1);
  });
});
