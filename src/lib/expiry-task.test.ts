// Unit-tests voor runExpiryTask — verloop + herinneringen van credentials.
// Prisma-laag volledig gemockt; klok via vaste datum geïnjecteerd.

import { describe, it, expect, vi, beforeEach } from "vitest";

// --- In-memory store --------------------------------------------------------
const store = {
  credentials: [] as Array<Record<string, unknown>>,
  auditLogs: [] as Array<Record<string, unknown>>,
  notifications: [] as Array<Record<string, unknown>>,
  credentialUpdates: [] as Array<{ id: string; data: Record<string, unknown> }>,
};

// Faithful mock: filters honour zowel het id-in-filter als een optioneel
// `status`-guard, zodat de compound-guarded writes (VERIFIED-only) getest worden.
function matchesWhere(cred: Record<string, unknown>, where: Record<string, unknown>): boolean {
  const idFilter = where.id as { in?: string[] } | string | undefined;
  if (typeof idFilter === "string") {
    if (cred.id !== idFilter) return false;
  } else if (idFilter?.in && !idFilter.in.includes(cred.id as string)) {
    return false;
  }
  if (typeof where.status === "string" && cred.status !== where.status) return false;
  return true;
}

const prismaMock = {
  credential: {
    findMany: vi.fn(async (args?: { where?: Record<string, unknown>; select?: unknown }) => {
      const where = args?.where ?? {};
      return store.credentials.filter((c) => matchesWhere(c, where));
    }),
    updateMany: vi.fn(
      async (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        let count = 0;
        for (const cred of store.credentials) {
          if (matchesWhere(cred, args.where)) {
            Object.assign(cred, args.data);
            store.credentialUpdates.push({ id: cred.id as string, data: args.data });
            count += 1;
          }
        }
        return { count };
      },
    ),
    update: vi.fn(async (args: { where: { id: string }; data: Record<string, unknown> }) => {
      const cred = store.credentials.find((c) => c.id === args.where.id);
      if (cred) Object.assign(cred, args.data);
      store.credentialUpdates.push({ id: args.where.id, data: args.data });
      return cred ?? {};
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
};

vi.mock("@/lib/db", () => ({
  prisma: {
    ...prismaMock,
    // Interactieve transactie: geef de mock zelf door als `tx`.
    $transaction: vi.fn(async (arg: unknown) =>
      typeof arg === "function"
        ? (arg as (tx: typeof prismaMock) => Promise<unknown>)(prismaMock)
        : Promise.all(arg as Array<Promise<unknown>>),
    ),
  },
}));

const NOW = new Date("2026-06-09T12:00:00.000Z");

function makeCredential(
  id: string,
  expiresAt: Date | null,
  expiryReminderFor: Date | null = null,
  userId = "user-1",
) {
  return {
    id,
    status: "VERIFIED",
    expiresAt,
    expiryReminderFor,
    title: `Certificaat ${id}`,
    freelancerProfile: { userId },
  };
}

describe("runExpiryTask", () => {
  beforeEach(async () => {
    store.credentials = [];
    store.auditLogs = [];
    store.notifications = [];
    store.credentialUpdates = [];
    vi.resetModules();
  });

  it("lege toestand — geen kandidaten → geen writes, nulresultaat", async () => {
    store.credentials = [];
    const { runExpiryTask } = await import("@/lib/expiry-task");
    const result = await runExpiryTask({ actorId: null, now: NOW });
    expect(result).toEqual({ expired: 0, reminded: 0 });
    expect(store.notifications).toHaveLength(0);
    expect(store.auditLogs).toHaveLength(0);
  });

  it("happy path — verlopen credential → status EXPIRED, notificatie, auditregel", async () => {
    // Een credential die gisteren verlopen is.
    const expiredAt = new Date("2026-06-08T00:00:00.000Z");
    store.credentials = [makeCredential("cred-1", expiredAt)];

    const { runExpiryTask } = await import("@/lib/expiry-task");
    const result = await runExpiryTask({ actorId: null, now: NOW });

    expect(result.expired).toBe(1);
    expect(result.reminded).toBe(0);
    expect(store.notifications).toHaveLength(1);
    expect(store.notifications[0]?.type).toBe("CREDENTIAL_EXPIRED");
    expect(store.auditLogs).toHaveLength(1);
    expect(store.auditLogs[0]?.action).toBe("CREDENTIALS_EXPIRED");
  });

  it("happy path — credential verloopt binnenkort → herinnering, auditregel, dedup-markering", async () => {
    // Een credential die over 20 dagen verloopt (binnen 30-dagenvenster).
    const expiresAt = new Date("2026-06-29T00:00:00.000Z");
    store.credentials = [makeCredential("cred-2", expiresAt, null)];

    const { runExpiryTask } = await import("@/lib/expiry-task");
    const result = await runExpiryTask({ actorId: null, now: NOW });

    expect(result.expired).toBe(0);
    expect(result.reminded).toBe(1);
    expect(store.notifications).toHaveLength(1);
    expect(store.notifications[0]?.type).toBe("CREDENTIAL_EXPIRING");
    // dedup-markering: credential.update aangeroepen met expiryReminderFor
    expect(store.credentialUpdates).toHaveLength(1);
    expect(store.credentialUpdates[0]?.data.expiryReminderFor).toEqual(expiresAt);
    expect(store.auditLogs).toHaveLength(1);
    expect(store.auditLogs[0]?.action).toBe("CREDENTIALS_EXPIRING_REMINDED");
  });

  it("idempotentie — al herinnerd voor dezelfde vervaldatum → geen tweede herinnering", async () => {
    const expiresAt = new Date("2026-06-29T00:00:00.000Z");
    // expiryReminderFor = zelfde datum → al herinnerd, overslaan
    store.credentials = [makeCredential("cred-3", expiresAt, expiresAt)];

    const { runExpiryTask } = await import("@/lib/expiry-task");
    const result = await runExpiryTask({ actorId: null, now: NOW });

    expect(result.reminded).toBe(0);
    expect(store.notifications).toHaveLength(0);
  });

  it("mix verlopen + binnenkort → beide paden actief, aparte auditregels", async () => {
    const expiredAt = new Date("2026-06-08T00:00:00.000Z");
    const soonAt = new Date("2026-06-25T00:00:00.000Z");
    store.credentials = [
      makeCredential("cred-a", expiredAt, null, "user-a"),
      makeCredential("cred-b", soonAt, null, "user-b"),
    ];

    const { runExpiryTask } = await import("@/lib/expiry-task");
    const result = await runExpiryTask({ actorId: null, now: NOW });

    expect(result.expired).toBe(1);
    expect(result.reminded).toBe(1);
    expect(store.notifications).toHaveLength(2);
    // twee auditregels (één per batch-type)
    expect(store.auditLogs).toHaveLength(2);
  });

  it("TOCTOU-race — credential opnieuw ingediend na de snapshot → geen valse EXPIRED, geen illegale overgang", async () => {
    // De kandidaten-snapshot (findMany op regel ~36) zag de credential nog als
    // VERIFIED en verlopen; tegen de tijd dat de transactie draait heeft de ZZP'er
    // een nieuw bewijsstuk geüpload → status is nu SUBMITTED. De compound-guarded
    // updateMany (VERIFIED-only) mag hem NIET terug naar EXPIRED schrijven
    // (SUBMITTED → EXPIRED staat niet in CREDENTIAL_TRANSITIONS) en er mag geen
    // valse "verlopen"-notificatie ontstaan.
    const expiredAt = new Date("2026-06-08T00:00:00.000Z");
    store.credentials = [
      {
        id: "cred-race",
        status: "SUBMITTED", // huidige (transactie-tijd) staat: al opnieuw ingediend
        expiresAt: expiredAt,
        expiryReminderFor: null,
        title: "Certificaat cred-race",
        freelancerProfile: { userId: "user-1" },
      },
    ];

    const db = await import("@/lib/db");
    // Snapshot-findMany zag hem nog als VERIFIED (de race: verificatie ná de snapshot).
    (
      db.prisma.credential.findMany as unknown as {
        mockImplementationOnce: (fn: () => Promise<unknown>) => void;
      }
    ).mockImplementationOnce(async () => [
      {
        id: "cred-race",
        status: "VERIFIED",
        expiresAt: expiredAt,
        expiryReminderFor: null,
        title: "Certificaat cred-race",
        freelancerProfile: { userId: "user-1" },
      },
    ]);

    const { runExpiryTask } = await import("@/lib/expiry-task");
    const result = await runExpiryTask({ actorId: null, now: NOW });

    expect(result.expired).toBe(0);
    expect(store.notifications).toHaveLength(0);
    expect(store.auditLogs).toHaveLength(0);
    // Geen illegale SUBMITTED → EXPIRED overgang: de rij blijft SUBMITTED.
    expect(store.credentials[0]?.status).toBe("SUBMITTED");
  });
});
