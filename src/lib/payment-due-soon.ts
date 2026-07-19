// Pre-due betaal-nudge voor de opdrachtgever — één bron van waarheid voor de scoping.
//
// De opdrachtgever krijgt vandaag alléén een POST-due roll-up (`overdueInvoiceCount("CLIENT")` →
// "N facturen over de vervaldatum · Markeer als betaald") en een aggregate payables-card. Deze
// helper levert de tegenhanger: welke facturen vervallen BINNENKORT (nog niet te laat), zodat de
// payer op tijd kan betalen — dat beschermt zijn zichtbare betaalreputatie (zie
// `client-payment-reputation.ts`). De `where` is bewust identiek van vorm aan de legacy-tak van
// `overdueInvoiceCount`, alleen met een vooruitkijkend `dueAt`-venster i.p.v. `< now`.

import { Prisma } from "@prisma/client";

/** Venster (dagen) waarbinnen een openstaande factuur als "vervalt binnenkort" telt. */
export const PAYMENT_DUE_SOON_WINDOW_DAYS = 7;

/**
 * Prisma-`where` voor de facturen waarvoor de opdrachtgever een pre-due betaal-nudge hoort te
 * krijgen. Scoping (spiegelt bewust `overdueInvoiceCount` zodat de twee nudges elkaar nooit
 * overlappen of tegenspreken):
 *
 * - **Alleen legacy/handmatige facturen** (`lifecycleStatus: null`, `status: "SENT"`). Hier ís de
 *   opdrachtgever aan zet: "Markeer als betaald" bestaat uitsluitend voor een !cascade-factuur
 *   (`facturen/[id]/page.tsx` `canPay`). Cascade-facturen worden door de ZZP'er betaald-gemarkeerd
 *   (`stage.ts` stap 6, `youAreUp:isFreelancer`); een pre-due nudge daarop zou een dode actie zijn
 *   die de cascade-fase tegenspreekt (dezelfde les als de post-due roll-up).
 * - **Nog niet te laat** (`dueAt >= now`): al-verstreken facturen dekt de post-due roll-up al —
 *   `gte: now` sluit die af zodat één factuur nooit beide nudges voedt.
 * - **Binnen het venster** (`dueAt <= now + window`): daarbuiten is er nog geen reden tot actie.
 * - **Niet in dispuut** (`disputedAt: null`): een dispuut bevriest het werkproces; een betaal-nudge
 *   zou het "werkproces bevroren"-scherm tegenspreken (consistent met `overdueInvoiceCount`).
 */
export function paymentDueSoonWhere(
  userId: string,
  now: Date,
  windowDays: number = PAYMENT_DUE_SOON_WINDOW_DAYS,
): Prisma.InvoiceWhereInput {
  const windowEnd = new Date(now.getTime() + windowDays * 86_400_000);
  return {
    collaboration: { company: { userId }, disputedAt: null },
    lifecycleStatus: null,
    status: "SENT",
    dueAt: { gte: now, lte: windowEnd },
  };
}
