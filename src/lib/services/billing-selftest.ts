// Connectiviteitszelftest voor de betaalprovider (admin-only, /admin/systeemstatus).
//
// De systeemstatus toont de betaal-MODUS (`stripe`/`mollie`/`noop`), maar bewijst niet dat een
// geconfigureerde provider écht bereikbaar is en de API-sleutel geldig is. Vóór je echt geld int
// (MENSENWERK §3) wil een beheerder dat kunnen bevestigen ná het plakken van de sleutels: doet de
// koppeling het, of hangt hij stil op een verkeerde/verlopen sleutel?
//
// Deze module is de tegenhanger van de opslag-/e-mail-/rate-limit-/verificatie-zelftests: puur en
// injecteerbaar (een spec in, een rapport uit; geen I/O-globals, geen klok) zodat het deterministisch
// te testen is. De aanroeper (server-actie) levert een `run()` die de provider zijn eigen
// `checkConnectivity()` laat doen — een READ-ONLY round-trip (Stripe GET /v1/balance, Mollie
// GET /v2/methods) die bereikbaarheid + auth bewijst ZONDER een betaling/checkout aan te maken.
//
// Kernonderscheid: de zelftest verplaatst nooit geld en maakt nooit een betaalobject aan. Draait de
// betaalflow nog op de demo (`noop`), dan is er niets externs om te testen en meldt de zelftest dat
// eerlijk (geen vals groen).
//
// Geen secrets in de uitvoer: een `BillingConnectivityError` draagt een bewust veilig bericht
// (provider-naam + HTTP-status), dat tonen we; voor elke andere fout uitsluitend de error-NAAM —
// nooit een rauw bericht dat een endpoint/sleutel zou kunnen bevatten.

import { BillingConnectivityError } from "@/lib/billing/provider";

/** Actieve betaal-modus. Alleen `stripe`/`mollie` doen een echte round-trip; `noop` = niets te testen. */
export type BillingDriverMode = "noop" | "mollie" | "stripe";

/** Te testen betaalprovider. `run` wordt alleen aangeroepen wanneer `active`. */
export interface BillingProbeSpec {
  /** Staat een echte provider aan (BILLING_PROVIDER=stripe|mollie)? */
  active: boolean;
  /** Actieve modus (bv. "stripe", "noop"). Geen sleutelwaarden. */
  driverMode: BillingDriverMode;
  /**
   * Read-only round-trip tegen de provider (via `PaymentProvider.checkConnectivity`). Resolvet bij
   * bereikbaar + geldige auth, werpt bij een HTTP-/contract-/netwerkfout. Alleen vereist/aangeroepen
   * wanneer `active`.
   */
  run?: () => Promise<void>;
}

/** Uitkomst van de zelftest. */
export interface BillingSelfTestReport {
  ok: boolean;
  /** Draait er een echte provider? Zo niet: er is niets getest (geen vals groen). */
  active: boolean;
  /** Actieve betaal-modus. Geen sleutelwaarden. */
  driverMode: BillingDriverMode;
  /** Korte, niet-gevoelige toelichting (veilig provider-bericht, error-naam, of demo-uitleg). */
  detail?: string;
}

const OK_DETAIL = "Bereikbaar — betaalprovider antwoordde op een read-only controle.";
const INACTIVE_DETAIL = "Demo-flow actief (geen betaalprovider) — er is niets getest.";

/**
 * Brengt een fout terug tot een korte, PII-/secret-vrije toelichting. Een `BillingConnectivityError`
 * draagt een bewust veilig opgesteld bericht (provider + HTTP-status) — dat tonen we. Voor elke
 * andere (onverwachte) fout uitsluitend de error-NAAM, nooit een rauw bericht dat gevoelige gegevens
 * zou kunnen bevatten.
 */
export function safeBillingDetail(error: unknown): string {
  if (error instanceof BillingConnectivityError) return error.message;
  if (error instanceof Error && error.name) return error.name;
  return "Error";
}

/**
 * Voert de zelftest uit. Draait de betaalflow op de demo (`noop`, inactief), dan wordt dat eerlijk
 * als "niets getest" gerapporteerd (ok, met uitleg). Een actieve provider draait zijn `run()`; die
 * wordt in een try/catch uitgevoerd — een fout wordt een veilige `detail`, nooit een throw naar
 * buiten. Een actieve provider zonder `run` is een programmeerfout van de aanroeper en telt als fout.
 */
export async function runBillingSelfTest(spec: BillingProbeSpec): Promise<BillingSelfTestReport> {
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
    return { ...base, ok: false, detail: safeBillingDetail(error) };
  }
}
