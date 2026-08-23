// Pure mapper van de operationele roster-deadlines van een bemiddelaar (FRANCHISER) naar IcsEvent-
// objecten. Geen I/O, geen DB, geen netwerk. Vertaalt de twee tijd-kritische feiten waar een
// bemiddelaar op plant — en die de franchise-oversight-UI al toont — naar losse gehele-dag-events:
//
//   1. Einde van een lopende plaatsing (samenwerking met einddatum) → verlengvenster.
//   2. Verval van een geverifieerd rostercertificaat → tijdig verlengen zodat de vakman inzetbaar blijft.
//
// De events worden door buildIcsCalendar (ics.ts) geserialiseerd en verschijnen in de sessie-gebonden
// bemiddelaar-agenda-download (/franchise/agenda). Bewust ALLEEN als sessie-download (requireActor),
// niet in de publieke token-feed: de gevoeligheid van de bearer-URL groeit zo niet mee met roster-brede
// data. De events dragen geen bedragen — alleen namen die de bemiddelaar in zijn cockpit al beheert
// (roster-ZZP'er + opdrachtgever) — plus WAT er speelt en WANNEER. Parity met deadlines.ts.

import { type IcsEvent } from "@/lib/calendar/ics";

// ---------------------------------------------------------------------------
// Types — minimale projecties, reeds server-side tenant-gescoopt en gefilterd
// ---------------------------------------------------------------------------

/** Het einde van een lopende plaatsing binnen het roster (samenwerking met vastgelegde einddatum). */
export interface BrokerCollaborationEnd {
  id: string;
  endDate: Date;
  /** Naam van de geplaatste ZZP'er. */
  freelancerName: string;
  /** Naam van de opdrachtgever bij wie de ZZP'er is geplaatst. */
  companyName: string;
}

/** Een geverifieerd rostercertificaat/diploma met een verloopdatum. */
export interface BrokerCredentialExpiry {
  id: string;
  title: string;
  /** Naam van de ZZP'er aan wie het certificaat toebehoort. */
  freelancerName: string;
  expiresAt: Date;
}

/** De volledige set operationele roster-deadlines van één bemiddelaar. */
export interface BrokerAgenda {
  collaborations: BrokerCollaborationEnd[];
  credentials: BrokerCredentialExpiry[];
}

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

/** Weergavenaam met een nette terugval, zodat een leeg/onbekend veld nooit een rare titel oplevert. */
function displayName(name: string | null | undefined): string {
  const trimmed = (name ?? "").trim();
  return trimmed === "" ? "een teamlid" : trimmed;
}

/**
 * Zet de operationele roster-deadlines om naar losse gehele-dag-IcsEvents (geen herhaling). Bewaart de
 * invoervolgorde binnen elke categorie; eerst de plaatsing-einddatums, dan de certificaat-vervaldatums.
 * De UID's zijn stabiel en uniek binnen de per-bemiddelaar-agenda, zodat agenda-apps events bijwerken
 * i.p.v. dupliceren.
 */
export function brokerAgendaEvents(input: BrokerAgenda): IcsEvent[] {
  const events: IcsEvent[] = [];

  for (const col of input.collaborations) {
    const zzper = displayName(col.freelancerName);
    const company = displayName(col.companyName);
    events.push({
      uid: `broker-collab-end-${col.id}@zzp-platform`,
      summary: `Einde plaatsing: ${zzper} bij ${company}`,
      start: col.endDate,
      allDay: true,
      description: `De plaatsing van ${zzper} bij ${company} loopt af. Plan tijdig een verlenging of een vervanger.`,
      // Een aflopende plaatsing verdient tijdige opvolging; waarschuw 2 weken vooraf.
      alarms: [
        {
          daysBefore: 14,
          description: `Plaatsing ${zzper} bij ${company} loopt over 14 dagen af — plan verlenging of vervanger.`,
        },
      ],
    });
  }

  for (const cred of input.credentials) {
    const zzper = displayName(cred.freelancerName);
    events.push({
      uid: `broker-cred-expiry-${cred.id}@zzp-platform`,
      summary: `Certificaat verloopt: ${cred.title} — ${zzper}`,
      start: cred.expiresAt,
      allDay: true,
      description: `Het certificaat "${cred.title}" van ${zzper} verloopt. Zonder geldig document is deze vakman niet inzetbaar — plan tijdig een verlenging.`,
      // Verlengen kost weken: waarschuw ruim vooraf, met een tweede nudge kort ervóór.
      alarms: [
        {
          daysBefore: 30,
          description: `Certificaat ${cred.title} (${zzper}) verloopt over 30 dagen.`,
        },
        {
          daysBefore: 7,
          description: `Certificaat ${cred.title} (${zzper}) verloopt over 7 dagen.`,
        },
      ],
    });
  }

  return events;
}
