// PII-veilige logging van een mislukte e-mailverzending.
//
// Waarom een aparte helper: een verzendfout van een e-mailkanaal draagt vaak het ONTVANGERADRES.
// - SMTP (nodemailer): een geweigerde ontvanger levert een fout waarvan `.message`/`.response`
//   het adres bevat (bv. "550 5.1.1 <jan@firma.nl> recipient rejected") en `.rejected` de adressen
//   als array.
// - Resend (HTTP-API, sinds EMAIL_DRIVER=resend): een non-2xx gooit een `Error` waarvan de message
//   de (afgekapte) Resend-foutbody bevat, die bij een validatiefout het adres kan echoën.
//
// Een rauwe `console.error("… mislukt:", err)` schrijft dat volledige object naar de hosting-logs
// (Railway) — buiten de auditdatabase én buiten de redactie-pijplijn. E-mailadressen zijn
// persoonsgegevens; dat is een AVG art. 5 lid 1f-lek (integriteit/vertrouwelijkheid).
//
// Deze helper stuurt de fout door de gestructureerde `logger`, die e-mailadressen in elke
// stringwaarde maskeert ("jan@firma.nl" → "j***@firma.nl"). `describeError` reduceert de fout
// bovendien tot alleen naam/message/stack — provider-specifieke velden zoals `.rejected`
// (rauwe adressen) gaan sowieso niet mee.

import { logger } from "@/lib/observability/logger";
import { describeError } from "@/lib/observability/report";

/**
 * Logt het mislukken van een e-mailverzending PII-veilig via de logger (adressen worden gemaskeerd).
 * Gebruik dit overal waar een `mail.send(...)` in een `catch` belandt — nooit `console.error(err)`.
 *
 * @param source Herkomst-label voor de logregel, bv. "[notification-digest-task]".
 * @param error  De opgevangen fout (onbekend type).
 */
export function logMailFailure(source: string, error: unknown): void {
  logger.error(`${source} e-mail versturen mislukt`, { error: describeError(error) });
}
