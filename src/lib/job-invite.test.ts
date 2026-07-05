import { describe, expect, it } from "vitest";
import {
  assessInviteEligibility,
  buildJobInviteNotification,
  JOB_INVITE_NOTIFICATION_TYPE,
} from "./job-invite";

const base = {
  jobStatus: "PUBLISHED" as const,
  alreadyApplied: false,
  alreadyInvited: false,
  discoverable: true,
};

describe("assessInviteEligibility", () => {
  it("staat uitnodigen toe voor een gepubliceerde opdracht en een vindbare, niet-reagerende ZZP'er", () => {
    expect(assessInviteEligibility(base)).toEqual({ ok: true });
  });

  it("weigert een niet-gepubliceerde opdracht", () => {
    expect(assessInviteEligibility({ ...base, jobStatus: "DRAFT" })).toEqual({
      ok: false,
      reason: "not_published",
    });
    expect(assessInviteEligibility({ ...base, jobStatus: "CLOSED" })).toEqual({
      ok: false,
      reason: "not_published",
    });
  });

  it("weigert een niet-vindbare ZZP'er (privé/geschorst) vóór de reeds-gedaan-checks", () => {
    expect(
      assessInviteEligibility({
        ...base,
        discoverable: false,
        alreadyApplied: true,
        alreadyInvited: true,
      }),
    ).toEqual({ ok: false, reason: "not_discoverable" });
  });

  it("weigert wanneer de ZZP'er al reageerde", () => {
    expect(assessInviteEligibility({ ...base, alreadyApplied: true })).toEqual({
      ok: false,
      reason: "already_applied",
    });
  });

  it("weigert een dubbele uitnodiging (idempotent)", () => {
    expect(assessInviteEligibility({ ...base, alreadyInvited: true })).toEqual({
      ok: false,
      reason: "already_invited",
    });
  });

  it("prioriteert already_applied boven already_invited", () => {
    expect(
      assessInviteEligibility({ ...base, alreadyApplied: true, alreadyInvited: true }),
    ).toEqual({ ok: false, reason: "already_applied" });
  });
});

describe("buildJobInviteNotification", () => {
  it("bouwt een uitnodigingsnotificatie met deeplink naar de opdracht", () => {
    const n = buildJobInviteNotification({
      jobId: "job-1",
      jobTitle: "Wijkverpleegkundige",
      companyName: "Thuiszorg Noord",
    });
    expect(n.type).toBe(JOB_INVITE_NOTIFICATION_TYPE);
    expect(n.link).toBe("/opdrachten/job-1");
    expect(n.body).toContain("Thuiszorg Noord");
    expect(n.body).toContain("Wijkverpleegkundige");
    expect(n.title.length).toBeGreaterThan(0);
  });

  it("valt terug op nette tekst bij lege bedrijfs-/opdrachtnaam", () => {
    const n = buildJobInviteNotification({ jobId: "job-2", jobTitle: "  ", companyName: "" });
    expect(n.body).toContain("Een opdrachtgever");
    expect(n.body).toContain("een opdracht");
    expect(n.link).toBe("/opdrachten/job-2");
  });
});
