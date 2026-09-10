// Single-flight coalescing voor de gezondheids-probes (/api/health liveness, /api/readiness readiness).
//
// PROBLEEM (CWE-400, amplificatie): beide probes zijn publiek + ongeauthenticeerd (route-guards laat ze
// bewust ongeauth door zodat de load balancer/orchestrator ze zonder sessie kan pollen) en doen elk een
// echte DB-round-trip (`SELECT 1` + kerntabel-`count()`). Zonder coalescing start ÉLKE gelijktijdige
// request een eigen query; een ongeauthenticeerde burst vermenigvuldigt zo N requests naar N checkouts
// uit de bewust-begrensde Prisma-pool (`DATABASE_CONNECTION_LIMIT`, zie `src/lib/db-connection.ts`) en
// kan die uitputten → connection-timeouts voor de HÉLE app (login, documentdownload, verificatiequeue) —
// een self-inflicted DoS, volledig pre-auth. Precies de pool-uitputting die `probe-timeout.ts` al als
// hang-risico noemt, maar dan als amplificatie.
//
// OPLOSSING: single-flight. Gelijktijdige aanroepers met dezelfde sleutel DELEN één in-flight probe; pas
// als die is beslecht start de eerstvolgende aanroeper een verse. De probe kost zo hoogstens één
// DB-query per probe-duur per endpoint, ongeacht de burst-grootte — de amplificatie verdwijnt. BEWUST
// géén per-IP rate-limit: een 429 op de gezondheids-probe zou de orchestrator een gezonde instance laten
// killen (readiness-flap) — precies de outage die we voorkomen.
//
// BEWUST géén caching van de UITKOMST: een request die ná het beslechten binnenkomt krijgt een verse
// probe, zodat readiness/health nooit ouder is dan één probe-duur (≤ HEALTH_PROBE_TIMEOUT_MS) en een
// herstel/degradatie meteen zichtbaar wordt. Fail-closed blijft fail-closed. Puur en deterministisch
// testbaar: geen Next/Prisma/HTTP-afhankelijkheden, alleen een module-lokale in-flight-map.

const inFlight = new Map<string, Promise<unknown>>();

/**
 * Voert `fn` uit onder single-flight: bestaat er al een in-flight aanroep voor `key`, dan wordt die
 * gedeelde promise teruggegeven (fn wordt NIET opnieuw aangeroepen); anders start een verse aanroep die
 * bij settelen (succes én fout) de sleutel weer vrijgeeft, zodat de volgende aanroeper een actuele probe
 * krijgt. `fn` mag synchroon werpen (wordt tot een rejectie genormaliseerd) zonder de map te lekken.
 */
export function coalesceProbe<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  // fn synchroon aanroepen zodat de in-flight-registratie klopt vóór een volgende (gelijktijdige)
  // aanroeper de map leest; een synchrone worp wordt tot een rejectie genormaliseerd zonder de map te
  // vullen (geen lek).
  let started: Promise<T>;
  try {
    started = fn();
  } catch (err) {
    return Promise.reject(err);
  }

  const tracked = started.finally(() => {
    inFlight.delete(key);
  });
  inFlight.set(key, tracked);
  return tracked;
}

/** Alleen voor tests: leegt de in-flight-map zodat cases onafhankelijk beginnen. */
export function __resetProbeCoalesceForTests(): void {
  inFlight.clear();
}
