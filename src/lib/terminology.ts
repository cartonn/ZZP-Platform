/**
 * Canonieke Nederlandse UI-terminologie voor het ZZP Platform.
 *
 * Bron: docs/decisions/0008-terminologie-ia.md
 *
 * Twee overload-resoluties die verwarring voorkomen:
 * 1. Opdracht ↔ Dienst: een "Opdracht" is de werkvraag/vacature van een opdrachtgever;
 *    een "Dienst" is een concrete geplande/gewerkte dienst (shift) in de planning.
 *    Verschillende dingen — niet door elkaar gebruiken.
 * 2. Reactie ↔ Kandidaat: hetzelfde onderliggende Application-record, twee perspectieven.
 *    "Reactie" is het ZZP'er-perspectief (heeft gereageerd op een opdracht);
 *    "Kandidaat" is het opdrachtgever-perspectief (beoordeelt een reactie als kandidaat).
 */

/** Alle kern-domeinconcepten van het platform. */
export type DomainConcept =
  | "job" // Opdracht  — de werkvraag van een opdrachtgever (vacature-achtig)
  | "application" // Reactie    — een ZZP'er reageert op een opdracht (ZZP'er-perspectief)
  | "candidate" // Kandidaat  — dezelfde reactie, bezien vanuit de opdrachtgever
  | "collaboration" // Samenwerking — een getekende samenwerking (na match)
  | "performance" // Prestatie  — ingediende uren/oplevering binnen een samenwerking
  | "shift" // Dienst     — een geplande/gewerkte dienst (shift) in de planning
  | "invoice" // Factuur
  | "action" // Actie      — een openstaande next-action/taak
  | "message" // Bericht
  | "credential" // Certificaat
  | "document"; // Document

/** Enkelvoudige (singular) Nederlandse benaming per domeinbegrip. */
export const TERM: Record<DomainConcept, string> = {
  job: "Opdracht",
  application: "Reactie",
  candidate: "Kandidaat",
  collaboration: "Samenwerking",
  performance: "Prestatie",
  shift: "Dienst",
  invoice: "Factuur",
  action: "Actie",
  message: "Bericht",
  credential: "Certificaat",
  document: "Document",
};

/** Meervoudige (plural) Nederlandse benaming per domeinbegrip. */
export const TERM_PLURAL: Record<DomainConcept, string> = {
  job: "Opdrachten",
  application: "Reacties",
  candidate: "Kandidaten",
  collaboration: "Samenwerkingen",
  performance: "Prestaties",
  shift: "Diensten",
  invoice: "Facturen",
  action: "Acties",
  message: "Berichten",
  credential: "Certificaten",
  document: "Documenten",
};

/**
 * Geeft de Nederlandse benaming voor een domeinbegrip terug.
 *
 * @param concept - Het domeinbegrip.
 * @param opts.plural - Wanneer `true`, wordt de meervoudsvorm teruggegeven.
 * @returns De enkelvoudige of meervoudige Nederlandse term.
 */
export function term(concept: DomainConcept, opts?: { plural?: boolean }): string {
  return opts?.plural ? TERM_PLURAL[concept] : TERM[concept];
}
