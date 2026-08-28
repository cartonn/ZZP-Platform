import { describe, it, expect } from "vitest";
import {
  summarizeCandidateInviteResponsiveness,
  MIN_INVITES,
  type InviteResponse,
} from "./candidate-invite-responsiveness";

const MIN = 60_000; // ms per minuut
const at = (base: Date, minutes: number) => new Date(base.getTime() + minutes * MIN);

/** Bouwt een uitnodiging met een reactie N minuten later (of geen reactie). */
function invite(invitedAt: Date, respondMinutes: number | null): InviteResponse {
  return { invitedAt, respondedAt: respondMinutes === null ? null : at(invitedAt, respondMinutes) };
}

const base = new Date("2026-08-01T09:00:00.000Z");

describe("summarizeCandidateInviteResponsiveness", () => {
  it("toont geen badge onder de minimum-steekproef", () => {
    const responses = Array.from({ length: MIN_INVITES - 1 }, () => invite(base, 30));
    const r = summarizeCandidateInviteResponsiveness(responses);
    expect(r.invited).toBe(MIN_INVITES - 1);
    expect(r.fast).toBe(false);
    expect(r.label).toBeNull();
    expect(r.detail).toBeNull();
  });

  it("markeert een snelle, betrouwbare reageerder als fast (binnen een uur)", () => {
    const responses = [invite(base, 10), invite(base, 20), invite(base, 30), invite(base, 40)];
    const r = summarizeCandidateInviteResponsiveness(responses);
    expect(r.invited).toBe(4);
    expect(r.responded).toBe(4);
    expect(r.medianMinutes).toBe(25);
    expect(r.fast).toBe(true);
    expect(r.label).toBe("Reageert snel op uitnodigingen");
    expect(r.detail).toContain("4 van de 4");
    expect(r.detail).toContain("binnen een uur");
  });

  it("labelt de mediane bucket als 'binnen enkele uren' en 'binnen een dag'", () => {
    const uren = summarizeCandidateInviteResponsiveness([
      invite(base, 120),
      invite(base, 180),
      invite(base, 240),
    ]);
    expect(uren.fast).toBe(true);
    expect(uren.detail).toContain("binnen enkele uren");

    const dag = summarizeCandidateInviteResponsiveness([
      invite(base, 600),
      invite(base, 700),
      invite(base, 800),
    ]);
    expect(dag.fast).toBe(true);
    expect(dag.detail).toContain("binnen een dag");
  });

  it("is niet fast wanneer de mediaan boven een dag ligt", () => {
    const responses = [invite(base, 2000), invite(base, 2100), invite(base, 2200)];
    const r = summarizeCandidateInviteResponsiveness(responses);
    expect(r.responded).toBe(3);
    expect(r.medianMinutes).toBe(2100);
    expect(r.fast).toBe(false);
    expect(r.label).toBeNull();
  });

  it("is niet fast wanneer de responsgraad onder de meerderheid ligt", () => {
    // 4 uitnodigingen, slechts 1 snelle reactie → 25% < 60%.
    const responses = [
      invite(base, 15),
      invite(base, null),
      invite(base, null),
      invite(base, null),
    ];
    const r = summarizeCandidateInviteResponsiveness(responses);
    expect(r.invited).toBe(4);
    expect(r.responded).toBe(1);
    expect(r.fast).toBe(false);
  });

  it("telt een reactie vóór de uitnodiging (negatieve tijd) niet als reactie", () => {
    const responses = [
      { invitedAt: base, respondedAt: at(base, -30) },
      invite(base, 20),
      invite(base, 25),
    ];
    const r = summarizeCandidateInviteResponsiveness(responses);
    expect(r.invited).toBe(3);
    // De negatieve wordt niet meegeteld → 2 van 3 = 66% ≥ 60%, mediaan snel → fast.
    expect(r.responded).toBe(2);
    expect(r.fast).toBe(true);
  });

  it("op de grens: precies 60% responsgraad en mediaan op een dag telt als fast", () => {
    // 5 uitnodigingen, 3 reacties (60%), medianen binnen de dag.
    const responses = [
      invite(base, 100),
      invite(base, 200),
      invite(base, 300),
      invite(base, null),
      invite(base, null),
    ];
    const r = summarizeCandidateInviteResponsiveness(responses);
    expect(r.responded).toBe(3);
    expect(r.medianMinutes).toBe(200);
    expect(r.fast).toBe(true);
  });

  it("lege invoer geeft een leeg, niet-fast signaal", () => {
    const r = summarizeCandidateInviteResponsiveness([]);
    expect(r.invited).toBe(0);
    expect(r.responded).toBe(0);
    expect(r.medianMinutes).toBeNull();
    expect(r.fast).toBe(false);
    expect(r.label).toBeNull();
  });
});
