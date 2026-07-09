import { describe, expect, it } from "vitest";
import {
  CREDENTIAL_JOB_EXPIRY_WINDOW_DAYS,
  summarizeCandidateCredentialExpiry,
  type CandidateCredentialInput,
} from "@/lib/candidate-credential-expiry";

const NOW = new Date("2026-01-01T00:00:00Z");
const day = (n: number) => new Date(NOW.getTime() + n * 24 * 60 * 60 * 1000);

function cred(over: Partial<CandidateCredentialInput> = {}): CandidateCredentialInput {
  return { type: "VOG", status: "VERIFIED", expiresAt: day(365), ...over };
}

describe("summarizeCandidateCredentialExpiry", () => {
  it("geeft null zonder startdatum (timing niet te beoordelen)", () => {
    const out = summarizeCandidateCredentialExpiry({
      requiredTypes: ["VOG"],
      credentials: [cred({ expiresAt: day(5) })],
      jobStartDate: null,
      now: NOW,
    });
    expect(out).toBeNull();
  });

  it("geeft null zonder vereiste certificaten", () => {
    const out = summarizeCandidateCredentialExpiry({
      requiredTypes: [],
      credentials: [cred({ expiresAt: day(5) })],
      jobStartDate: day(20),
      now: NOW,
    });
    expect(out).toBeNull();
  });

  it("markeert een certificaat dat vóór de startdatum verloopt als before-start", () => {
    const out = summarizeCandidateCredentialExpiry({
      requiredTypes: ["VOG"],
      credentials: [cred({ expiresAt: day(10) })],
      jobStartDate: day(20),
      now: NOW,
    });
    expect(out).not.toBeNull();
    expect(out!.worstPhase).toBe("before-start");
    expect(out!.concerns).toHaveLength(1);
    expect(out!.concerns[0].type).toBe("VOG");
    expect(out!.concerns[0].daysFromStartToExpiry).toBe(-10);
  });

  it("markeert verval kort ná de start als soon-after-start", () => {
    const out = summarizeCandidateCredentialExpiry({
      requiredTypes: ["VOG"],
      credentials: [cred({ expiresAt: day(30) })],
      jobStartDate: day(20),
      now: NOW,
    });
    expect(out).not.toBeNull();
    expect(out!.worstPhase).toBe("soon-after-start");
    expect(out!.concerns[0].daysFromStartToExpiry).toBe(10);
  });

  it("negeert verval ruim ná het venster", () => {
    const out = summarizeCandidateCredentialExpiry({
      requiredTypes: ["VOG"],
      credentials: [cred({ expiresAt: day(20 + CREDENTIAL_JOB_EXPIRY_WINDOW_DAYS + 5) })],
      jobStartDate: day(20),
      now: NOW,
    });
    expect(out).toBeNull();
  });

  it("neemt de grens (exact op start+venster) nog mee", () => {
    const out = summarizeCandidateCredentialExpiry({
      requiredTypes: ["VOG"],
      credentials: [cred({ expiresAt: day(20 + CREDENTIAL_JOB_EXPIRY_WINDOW_DAYS) })],
      jobStartDate: day(20),
      now: NOW,
    });
    expect(out).not.toBeNull();
    expect(out!.worstPhase).toBe("soon-after-start");
  });

  it("negeert reeds verlopen certificaten (die dekt de compliance-blokkade al)", () => {
    const out = summarizeCandidateCredentialExpiry({
      requiredTypes: ["VOG"],
      credentials: [cred({ expiresAt: day(-1) })],
      jobStartDate: day(20),
      now: NOW,
    });
    expect(out).toBeNull();
  });

  it("negeert niet-VERIFIED certificaten (in beoordeling / concept)", () => {
    const out = summarizeCandidateCredentialExpiry({
      requiredTypes: ["VOG"],
      credentials: [cred({ status: "SUBMITTED", expiresAt: day(10) })],
      jobStartDate: day(20),
      now: NOW,
    });
    expect(out).toBeNull();
  });

  it("negeert certificaten zonder vervaldatum (verlopen nooit)", () => {
    const out = summarizeCandidateCredentialExpiry({
      requiredTypes: ["VOG"],
      credentials: [cred({ expiresAt: null })],
      jobStartDate: day(20),
      now: NOW,
    });
    expect(out).toBeNull();
  });

  it("negeert certificaattypes die niet vereist zijn", () => {
    const out = summarizeCandidateCredentialExpiry({
      requiredTypes: ["LICENSE"],
      credentials: [cred({ type: "VOG", expiresAt: day(5) })],
      jobStartDate: day(20),
      now: NOW,
    });
    expect(out).toBeNull();
  });

  it("kiest het laatst-vervallende certificaat van een type (compliance leunt daarop)", () => {
    const out = summarizeCandidateCredentialExpiry({
      requiredTypes: ["VOG"],
      credentials: [
        cred({ expiresAt: day(5) }),
        cred({ expiresAt: day(25) }), // dit exemplaar houdt de compliance overeind
      ],
      jobStartDate: day(20),
      now: NOW,
    });
    // Laatst-vervallende = day(25) → 5 dagen ná start → soon-after-start.
    expect(out).not.toBeNull();
    expect(out!.worstPhase).toBe("soon-after-start");
    expect(out!.concerns[0].daysFromStartToExpiry).toBe(5);
  });

  it("sorteert before-start vóór soon-after-start en de vroegste vervaldatum eerst", () => {
    const out = summarizeCandidateCredentialExpiry({
      requiredTypes: ["VOG", "LICENSE", "DIPLOMA"],
      credentials: [
        cred({ type: "VOG", expiresAt: day(25) }), // soon-after-start (+5)
        cred({ type: "LICENSE", expiresAt: day(10) }), // before-start (-10)
        cred({ type: "DIPLOMA", expiresAt: day(18) }), // before-start (-2)
      ],
      jobStartDate: day(20),
      now: NOW,
    });
    expect(out).not.toBeNull();
    expect(out!.worstPhase).toBe("before-start");
    expect(out!.concerns.map((c) => c.type)).toEqual(["LICENSE", "DIPLOMA", "VOG"]);
  });
});
