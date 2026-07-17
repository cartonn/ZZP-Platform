import { describe, it, expect } from "vitest";
import { reviewPromptForCollaboration } from "@/lib/collaboration-review-prompt";

const BLIND = 14;
// Anker: 2 dagen geleden afgerond → venster sluit over 12 dagen (14 - 2).
const now = new Date("2026-07-17T12:00:00.000Z");
const anchor2dAgo = new Date("2026-07-15T12:00:00.000Z");

describe("reviewPromptForCollaboration", () => {
  it("geeft daysLeft voor een afgeronde, nog-niet-beoordeelde samenwerking binnen het venster", () => {
    const r = reviewPromptForCollaboration({
      collaborationStatus: "COMPLETED",
      completionAnchor: anchor2dAgo,
      alreadyReviewedByActor: false,
      blindDays: BLIND,
      now,
    });
    expect(r).not.toBeNull();
    expect(r!.daysLeft).toBe(12);
  });

  it("null zodra de actor al beoordeeld heeft", () => {
    expect(
      reviewPromptForCollaboration({
        collaborationStatus: "COMPLETED",
        completionAnchor: anchor2dAgo,
        alreadyReviewedByActor: true,
        blindDays: BLIND,
        now,
      }),
    ).toBeNull();
  });

  it("null voor een niet-afgeronde samenwerking (ACTIVE/PROPOSED/CANCELLED)", () => {
    for (const status of ["ACTIVE", "PROPOSED", "CANCELLED"]) {
      expect(
        reviewPromptForCollaboration({
          collaborationStatus: status,
          completionAnchor: anchor2dAgo,
          alreadyReviewedByActor: false,
          blindDays: BLIND,
          now,
        }),
      ).toBeNull();
    }
  });

  it("null zodra het blinde venster gesloten is", () => {
    const anchorLongAgo = new Date("2026-06-01T12:00:00.000Z"); // ruim > 14 dagen geleden
    expect(
      reviewPromptForCollaboration({
        collaborationStatus: "COMPLETED",
        completionAnchor: anchorLongAgo,
        alreadyReviewedByActor: false,
        blindDays: BLIND,
        now,
      }),
    ).toBeNull();
  });

  it("daysLeft = 0 op de laatste dag (sluit vandaag, venster nog net open)", () => {
    // Anker exact 14 dagen geleden → windowCloses == now → nog open (inclusief), 0 dagen resterend.
    const anchorExactly14dAgo = new Date(now.getTime() - BLIND * 24 * 60 * 60 * 1000);
    const r = reviewPromptForCollaboration({
      collaborationStatus: "COMPLETED",
      completionAnchor: anchorExactly14dAgo,
      alreadyReviewedByActor: false,
      blindDays: BLIND,
      now,
    });
    expect(r).not.toBeNull();
    expect(r!.daysLeft).toBe(0);
  });

  it("rondt resterende dagen naar boven af (deel-dag telt als hele dag)", () => {
    // Anker 1,5 dag geleden → venster sluit over 12,5 dag → ceil = 13.
    const anchor = new Date(now.getTime() - 1.5 * 24 * 60 * 60 * 1000);
    const r = reviewPromptForCollaboration({
      collaborationStatus: "COMPLETED",
      completionAnchor: anchor,
      alreadyReviewedByActor: false,
      blindDays: BLIND,
      now,
    });
    expect(r!.daysLeft).toBe(13);
  });
});
