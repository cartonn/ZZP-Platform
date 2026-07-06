import { describe, expect, it } from "vitest";
import {
  isOpenApplicationStatus,
  OPEN_APPLICATION_STATUSES,
  planClosureNotifications,
  type ClosureApplicant,
} from "./job-closure";

const job = { id: "job-1", title: "Wijkverpleegkundige" };

function applicant(freelancerUserId: string, status: string): ClosureApplicant {
  return { freelancerUserId, status };
}

describe("isOpenApplicationStatus", () => {
  it("telt alleen NEW/VIEWED/SHORTLIST als open", () => {
    for (const s of OPEN_APPLICATION_STATUSES) expect(isOpenApplicationStatus(s)).toBe(true);
  });
  it("telt afgehandelde statussen niet als open", () => {
    for (const s of ["ACCEPTED", "REJECTED", "WITHDRAWN", "ONZIN"]) {
      expect(isOpenApplicationStatus(s)).toBe(false);
    }
  });
});

describe("planClosureNotifications", () => {
  it("notificeert elke open reactie", () => {
    const out = planClosureNotifications(job, [
      applicant("u-new", "NEW"),
      applicant("u-viewed", "VIEWED"),
      applicant("u-short", "SHORTLIST"),
    ]);
    expect(out.map((n) => n.userId)).toEqual(["u-new", "u-short", "u-viewed"]);
    for (const n of out) {
      expect(n.notificationType).toBe("JOB_CLOSED");
      expect(n.title).toBe("Opdracht gesloten");
      expect(n.body).toContain("Wijkverpleegkundige");
      expect(n.link).toBe("/opdrachten");
    }
  });

  it("negeert reeds-afgehandelde en ingetrokken reacties", () => {
    const out = planClosureNotifications(job, [
      applicant("u-accept", "ACCEPTED"),
      applicant("u-reject", "REJECTED"),
      applicant("u-withdraw", "WITHDRAWN"),
    ]);
    expect(out).toEqual([]);
  });

  it("stuurt hooguit één notificatie per ZZP'er (dedup op ontvanger)", () => {
    const out = planClosureNotifications(job, [
      applicant("u-dup", "NEW"),
      applicant("u-dup", "SHORTLIST"),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]?.userId).toBe("u-dup");
  });

  it("is stabiel gesorteerd op userId ongeacht invoervolgorde", () => {
    const out = planClosureNotifications(job, [
      applicant("u-c", "NEW"),
      applicant("u-a", "VIEWED"),
      applicant("u-b", "SHORTLIST"),
    ]);
    expect(out.map((n) => n.userId)).toEqual(["u-a", "u-b", "u-c"]);
  });

  it("geeft een lege lijst zonder open reacties", () => {
    expect(planClosureNotifications(job, [])).toEqual([]);
  });
});
