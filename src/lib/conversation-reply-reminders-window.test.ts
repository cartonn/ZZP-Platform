// Regressietest tegen een echte SQLite-database: een gesprek dat voorbij de eerste scan-batch valt
// moet alsnog zijn reply-nudge krijgen. Borgt het keyset-paginatieherstel in
// runConversationReplyReminderTask (bereikbaar-voorbij-de-cap, zelfde klasse als #1529-1534).

import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

import { CONVERSATION_REPLY_REMINDER_DAYS } from "@/lib/conversation-reply-reminders";

const fixture = await vi.hoisted(async () => {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { PrismaClient } = await import("@prisma/client");
  const directory = mkdtempSync(join(tmpdir(), "conversation-reply-reminder-window-"));
  const url = `file:${join(directory, "test.sqlite")}`;
  return { directory, url, db: new PrismaClient({ datasourceUrl: url }) };
});
vi.mock("@/lib/db", () => ({ prisma: fixture.db }));

const db = fixture.db;
// Kruist de Amsterdamse herfst-klokwissel: geschiktheid gebruikt verstreken 24-uurs-dagen.
const NOW = new Date("2026-10-27T12:34:56.789Z");
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000);

// Dag waarop de eerste nudge vuurt (3) en een niet-vurende tussendag (geen stage-dag → geen reminder).
const FIRST_STAGE_DAY = Math.min(...CONVERSATION_REPLY_REMINDER_DAYS);
const QUIET_DAY = Math.max(...CONVERSATION_REPLY_REMINDER_DAYS) - 1; // 6: binnen het venster, geen stage

beforeAll(async () => {
  const env: NodeJS.ProcessEnv = { ...process.env, DATABASE_URL: fixture.url };
  delete env.RUST_LOG;
  execFileSync(
    process.execPath,
    [
      "node_modules/prisma/build/index.js",
      "db",
      "push",
      "--skip-generate",
      "--schema",
      resolve("prisma/schema.prisma"),
    ],
    { env, timeout: 30_000, stdio: "pipe" },
  );
  for (const [id, role] of [
    ["sender", "FREELANCER"],
    ["recipient", "CLIENT"],
  ]) {
    await db.user.create({
      data: {
        id,
        role,
        email: `${id}@conversation-reply.test`,
        name: `Synthetic ${id}`,
        passwordHash: "synthetic-hash",
      },
    });
  }
}, 40_000);

beforeEach(async () => {
  await db.notification.deleteMany();
  await db.auditLog.deleteMany();
  await db.domainEvent.deleteMany();
  await db.message.deleteMany();
  await db.conversationParticipant.deleteMany();
  await db.conversation.deleteMany();
});

afterAll(async () => {
  await db.$disconnect();
  const { rmSync } = await import("node:fs");
  rmSync(fixture.directory, { recursive: true, force: true });
});

it.each([999, 1000, 2001])(
  "reaches a due conversation after %i quiet conversations in the window",
  async (count) => {
    const quietIds = Array.from({ length: count }, (_, i) => `old-${String(i).padStart(4, "0")}`);
    const targetId = "zzz-fresh"; // sorteert ná alle `old-*` → voorbij de eerste batch
    const ids = [...quietIds, targetId];

    await db.conversation.createMany({ data: ids.map((id) => ({ id })) });
    await db.conversationParticipant.createMany({
      data: ids.flatMap((id) => [
        { conversationId: id, userId: "sender" },
        { conversationId: id, userId: "recipient" },
      ]),
    });
    await db.message.createMany({
      data: ids.map((id) => ({
        id: `msg-${id}`,
        conversationId: id,
        senderId: "sender",
        body: "Fixture",
        createdAt: daysAgo(id === targetId ? FIRST_STAGE_DAY : QUIET_DAY),
      })),
    });
    // `updatedAt` is @updatedAt-gemanaged (create zet het op nu), dus achteraf terugzetten in het venster
    // via raw SQL; Prisma serialiseert de Date naar de SQLite-opslag.
    await db.$executeRaw`UPDATE "Conversation" SET "updatedAt" = ${daysAgo(QUIET_DAY)} WHERE "id" != ${targetId}`;
    await db.$executeRaw`UPDATE "Conversation" SET "updatedAt" = ${daysAgo(FIRST_STAGE_DAY)} WHERE "id" = ${targetId}`;

    const { runConversationReplyReminderTask } =
      await import("./conversation-reply-reminders-task");
    const first = await runConversationReplyReminderTask({ now: NOW });
    const repeat = await runConversationReplyReminderTask({ now: NOW });

    expect(first).toEqual({ reminded: 1 });
    expect(repeat).toEqual({ reminded: 0 });
    expect(
      await db.notification.findMany({ select: { userId: true, link: true, type: true } }),
    ).toEqual([
      {
        userId: "recipient",
        link: `/berichten/${targetId}`,
        type: "CONVERSATION_REPLY_REMINDER",
      },
    ]);
    expect(await db.domainEvent.count()).toBe(1);
    expect(await db.auditLog.count()).toBe(1);
  },
  30000,
);
