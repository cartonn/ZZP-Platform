import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  toSafeActionError,
  throwSafeActionError,
  isInternalError,
  GENERIC_ACTION_ERROR,
} from "@/lib/safe-action-error";
import { AuthorizationError } from "@/lib/authz";
import { logger } from "@/lib/observability/logger";

// Houd de test stil én verifieer dat technische fouten wél server-side worden gelogd.
vi.spyOn(logger, "error").mockImplementation(() => {});

beforeEach(() => {
  vi.mocked(logger.error).mockClear();
});

/** Bootst een Prisma-clientfout na: distinctieve naam + P-code (echoot normaal schema-details). */
class FakePrismaError extends Error {
  code: string;
  constructor(message: string, code = "P2002") {
    super(message);
    this.name = "PrismaClientKnownRequestError";
    this.code = code;
  }
}

/** Bootst een Node system-error na (ECONNREFUSED/timeout — bevat normaal hostnames/paden). */
class FakeSystemError extends Error {
  code: string;
  constructor(message: string, code = "ECONNREFUSED") {
    super(message);
    this.name = "Error";
    this.code = code;
  }
}

describe("isInternalError", () => {
  it("markeert een Prisma-clientfout als intern", () => {
    expect(
      isInternalError(new FakePrismaError("Unique constraint failed on the fields: (`email`)")),
    ).toBe(true);
  });

  it("markeert een Prisma-validatiefout (naam-prefix, geen code) als intern", () => {
    const e = new Error("Invalid `prisma.user.create()` invocation");
    e.name = "PrismaClientValidationError";
    expect(isInternalError(e)).toBe(true);
  });

  it("markeert een Node system-error (string-code) als intern", () => {
    expect(isInternalError(new FakeSystemError("connect ECONNREFUSED 10.0.0.5:5432"))).toBe(true);
  });

  it("markeert een niet-Error (gegooide string/object) als intern", () => {
    expect(isInternalError("kapot")).toBe(true);
    expect(isInternalError({ message: "kapot" })).toBe(true);
    expect(isInternalError(null)).toBe(true);
  });

  it("markeert een gecureerde applicatiefout NIET als intern", () => {
    expect(isInternalError(new AuthorizationError("Geen toegang tot deze resource."))).toBe(false);
    expect(isInternalError(new Error("Document niet gevonden."))).toBe(false);
  });
});

describe("toSafeActionError", () => {
  it("lekt de rauwe Prisma-message NIET naar de client en logt server-side", () => {
    const leaky = new FakePrismaError("Unique constraint failed on the fields: (`email`)");
    const msg = toSafeActionError(leaky);
    expect(msg).toBe(GENERIC_ACTION_ERROR);
    expect(msg).not.toContain("constraint");
    expect(msg).not.toContain("email");
    expect(logger.error).toHaveBeenCalledTimes(1);
  });

  it("lekt de rauwe system-error (hostname/poort) NIET naar de client", () => {
    const msg = toSafeActionError(
      new FakeSystemError("connect ECONNREFUSED 10.0.0.5:5432"),
      "Mislukt.",
    );
    expect(msg).toBe("Mislukt.");
    expect(msg).not.toContain("10.0.0.5");
  });

  it("behoudt de gecureerde message van een applicatiefout", () => {
    expect(toSafeActionError(new AuthorizationError("Geen toegang tot deze resource."))).toBe(
      "Geen toegang tot deze resource.",
    );
    expect(toSafeActionError(new Error("Document niet gevonden."))).toBe("Document niet gevonden.");
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("gebruikt de fallback bij een niet-Error waarde", () => {
    expect(toSafeActionError("kapot", "Onbekende fout.")).toBe("Onbekende fout.");
  });
});

describe("throwSafeActionError", () => {
  it("hergooit een technische Prisma-fout als een generieke, GELOGDE Error (geen leak)", () => {
    const leaky = new FakePrismaError("Unique constraint failed on the fields: (`email`)");
    expect(() => throwSafeActionError(leaky)).toThrow(GENERIC_ACTION_ERROR);
    try {
      throwSafeActionError(leaky);
    } catch (e) {
      expect((e as Error).message).not.toContain("constraint");
      expect((e as Error).message).not.toContain("email");
    }
    // 2× aangeroepen hierboven → 2× gelogd server-side.
    expect(logger.error).toHaveBeenCalledTimes(2);
  });

  it("hergooit een system-error zonder hostname/poort te lekken", () => {
    expect(() =>
      throwSafeActionError(new FakeSystemError("connect ECONNREFUSED 10.0.0.5:5432")),
    ).toThrow(GENERIC_ACTION_ERROR);
    try {
      throwSafeActionError(new FakeSystemError("connect ECONNREFUSED 10.0.0.5:5432"));
    } catch (e) {
      expect((e as Error).message).not.toContain("10.0.0.5");
    }
  });

  it("behoudt de gecureerde message van een applicatiefout", () => {
    expect(() =>
      throwSafeActionError(new AuthorizationError("Geen toegang tot deze resource.")),
    ).toThrow("Geen toegang tot deze resource.");
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("hergooit een gegooide niet-Error waarde als een generieke Error (geen rauwe doorgifte)", () => {
    expect(() => throwSafeActionError("kapot", "Onbekende fout.")).toThrow("Onbekende fout.");
  });
});
