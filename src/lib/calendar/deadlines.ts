// Pure mapper van administratieve deadlines naar IcsEvent-objecten. Geen I/O, geen DB, geen netwerk.
// Vertaalt de bestaande deadline-bronnen (certificaat-verloop, factuur-vervaldatum, BTW-aangifte)
// naar losse gehele-dag-events die door buildIcsCalendar (ics.ts) worden geserialiseerd en samen met
// het weekrooster in de persoonlijke agenda-feed (/api/agenda + /api/agenda/feed.ics) verschijnen.
//
// Privacy: de events dragen bewust GÉÉN bedragen of BTW-saldi. De abonneer-feed is een publieke
// bearer-URL (token in de querystring); een kalender-herinnering hoeft alleen te zeggen WAT er speelt
// en WANNEER — het bedrag opent de gebruiker in de app. Zo groeit de gevoeligheid van de feed niet
// mee met deze uitbreiding (parity met het rooster, dat alleen jobtitel + tegenpartij toont).
//
// Datominimalisatie certificaat-type (AVG art. 5(1)(c), aangescherpt 2026-09-05): een certificaat-verval
// noemt bewust NIET het type/de vrije-tekst-titel (bv. "VOG", "BIG"). Dat zijn bijzondere/gevoelige
// gegevens (VOG = justitieel screeningsbewijs, BIG = beroepsregister zorg) die niet thuishoren in een
// niet-intrekbare bearer-feed die naar Google/Apple-agenda-infra synct. De herinnering zegt "een
// certificaat verloopt" + WANNEER; wélk certificaat opent de ZZP'er in het (geauthenticeerde) dossier.
// Daarom draagt CredentialDeadline geen titel meer en selecteert de loader die niet.

import { type IcsEvent } from "@/lib/calendar/ics";

// ---------------------------------------------------------------------------
// Types — minimale projecties, reeds server-side gescoopt en gefilterd
// ---------------------------------------------------------------------------

/**
 * Een geverifieerd certificaat/diploma met een verloopdatum. Bewust ZONDER titel/type: dat is
 * gevoelige data die niet in de bearer-feed hoort (zie de datominimalisatie-noot bovenaan dit bestand).
 */
