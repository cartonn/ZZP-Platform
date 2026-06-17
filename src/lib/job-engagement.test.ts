import { describe, it, expect } from "vitest";
import {
  planJobEngagement,
  jobAgeInDays,
  JOB_COLD_MIN_AGE_DAYS,
  JOB_COLD_MAX_APPLICATIONS,
  type EngagementJob,
} from "@/lib/job-engagement";

const NOW = new Date("2026-06-17T12:00:00.000Z");

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
}

function makeJob(overrides: Partial<EngagementJob> = {}): EngagementJob {
  return {
    id: "job-1",
    title: "Zorgcoördinator",
    ownerUserId: "user-owner",
    publishedAt: daysAgo(10),
    applicationCount: 0,
    ...overrides,
  };
}

describe("jobAgeInDays", () => {
  it("telt hele dagen sinds publicatie (vloer)", () => {
    expect(jobAgeInDays(daysAgo(7), NOW)).toBe(7);
    // 7 dagen + 23 uur => nog 7 hele dagen
    expect(jobAgeInDays(new Date(daysAgo(7).getTime() - 23 * 60 * 60 * 1000), NOW)).toBe(7);
  });

  it("nooit negatief: een toekomstige datum geeft 0", () => {
    expect(jobAgeInDays(daysAgo(-3), NOW)).toBe(0);
    expect(jobAgeInDays(NOW, NOW)).toBe(0);
  });
});

describe("planJobEngagement", () => {
  it("lege invoer → geen alerts", () => {
    expect(planJobEngagement([], { now: NOW }).alerts).toEqual([]);
  });

  it("koude opdracht (oud genoeg, weinig reacties) → één alert naar de eigenaar", () => {
    const { alerts } = planJobEngagement([makeJob()], { now: NOW });
    expect(alerts).toHaveLength(1);
    const a = alerts[0]!;
    expect(a.jobId).toBe("job-1");
    expect(a.userId).toBe("user-owner");
    expect(a.ageDays).toBe(10);
    expect(a.notificationType).toBe("JOB_COLD");
    expect(a.dedupeKey).toBe("job-cold:job-1");
    expect(a.link).toBe("/opdrachten/job-1");
    expect(a.title).toContain("Zorgcoördinator");
  });

  it("te jong (onder de leeftijdsdrempel) → geen alert", () => {
    const job = makeJob({ publishedAt: daysAgo(JOB_COLD_MIN_AGE_DAYS - 1) });
    expect(planJobEngagement([job], { now: NOW }).alerts).toHaveLength(0);
  });

  it("precies op de leeftijdsdrempel → wel een alert (>= grens)", () => {
    const job = makeJob({ publishedAt: daysAgo(JOB_COLD_MIN_AGE_DAYS) });
    expect(planJobEngagement([job], { now: NOW }).alerts).toHaveLength(1);
  });

  it("te veel reacties (boven de drempel) → geen alert", () => {
    const job = makeJob({ applicationCount: JOB_COLD_MAX_APPLICATIONS + 1 });
    expect(planJobEngagement([job], { now: NOW }).alerts).toHaveLength(0);
  });

  it("precies op de reactie-drempel → nog wel koud (<= grens)", () => {
    const job = makeJob({ applicationCount: JOB_COLD_MAX_APPLICATIONS });
    expect(planJobEngagement([job], { now: NOW }).alerts).toHaveLength(1);
  });

  it("niet-gepubliceerde opdracht (publishedAt null) → genegeerd", () => {
    const job = makeJob({ publishedAt: null });
    expect(planJobEngagement([job], { now: NOW }).alerts).toHaveLength(0);
  });

  it("reactie-tekst schaalt met het aantal (0 / 1 / meer)", () => {
    const zero = planJobEngagement([makeJob({ applicationCount: 0 })], { now: NOW }).alerts[0]!;
    const one = planJobEngagement([makeJob({ applicationCount: 1 })], { now: NOW }).alerts[0]!;
    const two = planJobEngagement([makeJob({ applicationCount: 2 })], { now: NOW }).alerts[0]!;
    expect(zero.body).toContain("nog geen reacties");
    expect(one.body).toContain("pas één reactie");
    expect(two.body).toContain("pas 2 reacties");
  });

  it("respecteert overschreven drempels", () => {
    const job = makeJob({ publishedAt: daysAgo(3), applicationCount: 5 });
    const { alerts } = planJobEngagement([job], {
      now: NOW,
      minAgeDays: 2,
      maxApplications: 10,
    });
    expect(alerts).toHaveLength(1);
  });

  it("meerdere opdrachten: alleen de koude leveren een alert", () => {
    const cold = makeJob({ id: "cold", publishedAt: daysAgo(14), applicationCount: 1 });
    const popular = makeJob({ id: "popular", publishedAt: daysAgo(14), applicationCount: 8 });
    const fresh = makeJob({ id: "fresh", publishedAt: daysAgo(1), applicationCount: 0 });
    const { alerts } = planJobEngagement([cold, popular, fresh], { now: NOW });
    expect(alerts.map((a) => a.jobId)).toEqual(["cold"]);
  });
});
