import { describe, it, expect } from "vitest";
import {
  reviewDirection,
  canLeaveReview,
  aggregateReviews,
  reviewInputSchema,
  formatRating,
  reviewWindowCloses,
  reviewWindowOpen,
  isRevealDue,
  DEFAULT_REVIEW_BLIND_DAYS,
  RATING_MIN,
  RATING_MAX,
  REVIEW_COMMENT_MAX,
} from "./reviews";

describe("reviewDirection", () => {
  it("CLIENT geeft CLIENT_ON_FREELANCER", () => {
    expect(reviewDirection("CLIENT")).toBe("CLIENT_ON_FREELANCER");
  });

  it("FREELANCER geeft FREELANCER_ON_CLIENT", () => {
    expect(reviewDirection("FREELANCER")).toBe("FREELANCER_ON_CLIENT");
  });
});

describe("canLeaveReview", () => {
  it("true als COMPLETED + isParticipant + niet beoordeeld", () => {
    expect(
      canLeaveReview({
        collaborationStatus: "COMPLETED",
        isParticipant: true,
        alreadyReviewed: false,
      }),
    ).toBe(true);
  });

  it("false als status ACTIVE", () => {
    expect(
      canLeaveReview({
        collaborationStatus: "ACTIVE",
        isParticipant: true,
        alreadyReviewed: false,
      }),
    ).toBe(false);
  });

  it("false als status PROPOSED", () => {
    expect(
      canLeaveReview({
        collaborationStatus: "PROPOSED",
        isParticipant: true,
        alreadyReviewed: false,
      }),
    ).toBe(false);
  });

  it("false als status CANCELLED", () => {
    expect(
      canLeaveReview({
        collaborationStatus: "CANCELLED",
        isParticipant: true,
        alreadyReviewed: false,
      }),
    ).toBe(false);
  });

  it("false als isParticipant false (COMPLETED)", () => {
    expect(
      canLeaveReview({
        collaborationStatus: "COMPLETED",
        isParticipant: false,
        alreadyReviewed: false,
      }),
    ).toBe(false);
  });

  it("false als alreadyReviewed true (COMPLETED + deelnemer)", () => {
    expect(
      canLeaveReview({
        collaborationStatus: "COMPLETED",
        isParticipant: true,
        alreadyReviewed: true,
      }),
    ).toBe(false);
  });

  it("false als isParticipant false én alreadyReviewed true", () => {
    expect(
      canLeaveReview({
        collaborationStatus: "COMPLETED",
        isParticipant: false,
        alreadyReviewed: true,
      }),
    ).toBe(false);
  });

  it("false als ACTIVE + isParticipant false + alreadyReviewed false", () => {
    expect(
      canLeaveReview({
        collaborationStatus: "ACTIVE",
        isParticipant: false,
        alreadyReviewed: false,
      }),
    ).toBe(false);
  });

  it("false als het venster gesloten is (double-blind: geen vergelding na onthulling)", () => {
    expect(
      canLeaveReview({
        collaborationStatus: "COMPLETED",
        isParticipant: true,
        alreadyReviewed: false,
        windowClosed: true,
      }),
    ).toBe(false);
  });

  it("true als venster expliciet open (windowClosed false)", () => {
    expect(
      canLeaveReview({
        collaborationStatus: "COMPLETED",
        isParticipant: true,
        alreadyReviewed: false,
        windowClosed: false,
      }),
    ).toBe(true);
  });

  it("windowClosed weggelaten = venster open (gedocumenteerd contract; actie blijft server-side gate)", () => {
    // De optionele windowClosed defaultet naar 'open'. De serveractie hercontroleert het venster
    // hoe dan ook (reviewWindowOpen), dus dit is alleen de UI-gate — geen autorisatiebeslissing.
    expect(
      canLeaveReview({
        collaborationStatus: "COMPLETED",
        isParticipant: true,
        alreadyReviewed: false,
      }),
    ).toBe(true);
  });
});

