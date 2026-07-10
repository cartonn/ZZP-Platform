// Regressietest — wachtwoord-reset-poisoning (CWE-640 / OWASP A01/A07, account-overname).
//
// Vóór de fix bouwde requestPasswordReset de reset-URL uit de door de client beïnvloedbare
// `x-forwarded-host`/`host`-header. Een aanvaller kon zo een reset aanvragen voor een slachtoffer
// met `Host: attacker.example`, waarna de reset-mail een GELDIG token naar het aanvallerdomein
// wees → overname bij één klik. Deze test zet een vervalste host én een geconfigureerde AUTH_URL en
// eist dat de verzonden reset-URL de vertrouwde AUTH_URL gebruikt (niet de vervalste host).

import { describe, it, expect, vi, beforeEach } from "vitest";

const state = vi.hoisted(() => ({
  capturedResetUrl: "" as string,
  user: {
    id: "user-1",
    name: "Slachtoffer",
    email: "victim@example.com",
    status: "ACTIVE" as string,
  } as { id: string; name: string; email: string; status: string } | null,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: (name: string) =>
      name === "x-forwarded-host"
        ? "attacker.example"
        : name === "x-forwarded-proto"
          ? "https"
          : null,
  })),
}));

vi.mock("@/lib/db", () => ({
  prisma: { user: { findUnique: vi.fn(async () => state.user) } },
}));
vi.mock("@/lib/password-reset", () => ({ createResetToken: vi.fn(async () => "RAWTOKEN123") }));
vi.mock("@/lib/services/reset-email", () => ({
  buildResetEmail: vi.fn((opts: { resetUrl: string }) => {
    state.capturedResetUrl = opts.resetUrl;
    return { to: "victim@example.com", subject: "reset", html: "", text: "" };
  }),
}));
vi.mock("@/lib/services/mail-sender", () => ({
  getMailSender: () => ({ send: vi.fn(async () => {}) }),
}));
vi.mock("@/lib/audit", () => ({ audit: vi.fn(async () => {}) }));
vi.mock("@/lib/request-meta", () => ({
  requestMeta: vi.fn(async () => ({ ipAddress: "1.1.1.1" })),
}));
vi.mock("@/lib/rate-limit", () => ({
  resetRateLimiter: { check: vi.fn(async () => ({ allowed: true })) },
}));
vi.mock("@/lib/observability/mail-failure", () => ({ logMailFailure: vi.fn() }));
vi.mock("@/lib/observability/logger", () => ({ logger: { error: vi.fn() } }));
vi.mock("@/lib/observability/report", () => ({ describeError: vi.fn(() => "err") }));

import { requestPasswordReset } from "./actions";

function form(email: string): FormData {
  const fd = new FormData();
  fd.set("email", email);
  return fd;
}

describe("requestPasswordReset — host-header poisoning", () => {
  beforeEach(() => {
    state.capturedResetUrl = "";
    state.user = {
      id: "user-1",
      name: "Slachtoffer",
      email: "victim@example.com",
      status: "ACTIVE",
    };
    process.env.AUTH_URL = "https://app.zzp-platform.nl";
  });

  it("gebruikt AUTH_URL voor de reset-link, niet de vervalste Host-header", async () => {
    const res = await requestPasswordReset(undefined, form("victim@example.com"));
    expect(res.submitted).toBe(true);
    expect(state.capturedResetUrl).toBe(
      "https://app.zzp-platform.nl/wachtwoord-herstellen/RAWTOKEN123",
    );
    // Kernassertie: het aanvallerdomein mag NERGENS in de reset-link staan.
    expect(state.capturedResetUrl).not.toContain("attacker.example");
  });
});
