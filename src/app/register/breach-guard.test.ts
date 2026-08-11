// Wiring-test: de registratie-actie weigert een gelekt wachtwoord (NIST 800-63B) mét een fieldError
// op het wachtwoordveld en maakt dan GEEN account aan. Bij een niet-gelekt (of fail-open/skipped)
// wachtwoord loopt de flow gewoon door. prisma/auth/audit/rate-limit/request-meta + de breach-checker
// zijn gemockt; het echte registerSchema valideert de invoer.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ AuthError: class AuthError extends Error {} }));

import { AuthError } from "next-auth";

const checkMock = vi.hoisted(() => vi.fn());
const userFindUnique = vi.hoisted(() => vi.fn());
const userCreate = vi.hoisted(() => vi.fn());
const signInMock = vi.hoisted(() => vi.fn());
const rateCheck = vi.hoisted(() => vi.fn(async () => ({ allowed: true })));

vi.mock("@/lib/services/password-breach", () => ({
  getPasswordBreachChecker: () => ({ mode: "hibp", check: checkMock }),
  BREACHED_PASSWORD_MESSAGE: "Dit wachtwoord staat in een bekend datalek en is daardoor onveilig.",
}));
vi.mock("@/auth", () => ({ signIn: signInMock }));
vi.mock("@/lib/audit", () => ({ audit: vi.fn(async () => undefined) }));
vi.mock("@/lib/request-meta", () => ({
  requestMeta: vi.fn(async () => ({ ipAddress: "1.2.3.4" })),
}));
vi.mock("@/lib/rate-limit", () => ({ registerRateLimiter: { check: rateCheck } }));
vi.mock("@/lib/db", () => ({
  prisma: { user: { findUnique: userFindUnique, create: userCreate } },
}));

import { register } from "@/app/register/actions";
import { BREACHED_PASSWORD_MESSAGE } from "@/lib/services/password-breach";

function form(): FormData {
  const fd = new FormData();
  fd.set("name", "Test Persoon");
  fd.set("email", "nieuw@example.com");
  fd.set("password", "correct horse battery staple");
  fd.set("role", "FREELANCER");
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  userFindUnique.mockResolvedValue(null);
  userCreate.mockResolvedValue({ id: "u1", role: "FREELANCER" });
  rateCheck.mockResolvedValue({ allowed: true });
});

describe("register — gelekt-wachtwoord-poort", () => {
  it("weigert een gelekt wachtwoord met een fieldError en maakt geen account aan", async () => {
    checkMock.mockResolvedValue({ breached: true, skipped: false, count: 42 });
    const res = await register(undefined, form());
    expect(res?.fieldErrors?.password).toBe(BREACHED_PASSWORD_MESSAGE);
    expect(userCreate).not.toHaveBeenCalled();
  });

  it("laat een niet-gelekt wachtwoord door naar accountaanmaak", async () => {
    checkMock.mockResolvedValue({ breached: false, skipped: false, count: 0 });
    // signIn gooit op de succes-/AuthError-tak; de actie vertaalt dat naar een succesmelding.
    signInMock.mockRejectedValue(new AuthError("x"));
    const res = await register(undefined, form());
    expect(userCreate).toHaveBeenCalledTimes(1);
    expect(res?.fieldErrors?.password).toBeUndefined();
  });

  it("faalt open: een overgeslagen controle (storing) blokkeert registratie niet", async () => {
    checkMock.mockResolvedValue({ breached: false, skipped: true, count: 0 });
    signInMock.mockRejectedValue(new AuthError("x"));
    const res = await register(undefined, form());
    expect(userCreate).toHaveBeenCalledTimes(1);
    expect(res?.fieldErrors?.password).toBeUndefined();
  });
});