describe("reviewWindowCloses", () => {
  it("anker + blinde dagen", () => {
    const anchor = new Date("2026-06-01T00:00:00.000Z");
    expect(reviewWindowCloses(anchor, 14).toISOString()).toBe("2026-06-15T00:00:00.000Z");
  });

  it("gebruikt de standaard blinde dagen als getal", () => {
    const anchor = new Date("2026-06-01T12:00:00.000Z");
    const close = reviewWindowCloses(anchor, DEFAULT_REVIEW_BLIND_DAYS);
    expect(close.getTime() - anchor.getTime()).toBe(DEFAULT_REVIEW_BLIND_DAYS * 86_400_000);
  });
});

describe("reviewWindowOpen", () => {
  const close = new Date("2026-06-15T00:00:00.000Z");
  it("open vóór sluiting", () => {
    expect(reviewWindowOpen(close, new Date("2026-06-14T23:59:59.000Z"))).toBe(true);
  });
  it("open op het sluitmoment (inclusief)", () => {
    expect(reviewWindowOpen(close, new Date("2026-06-15T00:00:00.000Z"))).toBe(true);
  });
  it("dicht ná sluiting", () => {
    expect(reviewWindowOpen(close, new Date("2026-06-15T00:00:01.000Z"))).toBe(false);
  });
});

describe("isRevealDue", () => {
  const now = new Date("2026-06-15T00:00:00.000Z");
  it("true: PENDING_REVEAL met verstreken venster", () => {
    expect(isRevealDue("PENDING_REVEAL", new Date("2026-06-14T00:00:00.000Z"), now)).toBe(true);
  });
  it("true: deadline exact nu (inclusief)", () => {
    expect(isRevealDue("PENDING_REVEAL", now, now)).toBe(true);
  });
  it("false: venster nog niet verstreken", () => {
    expect(isRevealDue("PENDING_REVEAL", new Date("2026-06-16T00:00:00.000Z"), now)).toBe(false);
  });
  it("false: al PUBLISHED (nooit dubbel onthullen)", () => {
    expect(isRevealDue("PUBLISHED", new Date("2026-06-01T00:00:00.000Z"), now)).toBe(false);
  });
});

