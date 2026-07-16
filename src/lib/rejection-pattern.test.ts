import { describe, expect, it } from "vitest";
import {
  REJECTION_PATTERN_MIN_COUNT,
  summarizeRejectionPattern,
  type RejectionPatternInput,
} from "@/lib/rejection-pattern";

function rejected(reason: string | null): RejectionPatternInput {
  return { status: "REJECTED", rejectionReason: reason };
}

describe("summarizeRejectionPattern", () => {
  it("geeft null bij minder afwijzingen dan de drempel", () => {
    expect(summarizeRejectionPattern([rejected("RATE_TOO_HIGH")])).toBeNull();
  });

  it("herkent de dominante, actiegerichte reden vanaf de drempel", () => {
    const result = summarizeRejectionPattern([
      rejected("RATE_TOO_HIGH"),
      rejected("RATE_TOO_HIGH"),
      rejected("LOCATION"),
    ]);
    expect(result).not.toBeNull();
    expect(result?.code).toBe("RATE_TOO_HIGH");
    expect(result?.label).toBe("Tarief boven budget");
    expect(result?.count).toBe(2);
    expect(result?.totalWithReason).toBe(3);
    expect(result?.advice.length).toBeGreaterThan(0);
  });

  it("negeert niet-REJECTED reacties, ook als ze een reden dragen", () => {
    const result = summarizeRejectionPattern([
      { status: "VIEWED", rejectionReason: "RATE_TOO_HIGH" },
      { status: "SHORTLIST", rejectionReason: "RATE_TOO_HIGH" },
      rejected("RATE_TOO_HIGH"),
    ]);
    expect(result).toBeNull();
  });

  it("telt OTHER, onbekende en lege redenen niet mee", () => {
    expect(
      summarizeRejectionPattern([
        rejected("OTHER"),
        rejected("OTHER"),
        rejected(null),
        rejected("ONZIN_CODE"),
      ]),
    ).toBeNull();
  });

  it("toont geen patroon als geen enkele reden de drempel haalt (versnipperd)", () => {
    const result = summarizeRejectionPattern([
      rejected("RATE_TOO_HIGH"),
      rejected("LOCATION"),
      rejected("AVAILABILITY"),
    ]);
    expect(result).toBeNull();
  });

  it("kiest de meest genoemde actiegerichte reden en negeert een groter OTHER-blok", () => {
    const result = summarizeRejectionPattern([
      rejected("OTHER"),
      rejected("OTHER"),
      rejected("OTHER"),
      rejected("EXPERIENCE_MISMATCH"),
      rejected("EXPERIENCE_MISMATCH"),
    ]);
    expect(result?.code).toBe("EXPERIENCE_MISMATCH");
    expect(result?.count).toBe(2);
    // OTHER telt niet mee in de noemer.
    expect(result?.totalWithReason).toBe(2);
  });

  it("respecteert een aangepaste drempel", () => {
    const apps = [rejected("AVAILABILITY"), rejected("AVAILABILITY"), rejected("AVAILABILITY")];
    expect(summarizeRejectionPattern(apps, 4)).toBeNull();
    expect(summarizeRejectionPattern(apps, 3)?.count).toBe(3);
  });

  it("gebruikt REJECTION_PATTERN_MIN_COUNT als standaarddrempel", () => {
    const apps = Array.from({ length: REJECTION_PATTERN_MIN_COUNT }, () => rejected("LOCATION"));
    expect(summarizeRejectionPattern(apps)?.code).toBe("LOCATION");
  });
});
