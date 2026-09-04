// Welke gebruikers moeten hun signaal-snapshot kwijtraken als er iets gebeurt?
//
// Pure, TABEL-GEDREVEN mapping (geen losse ifs): per DomainEvent-type staat hier welk ONDERWERP het
// event raakt. Uit dat onderwerp volgen de betrokken partijen — een samenwerking raakt de ZZP'er, de
// opdrachtgever én de bemiddelaar van de tenant; een certificaat raakt de ZZP'er en de
// verificatie-wachtrij van de admins. De resolutie van onderwerp → gebruikers-id's is I/O en staat in
// `snapshot.ts`; hier staat alleen het beleid, zodat het los testbaar is en niet stil kan driften.
//
// De mapping is een VERSNELLER, geen garantie: de snapshot heeft daarnaast een korte TTL
// (`SIGNAL_SNAPSHOT_TTL_MS`), die ook de mutaties dekt die géén DomainEvent schrijven. Staat een
// event-type niet in de tabel, dan verloopt de snapshot dus gewoon via de TTL — nooit een badge die
// permanent achterloopt.

/** Het onderwerp waarop een event slaat; bepaalt hoe we de betrokken gebruikers opzoeken. */
export type SignalSubject =
  | "collaboration" //  beide partijen + de bemiddelaar van de tenant
  | "invoice" //        uitschrijver + tegenpartij (+ tenant-bemiddelaar via de samenwerking)
  | "performance" //    beide partijen van de samenwerking waar de prestatie bij hoort
  | "credential" //     de ZZP'er zelf + de admins (verificatie-wachtrij)
  | "user"; //          de gebruiker in `subjectId`

/**
 * Welk onderwerp hoort bij welk DomainEvent-type. Bewust op de STRING (niet op `DomainEventType`):
 * de reminder-taken schrijven ook typen die niet in `DOMAIN_EVENT_TYPES` staan (bv. `VAT_REMINDER`),
 * en die moeten hier net zo goed een snapshot kunnen invalideren.
 */
export const SIGNAL_INVALIDATION: Readonly<Record<string, SignalSubject>> = {
  // Cascade A–E: contract → prestatie → factuur → betaling. Elke stap verplaatst "wie is aan zet",
  // dus beide partijen (en de bemiddelaar die de tenant-cockpit ziet) moeten opnieuw geteld worden.
  CONTRACT_SIGNED: "collaboration",
  PERFORMANCE_SUBMITTED: "performance",
  PERFORMANCE_APPROVED: "performance",
  PERFORMANCE_REJECTED: "performance",
  PERFORMANCE_REMINDER: "performance",
  INVOICE_SUBMITTED: "invoice",
  INVOICE_APPROVED: "invoice",
  INVOICE_REJECTED: "invoice",
  INVOICE_WITHDRAWN: "invoice",
  INVOICE_CREDITED: "invoice",
  PAYMENT_MARKED: "invoice",
  PAYMENT_CONFIRMED: "invoice",
  PAYMENT_OVERDUE: "invoice",
  PAYMENT_REMINDER: "invoice",
  // Dispuut bevriest de cascade voor beide partijen en vult tegelijk de admin-wachtrij.
  DISPUTE_OPENED: "collaboration",
  DISPUTE_REMINDER: "collaboration",
  DISPUTE_ESCALATION: "collaboration",
  DISPUTE_RESOLVED: "collaboration",
  // Certificaten: verificatiebesluit/verval verandert de /certificaten-badge van de ZZP'er én de
  // /admin/verificaties-wachtrij.
  CREDENTIAL_SUBMITTED: "credential",
  CREDENTIAL_VERIFIED: "credential",
  CREDENTIAL_REJECTED: "credential",
  CREDENTIAL_EXPIRED: "credential",
  CREDENTIAL_EXPIRING: "credential",
  // Persoonsgebonden herinneringen (fiscaal, abonnement, digest): raken alleen die ene gebruiker.
  VAT_REMINDER: "user",
  HOURS_CRITERION_REMINDER: "user",
  NOTIFICATION_DIGEST: "user",
  SUBSCRIPTION_PAST_DUE: "user",
  SUBSCRIPTION_EXPIRED: "user",
  DBA_SIGNAL_RAISED: "collaboration",
};

/** Eén event zoals de sweep het uit de store leest (alleen wat het beleid nodig heeft). */
export interface SignalInvalidationEvent {
  type: string;
  subjectId: string;
}

/** Per onderwerp de id's die opgezocht moeten worden. Lege sets = niets te doen. */
export interface SignalInvalidationPlan {
  collaborationIds: string[];
  invoiceIds: string[];
  performanceIds: string[];
  credentialIds: string[];
  userIds: string[];
  /** Aantal events dat geen bekend onderwerp had (die leunen op de TTL) — meetbaar, niet stil. */
  unmapped: number;
}

/**
 * Groepeer de events per onderwerp. Pure functie: geen DB, deterministische volgorde (eerste
 * voorkomen wint), gededupt zodat één samenwerking met tien cascade-stappen één lookup kost.
 */
export function planSignalInvalidation(
  events: readonly SignalInvalidationEvent[],
): SignalInvalidationPlan {
  const buckets: Record<SignalSubject, Set<string>> = {
    collaboration: new Set(),
    invoice: new Set(),
    performance: new Set(),
    credential: new Set(),
    user: new Set(),
  };
  let unmapped = 0;
  for (const event of events) {
    const subject = SIGNAL_INVALIDATION[event.type];
    if (!subject || !event.subjectId) {
      unmapped++;
      continue;
    }
    buckets[subject].add(event.subjectId);
  }
  return {
    collaborationIds: [...buckets.collaboration],
    invoiceIds: [...buckets.invoice],
    performanceIds: [...buckets.performance],
    credentialIds: [...buckets.credential],
    userIds: [...buckets.user],
    unmapped,
  };
}

/** True zodra het plan iets op te zoeken heeft (scheelt lege queries in de sweep). */
export function planHasWork(plan: SignalInvalidationPlan): boolean {
  return (
    plan.collaborationIds.length > 0 ||
    plan.invoiceIds.length > 0 ||
    plan.performanceIds.length > 0 ||
    plan.credentialIds.length > 0 ||
    plan.userIds.length > 0
  );
}
