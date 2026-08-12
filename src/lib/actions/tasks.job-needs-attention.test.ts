import { describe, it, expect } from "vitest";
import { jobNeedsAttentionTask } from "./tasks";
import { P } from "@/lib/next-actions";

describe("jobNeedsAttentionTask", () => {
  it("bouwt een attention-taak met deep-link naar het opdracht-detail", () => {
    const task = jobNeedsAttentionTask("job-1", "Nachtdienst VVT", "Weinig respons");
    expect(task).toMatchObject({
      kind: "job-needs-attention",
      id: "job-needs-attention:job-1",
      title: "Nachtdienst VVT",
      subtitle: "Weinig respons — stel het tarief, de eisen of de zichtbaarheid bij",
      tone: "attention",
      priority: P.jobNeedsAttention,
      resolver: "link",
      href: "/opdrachten/job-1",
      jobId: "job-1",
    });
  });

  it("neemt de pace-kop over in de subtitel (traag tempo)", () => {
    const task = jobNeedsAttentionTask("job-2", "Weekenddienst", "Traag tempo");
    expect(task.subtitle).toBe("Traag tempo — stel het tarief, de eisen of de zichtbaarheid bij");
  });

  it("staat onder het inkomende-kandidaten-cluster maar boven de findability-nudge", () => {
    expect(P.jobNeedsAttention).toBeLessThan(P.staleApplications);
    expect(P.jobNeedsAttention).toBeLessThan(P.collaborationRenewal);
    expect(P.jobNeedsAttention).toBeGreaterThan(P.availabilityStale);
    expect(P.jobNeedsAttention).toBeGreaterThan(P.drafts);
  });
});
