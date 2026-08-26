// Semantische gelijkenis achter een schone service-grens.
//
// Twee implementaties:
//  - LocalSemanticMatcher: deterministisch, in-memory via feature hashing (dev/test/productie zonder pgvector).
//  - PgVectorSemanticMatcher: toekomstig koppelpunt voor cosinus op vooraf berekende embeddings in PostgreSQL
//    via de pgvector-extensie. De DB-kant (extensie, embedding-kolom, index + embedding-pijplijn) is
//    mensenwerk; zolang die provisioning ontbreekt is de driver NIET operationeel.
//
// Belangrijk (prod-rijpheid): `SEMANTIC_MATCHER=pgvector` selecteren mag de matching nooit STIL
// degraderen. Vroeger gaf `getSemanticMatcher()` de nog-niet-gebouwde PgVector-driver terug, wiens
// `relatedness()` gooit; `safeRelatedness` ving dat naar `0` → de relatedness-component van ELKE match
// werd stil op nul gezet zonder boot-fout, waarschuwing, status of metric. Dat is precies de "halve
// activering is gevaarlijker dan geen"-faalmodus die de rest van de codebase overal afvangt. Daarom:
//   1. `getSemanticMatcher()` valt GRACEFUL terug op de werkende lokale matcher zolang pgvector niet
//      operationeel is (geen stille nul-degradatie; matching blijft deterministisch werken).
//   2. De geselecteerde-maar-niet-operationele stand is ZICHTBAAR via de env-waarschuwing
//      (`envWarnings`), de systeemstatus-posture en een aparte zelftest/go-live-sweep-runner — net als
//      elke andere env-selecteerbare integratie (opslag/mail/routing/…).

import { textRelatedness } from "@/lib/semantic";

/** Geconfigureerde matcher-driver (rauwe env-keuze, los van wat er uiteindelijk resolveert). */
export type SemanticMatcherKind = "local" | "pgvector";

/** Uitkomst van een operationele probe tegen de geconfigureerde matcher (voor de zelftest). */
export interface SemanticMatcherProbeResult {
  /** Is de driver écht operationeel (bv. pgvector-extensie + embedding-kolom + index aanwezig)? */
  operational: boolean;
  /** relatedness(x, x) — hoort ~1 te zijn wanneer operationeel (contract-check). */
  selfScore?: number;
  /** relatedness(x, y-ongerelateerd) — hoort lager dan selfScore te zijn (discriminatie-check). */
  crossScore?: number;
}

/** Berekent inhoudelijke gelijkenis tussen twee teksten. */
export interface SemanticMatcher {
  /** Inhoudelijke gelijkenis tussen twee teksten, 0..1. */
  relatedness(a: string, b: string): number;
  /** Is deze driver operationeel? Een niet-operationele driver mag nooit aan consumers worden gegeven. */
  isOperational(): boolean;
}

/** Lokale in-memory matcher — gebruikt feature hashing + cosinusgelijkenis. Werkt altijd. */
export class LocalSemanticMatcher implements SemanticMatcher {
  relatedness(a: string, b: string): number {
    return textRelatedness(a, b);
  }

  isOperational(): boolean {
    return true;
  }
}

/**
 * Matcher die cosinus-gelijkenis via pgvector in PostgreSQL berekent.
 * Vereist: pgvector-extensie, een embedding-kolom en een ANN-index (productie-provisioning = mensenwerk).
 * Zolang die provisioning ontbreekt is de driver NIET operationeel: `isOperational()` geeft `false` en
 * `relatedness()` gooit helder. `getSemanticMatcher()` levert 'm daarom niet aan consumers zolang hij
 * niet operationeel is (graceful terugval op de lokale matcher).
 */
export class PgVectorSemanticMatcher implements SemanticMatcher {
  isOperational(): boolean {
    // De DB-provisioning (extensie/kolom/index + embedding-pijplijn) is mensenwerk en nog niet gedaan.
    // Een toekomstige echte implementatie bewijst hier de operationele staat (bv. een bewaarde
    // capability-flag of een DB-capabilitycheck) en levert dan een werkende relatedness().
    return false;
  }

  relatedness(_a: string, _b: string): number {
    throw new Error(
      "pgvector semantische matching is niet geconfigureerd. " +
        "Voorzie de pgvector-extensie, een embedding-kolom en een index (productie-onboarding = mensenwerk).",
    );
  }

