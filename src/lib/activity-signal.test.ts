import { describe, expect, it } from "vitest";
import { activityItems, type ActivitySignal } from "./activity-signal";

const SIGNAL: ActivitySignal = {
  openJobs: 12,
  newJobsLast30d: 4,
  availableFreelancers: 8,
  verifiedFreelancers: 6,
};

describe("activityItems", () => {
  it("toont de ZZP'er de hoeveelheid werk", () => {
    expect(activityItems(SIGNAL, "FREELANCER")).toEqual([
      { value: 12, label: "open opdrachten" },
      { value: 4, label: "nieuw deze maand" },
    ]);
  });

  it("toont de opdrachtgever het beschikbare aanbod", () => {
    expect(activityItems(SIGNAL, "CLIENT")).toEqual([
      { value: 8, label: "ZZP'ers beschikbaar" },
      { value: 6, label: "geverifieerd" },
    ]);
  });

  it("laat nul-waarden weg (geen leeg signaal)", () => {
    const items = activityItems(
      { openJobs: 3, newJobsLast30d: 0, availableFreelancers: 0, verifiedFreelancers: 0 },
      "FREELANCER",
    );
    expect(items).toEqual([{ value: 3, label: "open opdrachten" }]);
  });

  it("geeft een lege lijst als er niets relevants is", () => {
    expect(
      activityItems(
        { openJobs: 0, newJobsLast30d: 0, availableFreelancers: 0, verifiedFreelancers: 0 },
        "CLIENT",
      ),
    ).toEqual([]);
  });
});
