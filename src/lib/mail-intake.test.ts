import { describe, expect, it } from "vitest";
import {
  assertMailIntakeTransition,
  canMailIntakeTransition,
  cleanMailSubject,
  isAuthorizedMailIntakeHeader,
  mailHtmlToText,
  mailIntakeSenderEmail,
  MailIntakeTransitionError,
  parseDutchDate,
  parseMailIntake,
  parseRateRange,
  parseWorkMode,
} from "@/lib/mail-intake";

describe("mail-intake overgangen", () => {
  it("staat NEW → ACCEPTED en NEW → DISMISSED toe", () => {
    expect(canMailIntakeTransition("NEW", "ACCEPTED")).toBe(true);
    expect(canMailIntakeTransition("NEW", "DISMISSED")).toBe(true);
  });

  it("laat een afgewezen aanvraag heropenen, maar ACCEPTED is terminaal", () => {
    expect(canMailIntakeTransition("DISMISSED", "NEW")).toBe(true);
    expect(canMailIntakeTransition("ACCEPTED", "NEW")).toBe(false);
    expect(canMailIntakeTransition("ACCEPTED", "DISMISSED")).toBe(false);
  });

  it("weigert een ongeldige overgang met een expliciete fout", () => {
    expect(() => assertMailIntakeTransition("ACCEPTED", "DISMISSED")).toThrow(
      MailIntakeTransitionError,
    );
    expect(() => assertMailIntakeTransition("NEW", "ACCEPTED")).not.toThrow();
  });
});

describe("webhook-autorisatie", () => {
  const secret = "intake-secret-123";

  it("accepteert Bearer met het juiste secret", () => {
    expect(isAuthorizedMailIntakeHeader(`Bearer ${secret}`, secret)).toBe(true);
  });

  it("accepteert Basic met het secret als wachtwoord (Postmark-URL-credentials)", () => {
    const header = `Basic ${Buffer.from(`intake:${secret}`).toString("base64")}`;
    expect(isAuthorizedMailIntakeHeader(header, secret)).toBe(true);
  });

  it("weigert een verkeerd secret, ontbrekende header en Basic zonder scheidingsteken", () => {
    expect(isAuthorizedMailIntakeHeader("Bearer fout", secret)).toBe(false);
    expect(isAuthorizedMailIntakeHeader(null, secret)).toBe(false);
    expect(
      isAuthorizedMailIntakeHeader(`Basic ${Buffer.from(secret).toString("base64")}`, secret),
    ).toBe(false);
  });

  it("weigert alles zonder geconfigureerd secret (feature uit)", () => {
    expect(isAuthorizedMailIntakeHeader(`Bearer ${secret}`, "")).toBe(false);
  });
});

describe("afzender-normalisatie", () => {
  it("prefereert FromFull.Email en normaliseert naar lowercase", () => {
    expect(
      mailIntakeSenderEmail({
        MessageID: "m1",
        From: "Planner <ander@voorbeeld.nl>",
        FromFull: { Email: "Planner@Zorg.NL" },
      }),
    ).toBe("planner@zorg.nl");
  });

  it("plukt het adres uit een 'Naam <adres>'-From-header", () => {
    expect(mailIntakeSenderEmail({ MessageID: "m1", From: "Jan Planner <jan@zorg.nl>" })).toBe(
      "jan@zorg.nl",
    );
  });

  it("geeft null bij een ongeldig of ontbrekend adres", () => {
    expect(mailIntakeSenderEmail({ MessageID: "m1", From: "geen-adres" })).toBeNull();
    expect(mailIntakeSenderEmail({ MessageID: "m1" })).toBeNull();
  });
});

