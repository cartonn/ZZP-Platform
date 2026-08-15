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
// Puur en testbaar: de klok wordt geïnjecteerd, geen Next/HTTP-afhankelijkheden. De state is een
// bewuste module-singleton (één per proces) — precies de levensduur van een server-instance.

let draining = false;
let drainingSince: Date | null = null;
let signalsRegistered = false;
let drainSignalRegistered = false;

/**
 * Markeer de server als afsluitend. Idempotent: alleen de eerste aanroep zet het starttijdstip,
 * zodat een tweede signaal de drain-klok niet reset.
 */
export function beginDraining(now: Date = new Date()): void {
  if (draining) return;
  draining = true;
  drainingSince = now;
}

/** Sluit de server af (readiness → 503)? */
export function isDraining(): boolean {
  return draining;
}

/** Sinds wanneer de server afsluit, of null als hij nog gewoon draait. */
export function drainingSinceAt(): Date | null {
  return drainingSince;
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
  if (signalsRegistered) return false;
  signalsRegistered = true;
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
  if (drainSignalRegistered) return false;
  drainSignalRegistered = true;
  on("SIGUSR2", () => beginDraining());
  return true;
}

/** Alleen voor tests: reset de module-state naar "draait normaal". */
export function resetShutdownStateForTest(): void {
  draining = false;
  drainingSince = null;
  signalsRegistered = false;
  drainSignalRegistered = false;
}