describe("aggregateReviews", () => {
  it("lege invoer geeft count 0, average 0, alle distribution-waarden 0", () => {
    const result = aggregateReviews([]);
    expect(result.count).toBe(0);
    expect(result.average).toBe(0);
    expect(result.distribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  });

  it("bekende set [5,4,4,3] geeft count 4, average 4.0, juiste distribution", () => {
    const result = aggregateReviews([{ rating: 5 }, { rating: 4 }, { rating: 4 }, { rating: 3 }]);
    expect(result.count).toBe(4);
    expect(result.average).toBe(4.0);
    expect(result.distribution).toEqual({ 1: 0, 2: 0, 3: 1, 4: 2, 5: 1 });
  });

  it("afrondingsgeval [5,4,4] geeft average 4.3", () => {
    const result = aggregateReviews([{ rating: 5 }, { rating: 4 }, { rating: 4 }]);
    expect(result.count).toBe(3);
    // Math.round(13/3 * 10) / 10 = Math.round(43.33...) / 10 = 43/10 = 4.3
    expect(result.average).toBe(4.3);
  });

  it("rating 0 wordt genegeerd in distribution", () => {
    const result = aggregateReviews([{ rating: 0 }, { rating: 3 }]);
    expect(result.count).toBe(1);
    expect(result.distribution[0 as unknown as 1]).toBeUndefined();
    expect(result.distribution[3]).toBe(1);
  });

  it("rating 6 wordt genegeerd in distribution", () => {
    const result = aggregateReviews([{ rating: 6 }, { rating: 2 }]);
    expect(result.count).toBe(1);
    expect(result.distribution[2]).toBe(1);
    expect(result.distribution[6 as unknown as 5]).toBeUndefined();
  });

  it("uitsluitend ongeldige ratings geeft count 0 en average 0", () => {
    const result = aggregateReviews([{ rating: 0 }, { rating: 6 }]);
    expect(result.count).toBe(0);
    expect(result.average).toBe(0);
    expect(result.distribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  });

  it("alle 5 sleutels aanwezig bij gedeeltelijke distribution", () => {
    const result = aggregateReviews([{ rating: 5 }]);
    expect(Object.keys(result.distribution)).toHaveLength(5);
    expect(result.distribution[1]).toBe(0);
    expect(result.distribution[2]).toBe(0);
    expect(result.distribution[3]).toBe(0);
    expect(result.distribution[4]).toBe(0);
    expect(result.distribution[5]).toBe(1);
  });
});

describe("reviewInputSchema", () => {
  it("geldige invoer {rating: '4', comment: ' hoi '} => {rating: 4, comment: 'hoi'}", () => {
    const result = reviewInputSchema.safeParse({
      rating: "4",
      comment: " hoi ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rating).toBe(4);
      expect(result.data.comment).toBe("hoi");
    }
  });

  it("lege comment '' wordt undefined", () => {
    const result = reviewInputSchema.safeParse({ rating: 3, comment: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.comment).toBeUndefined();
    }
  });

  it("whitespace-only comment wordt undefined", () => {
    const result = reviewInputSchema.safeParse({ rating: 3, comment: "   " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.comment).toBeUndefined();
    }
  });

  it("ontbrekende comment => comment undefined", () => {
    const result = reviewInputSchema.safeParse({ rating: 5 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.comment).toBeUndefined();
    }
  });

  it("rating '0' wordt afgewezen (onder minimum)", () => {
    const result = reviewInputSchema.safeParse({ rating: "0" });
    expect(result.success).toBe(false);
  });

  it("rating '6' wordt afgewezen (boven maximum)", () => {
    const result = reviewInputSchema.safeParse({ rating: "6" });
    expect(result.success).toBe(false);
  });

  it("rating '3.5' wordt afgewezen (geen geheel getal)", () => {
    const result = reviewInputSchema.safeParse({ rating: "3.5" });
    expect(result.success).toBe(false);
  });

  it(`comment langer dan ${REVIEW_COMMENT_MAX} tekens wordt afgewezen`, () => {
    const result = reviewInputSchema.safeParse({
      rating: 3,
      comment: "x".repeat(REVIEW_COMMENT_MAX + 1),
    });
    expect(result.success).toBe(false);
  });

  it(`comment van exact ${REVIEW_COMMENT_MAX} tekens is geldig`, () => {
    const result = reviewInputSchema.safeParse({
      rating: 3,
      comment: "x".repeat(REVIEW_COMMENT_MAX),
    });
    expect(result.success).toBe(true);
  });

  it(`rating ${RATING_MIN} is geldig (ondergrens)`, () => {
    const result = reviewInputSchema.safeParse({ rating: RATING_MIN });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rating).toBe(RATING_MIN);
    }
  });

  it(`rating ${RATING_MAX} is geldig (bovengrens)`, () => {
    const result = reviewInputSchema.safeParse({ rating: RATING_MAX });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rating).toBe(RATING_MAX);
    }
  });
});

describe("formatRating", () => {
  it("4.7 => '4,7'", () => {
    expect(formatRating(4.7)).toBe("4,7");
  });

  it("5 => '5,0'", () => {
    expect(formatRating(5)).toBe("5,0");
  });

  it("0 => '0,0'", () => {
    expect(formatRating(0)).toBe("0,0");
  });

  it("1 => '1,0'", () => {
    expect(formatRating(1)).toBe("1,0");
  });

  it("3.3 => '3,3'", () => {
    expect(formatRating(3.3)).toBe("3,3");
  });
});
