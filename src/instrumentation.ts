// Next.js instrumentation: draait eenmalig bij server-boot. We valideren hier de
// omgevingsvariabelen zodat een verkeerde productieconfiguratie direct faalt.
export async function register() {
  // Alleen in de Node.js-runtime (niet in de edge-runtime van de middleware).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("@/lib/env");
    validateEnv();
  }
}

// Next.js 15: gevangen server-fouten (RSC, route handlers, server actions) komen hier binnen.
// We rapporteren ze via de error-reporting-grens. Houd dit robuust: nooit throwen — anders
// maskeren we de oorspronkelijke fout met een fout uit de rapportage.
export async function onRequestError(err: unknown, request: { path?: string }): Promise<void> {
  try {
    const { reportError } = await import("@/lib/observability/report");
    await reportError(err, { source: "onRequestError", requestPath: request?.path });
  } catch {
    // Rapportage mag de fout-afhandeling van Next nooit laten falen; bewust geslikt.
  }
}
