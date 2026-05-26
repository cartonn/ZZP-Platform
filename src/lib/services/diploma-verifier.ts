// Diploma-/certificaatverificatie achter een schone service-grens.
//
// REALITEIT: er is geen open DUO-API om vrij iemands diploma op te vragen. De echte route is het
// DUO-diplomaregister ("Mijn diploma's"): de houder haalt met DigiD een gewaarmerkt uittreksel met
// VERIFICATIECODE op en deelt die; de verifieerder controleert die code/handtekening bij DUO.
//
// Daarom: één interface, twee implementaties.
//  - MockDiplomaVerifier: deterministisch, werkt nu (dev/demo/e2e). Verzint GEEN diplomagegevens.
//  - DuoDiplomaVerifier: het echte koppelpunt, env-geschakeld (DIPLOMA_VERIFIER=duo). Echte
//    DUO-onboarding (contract, certificaten, endpoint) is mensenwerk; zonder config faalt 'ie helder.

export interface DiplomaVerificationInput {
  verificationCode: string;
  holderName: string;
}

export interface DiplomaVerificationResult {
  verified: boolean;
  message: string;
  source: "MOCK" | "DUO";
}

export interface DiplomaVerifier {
  verify(input: DiplomaVerificationInput): Promise<DiplomaVerificationResult>;
}

/** Plausibel formaat van een DUO-verificatiecode (gewaarmerkt uittreksel). */
export const DUO_CODE_PATTERN = /^DUO-[A-Z0-9]{4}-[A-Z0-9]{4}$/i;

/** Dev/demo-verifier: valideert uitsluitend het codeformaat. Verzint geen diplomagegevens. */
export class MockDiplomaVerifier implements DiplomaVerifier {
  async verify({ verificationCode }: DiplomaVerificationInput): Promise<DiplomaVerificationResult> {
    const ok = DUO_CODE_PATTERN.test(verificationCode.trim());
    return {
      verified: ok,
      source: "MOCK",
      message: ok
        ? "Verificatiecode heeft een geldig formaat (dev-verifier; geen echte DUO-controle)."
        : "Ongeldige verificatiecode. Verwacht formaat: DUO-XXXX-XXXX.",
    };
  }
}

/** Echte DUO-koppeling. Implementatie vereist productie-onboarding; zonder config faalt 'ie helder. */
export class DuoDiplomaVerifier implements DiplomaVerifier {
  async verify(): Promise<DiplomaVerificationResult> {
    throw new Error(
      "DUO-koppeling is niet geconfigureerd. Stel DUO_API_BASE + credentials in en implementeer de " +
        "documentcontrole tegen het DUO-diplomaregister (echte onboarding is mensenwerk).",
    );
  }
}

export function getDiplomaVerifier(): DiplomaVerifier {
  return process.env.DIPLOMA_VERIFIER === "duo" ? new DuoDiplomaVerifier() : new MockDiplomaVerifier();
}
