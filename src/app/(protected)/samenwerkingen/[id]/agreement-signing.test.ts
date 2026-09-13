import { beforeEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  actor: { id: "client", role: "CLIENT", status: "ACTIVE" },
  requireActor: vi.fn(),
  findUnique: vi.fn(),
  mutate: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));
vi.mock("@/lib/authz", () => ({ requireActor: state.requireActor }));
vi.mock("@/lib/db", () => ({
  prisma: {
    collaboration: { findUnique: state.findUnique, update: state.mutate, updateMany: state.mutate },
    contractSignature: { create: state.mutate },
    auditLog: { create: state.mutate },
    $transaction: state.mutate,
  },
}));
vi.mock("next/navigation", () => ({ redirect: state.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { signModelAgreementAction } from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
  state.actor = { id: "client", role: "CLIENT", status: "ACTIVE" };
  state.requireActor.mockImplementation(async () => state.actor);
  state.findUnique.mockResolvedValue({
    company: { userId: "client" },
    freelancer: { userId: "freelancer" },
    agreementClientSignedAt: null,
    agreementFreelancerSignedAt: null,
  });
});

it.each(["client", "freelancer"])(
  "legacy action sends %s to reviewed signing without creating a signature",
  async (id) => {
    state.actor.id = id;
    await expect(signModelAgreementAction("col/id")).rejects.toThrow(
      "REDIRECT:/samenwerkingen/col%2Fid/ondertekenen",
    );
    expect(state.requireActor).toHaveBeenCalledOnce();
    expect(state.findUnique).toHaveBeenCalledOnce();
    expect(state.mutate).not.toHaveBeenCalled();
  },
);

it.each(["outsider", "admin", "franchiser"])(
  "legacy action denies non-party %s without disclosing existence",
  async (id) => {
    state.actor.id = id;
    await expect(signModelAgreementAction("collaboration")).rejects.toThrow(
      "Samenwerking niet gevonden.",
    );
    state.findUnique.mockResolvedValueOnce(null);
    await expect(signModelAgreementAction("missing")).rejects.toThrow(
      "Samenwerking niet gevonden.",
    );
    expect(state.redirect).not.toHaveBeenCalled();
    expect(state.mutate).not.toHaveBeenCalled();
  },
);

it("authenticates before looking up a collaboration", async () => {
  state.requireActor.mockRejectedValueOnce(new Error("Niet ingelogd."));
  await expect(signModelAgreementAction("collaboration")).rejects.toThrow("Niet ingelogd.");
  expect(state.findUnique).not.toHaveBeenCalled();
  expect(state.mutate).not.toHaveBeenCalled();
});
