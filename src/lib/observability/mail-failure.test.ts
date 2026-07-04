import { afterEach, describe, expect, it, vi } from "vitest";

import { logMailFailure } from "./mail-failure";

// De logger schrijft `error`-regels via console.error als één JSON-string. We vangen die op en
// controleren dat het ontvangeradres nooit onversluierd in de hosting-logs belandt.
function captureLog(fn: () => void): string {
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    fn();
    expect(spy).toHaveBeenCalledTimes(1);
    // Voeg álle argumenten samen: zou iemand terugvallen op `console.error(source, err)` dan staat
    // het rauwe foutobject (met adres) in het tweede argument — dat moet de assertie óók vangen.
    return (spy.mock.calls[0] ?? []).map((a) => String(a)).join(" ");
  } finally {
    spy.mockRestore();
  }
}

describe("logMailFailure — PII-veilige mail-foutlogging (AVG art. 5 lid 1f)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("maskeert het ontvangeradres in een SMTP-weigeringsfout", () => {
    // Vorm van een nodemailer-weigering: het adres staat in de message.
    const line = captureLog(() =>
      logMailFailure("[notification-digest-task]", new Error("550 5.1.1 <jan@firma.nl> rejected")),
    );
    expect(line).not.toContain("jan@firma.nl");
    expect(line).toContain("j***@firma.nl");
    // De herkomst blijft leesbaar zodat de log bruikbaar blijft voor debugging.
    expect(line).toContain("[notification-digest-task]");
  });

  it("maskeert het adres in een Resend-HTTP-foutbody", () => {
    const line = captureLog(() =>
      logMailFailure(
        "[payment-reminders-task]",
        new Error('Resend: mislukte (status 422) — {"message":"Invalid to: piet@bedrijf.nl"}'),
      ),
    );
    expect(line).not.toContain("piet@bedrijf.nl");
    expect(line).toContain("p***@bedrijf.nl");
  });

  it("logt via één regel en gooit nooit door naar de caller (niet-Error input)", () => {
    expect(() =>
      captureLog(() => logMailFailure("[vat-reminder-task]", "kanaal weg")),
    ).not.toThrow();
  });
});
