// Connectiviteitszelftest voor de externe error-monitoring (admin-only, /admin/systeemstatus).
//
// De systeemstatus toont of externe error-monitoring geconfigureerd is (SENTRY_DSN gezet), maar
// bewijst niet dat fouten ook echt de externe verwerker bereiken. De grootste STILLE faalmodus:
// SENTRY_DSN staat gezet, maar @sentry/nextjs is niet geïnstalleerd — dan valt de reporter
// (src/lib/observability/report.ts) geruisloos terug op console-loggen en zijn productie-fouten
// extern onzichtbaar. Vóór go-live wil een beheerder dat kunnen bevestigen (MENSENWERK §0b).
//
// Deze module is de tegenhanger van de opslag-/e-mail-/rate-limit-/verificatie-/betaalprovider-/
// upload-scanner-zelftests: puur en injecteerbaar (een spec in, een rapport uit; geen I/O-globals,
// geen klok) zodat het deterministisch te testen is. De aanroeper (server-actie) levert een `run()`
// die de daadwerkelijke Sentry-probe doet (pakket laden → init → testgebeurtenis → flush).
//
// Kernonderscheid: draait er geen externe monitoring (SENTRY_DSN ontbreekt), dan is er niets externs
// te testen en meldt de zelftest dat eerlijk (geen vals groen). Geen secrets in de uitvoer — nooit de
// DSN of een rauw provider-bericht; alleen stap-uitkomsten en een korte, veilige toelichting.

import type { ErrorMonitoringProbeResult } from "@/lib/observability/report";

/** Uitkomst van de zelftest. */
export interface ErrorMonitoringSelfTestReport {
  ok: boolean;
  /** Is externe monitoring geconfigureerd (SENTRY_DSN gezet)? Zo niet: niets getest (geen vals groen). */
  active: boolean;
  /** Is @sentry/nextjs geïnstalleerd? `false` bij een gezette DSN = stille console-fallback. */
  packageInstalled: boolean;
  /** Accepteerde het transport de testgebeurtenis (flush geslaagd)? */
  delivered: boolean;
  /** Korte, niet-gevoelige toelichting (nooit de DSN of een rauw bericht). */
  detail?: string;
}

/** Te testen error-monitoring. `run` wordt alleen aangeroepen wanneer `active`. */
export interface ErrorMonitoringProbeSpec {
  /** Staat externe monitoring aan (SENTRY_DSN gezet)? */
  active: boolean;
  /**
   * Echte probe tegen de externe monitoring (via `probeErrorMonitoring`): laadt het pakket,
   * initialiseert, stuurt één testgebeurtenis en wacht op flush. Alleen vereist/aangeroepen wanneer
   * `active`.
   */
  run?: () => Promise<ErrorMonitoringProbeResult>;
}

const INACTIVE_DETAIL =
  "Geen externe error-monitoring geconfigureerd (SENTRY_DSN ontbreekt) — server-fouten worden alleen gestructureerd gelogd. Er is niets getest.";

/**
 * Brengt een onbekende fout terug tot een korte, PII-/secret-vrije omschrijving: alleen de
 * error-NAAM (bv. "TypeError"), nooit een rauw bericht dat de DSN of een endpoint zou kunnen bevatten.
 */
export function safeErrorMonitoringDetail(error: unknown): string {
  if (error instanceof Error && error.name) return error.name;
  return "Error";
}

/**
 * Voert de zelftest uit. Draait er geen externe monitoring (SENTRY_DSN ontbreekt, inactief), dan
 * wordt dat eerlijk als "niets getest" gerapporteerd (ok, met uitleg). Een actieve monitoring draait
 * zijn `run()` in een try/catch — een fout wordt een veilige `detail`, nooit een throw naar buiten.
 *
 * `ok` is alleen waar wanneer het pakket geïnstalleerd IS én de gebeurtenis is afgeleverd (flush
 * geslaagd): een gezette DSN zonder pakket, of een flush-time-out, zijn juist de faalgevallen die de
 * zelftest zichtbaar moet maken.
 */
export async function runErrorMonitoringSelfTest(
  spec: ErrorMonitoringProbeSpec,
): Promise<ErrorMonitoringSelfTestReport> {
  if (!spec.active) {
    return {
      ok: true,
      active: false,
      packageInstalled: false,
      delivered: false,
      detail: INACTIVE_DETAIL,
    };
  }

  if (!spec.run) {
    return {
      ok: false,
      active: true,
      packageInstalled: false,
      delivered: false,
      detail: "Geen probe beschikbaar.",
    };
  }

  try {
    const result = await spec.run();
    return {
      ok: result.packageInstalled && result.delivered,
      active: true,
      packageInstalled: result.packageInstalled,
      delivered: result.delivered,
      detail: result.detail,
    };
  } catch (error) {
    return {
      ok: false,
      active: true,
      packageInstalled: false,
      delivered: false,
      detail: safeErrorMonitoringDetail(error),
    };
  }
}