describe("parser-bouwstenen", () => {
  it("parseert tariefranges en enkele tarieven", () => {
    expect(parseRateRange("€ 85 per uur")).toEqual({ rateMin: 85, rateMax: null });
    expect(parseRateRange("85-95")).toEqual({ rateMin: 85, rateMax: 95 });
    expect(parseRateRange("95 tot 85 euro")).toEqual({ rateMin: 85, rateMax: 95 });
    expect(parseRateRange("nader te bepalen")).toEqual({ rateMin: null, rateMax: null });
  });

  it("negeert implausibele bedragen (jaartallen, duizendtallen)", () => {
    expect(parseRateRange("vanaf 2026")).toEqual({ rateMin: null, rateMax: null });
    expect(parseRateRange("€ 85,50")).toEqual({ rateMin: 86, rateMax: null });
  });

  it("parseert NL-datums in meerdere notaties (UTC-kalenderdag)", () => {
    expect(parseDutchDate("2026-09-01")?.toISOString()).toBe("2026-09-01T00:00:00.000Z");
    expect(parseDutchDate("01-09-2026")?.toISOString()).toBe("2026-09-01T00:00:00.000Z");
    expect(parseDutchDate("1/9/2026")?.toISOString()).toBe("2026-09-01T00:00:00.000Z");
    expect(parseDutchDate("1 september 2026")?.toISOString()).toBe("2026-09-01T00:00:00.000Z");
  });

  it("verwerpt ongeldige of onherkenbare datums", () => {
    expect(parseDutchDate("31-02-2026")).toBeNull();
    expect(parseDutchDate("z.s.m.")).toBeNull();
  });

  it("herkent de werkwijze; hybride wint van 'locatie'", () => {
    expect(parseWorkMode("op locatie")).toBe("ONSITE");
    expect(parseWorkMode("volledig remote")).toBe("REMOTE");
    expect(parseWorkMode("hybride, deels op locatie")).toBe("HYBRID");
    expect(parseWorkMode("nog onbekend")).toBeNull();
  });

  it("schoont het onderwerp op (Re:/Fwd:-prefixen, leeg → null)", () => {
    expect(cleanMailSubject("Re: Fwd: Aanvraag verpleegkundige")).toBe("Aanvraag verpleegkundige");
    expect(cleanMailSubject("  ")).toBeNull();
  });

  it("zet HTML om naar leesbare tekst (fallback voor mails zonder tekstdeel)", () => {
    expect(
      mailHtmlToText("<p>Functie: <b>Verzorgende IG</b></p><p>Locatie: Ede &amp; Wageningen</p>"),
    ).toBe("Functie: Verzorgende IG\nLocatie: Ede & Wageningen");
  });

  it("ontsnapt entiteiten precies één keer (geen double-unescape van &amp;lt;)", () => {
    expect(mailHtmlToText("a &amp;lt; b")).toBe("a &lt; b");
  });
});

describe("parseMailIntake", () => {
  it("parseert een gestructureerde aanvraagmail volledig", () => {
    const parsed = parseMailIntake(
      "Aanvraag nachtdienst",
      [
        "Functie: Verpleegkundige niveau 4",
        "Locatie: Amersfoort",
        "Tarief: 85-95",
        "Startdatum: 01-09-2026",
        "Werkwijze: op locatie",
        "Omschrijving: Nachtdienst op de revalidatie-afdeling.",
        "BIG-registratie vereist.",
      ].join("\n"),
    );
    expect(parsed.title).toBe("Verpleegkundige niveau 4");
    expect(parsed.location).toBe("Amersfoort");
    expect(parsed.rateMin).toBe(85);
    expect(parsed.rateMax).toBe(95);
    expect(parsed.startDate?.toISOString()).toBe("2026-09-01T00:00:00.000Z");
    expect(parsed.workMode).toBe("ONSITE");
    expect(parsed.description).toBe(
      "Nachtdienst op de revalidatie-afdeling.\nBIG-registratie vereist.",
    );
  });

  it("valt terug op onderwerp als titel en vrije tekst als omschrijving", () => {
    const parsed = parseMailIntake(
      "Re: Spoedaanvraag wijkzorg",
      "Wie kan er morgen bijspringen in de wijkzorg?\nGraag snel reageren.",
    );
    expect(parsed.title).toBe("Spoedaanvraag wijkzorg");
    expect(parsed.description).toBe(
      "Wie kan er morgen bijspringen in de wijkzorg?\nGraag snel reageren.",
    );
    expect(parsed.rateMin).toBeNull();
    expect(parsed.startDate).toBeNull();
  });

  it("laat een volledig onherkenbare mail heel (nulls, geen crash)", () => {
    const parsed = parseMailIntake("", "");
    expect(parsed).toEqual({
      title: null,
      description: null,
      location: null,
      rateMin: null,
      rateMax: null,
      startDate: null,
      workMode: null,
    });
  });

  it("eerste treffer per veld wint; latere sleutelregels overschrijven niet", () => {
    const parsed = parseMailIntake("x", "Functie: Eerste\nFunctie: Tweede");
    expect(parsed.title).toBe("Eerste");
  });
});
