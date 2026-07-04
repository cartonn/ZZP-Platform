// Pure levensloop-logica voor betaalde abonnementsperiodes (plan/apply, zoals de andere
// reminder-taken). Geen I/O — deterministisch en getest.
//
// Achtergrond: een echte betaling (Mollie-webhook) zet `currentPeriodEnd = nu + 1 maand`. Zonder
// een verval-cyclus blijft zo'n abonnement voor eeuwig ACTIVE en houdt de gebruiker Pro/Business na
// één betaling. Twee onderdelen lossen dit op:
//   1. `isSubscriptionActive` — server-side waarheid voor entitlement: een ACTIVE-abonnement is
//      alléén gerechtigd zolang de betaalde periode niet verlopen is. `currentPeriodEnd = null`
//      betekent "geen periode-einde" (gratis plan / demo-noop-activatie) en blijft perpetueel.
//   2. `planSubscriptionExpiry` — renewal-herinneringen vóór verval + het daadwerkelijke verval
//      (→ CANCELLED, waarna de gebruiker terugvalt op Gratis). Idempotent via een per-periode-token.
//
// De taak (`subscription-expiry-task.ts`) levert alléén betaalde ACTIVE-abonnementen met een
// niet-null `currentPeriodEnd` aan; gratis/demo-perpetuele abonnementen komen hier niet langs.

/** Dagen vóór `currentPeriodEnd` waarop een renewal-herinnering wordt gestuurd (kleinste eerst toegepast). */
export const SUBSCRIPTION_RENEWAL_REMINDER_DAYS = [7, 1] as const;

/**
 * Server-side waarheid voor entitlement. Een abonnement telt als gerechtigd wanneer het ACTIVE is
 * én de betaalde periode niet verlopen is. Een `currentPeriodEnd` van `null` betekent "geen
 * einddatum" (gratis plan of demo-noop-activatie) en blijft perpetueel gerechtigd. Een verlopen
 * periode (`currentPeriodEnd <= now`) valt terug op niet-gerechtigd, óók vóór de verval-taak draait.
 */
export function isSubscriptionActive(
  sub: { status: string; currentPeriodEnd: Date | null },
  now: Date = new Date(),
): boolean {
  if (sub.status !== "ACTIVE") return false;
  if (sub.currentPeriodEnd === null) return true;
  return sub.currentPeriodEnd.getTime() > now.getTime();
}

/** Betaald ACTIVE-abonnement met een concrete periode-einddatum (kandidaat voor de verval-taak). */
export interface SubscriptionExpiryCandidate {
  id: string;
  userId: string;
  /** Einde van de betaalde periode; niet-null (de aanroeper filtert null/gratis weg). */
  currentPeriodEnd: Date;
}

export interface RenewalReminderItem {
  subscriptionId: string;
  userId: string;
  /** Aantal (hele) dagen tot verval waarvoor deze herinnering geldt (7 of 1). */
  daysUntil: number;
  dedupeKey: string;
}

export interface SubscriptionExpiryItem {
  subscriptionId: string;
  userId: string;
  dedupeKey: string;
}

export interface SubscriptionExpiryPlan {
  reminders: RenewalReminderItem[];
  expiries: SubscriptionExpiryItem[];
}

/** Hele dagen tussen `now` en een toekomstige datum (naar boven afgerond; verleden/gelijk → 0). */
function daysUntil(target: Date, now: Date): number {
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / 86_400_000);
}

/**
 * Bepaalt per betaald ACTIVE-abonnement of het verlopen is (→ CANCELLED) of dat een
 * renewal-herinnering aan de beurt is. Verval gaat vóór de herinneringen: is de periode al voorbij,
 * dan alleen verval (geen herinnering meer). Voor een nog-lopende periode wordt de kleinste
 * herinner-drempel gekozen waar de resterende dagen binnen vallen (bv. op 5 dagen resterend valt
 * het in de 7-daagse bucket; op 1 dag in de 1-daagse), zodat een gemiste cron-dag niet stilletjes
 * een herinnering overslaat.
 *
 * Idempotentie: de dedupeKey bevat de periode-einddatum als per-periode-token. Bij een renewal
 * schuift `currentPeriodEnd` op, waardoor de volgende periode verse keys krijgt en herinneringen/
 * verval opnieuw kunnen vuren zonder als "al verwerkt" te worden weggefilterd.
 */
export function planSubscriptionExpiry(
  candidates: readonly SubscriptionExpiryCandidate[],
  now: Date = new Date(),
): SubscriptionExpiryPlan {
  const reminders: RenewalReminderItem[] = [];
  const expiries: SubscriptionExpiryItem[] = [];
  // Aflopend sorteren zodat de kleinste resterende dagen (strengste drempel) als eerste matcht.
  const thresholds = [...SUBSCRIPTION_RENEWAL_REMINDER_DAYS].sort((a, b) => a - b);

  for (const c of candidates) {
    const period = c.currentPeriodEnd.getTime();
    if (period <= now.getTime()) {
      expiries.push({
        subscriptionId: c.id,
        userId: c.userId,
        dedupeKey: `sub-expiry:${c.id}:${period}`,
      });
      continue;
    }

    const remaining = daysUntil(c.currentPeriodEnd, now);
    const bucket = thresholds.find((t) => remaining <= t);
    if (bucket === undefined) continue; // nog te ver weg voor een herinnering

    reminders.push({
      subscriptionId: c.id,
      userId: c.userId,
      daysUntil: bucket,
      dedupeKey: `sub-renewal:${c.id}:${period}:${bucket}`,
    });
  }

  return { reminders, expiries };
}
