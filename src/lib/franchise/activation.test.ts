import { describe, it, expect } from "vitest";
import {
  ACTIVATION_GATE_PATH,
  activationGatePath,
  canTransitionTenant,
  statusForActivation,
  TenantTransitionError,
} from "@/lib/franchise/activation";
import { bureauRegisterSchema } from "@/lib/validation";

describe("activationGatePath", () => {
  it("stuurt een wachtende of afgewezen aanmelding naar de wachtpagina", () => {
    expect(activationGatePath("PENDING")).toBe(ACTIVATION_GATE_PATH);
    expect(activationGatePath("REJECTED")).toBe(ACTIVATION_GATE_PATH);
  });

  it("laat een actieve tenant en een gebruiker zonder tenant ongemoeid", () => {
    expect(activationGatePath("ACTIVE")).toBeNull();
    expect(activationGatePath(null)).toBeNull();
    expect(activationGatePath(undefined)).toBeNull();
  });

  it("laat een geschorste tenant met rust (die volgt het bestaande schorsingspad)", () => {
    expect(activationGatePath("SUSPENDED")).toBeNull();
  });
});

describe("tenant-statusovergangen", () => {
  it("staat alleen PENDING → ACTIVE en PENDING → REJECTED toe vanaf PENDING", () => {
    expect(canTransitionTenant("PENDING", "ACTIVE")).toBe(true);
    expect(canTransitionTenant("PENDING", "REJECTED")).toBe(true);
    expect(canTransitionTenant("PENDING", "SUSPENDED")).toBe(false);
  });

  it("weigert het heropenen van een afgewezen aanmelding", () => {
    expect(canTransitionTenant("REJECTED", "ACTIVE")).toBe(false);
    expect(canTransitionTenant("REJECTED", "PENDING")).toBe(false);
  });

  it("weigert een onbekende bronstatus", () => {
    expect(canTransitionTenant("ONZIN", "ACTIVE")).toBe(false);
  });
});

describe("statusForActivation", () => {
  it("activeert een wachtende aanmelding", () => {
    expect(statusForActivation("PENDING", "ACTIVATE")).toBe("ACTIVE");
  });

  it("eist een reden bij een afwijzing (server-side)", () => {
    expect(() => statusForActivation("PENDING", "REJECT")).toThrow(/reden/i);
    expect(() => statusForActivation("PENDING", "REJECT", "   ")).toThrow(/reden/i);
    expect(statusForActivation("PENDING", "REJECT", "KvK klopt niet")).toBe("REJECTED");
  });

  it("weigert een tweede beslissing op een al geactiveerde bemiddeling", () => {
    expect(() => statusForActivation("ACTIVE", "ACTIVATE")).toThrow(TenantTransitionError);
    expect(() => statusForActivation("REJECTED", "REJECT", "nogmaals")).toThrow(
      TenantTransitionError,
    );
  });
});

describe("bureauRegisterSchema", () => {
  const valid = {
    bureauName: "Zorgbemiddeling Noord",
    kvkNumber: "12 345.678",
    name: "Anna de Vries",
    email: "  Anna@Bureau.NL ",
    password: "geheim123",
  };

  it("normaliseert KvK-nummer en e-mail", () => {
    const parsed = bureauRegisterSchema.parse(valid);
    expect(parsed.kvkNumber).toBe("12345678");
    expect(parsed.email).toBe("anna@bureau.nl");
    expect(parsed.phone).toBeUndefined();
  });

  it("weigert een KvK-nummer dat geen 8 cijfers is", () => {
    const res = bureauRegisterSchema.safeParse({ ...valid, kvkNumber: "1234567" });
    expect(res.success).toBe(false);
    expect(res.success === false && res.error.flatten().fieldErrors.kvkNumber?.[0]).toMatch(/KvK/);
  });

  it("hanteert hetzelfde wachtwoordbeleid als de gewone registratie", () => {
    const res = bureauRegisterSchema.safeParse({ ...valid, password: "kort" });
    expect(res.success).toBe(false);
    expect(res.success === false && res.error.flatten().fieldErrors.password?.[0]).toMatch(/8/);
  });

  it("eist een bureaunaam", () => {
    expect(bureauRegisterSchema.safeParse({ ...valid, bureauName: "A" }).success).toBe(false);
  });
});
