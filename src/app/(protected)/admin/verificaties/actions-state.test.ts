import { describe, expect, it, vi } from "vitest";

// Regressie (persona-sweep 2026-07-09): de queue-forms op /admin/verificaties bonden de RAUWE void
// server-acties; een afwijzing met lege reden (client-`required` omzeild, of een niet-JS/scripted
// POST) liet `statusForDecision` gooien -> HTTP 500 + error-boundary i.p.v. een nette weigering.
// De `ResolveState`-wrappers moeten die fout als { error } TERUGGEVEN (nooit gooien) en de DB niet
// muteren. Robuustheidscontract: adversariële/lege input wordt geweigerd, NOOIT 500/crash.

const { tx } = vi.hoisted(() => ({
  tx: vi.fn(async (_fn?: (t: unknown) => Promise<unknown>) => [] as unknown),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    credential: {
      findUnique: vi.fn(async () => ({
        id: "cred-1",
        title: "VOG",
        status: "SUBMITTED",
        freelancerProfile: { userId: "owner-1" },
      })),
    },
    $transaction: tx,
  },
}));

vi.mock("@/lib/authz", async (orig) => {
  const actual = await orig<typeof import("@/lib/authz")>();
  return {
    ...actual,
    requireRole: vi.fn(async () => ({ id: "admin-1", role: "ADMIN", status: "ACTIVE" })),
  };
});

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { rejectCredentialState, verifyCredentialState } from "./actions";

function form(reason?: string): FormData {
  const fd = new FormData();
  if (reason !== undefined) fd.set("reason", reason);
  return fd;
}

describe("rejectCredentialState — nette weigering i.p.v. 500", () => {
  it("geeft { error } terug bij een lege reden en muteert de DB niet", async () => {
    const result = await rejectCredentialState("cred-1", undefined, form(""));
    expect(result).toBeDefined();
    expect(result && "error" in result).toBe(true);
    if (result && "error" in result) expect(result.error).toMatch(/reden/i);
    expect(tx).not.toHaveBeenCalled();
  });

  it("geeft { error } terug bij een whitespace-only reden (geen throw)", async () => {
    const result = await rejectCredentialState("cred-1", undefined, form("   "));
    expect(result && "error" in result).toBe(true);
    expect(tx).not.toHaveBeenCalled();
  });

  it("gooit nooit — de wrapper vangt elke fout af als { error }", async () => {
    await expect(rejectCredentialState("cred-1", undefined, form(""))).resolves.toBeTypeOf(
      "object",
    );
  });
});

describe("verifyCredentialState — al-beoordeeld-race i.p.v. 500", () => {
  it("geeft { error } terug wanneer de transactie 0 rijen matcht (al beoordeeld)", async () => {
    tx.mockImplementationOnce(async (fn?: (t: unknown) => Promise<unknown>) =>
      fn!({
        credential: { updateMany: vi.fn(async () => ({ count: 0 })) },
        credentialVerification: { create: vi.fn() },
        verificationRequest: { updateMany: vi.fn() },
        notification: { create: vi.fn() },
        auditLog: { create: vi.fn() },
      }),
    );
    const result = await verifyCredentialState("cred-1", undefined, new FormData());
    expect(result && "error" in result).toBe(true);
    if (result && "error" in result) expect(result.error).toMatch(/al beoordeeld/i);
  });
});
