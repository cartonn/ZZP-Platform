// Unit-tests voor createApplicationForJob — de gedeelde reactie-/claim-keten achter zowel het
// reageer-formulier (createApplication) als de directe rooster-claim (claimShift). Prisma + de
// neveneffecten (audit, rate-limit, matching, routing) volledig gemockt.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { type Actor } from "@/lib/authz";

const store = {
  profile: null as Record<string, unknown> | null,
  job: null as Record<string, unknown> | null,
  existing: null as Record<string, unknown> | null,
  applicationCount: 0,
  /** Als gezet: opeenvolgende `application.count`-aanroepen geven deze waarden terug (queue). Zo kan
   *  een test de pre-check-lees en de in-transactie her-telling apart sturen (TOCTOU-simulatie). */
  countQueue: null as number[] | null,
  subscription: null as Record<string, unknown> | null,
  freePlan: { maxApplications: 5 } as Record<string, unknown> | null,
  created: [] as Array<Record<string, unknown>>,
  updated: [] as Array<Record<string, unknown>>,
  notifications: [] as Array<Record<string, unknown>>,
};

let rateLimitAllowed = true;
const auditMock = vi.hoisted(() => vi.fn(async () => {}));

vi.mock("@/lib/db", () => {
  const applicationCount = vi.fn(async () =>
    store.countQueue && store.countQueue.length
      ? store.countQueue.shift()!
      : store.applicationCount,
  );
  const prisma = {
    freelancerProfile: { findUnique: vi.fn(async () => store.profile) },
    job: { findUnique: vi.fn(async () => store.job) },
    application: {
      findUnique: vi.fn(async () => store.existing),
      count: applicationCount,
      create: vi.fn(async (args: { data: Record<string, unknown> }) => {
        const row = { id: `app-${store.created.length + 1}`, ...args.data };
        store.created.push(row);
        return row;
      }),
      update: vi.fn(async (args: { data: Record<string, unknown> }) => {
        const row = { id: "app-existing", ...args.data };
        store.updated.push(row);
        return row;
      }),
    },
    subscription: { findUnique: vi.fn(async () => store.subscription) },
    plan: { findUnique: vi.fn(async () => store.freePlan) },
    notification: {
      create: vi.fn(async (args: { data: Record<string, unknown> }) => {
        store.notifications.push(args.data);
        return args.data;
      }),
    },
    // Interactieve transactie: geef dezelfde gemockte client als `tx` mee zodat de in-transactie
    // her-telling + create door dezelfde spies loopt. Array-vorm ($transaction([...])) ondersteunt
    // de andere actions in deze suite niet, maar hier niet nodig.
    $transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(prisma)),
  };
  return { prisma };
});

vi.mock("@/lib/rate-limit", () => ({
  applicationRateLimiter: { check: () => ({ allowed: rateLimitAllowed }) },
}));

vi.mock("@/lib/audit", () => ({ audit: auditMock }));

vi.mock("@/lib/matching", () => ({
  scoreJobForFreelancer: () => ({
    score: 82,
    reasons: [],
    compliance: { status: "OK" },
  }),
}));

vi.mock("@/lib/services/routing", () => ({
  estimateTravelMinutesWithRouting: vi.fn(async () => 20),
}));

import { createApplicationForJob } from "@/lib/applications-create";

const ACTOR: Actor = { id: "user-1", role: "FREELANCER", status: "ACTIVE", tenantId: null };

function freelancerProfile() {
  return {
    id: "prof-1",
    userId: "user-1",
    maxTravelMinutes: null,
    workMode: "ONSITE",
    location: "Utrecht",
    skills: [],
    credentials: [],
  };
}

function publishedJob(overrides: Record<string, unknown> = {}) {
  return {
    id: "job-1",
    status: "PUBLISHED",
    workMode: "ONSITE",
    location: "Utrecht",
    tenantId: null,
    tenant: null,
    skills: [],
    credentialRequirements: [],
    company: { userId: "client-1" },
    title: "Verpleegkundige",
    ...overrides,
  };
}

const VALID = {
  motivation: "Ik heb hier ruime ervaring mee.",
  proposedRate: "85",
  availability: "",
};

beforeEach(() => {
  store.profile = freelancerProfile();
  store.job = publishedJob();
  store.existing = null;
  store.applicationCount = 0;
  store.countQueue = null;
  store.subscription = null;
  store.freePlan = { maxApplications: 5 };
  store.created = [];
  store.updated = [];
  store.notifications = [];
  rateLimitAllowed = true;
  auditMock.mockClear();
});

