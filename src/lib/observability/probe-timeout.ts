// Harde time-out voor de gezondheids-probes (/api/health liveness, /api/readiness readiness).
//
// Waarom: de probes doen een DB-round-trip (SELECT 1 + kerntabel-count). Een *fout* (DB onbereikbaar)
// wordt netjes afgevangen, maar een DB die de TCP-verbinding openhoudt en simpelweg *niet meer
// antwoordt* (connection-pool-uitputting, lock-contentie, netwerk-partitie waarbij de socket open
// blijft) laat zo'n await **oneindig hangen** — de probe geeft dan nooit antwoord. Voor de
// orchestrator (Railway/load balancer) is een hangende probe dubbelzinnig: hij kan "traag" niet van
// "vastgelopen" onderscheiden. Dit is exact de faalmodus die de codebase voor álle uitgaande HTTP al
// afvangt via `fetchWithTimeout` en voor cron-taken via `withTaskTimeout`; deze helper trekt die
// discipline door naar de DB-probes.
//
// Deze module is PUUR en deterministisch testbaar: geen Next/Prisma/HTTP-afhankelijkheden, alleen
// `Promise.race` + een timer die altijd wordt opgeruimd.

/** Fout waarmee de race verwerpt wanneer een probe zijn deadline overschrijdt. */
export class ProbeTimeoutError extends Error {
  constructor(name: string, timeoutMs: number) {
    super(`Probe "${name}" overschreed de deadline van ${timeoutMs} ms`);
    this.name = "ProbeTimeoutError";
  }
}

export const MIN_PROBE_TIMEOUT_MS = 250;
export const MAX_PROBE_TIMEOUT_MS = 30_000;
export const DEFAULT_PROBE_TIMEOUT_MS = 3_000;

/**
 * Leest de probe-time-out (ms) uit een ruwe env-waarde en klemt hem op [MIN, MAX]. Een lege,
 * niet-numerieke of niet-positieve waarde valt terug op de default. Puur/testbaar.
 */
export function resolveProbeTimeoutMs(
  raw: string | undefined,
  fallback: number = DEFAULT_PROBE_TIMEOUT_MS,
): number {
  const clamp = (n: number) =>
    Math.min(MAX_PROBE_TIMEOUT_MS, Math.max(MIN_PROBE_TIMEOUT_MS, Math.round(n)));
  const parsed = raw !== undefined && raw.trim() !== "" ? Number(raw) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) return clamp(parsed);
  const parsedFallback =
    Number.isFinite(fallback) && fallback > 0 ? fallback : DEFAULT_PROBE_TIMEOUT_MS;
  return clamp(parsedFallback);
}

/**
 * Wikkelt een probe met een harde deadline via `Promise.race`. Overschrijdt de probe de deadline, dan
 * verwerpt de race met een `ProbeTimeoutError` — de aanroeper (de route) vangt dat af als een
 * *gefaalde* probe (degraded / not ready), nooit als vals groen.
 *
 * NB (bewust, net als `withTaskTimeout`): JavaScript kent geen echte cancellation — een getimede-out
 * DB-call blijft in de achtergrond doorlopen tot hij zelf afrondt of het proces recyclet. Dat is
 * acceptabel: het doel is dat de *probe deterministisch antwoordt* binnen de deadline, niet dat de
 * onderliggende query gestopt wordt. De timer wordt altijd opgeruimd zodra de race beslecht is.
 *
 * `timeoutMs <= 0` schakelt de deadline bewust uit (onbeperkt wachten — oud gedrag).
 */
export async function withProbeTimeout<T>(
  name: string,
  timeoutMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  if (!(timeoutMs > 0)) {
    return fn();
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new ProbeTimeoutError(name, timeoutMs)), timeoutMs);
  });
  try {
    return await Promise.race([fn(), timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
