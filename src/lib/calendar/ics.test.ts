import { describe, it, expect } from "vitest";
import {
  escapeIcsText,
  formatIcsDate,
  foldIcsLine,
  buildIcsCalendar,
  type IcsEvent,
} from "@/lib/calendar/ics";

// ---------------------------------------------------------------------------
// escapeIcsText
// ---------------------------------------------------------------------------

describe("escapeIcsText", () => {
  it("escapet backslash vóór alle andere tekens", () => {
    // backslash moet eerst worden ge-escaped, anders worden de escape-sequenties zelf weer ge-escaped
    expect(escapeIcsText("a\\b")).toBe("a\\\\b");
  });

  it("escapet puntkomma", () => {
    expect(escapeIcsText("a;b")).toBe("a\\;b");
  });

  it("escapet komma", () => {
    expect(escapeIcsText("a,b")).toBe("a\\,b");
  });

  it("escapet LF-regeleinde naar letterlijke \\n", () => {
    expect(escapeIcsText("regel1\nregel2")).toBe("regel1\\nregel2");
  });

  it("escapet CRLF-regeleinde naar letterlijke \\n", () => {
    expect(escapeIcsText("regel1\r\nregel2")).toBe("regel1\\nregel2");
  });

  it("verwijdert losse \\r", () => {
    expect(escapeIcsText("a\rb")).toBe("ab");
  });

  it("behandelt backslash + puntkomma correct (volgorde)", () => {
    // "a\;b" → eerst backslash escapen → "a\\;b", dan puntkomma escapen → "a\\\\;b" maar
    // wacht: de backslash in de invoer "a\;b" is al een backslash+puntkomma.
    // Verwacht: "a\\" + "\\;" = "a\\\\\\;b" — nee.
    // Invoer: a\;b (3 tekens: a, \, ;, b)
    // Na stap 1 (\ → \\): a\\;b
    // Na stap 2 (; → \;): a\\\;b
    expect(escapeIcsText("a\\;b")).toBe("a\\\\\\;b");
  });

  it("laat gewone tekst ongewijzigd", () => {
    expect(escapeIcsText("Hallo wereld")).toBe("Hallo wereld");
  });
});

// ---------------------------------------------------------------------------
// formatIcsDate
// ---------------------------------------------------------------------------

describe("formatIcsDate", () => {
  const dt = new Date("2024-03-05T08:04:07Z");

  it("produceert YYYYMMDD voor dateOnly=true", () => {
    expect(formatIcsDate(dt, { dateOnly: true })).toBe("20240305");
  });

  it("produceert YYYYMMDDTHHMMSSZ voor de volledige vorm", () => {
    expect(formatIcsDate(dt)).toBe("20240305T080407Z");
  });

  it("vult nul-op-links aan (maand, dag, uur, minuut, seconde)", () => {
    const d = new Date("2024-01-02T03:04:05Z");
    expect(formatIcsDate(d)).toBe("20240102T030405Z");
    expect(formatIcsDate(d, { dateOnly: true })).toBe("20240102");
  });

  it("gebruikt UTC-getters (niet lokale tijdzone)", () => {
    // 2024-12-31T23:59:59Z is in UTC nog de 31e, niet de 1e januari
    const d = new Date("2024-12-31T23:59:59Z");
    expect(formatIcsDate(d, { dateOnly: true })).toBe("20241231");
  });
});

// ---------------------------------------------------------------------------
// foldIcsLine
// ---------------------------------------------------------------------------