describe("createApplicationForJob", () => {
  it("maakt een reactie aan op de happy path en meldt de opdrachtgever", async () => {
    const res = await createApplicationForJob(ACTOR, "job-1", VALID);
    expect(res).toEqual({ ok: true, applicationId: "app-1" });
    expect(store.created).toHaveLength(1);
    const row = store.created[0]!;
    expect(row.status).toBe("NEW");
    expect(row.matchScore).toBe(82);
    expect(row.complianceSnapshot).toBe(JSON.stringify({ status: "OK" }));
    expect(auditMock).toHaveBeenCalledTimes(1);
    expect(store.notifications).toHaveLength(1);
    expect(store.notifications[0]!.userId).toBe("client-1");
  });

  it("weigert bij rate-limit zonder iets te schrijven", async () => {
    rateLimitAllowed = false;
    const res = await createApplicationForJob(ACTOR, "job-1", VALID);
    expect(res.ok).toBe(false);
    expect(store.created).toHaveLength(0);
  });

  it("vraagt eerst om een profiel als dat ontbreekt", async () => {
    store.profile = null;
    const res = await createApplicationForJob(ACTOR, "job-1", VALID);
    expect(res).toEqual({ ok: false, error: "Maak eerst je profiel aan." });
  });

  it("weigert als de opdracht niet bestaat", async () => {
    store.job = null;
    const res = await createApplicationForJob(ACTOR, "job-1", VALID);
    expect(res).toEqual({ ok: false, error: "Opdracht niet gevonden." });
  });

  it("weigert een niet-gepubliceerde opdracht", async () => {
    store.job = publishedJob({ status: "DRAFT" });
    const res = await createApplicationForJob(ACTOR, "job-1", VALID);
    expect(res.ok).toBe(false);
    expect(store.created).toHaveLength(0);
  });

  it("weigert een dienst buiten de eigen tenant (geen overflow)", async () => {
    store.job = publishedJob({ tenantId: "tenant-x", tenant: { openOverflow: false } });
    const res = await createApplicationForJob(ACTOR, "job-1", VALID);
    expect(res).toEqual({ ok: false, error: "Deze opdracht is niet zichtbaar voor jou." });
  });

  it("weigert een dubbele reactie op dezelfde opdracht", async () => {
    store.existing = { id: "app-existing" };
    const res = await createApplicationForJob(ACTOR, "job-1", VALID);
    expect(res).toEqual({ ok: false, error: "Je hebt al op deze opdracht gereageerd." });
  });

  it("weigert bij bereikt plan-maximum", async () => {
    store.applicationCount = 5; // FREE-plan max
    const res = await createApplicationForJob(ACTOR, "job-1", VALID);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("maximum aantal reacties");
    expect(store.created).toHaveLength(0);
  });

  it("handhaaft de plan-limiet atomair: een reactie die de pre-check passeert maar in het venster het maximum bereikt, wordt BÍNNEN de transactie geweigerd (geen create)", async () => {
    // TOCTOU-simulatie: de pre-transactionele lees ziet 4 (onder FREE-max 5 → fast-fail passeert),
    // maar tegen de tijd dat de create-transactie de telling her-leest is er een gelijktijdige reactie
    // gecommit → 5 (limiet bereikt). Zonder de in-transactie her-telling zou de reactie tóch worden
    // aangemaakt (plan-/monetisatie-bypass). Met de grendel: geweigerd, niets geschreven.
    store.countQueue = [4, 5];
    const res = await createApplicationForJob(ACTOR, "job-1", VALID);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("maximum aantal reacties");
    expect(store.created).toHaveLength(0);
    expect(auditMock).not.toHaveBeenCalled();
    expect(store.notifications).toHaveLength(0);
  });

  it("maakt de reactie wél aan als de her-telling in de transactie nog onder de limiet blijft", async () => {
    // Pre-check 3, in-transactie her-telling 4, FREE-max 5 → beide onder de limiet → create slaagt.
    store.countQueue = [3, 4];
    const res = await createApplicationForJob(ACTOR, "job-1", VALID);
    expect(res).toEqual({ ok: true, applicationId: "app-1" });
    expect(store.created).toHaveLength(1);
  });

  it("geeft een veldfout terug bij een te korte motivatie", async () => {
    const res = await createApplicationForJob(ACTOR, "job-1", { ...VALID, motivation: "kort" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.fieldErrors?.motivation).toBeTruthy();
    expect(store.created).toHaveLength(0);
  });
});
