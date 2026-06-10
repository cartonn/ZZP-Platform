/**
 * Gedeelde helper voor cursor-paginatie.
 * Paginagrootte wordt gestuurd via LIST_PAGE_SIZE (default 50).
 * Gebruik pageArgs() om de Prisma-query-args samen te stellen en
 * splitPage() om de take+1-rij te splitsen in items + nextCursor.
 */

/** Leest de geconfigureerde paginagrootte. */
export function getPageSize(): number {
  const raw = process.env.LIST_PAGE_SIZE;
  if (!raw) return 50;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 50;
}

/**
 * Geeft de Prisma-query-args terug voor cursor-paginatie:
 *   take: pageSize + 1  (extra rij om te detecteren of er meer is)
 *   cursor + skip: 1    (als er een cursor is)
 *
 * @param cursor  id van het laatste item van de vorige pagina (of undefined/null voor pagina 1)
 * @param pageSize  optioneel override; defaults to getPageSize()
 */
export function pageArgs(
  cursor: string | null | undefined,
  pageSize: number = getPageSize(),
): { take: number; cursor?: { id: string }; skip?: number } {
  return {
    take: pageSize + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  };
}

/**
 * Splitst de take+1 rijen in items (max pageSize) en de nextCursor.
 * nextCursor is alleen aanwezig als er een volgende pagina is.
 *
 * @param rows    de rijen teruggegeven door Prisma (max pageSize + 1)
 * @param pageSize  optioneel override; defaults to getPageSize()
 */
export function splitPage<T extends { id: string }>(
  rows: T[],
  pageSize: number = getPageSize(),
): { items: T[]; nextCursor: string | null } {
  if (rows.length > pageSize) {
    return {
      items: rows.slice(0, pageSize),
      nextCursor: rows[pageSize - 1]!.id,
    };
  }
  return { items: rows, nextCursor: null };
}
