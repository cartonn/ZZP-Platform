// Certificaatherinnering door de bemiddelaar (franchise-variant van het opdrachtgever-patroon uit
// `collaboration-reminder.ts`). De bemiddelaar herinnert een roster-ZZP'er om een ontbrekend of
// verlopen verplicht bewijsstuk aan te leveren. Pure helpers — geen I/O: welke types openstaan
// (uit de verplichte-documenten-status), de notificatietekst en de deep-link naar het uploadformulier.
// Het dag-idempotentievenster (`reminderDayStart`) en de deep-link (`credentialReminderLink`) delen we
// met de opdrachtgever-variant, zodat de regels één bron hebben.

import { type FreelancerCredential } from "@/lib/matching";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import { type CredentialType } from "@/lib/enums";
import { mandatoryDocuments } from "@/lib/mandatory-documents";

export { reminderDayStart, credentialReminderLink } from "@/lib/collaboration-reminder";

/** Audit-actie voor de bemiddelaar-certificaatherinnering (los van de opdrachtgever-variant). */
export const FRANCHISE_REMINDER_ACTION = "FRANCHISE_CREDENTIAL_REMINDER_SENT";

/** Resultaat van de herinneringsactie: een stille bevestiging of een foutmelding. */
export type FranchiseReminderState = { message?: string; error?: string } | undefined;

/**
 * De verplichte documenttypes die voor déze ZZP'er openstaan (ontbrekend óf verlopen) — precies de
 * types waarvoor een herinnering zin heeft. Bewust NIET "in beoordeling": dat ligt al bij de admin,
 * de ZZP'er hoeft niets te doen. Server bepaalt de waarheid; deze helper leest enkel de al berekende
 * verplichte-documenten-status.
 */
export function outstandingMandatoryTypes(
  credentials: readonly FreelancerCredential[],
  now: Date = new Date(),
): CredentialType[] {
  return mandatoryDocuments(credentials, now)
    .items.filter((i) => i.state === "missing" || i.state === "expired")
    .map((i) => i.type);
}

/** Titel + body voor de notificatie naar de ZZP'er (afzender = de bemiddeling). */
export function franchiseCredentialReminderMessage(
  franchiseName: string,
  type: CredentialType,
): { title: string; body: string } {
  const label = CREDENTIAL_TYPE_LABEL[type] ?? type;
  return {
    title: "Certificaat gevraagd",
    body: `${franchiseName} vraagt je ${label} aan te leveren zodat je inzetbaar bent voor diensten.`,
  };
}
