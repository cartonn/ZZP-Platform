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

/** Alleen voor tests: reset de module-state naar "draait normaal". */
export function resetShutdownStateForTest(): void {
  draining = false;
  drainingSince = null;
  signalsRegistered = false;
}
