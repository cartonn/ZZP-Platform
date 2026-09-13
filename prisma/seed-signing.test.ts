import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ load: vi.fn(), sign: vi.fn() }));
vi.mock("@/lib/signing-service", () => ({ loadSigningView: mocks.load }));
vi.mock("@/lib/cascade/contract-commands", () => ({ signContract: mocks.sign }));
import { signSeedContract } from "./seed-signing";
const client = { id: "client", role: "CLIENT", status: "ACTIVE" } as const;
const freelancer = { id: "freelancer", role: "FREELANCER", status: "ACTIVE" } as const;
const view = {
  documentHash: "a".repeat(64),
  party: "CLIENT",
  document: { client: { name: "Demo opdrachtgever" }, freelancer: { name: "Demo zelfstandige" } },
  col: { job: { credentialRequirements: [] }, freelancer: { credentials: [] } },
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("SEED_DEMO", "true");
  mocks.load.mockImplementation(async (actor) => ({ ...view, party: actor.role }));
  mocks.sign.mockResolvedValue(undefined);
});
afterEach(() => vi.unstubAllEnvs());
describe("rich demo signing", () => {
  it("signs both parties through the command with their reviewed hash, name, password and consent", async () => {
    expect(await signSeedContract(client, freelancer, "collab", "synthetic-password")).toBe(true);
    expect(mocks.sign).toHaveBeenCalledTimes(2);
    for (const [index, name] of ["Demo zelfstandige", "Demo opdrachtgever"].entries()) {
      const [actor, id, form] = mocks.sign.mock.calls[index]!;
      expect(actor).toEqual(index === 0 ? freelancer : client);
      expect(id).toBe("collab");
      expect(Object.fromEntries(form)).toEqual({
        documentHash: "a".repeat(64),
        signerName: name,
        password: "synthetic-password",
        reviewed: "on",
        consent: "on",
        authority: "on",
      });
    }
    expect(mocks.load).toHaveBeenCalledTimes(3);
  });
  it("leaves only the intended credential gap proposed without attempting signatures", async () => {
    mocks.load.mockResolvedValue({
      ...view,
      col: {
        job: { credentialRequirements: [{ credentialType: "VOG" }] },
        freelancer: { credentials: [] },
      },
    });
    expect(await signSeedContract(client, freelancer, "collab", "synthetic-password")).toBe(false);
    expect(mocks.sign).not.toHaveBeenCalled();
  });
  it("does not silently swallow a real signing or runtime failure", async () => {
    mocks.sign.mockRejectedValue(new Error("Wachtwoordcontrole mislukt."));
    await expect(
      signSeedContract(client, freelancer, "collab", "synthetic-password"),
    ).rejects.toThrow("Wachtwoordcontrole mislukt.");
    expect(mocks.sign).toHaveBeenCalledTimes(1);
  });
  it("does not sign outside the explicitly enabled demo seed", async () => {
    vi.stubEnv("SEED_DEMO", "false");
    await expect(
      signSeedContract(client, freelancer, "collab", "synthetic-password"),
    ).rejects.toThrow("uitgeschakeld");
    expect(mocks.load).not.toHaveBeenCalled();
  });
});
