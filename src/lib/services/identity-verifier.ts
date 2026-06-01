import { verifyViaHttp } from "@/lib/services/http-verify";

// Identiteitsverificatie achter een schone service-grens.
//
// Best practice: bind een geverifieerde identiteit (iDIN via de bank, of eIDAS/DigiD) aan het
// account, zodat "naam op diploma = deze persoon" hard wordt. Echte iDIN/eIDAS-onboarding
// (contract, redirect-flow, handtekeningvalidatie) is mensenwerk.
//
//  - MockIdentityVerifier: deterministisch (dev/demo/e2e). Vergelijkt de opgegeven juridische
//    naam met de accountnaam; verzint geen identiteitsgegevens.
//  - IdinIdentityVerifier: echt koppelpunt, env-geschakeld (IDENTITY_VERIFIER=idin). Faalt helder
//    zonder configuratie.

export interface IdentityVerificationInput {
  accountName: string;
  providedName: string;
}

export interface IdentityVerificationResult {
  verified: boolean;
  verifiedName: string | null;
  message: string;
  source: "MOCK" | "IDIN";
}

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/** Dev/demo-verifier: identiteit "geverifieerd" als de opgegeven naam overeenkomt met de accountnaam. */
export class MockIdentityVerifier implements IdentityVerifier {
  async verify({
    accountName,
    providedName,
  }: IdentityVerificationInput): Promise<IdentityVerificationResult> {
    const match =
      normalize(accountName) === normalize(providedName) && normalize(providedName).length > 0;
    return {
      verified: match,
      verifiedName: match ? accountName : null,
      source: "MOCK",
      message: match
        ? "Naam komt overeen met het account (dev-verifier; geen echte iDIN/eIDAS-controle)."
        : "De opgegeven juridische naam komt niet overeen met je accountnaam.",
    };
  }
}

/**
 * Echte iDIN/eIDAS-koppeling: bevestigt de identiteit tegen het geconfigureerde endpoint
 * (IDENTITY_API_BASE + IDENTITY_API_KEY) via de gedeelde HTTP-helper. De redirect-/handtekeningflow-
 * onboarding is mensenwerk; zonder config faalt 'ie helder.
 */
export class IdinIdentityVerifier implements IdentityVerifier {
  constructor(private readonly fetchImpl?: typeof fetch) {}

  async verify(input: IdentityVerificationInput): Promise<IdentityVerificationResult> {
    const raw = await verifyViaHttp(
      {
        name: "iDIN",
        baseUrl: process.env.IDENTITY_API_BASE,
        apiKey: process.env.IDENTITY_API_KEY,
        path: "/identity/verify",
        fetchImpl: this.fetchImpl,
      },
      { accountName: input.accountName.trim(), providedName: input.providedName.trim() },
    );
    return {
      verified: raw.verified,
      verifiedName: raw.verifiedName ?? (raw.verified ? input.providedName.trim() : null),
      source: "IDIN",
      message:
        raw.message ??
        (raw.verified ? "Identiteit bevestigd via iDIN." : "Identiteit kon niet worden bevestigd."),
    };
  }
}

export interface IdentityVerifier {
  verify(input: IdentityVerificationInput): Promise<IdentityVerificationResult>;
}

export function getIdentityVerifier(): IdentityVerifier {
  return process.env.IDENTITY_VERIFIER === "idin"
    ? new IdinIdentityVerifier()
    : new MockIdentityVerifier();
}
