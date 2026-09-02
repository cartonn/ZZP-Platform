// Hoofdletterongevoelig zoeken dat op SQLite (lokaal/CI) én PostgreSQL (productie) hetzelfde doet.
//
// WAAROM: `{ contains: q }` gedraagt zich per database anders. SQLite's LIKE is voor ASCII van
// nature hoofdletterongevoelig, PostgreSQL's LIKE niet. Een zoekopdracht op "verpleeg" vindt
// lokaal dus wél "Verpleegkundige" en in productie níét — stille divergentie die geen enkele
// SQLite-test zichtbaar maakt. Prisma lost dat op met `mode: "insensitive"`, maar dat veld
// bestaat alleen in de PostgreSQL-client: meesturen op SQLite levert een validatiefout op.
// Daarom leidt deze helper de actieve provider af uit DATABASE_URL en stuurt `mode` alleen mee
// waar het geldig is. Gedrag op SQLite blijft byte-identiek aan voorheen.

/**
 * Prisma-stringfilter dat op beide providers geldig is. `mode` is optioneel zodat het object
 * toewijsbaar blijft aan de SQLite-variant van `Prisma.StringFilter` (die het veld niet kent).
 */
export interface CaseInsensitiveContains {
  contains: string;
  mode?: "insensitive";
}

/** True zodra de URL naar PostgreSQL wijst (`postgres://` of `postgresql://`). */
export function isPostgresUrl(databaseUrl: string | undefined | null): boolean {
  return /^postgres(ql)?:\/\//i.test((databaseUrl ?? "").trim());
}

// De provider wisselt niet tijdens een procesleven: één keer afleiden en hergebruiken.
let cachedIsPostgres: boolean | null = null;

function providerIsPostgres(): boolean {
  cachedIsPostgres ??= isPostgresUrl(process.env.DATABASE_URL);
  return cachedIsPostgres;
}

/**
 * Bouwt het filter voor een expliciet gegeven provider. Puur — de testbare kern van `ciContains`.
 */
export function containsFilterFor(value: string, postgres: boolean): CaseInsensitiveContains {
  return postgres ? { contains: value, mode: "insensitive" } : { contains: value };
}

/**
 * Hoofdletterongevoelig "bevat"-filter voor gebruikerszoekopdrachten.
 *
 * Gebruik dit overal waar een door de gebruiker ingetypte term tegen een tekstkolom wordt
 * gematcht. Gebruik het NIET voor exacte technische matches (JSON-markers in `metadata`,
 * factuurnummer-prefixes): die moeten hoofdlettergevoelig blijven.
 */
export function ciContains(value: string): CaseInsensitiveContains {
  return containsFilterFor(value, providerIsPostgres());
}
