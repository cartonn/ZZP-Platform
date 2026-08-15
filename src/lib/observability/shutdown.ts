// In-process graceful-shutdown state.
//
// Wanneer de server een afsluitsignaal (SIGTERM/SIGINT) ontvangt — bij een Railway-redeploy of een
// operator die de container stopt — markeren we hem als "draining":
//   - de readiness-probe (`/api/readiness`) rapporteert dan 503, zodat de load balancer / het
//     platform geen NIEUW verkeer meer naar deze afsluitende instance stuurt;
//   - lopende requests kunnen ondertussen nog afronden (Next sluit de HTTP-server netjes af);
//   - de liveness-probe (`/api/health`) blijft bewust 200, zodat de host-healthcheck de container
//     niet als "dood" beoordeelt en vroegtijdig herstart tijdens de nette afsluiting.
//
// Puur en testbaar: de klok wordt geïnjecteerd, geen Next/HTTP-afhankelijkheden.
//
// State-opslag — PROCES-globaal via globalThis, NIET module-scoped. Reden: Next bundelt
// `instrumentation.ts` (waar het afsluitsignaal de drain-vlag zet) en de route-handlers (waar
// `/api/readiness` de vlag leest) in APARTE module-grafen. Een gewone `let` op module-niveau wordt
// dan PER graaf geïnstantieerd → de instrumentatie zet zijn eigen kopie op draining terwijl de
// readiness-route een andere kopie leest die false blijft (de drain flipt readiness dan nooit —
// end-to-end geverifieerd). Een `Symbol.for`-anker op globalThis is één instantie per PROCES en
// wordt door beide grafen gedeeld, precies de levensduur van een server-instance.

interface ShutdownState {
  draining: boolean;
  drainingSince: Date | null;
  signalsRegistered: boolean;
  drainSignalRegistered: boolean;
}

const STATE_KEY = Symbol.for("zzp.observability.shutdownState");

function state(): ShutdownState {
  const store = globalThis as typeof globalThis & { [STATE_KEY]?: ShutdownState };
  if (!store[STATE_KEY]) {
    store[STATE_KEY] = {
      draining: false,
      drainingSince: null,
      signalsRegistered: false,
      drainSignalRegistered: false,
    };
  }
  return store[STATE_KEY];
}

/**
 * Markeer de server als afsluitend. Idempotent: alleen de eerste aanroep zet het starttijdstip,
 * zodat een tweede signaal de drain-klok niet reset.
 */
export function beginDraining(now: Date = new Date()): void {
  const s = state();
  if (s.draining) return;
  s.draining = true;
  s.drainingSince = now;
}

/** Sluit de server af (readiness → 503)? */
export function isDraining(): boolean {
  return state().draining;
}

/** Sinds wanneer de server afsluit, of null als hij nog gewoon draait. */
export function drainingSinceAt(): Date | null {
  return state().drainingSince;
}

/**
 * Registreer éénmalig de afsluitsignaal-handlers die de server op "draining" zetten. Idempotent:
 * een tweede aanroep (bv. een hot-reload van de instrumentatie in dev) voegt geen dubbele handlers
 * toe. De signaal-registratie is injecteerbaar zodat tests geen echte process-listeners hoeven te
 * plaatsen.
 *
 * Belangrijk: deze handler VERANDERT de bestaande afsluiting niet — hij flipt alleen de
 * readiness-vlag. Next.js' eigen SIGTERM-afhandeling (HTTP-server netjes sluiten) en de
 * force-kill-vangnet in `scripts/start.mjs` blijven onaangetast.
 */
export function registerShutdownSignals(
  on: (signal: NodeJS.Signals, handler: () => void) => void = (signal, handler) => {
    // `process.on` zonder de listener te verwijderen: het proces sluit sowieso af.
    process.on(signal, handler);
  },
): boolean {
  const s = state();
  if (s.signalsRegistered) return false;
  s.signalsRegistered = true;
  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    on(signal, () => beginDraining());
  }
  return true;
}

/**
 * Registreer éénmalig de "drain-only" signaal-handler (SIGUSR2) die de server op "draining" zet
 * ZONDER de HTTP-server te sluiten. De orchestrator (`scripts/start.mjs`) stuurt dit signaal als
 * eerste fase van een nette afsluiting: readiness flipt naar 503, de load balancer haalt deze
 * instance uit de rotatie, en pas ná het drain-venster volgt de echte SIGTERM die Next de
 * HTTP-server laat sluiten. Next behandelt SIGUSR2 niet als afsluitsignaal, dus de server blijft
 * tijdens het drain-venster gewoon requests bedienen (geen connection-reset op nieuw verkeer dat
 * de load balancer nog even doorstuurt).
 *
 * Idempotent en injecteerbaar, net als `registerShutdownSignals`. Belangrijk: het registreren van
 * een eigen SIGUSR2-listener onderdrukt Node's default (die SIGUSR2 anders als terminate afhandelt).
 */
export function registerDrainSignal(
  on: (signal: NodeJS.Signals, handler: () => void) => void = (signal, handler) => {
    process.on(signal, handler);
  },
): boolean {
  const s = state();
  if (s.drainSignalRegistered) return false;
  s.drainSignalRegistered = true;
  on("SIGUSR2", () => beginDraining());
  return true;
}

/** Alleen voor tests: reset de proces-globale state naar "draait normaal". */
export function resetShutdownStateForTest(): void {
  const s = state();
  s.draining = false;
  s.drainingSince = null;
  s.signalsRegistered = false;
  s.drainSignalRegistered = false;
}
