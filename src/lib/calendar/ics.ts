// RFC 5545 (iCalendar) builder. Pure module — geen I/O, geen DB, geen netwerk.
// Verantwoordelijk voor het produceren van geldige VCALENDAR-documenten voor het
// weekrooster-exportscherm. Taal UI = Nederlands; code = Engels.

import { WEEKDAYS, type Weekday } from "@/lib/enums";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Eén herinnerings-alarm (VALARM, ACTION:DISPLAY) dat een agenda-app vóór het event laat afgaan.
 * Voor all-day-events die een deadline markeren (certificaat-verloop, factuur/BTW/IB, einde
 * plaatsing) is dit de kern van de waarde: de gebruiker wil rúim vooraf een nudge, niet pas op de
 * dag zelf. De trigger is relatief aan DTSTART; `daysBefore` dagen ervóór (0 = op de startdag).
 */
export interface IcsAlarm {
  /** Aantal hele dagen vóór DTSTART dat de melding afgaat. Niet-negatief geheel getal (0 = startdag). */
  daysBefore: number;
  /** Weergavetekst van de melding (verplicht bij ACTION:DISPLAY per RFC 5545). */
  description: string;
}

/** Beschrijving van één kalender-event dat naar iCalendar-formaat wordt omgezet. */
export interface IcsEvent {
  uid: string;
  summary: string;
  /** Eerste voorkomen (gehele-dag-anker), geïnterpreteerd in UTC. */
  start: Date;
  /** We emitteren uitsluitend all-day events. */
  allDay: true;
  /** Weekdagen voor wekelijkse herhaling; leeg/undefined = enkel event. */
  recurrenceDays?: Weekday[];
  /** Inclusieve einddatum van de herhaling (UNTIL); weglaten = onbeperkt. */
  until?: Date;
  description?: string;
  location?: string;
  /** Herinnerings-alarmen (VALARM) die vóór DTSTART afgaan; leeg/undefined = geen alarm. */
  alarms?: IcsAlarm[];
}

// ---------------------------------------------------------------------------
// Weekdag-mapping (Weekday → RFC 5545 BYDAY-code)
// ---------------------------------------------------------------------------

/** Vertaalt een intern Weekday-enum naar de RFC 5545 BYDAY-waarde. */
export const WEEKDAY_TO_BYDAY: Record<Weekday, "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU"> = {
  MON: "MO",
  TUE: "TU",
  WED: "WE",
  THU: "TH",
  FRI: "FR",
  SAT: "SA",
  SUN: "SU",
};

// ---------------------------------------------------------------------------
// Hulpfuncties
// ---------------------------------------------------------------------------

/**
 * Escapet tekst conform RFC 5545 §3.3.11: backslash eerst, daarna puntkomma,
 * komma en regeleinden. Strays \r worden verwijderd na de newline-escaping.
 */
export function escapeIcsText(value: string): string {
  return (
    value
      // Stap 1: backslash escapen (vóór de rest, anders worden de escape-sequences zelf ge-escaped)
      .replace(/\\/g, "\\\\")
      // Stap 2: puntkomma
      .replace(/;/g, "\\;")
      // Stap 3: komma
      .replace(/,/g, "\\,")
      // Stap 4: CRLF of LF → letterlijke \n (twee tekens)
      .replace(/\r\n|\n/g, "\\n")
      // Stap 5: losse \r weggooien
      .replace(/\r/g, "")
  );
}

/**
 * Formatteert een Date naar een iCalendar-datumstring via UTC-getters.
 * dateOnly=true  → "YYYYMMDD"
 * dateOnly=false → "YYYYMMDDTHHMMSSZ"
 * Vult altijd nul-op-links aan.
 */
export function formatIcsDate(date: Date, opts?: { dateOnly?: boolean }): string {
  const pad = (n: number, len = 2): string => String(n).padStart(len, "0");
  const y = pad(date.getUTCFullYear(), 4);
  const mo = pad(date.getUTCMonth() + 1);
  const d = pad(date.getUTCDate());
  if (opts?.dateOnly) {
    return `${y}${mo}${d}`;
  }
  const h = pad(date.getUTCHours());
  const mi = pad(date.getUTCMinutes());
  const s = pad(date.getUTCSeconds());
  return `${y}${mo}${d}T${h}${mi}${s}Z`;
}

/**
 * Formatteert een VALARM-TRIGGER-waarde (relatief aan DTSTART) uit een aantal dagen-vooraf.
 * `daysBefore` wordt naar beneden afgekapt op een niet-negatief geheel getal.
 * 0 → "PT0S" (op de startdag zelf); n≥1 → "-P{n}D" (n dagen ervóór). Geeft null voor ongeldige
 * invoer (NaN/negatief/oneindig) zodat een kapot alarm nooit een ongeldige regel produceert.
 */
export function formatIcsAlarmTrigger(daysBefore: number): string | null {
  if (!Number.isFinite(daysBefore) || daysBefore < 0) return null;
  const days = Math.floor(daysBefore);
  return days === 0 ? "PT0S" : `-P${days}D`;
}

/**
 * Vouwt een content-line per RFC 5545 §3.1 op maximaal 75 octetten (UTF-8 byte-lengte)
 * per fysieke regel. Vervolg-regels beginnen met één spatie en worden gescheiden door CRLF.
 * Meerbyte-UTF-8-tekens worden nooit over een vouwpunt gesplitst.
 * Geeft de gevouwen regel ZONDER afsluitende CRLF terug.
 */
