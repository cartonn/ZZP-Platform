// Readiness-logica: bepaalt of de app klaar is om verkeer te bedienen.
// Strenger dan liveness: de database moet bereikbaar zijn EN het schema gemigreerd
// (een kerntabel queryable). Pure, testbare logica — geen Next/HTTP-afhankelijkheden.

export interface ReadinessCheck {
  name: string;
  ok: boolean;
  detail?: string;
}

export interface ReadinessReport {
  ready: boolean;
  checks: ReadinessCheck[];
}

/**
 * Geeft een KORTE, PII-vrije omschrijving van een fout terug.
 * Gebruikt alleen de error-naam (bv. "PrismaClientKnownRequestError"),
 * nooit het volledige bericht — dat kan een connection-string of andere
 * gevoelige inhoud bevatten.
 */
function safeDetail(error: unknown): string {
  if (error instanceof Error && error.name) {
    return error.name;
  }
  return "Error";
}

/**
 * Voert de readiness-checks uit met injecteerbare probes (zodat tests
 * geen echte DB nodig hebben). Elke probe heeft een eigen try/catch en
 * werpt nooit naar buiten: een gefaalde probe wordt een check met ok:false.
 */
export async function evaluateReadiness(probes: {
  dbPing: () => Promise<void>; // bv. SELECT 1 — werpt bij onbereikbaar
  schemaProbe: () => Promise<number>; // bv. user.count() — werpt als migratie ontbreekt
  draining?: boolean; // true ⇒ de server sluit af: readiness 503, liveness blijft 200
}): Promise<ReadinessReport> {
  const checks: ReadinessCheck[] = [];

  // Check 1: database bereikbaar.
  try {
    await probes.dbPing();
    checks.push({ name: "database", ok: true });
  } catch (error) {
    checks.push({ name: "database", ok: false, detail: safeDetail(error) });
  }

  // Check 2: schema gemigreerd (kerntabel queryable).
  try {
    await probes.schemaProbe();
    checks.push({ name: "schema", ok: true });
  } catch (error) {
    checks.push({ name: "schema", ok: false, detail: safeDetail(error) });
  }

  // Check 3 (optioneel): sluit de server af? Alleen meegewogen wanneer expliciet meegegeven, zodat
  // bestaande aanroepers (en hun tests) ongewijzigd blijven. Een afsluitende instance is bewust
  // "not ready" zodat de load balancer er geen nieuw verkeer meer heen stuurt.
  if (probes.draining !== undefined) {
    checks.push(
      probes.draining
        ? { name: "shutdown", ok: false, detail: "draining" }
        : { name: "shutdown", ok: true },
    );
  }

  const ready = checks.every((check) => check.ok);
  return { ready, checks };
}
