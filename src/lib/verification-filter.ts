// Pure zoek-/filterlogica voor de admin-verificatiewachtrij (/admin/verificaties). Server-side
// waarheid: de pagina leest de filter uit de URL-searchParams en filtert de al opgehaalde
// SUBMITTED-certificaten — geen client-state, deterministisch en los van het Prisma-model getest.
//
// Spiegelt het samenwerkingen-paneel (zoeken + status/DBA-filter): hier zoeken op titel, uitgever
// en de naam van de indienende ZZP'er, plus een filter op certificaattype. De wachtrij-volgorde
// (oudste-eerst) blijft behouden; de filter narrows alleen de getoonde lijst.

import { CREDENTIAL_TYPES, type CredentialType } from "@/lib/enums";

/** Minimale vorm die de filter nodig heeft — los van het Prisma-model zodat de helper puur blijft. */
export interface FilterableCredential {
  type: CredentialType;
  title: string;
  issuer: string | null;
  freelancerName: string;
}

export interface VerificationFilter {
  /** Genormaliseerde zoekterm (lowercase, getrimd); leeg = geen zoekfilter. */
  q: string;
  /** Geselecteerd certificaattype; null = alle typen. */
  type: CredentialType | null;
}

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

function isCredentialType(v: string): v is CredentialType {
  return (CREDENTIAL_TYPES as readonly string[]).includes(v);
}

/** Leest de filter uit de ruwe searchParams; onbekende/ongeldige waarden vallen terug op "geen filter". */
export function parseVerificationFilter(
  searchParams: Record<string, string | string[] | undefined>,
): VerificationFilter {
  const q = first(searchParams.q).trim().toLowerCase();
  const type = first(searchParams.type);
  return { q, type: isCredentialType(type) ? type : null };
}

/** Of er momenteel een actieve filter staat (bepaalt de "X van Y"-telregel). */
export function isVerificationFilterActive(filter: VerificationFilter): boolean {
  return filter.q !== "" || filter.type !== null;
}

/** Past de filter toe; behoudt de invoervolgorde (oudste-eerst), muteert de invoer niet. */
export function filterVerificationQueue<T extends FilterableCredential>(
  items: T[],
  filter: VerificationFilter,
): T[] {
  if (!isVerificationFilterActive(filter)) return items;
  return items.filter((c) => {
    if (filter.type && c.type !== filter.type) return false;
    if (filter.q) {
      const haystack = `${c.title} ${c.issuer ?? ""} ${c.freelancerName}`.toLowerCase();
      if (!haystack.includes(filter.q)) return false;
    }
    return true;
  });
}

/** Aantal aanvragen per certificaattype (voor de tellingen in het type-filter). Muteert niet. */
export function countByType(
  items: readonly FilterableCredential[],
): Record<CredentialType, number> {
  const counts = Object.fromEntries(CREDENTIAL_TYPES.map((t) => [t, 0])) as Record<
    CredentialType,
    number
  >;
  for (const c of items) counts[c.type] += 1;
  return counts;
}