describe("foldIcsLine", () => {
  it("laat een korte regel (≤75 octetten) ongewijzigd", () => {
    const kort = "SUMMARY:Hallo";
    expect(foldIcsLine(kort)).toBe(kort);
  });

  it("vouwt een regel die langer dan 75 octetten is", () => {
    // Bouw een regel van 76 ASCII-tekens
    const lang = "X-TEST:" + "A".repeat(69); // 7 + 69 = 76 octetten
    const gevouwen = foldIcsLine(lang);
    // Mag geen afsluitende CRLF hebben
    expect(gevouwen.endsWith("\r\n")).toBe(false);
    // Elke fysieke regel ≤ 75 octetten
    const encoder = new TextEncoder();
    for (const regel of gevouwen.split("\r\n")) {
      expect(encoder.encode(regel).length).toBeLessThanOrEqual(75);
    }
    // Vervolg-regels beginnen met een spatie
    const regels = gevouwen.split("\r\n");
    for (const r of regels.slice(1)) {
      expect(r.startsWith(" ")).toBe(true);
    }
  });

  it("elke fysieke regel is ≤ 75 octetten bij een lange regel", () => {
    const lang = "DESCRIPTION:" + "B".repeat(200);
    const encoder = new TextEncoder();
    for (const regel of foldIcsLine(lang).split("\r\n")) {
      expect(encoder.encode(regel).length).toBeLessThanOrEqual(75);
    }
  });

  it("splitst geen meerbyte-UTF-8-teken over een vouwpunt", () => {
    // Gebruik euro-tekens (3 octetten elk) om vlakbij een vouwgrens te testen
    const lang = "SUMMARY:" + "€".repeat(30); // 8 + 90 bytes → moet worden gevouwen
    const gevouwen = foldIcsLine(lang);
    const encoder = new TextEncoder();
    for (const regel of gevouwen.split("\r\n")) {
      // Elke regel moet geldig UTF-8 zijn (TextEncoder/Decoder round-trip)
      const bytes = encoder.encode(regel);
      expect(bytes.length).toBeLessThanOrEqual(75);
    }
    // Gereconstrueerde tekst (na verwijderen van CRLF + leading spaties) = origineel
    const reconstructed = gevouwen
      .split("\r\n")
      .map((r, i) => (i > 0 ? r.slice(1) : r))
      .join("");
    expect(reconstructed).toBe(lang);
  });
});

// ---------------------------------------------------------------------------
// buildIcsCalendar
// ---------------------------------------------------------------------------

