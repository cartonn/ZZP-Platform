// Pure, testbare helpers voor de afsluit-timing van de productie-orchestrator (scripts/start.mjs).
//
// Waarom apart: start.mjs is plain-JS die node rechtstreeks draait (geen bundling) en kan dus niet
// uit `@/lib` importeren. Deze .mjs-helpers zijn wél door vitest importeerbaar, zodat de klem- en
// default-logica van de afsluit-timers gedekt is met unit-tests i.p.v. in de boot-flow te leven.

/**
 * Parse een millisecond-env-waarde en klem 'm binnen [min, max]. Een ontbrekende of niet-numerieke
 * waarde valt terug op `def`. Zo kan een verkeerd geplakte env de afsluiting nooit oneindig laten
 * hangen of tot nul terugbrengen buiten de bedoelde grenzen.
 */
export function clampMs(raw, def, min, max) {
  const n = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(n)) return def;
  return Math.min(Math.max(n, min), max);
}

/**
 * Het drain-venster (ms) tussen "afsluitsignaal ontvangen" en "Next de HTTP-server laten sluiten".
 * Tijdens dit venster rapporteert /api/readiness al 503 (draining) terwijl de server nog gewoon
 * requests bedient — zo krijgt de load balancer de tijd om deze instance uit de rotatie te halen
 * vóór de socket sluit (zero-downtime redeploy).
 *
 * Default: 5000 ms in productie (waar een rolling redeploy speelt), 0 daarbuiten (geen vertraging
 * bij lokaal stoppen of in tests). Instelbaar via `SHUTDOWN_DRAIN_MS`, geklemd op [0, 60000] — ruim
 * onder de kill-grace van gangbare hosts zodat de container nooit mid-drain een SIGKILL krijgt.
 *
 * @param {Record<string, string | undefined>} [env]
 * @returns {number}
 */
export function resolveDrainMs(env = process.env) {
  const def = env.NODE_ENV === "production" ? 5000 : 0;
  return clampMs(env.SHUTDOWN_DRAIN_MS, def, 0, 60000);
}

/**
 * Het force-kill-vangnet (ms): sluit Next niet binnen dit venster ná de echte SIGTERM (een hangende
 * in-flight request), dan volgt een SIGKILL zodat de deploy nooit blijft hangen. Instelbaar via
 * `SHUTDOWN_FORCE_KILL_MS`, geklemd op [1000, 120000], default 25000.
 *
 * @param {Record<string, string | undefined>} [env]
 * @returns {number}
 */
export function resolveForceKillMs(env = process.env) {
  return clampMs(env.SHUTDOWN_FORCE_KILL_MS, 25000, 1000, 120000);
}
