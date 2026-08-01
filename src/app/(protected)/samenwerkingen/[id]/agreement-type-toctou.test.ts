// Integriteits-regressie (CLAUDE.md regel 2/3 — server-side waarheid, compound-guarded write): het type
// modelovereenkomst (Wet DBA) mag alleen worden gewijzigd zolang géén van beide partijen digitaal
// akkoord heeft gegeven. De guard leunde op een niet-transactionele pre-lees van de teken-timestamps
// gevolgd door een blinde `update({ where: { id } })`. In het TOCTOU-venster kon een parallelle
// signModelAgreementAction een partij laten tekenen tussen de lees en de write — de blinde write landde
// dan alsnog op de al-getekende rij, waardoor de handtekening stil aan een ánder overeenkomsttype hing
// dan getoond/getekend (dossier-corruptie, DBA-audit leunt op agreementType + timestamps samen). Deze
// test bewijst dat de write nu compound-guarded is (updateMany op beide-timestamps-null + count-gate):
// als de rij in het venster is getekend, telt de guard 0 en wordt de wijziging geweigerd.

import { describe, it, expect, vi, beforeEach } from "vitest";

const findUnique = vi.hoisted(() => vi.fn());
const updateMany = vi.hoisted(() => vi.fn());

vi.mock("@/lib/authz", () => ({
  requireActor: vi.fn(async () => ({ id: "client-1", role: "CLIENT", status: "ACTIVE" })),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/audit", () => ({ audit: vi.fn(async () => {}) }));
vi.mock("@/lib/db", () => ({
  prisma: {
    collaboration: { findUnique, updateMany },
  },
}));

import { setAgreementTypeAction } from "./actions";

function form(type: string): FormData {
  const fd = new FormData();
  fd.set("agreementType", type);
  return fd;
}

beforeEach(() => {
  findUnique.mockReset();
  updateMany.mockReset();
});

describe("setAgreementTypeAction — compound-guarded tegen TOCTOU-tekenrace", () => {
  it("gebruikt een count-gated updateMany op beide-timestamps-null (niet een blinde update op {id})", async () => {
    // Pre-lees ziet nog niets getekend → passeert de snelle UX-guard.
    findUnique.mockResolvedValue({
      company: { userId: "client-1" },
      agreementFreelancerSignedAt: null,
      agreementClientSignedAt: null,
    });
    updateMany.mockResolvedValue({ count: 1 });

    await setAgreementTypeAction("col-1", form("VRIJE_VERVANGING"));

    expect(updateMany).toHaveBeenCalledTimes(1);
    const arg = updateMany.mock.calls[0]![0] as { where: unknown; data: unknown };
    expect(arg.where).toMatchObject({
      id: "col-1",
      agreementFreelancerSignedAt: null,
      agreementClientSignedAt: null,
    });
    expect(arg.data).toMatchObject({ agreementType: "VRIJE_VERVANGING" });
  });

  it("weigert de wijziging als de rij in het TOCTOU-venster is getekend (count 0)", async () => {
    // Pre-lees ziet nog niets getekend (stale snapshot), maar tussen lees en write tekent de ZZP'er:
    // de guarded updateMany matcht de rij niet meer → count 0.
    findUnique.mockResolvedValue({
      company: { userId: "client-1" },
      agreementFreelancerSignedAt: null,
      agreementClientSignedAt: null,
    });
    updateMany.mockResolvedValue({ count: 0 });

    await expect(setAgreementTypeAction("col-1", form("VRIJE_VERVANGING"))).rejects.toThrow(
      /al ondertekend/i,
    );
    expect(updateMany).toHaveBeenCalledTimes(1);
  });

  it("weigert vroeg (zonder write) als de pre-lees al een handtekening ziet", async () => {
    findUnique.mockResolvedValue({
      company: { userId: "client-1" },
      agreementFreelancerSignedAt: new Date(),
      agreementClientSignedAt: null,
    });

    await expect(setAgreementTypeAction("col-1", form("TUSSENKOMST"))).rejects.toThrow(
      /al ondertekend/i,
    );
    expect(updateMany).not.toHaveBeenCalled();
  });
});
