import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({ AuthError: class AuthError extends Error {} }));

const { findUnique, create, auditCreate, transaction, signIn } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
  auditCreate: vi.fn(),
  transaction: vi.fn(),
  signIn: vi.fn(),
}));
vi.mock("@/auth", () => ({ signIn }));
vi.mock("@/lib/db", () => ({ prisma: { user: { findUnique }, $transaction: transaction } }));
vi.mock("@/lib/request-meta", () => ({ requestMeta: async () => ({}) }));
vi.mock("@/lib/rate-limit", () => ({
  registerRateLimiter: { check: async () => ({ allowed: true }) },
}));
vi.mock("@/lib/services/password-breach", () => ({
  getPasswordBreachChecker: () => ({ check: async () => ({ breached: false }) }),
  BREACHED_PASSWORD_MESSAGE: "Onveilig wachtwoord",
}));
vi.mock("bcryptjs", () => ({ default: { hash: async () => "hashed-password" } }));
import { register } from "./actions";

function form(role = "FREELANCER") {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    name: "Test Persoon",
    email: "nieuw@example.com",
    password: "correct horse battery staple",
    role,
    companyName: "Testbedrijf",
  }))
    data.set(key, value);
  return data;
}

beforeEach(() => {
  vi.resetAllMocks();
  findUnique.mockResolvedValue(null);
  create.mockResolvedValue({ id: "u1" });
  transaction.mockImplementation(async (run) =>
    run({ user: { create }, auditLog: { create: auditCreate } }),
  );
});

describe("registration commit boundary", () => {
  it.each(["FREELANCER", "CLIENT"])(
    "creates the %s profile and audit in the same transaction",
    async (role) => {
      await register(undefined, form(role));
      expect(transaction).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role,
          ...(role === "FREELANCER"
            ? { freelancerProfile: { create: {} } }
            : { company: { create: { name: "Testbedrijf" } } }),
        }),
      });
      expect(auditCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({ actorId: "u1", action: "USER_REGISTERED", entityId: "u1" }),
      });
      expect(auditCreate.mock.invocationCallOrder[0]).toBeLessThan(
        signIn.mock.invocationCallOrder[0]!,
      );
    },
  );

  it("handles a competing registration after the precheck without logging into its account", async () => {
    create.mockRejectedValue({ code: "P2002" });
    const result = await register(undefined, form());
    expect(result?.fieldErrors?.email).toContain("Er bestaat al een account");
    expect(auditCreate).not.toHaveBeenCalled();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("aborts the transaction and never signs in if the audit write fails", async () => {
    const failure = new Error("audit unavailable");
    auditCreate.mockRejectedValue(failure);
    await expect(register(undefined, form())).rejects.toBe(failure);
    expect(signIn).not.toHaveBeenCalled();
  });

  it("does not disguise database outages as an existing account", async () => {
    const failure = new Error("database unavailable");
    create.mockRejectedValue(failure);
    await expect(register(undefined, form())).rejects.toBe(failure);
    expect(signIn).not.toHaveBeenCalled();
  });
});
