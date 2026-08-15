// Next.js instrumentation: draait eenmalig bij server-boot. We valideren hier de
// omgevingsvariabelen zodat een verkeerde productieconfiguratie direct faalt.
export async function register() {
  // Alleen in de Node.js-runtime (niet in de edge-runtime van de middleware).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("@/lib/env");
    validateEnv();

    // Graceful shutdown: flip de readiness-probe naar "draining" zodra een afsluitsignaal binnenkomt,
    // zodat de load balancer geen nieuw verkeer meer naar deze afsluitende instance stuurt. Verandert
    // de bestaande afsluiting niet — zet alleen de readiness-vlag.
    const { registerShutdownSignals, registerDrainSignal } =
      await import("@/lib/observability/shutdown");
    registerShutdownSignals();
    // Drain-only signaal (SIGUSR2): de orchestrator (scripts/start.mjs) flipt hiermee readiness →
    // 503 zónder de HTTP-server te sluiten, wacht een drain-venster zodat de load balancer deze
    // instance uit de rotatie haalt, en stuurt pas dán de echte SIGTERM. Zero-downtime redeploy.
    registerDrainSignal();
  }
}

// Next.js 15: gevangen server-fouten (RSC, route handlers, server actions) komen hier binnen.
// We rapporteren ze via de error-reporting-grens. Houd dit robuust: nooit throwen — anders
// maskeren we de oorspronkelijke fout met een fout uit de rapportage.
export async function onRequestError(
  err: unknown,
  request: { path?: string; headers?: Record<string, string | string[] | undefined> },
): Promise<void> {
  try {
    const [{ reportError }, { sanitizeRequestId, REQUEST_ID_HEADER }] = await Promise.all([
      import("@/lib/observability/report"),
      import("@/lib/observability/request-id"),
    ]);
    // De middleware zette `x-request-id` op de forwarded request-headers; neem 'm mee zodat de
    // fout te herleiden is naar de exacte request (en de response die de gebruiker zag).
    const rawId = request?.headers?.[REQUEST_ID_HEADER];
    const requestId = sanitizeRequestId(Array.isArray(rawId) ? rawId[0] : rawId) ?? undefined;
    await reportError(err, { source: "onRequestError", requestPath: request?.path, requestId });
  } catch {
    // Rapportage mag de fout-afhandeling van Next nooit laten falen; bewust geslikt.
  }
}
