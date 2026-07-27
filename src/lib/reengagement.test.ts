import { describe, expect, it } from "vitest";
import { pickReengagementAnchor, type ReengagementReaction } from "@/lib/reengagement";

function reaction(over: Partial<ReengagementReaction>): ReengagementReaction {
  return {
    status: "REJECTED",
    hasCollaboration: false,
    jobId: "job-1",
    jobTitle: "Opdracht 1",
    ...over,
  };
}

describe("pickReengagementAnchor", () => {
  it("verankert op de meest recente afgewezen reactie zonder samenwerking", () => {
    const anchor = pickReengagementAnchor([
      reaction({ status: "NEW", jobId: "job-a", jobTitle: "A" }),
      reaction({ status: "REJECTED", jobId: "job-b", jobTitle: "B" }),
      reaction({ status: "REJECTED", jobId: "job-c", jobTitle: "C" }),
    ]);
    // Invoer is nieuw→oud: de eerste REJECTED-treffer wint.
    expect(anchor).toEqual({ jobId: "job-b", jobTitle: "B" });
  });

  it("geeft null wanneer er geen afgewezen reactie is", () => {
    const anchor = pickReengagementAnchor([
      reaction({ status: "NEW" }),
      reaction({ status: "VIEWED" }),
      reaction({ status: "SHORTLIST" }),
      reaction({ status: "ACCEPTED" }),
      reaction({ status: "WITHDRAWN" }),
    ]);
    expect(anchor).toBeNull();
  });

  it("negeert een afwijzing waar een samenwerking uit voortkwam", () => {
    const anchor = pickReengagementAnchor([
      reaction({ status: "REJECTED", hasCollaboration: true, jobId: "job-x" }),
    ]);
    expect(anchor).toBeNull();
  });

  it("slaat een afwijzing-met-samenwerking over en pakt de volgende zuivere afwijzing", () => {
    const anchor = pickReengagementAnchor([
      reaction({ status: "REJECTED", hasCollaboration: true, jobId: "job-x", jobTitle: "X" }),
      reaction({ status: "REJECTED", hasCollaboration: false, jobId: "job-y", jobTitle: "Y" }),
    ]);
    expect(anchor).toEqual({ jobId: "job-y", jobTitle: "Y" });
  });

  it("verankert niet op WITHDRAWN (eigen intrekking, geen nudge)", () => {
    const anchor = pickReengagementAnchor([reaction({ status: "WITHDRAWN", jobId: "job-w" })]);
    expect(anchor).toBeNull();
  });

  it("geeft null bij een lege lijst", () => {
    expect(pickReengagementAnchor([])).toBeNull();
  });
});
