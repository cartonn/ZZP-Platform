import { describe, expect, it } from "vitest";
import { summarizeStaleClientApplications } from "@/lib/stale-applications";
import { WAIT_ATTENTION_DAYS } from "@/lib/application-wait";

const NOW = new Date("2026-07-14T12:00:00Z");

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 86_400_000);
}

describe("summarizeStaleClientApplications", () => {
  it("telt een VIEWED-reactie die de drempel (14 dagen) overschrijdt", () => {
    const summary = summarizeStaleClientApplications(
      [
        {
          status: "VIEWED",
          createdAt: daysAgo(WAIT_ATTENTION_DAYS.VIEWED),
          hasCollaboration: false,
        },
      ],
      NOW,
    );
    expect(summary).toEqual({ count: 1, oldestDays: WAIT_ATTENTION_DAYS.VIEWED });
  });

  it("telt een SHORTLIST-reactie pas vanaf de eigen (hogere) drempel van 21 dagen", () => {
    const justUnder = summarizeStaleClientApplications(
      [{ status: "SHORTLIST", createdAt: daysAgo(20), hasCollaboration: false }],
      NOW,
    );
    expect(justUnder).toBeNull();

    const atThreshold = summarizeStaleClientApplications(
      [
        {
          status: "SHORTLIST",
          createdAt: daysAgo(WAIT_ATTENTION_DAYS.SHORTLIST),
          hasCollaboration: false,
        },
      ],
      NOW,
    );
    expect(atThreshold).toEqual({ count: 1, oldestDays: WAIT_ATTENTION_DAYS.SHORTLIST });
  });

  it("sluit NEW uit — dat dekt de 'nieuwe reacties'-taak al (geen dubbeltelling)", () => {
    const summary = summarizeStaleClientApplications(
      [{ status: "NEW", createdAt: daysAgo(30), hasCollaboration: false }],
      NOW,
    );
    expect(summary).toBeNull();
  });

  it("negeert een nog-verse VIEWED-reactie (onder de drempel)", () => {
    const summary = summarizeStaleClientApplications(
      [{ status: "VIEWED", createdAt: daysAgo(5), hasCollaboration: false }],
      NOW,
    );
    expect(summary).toBeNull();
  });

  it("negeert een reactie waaruit al een samenwerking is voortgekomen (beslissing gevallen)", () => {
    const summary = summarizeStaleClientApplications(
      [{ status: "SHORTLIST", createdAt: daysAgo(40), hasCollaboration: true }],
      NOW,
    );
    expect(summary).toBeNull();
  });

  it("negeert besliste reacties (REJECTED/ACCEPTED/WITHDRAWN)", () => {
    const summary = summarizeStaleClientApplications(
      [
        { status: "REJECTED", createdAt: daysAgo(40), hasCollaboration: false },
        { status: "ACCEPTED", createdAt: daysAgo(40), hasCollaboration: false },
        { status: "WITHDRAWN", createdAt: daysAgo(40), hasCollaboration: false },
      ],
      NOW,
    );
    expect(summary).toBeNull();
  });

  it("aggregeert meerdere kandidaten en rapporteert de langst-wachtende", () => {
    const summary = summarizeStaleClientApplications(
      [
        { status: "VIEWED", createdAt: daysAgo(15), hasCollaboration: false },
        { status: "SHORTLIST", createdAt: daysAgo(30), hasCollaboration: false },
        { status: "VIEWED", createdAt: daysAgo(3), hasCollaboration: false }, // te vers → telt niet
      ],
      NOW,
    );
    expect(summary).toEqual({ count: 2, oldestDays: 30 });
  });

  it("lege input → null", () => {
    expect(summarizeStaleClientApplications([], NOW)).toBeNull();
  });
});
