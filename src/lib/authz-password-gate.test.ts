import { beforeEach, describe, expect, it, vi } from "vitest";

const { auth, findUnique } = vi.hoisted(() => ({ auth: vi.fn(), findUnique: vi.fn() }));
vi.mock("@/auth", () => ({ auth }));
vi.mock("@/lib/db", () => ({ prisma: { user: { findUnique } } }));

import { currentActor, requireActor, requireRole, requirePasswordChangeActor } from "./authz";

const fresh = {
  role: "FREELANCER",
  status: "ACTIVE",
  mustChangePassword: true,
  anonymizedAt: null,
  passwordChangedAt: new Date(1000),
  tenantId: null,
  tenant: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  // The signed token may be stale or forged via a legacy client update; the DB decides.
  auth.mockResolvedValue({
    user: { id: "u1", mustChangePassword: false, passwordChangedAt: 1000 },
  });
  findUnique.mockResolvedValue({ ...fresh });
});

describe("forced password change authorization", () => {
  it("blocks ordinary reads and mutations even when the JWT claims no change is needed", async () => {
    expect(await currentActor()).toBeNull();
    await expect(requireActor()).rejects.toMatchObject({ status: 401 });
    await expect(requireRole("FREELANCER")).rejects.toMatchObject({ status: 401 });
  });

  it("allows the validated identity to change its temporary password", async () => {
    await expect(requirePasswordChangeActor()).resolves.toMatchObject({
      id: "u1",
      mustChangePassword: true,
    });
  });

  it.each([
    ["suspended", { status: "SUSPENDED" }],
    ["anonymized", { anonymizedAt: new Date() }],
    ["revoked session", { passwordChangedAt: new Date(2000) }],
    ["inactive tenant", { tenantId: "t1", tenant: { status: "SUSPENDED" } }],
  ])("does not let the password exception bypass %s access", async (_label, override) => {
    findUnique.mockResolvedValue({ ...fresh, ...override });
    await expect(requirePasswordChangeActor()).rejects.toMatchObject({ status: 401 });
  });

  it("rejects anonymous identities and deleted accounts on the exception path", async () => {
    auth.mockResolvedValue(null);
    await expect(requirePasswordChangeActor()).rejects.toMatchObject({ status: 401 });
    expect(findUnique).not.toHaveBeenCalled();
    auth.mockResolvedValue({ user: { id: "u1" } });
    findUnique.mockResolvedValue(null);
    await expect(requirePasswordChangeActor()).rejects.toMatchObject({ status: 401 });
  });

  it("allows ordinary access after the database flag is cleared and the user logs in again", async () => {
    findUnique.mockResolvedValue({
      ...fresh,
      mustChangePassword: false,
      passwordChangedAt: new Date(2000),
    });
    auth.mockResolvedValue({ user: { id: "u1", passwordChangedAt: 2000 } });
    await expect(requireRole("FREELANCER")).resolves.toMatchObject({ id: "u1" });
  });
});
