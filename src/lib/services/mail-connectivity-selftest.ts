// Read-only connectiviteitszelftest voor het e-mailkanaal (go-live-sweep, /admin/systeemstatus).
//
// Onderscheid met `mail-selftest.ts`: die verstuurt een ECHTE testmail (vereist een ontvangeradres +
// bevestigt aflevering) — waardevol, maar niet bulk-veilig, dus bewust een losse handeling. Deze
// module doet een READ-ONLY round-trip die bereikbaarheid + geldige credentials bewijst ZONDER een
// mail te versturen (Resend: authenticated GET /domains; SMTP: transporter.verify()). Daardoor kan
// mail — net als opslag/database/betaalprovider — meedraaien in de één-klik go-live GO/NO-GO-sweep.
//
// De module is de tegenhanger van `billing-selftest.ts`: puur en injecteerbaar (een spec in, een
// rapport uit; geen I/O-globals, geen klok) zodat het deterministisch te testen is. De aanroeper
// (server-actie / sweep-runner) levert een `run()` die de MailSender zijn eigen `checkConnectivity()`
// laat doen. Draait het kanaal op `noop`, dan is er niets externs om te testen en meldt de zelftest
// dat eerlijk (geen vals groen).
//
// Geen secrets in de uitvoer: een `MailConnectivityError` draagt een bewust veilig bericht
// (provider + HTTP-status), dat tonen we; voor elke andere fout uitsluitend de error-NAAM — nooit een
// rauw bericht dat een endpoint/sleutel zou kunnen bevatten.

import { MailConnectivityError } from "@/lib/services/mail-sender";

/** Actieve e-mail-modus. Alleen `smtp`/`resend` doen een echte round-trip; `noop` = niets te testen. */
export type MailDriverMode = "noop" | "smtp" | "resend";

/** Te testen e-mailkanaal. `run` wordt alleen aangeroepen wanneer `active`. */
export interface MailConnectivityProbeSpec {
  /** Staat een echt kanaal aan (EMAIL_DRIVER=smtp|resend)? */
  active: boolean;
  /** Actieve modus (bv. "resend", "noop"). Geen sleutelwaarden. */
  driverMode: MailDriverMode;
  /**
   * Read-only round-trip tegen het kanaal (via `MailSender.checkConnectivity`). Resolvet bij
   * bereikbaar + geldige auth, werpt bij een HTTP-/auth-/netwerkfout. Alleen vereist/aangeroepen
   * wanneer `active`.
   */
  run?: () => Promise<void>;
}

/** Uitkomst van de zelftest. */
export interface MailConnectivitySelfTestReport {
  ok: boolean;
  /** Draait er een echt kanaal? Zo niet: er is niets getest (geen vals groen). */
  active: boolean;
  /** Actieve e-mail-modus. Geen sleutelwaarden. */
  driverMode: MailDriverMode;
  /** Korte, niet-gevoelige toelichting (veilig bericht, error-naam, of noop-uitleg). */
  detail?: string;
}

const OK_DETAIL =
  "Bereikbaar — e-mailkanaal antwoordde op een read-only controle (geen mail verzonden).";
const INACTIVE_DETAIL = "Geen mailkanaal geconfigureerd (EMAIL_DRIVER=noop) — er is niets getest.";

/**
 * Brengt een fout terug tot een korte, PII-/secret-vrije toelichting. Een `MailConnectivityError`
 * draagt een bewust veilig opgesteld bericht (provider + HTTP-status) — dat tonen we. Voor elke
 * andere (onverwachte) fout uitsluitend de error-NAAM, nooit een rauw bericht dat gevoelige gegevens
 * zou kunnen bevatten.
 */
export function safeMailConnectivityDetail(error: unknown): string {
  if (error instanceof MailConnectivityError) return error.message;
  if (error instanceof Error && error.name) return error.name;
  return "Error";
}

/**
 * Voert de zelftest uit. Draait het kanaal op de `noop`-standaard (inactief), dan wordt dat eerlijk
 * als "niets getest" gerapporteerd (ok, met uitleg). Een actief kanaal draait zijn `run()`; die
 * wordt in een try/catch uitgevoerd — een fout wordt een veilige `detail`, nooit een throw naar
 * buiten. Een actief kanaal zonder `run` is een programmeerfout van de aanroeper en telt als fout.
 */
export async function runMailConnectivitySelfTest(
  spec: MailConnectivityProbeSpec,
): Promise<MailConnectivitySelfTestReport> {
  const base = { active: spec.active, driverMode: spec.driverMode };

  if (!spec.active) {
    return { ...base, ok: true, detail: INACTIVE_DETAIL };
  }

  if (!spec.run) {
    return { ...base, ok: false, detail: "Geen probe beschikbaar voor dit kanaal." };
  }

  try {
    await spec.run();
    return { ...base, ok: true, detail: OK_DETAIL };
  } catch (error) {
    return { ...base, ok: false, detail: safeMailConnectivityDetail(error) };
  }
}
