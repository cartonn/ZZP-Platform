// Menselijke NL-labels voor audit-acties (logboek-weergave). De audit-`action` is een stabiele
// machine-string (bv. "PROFILE_UPDATED"); deze helper vertaalt de bekende naar nette Nederlandse
// tekst en valt voor onbekende terug op een geleesbare vorm. Geen I/O, pure functie.

const AUDIT_ACTION_LABEL: Record<string, string> = {
  PROFILE_UPDATED: "Profiel bijgewerkt",
  CREDENTIAL_SUBMITTED: "Certificaat ingediend",
  CREDENTIAL_VERIFIED: "Certificaat geverifieerd",
  CREDENTIAL_REJECTED: "Certificaat afgewezen",
  CREDENTIAL_EXPIRED: "Certificaat verlopen",
  DOCUMENT_UPLOADED: "Document geüpload",
  FRANCHISE_FREELANCER_ADDED: "Aan roster toegevoegd",
  ROLE_CHANGED: "Rol gewijzigd",
  STATUS_CHANGED: "Status gewijzigd",
};

/** NL-label voor een audit-actie; valt terug op een geleesbare vorm voor onbekende acties. */
export function auditActionLabel(action: string): string {
  const known = AUDIT_ACTION_LABEL[action];
  if (known) return known;
  const text = action.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}
