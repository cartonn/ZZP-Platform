import { afterEach, describe, expect, it, vi } from "vitest";

import { log, logger, redact } from "./logger";

const REDACTED = "[redacted]";

describe("redact — key-gebaseerde secrets", () => {
  it("maskeert gevoelige sleutels (case-insensitive, substring)", () => {
    const out = redact({
      password: "hunter2",
      Secret: "abc",
      accessToken: "xyz",
      Authorization: "Bearer 123",
      SENTRY_DSN: "https://x@sentry.io/1",
      bsn: "123456789",
      iban: "NL00BANK0123456789",
      keep: "visible",
    });

    expect(out.password).toBe(REDACTED);
    expect(out.Secret).toBe(REDACTED);
    expect(out.accessToken).toBe(REDACTED);
    expect(out.Authorization).toBe(REDACTED);
    expect(out.SENTRY_DSN).toBe(REDACTED);
    expect(out.bsn).toBe(REDACTED);
    expect(out.iban).toBe(REDACTED);
    expect(out.keep).toBe("visible");
  });
});

describe("redact — naam-/adres-/telefoon-sleutels (PII)", () => {
  it("redacteert een exacte naam-sleutel maar niet filename/username/hostname", () => {
    const out = redact({
      name: "Jan de Vries",
      naam: "Piet Bakker",
      filename: "2026/abc.pdf",
      username: "jdv",
      hostname: "app-01",
    });
    expect(out.name).toBe(REDACTED);
    expect(out.naam).toBe(REDACTED);
    // Substring "name" mag debug-sleutels NIET raken (alleen exacte gelijkheid).
    expect(out.filename).toBe("2026/abc.pdf");
    expect(out.username).toBe("jdv");
    expect(out.hostname).toBe("app-01");
  });

  it("redacteert voor-/achternaam en adres-varianten (exact, case-insensitive)", () => {
    const out = redact({
      voornaam: "Jan",
      Achternaam: "de Vries",
      adres: "Kerkstraat 1",
      contactName: "Jan",
    });
    expect(out.voornaam).toBe(REDACTED);
    expect(out.Achternaam).toBe(REDACTED);
    expect(out.adres).toBe(REDACTED);
    expect(out.contactName).toBe(REDACTED);
  });

  it("redacteert de compound PII-naamvelden uit de verificatieflows (verifiedName/holderName/…)", () => {
    // Deze sleutels dragen de volledige juridische naam van een betrokkene (iDIN/DUO/BIG). Vóór de
    // fix miste de exacte-sleutellijst ze en lekten ze ongeredacteerd naar logs én Sentry.
    const out = redact({
      verifiedName: "Jan de Vries",
      verifiedLegalName: "Jan de Vries",
      accountName: "Jan de Vries",
      providedName: "Jan de Vries",
      holderName: "Jan de Vries",
      organizationName: "Zorg BV",
    });
    expect(out.verifiedName).toBe(REDACTED);
    expect(out.verifiedLegalName).toBe(REDACTED);
    expect(out.accountName).toBe(REDACTED);
    expect(out.providedName).toBe(REDACTED);
    expect(out.holderName).toBe(REDACTED);
    expect(out.organizationName).toBe(REDACTED);
  });

  it("laat niet-PII naamsleutels (filename/skillName/eventName) intact", () => {
    const out = redact({ filename: "2026/vog.pdf", skillName: "IC", eventName: "job.created" });
    expect(out.filename).toBe("2026/vog.pdf");
    expect(out.skillName).toBe("IC");
    expect(out.eventName).toBe("job.created");
  });

  it("redacteert telefoon-/phone-sleutels via substring", () => {
    const out = redact({ telefoonnummer: "0612345678", contactPhone: "0201234567" });
    expect(out.telefoonnummer).toBe(REDACTED);
    expect(out.contactPhone).toBe(REDACTED);
  });
});

describe("redact — e-mailmaskering", () => {
  it("maskeert het lokale deel van een e-mailadres", () => {
    const out = redact({ contact: "jan.jansen@firma.nl" });
    expect(out.contact).toBe("j***@firma.nl");
  });

  it("maskeert e-mailadressen midden in een zin en laat de rest staan", () => {
    const out = redact({ note: "Stuur het naar jan@firma.nl voor 17:00." });
    expect(out.note).toBe("Stuur het naar j***@firma.nl voor 17:00.");
  });

  it("maskeert meerdere e-mailadressen in één string", () => {
    const out = redact({ note: "a@x.nl en b@y.nl" });
    expect(out.note).toBe("a***@x.nl en b***@y.nl");
  });

  it("laat niet-email strings ongemoeid", () => {
    const out = redact({ note: "geen adres hier" });
    expect(out.note).toBe("geen adres hier");
  });
});

