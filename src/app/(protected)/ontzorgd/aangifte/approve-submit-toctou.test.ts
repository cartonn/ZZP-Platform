// TOCTOU-grendel op approveAndSubmit / revokeFiling (DOEL 2 — status-/audit-integriteit onder
// concurrency; persona-sweep run 57).
//
// Defect (CLAUDE.md regel 5 — audit exact één keer per reëel event; regel 1 — server-side waarheid,
// symmetrisch over concurrente paden): `approveAndSubmit` las de status één keer (stale snapshot),
// riep dan `partner.submit()` aan (EXTERN, onomkeerbaar — in productie de echte SBR/Digipoort-aangifte)
// en schreef pas dáárna blind terug via `update({ where: { id } })`. Twee gelijktijdige aanroepen
// (dubbelklik/replay) passeerden beide `assertTaxFilingTransition` en dienden beide écht in → dubbele
// aangifte + twee `TAX_FILING_SUBMITTED`-audits voor één verzoek. De rest van de cascade-familie
// (resolveDispute/openDispute/invoice/performance) gebruikt al de compound-guarded `updateMany`; dit
// pad niet.
//
// Fix: claim de overgang ATOMISCH vóór het externe effect met `updateMany({ where: { id, status:
// "CONCEPT_KLAAR" } })`. Verliezer → count 0 → gooit, roept de partner NIET aan, schrijft geen audit.

import { describe, it, expect, vi, beforeEach } from "vitest";

// De guard-uitkomst binnen de claim-updateMany (0 = race verloren, 1 = gewonnen). In een object zodat
// de vi.mock-factory (gehoist) de live waarde leest.
const state = { claimCount: 1, revokeCount: 1 };

const h = vi.hoisted(() => {
  const updateMany = vi.fn();
  const update = vi.fn(async () => ({}));
  const findUnique = vi.fn();
  const auditFn = vi.fn(async () => ({}));
  const submit = vi.fn(async () => ({ submissionRef: "SBR-REF-1" }));
  return { updateMany, update, findUnique, auditFn, submit };
});

vi.mock("@/lib/db", () => ({
  prisma: {
    taxFilingRequest: { findUnique: h.findUnique, updateMany: h.updateMany, update: h.update },
  },
}));
vi.mock("@/lib/authz", () => ({
  AuthorizationError: class extends Error {},
  requireActor: vi.fn(async () => ({ id: "u1", role: "FREELANCER", status: "ACTIVE" })),
}));
vi.mock("@/lib/audit", () => ({ audit: h.auditFn }));
vi.mock("@/lib/tax-filing/partner", () => ({ getTaxFilingPartner: () => ({ submit: h.submit }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { approveAndSubmit, revokeFiling } from "./actions";

beforeEach(() => {
  state.claimCount = 1;
  state.revokeCount = 1;
  h.updateMany.mockReset();
  h.updateMany.mockImplementation(async (args: { where?: { status?: unknown } }) => {
    const st = args?.where?.status;
    // revoke gebruikt `status: { in: [...] }` (object); claim gebruikt `status: "CONCEPT_KLAAR"` (string);
    // compensatie gebruikt `status: "INGEDIEND"` (string) → altijd count 1 (rollback slaagt).
    if (st && typeof st === "object") return { count: state.revokeCount };
    if (st === "CONCEPT_KLAAR") return { count: state.claimCount };
    return { count: 1 };
  });
  h.update.mockClear();
  h.auditFn.mockClear();
  h.submit.mockReset();
  h.submit.mockResolvedValue({ submissionRef: "SBR-REF-1" });
  h.findUnique.mockReset();
  h.findUnique.mockResolvedValue({
    id: "tf-1",
    userId: "u1",
    status: "CONCEPT_KLAAR",
    taxYear: 2025,
    kind: "IB",
    quarter: null,
    conceptAmountCents: 123400,
    submissionRef: null,
  });
});

const updateMany = h.updateMany;
const update = h.update;
const auditFn = h.auditFn;
const submit = h.submit;

describe("approveAndSubmit — TOCTOU-grendel", () => {
  it("gewonnen race: claimt één keer, dient één keer in, schrijft één audit", async () => {
    state.claimCount = 1;
    await approveAndSubmit("tf-1");
    // exact één claim + één externe indiening + één finalize-write + één audit
    expect(submit).toHaveBeenCalledTimes(1);
    expect(auditFn).toHaveBeenCalledTimes(1);
    expect(auditFn).toHaveBeenCalledWith(
      expect.objectContaining({ action: "TAX_FILING_SUBMITTED" }),
    );
    // de claim gebruikt de compound-guard (status CONCEPT_KLAAR)
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "tf-1", status: "CONCEPT_KLAAR" }),
      }),
    );
  });

  it("verloren race: claim.count 0 → geen externe indiening, geen audit, gooit", async () => {
    state.claimCount = 0;
    await expect(approveAndSubmit("tf-1")).rejects.toThrow(/al ingediend|niet meer/i);
    expect(submit).not.toHaveBeenCalled();
    expect(auditFn).not.toHaveBeenCalled();
    // finalize-write (submissionRef) mag nooit lopen als de claim verloor
    expect(update).not.toHaveBeenCalled();
  });

  it("externe indiening faalt na claim → compensatie zet terug, geen audit", async () => {
    state.claimCount = 1;
    submit.mockRejectedValueOnce(new Error("Digipoort down"));
    await expect(approveAndSubmit("tf-1")).rejects.toThrow(/Digipoort/);
    expect(auditFn).not.toHaveBeenCalled();
    // compensatie: een updateMany die INGEDIEND+submissionRef:null terugzet naar CONCEPT_KLAAR
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "tf-1", status: "INGEDIEND" }),
        data: expect.objectContaining({ status: "CONCEPT_KLAAR" }),
      }),
    );
  });
});

describe("revokeFiling — TOCTOU-grendel", () => {
  it("verloren race: revoke.count 0 → geen audit, gooit", async () => {
    state.revokeCount = 0;
    await expect(revokeFiling("tf-1")).rejects.toThrow(/niet meer worden ingetrokken/i);
    expect(auditFn).not.toHaveBeenCalled();
  });

  it("gewonnen race: één intrekking, één audit", async () => {
    state.revokeCount = 1;
    await revokeFiling("tf-1");
    expect(auditFn).toHaveBeenCalledTimes(1);
    expect(auditFn).toHaveBeenCalledWith(expect.objectContaining({ action: "TAX_FILING_REVOKED" }));
  });
});
