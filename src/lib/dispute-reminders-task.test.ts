// Unit-tests voor runDisputeReminderTask — DB-bedrading rond de pure planner
// `planDisputeReminders`. Prisma-laag volledig gemockt; de planner draait écht (geen mock) zodat de
// test de echte plan-logica raakt. Klok via vaste datum geïnjecteerd. Dekt: herinnering-fan-out naar
// béíde partijen, idempotentie via DomainEvent dedupeKey, escalatie-fan-out naar alle admins, filtering
// van onvolledige rijen en de lege toestand.

import { describe, it, expect, beforeEach } from "vitest";
import { vi } from "vitest";
import {
  disputeEscalationBacklogCutoff,
  disputeEscalationDedupeKey,
  planDisputeReminders,
  type DisputeReminderCandidate,
} from "@/lib/dispute-reminders";

// --- In-memory store --------------------------------------------------------
const store = {
  collaborations: [] as Array<Record<string, unknown>>,
  users: [] as Array<Record<string, unknown>>,
  domainEvents: [] as Array<Record<string, unknown>>,
  notifications: [] as Array<Record<string, unknown>>,
  auditLogs: [] as Array<Record<string, unknown>>,
};

const prismaMock = {
  collaboration: {
    findMany: vi.fn(async () => store.collaborations),
  },
  user: {
    findMany: vi.fn(async (args: { where: { role: string; status: string } }) =>
      store.users
        .filter((u) => u.role === args.where.role && u.status === args.where.status)
        .map((u) => ({ id: u.id })),
    ),
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
  // De runner gebruikt uitsluitend de array-vorm: elk element is het RESULTAAT van een reeds
  // uitgevoerde create-call (de creates vuren eager en pushen al naar de store); $transaction awaited
  // de teruggegeven promises.
  $transaction: vi.fn(async (arg: Array<Promise<unknown>>) => Promise.all(arg)),
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

const NOW = new Date("2026-06-19T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

function daysAgo(n: number): Date {
  return new Date(NOW.getTime() - n * DAY);
}

// Rij zoals collaboration.findMany hem selecteert (genest job/freelancer/company).
function makeCollab(over: {
  id: string;
  disputedDaysAgo: number | null;
  status?: string;
  freelancerUserId?: string | null;
  clientUserId?: string | null;
  jobTitle?: string;
}) {
  return {
    id: over.id,
    status: over.status ?? "ACTIVE",
    disputedAt: over.disputedDaysAgo === null ? null : daysAgo(over.disputedDaysAgo),
    job: { title: over.jobTitle ?? "Verpleegkundige (detachering)" },
    freelancer:
      over.freelancerUserId === undefined ? { userId: "zzp-1" } : { userId: over.freelancerUserId },
    company:
      over.clientUserId === undefined ? { userId: "client-1" } : { userId: over.clientUserId },
  };
}

describe("runDisputeReminderTask", () => {
  beforeEach(() => {
    store.collaborations = [];
    store.users = [];
    store.domainEvents = [];
    store.notifications = [];
    store.auditLogs = [];
    vi.resetModules();
    prismaMock.collaboration.findMany.mockClear();
    prismaMock.user.findMany.mockClear();
    prismaMock.domainEvent.findMany.mockClear();
    prismaMock.domainEvent.create.mockClear();
    prismaMock.notification.create.mockClear();
    prismaMock.auditLog.create.mockClear();
    prismaMock.$transaction.mockClear();
  });

  it("lege toestand — geen disputen → nulresultaat, geen writes", async () => {
    const { runDisputeReminderTask } = await import("@/lib/dispute-reminders-task");
    const result = await runDisputeReminderTask({ actorId: null, now: NOW });
    expect(result).toEqual({ reminded: 0, escalated: 0 });
    expect(store.domainEvents).toHaveLength(0);
    expect(store.notifications).toHaveLength(0);
    expect(store.auditLogs).toHaveLength(0);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("niets due — dispuut op een tussendag (dag 5) → nulresultaat, geen writes", async () => {
    store.collaborations = [makeCollab({ id: "collab-mid", disputedDaysAgo: 5 })];

    const { runDisputeReminderTask } = await import("@/lib/dispute-reminders-task");
    const result = await runDisputeReminderTask({ actorId: null, now: NOW });

    expect(result).toEqual({ reminded: 0, escalated: 0 });
    expect(store.domainEvents).toHaveLength(0);
    expect(store.notifications).toHaveLength(0);
    expect(store.auditLogs).toHaveLength(0);
  });

  it("herinnering — dispuut 3 dagen open → béíde partijen krijgen notificatie + DomainEvent + audit", async () => {
    store.collaborations = [
      makeCollab({
        id: "collab-1",
        disputedDaysAgo: 3,
        freelancerUserId: "zzp-1",
        clientUserId: "client-1",
      }),
    ];

    const { runDisputeReminderTask } = await import("@/lib/dispute-reminders-task");
    const result = await runDisputeReminderTask({ actorId: null, now: NOW });

    // Dag 3 herinnert béíde partijen; geen escalatie.
    expect(result.reminded).toBeGreaterThanOrEqual(1);
    expect(result.reminded).toBe(2);
    expect(result.escalated).toBe(0);

    // Eén DomainEvent + één notificatie + één auditregel per verse herinnering.
    expect(store.domainEvents).toHaveLength(2);
    expect(store.domainEvents.every((e) => e.type === "DISPUTE_REMINDER")).toBe(true);
    expect(store.auditLogs).toHaveLength(2);
    expect(store.auditLogs.every((a) => a.action === "DISPUTE_REMINDER")).toBe(true);

    // De notificaties gaan naar exact de twee juiste userId's.
    expect(store.notifications).toHaveLength(2);
    expect(store.notifications.every((n) => n.type === "DISPUTE_REMINDER")).toBe(true);
    expect(store.notifications.map((n) => n.userId).sort()).toEqual(["client-1", "zzp-1"]);
    // Deep-link naar de samenwerking.
    expect(store.notifications.every((n) => n.link === "/samenwerkingen/collab-1")).toBe(true);

    // Geen admin-lookup zonder escalatie.
    expect(prismaMock.user.findMany).not.toHaveBeenCalled();
  });

  it("idempotentie — reeds gevuurde dedupeKeys → herinnering wordt gefilterd, geen dubbele write", async () => {
    const collabId = "collab-1";
    store.collaborations = [
      makeCollab({
        id: collabId,
        disputedDaysAgo: 3,
        freelancerUserId: "zzp-1",
        clientUserId: "client-1",
      }),
    ];

    // Leid de exacte dedupeKeys af uit de échte planner (geen aannames over het sleutelformaat).
    const candidate: DisputeReminderCandidate = {
      collaborationId: collabId,
      disputedAt: daysAgo(3),
      collabStatus: "ACTIVE",
      freelancerUserId: "zzp-1",
      clientUserId: "client-1",
      jobTitle: "Verpleegkundige (detachering)",
    };
    const plan = planDisputeReminders([candidate], NOW);
    expect(plan.reminders).toHaveLength(2);
    // Seed de DomainEvents met precies die dedupeKeys → beide signalen zijn "gezien".
    store.domainEvents = plan.reminders.map((r) => ({
      type: "DISPUTE_REMINDER",
      dedupeKey: r.dedupeKey,
    }));
    const seededCount = store.domainEvents.length;

    const { runDisputeReminderTask } = await import("@/lib/dispute-reminders-task");
    const result = await runDisputeReminderTask({ actorId: null, now: NOW });

    expect(result).toEqual({ reminded: 0, escalated: 0 });
    // Geen nieuwe writes: DomainEvents ongewijzigd, geen notificaties/audits.
    expect(store.domainEvents).toHaveLength(seededCount);
    expect(store.notifications).toHaveLength(0);
    expect(store.auditLogs).toHaveLength(0);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("escalatie-fan-out — dispuut 8 dagen open → alle admins genotificeerd + DomainEvent + audit", async () => {
    store.collaborations = [
      makeCollab({ id: "collab-esc", disputedDaysAgo: 8, jobTitle: "Nachtdienst SEH" }),
    ];
    store.users = [
      { id: "admin-1", role: "ADMIN", status: "ACTIVE" },
      { id: "admin-2", role: "ADMIN", status: "ACTIVE" },
      // Ruis die niet mag meetellen.
      { id: "admin-inactive", role: "ADMIN", status: "SUSPENDED" },
      { id: "gewone-user", role: "FREELANCER", status: "ACTIVE" },
    ];

    const { runDisputeReminderTask } = await import("@/lib/dispute-reminders-task");
    const result = await runDisputeReminderTask({ actorId: null, now: NOW });

    // Dag 8 > 7: escaleert, geen reguliere herinnering (8 zit niet in [3,7]).
    expect(result.escalated).toBeGreaterThanOrEqual(1);
    expect(result.escalated).toBe(1);
    expect(result.reminded).toBe(0);

    // Eén DISPUTE_ESCALATION DomainEvent + één audit.
    expect(store.domainEvents).toHaveLength(1);
    expect(store.domainEvents[0]?.type).toBe("DISPUTE_ESCALATION");
    expect(store.auditLogs).toHaveLength(1);
    expect(store.auditLogs[0]?.action).toBe("DISPUTE_ESCALATED");

    // Eén notificatie per actieve admin (2), niet naar suspended admin of gewone user.
    expect(store.notifications).toHaveLength(2);
    expect(store.notifications.every((n) => n.type === "DISPUTE_ESCALATION")).toBe(true);
    expect(store.notifications.map((n) => n.userId).sort()).toEqual(["admin-1", "admin-2"]);
    expect(store.notifications.every((n) => n.link === "/admin/disputen")).toBe(true);
  });

  it("filtert rijen zonder freelancer.userId of company.userId → geen kandidaat, geen writes", async () => {
    store.collaborations = [
      makeCollab({ id: "no-freelancer", disputedDaysAgo: 3, freelancerUserId: null }),
      makeCollab({ id: "no-client", disputedDaysAgo: 3, clientUserId: null }),
    ];

    const { runDisputeReminderTask } = await import("@/lib/dispute-reminders-task");
    const result = await runDisputeReminderTask({ actorId: null, now: NOW });

    expect(result).toEqual({ reminded: 0, escalated: 0 });
    expect(store.domainEvents).toHaveLength(0);
    expect(store.notifications).toHaveLength(0);
    expect(store.auditLogs).toHaveLength(0);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});

describe("overdueDisputeCollaborationWhere", () => {
  it("levert de exacte Prisma-where met disputedAt-cutoff en status ≠ CANCELLED", async () => {
    const { overdueDisputeCollaborationWhere } = await import("@/lib/dispute-reminders-task");
    const cutoff = disputeEscalationBacklogCutoff(NOW);
    expect(overdueDisputeCollaborationWhere(cutoff)).toEqual({
      disputedAt: { not: null, lte: cutoff },
      status: { not: "CANCELLED" },
    });
  });

  it("dedupeKey-helper vormt de escalatie-sleutel per samenwerking", () => {
    expect(disputeEscalationDedupeKey("abc-123")).toBe("dispute-escalation-abc-123");
  });

  it("drift-gate: runner-escalatie gebruikt exact disputeEscalationDedupeKey(<id>)", async () => {
    // Bewijst dat de planner (en dus de runner) de helper aanroept — niet een parallelle inline
    // literal die stil zou driften t.o.v. de metrics-kant die tegen dezelfde sleutel dedupliceert.
    store.collaborations = [
      makeCollab({ id: "collab-drift", disputedDaysAgo: 8, jobTitle: "Drift-gate" }),
    ];
    store.users = [{ id: "admin-1", role: "ADMIN", status: "ACTIVE" }];

    const { runDisputeReminderTask } = await import("@/lib/dispute-reminders-task");
    const result = await runDisputeReminderTask({ actorId: null, now: NOW });

    expect(result.escalated).toBe(1);
    const escalationEvent = store.domainEvents.find((e) => e.type === "DISPUTE_ESCALATION");
    expect(escalationEvent?.dedupeKey).toBe(disputeEscalationDedupeKey("collab-drift"));

    // Sanity: de planner produceert dezelfde sleutel via de helper.
    const cand: DisputeReminderCandidate = {
      collaborationId: "collab-drift",
      disputedAt: daysAgo(8),
      collabStatus: "ACTIVE",
      freelancerUserId: "zzp-1",
      clientUserId: "client-1",
      jobTitle: "Drift-gate",
    };
    const plan = planDisputeReminders([cand], NOW);
    expect(plan.escalations[0]?.dedupeKey).toBe(disputeEscalationDedupeKey("collab-drift"));
  });
});
