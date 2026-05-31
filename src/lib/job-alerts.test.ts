import { describe, expect, it } from "vitest";

import {
  JOB_ALERT_THRESHOLD,
  planJobAlerts,
  type JobAlertFreelancer,
  type JobAlertJob,
} from "./job-alerts";

const makeJob = (overrides: Partial<JobAlertJob> = {}): JobAlertJob => ({
  id: "job-1",
  title: "Verpleegkundige IC",
  skills: [],
  credentialRequirements: [],
  rateMin: null,
  rateMax: null,
  workMode: "ONSITE",
  location: "Amsterdam",
  applicantProfileIds: [],
  ...overrides,
});

const makeFreelancer = (overrides: Partial<JobAlertFreelancer> = {}): JobAlertFreelancer => ({
  userId: "user-1",
  freelancerProfileId: "profile-1",
  skills: [],
  credentials: [],
  hourlyRate: null,
  workMode: "ONSITE",
  location: "Amsterdam",
  availability: "AVAILABLE",
  ...overrides,
});

describe("planJobAlerts", () => {
  it("geeft lege plan terug bij geen jobs", () => {
    const plan = planJobAlerts([], [makeFreelancer()]);
    expect(plan.alerts).toHaveLength(0);
  });

  it("geeft lege plan terug bij geen freelancers", () => {
    const plan = planJobAlerts([makeJob()], []);
    expect(plan.alerts).toHaveLength(0);
  });

  it("verstuurt alert aan een passende ZZP'er", () => {
    const plan = planJobAlerts([makeJob()], [makeFreelancer()]);
    expect(plan.alerts).toHaveLength(1);
    const [alert] = plan.alerts;
    expect(alert?.jobId).toBe("job-1");
    expect(alert?.userId).toBe("user-1");
    expect(alert?.score).toBeGreaterThanOrEqual(JOB_ALERT_THRESHOLD);
  });

  it("slaat ZZP'er over die al heeft gereageerd", () => {
    const job = makeJob({ applicantProfileIds: ["profile-1"] });
    const plan = planJobAlerts([job], [makeFreelancer()]);
    expect(plan.alerts).toHaveLength(0);
  });

  it("slaat ZZP'er over als score onder drempel ligt", () => {
    const job = makeJob({
      skills: [
        { skillId: "skill-a", required: true },
        { skillId: "skill-b", required: true },
        { skillId: "skill-c", required: true },
      ],
    });
    const freelancer = makeFreelancer({
      workMode: "REMOTE",
      location: "Groningen",
    });
    const plan = planJobAlerts([job], [freelancer], { threshold: 95 });
    expect(plan.alerts).toHaveLength(0);
  });

  it("respecteert een lagere drempel-instelling", () => {
    const job = makeJob();
    const freelancer = makeFreelancer({ workMode: "REMOTE", location: "Utrecht" });
    const lowPlan = planJobAlerts([job], [freelancer], { threshold: 0 });
    expect(lowPlan.alerts).toHaveLength(1);
  });

  it("dedupeKey heeft formaat job-alert:<jobId>:<userId>", () => {
    const plan = planJobAlerts([makeJob({ id: "job-x" })], [makeFreelancer({ userId: "u-y" })]);
    const [alert] = plan.alerts;
    expect(alert?.dedupeKey).toBe("job-alert:job-x:u-y");
  });

  it("link verwijst naar de juiste detailpagina", () => {
    const plan = planJobAlerts([makeJob({ id: "job-abc" })], [makeFreelancer()]);
    const [alert] = plan.alerts;
    expect(alert?.link).toBe("/opdrachten/job-abc");
  });

  it("meerdere jobs leveren separate alerts op", () => {
    const jobs = [makeJob({ id: "job-1" }), makeJob({ id: "job-2", title: "Verzorgende" })];
    const plan = planJobAlerts(jobs, [makeFreelancer()]);
    expect(plan.alerts).toHaveLength(2);
    expect(new Set(plan.alerts.map((a) => a.jobId)).size).toBe(2);
  });

  it("meerdere passende freelancers per job krijgen elk een alert", () => {
    const freelancers = [
      makeFreelancer({ userId: "u-1", freelancerProfileId: "p-1" }),
      makeFreelancer({ userId: "u-2", freelancerProfileId: "p-2" }),
    ];
    const plan = planJobAlerts([makeJob()], freelancers);
    expect(plan.alerts).toHaveLength(2);
    expect(new Set(plan.alerts.map((a) => a.userId)).size).toBe(2);
  });

  it("al-gereageerde ZZP'er wordt overgeslagen, andere niet", () => {
    const job = makeJob({ applicantProfileIds: ["p-1"] });
    const freelancers = [
      makeFreelancer({ userId: "u-1", freelancerProfileId: "p-1" }),
      makeFreelancer({ userId: "u-2", freelancerProfileId: "p-2" }),
    ];
    const plan = planJobAlerts([job], freelancers);
    expect(plan.alerts).toHaveLength(1);
    const [alert] = plan.alerts;
    expect(alert?.userId).toBe("u-2");
  });
});