describe("buildIcsCalendar", () => {
  const fixedNow = new Date("2024-06-01T12:00:00Z");

  it("bevat BEGIN/END VCALENDAR en de PRODID", () => {
    const output = buildIcsCalendar([], {
      prodId: "-//ZZP-Platform//Test//NL",
      now: fixedNow,
    });
    expect(output).toContain("BEGIN:VCALENDAR");
    expect(output).toContain("END:VCALENDAR");
    expect(output).toContain("PRODID:-//ZZP-Platform//Test//NL");
  });

  it("gebruikt CRLF als regelscheider en eindigt met CRLF", () => {
    const output = buildIcsCalendar([], {
      prodId: "-//ZZP-Platform//Test//NL",
      now: fixedNow,
    });
    // Minstens één CRLF aanwezig
    expect(output).toContain("\r\n");
    // Eindigt met CRLF
    expect(output.endsWith("\r\n")).toBe(true);
    // Geen losse LF (alle regeleindes zijn CRLF)
    expect(output.replace(/\r\n/g, "")).not.toContain("\n");
  });

  it("voegt X-WR-CALNAME toe als calendarName is opgegeven", () => {
    const output = buildIcsCalendar([], {
      prodId: "-//Test//NL",
      calendarName: "Mijn Rooster",
      now: fixedNow,
    });
    expect(output).toContain("X-WR-CALNAME:Mijn Rooster");
  });

  const eventMaWoVr: IcsEvent = {
    uid: "test-uid-001",
    summary: "Vergadering",
    start: new Date("2024-06-03T00:00:00Z"), // maandag
    allDay: true,
    recurrenceDays: ["MON", "WED", "FRI"],
    until: new Date("2024-08-30T00:00:00Z"),
    description: "Wekelijkse standup",
  };

  it("emitteert een VEVENT met UID, DTSTART;VALUE=DATE en DTEND = start + 1 dag", () => {
    const output = buildIcsCalendar([eventMaWoVr], {
      prodId: "-//Test//NL",
      now: fixedNow,
    });
    expect(output).toContain("BEGIN:VEVENT");
    expect(output).toContain("END:VEVENT");
    expect(output).toContain("UID:test-uid-001");
    expect(output).toContain("DTSTART;VALUE=DATE:20240603");
    // DTEND = start + 1 dag = 2024-06-04
    expect(output).toContain("DTEND;VALUE=DATE:20240604");
  });

  it("emitteert RRULE met FREQ=WEEKLY, BYDAY in canonieke volgorde en UNTIL", () => {
    const output = buildIcsCalendar([eventMaWoVr], {
      prodId: "-//Test//NL",
      now: fixedNow,
    });
    // MO,WE,FR in canonieke volgorde (MON→MO, WED→WE, FRI→FR)
    expect(output).toContain("RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20240830");
  });

  it("escapet speciale tekens in SUMMARY", () => {
    const event: IcsEvent = {
      uid: "escape-test",
      summary: "Titel; met, speciale\\tekens",
      start: new Date("2024-06-03T00:00:00Z"),
      allDay: true,
    };
    const output = buildIcsCalendar([event], {
      prodId: "-//Test//NL",
      now: fixedNow,
    });
    expect(output).toContain("SUMMARY:Titel\\; met\\, speciale\\\\tekens");
  });

  it("voegt DESCRIPTION toe wanneer opgegeven", () => {
    const output = buildIcsCalendar([eventMaWoVr], {
      prodId: "-//Test//NL",
      now: fixedNow,
    });
    expect(output).toContain("DESCRIPTION:Wekelijkse standup");
  });

  it("heeft GEEN UNTIL= wanneer until niet is opgegeven", () => {
    const event: IcsEvent = {
      uid: "geen-until",
      summary: "Open herhaling",
      start: new Date("2024-06-03T00:00:00Z"),
      allDay: true,
      recurrenceDays: ["MON", "FRI"],
    };
    const output = buildIcsCalendar([event], {
      prodId: "-//Test//NL",
      now: fixedNow,
    });
    expect(output).toContain("RRULE:FREQ=WEEKLY;BYDAY=MO,FR");
    expect(output).not.toContain("UNTIL=");
  });

  it("emitteert geen RRULE voor een enkel event zonder recurrenceDays", () => {
    const event: IcsEvent = {
      uid: "enkel-event",
      summary: "Eenmalig",
      start: new Date("2024-06-10T00:00:00Z"),
      allDay: true,
    };
    const output = buildIcsCalendar([event], {
      prodId: "-//Test//NL",
      now: fixedNow,
    });
    expect(output).not.toContain("RRULE");
  });

  it("gebruikt de opgegeven now-datum als DTSTAMP in elk VEVENT", () => {
    const event: IcsEvent = {
      uid: "dtstamp-test",
      summary: "Test",
      start: new Date("2024-06-03T00:00:00Z"),
      allDay: true,
    };
    const output = buildIcsCalendar([event], {
      prodId: "-//Test//NL",
      now: fixedNow,
    });
    expect(output).toContain("DTSTAMP:20240601T120000Z");
  });

  it("emitteert meerdere VEVENT-blokken in invoervolgorde", () => {
    const e1: IcsEvent = {
      uid: "evt-1",
      summary: "Eerste",
      start: new Date("2024-06-03T00:00:00Z"),
      allDay: true,
    };
    const e2: IcsEvent = {
      uid: "evt-2",
      summary: "Tweede",
      start: new Date("2024-06-10T00:00:00Z"),
      allDay: true,
    };
    const output = buildIcsCalendar([e1, e2], {
      prodId: "-//Test//NL",
      now: fixedNow,
    });
    const pos1 = output.indexOf("UID:evt-1");
    const pos2 = output.indexOf("UID:evt-2");
    expect(pos1).toBeGreaterThan(-1);
    expect(pos2).toBeGreaterThan(-1);
    expect(pos1).toBeLessThan(pos2);
  });
});
