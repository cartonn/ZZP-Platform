// NL-pluralisatie — één bron van waarheid. Voorkomt letterlijke placeholder-vormen als
// "1 reactie(s)" of "1 concept-opdracht(en)" in de UI: kies echte enkelvoud/meervoud.

/** "1 reactie" / "3 reacties" — telwoord + correct enkel-/meervoud. */
export function plural(count: number, enkelvoud: string, meervoud: string): string {
  return `${count} ${count === 1 ? enkelvoud : meervoud}`;
}

/** Alleen het zelfstandig naamwoord (zonder telwoord) in de juiste vorm. */
export function pluralWord(count: number, enkelvoud: string, meervoud: string): string {
  return count === 1 ? enkelvoud : meervoud;
}
