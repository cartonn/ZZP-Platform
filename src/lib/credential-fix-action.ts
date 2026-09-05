/**
 * De staat van één vereist certificaat, bezien vanuit de ZZP'er die op een opdracht wil reageren.
 * Afgeleid uit de server-side compliance-berekening (`matching.ts` `ComplianceResult`): een
 * certificaat is `satisfied` (geldig geverifieerd), `inReview` (ingediend, wacht op beoordeling),
 * `expired` (bestaat, maar verlopen) of `missing` (heeft de ZZP'er nog niet).
 */
export type CredentialFixState = "satisfied" | "inReview" | "expired" | "missing";

/**
 * De concrete herstelactie die de ZZP'er moet nemen voor één vereist certificaat, of `null`
 * wanneer er niets te doen is (al in orde, of al in beoordeling).
 */
export type CredentialFixAction = {
  /** Knoptekst (NL). */
  label: string;
  /** De plek waar de ZZP'er de actie daadwerkelijk uitvoert. */
  href: string;
} | null;

/**
 * Bepaalt de juiste herstelactie per certificaat-staat.
 *
 * Het onderscheid tussen `missing` en `expired` is bewust en corrigeert een eerdere valkuil: een
 * **verlopen** certificaat bestaat al in het dossier — de ZZP'er *vernieuwt* het daar (nieuw
 * bewijsstuk uploaden / opnieuw verificatie aanvragen), hij voegt geen tweede exemplaar toe. Een
 * **ontbrekend** certificaat maakt hij als nieuw bewijsstuk aan. In beide gevallen landt de link
 * exact op de plek waar de actie thuishoort, zodat "wat moet ik nu doen?" één klik ver is.
 */
export function credentialFixAction(state: CredentialFixState): CredentialFixAction {
  switch (state) {
    case "missing":
      // Nog niet in het dossier → direct een nieuw bewijsstuk aanmaken.
      return { label: "Toevoegen", href: "/certificaten/nieuw" };
    case "expired":
      // Bestaat al, maar verlopen → vernieuwen in het dossier.
      return { label: "Vernieuwen", href: "/certificaten" };
    case "satisfied":
    case "inReview":
      return null;
  }
}
