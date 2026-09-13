import { beforeEach, describe, expect, it, vi } from "vitest";
import { type Actor } from "@/lib/authz";

const database = vi.hoisted(() => ({ findUnique: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { collaboration: database } }));
import { canAccessSigningPage } from "./signing-service";

beforeEach(() => {
  database.findUnique.mockReset();
  database.findUnique.mockResolvedValue({
    company: { userId: "client" },
    freelancer: { userId: "freelancer" },
  });
});

describe("signing page access before streaming", () => {
  it.each([
    ["client", "CLIENT", true],
    ["freelancer", "FREELANCER", true],
    ["admin", "ADMIN", true],
    ["outsider", "CLIENT", false],
    ["outsider", "FREELANCER", false],
    ["client", "FREELANCER", false],
    ["freelancer", "CLIENT", false],
    ["client", "FRANCHISER", false],
  ] as const)("%s as %s receives access=%s", async (id, role, expected) => {
    expect(await canAccessSigningPage({ id, role, status: "ACTIVE" }, "contract")).toBe(expected);
    expect(database.findUnique).toHaveBeenCalledWith({
      where: { id: "contract" },
      select: { company: { select: { userId: true } }, freelancer: { select: { userId: true } } },
    });
  });

  it("missing and foreign resources have the same denial result, including missing for admin", async () => {
    database.findUnique.mockResolvedValue(null);
    for (const role of ["CLIENT", "FREELANCER", "ADMIN"] as const)
      expect(await canAccessSigningPage({ id: "viewer", role, status: "ACTIVE" }, "missing")).toBe(
        false,
      );
  });

  it("an inactive actor never reaches the resource query", async () => {
    await expect(
      canAccessSigningPage(
        { id: "client", role: "CLIENT", status: "SUSPENDED" } as Actor,
        "contract",
      ),
    ).rejects.toThrow();
    expect(database.findUnique).not.toHaveBeenCalled();
  });
});
