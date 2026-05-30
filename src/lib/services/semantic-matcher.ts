// Semantische gelijkenis achter een schone service-grens.
//
// Twee implementaties:
//  - LocalSemanticMatcher: deterministisch, in-memory via feature hashing (dev/test/productie zonder pgvector).
//  - PgVectorSemanticMatcher: toekomstig koppelpunt voor cosinus op vooraf berekende embeddings in PostgreSQL
//    via de pgvector-extensie. De DB-kant (extensie, embedding-kolom, index) is mensenwerk;
//    zonder die provisioning faalt deze driver helder.

import { textRelatedness } from "@/lib/semantic";

/** Berekent inhoudelijke gelijkenis tussen twee teksten. */
export interface SemanticMatcher {
  /** Inhoudelijke gelijkenis tussen twee teksten, 0..1. */
  relatedness(a: string, b: string): number;
}

/** Lokale in-memory matcher — gebruikt feature hashing + cosinusgelijkenis. Werkt altijd. */
export class LocalSemanticMatcher implements SemanticMatcher {
  relatedness(a: string, b: string): number {
    return textRelatedness(a, b);
  }
}

/**
 * Matcher die cosinus-gelijkenis via pgvector in PostgreSQL berekent.
 * Vereist: pgvector-extensie, een embedding-kolom en een ANN-index (productie-provisioning = mensenwerk).
 * Zonder die configuratie faalt deze klasse helder.
 */
export class PgVectorSemanticMatcher implements SemanticMatcher {
  relatedness(_a: string, _b: string): number {
    throw new Error(
      "pgvector semantische matching is niet geconfigureerd. " +
        "Voorzie de pgvector-extensie, een embedding-kolom en een index (productie-onboarding = mensenwerk).",
    );
  }
}

/**
 * Veilige wrapper: geeft 0 terug als de matcher faalt,
 * zodat ranking nooit breekt bij een niet-geconfigureerde driver.
 */
export function safeRelatedness(matcher: SemanticMatcher, a: string, b: string): number {
  try {
    return matcher.relatedness(a, b);
  } catch {
    return 0;
  }
}

/**
 * Levert de geconfigureerde matcher op basis van de omgevingsvariabele SEMANTIC_MATCHER.
 * "pgvector" → PgVectorSemanticMatcher; anders LocalSemanticMatcher.
 */
export function getSemanticMatcher(): SemanticMatcher {
  return process.env.SEMANTIC_MATCHER?.toLowerCase() === "pgvector"
    ? new PgVectorSemanticMatcher()
    : new LocalSemanticMatcher();
}
