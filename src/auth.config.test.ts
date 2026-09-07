import { describe, expect, it } from "vitest";
import { authConfig } from "./auth.config";

const jwt = authConfig.callbacks.jwt;
type Input = Parameters<typeof jwt>[0];

describe("JWT security claims", () => {
  it("ignores untrusted client session updates", () => {
    const token = {
      id: "u1",
      role: "FREELANCER",
      status: "ACTIVE",
      mustChangePassword: true,
      passwordChangedAt: 1000,
    };
    const result = jwt({
      token: { ...token },
      trigger: "update",
      session: {
        mustChangePassword: false,
        role: "ADMIN",
        status: "ACTIVE",
        passwordChangedAt: 999999,
      },
    } as unknown as Input);
    expect(result).toEqual(token);
  });

  it("takes claims from the authenticated user on a fresh login", () => {
    const result = jwt({
      token: { mustChangePassword: true },
      user: {
        id: "u1",
        role: "FREELANCER",
        status: "ACTIVE",
        mustChangePassword: false,
        passwordChangedAt: 2000,
      },
    } as unknown as Input);
    expect(result).toMatchObject({ id: "u1", mustChangePassword: false, passwordChangedAt: 2000 });
  });

  it("preserves security claims when rotating an existing token", () => {
    const token = { id: "u1", mustChangePassword: true, passwordChangedAt: 1000 };
    expect(jwt({ token: { ...token } } as unknown as Input)).toEqual(token);
  });
});
