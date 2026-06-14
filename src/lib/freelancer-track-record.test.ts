import { describe, expect, it } from "vitest";
import { trackRecordHighlights } from "./freelancer-track-record";

describe("trackRecordHighlights", () => {
  it("geeft lege array bij lege staat (0 samenwerkingen, 0 uur)", () => {
    expect(trackRecordHighlights({ completedCollaborations: 0, approvedHours: 0 })).toEqual([]);
  });

  it("toont enkelvoud 'afgeronde klus' bij precies 1 samenwerking", () => {
    const h = trackRecordHighlights({ completedCollaborations: 1, approvedHours: 0 });
    expect(h).toEqual([{ value: 1, label: "afgeronde klus" }]);
  });

  it("toont meervoud 'afgeronde klussen' bij meerdere samenwerkingen", () => {
    const h = trackRecordHighlights({ completedCollaborations: 5, approvedHours: 0 });
    expect(h).toEqual([{ value: 5, label: "afgeronde klussen" }]);
  });

  it("toont geen uren-highlight als afgeronde uren < 8 (bv. 7.4 → round 7)", () => {
    const h = trackRecordHighlights({ completedCollaborations: 0, approvedHours: 7.4 });
    expect(h).toEqual([]);
  });

  it("toont uren-highlight als afgeronde uren >= 8 (bv. 7.6 → round 8)", () => {
    const h = trackRecordHighlights({ completedCollaborations: 0, approvedHours: 7.6 });
    expect(h).toEqual([{ value: 8, label: "uur gewerkt" }]);
  });

  it("toont beide highlights in volgorde: samenwerkingen eerst, dan uren", () => {
    const h = trackRecordHighlights({ completedCollaborations: 3, approvedHours: 40 });
    expect(h).toEqual([
      { value: 3, label: "afgeronde klussen" },
      { value: 40, label: "uur gewerkt" },
    ]);
  });

  it("rondt uren correct af: 12.5 → 13", () => {
    const h = trackRecordHighlights({ completedCollaborations: 0, approvedHours: 12.5 });
    expect(h).toEqual([{ value: 13, label: "uur gewerkt" }]);
  });

  it("label 'uur gewerkt' is gelijk voor enkelvoud en meervoud (NL)", () => {
    const h8 = trackRecordHighlights({ completedCollaborations: 0, approvedHours: 8 });
    const h100 = trackRecordHighlights({ completedCollaborations: 0, approvedHours: 100 });
    expect(h8[0]?.label).toBe("uur gewerkt");
    expect(h100[0]?.label).toBe("uur gewerkt");
  });
});
