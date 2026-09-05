// Contract van setStatus (acknowledgeIncident/resolveIncident): de statusovergang wordt geclaimd
// via een compound-guard `updateMany({ where: { id, status: from } })` bínnen de transactie.
// `INCIDENT_TRANSITIONS` staat terug-overgangen naar OPEN toe, dus twee gelijktijdige admin-klikken
// (bv. één acknowledge, één resolve) passeren beide de vóór-lees. De guard laat alleen de eerste
// committen; de tweede matcht niet meer (count 0) → geen stale-overschrijving, geen dubbele
// auditregel. Regressietest voor de TOCTOU-hardening.

import { describe, it, expect, vi, beforeEach } from "vitest";

const incidentState = vi.hoisted(() => ({
  found: null as null | {
    id: string;
    status: string;
    acknowledgedAt: Date | null;
    resolvedAt: Date | null;
  },
  updateCount: 1,
}));

vi.mock("@/lib/authz", () => ({
  requireRole: vi.fn(async () => ({ id: "admin-1", role: "ADMIN", status: "ACTIVE" })),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/audit", () => ({ auditData: vi.fn((d: unknown) => d) }));

const tx = vi.hoisted(() => ({
  incidentUpdateMany: vi.fn(async (_args: { where: Record<string, unknown> }) => ({
    count: incidentState.updateCount,
  })),
  auditCreate: vi.fn(async () => ({})),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: vi.fn(async (cb: (client: unknown) => Promise<unknown>) =>
      cb({
        healthIncident: { updateMany: tx.incidentUpdateMany },
        auditLog: { create: tx.auditCreate },
      }),
    ),
    healthIncident: { findUnique: vi.fn(async () => incidentState.found) },
  },
}));

import { acknowledgeIncident } from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
  incidentState.updateCount = 1;
  incidentState.found = { id: "inc-1", status: "OPEN", acknowledgedAt: null, resolvedAt: null };
});

describe("setStatus — compound-guard tegen dubbele/stale incident-overgang", () => {
  it("claimt via updateMany met de guard `status: from`", async () => {
    await acknowledgeIncident("inc-1");
    expect(tx.incidentUpdateMany).toHaveBeenCalledTimes(1);
    const arg = tx.incidentUpdateMany.mock.calls[0]![0] as {
      where: { id: string; status: string };
      data: { status: string };
    };
    expect(arg.where).toEqual({ id: "inc-1", status: "OPEN" });
    expect(arg.data.status).toBe("ACKNOWLEDGED");
    expect(tx.auditCreate).toHaveBeenCalledTimes(1);
  });

  it("bij een verloren race (count 0): schrijft géén auditregel", async () => {
    incidentState.updateCount = 0; // een gelijktijdige klik veranderde de status al
    await acknowledgeIncident("inc-1");
    expect(tx.incidentUpdateMany).toHaveBeenCalledTimes(1);
    expect(tx.auditCreate).not.toHaveBeenCalled();
  });

  it("onbestaand incident: geen transactie", async () => {
    incidentState.found = null;
    await acknowledgeIncident("weg");
    expect(tx.incidentUpdateMany).not.toHaveBeenCalled();
    expect(tx.auditCreate).not.toHaveBeenCalled();
  });
});
