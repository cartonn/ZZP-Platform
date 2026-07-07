// Gedeelde presentatie-helper voor signalen met een minimum-steekproef (min-n). Meters die onder
// dat minimum tóch een percentage tonen ("In één keer akkoord 100%") spreken hun eigen
// "Te weinig gegevens"-badge tegen — één goedgekeurde prestatie zegt niets betrouwbaars. Deze
// helper geeft, wanneer er te weinig gegevens zijn, één eerlijke, sturende regel terug ("Nog X …
// nodig voor een betrouwbaar beeld") in plaats van een misleidend cijfer. Pure functie, los
// testbaar, geen I/O.

/** Of er genoeg waarnemingen zijn voor een betrouwbaar signaal. */
export function hasReliableSample(count: number, minSample: number): boolean {
  return count >= minSample;
}

/** Enkel-/meervoudsvorm van het te tellen zelfstandig naamwoord (NL-meervouden verschillen te veel
 * om automatisch af te leiden, bv. "prestatie" → "prestaties" vs. "betaling" → "betalingen"). */
export interface SampleNoun {
  singular: string;
  plural: string;
}

/**
 * Eerlijke "nog te weinig"-regel voor een meter onder de minimum-steekproef. Vertelt hoeveel
 * waarnemingen er nog nodig zijn in plaats van een misleidend percentage te tonen. Geeft `null`
 * terug zodra de steekproef groot genoeg is (dan hoort de aanroeper het echte cijfer te tonen).
 */
export function insufficientSampleNotice(
  count: number,
  minSample: number,
  noun: SampleNoun,
): string | null {
  if (hasReliableSample(count, minSample)) return null;
  const remaining = Math.max(0, minSample - count);
  const word = remaining === 1 ? noun.singular : noun.plural;
  return `Nog ${remaining} ${word} nodig voor een betrouwbaar beeld`;
}
