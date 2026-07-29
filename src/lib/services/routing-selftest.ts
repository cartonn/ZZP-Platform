// Connectiviteitszelftest voor de routing-provider (admin-only, /admin/systeemstatus).
//
// De systeemstatus toont de routing-MODUS (`geoapify`/`offline`), maar bewijst niet dat een
// geconfigureerde provider écht bereikbaar is en de API-sleutel geldig is. Reistijd-routing valt
// zonder geldige sleutel STIL terug op de offline haversine-schatting (`travel-distance.ts`) — een
// verkeerd geplakte `GEOAPIFY_API_KEY` blijft daardoor onzichtbaar tot een reistijd verkeerd uitpakt
// bij runtime. Vóór livegang wil een beheerder dat kunnen bevestigen ná het plakken van de sleutel.
//
// Deze module is de tegenhanger van de opslag-/e-mail-/rate-limit-/verificatie-/betaalprovider-
// zelftests: puur en injecteerbaar (een spec in, een rapport uit; geen I/O-globals, geen klok) zodat
// het deterministisch te testen is. De aanroeper (server-actie) levert een `run()` die de provider
// zijn `checkRoutingConnectivity()` laat doen — een READ-ONLY geocode-round-trip die bereikbaarheid +
// auth bewijst ZONDER de cache te muteren of een route te berekenen.
//
// Kernonderscheid: de zelftest wijzigt niets (geen cache-write, geen route). Draait routing nog op de
// offline schatter (`offline`), dan is er niets externs om te testen en meldt de zelftest dat eerlijk
// (geen vals groen).
//
// Geen secrets in de uitvoer: een `RoutingConnectivityError` draagt een bewust veilig bericht
// (provider + reden/HTTP-status), dat tonen we; voor elke andere fout uitsluitend de error-NAAM —
// nooit een rauw bericht dat de aanroep-URL (met sleutel) zou kunnen bevatten.

import { RoutingConnectivityError } from "@/lib/services/routing";

/** Actieve routing-modus. Alleen `geoapify` doet een echte round-trip; `offline` = niets te testen. */
export type RoutingDriverMode = "offline" | "geoapify";

/** Te testen routing-provider. `run` wordt alleen aangeroepen wanneer `active`. */
export interface RoutingProbeSpec {
  /** Staat een echte provider aan (ROUTING_PROVIDER=geoapify)? */
  active: boolean;
  /** Actieve modus (bv. "geoapify", "offline"). Geen sleutelwaarden. */
  driverMode: RoutingDriverMode;
  /**
   * Read-only round-trip tegen de provider (via `checkRoutingConnectivity`). Resolvet bij bereikbaar
   * + geldige auth, werpt bij een HTTP-/contract-/netwerkfout. Alleen vereist/aangeroepen wanneer
   * `active`.
   */
  run?: () => Promise<void>;
}

/** Uitkomst van de zelftest. */
export interface RoutingSelfTestReport {
  ok: boolean;
  /** Draait er een echte provider? Zo niet: er is niets getest (geen vals groen). */
  active: boolean;
  /** Actieve routing-modus. Geen sleutelwaarden. */
  driverMode: RoutingDriverMode;
  /** Korte, niet-gevoelige toelichting (veilig provider-bericht, error-naam, of fallback-uitleg). */
  detail?: string;
}

const OK_DETAIL = "Bereikbaar — routing-provider antwoordde op een read-only geocode-controle.";
const INACTIVE_DETAIL =
  "Offline reistijd-schatting actief (geen routing-provider) — er is niets getest.";

/**
 * Brengt een fout terug tot een korte, PII-/secret-vrije toelichting. Een `RoutingConnectivityError`
 * draagt een bewust veilig opgesteld bericht (provider + reden/HTTP-status) — dat tonen we. Voor elke
 * andere (onverwachte) fout uitsluitend de error-NAAM, nooit een rauw bericht dat de aanroep-URL (met
 * sleutel) zou kunnen bevatten.
 */
export function safeRoutingDetail(error: unknown): string {
  if (error instanceof RoutingConnectivityError) return error.message;
  if (error instanceof Error && error.name) return error.name;
  return "Error";
}

/**
 * Voert de zelftest uit. Draait routing op de offline schatter (`offline`, inactief), dan wordt dat
 * eerlijk als "niets getest" gerapporteerd (ok, met uitleg). Een actieve provider draait zijn
 * `run()`; die wordt in een try/catch uitgevoerd — een fout wordt een veilige `detail`, nooit een
 * throw naar buiten. Een actieve provider zonder `run` is een programmeerfout van de aanroeper en
 * telt als fout.
 */
export async function runRoutingSelfTest(spec: RoutingProbeSpec): Promise<RoutingSelfTestReport> {
  const base = { active: spec.active, driverMode: spec.driverMode };

  if (!spec.active) {
    return { ...base, ok: true, detail: INACTIVE_DETAIL };
  }

  if (!spec.run) {
    return { ...base, ok: false, detail: "Geen probe beschikbaar voor deze provider." };
  }

  try {
    await spec.run();
    return { ...base, ok: true, detail: OK_DETAIL };
  } catch (error) {
    return { ...base, ok: false, detail: safeRoutingDetail(error) };
  }
}
