import { describe, expect, it } from "vitest";
import {
  assessJobCollaborationConflict,
  type ConflictingCollaborationInput,
} from "@/lib/job-collaboration-conflict";

const base: ConflictingCollaborationInput = {
  id: "c1",
  status: "ACTIVE",
  startDate: new Date("2026-09-01"),
  endDate: new Date("2026-09-30"),
  jobTitle: "Nachtdienst verpleegkundige",
  clientName: "Zorgcentrum De Linde",
};

describe("assessJobCollaborationConflict", () => {
  it("geeft null zonder startdatum op de opdracht", () => {
    expect(assessJobCollaborationConflict(null, [base])).toBeNull();
    expect(assessJobCollaborationConflict(undefined, [base])).toBeNull();
  });

  it("geeft null zonder samenwerkingen", () => {
    expect(assessJobCollaborationConflict(new Date("2026-09-15"), [])).toBeNull();
  });

  it("signaleert een opdracht die binnen een lopende samenwerking start", () => {
    const conflict = assessJobCollaborationConflict(new Date("2026-09-15"), [base]);
    expect(conflict).not.toBeNull();
    expect(conflict?.collaborationId).toBe("c1");
    expect(conflict?.jobTitle).toBe("Nachtdienst verpleegkundige");
    expect(conflict?.clientName).toBe("Zorgcentrum De Linde");
  });

  it("is inclusief op de grenzen (start- en einddatum)", () => {
    expect(assessJobCollaborationConflict(new Date("2026-09-01"), [base])).not.toBeNull();
    expect(assessJobCollaborationConflict(new Date("2026-09-30"), [base])).not.toBeNull();
  });

  it("geeft null wanneer de startdatum buiten de looptijd valt", () => {
    expect(assessJobCollaborationConflict(new Date("2026-08-31"), [base])).toBeNull();
    expect(assessJobCollaborationConflict(new Date("2026-10-01"), [base])).toBeNull();
  });

  it("negeert niet-ACTIVE samenwerkingen (PROPOSED/COMPLETED/CANCELLED)", () => {
    for (const status of ["PROPOSED", "COMPLETED", "CANCELLED"] as const) {
      expect(
        assessJobCollaborationConflict(new Date("2026-09-15"), [{ ...base, status }]),
      ).toBeNull();
    }
  });

  it("negeert een samenwerking zonder startdatum (niet in de tijd te plaatsen)", () => {
    expect(
      assessJobCollaborationConflict(new Date("2026-09-15"), [{ ...base, startDate: null }]),
    ).toBeNull();
  });

  it("behandelt een open einde (endDate null) als doorlopend", () => {
    const openEnded = { ...base, endDate: null };
    expect(assessJobCollaborationConflict(new Date("2027-05-01"), [openEnded])).not.toBeNull();
    // vóór de start valt nog steeds buiten de looptijd
    expect(assessJobCollaborationConflict(new Date("2026-08-01"), [openEnded])).toBeNull();
  });

  it("kiest deterministisch de vroegste start, dan het laagste id", () => {
    const later: ConflictingCollaborationInput = {
      ...base,
      id: "c2",
      startDate: new Date("2026-09-10"),
      jobTitle: "Later",
    };
    const earlierB: ConflictingCollaborationInput = {
      ...base,
      id: "c3",
      startDate: new Date("2026-09-01"),
      jobTitle: "Gelijk-vroeg-hoog-id",
    };
    // base (c1, start 09-01) en earlierB (c3, start 09-01) starten gelijk → laagste id (c1) wint.
    const conflict = assessJobCollaborationConflict(new Date("2026-09-15"), [
      later,
      earlierB,
      base,
    ]);
    expect(conflict?.collaborationId).toBe("c1");
  });

  it("bewaart het open einde in het signaal", () => {
    const conflict = assessJobCollaborationConflict(new Date("2027-05-01"), [
      { ...base, endDate: null },
    ]);
    expect(conflict?.endDate).toBeNull();
    expect(conflict?.startDate).toEqual(new Date("2026-09-01"));
  });
});
