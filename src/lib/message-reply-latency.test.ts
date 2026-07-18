import { describe, it, expect } from "vitest";
import { summarizeReplyLatency } from "@/lib/message-reply-latency";

const PARTNER = "partner";
const ME = "me";

/** Maakt een bericht op `minutesFromBase` minuten na een vast ankerpunt. */
function at(minutesFromBase: number, senderId: string) {
  return { senderId, createdAt: new Date(1_700_000_000_000 + minutesFromBase * 60_000) };
}

describe("summarizeReplyLatency", () => {
  it("geeft null onder de steekproefgrens (< 2 beantwoorde beurten)", () => {
    // Eén beurt: ik stuur, partner antwoordt — maar één beurt is geen gewoonte.
    const msgs = [at(0, ME), at(30, PARTNER)];
    expect(summarizeReplyLatency(msgs, PARTNER)).toBeNull();
  });

  it("geeft null wanneer de partner nooit antwoordt", () => {
    const msgs = [at(0, ME), at(10, ME), at(20, ME)];
    expect(summarizeReplyLatency(msgs, PARTNER)).toBeNull();
  });

  it("meet de mediane reactietijd over meerdere beurten (bucket 'hour')", () => {
    // Beurt 1: 20 min, beurt 2: 40 min → mediaan 30 min → binnen een uur.
    const msgs = [at(0, ME), at(20, PARTNER), at(100, ME), at(140, PARTNER)];
    const result = summarizeReplyLatency(msgs, PARTNER);
    expect(result).not.toBeNull();
    expect(result!.sampleSize).toBe(2);
    expect(result!.medianMinutes).toBe(30);
    expect(result!.bucket).toBe("hour");
    expect(result!.label).toBe("binnen een uur");
  });

  it("meet vanaf het EERSTE onbeantwoorde bericht van een reeks", () => {
    // Ik stuur op 0 en 60, partner antwoordt op 180 → 180 min sinds het eerste bericht (niet 120).
    // Tweede beurt: 200 min. Mediaan van [180, 200] = 190 min → binnen enkele uren.
    const msgs = [at(0, ME), at(60, ME), at(180, PARTNER), at(300, ME), at(500, PARTNER)];
    const result = summarizeReplyLatency(msgs, PARTNER);
    expect(result!.medianMinutes).toBe(190);
    expect(result!.bucket).toBe("hours");
    expect(result!.label).toBe("binnen enkele uren");
  });

  it("telt opeenvolgende berichten van de partner als één antwoord (één beurt)", () => {
    // Ik (0) → partner antwoordt met 3 berichten (30, 35, 40): dat is één beurt van 30 min.
    // Daarna nog een beurt zodat de steekproef ≥ 2 is.
    const msgs = [
      at(0, ME),
      at(30, PARTNER),
      at(35, PARTNER),
      at(40, PARTNER),
      at(100, ME),
      at(150, PARTNER),
    ];
    const result = summarizeReplyLatency(msgs, PARTNER);
    expect(result!.sampleSize).toBe(2); // 2 beurten, niet 4
    expect(result!.medianMinutes).toBe(40); // mediaan van [30, 50]
  });

  it("classificeert een dag- en dagen-bucket", () => {
    const dayMsgs = [at(0, ME), at(600, PARTNER), at(2000, ME), at(2900, PARTNER)];
    // mediaan van [600, 900] = 750 min (12.5u) → binnen een dag
    expect(summarizeReplyLatency(dayMsgs, PARTNER)!.bucket).toBe("day");

    const twoDays = 2 * 24 * 60;
    const daysMsgs = [
      at(0, ME),
      at(twoDays, PARTNER),
      at(twoDays + 100, ME),
      at(3 * twoDays, PARTNER),
    ];
    expect(summarizeReplyLatency(daysMsgs, PARTNER)!.bucket).toBe("days");
  });

  it("classificeert 'na een week of langer'", () => {
    const eightDays = 8 * 24 * 60;
    const msgs = [
      at(0, ME),
      at(eightDays, PARTNER),
      at(eightDays + 100, ME),
      at(eightDays + 100 + eightDays, PARTNER),
    ];
    const result = summarizeReplyLatency(msgs, PARTNER);
    expect(result!.bucket).toBe("week_plus");
    expect(result!.label).toBe("na een week of langer");
  });

  it("sorteert defensief en negeert negatieve/ruis-tijdverschillen", () => {
    // Ongesorteerde invoer; één beurt met gelijk tijdstip (0 min) telt mee als 0, de andere als 60.
    const msgs = [at(60, PARTNER), at(0, ME), at(120, ME), at(120, PARTNER)];
    const result = summarizeReplyLatency(msgs, PARTNER);
    expect(result).not.toBeNull();
    expect(result!.sampleSize).toBe(2);
    // beurten: [60, 0] → mediaan 30
    expect(result!.medianMinutes).toBe(30);
  });

  it("negeert een openstaand inkomend bericht zonder antwoord (geen halve beurt)", () => {
    // 2 beantwoorde beurten + een laatste inkomend bericht dat nog wacht → sampleSize blijft 2.
    const msgs = [
      at(0, ME),
      at(20, PARTNER),
      at(100, ME),
      at(130, PARTNER),
      at(200, ME), // wacht nog op antwoord
    ];
    const result = summarizeReplyLatency(msgs, PARTNER);
    expect(result!.sampleSize).toBe(2);
  });
});
