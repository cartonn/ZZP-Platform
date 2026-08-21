// Verharding voor de Prometheus-scrape (/api/metrics). Die route vuurt op dit moment ~18 losse
// DB-COUNT-queries strikt *sequentieel* af, zónder deadline. Twee problemen:
//
//   1. Sequentieel is traag én dubbelzinnig: bij een trage DB stapelt de scrape-latency lineair op,
//      en de scraper (Prometheus/Grafana Agent) kan "traag" niet van "vastgelopen" onderscheiden.
//   2. Volledig parallel is óók fout: 18 gelijktijdige queries kunnen de Prisma-connection-pool
//      monopoliseren en zo de échte requests (gebruikersverkeer) verdringen — een scrape mag nooit
//      het platform degraderen.
//
// Deze module levert de pure bouwstenen om daar een *begrensde* concurrency-runner met deadline
// tussen te zetten. PUUR en deterministisch testbaar: geen Next/Prisma/HTTP-afhankelijkheden.

import { resolveProbeTimeoutMs } from "./probe-timeout";

export const MIN_METRICS_COLLECT_CONCURRENCY = 1;
export const MAX_METRICS_COLLECT_CONCURRENCY = 32;
export const DEFAULT_METRICS_COLLECT_CONCURRENCY = 4;

/**
 * Leest de gewenste concurrency (aantal gelijktijdige COUNT-queries) uit een ruwe env-waarde en klemt
 * hem op [MIN, MAX]. Anders dan de time-out kent concurrency **geen uit-stand**: een scrape moet
 * altijd minstens één query in de lucht hebben, dus het resultaat is altijd ≥ 1. Een lege,
 * niet-numerieke, nul of negatieve waarde valt terug op de (zelf geklemde) `fallback`. Puur/testbaar.
 */
export function resolveMetricsConcurrency(
  raw: string | undefined,
  fallback: number = DEFAULT_METRICS_COLLECT_CONCURRENCY,
): number {
  const clamp = (n: number) =>
    Math.min(
      MAX_METRICS_COLLECT_CONCURRENCY,
      Math.max(MIN_METRICS_COLLECT_CONCURRENCY, Math.round(n)),
    );
  if (raw !== undefined) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) return clamp(parsed);
  }
  const parsedFallback =
    Number.isFinite(fallback) && fallback > 0 ? fallback : DEFAULT_METRICS_COLLECT_CONCURRENCY;
  return clamp(parsedFallback);
}

export const DEFAULT_METRICS_COLLECT_TIMEOUT_MS = 5_000;

/**
 * Leest de harde deadline (ms) voor de gehele scrape-collectie uit een ruwe env-waarde. We hergebruiken
 * bewust de klem-range [250, 30000] én de escape-hatch van `resolveProbeTimeoutMs` — een expliciete
 * `0`/`off`/`none`/`false` schakelt de deadline uit (onbeperkt wachten). Zo blijft de deadline-semantiek
 * identiek aan die van de gezondheids-probes; alleen de default ligt hoger (een scrape doet meer werk).
 */
export function resolveMetricsTimeoutMs(
  raw: string | undefined,
  fallback: number = DEFAULT_METRICS_COLLECT_TIMEOUT_MS,
): number {
  return resolveProbeTimeoutMs(raw, fallback);
}

/**
 * Draait `fn` over `items` met **hooguit `limit` tegelijk** in de lucht. Waarom begrensd: een
 * metrics-scrape mag de Prisma-connection-pool niet monopoliseren en zo echt gebruikersverkeer
 * verdringen; tegelijk is puur-sequentieel onnodig traag. Deze index-cursor worker-pool zit daar
 * precies tussenin — geen externe afhankelijkheid (geen p-limit).
 *
 * Belangrijk: de resultaten worden in **invoervolgorde** teruggegeven (result[i] hoort bij items[i]),
 * ongeacht in welke volgorde de individuele promises afronden. `limit` wordt naar minimaal 1 gecoerced.
 * Lege invoer levert `[]`. Verwerpt `fn` voor een item, dan verwerpt de hele aanroep (propagatie) —
 * aanroepers die niet mógen verwerpen geven een niet-gooiende `fn`. Deterministisch bij deterministische `fn`.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  if (items.length === 0) return results;

  const workers = Math.min(Math.max(1, Math.floor(limit)), items.length);
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor++;
      // `index < items.length` (de while-conditie), dus de indexering is veilig; de non-null-assertie
      // stilt alleen `noUncheckedIndexedAccess` (items[index] is daaronder `T | undefined`).
      results[index] = await fn(items[index]!, index);
    }
  }

  await Promise.all(Array.from({ length: workers }, () => worker()));
  return results;
}
