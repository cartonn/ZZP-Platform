// Contract van judgeNoShowReport: het oordeel wordt geclaimd via een compound-guard
// `updateMany({ where: { id, verdict: "PENDING" } })` bínnen de transactie. Twee gelijktijdige
// admin-oordelen (mogelijk verschillend) passeren beide de vóór-lees "al beoordeeld?"-check; de
// guard laat alleen de eerste committen. De tweede matcht niet meer (count 0) → nette domeinfout,
// géén dubbele auditregel of notificatie. Regressietest voor de TOCTOU-hardening.

import { describe, it, expect, vi, beforeEach } from "vitest";

const roleState = vi.hoisted(() => ({ role: "ADMIN" as string }));
const reportState = vi.hoisted(() => ({
  found: null as null | {
    id: string;
    verdict: string;
    reason: string | null;
    freelancerProfileId: string;
    freelancer: { userId: string };
    collaboration: { id: string; job: { title: string } };
  },
  updateCount: 1,
}));

const { FakeAuthError } = vi.hoisted(() => ({ FakeAuthError: class extends Error {} }));

vi.mock("@/lib/authz", () => ({
  AuthorizationError: FakeAuthError,
  requireRole: vi.fn(async (...roles: string[]) => {
    if (!roles.includes(roleState.role)) throw new FakeAuthError("Geen toegang.");
    return { id: "admin-1", role: roleState.role, status: "ACTIVE" };
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/audit", () => ({ auditData: vi.fn((d: unknown) => d) }));

const tx = vi.hoisted(() => ({
  reportUpdateMany: vi.fn(async (_args: { where: Record<string, unknown> }) => ({
    count: reportState.updateCount,
  })),
  auditCreate: vi.fn(async () => ({})),
}));
const root = vi.hoisted(() => ({
  reportCount: vi.fn(async () => 0),
  notificationCreate: vi.fn(async () => ({})),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: vi.fn(async (cb: (client: unknown) => Promise<unknown>) =>
      cb({
        noShowReport: { updateMany: tx.reportUpdateMany },
        auditLog: { create: tx.auditCreate },
      }),
    ),
    noShowReport: {
      findUnique: vi.fn(async () => reportState.found),
      count: root.reportCount,
    },
    notification: { create: root.notificationCreate },
  },
}));

import { judgeNoShowReport } from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
  roleState.role = "ADMIN";
  reportState.updateCount = 1;
  reportState.found = {
    id: "rep-1",
    verdict: "PENDING",
    reason: "kwam niet opdagen",
    freelancerProfileId: "fp-1",
    freelancer: { userId: "zzp-1" },
    collaboration: { id: "col-1", job: { title: "Nachtdienst" } },
  };
});

describe("judgeNoShowReport — compound-guard tegen dubbele beoordeling", () => {
  it("claimt via updateMany met de guard `verdict: PENDING`", async () => {
    await judgeNoShowReport("rep-1", "UNJUSTIFIED");
    expect(tx.reportUpdateMany).toHaveBeenCalledTimes(1);
    const arg = tx.reportUpdateMany.mock.calls[0]![0] as {
      where: { id: string; verdict: string };
      data: { verdict: string };
    };
    expect(arg.where).toEqual({ id: "rep-1", verdict: "PENDING" });
    expect(arg.data.verdict).toBe("UNJUSTIFIED");
    expect(tx.auditCreate).toHaveBeenCalledTimes(1);
    expect(root.notificationCreate).toHaveBeenCalledTimes(1);
  });

  it("bij een verloren race (count 0): werpt en schrijft géén audit/notificatie", async () => {
    reportState.updateCount = 0; // een gelijktijdig oordeel claimde de melding al
    await expect(judgeNoShowReport("rep-1", "JUSTIFIED")).rejects.toThrow(
      "Deze melding is al beoordeeld.",
    );
    expect(tx.auditCreate).not.toHaveBeenCalled();
    expect(root.notificationCreate).not.toHaveBeenCalled();
  });
});
