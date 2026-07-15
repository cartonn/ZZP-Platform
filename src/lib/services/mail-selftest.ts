// Connectiviteitszelftest voor het e-mailkanaal (admin-only, /admin/systeemstatus).
//
// De systeemstatus toont de e-maildriver-MODUS (`noop`/`smtp`/`resend`), maar bewijst niet dat er
// echt een bericht wordt afgeleverd. Vóór go-live wil een beheerder dat kunnen bevestigen ná het
// plakken van RESEND_API_KEY/EMAIL_FROM (of de SMTP-variabelen) — MENSENWERK §2: verstuurt de
// geconfigureerde provider daadwerkelijk een mail, of blijft hij stil hangen op een verkeerde
// sleutel/onegeverifieerd domein?
//
// Deze module is de tegenhanger van de opslag-zelftest (`storage-selftest.ts`): puur en
// injecteerbaar (een `MailSender` + recipient in, een rapport uit; geen I/O-globals, geen klok),
// zodat het deterministisch te testen is. Anders dan opslag kun je een verzonden mail niet
// terug-lezen; de "test" is dus: bouwt een duidelijk herkenbaar testbericht en probeert het te
// versturen — slaagt de `send()` zonder te werpen, dan is het kanaal bereikbaar. Geen secrets in de
// uitvoer: een fout wordt teruggebracht tot de error-NAAM (nooit het bericht — dat kan een
// endpoint/API-sleutel bevatten), net als de opslag-zelftest en de readiness-probe.

import type { MailMessage, MailSender } from "@/lib/services/mail-sender";

export interface MailSelfTestReport {
  /** De verzendpoging wierp geen fout (bij `noop` betekent dit alleen "geen kanaal", zie delivered). */
  ok: boolean;
  /** Actieve driver-modus ("noop"/"smtp"/"resend"). Geen sleutelwaarden. */
  driverMode: string;
  /** Het ontvangeradres dat de beheerder invulde — teruggetoond in dezelfde sessie (geen secret). */
  recipient: string;
  /**
   * Of er daadwerkelijk een bericht is verzonden. `false` bij de `noop`-driver: die slikt de mail
   * stil, dus een geslaagde `send()` bewijst daar niets — de UI moet dat eerlijk tonen i.p.v. een
   * groen vinkje te suggereren.
   */
  delivered: boolean;
  /** Korte, niet-gevoelige toelichting (error-NAAM bij een fout, of een noop-uitleg). */
  detail?: string;
}

/** De e-maildrivers die daadwerkelijk afleveren (i.t.t. de stille `noop`-standaard). */
const DELIVERING_DRIVERS = new Set(["smtp", "resend"]);

/**
 * Basale RFC-achtige validatie: één `@`, niet-lege lokale + domeindeel, een punt in het domein, geen
 * spaties/control-tekens. Bewust conservatief — we willen alleen een evidente typefout tegenhouden
 * vóór we een provider-call doen, niet elke exotische maar geldige mailbox afwijzen.
 */
export function isValidRecipient(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;
  if (/[\s<>]/.test(trimmed)) return false;
  return /^[^@]+@[^@.]+(\.[^@.]+)+$/.test(trimmed);
}

/**
 * Brengt een onbekende fout terug tot een korte, PII-/secret-vrije omschrijving: alleen de
 * error-NAAM (bv. "TypeError", "AbortError"), nooit het volledige bericht (dat kan een
 * endpoint/sleutel bevatten).
 */
function safeDetail(error: unknown): string {
  if (error instanceof Error && error.name) return error.name;
  return "Error";
}

/**
 * Bouwt het testbericht. Duidelijk als zelftest herkenbaar (onderwerp + tekst) zodat een ontvanger
 * begrijpt waarom hij het krijgt; de `token` maakt elk bericht uniek en traceerbaar in de provider-
 * en hostlogs. Puur (geen klok/random binnenin) — de aanroeper levert het token.
 */
export function buildMailSelfTestMessage(recipient: string, token: string): MailMessage {
  const trimmed = recipient.trim();
  const subject = `ZZP Platform — e-mailzelftest (${token})`;
  const text =
    "Dit is een automatische testmail van het ZZP Platform.\n\n" +
    "Als je deze mail ontvangt, is het e-mailkanaal correct geconfigureerd en levert de " +
    "provider berichten af. Je hoeft niets te doen — je kunt deze mail verwijderen.\n\n" +
    `Referentie: ${token}\n`;
  const html =
    `<p>Dit is een automatische testmail van het <strong>ZZP Platform</strong>.</p>` +
    `<p>Als je deze mail ontvangt, is het e-mailkanaal correct geconfigureerd en levert de ` +
    `provider berichten af. Je hoeft niets te doen — je kunt deze mail verwijderen.</p>` +
    `<p style="color:#6b7280;font-size:12px">Referentie: ${token}</p>`;
  return { to: trimmed, subject, text, html };
}

/**
 * Voert de zelftest uit: bouwt het testbericht en probeert het via de geïnjecteerde `MailSender` te
 * versturen. Werpt nooit naar buiten — een fout wordt gevangen en als veilig `detail` teruggegeven.
 *
 * Bij de `noop`-driver (geen kanaal) slaagt `send()` stil; dat rapporteren we als `ok:true` maar
 * `delivered:false` met een uitleg, zodat de UI geen valse "e-mail werkt" toont. Validatie van het
 * ontvangeradres gebeurt hier zodat de aanroeper (server-actie) niet los kan drijven.
 */
export async function runMailSelfTest(opts: {
  sender: MailSender;
  driverMode: string;
  recipient: string;
  token: string;
}): Promise<MailSelfTestReport> {
  const { sender, driverMode, recipient, token } = opts;
  const trimmed = recipient.trim();

  if (!isValidRecipient(trimmed)) {
    return {
      ok: false,
      driverMode,
      recipient: trimmed,
      delivered: false,
      detail: "Ongeldig e-mailadres.",
    };
  }

  const willDeliver = DELIVERING_DRIVERS.has(driverMode);

  try {
    await sender.send(buildMailSelfTestMessage(trimmed, token));
  } catch (error) {
    return {
      ok: false,
      driverMode,
      recipient: trimmed,
      delivered: false,
      detail: safeDetail(error),
    };
  }

  if (!willDeliver) {
    return {
      ok: true,
      driverMode,
      recipient: trimmed,
      delivered: false,
      detail: "Geen mailkanaal geconfigureerd (EMAIL_DRIVER=noop) — er is niets verzonden.",
    };
  }

  return { ok: true, driverMode, recipient: trimmed, delivered: true };
}
