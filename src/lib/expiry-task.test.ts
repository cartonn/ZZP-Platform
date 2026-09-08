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

// Faithful mock: filters honour het id-in-filter, een optionele `status`-guard én een
// `freelancerProfileId`-filter (`{ in: [...] }` of een platte string), zodat de compound-
// guarded writes (VERIFIED-only) én de per-profiel-gescopte dekkings-query getest worden.
function matchesWhere(cred: Record<string, unknown>, where: Record<string, unknown>): boolean {
  const idFilter = where.id as { in?: string[] } | string | undefined;
  if (typeof idFilter === "string") {
    if (cred.id !== idFilter) return false;
  } else if (idFilter?.in && !idFilter.in.includes(cred.id as string)) {
    return false;
  }
  if (typeof where.status === "string" && cred.status !== where.status) return false;
  const profileFilter = where.freelancerProfileId as { in?: string[] } | string | undefined;
  if (typeof profileFilter === "string") {
    if (cred.freelancerProfileId !== profileFilter) return false;
  } else if (profileFilter?.in && !profileFilter.in.includes(cred.freelancerProfileId as string)) {
    return false;
  }
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
  type = "VOG",
  freelancerProfileId = `profile-${userId}`,
) {
  return {
    id,
    status: "VERIFIED",
    type,
    expiresAt,
    expiryReminderFor,
    title: `Certificaat ${id}`,
    freelancerProfileId,
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
        type: "VOG",
        expiresAt: expiredAt,
        expiryReminderFor: null,
        title: "Certificaat cred-race",
        freelancerProfileId: "profile-user-1",
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
        type: "VOG",
        expiresAt: expiredAt,
        expiryReminderFor: null,
        title: "Certificaat cred-race",
        freelancerProfileId: "profile-user-1",
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

  it("TOCTOU-race (herinnering) — opnieuw ingediend na de snapshot → geen valse 'verloopt binnenkort'", async () => {
    // Symmetrisch met de verloop-race: de snapshot zag een bijna-vervallend VERIFIED-
    // credential; tegen transactie-tijd is het opnieuw ingediend (SUBMITTED). Er mag dan
    // geen "verloopt binnenkort"-melding meer uitgaan — dat certificaat is niet meer
    // geldig en verloopt niet. De symmetrische her-lezing (status: VERIFIED) filtert hem.
    const soonAt = new Date("2026-06-29T00:00:00.000Z"); // binnen het 30-dagen-venster
    store.credentials = [
      {
        id: "cred-remind-race",
        status: "SUBMITTED", // transactie-tijd: al opnieuw ingediend
        type: "VOG",
        expiresAt: soonAt,
        expiryReminderFor: null,
        title: "Certificaat cred-remind-race",
        freelancerProfileId: "profile-user-1",
        freelancerProfile: { userId: "user-1" },
      },
    ];

    const db = await import("@/lib/db");
    // Snapshot-findMany zag hem nog als VERIFIED (de race: herindiening ná de snapshot).
    (
      db.prisma.credential.findMany as unknown as {
        mockImplementationOnce: (fn: () => Promise<unknown>) => void;
      }
    ).mockImplementationOnce(async () => [
      {
        id: "cred-remind-race",
        status: "VERIFIED",
        type: "VOG",
        expiresAt: soonAt,
        expiryReminderFor: null,
        title: "Certificaat cred-remind-race",
        freelancerProfileId: "profile-user-1",
        freelancerProfile: { userId: "user-1" },
      },
    ]);

    const { runExpiryTask } = await import("@/lib/expiry-task");
    const result = await runExpiryTask({ actorId: null, now: NOW });

    expect(result.reminded).toBe(0);
    expect(store.notifications).toHaveLength(0);
    expect(store.auditLogs).toHaveLength(0);
    // Geen dedup-markering geschreven op een niet-VERIFIED credential.
    expect(store.credentialUpdates).toHaveLength(0);
  });

  it("superseded — ouder cert verloopt binnenkort maar een later cert van hetzelfde type dekt → GEEN herinnering", async () => {
    const soonAt = new Date("2026-06-29T00:00:00.000Z"); // 20 dagen (binnen venster)
    const laterAt = new Date("2027-07-14T00:00:00.000Z"); // ~400 dagen (buiten venster)
    // VOG #A (bijna verlopen) én VOG #B (veel later) — zelfde profiel, zelfde type.
    store.credentials = [
      makeCredential("vog-a", soonAt, null, "user-1", "VOG"),
      makeCredential("vog-b", laterAt, null, "user-1", "VOG"),
    ];

    const { runExpiryTask } = await import("@/lib/expiry-task");
    const result = await runExpiryTask({ actorId: null, now: NOW });

    // #A is superseded door #B → geen "verloopt binnenkort"-nudge.
    expect(result.reminded).toBe(0);
    expect(result.expired).toBe(0);
    expect(store.notifications.filter((n) => n.type === "CREDENTIAL_EXPIRING")).toHaveLength(0);
    // Geen dedup-markering op #A geschreven.
    expect(store.credentialUpdates).toHaveLength(0);
  });

  it("niet-superseded — twee VERSCHILLENDE types, één verloopt binnenkort → WEL herinnering", async () => {
    const soonAt = new Date("2026-06-29T00:00:00.000Z"); // binnen venster
    const laterAt = new Date("2027-07-14T00:00:00.000Z"); // buiten venster
    // VOG #A (bijna verlopen) + DIPLOMA #B (later) — verschillend type → geen supersede.
    store.credentials = [
      makeCredential("vog-a", soonAt, null, "user-1", "VOG"),
      makeCredential("dip-b", laterAt, null, "user-1", "DIPLOMA"),
    ];

    const { runExpiryTask } = await import("@/lib/expiry-task");
    const result = await runExpiryTask({ actorId: null, now: NOW });

    expect(result.reminded).toBe(1);
    expect(store.notifications.filter((n) => n.type === "CREDENTIAL_EXPIRING")).toHaveLength(1);
  });

  it("cross-profiel geen valse dekking — zelfde type bij twee verschillende ZZP'ers dekt elkaar NIET", async () => {
    const soonAt = new Date("2026-06-29T00:00:00.000Z"); // binnen venster
    const laterAt = new Date("2027-07-14T00:00:00.000Z"); // buiten venster
    // profiel-1: VOG bijna verlopen · profiel-2: VOG veel later — verschillende ZZP'ers.
    store.credentials = [
      makeCredential("vog-p1", soonAt, null, "user-1", "VOG"),
      makeCredential("vog-p2", laterAt, null, "user-2", "VOG"),
    ];

    const { runExpiryTask } = await import("@/lib/expiry-task");
    const result = await runExpiryTask({ actorId: null, now: NOW });

    // Per-profiel-groepering: het cert van profiel-1 wordt NIET gedekt door dat van profiel-2.
    expect(result.reminded).toBe(1);
    const reminders = store.notifications.filter((n) => n.type === "CREDENTIAL_EXPIRING");
    expect(reminders).toHaveLength(1);
    expect(store.credentialUpdates.some((u) => u.id === "vog-p1")).toBe(true);
  });

  it("verlopen + gedekt type → WEL EXPIRED-flip, GEEN 'verlopen'-notificatie", async () => {
    const expiredAt = new Date("2026-06-08T00:00:00.000Z"); // gisteren
    const laterAt = new Date("2027-07-14T00:00:00.000Z"); // geldig, later, zelfde type
    // VOG #A verlopen + VOG #B nog geldig — zelfde profiel/type: type is gedekt.
    store.credentials = [
      makeCredential("vog-a", expiredAt, null, "user-1", "VOG"),
      makeCredential("vog-b", laterAt, null, "user-1", "VOG"),
    ];

    const { runExpiryTask } = await import("@/lib/expiry-task");
    const result = await runExpiryTask({ actorId: null, now: NOW });

    // De flip gebeurt echt (server-side waarheid), maar de valse "verlopen"-nudge blijft uit.
    expect(result.expired).toBe(1);
    const flipped = store.credentials.find((c) => c.id === "vog-a");
    expect(flipped?.status).toBe("EXPIRED");
    expect(store.notifications.filter((n) => n.type === "CREDENTIAL_EXPIRED")).toHaveLength(0);
    // De audit-flip is er wel (volledige geflipte set).
    expect(store.auditLogs.filter((a) => a.action === "CREDENTIALS_EXPIRED")).toHaveLength(1);
  });

  it("verlopen + ongedekt type → WEL 'verlopen'-notificatie", async () => {
    const expiredAt = new Date("2026-06-08T00:00:00.000Z"); // gisteren, geen dekker
    store.credentials = [makeCredential("vog-solo", expiredAt, null, "user-1", "VOG")];

    const { runExpiryTask } = await import("@/lib/expiry-task");
    const result = await runExpiryTask({ actorId: null, now: NOW });

    // Geen dekking → de melding moet er wél zijn (geen over-onderdrukking).
    expect(result.expired).toBe(1);
    expect(store.notifications.filter((n) => n.type === "CREDENTIAL_EXPIRED")).toHaveLength(1);
  });
});
