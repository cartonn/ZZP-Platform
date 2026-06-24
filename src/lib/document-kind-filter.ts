import { DOCUMENT_KINDS, type DocumentKind } from "@/lib/enums";

/**
 * Typefilter voor het documentenoverzicht (`/documenten`). Een document heeft één `kind`
 * (CREDENTIAL/VOG/INSURANCE/CONTRACT/OTHER), dus het filter is een dunne, cascade-vrije variant van
 * het opdracht-statusfilter: elk document valt op zijn `kind` in precies één groep. Pure functies →
 * unit-testbaar zonder database. Spiegelt het pill-patroon van /opdrachten, /facturen en /reacties.
 *
 * De lijst is server-side cursor-gepagineerd; dit filter wordt dus via `documentKindWhere` in de
 * Prisma-`where` toegepast (niet client-side over een geladen pagina) en de pill-tellingen komen uit
 * een goedkope `groupBy` over de volledige eigenaar-scope.
 */

export const DOCUMENT_KIND_FILTER_GROUPS = ["all", ...DOCUMENT_KINDS] as const;
export type DocumentKindFilterGroup = (typeof DOCUMENT_KIND_FILTER_GROUPS)[number];

/** Labels gelijk aan het documentenpaneel (`KIND_LABEL`) zodat pill en badge dezelfde taal spreken. */
export const DOCUMENT_KIND_FILTER_LABEL: Record<DocumentKindFilterGroup, string> = {
  all: "Alle",
  CREDENTIAL: "Credential",
  VOG: "VOG",
  INSURANCE: "Verzekering",
  CONTRACT: "Contract",
  OTHER: "Overig",
};

/** Volgorde van de filter-pills (gelijk aan de enum-volgorde, met "Alle" vooraan). */
export const DOCUMENT_KIND_FILTER_ORDER: DocumentKindFilterGroup[] = ["all", ...DOCUMENT_KINDS];

/** Onbekende/lege/malicieuze waarde → "all". Eén bron voor het inlezen van de `kind`-searchParam. */
export function parseDocumentKindFilter(value: string | undefined): DocumentKindFilterGroup {
  return (DOCUMENT_KIND_FILTER_GROUPS as readonly string[]).includes(value ?? "")
    ? (value as DocumentKindFilterGroup)
    : "all";
}

/** Prisma-`where`-fragment voor de gekozen groep; "all" → geen `kind`-constraint. */
export function documentKindWhere(
  group: DocumentKindFilterGroup,
): Record<string, never> | { kind: DocumentKind } {
  return group === "all" ? {} : { kind: group };
}

type KindCount = { kind: string; count: number };

/**
 * Telling per groep over de volledige eigenaar-scope (voor de pill-labels). `all` = totaal.
 * Invoer = de geaggregeerde counts per `kind` (bv. uit een Prisma-`groupBy`). Onbekende kinds
 * tellen wél mee in het totaal maar niet in een specifieke pill (defensief tegen legacy-waarden).
 */
export function summarizeDocumentKindGroups(
  counts: KindCount[],
): Record<DocumentKindFilterGroup, number> {
  const result: Record<DocumentKindFilterGroup, number> = {
    all: 0,
    CREDENTIAL: 0,
    VOG: 0,
    INSURANCE: 0,
    CONTRACT: 0,
    OTHER: 0,
  };
  for (const { kind, count } of counts) {
    result.all += count;
    if ((DOCUMENT_KINDS as readonly string[]).includes(kind)) {
      result[kind as DocumentKind] += count;
    }
  }
  return result;
}
