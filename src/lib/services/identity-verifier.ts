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
  async verify({ accountName, providedName }: IdentityVerificationInput): Promise<IdentityVerificationResult> {
    const match = normalize(accountName) === normalize(providedName) && normalize(providedName).length > 0;
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

/** Echte iDIN/eIDAS-koppeling. Vereist productie-onboarding; zonder config faalt 'ie helder. */
export class IdinIdentityVerifier implements IdentityVerifier {
  async verify(): Promise<IdentityVerificationResult> {
    throw new Error(
      "Identiteitsverificatie (iDIN/eIDAS) is niet geconfigureerd. Stel IDENTITY_API_BASE + credentials in " +
        "en implementeer de redirect-/handtekeningflow (echte onboarding is mensenwerk).",
    );
  }
}

export interface IdentityVerifier {
  verify(input: IdentityVerificationInput): Promise<IdentityVerificationResult>;
}

export function getIdentityVerifier(): IdentityVerifier {
  return process.env.IDENTITY_VERIFIER === "idin" ? new IdinIdentityVerifier() : new MockIdentityVerifier();
}
