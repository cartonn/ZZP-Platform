import { verifyViaHttp } from "@/lib/services/http-verify";

// BIG-registerverificatie (beroepsregistratie zorg) achter een schone service-grens.
//
// Het BIG-register is publiek doorzoekbaar op BIG-nummer + naam en geeft de registratiestatus
// (geregistreerd, beroep, specialismen, eventuele maatregelen/bevoegdheidsbeperkingen). Voor
// organisaties bestaat een officiële webservice; echte onboarding is mensenwerk.
//
//  - MockBigVerifier: deterministisch, werkt nu (dev/demo/e2e). Valideert alleen het BIG-nummer-
//    formaat (11 cijfers). Verzint GEEN beroeps-/registratiegegevens.
//  - BigRegisterVerifier: echte koppeling, env-geschakeld (BIG_VERIFIER=bigregister). Faalt helder
//    zonder configuratie.

export interface BigVerificationInput {
  bigNumber: string;
  holderName: string;
}

export interface BigVerificationResult {
  verified: boolean;
  message: string;
  source: "MOCK" | "BIG";
}

export interface BigVerifier {
  verify(input: BigVerificationInput): Promise<BigVerificationResult>;
}

/** Een BIG-nummer is 11 cijfers. */
export const BIG_NUMBER_PATTERN = /^\d{11}$/;

/** Dev/demo-verifier: valideert uitsluitend het BIG-nummerformaat. Verzint geen gegevens. */
export class MockBigVerifier implements BigVerifier {
  async verify({ bigNumber }: BigVerificationInput): Promise<BigVerificationResult> {
    const ok = BIG_NUMBER_PATTERN.test(bigNumber.trim());
    return {
      verified: ok,
      source: "MOCK",
      message: ok
        ? "BIG-nummer heeft een geldig formaat (dev-verifier; geen echte BIG-registercontrole)."
        : "Ongeldig BIG-nummer. Verwacht: 11 cijfers.",
    };
  }
}

/**
 * Echte BIG-registerkoppeling: controleert BIG-nummer + naam tegen het geconfigureerde endpoint
 * (BIG_API_BASE + BIG_API_KEY) via de gedeelde HTTP-helper. Productie-onboarding is mensenwerk;
 * zonder config faalt 'ie helder.
 */
export class BigRegisterVerifier implements BigVerifier {
  constructor(private readonly fetchImpl?: typeof fetch) {}

  async verify(input: BigVerificationInput): Promise<BigVerificationResult> {
    const raw = await verifyViaHttp(
      {
        name: "BIG",
        baseUrl: process.env.BIG_API_BASE,
        apiKey: process.env.BIG_API_KEY,
        path: "/big/verify",
        fetchImpl: this.fetchImpl,
      },
      { bigNumber: input.bigNumber.trim(), holderName: input.holderName.trim() },
    );
    return {
      verified: raw.verified,
      source: "BIG",
      message:
        raw.message ??
        (raw.verified
          ? "Registratie bevestigd in het BIG-register."
          : "Geen actieve registratie gevonden in het BIG-register."),
    };
  }
}

export function getBigVerifier(): BigVerifier {
  return process.env.BIG_VERIFIER === "bigregister"
    ? new BigRegisterVerifier()
    : new MockBigVerifier();
}
