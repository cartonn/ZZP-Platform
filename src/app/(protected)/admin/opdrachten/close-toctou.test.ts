// Contract van adminCloseJob: de sluiting wordt geclaimd via een compound-guard
// `updateMany({ where: { id, status: from } })` bínnen de transactie. Twee gelijktijdige
// admin-klikken passeren beide de vóór-lees; de guard laat alleen de eerste committen, de tweede
// matcht niet meer (count 0) → geen dubbele JOB_CLOSED_BY_ADMIN-auditregel. Regressietest voor
// de TOCTOU-hardening.

import { describe, it, expect, vi, beforeEach } from "vitest";

const jobState = vi.hoisted(() => ({
  found: null as null | { status: string },
  updateCount: 1,
}));

vi.mock("@/lib/authz", () => ({
  requireRole: vi.fn(async () => ({ id: "admin-1", role: "ADMIN", status: "ACTIVE" })),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/audit", () => ({ auditData: vi.fn((d: unknown) => d) }));

const tx = vi.hoisted(() => ({
  jobUpdateMany: vi.fn(async (_args: { where: Record<string, unknown> }) => ({
    count: jobState.updateCount,
  })),
  auditCreate: vi.fn(async () => ({})),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: vi.fn(async (cb: (client: unknown) => Promise<unknown>) =>
      cb({
        job: { updateMany: tx.jobUpdateMany },
        auditLog: { create: tx.auditCreate },
      }),
    ),
    job: { findUnique: vi.fn(async () => jobState.found) },
  },
}));

import { adminCloseJob } from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
  jobState.updateCount = 1;
  jobState.found = { status: "PUBLISHED" };
});

describe("adminCloseJob — compound-guard tegen dubbele sluiting", () => {
  it("claimt via updateMany met de guard `status: from`", async () => {
    await adminCloseJob("job-1");
    expect(tx.jobUpdateMany).toHaveBeenCalledTimes(1);
    const arg = tx.jobUpdateMany.mock.calls[0]![0] as {
      where: { id: string; status: string };
      data: { status: string };
    };
    expect(arg.where).toEqual({ id: "job-1", status: "PUBLISHED" });
    expect(arg.data.status).toBe("CLOSED");
    expect(tx.auditCreate).toHaveBeenCalledTimes(1);
  });

  it("bij een verloren race (count 0): schrijft géén auditregel", async () => {
    jobState.updateCount = 0;
    await adminCloseJob("job-1");
    expect(tx.jobUpdateMany).toHaveBeenCalledTimes(1);
    expect(tx.auditCreate).not.toHaveBeenCalled();
  });

  it("onbestaande opdracht: werpt, geen transactie", async () => {
    jobState.found = null;
    await expect(adminCloseJob("weg")).rejects.toThrow("Opdracht niet gevonden.");
    expect(tx.jobUpdateMany).not.toHaveBeenCalled();
  });
});