  /**
   * Read-only operationele probe voor de zelftest. Bevestigt of de driver operationeel is en, zo ja,
   * dat een round-trip een plausibele gelijkenis oplevert (zelf-gelijkenis ~1, discriminatie t.o.v. een
   * ongerelateerd paar). Zolang de provisioning ontbreekt geeft hij `{ operational: false }` terug —
   * de zelftest meldt dat dan eerlijk (geen vals groen) en dat matching op de lokale fallback draait.
   */
  async probe(): Promise<SemanticMatcherProbeResult> {
    if (!this.isOperational()) return { operational: false };
    const selfScore = this.relatedness(
      "verpleegkundige ziekenhuis zorg",
      "verpleegkundige ziekenhuis zorg",
    );
    const crossScore = this.relatedness(
      "verpleegkundige ziekenhuis zorg",
      "vrachtwagenchauffeur logistiek transport",
    );
    return { operational: true, selfScore, crossScore };
  }
}

/**
 * Veilige wrapper: geeft 0 terug als de matcher faalt, zodat ranking nooit breekt bij een
 * niet-geconfigureerde driver. Defensief vangnet — `getSemanticMatcher()` levert een niet-operationele
 * driver niet meer aan consumers, dus in de normale flow gooit de matcher hier nooit.
 */
export function safeRelatedness(matcher: SemanticMatcher, a: string, b: string): number {
  try {
    return matcher.relatedness(a, b);
  } catch {
    return 0;
  }
}

/**
 * De RAUWE, geconfigureerde matcher-driver op basis van SEMANTIC_MATCHER — los van wat er uiteindelijk
 * resolveert. Bedoeld voor de env-waarschuwing, de systeemstatus-posture en de zelftest, die willen
 * weten wat de operator SELECTEERDE (ook als dat gracieus terugvalt op lokaal).
 */
export function configuredSemanticMatcher(): SemanticMatcherKind {
  return process.env.SEMANTIC_MATCHER?.toLowerCase() === "pgvector" ? "pgvector" : "local";
}

/**
 * Levert de EFFECTIEVE matcher voor consumers. "pgvector" → PgVectorSemanticMatcher zodra die
 * operationeel is; is hij dat (nog) niet, dan graceful terugval op LocalSemanticMatcher i.p.v. een
 * gooiende stub (die anders stil naar 0 zou degraderen). Zonder config → LocalSemanticMatcher.
 */
export function getSemanticMatcher(): SemanticMatcher {
  if (configuredSemanticMatcher() === "pgvector") {
    const pgvector = new PgVectorSemanticMatcher();
    if (pgvector.isOperational()) return pgvector;
    // Geselecteerd maar niet operationeel → werkende lokale matcher (geen stille nul-degradatie).
    // Deze stand is zichtbaar via envWarnings + systeemstatus + de semantische-matching-zelftest.
  }
  return new LocalSemanticMatcher();
}

/**
 * Draait de matching STIL op de lokale fallback terwijl de operator pgvector SELECTEERDE? Dat is de
 * "halve activering"-faalmodus: de operator denkt mogelijk dat semantische matching via pgvector actief
 * is, terwijl `getSemanticMatcher()` graceful terugvalt op de lokale matcher zolang de DB-provisioning
 * (extensie/kolom/index/embedding-pijplijn = mensenwerk) ontbreekt. Eén bron van waarheid, gedeeld door
 * de systeemstatus-posture én de `/api/metrics`-gauge (`zzp_semantic_matcher_degraded`) zodat een
 * externe monitor erop kan alarmeren zónder op /admin in te loggen.
 *
 * `true` ⟺ pgvector geselecteerd én niet operationeel. `local` (of geen config) → `false` (dat is een
 * geldige, productie-geschikte eindtoestand, geen degradatie). Puur/synchroon: leidt de stand af uit de
 * env-keuze + `isOperational()`, doet geen DB-round-trip (het definitieve round-trip-bewijs blijft de
 * point-in-time semantische-matching-zelftest).
 */
export function isSemanticMatcherDegraded(): boolean {
  if (configuredSemanticMatcher() !== "pgvector") return false;
  return !new PgVectorSemanticMatcher().isOperational();
}
