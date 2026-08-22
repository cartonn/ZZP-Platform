// Decorator die de uitgaande operaties van een échte betaalprovider (Stripe/Mollie) registreert in de
// billing-aflever-heartbeat (dead-man's-switch). Zelfde patroon als RecordingStorageDriver (storage.ts):
// wikkel elke provider-call, registreer succes/mislukking, en her-gooi de originele fout ongewijzigd door.
//
// Alleen gewired om een échte provider (recording-relevant: doet externe HTTP-calls). De no-op-provider
// wordt NIET gewrapt (geen externe call, geen productie-kanaal) — precies zoals de lokale disk-storage niet
// wordt gewrapt. `resolveWebhookRef` doet géén uitgaande call (parseert/verifieert alleen een binnenkomende
// webhook) en mag per contract nooit throwen — die laten we ongeregistreerd doorlopen.

import type {
  CheckoutInput,
  CheckoutResult,
  PaymentProvider,
  PaymentStatus,
} from "@/lib/billing/provider";

export class RecordingPaymentProvider implements PaymentProvider {
  constructor(private readonly inner: PaymentProvider) {}

  get name(): string {
    return this.inner.name;
  }

  /**
   * Voert de operatie uit, registreert de uitkomst in de heartbeat en her-gooit een fout ongewijzigd door.
   * De registratie is fail-open (zie billing-delivery-heartbeat.ts) en verandert nooit het resultaat.
   */
  private async record<T>(op: () => Promise<T>): Promise<T> {
    // Lazy import: houdt dit bestand vrij van een harde observability-import op modulepad-niveau en
    // voorkomt import-cycles (de heartbeat trekt prisma + report mee). Parity met RecordingStorageDriver.
    const { recordBillingDeliverySuccess, recordBillingDeliveryFailure } =
      await import("@/lib/observability/billing-delivery-heartbeat");
    let result: T;
    try {
      result = await op();
    } catch (error) {
      await recordBillingDeliveryFailure(this.inner.name);
      throw error;
    }
    await recordBillingDeliverySuccess(this.inner.name);
    return result;
  }

  startCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    return this.record(() => this.inner.startCheckout(input));
  }

  paymentStatus(providerRef: string): Promise<PaymentStatus> {
    return this.record(() => this.inner.paymentStatus(providerRef));
  }

  checkConnectivity(): Promise<void> {
    return this.record(() => this.inner.checkConnectivity());
  }

  // Geen uitgaande call + mag nooit throwen: ongeregistreerd doorlaten (parity met het provider-contract).
  resolveWebhookRef(rawBody: string, headers: Headers): Promise<string | null> {
    return this.inner.resolveWebhookRef(rawBody, headers);
  }
}
