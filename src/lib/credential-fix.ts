// Één-klik oplospad voor een blokkerende certificaateis. Puur en deterministisch — geen I/O.
//
// Wanneer een ZZP'er niet voldoet aan een vereist certificaat (op een opdracht die hij bekijkt of
// een reactie die hij al verstuurde), is de meest waardevolle vervolgstap: dat exacte certificaat
// regelen. Deze module levert de canonieke deep-link naar het uploadformulier mét het juiste
// documenttype voorgeselecteerd, plus de afleiding van de direct oplosbare blokkades uit een
// compliance-uitkomst (`computeCompliance`).
//
// Zo landt de ZZP'er niet op een generiek overzicht maar meteen op het juiste formulier — de
// noord-ster: toon alleen wat actie vraagt, en maak die actie één klik ver.

import { type CredentialType } from "@/lib/enums";

/** "missing" = geen bruikbaar certificaat van dit type (nieuw aanleveren); "expired" = wel aanwezig maar verlopen (vernieuwen). */
export type CredentialFixKind = "missing" | "expired";

export interface CredentialFix {
  type: CredentialType;
  kind: CredentialFixKind;
}

/**
 * Deep-link naar het uploadformulier met het documenttype voorgeselecteerd. Dezelfde route en query
 * die het Actiecentrum, de samenwerkingsherinnering en de inzetbaarheidssamenvatting gebruiken —
 * dit is de canonieke bouwer voor het "regel-dit-certificaat-op-de-plek-van-de-blokkade"-pad.
 */
export function credentialFixHref(type: CredentialType): string {
  return `/certificaten/nieuw?type=${encodeURIComponent(type)}`;
}

/**
 * De direct door de ZZP'er oplosbare certificaat-blokkades uit een compliance-uitkomst: ontbrekende
 * types eerst (nieuw aanleveren), daarna verlopen types (vernieuwen). `inReview` is bewust géén
 * actie — dat loopt al en vraagt alleen afwachten. Binnen elke groep alfabetisch op type voor een
 * deterministische volgorde; dedup op type borgt determinisme mocht een type onverhoopt in beide
 * groepen zitten (uit `computeCompliance` kan dat niet, de guard is een vangnet).
 */
export function actionableCredentialFixes(compliance: {
  missing: readonly CredentialType[];
  expired: readonly CredentialType[];
}): CredentialFix[] {
  const seen = new Set<CredentialType>();
  const out: CredentialFix[] = [];
  const push = (types: readonly CredentialType[], kind: CredentialFixKind) => {
    for (const type of [...types].sort()) {
      if (seen.has(type)) continue;
      seen.add(type);
      out.push({ type, kind });
    }
  };
  push(compliance.missing, "missing");
  push(compliance.expired, "expired");
  return out;
}