export function foldIcsLine(line: string): string {
  const encoder = new TextEncoder();
  const MAX_OCTETS = 75;

  // Snelpad: de regel past in één fysieke regel
  if (encoder.encode(line).length <= MAX_OCTETS) {
    return line;
  }

  const parts: string[] = [];
  let current = "";
  let currentBytes = 0;
  // Eerste segment krijgt geen spatie-prefix; de limiet is 75.
  // Vervolg-segmenten krijgen een leading spatie die 1 octet kost, dus de payload is 74.
  let limit = MAX_OCTETS;

  for (const char of line) {
    const charBytes = encoder.encode(char).length;
    if (currentBytes + charBytes > limit) {
      parts.push(current);
      // Vervolg-regels: de leading spatie telt mee als 1 octet, payload = 74
      current = char;
      currentBytes = charBytes;
      limit = MAX_OCTETS - 1; // reserveer 1 octet voor de leading spatie
    } else {
      current += char;
      currentBytes += charBytes;
    }
  }
  if (current.length > 0) {
    parts.push(current);
  }

  // Verbind segmenten met CRLF + leading spatie voor vervolg-regels
  return (
    parts[0] +
    parts
      .slice(1)
      .map((p) => `\r\n ${p}`)
      .join("")
  );
}

/**
 * Bouwt een compleet VCALENDAR-document (RFC 5545) voor de gegeven events.
 * Alle property-regels worden gevouwen conform foldIcsLine.
 * Regeleindes: CRLF; het document eindigt met een afsluitende CRLF.
 */
export function buildIcsCalendar(
  events: IcsEvent[],
  opts: { prodId: string; calendarName?: string; now?: Date },
): string {
  const now = opts.now ?? new Date();
  const CRLF = "\r\n";

  const fold = (line: string): string => foldIcsLine(line);

  const lines: string[] = [
    fold("BEGIN:VCALENDAR"),
    fold("VERSION:2.0"),
    fold(`PRODID:${opts.prodId}`),
    fold("CALSCALE:GREGORIAN"),
    fold("METHOD:PUBLISH"),
  ];

  if (opts.calendarName) {
    lines.push(fold(`X-WR-CALNAME:${escapeIcsText(opts.calendarName)}`));
  }

  for (const event of events) {
    // Bereken DTEND: start + 1 dag in UTC, zonder de invoer-Date te muteren
    const dtEnd = new Date(event.start.getTime() + 24 * 60 * 60 * 1000);

    lines.push(fold("BEGIN:VEVENT"));
    lines.push(fold(`UID:${event.uid}`));
    lines.push(fold(`DTSTAMP:${formatIcsDate(now)}`));
    lines.push(fold(`DTSTART;VALUE=DATE:${formatIcsDate(event.start, { dateOnly: true })}`));
    lines.push(fold(`DTEND;VALUE=DATE:${formatIcsDate(dtEnd, { dateOnly: true })}`));

    // Herhaling: bouw RRULE op als er weekdagen zijn opgegeven
    const recDays = event.recurrenceDays;
    if (recDays && recDays.length > 0) {
      // Canonieke volgorde: gebruik WEEKDAYS uit enums.ts als referentie, ontdubbeld
      const seen = new Set(recDays);
      const canonicalByday = WEEKDAYS.filter((d) => seen.has(d))
        .map((d) => WEEKDAY_TO_BYDAY[d])
        .join(",");

      let rrule = `RRULE:FREQ=WEEKLY;BYDAY=${canonicalByday}`;
      if (event.until) {
        rrule += `;UNTIL=${formatIcsDate(event.until, { dateOnly: true })}`;
      }
      lines.push(fold(rrule));
    }

    lines.push(fold(`SUMMARY:${escapeIcsText(event.summary)}`));

    if (event.description !== undefined && event.description !== "") {
      lines.push(fold(`DESCRIPTION:${escapeIcsText(event.description)}`));
    }

    if (event.location !== undefined && event.location !== "") {
      lines.push(fold(`LOCATION:${escapeIcsText(event.location)}`));
    }

    // Herinnerings-alarmen (VALARM). Sub-component van VEVENT; komt vóór END:VEVENT. Een alarm met
    // een ongeldige daysBefore (formatIcsAlarmTrigger → null) wordt overgeslagen zodat het nooit een
    // ongeldige TRIGGER-regel oplevert.
    if (event.alarms) {
      for (const alarm of event.alarms) {
        const trigger = formatIcsAlarmTrigger(alarm.daysBefore);
        if (trigger === null) continue;
        lines.push(fold("BEGIN:VALARM"));
        lines.push(fold("ACTION:DISPLAY"));
        lines.push(fold(`TRIGGER:${trigger}`));
        lines.push(fold(`DESCRIPTION:${escapeIcsText(alarm.description)}`));
        lines.push(fold("END:VALARM"));
      }
    }

    lines.push(fold("END:VEVENT"));
  }

  lines.push(fold("END:VCALENDAR"));

  // Alle regels samenvoegen met CRLF; afsluitende CRLF toevoegen
  return lines.join(CRLF) + CRLF;
}
