// Decorators die de uitgaande `verify()`-operatie van de échte verificatie-registers (DUO/BIG/iDIN)
// registreren in de verificatie-aflever-heartbeat (dead-man's-switch). Zelfde patroon als
// RecordingPaymentProvider (billing) en RecordingStorageDriver (storage): wikkel de call, registreer
// succes/mislukking, en her-gooi de originele fout ongewijzigd door.
//
// Alleen de échte verifiers worden gewrapt (recording-relevant: doen externe HTTP-calls). De
// mock-verifiers (dev/demo default) worden NIET gewrapt — geen externe call, geen productie-kanaal.
//
// "Slagen" = het register ANTWOORDDE (de promise resolvet), ongeacht of het bewijsstuk inhoudelijk
// `verified: true` of `false` was — een terecht afgewezen diploma is een geslaagde aflevering.
// "Mislukken" = `verify()` wierp (netwerkfout, time-out, 5xx, 429, contract-mismatch via verifyViaHttp).

import type {
  DiplomaVerificationInput,
  DiplomaVerificationResult,
  DiplomaVerifier,
} from "@/lib/services/diploma-verifier";
import type {
  BigVerificationInput,
  BigVerificationResult,
  BigVerifier,
} from "@/lib/services/big-verifier";
import type {
  IdentityVerificationInput,
  IdentityVerificationResult,
  IdentityVerifier,
} from "@/lib/services/identity-verifier";
import { VERIFICATION_CHANNELS } from "@/lib/observability/verification-delivery-heartbeat";

/**
 * Voert de operatie uit, registreert de uitkomst in de heartbeat en her-gooit een fout ongewijzigd
 * door. De registratie is fail-open (zie verification-delivery-heartbeat.ts) en verandert nooit het
 * resultaat. Lazy import houdt dit bestand vrij van een harde observability/prisma-import op
 * modulepad-niveau en voorkomt import-cycles (parity met RecordingPaymentProvider).
 */
async function record<T>(
  channel: (typeof VERIFICATION_CHANNELS)[number]["channel"],
  driver: string,
  op: () => Promise<T>,
): Promise<T> {
  const { recordVerificationDeliverySuccess, recordVerificationDeliveryFailure } =
    await import("@/lib/observability/verification-delivery-heartbeat");
  let result: T;
  try {
    result = await op();
  } catch (error) {
    await recordVerificationDeliveryFailure(channel, driver);
    throw error;
  }
  await recordVerificationDeliverySuccess(channel, driver);
  return result;
}

export class RecordingDiplomaVerifier implements DiplomaVerifier {
  constructor(
    private readonly inner: DiplomaVerifier,
    private readonly driver: string,
  ) {}

  verify(input: DiplomaVerificationInput): Promise<DiplomaVerificationResult> {
    return record("verification-diploma", this.driver, () => this.inner.verify(input));
  }
}

export class RecordingBigVerifier implements BigVerifier {
  constructor(
    private readonly inner: BigVerifier,
    private readonly driver: string,
  ) {}

  verify(input: BigVerificationInput): Promise<BigVerificationResult> {
    return record("verification-big", this.driver, () => this.inner.verify(input));
  }
}

export class RecordingIdentityVerifier implements IdentityVerifier {
  constructor(
    private readonly inner: IdentityVerifier,
    private readonly driver: string,
  ) {}

  verify(input: IdentityVerificationInput): Promise<IdentityVerificationResult> {
    return record("verification-identity", this.driver, () => this.inner.verify(input));
  }
}
