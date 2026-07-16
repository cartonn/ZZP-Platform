// Connectiviteitszelftest voor de externe verificatie-adapters (admin-only, /admin/systeemstatus).
//
// De systeemstatus toont per verificatiebron de MODUS (echte adapter `duo`/`bigregister`/`idin` vs.
// de ingebouwde demo-verifier `mock`), maar bewijst niet dat een geconfigureerde echte adapter het
// endpoint écht bereikt. Vóór echte diploma-/zorg-/identiteitscontrole (MENSENWERK §4) wil een
// beheerder dat kunnen bevestigen ná het plakken van de basis-URL + sleutel: doet de koppeling het,
// of hangt hij stil op een verkeerd endpoint / verlopen sleutel / afwijkend contract?
//
// Deze module is de tegenhanger van de opslag-/e-mail-/rate-limit-zelftests: puur en injecteerbaar
// (een lijst probe-specs in, een rapport uit; geen I/O-globals, geen klok) zodat het deterministisch
// te testen is. De aanroeper (server-actie) levert per adapter een `run()` die een echte round-trip
// tegen het endpoint doet met een SYNTHETISCHE probe-invoer.
//
// Kernonderscheid t.o.v. een echte verificatie: de zelftest toetst ALLEEN bereikbaarheid + auth +
// contract-vorm, NIET of de probe "geverifieerd" is. Een `verified:false` op een verzonnen code is
// juist een GEZONDE uitkomst (het endpoint antwoordde volgens contract). Een netwerkfout, 401/5xx of
// contract-mismatch is een fout. Zo genereert de probe nooit een misleidend "geverifieerd"-signaal.
//
// Geen secrets in de uitvoer: bij een fout gebruiken we het (bewust veilig opgestelde) bericht van
// de bekende verifier-fouttypes, en voor elke andere fout uitsluitend de error-NAAM — nooit een rauw
// bericht dat een endpoint/sleutel zou kunnen bevatten.

import {
  VerifierNotConfiguredError,
  VerifierRequestError,
  type RawVerifyResponse,
} from "@/lib/services/http-verify";

export type VerifierKey = "diploma" | "big" | "identity";

/** Eén te testen verificatie-adapter. `run` wordt alleen aangeroepen wanneer `active` is. */
export interface VerifierProbeSpec {
  key: VerifierKey;
  /** Nederlandse omschrijving (bv. "DUO — diploma's"). */
  label: string;
  /** Staat de echte adapter aan (env-schakelaar op de echte waarde)? */
  active: boolean;
  /** Actieve modus (bv. "duo", "mock"). Geen sleutelwaarden. */
  driverMode: string;
  /**
   * Echte round-trip tegen het endpoint met een synthetische probe-invoer. Resolvet met het rauwe
   * contract-antwoord (bereikbaar + auth + contract geldig, ongeacht `verified`), werpt bij netwerk-/
   * HTTP-/contract-/configuratiefouten. Alleen vereist/aangeroepen wanneer `active`.
   */
  run?: () => Promise<RawVerifyResponse>;
}

/** Uitkomst per adapter. */
export interface VerifierProbeResult {
  key: VerifierKey;
  label: string;
  active: boolean;
  driverMode: string;
  ok: boolean;
  /** Korte, niet-gevoelige toelichting (veilig verifier-bericht, error-naam, of demo-uitleg). */
  detail?: string;
}

export interface VerifierSelfTestReport {
  /** true wanneer elke ACTIEVE adapter bereikbaar is (inactieve adapters falen het geheel niet). */
  ok: boolean;
  /** Draait er minstens één echte adapter? Zo niet: er is niets getest (geen vals groen). */
  anyActive: boolean;
  results: VerifierProbeResult[];
}

const OK_DETAIL = "Bereikbaar — endpoint antwoordde volgens contract.";
const INACTIVE_DETAIL = "Demo-verifier actief (geen echte adapter) — er is niets getest.";

/**
 * Brengt een fout terug tot een korte, PII-/secret-vrije toelichting. De bekende verifier-fouttypes
 * dragen een bewust veilig opgesteld, informatief bericht (naam + status, geen sleutel/endpoint) —
 * dat tonen we. Voor elke andere (onverwachte) fout uitsluitend de error-NAAM, nooit een rauw
 * bericht dat gevoelige gegevens zou kunnen bevatten.
 */
export function safeVerifierDetail(error: unknown): string {
  if (error instanceof VerifierRequestError || error instanceof VerifierNotConfiguredError) {
    return error.message;
  }
  if (error instanceof Error && error.name) return error.name;
  return "Error";
}

/**
 * Voert de zelftest uit over alle adapters. Inactieve adapters worden eerlijk als "niets getest"
 * gerapporteerd (ok, maar met uitleg). Actieve adapters draaien hun `run()`; die werpt nooit naar
 * buiten (elke `run` wordt in een eigen try/catch uitgevoerd) — een fout wordt een veilige `detail`.
 * Een actieve adapter zonder `run` is een programmeerfout van de aanroeper en telt als fout (defensief).
 */
export async function runVerifierSelfTest(
  specs: VerifierProbeSpec[],
): Promise<VerifierSelfTestReport> {
  const results: VerifierProbeResult[] = [];

  for (const spec of specs) {
    const base = {
      key: spec.key,
      label: spec.label,
      active: spec.active,
      driverMode: spec.driverMode,
    };

    if (!spec.active) {
      results.push({ ...base, ok: true, detail: INACTIVE_DETAIL });
      continue;
    }

    if (!spec.run) {
      results.push({ ...base, ok: false, detail: "Geen probe beschikbaar voor deze adapter." });
      continue;
    }

    try {
      await spec.run();
      results.push({ ...base, ok: true, detail: OK_DETAIL });
    } catch (error) {
      results.push({ ...base, ok: false, detail: safeVerifierDetail(error) });
    }
  }

  const active = results.filter((r) => r.active);
  return {
    ok: active.every((r) => r.ok),
    anyActive: active.length > 0,
    results,
  };
}
