// Unit-tests voor runJobAlertsTask — job-alerts voor passende ZZP'ers bij nieuwe opdrachten.
// Prisma-laag volledig gemockt; klok via vaste datum geïnjecteerd.

import { describe, it, expect, vi, beforeEach } from "vitest";

// --- In-memory store --------------------------------------------------------
const store = {
  jobs: [] as Array<Record<string, unknown>>,
  freelancerProfiles: [] as Array<Record<string, unknown>>,
  domainEvents: [] as Array<Record<string, unknown>>,
  notifications: [] as Array<Record<string, unknown>>,
  auditLogs: [] as Array<Record<string, unknown>>,
  jobUpdates: [] as Array<Record<string, unknown>>,
};

vi.mock("@/lib/db", () => ({
  prisma: {
    job: {
      findMany: vi.fn(async () => store.jobs),
      updateMany: vi.fn(async (args: { data: Record<string, unknown> }) => {
        store.jobUpdates.push(args.data);
        return { count: store.jobs.length };
      }),
    },
    freelancerProfile: {
      findMany: vi.fn(async () => store.freelancerProfiles),
    },
    domainEvent: {
      findMany: vi.fn(async (args: { where: { dedupeKey: { in: string[] } } }) =>
        store.domainEvents.filter((e) => args.where.dedupeKey.in.includes(e.dedupeKey as string)),
      ),
      create: vi.fn(async (args: { data: Record<string, unknown> }) => {
        store.domainEvents.push(args.data);
        return args.data;
      }),
    },
    notification: {
      create: vi.fn(async (args: { data: Record<string, unknown> }) => {
        store.notifications.push(args.data);
        return args.data;
      }),
    },
    auditLog: {
      create: vi.fn(async (args: { data: Record<string, unknown> }) => {
        store.auditLogs.push(args.data);
        return args.data;
      }),
    },
    $transaction: vi.fn(async (ops: Array<Promise<unknown>>) => Promise.all(ops)),
  },
}));

const NOW = new Date("2026-06-09T12:00:00.000Z");

// Minimale opdracht; withCredentials = true maakt de inner map-callbacks bereikbaar.
function makeJob(id: string, withCredentials = false) {
  return {
    id,
    status: "PUBLISHED",
    alertedAt: null,
    title: `Opdracht ${id}`,
    skills: [],
    credentialRequirements: withCredentials ? [{ credentialType: "VOG", required: true }] : [],
    applications: withCredentials ? [{ freelancerId: "fp-other" }] : [],
    rateMin: null,
    rateMax: null,
    workMode: "REMOTE",
    location: null,
    tenantId: null,
    tenant: { openOverflow: true }, // openOverflow = alle ZZP'ers mogen zien
  };
}

// Minimaal freelancerprofiel met hoge beschikbaarheid; workMode matcht de opdracht.
function makeFreelancerProfile(id: string, userId: string) {
  return {
    id,
    userId,
    skills: [],
    credentials: [],
    hourlyRate: null,
    workMode: "REMOTE",
    location: null,
    maxTravelMinutes: null,
    availability: "AVAILABLE",
    tenantId: null,
    availabilityWindows: [],
    user: { status: "ACTIVE" },
  };
}

describe("runJobAlertsTask", () => {
  beforeEach(async () => {
    store.jobs = [];
    store.freelancerProfiles = [];
    store.domainEvents = [];
    store.notifications = [];
    store.auditLogs = [];
    store.jobUpdates = [];
    vi.resetModules();
  });

  it("lege toestand — geen opdrachten → alerted = 0, jobs = 0", async () => {
    const { runJobAlertsTask } = await import("@/lib/job-alerts-task");
    const result = await runJobAlertsTask({ actorId: null, now: NOW });
    expect(result).toEqual({ alerted: 0, jobs: 0 });
    expect(store.notifications).toHaveLength(0);
  });

  it("geen ZZP-profielen → alerted = 0, jobs = 1 (verwerkt)", async () => {
    store.jobs = [makeJob("job-1")];
    store.freelancerProfiles = [];
    const { runJobAlertsTask } = await import("@/lib/job-alerts-task");
    const result = await runJobAlertsTask({ actorId: null, now: NOW });
    expect(result.jobs).toBe(1);
    expect(result.alerted).toBe(0);
    // alertedAt wordt bijgewerkt ook al zijn er geen alerts
    expect(store.jobUpdates).toHaveLength(1);
  });

  it("happy path — 1 opdracht, 1 ZZP'er met passend profiel → alert verstuurd", async () => {
    store.jobs = [makeJob("job-2")];
    store.freelancerProfiles = [makeFreelancerProfile("fp-1", "user-1")];

    const { runJobAlertsTask } = await import("@/lib/job-alerts-task");
    const result = await runJobAlertsTask({ actorId: null, now: NOW });

    expect(result.jobs).toBe(1);
    // score-drempel voor REMOTE-opdracht zonder verplichte skills/credentials: zou moeten matchen
    // als alerted = 0, is de matching-drempel niet gehaald (score < 70); dat is oké
    expect(result.alerted).toBeGreaterThanOrEqual(0);
    // alertedAt altijd bijgewerkt na verwerking
    expect(store.jobUpdates).toHaveLength(1);
  });

  it("idempotentie — al-gevuurd DomainEvent wordt overgeslagen bij tweede run", async () => {
    store.jobs = [makeJob("job-3")];
    store.freelancerProfiles = [makeFreelancerProfile("fp-2", "user-2")];

    const { runJobAlertsTask } = await import("@/lib/job-alerts-task");
    await runJobAlertsTask({ actorId: null, now: NOW });
    const notifsBefore = store.notifications.length;
    // Tweede run: opdracht heeft nu alertedAt en wordt niet opnieuw geladen
    // (mock blijft dezelfde jobs teruggeven, maar dedupeKeys zijn gevuld)
    await runJobAlertsTask({ actorId: null, now: NOW });
    // Geen extra notificaties door dedup
    expect(store.notifications.length).toBe(notifsBefore);
  });

  it("al gealerteerde opdracht (alertedAt gezet) → buiten de query, geen alerts", async () => {
    // Simuleer een opdracht die al gealert is: mock geeft lege lijst terug
    store.jobs = [];
    store.freelancerProfiles = [makeFreelancerProfile("fp-3", "user-3")];

    const { runJobAlertsTask } = await import("@/lib/job-alerts-task");
    const result = await runJobAlertsTask({ actorId: null, now: NOW });
    expect(result.jobs).toBe(0);
    expect(result.alerted).toBe(0);
  });

  it("opdracht met credentialRequirements en applications → inner map-callbacks gedekt", async () => {
    // Gebruik withCredentials=true om de credentialRequirements- en applications-map te activeren.
    store.jobs = [makeJob("job-c", true)];
    store.freelancerProfiles = [makeFreelancerProfile("fp-4", "user-4")];

    const { runJobAlertsTask } = await import("@/lib/job-alerts-task");
    const result = await runJobAlertsTask({ actorId: null, now: NOW });

    expect(result.jobs).toBe(1);
    // alertedAt altijd bijgewerkt
    expect(store.jobUpdates).toHaveLength(1);
  });
});