describe("redact — recursie en immutability", () => {
  it("redacteert recursief in geneste objects en arrays", () => {
    const out = redact({
      user: {
        email: "jan@firma.nl",
        credentials: { password: "x", token: "y" },
      },
      items: [{ apiKey: "k1" }, { mail: "piet@bar.nl" }],
    });

    const user = out.user as Record<string, unknown>;
    // "email" matcht geen secret-substring, dus de waarde wordt e-mailgemaskeerd i.p.v. geredacteerd.
    expect(user.email).toBe("j***@firma.nl");
    const credentials = user.credentials as Record<string, unknown>;
    expect(credentials.password).toBe(REDACTED);
    expect(credentials.token).toBe(REDACTED);

    const items = out.items as Array<Record<string, unknown>>;
    expect(items[0]?.apiKey).toBe(REDACTED);
    expect(items[1]?.mail).toBe("p***@bar.nl");
  });

  it("muteert de input niet", () => {
    const input = { nested: { password: "x", note: "jan@firma.nl" } };
    const snapshot = JSON.parse(JSON.stringify(input));
    redact(input);
    expect(input).toEqual(snapshot);
  });

  it("zet Date om naar een ISO-string", () => {
    const d = new Date("2026-06-24T10:00:00.000Z");
    const out = redact({ at: d });
    expect(out.at).toBe("2026-06-24T10:00:00.000Z");
  });
});

describe("log — LOG_LEVEL-drempel", () => {
  const original = process.env.LOG_LEVEL;

  afterEach(() => {
    process.env.LOG_LEVEL = original;
    vi.restoreAllMocks();
  });

  it("onderdrukt logs onder de drempel", () => {
    process.env.LOG_LEVEL = "warn";
    const out = vi.spyOn(console, "log").mockImplementation(() => {});
    const err = vi.spyOn(console, "error").mockImplementation(() => {});

    log("debug", "x");
    log("info", "y");
    expect(out).not.toHaveBeenCalled();

    log("warn", "z");
    expect(err).toHaveBeenCalledTimes(1);
  });

  it("default-drempel is info wanneer LOG_LEVEL onbekend/ontbreekt", () => {
    delete process.env.LOG_LEVEL;
    const out = vi.spyOn(console, "log").mockImplementation(() => {});

    log("debug", "verborgen");
    expect(out).not.toHaveBeenCalled();

    log("info", "zichtbaar");
    expect(out).toHaveBeenCalledTimes(1);
  });
});

describe("log — stream-keuze en payload", () => {
  const original = process.env.LOG_LEVEL;

  afterEach(() => {
    process.env.LOG_LEVEL = original;
    vi.restoreAllMocks();
  });

  it("stuurt error en warn naar console.error, info en debug naar console.log", () => {
    process.env.LOG_LEVEL = "debug";
    const out = vi.spyOn(console, "log").mockImplementation(() => {});
    const err = vi.spyOn(console, "error").mockImplementation(() => {});

    logger.error("boom");
    logger.warn("careful");
    logger.info("hello");
    logger.debug("trace");

    expect(err).toHaveBeenCalledTimes(2);
    expect(out).toHaveBeenCalledTimes(2);
  });

  it("schrijft een gestructureerde JSON-regel met geredacteerde velden", () => {
    process.env.LOG_LEVEL = "info";
    const out = vi.spyOn(console, "log").mockImplementation(() => {});

    log("info", "login", { userEmail: "jan@firma.nl", password: "x" });

    const line = out.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(line);
    expect(parsed.level).toBe("info");
    expect(parsed.msg).toBe("login");
    expect(typeof parsed.time).toBe("string");
    expect(parsed.userEmail).toBe("j***@firma.nl");
    expect(parsed.password).toBe(REDACTED);
  });

  it("maskeert een e-mailadres dat per ongeluk in de message-tekst staat", () => {
    process.env.LOG_LEVEL = "info";
    const err = vi.spyOn(console, "error").mockImplementation(() => {});

    log("error", "Reset mislukt voor jan@firma.nl");

    const line = err.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(line);
    expect(parsed.msg).toBe("Reset mislukt voor j***@firma.nl");
  });

  it("valt veilig terug wanneer serialisatie faalt (geen throw)", () => {
    process.env.LOG_LEVEL = "info";
    const err = vi.spyOn(console, "error").mockImplementation(() => {});

    // BigInt overleeft redactie ongewijzigd maar laat JSON.stringify falen.
    expect(() => log("error", "boom", { amount: 10n })).not.toThrow();

    const line = err.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(line);
    expect(parsed._logError).toBe("serialize-failed");
    expect(parsed.level).toBe("error");
    expect(parsed.msg).toBe("boom");
  });
});
