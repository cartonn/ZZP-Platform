import { describe, expect, it } from "vitest";
import {
  assessInviteEligibility,
  buildJobInviteNotification,
  JOB_INVITE_NOTIFICATION_TYPE,
  MAX_BULK_JOB_INVITES,
  parseInvitedFreelancerIds,
  planBulkJobInvites,
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

describe("planBulkJobInvites", () => {
  it("houdt alleen de nog-niet-uitgenodigde kandidaten over, in suggestievolgorde", () => {
    expect(planBulkJobInvites(["a", "b", "c"], new Set(["b"]))).toEqual(["a", "c"]);
  });

  it("ontdubbelt herhaalde id's", () => {
    expect(planBulkJobInvites(["a", "a", "b"], new Set())).toEqual(["a", "b"]);
  });

  it("begrenst op de cap", () => {
    expect(planBulkJobInvites(["a", "b", "c", "d"], new Set(), 2)).toEqual(["a", "b"]);
  });

  it("geeft een lege lijst wanneer alles al is uitgenodigd", () => {
    expect(planBulkJobInvites(["a", "b"], new Set(["a", "b"]))).toEqual([]);
  });

  it("geeft een lege lijst bij een niet-positieve cap", () => {
    expect(planBulkJobInvites(["a", "b"], new Set(), 0)).toEqual([]);
    expect(planBulkJobInvites(["a"], new Set(), -1)).toEqual([]);
  });

  it("valt terug op MAX_BULK_JOB_INVITES als standaard-cap", () => {
    const many = Array.from({ length: MAX_BULK_JOB_INVITES + 5 }, (_, i) => `f${i}`);
    expect(planBulkJobInvites(many, new Set())).toHaveLength(MAX_BULK_JOB_INVITES);
  });
});

describe("parseInvitedFreelancerIds", () => {
  it("leidt de uitgenodigde id's uit de auditrecords af", () => {
    const ids = parseInvitedFreelancerIds([
      { metadata: JSON.stringify({ freelancerId: "a" }) },
      { metadata: JSON.stringify({ freelancerId: "b" }) },
    ]);
    expect(ids).toEqual(new Set(["a", "b"]));
  });

  it("negeert malforme, lege of veldloze metadata zonder te crashen", () => {
    const ids = parseInvitedFreelancerIds([
      { metadata: "{not json" },
      { metadata: null },
      { metadata: JSON.stringify({ count: 3 }) },
      { metadata: JSON.stringify({ freelancerId: 42 }) },
      { metadata: JSON.stringify({ freelancerId: "ok" }) },
    ]);
    expect(ids).toEqual(new Set(["ok"]));
  });
});
