// Next.js instrumentation: draait eenmalig bij server-boot. We valideren hier de
// omgevingsvariabelen zodat een verkeerde productieconfiguratie direct faalt.
export async function register() {
  // Alleen in de Node.js-runtime (niet in de edge-runtime van de middleware).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("@/lib/env");
    validateEnv();
  }
}
