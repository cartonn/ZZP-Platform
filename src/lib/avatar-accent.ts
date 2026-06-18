// Deterministisch avatar-accent voor initialen-cirkels: dezelfde persoon krijgt overal dezelfde
// kleur, verschillende personen verschillende kleuren — i.p.v. één uniforme grijze cirkel.
// Puur, geen I/O. Palet = de vier accenttinten uit het #19-designsysteem.

const AVATAR_ACCENTS = [
  "bg-primary/15 text-primary",
  "bg-success/15 text-success",
  "bg-accent text-accent-foreground",
  "bg-warning/15 text-warning",
] as const;

/**
 * Stabiele `bg-…/text-…`-klasse op basis van een zaad (naam of id). Hetzelfde zaad geeft altijd
 * dezelfde kleur; leeg zaad valt terug op de eerste kleur.
 */
export function avatarAccent(seed: string | null | undefined): string {
  const s = (seed ?? "").trim();
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (Math.imul(hash, 31) + s.charCodeAt(i)) | 0;
  const idx = Math.abs(hash) % AVATAR_ACCENTS.length;
  return AVATAR_ACCENTS[idx] ?? AVATAR_ACCENTS[0];
}
