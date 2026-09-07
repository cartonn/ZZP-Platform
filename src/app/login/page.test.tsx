import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { authMock, findUser, redirectMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  findUser: vi.fn(),
  redirectMock: vi.fn((path: string): never => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/db", () => ({ prisma: { user: { findUnique: findUser } } }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/public-trust", () => ({ getPublicTrustStats: async () => ({}) }));
vi.mock("@/lib/i18n/server", () => ({
  getTranslator: async () => ({ t: (text: string) => text }),
}));
vi.mock("@/components/marketing/trust-strip", () => ({ TrustStrip: () => null }));
vi.mock("@/components/ui/theme-toggle", () => ({ ThemeToggle: () => null }));
vi.mock("./login-form", () => ({ LoginForm: () => <form data-testid="login-form" /> }));

import LoginPage from "./page";

const SESSION = {
  user: { id: "user-1", role: "FREELANCER", status: "ACTIVE", passwordChangedAt: 1_000 },
};
const USER = {
  role: "FREELANCER",
  status: "ACTIVE",
  mustChangePassword: false,
  anonymizedAt: null,
  passwordChangedAt: new Date(1_000),
  tenantId: null,
  tenant: null,
};

const page = () => LoginPage({ searchParams: Promise.resolve({}) });

describe("login page session recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(SESSION);
    findUser.mockResolvedValue(USER);
  });

  it("redirects a currently authorized user to the dashboard", async () => {
    await expect(page()).rejects.toThrow("redirect:/dashboard");
  });

  it("shows the login form when a password reset revoked the JWT", async () => {
    findUser.mockResolvedValue({ ...USER, passwordChangedAt: new Date(2_000) });
    expect(renderToStaticMarkup(await page())).toContain('data-testid="login-form"');
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects a valid temporary-password identity to password change", async () => {
    findUser.mockResolvedValue({ ...USER, mustChangePassword: true });
    await expect(page()).rejects.toThrow("redirect:/account/wachtwoord");
  });

  it("does not revive a revoked session with a pending password change", async () => {
    findUser.mockResolvedValue({
      ...USER,
      mustChangePassword: true,
      passwordChangedAt: new Date(2_000),
    });
    expect(renderToStaticMarkup(await page())).toContain('data-testid="login-form"');
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it.each(["PENDING", "REJECTED", "SUSPENDED"])(
    "allows signing in again for a %s tenant without dashboard redirects",
    async (status) => {
      findUser.mockResolvedValue({ ...USER, tenantId: "tenant-1", tenant: { status } });
      expect(renderToStaticMarkup(await page())).toContain('data-testid="login-form"');
      expect(redirectMock).not.toHaveBeenCalled();
    },
  );

  it("shows the form to a visitor without a session", async () => {
    authMock.mockResolvedValue(null);
    expect(renderToStaticMarkup(await page())).toContain('data-testid="login-form"');
    expect(findUser).not.toHaveBeenCalled();
  });

  it("does not swallow infrastructure errors from the password exception", async () => {
    findUser.mockResolvedValueOnce(null).mockRejectedValueOnce(new Error("database unavailable"));
    await expect(page()).rejects.toThrow("database unavailable");
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
