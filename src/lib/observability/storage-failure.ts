// PII-veilige logging van een mislukte opslag-opruiming (best-effort `storage.delete(...)`).
//
// Waarom een aparte helper: verspreid over de app ruimen we een bestand op nadat de DB-rij is
// verwijderd/vervangen (logo-vervanging, document-verwijdering, AVG-anonimisering). Die delete is
// best-effort in een `.catch(...)`. De opgevangen fout werd tot nu toe rauw via `console.error(...,
// err)` gelogd — buiten de redactie-pijplijn. Een storage-driver (S3/lokaal) kan in `.message` een
// pad of een e-mailadres-achtige waarde meedragen; dat belandt dan onversluierd in de hosting-logs
// (Railway). Dat is hetzelfde AVG art. 5 lid 1f-antipatroon dat `logMailFailure` voor mailfouten
// dicht.
//
// Deze helper stuurt de fout via de maskerende `logger` (e-mailadressen → "j***@firma.nl") en
// reduceert 'm met `describeError` tot naam/message/stack. De `storageKey` (opaque opslagpad, nodig
// om een achtergebleven bestand terug te vinden bij de AVG-opruiming) gaat als eigen veld mee.

import { logger } from "@/lib/observability/logger";
import { describeError } from "@/lib/observability/report";

/**
 * Logt het mislukken van een best-effort opslag-opruiming PII-veilig via de logger.
 * Gebruik dit overal waar een `storage.delete(...)` in een `.catch(...)` belandt — nooit
 * `console.error(..., err)`.
 *
 * @param source     Herkomst-label voor de logregel, bv. "[documenten]".
 * @param storageKey De opslagsleutel van het niet-opgeruimde bestand (opaque pad, geen PII).
 * @param error      De opgevangen fout (onbekend type).
 */
export function logStorageCleanupFailure(source: string, storageKey: string, error: unknown): void {
  logger.error(`${source} storage-opruiming mislukt`, {
    storageKey,
    error: describeError(error),
  });
}
