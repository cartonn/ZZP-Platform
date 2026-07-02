// Certificaatherinnering (rode draad 5): de opdrachtgever kan de ZZP'er bij een lopende
// samenwerking herinneren een ontbrekend/vereist certificaat aan te leveren. Pure helpers —
// geen I/O: de tekst van de notificatie, de deep-link naar het uploadformulier en het
// dag-venster voor idempotentie (max één herinnering per samenwerking+type per kalenderdag,
// zodat de knop geen spam wordt).

import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import { type CredentialType } from "@/lib/enums";

/** Begin van de kalenderdag (lokale tijd) van `now` — de ondergrens van het idempotentie-venster. */
export function reminderDayStart(now: Date): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Deep-link naar het uploadformulier met het juiste documenttype voorgeselecteerd. */
export function credentialReminderLink(type: CredentialType): string {
  return `/certificaten/nieuw?type=${encodeURIComponent(type)}`;
}

/** Titel + body voor de notificatie naar de ZZP'er. */
export function credentialReminderMessage(
  companyName: string,
  type: CredentialType,
): { title: string; body: string } {
  const label = CREDENTIAL_TYPE_LABEL[type] ?? type;
  return {
    title: "Certificaat gevraagd",
    body: `${companyName} vraagt je ${label} aan te leveren voor jullie samenwerking.`,
  };
}
