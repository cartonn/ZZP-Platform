import { describe, expect, it } from "vitest";
import { pickReengagementAnchor, type ReengagementReaction } from "@/lib/reengagement";

function reaction(over: Partial<ReengagementReaction>): ReengagementReaction {
  return {
    status: "REJECTED",
    hasCollaboration: false,
    jobDead: false,
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
    expect(anchor).toEqual({ jobId: "job-b", jobTitle: "B", reason: "REJECTED" });
  });

  it("geeft null wanneer er geen doodlopend spoor is", () => {
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
    expect(anchor).toEqual({ jobId: "job-y", jobTitle: "Y", reason: "REJECTED" });
  });

  it("verankert niet op WITHDRAWN (eigen intrekking, geen nudge)", () => {
    const anchor = pickReengagementAnchor([reaction({ status: "WITHDRAWN", jobId: "job-w" })]);
    expect(anchor).toBeNull();
  });

  it("geeft null bij een lege lijst", () => {
    expect(pickReengagementAnchor([])).toBeNull();
  });

  // --- Doodlopend spoor doordat de opdracht zélf eindigde (het "ghosted"-geval) ---

  it("verankert op een nog-openstaande reactie waarvan de opdracht dood ging (reason JOB_ENDED)", () => {
    const anchor = pickReengagementAnchor([
      reaction({ status: "NEW", jobDead: true, jobId: "job-d", jobTitle: "D" }),
    ]);
    expect(anchor).toEqual({ jobId: "job-d", jobTitle: "D", reason: "JOB_ENDED" });
  });

  it("de meest recente treffer wint, ongeacht het soort spoor (dode opdracht vóór oudere afwijzing)", () => {
    const anchor = pickReengagementAnchor([
      reaction({ status: "SHORTLIST", jobDead: true, jobId: "job-recent", jobTitle: "Recent" }),
      reaction({ status: "REJECTED", jobId: "job-old", jobTitle: "Oud" }),
    ]);
    expect(anchor).toEqual({ jobId: "job-recent", jobTitle: "Recent", reason: "JOB_ENDED" });
  });

  it("een afwijzing die recenter is dan een dode opdracht wint met reason REJECTED", () => {
    const anchor = pickReengagementAnchor([
      reaction({ status: "REJECTED", jobId: "job-rej", jobTitle: "Afgewezen" }),
      reaction({ status: "VIEWED", jobDead: true, jobId: "job-dead", jobTitle: "Dood" }),
    ]);
    expect(anchor).toEqual({ jobId: "job-rej", jobTitle: "Afgewezen", reason: "REJECTED" });
  });

  it("negeert een dode opdracht waar al een samenwerking uit voortkwam", () => {
    const anchor = pickReengagementAnchor([
      reaction({ status: "NEW", jobDead: true, hasCollaboration: true, jobId: "job-c" }),
    ]);
    expect(anchor).toBeNull();
  });

  it("verankert nooit als 'opdracht liep dood' op een reeds besliste reactie (defensief tegen een inconsistente aanroeper)", () => {
    // `jobDead` hoort alleen bij open statussen; zou een aanroeper het tóch op een WITHDRAWN/ACCEPTED
    // zetten, dan mag dat geen nudge worden.
    expect(
      pickReengagementAnchor([reaction({ status: "WITHDRAWN", jobDead: true, jobId: "job-w" })]),
    ).toBeNull();
    expect(
      pickReengagementAnchor([reaction({ status: "ACCEPTED", jobDead: true, jobId: "job-a" })]),
    ).toBeNull();
  });
});
