// Unit-tests voor de wachtwoord-wijziging server action, met focus op de brute-force-rem op de
// her-authenticatie (CWE-307 / OWASP A07): een aanvaller met een geldige (gestolen) sessie mag het
// huidige wachtwoord niet ongelimiteerd kunnen raden. prisma/authz/audit/requestMeta/rate-limit/auth
// zijn gemockt zodat de test het GEDRAG van de action toetst (rem-poort, reset, wachtwoordcheck).

import { describe, it, expect, vi, beforeEach } from "vitest";

const store = {
  actor: { id: "user-1", role: "FREELANCER", status: "ACTIVE" },
  passwordHash: "pw-hash" as string | null,
};

const userFindUnique = vi.hoisted(() => vi.fn());
const userUpdate = vi.hoisted(() =>
  vi.fn(async (_args: { data: Record<string, unknown> }) => ({})),
);
const auditMock = vi.hoisted(() => vi.fn(async () => undefined));
const bcryptCompare = vi.hoisted(() => vi.fn(async () => true));
const bcryptHash = vi.hoisted(() => vi.fn(async () => "new-hash"));
const signOutMock = vi.hoisted(() => vi.fn(async () => undefined));
const breachCheck = vi.hoisted(() => vi.fn(async () => ({ breached: false })));
// Her-authenticatie-rem: default toestaan; tests overschrijven `check`.
const reauthCheck = vi.hoisted(() =>
  vi.fn(async () => ({ allowed: true, remaining: 4, retryAfterMs: 0 })),
);
const reauthReset = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock("@/lib/authz", () => ({ requireActor: vi.fn(async () => store.actor) }));
vi.mock("@/auth", () => ({ signOut: signOutMock }));
vi.mock("@/lib/security/clear-site-data", () => ({
  logoutRedirect: (to: string) => to,
}));
vi.mock("@/lib/db", () => ({
  prisma: { user: { findUnique: userFindUnique, update: userUpdate } },
}));
vi.mock("@/lib/audit", () => ({ audit: auditMock }));
vi.mock("@/lib/request-meta", () => ({
  requestMeta: vi.fn(async () => ({ ipAddress: "1.2.3.4", userAgent: "test" })),
}));
vi.mock("@/lib/rate-limit", () => ({
  reauthRateLimiter: { check: reauthCheck, reset: reauthReset },
}));
vi.mock("bcryptjs", () => ({ default: { compare: bcryptCompare, hash: bcryptHash } }));
vi.mock("@/lib/services/password-breach", () => ({
  getPasswordBreachChecker: () => ({ check: breachCheck }),
  BREACHED_PASSWORD_MESSAGE: "Dit wachtwoord staat in een bekende lek.",
}));

import { changePassword } from "@/app/(protected)/account/wachtwoord/actions";

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const validForm = () =>
  form({
    currentPassword: "OldPass123",
    newPassword: "NewPass123",
    confirmPassword: "NewPass123",
  });

beforeEach(() => {
  vi.clearAllMocks();
  store.actor = { id: "user-1", role: "FREELANCER", status: "ACTIVE" };
  store.passwordHash = "pw-hash";
  userFindUnique.mockImplementation(async () => ({ passwordHash: store.passwordHash }));
  bcryptCompare.mockImplementation(async () => true);
  bcryptHash.mockImplementation(async () => "new-hash");
  breachCheck.mockImplementation(async () => ({ breached: false }));
  reauthCheck.mockResolvedValue({ allowed: true, remaining: 4, retryAfterMs: 0 });
  reauthReset.mockResolvedValue(undefined);
});

describe("changePassword — her-authenticatie-rem", () => {
  it("weigert bij overschrijding van de rem — vóór de wachtwoord-check, met audit", async () => {
    reauthCheck.mockResolvedValue({ allowed: false, remaining: 0, retryAfterMs: 60_000 });
    const res = await changePassword(undefined, validForm());
    expect(res.error).toMatch(/te veel pogingen/i);
    // De rem gaat vóór de bcrypt-check en vóór enige schrijf/uitlog-actie.
    expect(userFindUnique).not.toHaveBeenCalled();
    expect(bcryptCompare).not.toHaveBeenCalled();
    expect(userUpdate).not.toHaveBeenCalled();
    expect(signOutMock).not.toHaveBeenCalled();
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "AUTH_RATE_LIMITED",
        metadata: { context: "change-password" },
      }),
    );
    expect(reauthReset).not.toHaveBeenCalled();
  });

  it("een fout huidig wachtwoord reset de rem NIET (blijft meetellen)", async () => {
    bcryptCompare.mockImplementation(async () => false);
    const res = await changePassword(undefined, validForm());
    expect(res.fieldErrors?.currentPassword).toBeTruthy();
    expect(userUpdate).not.toHaveBeenCalled();
    expect(reauthReset).not.toHaveBeenCalled();
  });

  it("bij een juist wachtwoord reset de rem en wordt het wachtwoord gewijzigd + uitgelogd", async () => {
    const res = await changePassword(undefined, validForm());
    expect(res).toEqual({});
    expect(reauthReset).toHaveBeenCalledWith("user-1");
    const data = userUpdate.mock.calls[0]?.[0]?.data as Record<string, unknown>;
    expect(data.passwordHash).toBe("new-hash");
    expect(data.passwordChangedAt).toBeInstanceOf(Date);
    expect(auditMock).toHaveBeenCalledWith(expect.objectContaining({ action: "PASSWORD_CHANGED" }));
    expect(signOutMock).toHaveBeenCalled();
  });
});
