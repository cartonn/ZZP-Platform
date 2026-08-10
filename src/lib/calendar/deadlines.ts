// Pure mapper van administratieve deadlines naar IcsEvent-objecten. Geen I/O, geen DB, geen netwerk.
// Vertaalt de bestaande deadline-bronnen (certificaat-verloop, factuur-vervaldatum, BTW-aangifte)
// naar losse gehele-dag-events die door buildIcsCalendar (ics.ts) worden geserialiseerd en samen met
// het weekrooster in de persoonlijke agenda-feed (/api/agenda + /api/agenda/feed.ics) verschijnen.
//
// Privacy: de events dragen bewust GÉÉN bedragen of BTW-saldi. De abonneer-feed is een publieke
// bearer-URL (token in de querystring); een kalender-herinnering hoeft alleen te zeggen WAT er speelt
// en WANNEER — het bedrag opent de gebruiker in de app. Zo groeit de gevoeligheid van de feed niet
// mee met deze uitbreiding (parity met het rooster, dat alleen jobtitel + tegenpartij toont).

import { type IcsEvent } from "@/lib/calendar/ics";

// ---------------------------------------------------------------------------
// Types — minimale projecties, reeds server-side gescoopt en gefilterd
// ---------------------------------------------------------------------------

/** Een geverifieerd certificaat/diploma met een verloopdatum. */
export interface CredentialDeadline {
  id: string;
  title: string;
  expiresAt: Date;
}

/** Een openstaande factuur met een uiterste betaaldatum. */
export interface InvoiceDeadline {
  id: string;
  number: string;
  dueAt: Date;
  /** true = de gebruiker moet betalen (opdrachtgever); false = ontvangt (ZZP'er). */
  payable: boolean;
}

/** Een BTW-aangifte-/betaal-deadline voor één afgesloten kwartaal. */
export interface VatDeadline {
  year: number;
  /** Kalenderkwartaal 1-4. */
  quarter: number;
  deadline: Date;
}

/** De uiterste aangiftedatum inkomstenbelasting over één belastingjaar. */
export interface IncomeTaxDeadline {
  /** Het belastingjaar waarover aangifte gedaan wordt (bv. 2026 → deadline 1 mei 2027). */
  taxYear: number;
  deadline: Date;
}

/** De volledige set administratieve deadlines van één gebruiker. */
export interface AdministrativeDeadlines {
  credentials: CredentialDeadline[];
  invoices: InvoiceDeadline[];
  vat: VatDeadline[];
  /** Eerstvolgende IB-aangifte-deadline (alleen ZZP'er met omzet), of `null`. */
  incomeTax: IncomeTaxDeadline | null;
}

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

/**
 * Zet administratieve deadlines om naar losse gehele-dag-IcsEvents (geen herhaling). Bewaart de
 * invoervolgorde binnen elke categorie; certificaten, dan facturen, dan BTW, dan de IB-aangifte. De
 * UID's zijn stabiel en uniek binnen de per-gebruiker-feed, zodat agenda-apps events bijwerken i.p.v.
 * dupliceren.
 */
export function administrativeDeadlineEvents(input: AdministrativeDeadlines): IcsEvent[] {
  const events: IcsEvent[] = [];

  for (const c of input.credentials) {
    events.push({
      uid: `cred-expiry-${c.id}@zzp-platform`,
      summary: `Certificaat verloopt: ${c.title}`,
      start: c.expiresAt,
      allDay: true,
      description: "Verleng dit document op tijd zodat je inzetbaar blijft.",
    });
  }

  for (const inv of input.invoices) {
    events.push({
      uid: `invoice-due-${inv.id}@zzp-platform`,
      summary: inv.payable ? `Factuur ${inv.number} betalen` : `Factuur ${inv.number} vervalt`,
      start: inv.dueAt,
      allDay: true,
      description: inv.payable
        ? "Uiterste betaaldatum van deze factuur."
        : "Uiterste betaaldatum voor de opdrachtgever.",
    });
  }

  for (const v of input.vat) {
    events.push({
      uid: `vat-return-${v.year}-Q${v.quarter}@zzp-platform`,
      summary: `BTW-aangifte Q${v.quarter} ${v.year}`,
      start: v.deadline,
      allDay: true,
      description: "Uiterste datum voor de BTW-aangifte en -betaling.",
    });
  }

  if (input.incomeTax) {
    events.push({
      uid: `income-tax-${input.incomeTax.taxYear}@zzp-platform`,
      summary: `Aangifte inkomstenbelasting ${input.incomeTax.taxYear}`,
      start: input.incomeTax.deadline,
      allDay: true,
      description: "Uiterste datum voor de aangifte inkomstenbelasting over dit belastingjaar.",
    });
  }

  return events;
}