export interface CredentialDeadline {
  id: string;
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

/** Het einde van een lopende plaatsing (samenwerking met een vastgelegde einddatum). */
export interface CollaborationDeadline {
  id: string;
  endDate: Date;
  /** De naam van de tegenpartij vanuit het perspectief van deze gebruiker. */
  counterpartyName: string;
  /** true = de gebruiker is de opdrachtgever (tegenpartij = ZZP'er); false = de gebruiker is de ZZP'er. */
  asClient: boolean;
}

/** De volledige set administratieve deadlines van één gebruiker. */
export interface AdministrativeDeadlines {
  credentials: CredentialDeadline[];
  invoices: InvoiceDeadline[];
  vat: VatDeadline[];
  /** Eerstvolgende IB-aangifte-deadline (alleen ZZP'er met omzet), of `null`. */
  incomeTax: IncomeTaxDeadline | null;
  /** Einddatums van lopende plaatsingen (samenwerkingen) waarbij de gebruiker partij is. */
  collaborations: CollaborationDeadline[];
}

// ---------------------------------------------------------------------------
// Herinnerings-doorlooptijden
// ---------------------------------------------------------------------------

/**
 * Hoeveel hele dagen vóór het verlopen van een certificaat de agenda-feed een herinnering laat
 * afgaan. Eén bron van waarheid: de .ics-mapper hieronder hangt exact deze alarmen aan élk
 * certificaat-verval-event, én de UI (de "abonneer op je agenda"-affordance op de vervalkalender)
 * belooft dezelfde doorlooptijden. Verlengen van een VOG/diploma/verzekering kost weken, dus we
 * waarschuwen ruim vooraf met een tweede nudge kort ervóór. Aflopend gesorteerd (grootste eerst).
 */
export const CREDENTIAL_EXPIRY_ALARM_DAYS = [30, 7] as const;

/**
 * Formatteert een reeks dagen-vooraf naar een leesbare Nederlandse opsomming, bijv. `[30, 7]`
 * → "30 en 7 dagen", `[7]` → "7 dagen", `[]` → "". Puur en deterministisch; deelt de doorlooptijd
 * tussen de feed en de UI-copy zodat ze nooit uit elkaar lopen.
 */
export function formatDayLeadTimes(days: readonly number[]): string {
  if (days.length === 0) return "";
  if (days.length === 1) return `${days[0]} dagen`;
  const head = days.slice(0, -1).join(", ");
  const tail = days[days.length - 1];
  return `${head} en ${tail} dagen`;
}

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

/**
 * Zet administratieve deadlines om naar losse gehele-dag-IcsEvents (geen herhaling). Bewaart de
 * invoervolgorde binnen elke categorie; certificaten, dan facturen, dan BTW, dan de IB-aangifte, dan
 * de plaatsing-einddatums. De UID's zijn stabiel en uniek binnen de per-gebruiker-feed, zodat
 * agenda-apps events bijwerken i.p.v. dupliceren.
 */
export function administrativeDeadlineEvents(input: AdministrativeDeadlines): IcsEvent[] {
  const events: IcsEvent[] = [];

  for (const c of input.credentials) {
    events.push({
      uid: `cred-expiry-${c.id}@zzp-platform`,
      // Bewust generiek: géén certificaat-type/titel in de bearer-feed (AVG art. 5(1)(c) — zie de
      // datominimalisatie-noot bovenaan). "Certificaat verloopt" + de datum zegt genoeg om te
      // agenderen; wélk certificaat opent de ZZP'er in het geauthenticeerde dossier.
      summary: "Certificaat verloopt",
      start: c.expiresAt,
      allDay: true,
      description:
        "Verleng je certificaat op tijd zodat je inzetbaar blijft. Details staan in je dossier.",
      // Herinneringen op de gedeelde doorlooptijden (CREDENTIAL_EXPIRY_ALARM_DAYS) zodat de feed
      // en de UI-belofte niet uit elkaar lopen — óók zonder het type te noemen.
      alarms: CREDENTIAL_EXPIRY_ALARM_DAYS.map((daysBefore) => ({
        daysBefore,
        description: `Een certificaat verloopt over ${daysBefore} dagen — verleng het op tijd.`,
      })),
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
      alarms: [
        {
          daysBefore: 3,
          description: inv.payable
            ? `Factuur ${inv.number} vervalt over 3 dagen — betaal op tijd.`
            : `Factuur ${inv.number} vervalt over 3 dagen.`,
        },
      ],
    });
  }

  for (const v of input.vat) {
    events.push({
      uid: `vat-return-${v.year}-Q${v.quarter}@zzp-platform`,
      summary: `BTW-aangifte Q${v.quarter} ${v.year}`,
      start: v.deadline,
      allDay: true,
      description: "Uiterste datum voor de BTW-aangifte en -betaling.",
      alarms: [
        { daysBefore: 7, description: `BTW-aangifte Q${v.quarter} ${v.year} over 7 dagen.` },
      ],
    });
  }

  if (input.incomeTax) {
    events.push({
      uid: `income-tax-${input.incomeTax.taxYear}@zzp-platform`,
      summary: `Aangifte inkomstenbelasting ${input.incomeTax.taxYear}`,
      start: input.incomeTax.deadline,
      allDay: true,
      description: "Uiterste datum voor de aangifte inkomstenbelasting over dit belastingjaar.",
      alarms: [
        {
          daysBefore: 14,
          description: `Aangifte inkomstenbelasting ${input.incomeTax.taxYear} over 14 dagen.`,
        },
      ],
    });
  }

  for (const col of input.collaborations) {
    events.push({
      uid: `collab-end-${col.id}@zzp-platform`,
      summary: `Einde plaatsing: ${col.counterpartyName}`,
      start: col.endDate,
      allDay: true,
      description: col.asClient
        ? `De plaatsing van ${col.counterpartyName} loopt af. Plan tijdig een verlenging of een vervanger.`
        : `Je plaatsing bij ${col.counterpartyName} loopt af. Plan tijdig een vervolg of een nieuwe opdracht.`,
      // Een aflopende plaatsing verdient tijdige opvolging (verlenging/vervolg); waarschuw 2 weken
      // vooraf.
      alarms: [
        {
          daysBefore: 14,
          description: col.asClient
            ? `Plaatsing van ${col.counterpartyName} loopt over 14 dagen af — plan verlenging of vervanger.`
            : `Je plaatsing bij ${col.counterpartyName} loopt over 14 dagen af — plan een vervolg.`,
        },
      ],
    });
  }

  return events;
}
