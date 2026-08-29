// Drift-gate-helpers voor de monitoring drop-in bundle in docs/observability/.
//
// De bundle bestaat uit drie samenhangende bestanden die een operator ongewijzigd kan inladen:
//   - alerts.yml         — Prometheus alerting-rules (vertaalt /api/metrics-gauges → alerts).
//   - prometheus.yml     — scrape-config (metrics_path + bearer-auth) die alerts.yml via rule_files laadt.
//   - alertmanager.yml   — routing-skelet + inhibit_rules die de operationele alerts dempen zodra
//                          ZzpMaintenanceModeOn vuurt (bewust onderhoud → geen valse paging).
//
// Zonder een poort zou die samenhang stil kunnen driften:
//   (a) een inhibit_rule die naar een hernoemde/verwijderde alert verwijst dempt NOOIT meer iets
//       (stille alert-storm tijdens onderhoud — precies de faalmodus die de bundle wil voorkomen);
//   (b) een NIEUW toegevoegde alert in alerts.yml die niet aan de onderhouds-inhibitie wordt
//       toegevoegd, paget on-call alsnog tijdens een geplande deploy;
//   (c) een scrape-config die niet meer naar /api/metrics wijst of alerts.yml niet laadt, is dood.
//
// Deze module is PUUR (geen fs/net/yaml): tekst in, afgeleide namen/waarden uit. De test
// (`monitoring-bundle.test.ts`) leest de bestanden, parseert de YAML-structuur en klinkt de drie aan
// elkaar vast met de helpers hieronder. Zo blijft de bundle als geheel eerlijk.

/** De info/inhibitie-alert zelf: bron van de onderhouds-inhibitie, nooit een target ervan. */
export const MAINTENANCE_ALERT = "ZzpMaintenanceModeOn";

/** Het canonieke scrape-pad van het machine-leesbare monitoring-endpoint. */
export const METRICS_PATH = "/api/metrics";

/**
 * Alle alert-namen die in een Prometheus-regelbestand (alerts.yml) worden gedefinieerd. Bewust een
 * simpele scan op `alert:`-sleutels (geen YAML-parser nodig): dat is precies waar Prometheus een alert
 * declareert. Duplicaten worden ontdubbeld.
 */
export function definedAlertNames(rulesText: string): Set<string> {
  const names = new Set<string>();
  for (const match of rulesText.matchAll(/^\s*-?\s*alert:\s*([A-Za-z][A-Za-z0-9_]*)/gm)) {
    if (match[1]) names.add(match[1]);
  }
  return names;
}

/**
 * Alle `Zzp*`-alertnamen waarnaar een stuk tekst verwijst (bv. de matchers in alertmanager.yml). Net
 * als de metrics-drift-gate een bewuste token-scan: elke gerefereerde alertnaam — in een matcher, een
 * comment of een annotatie — moet een echt gedefinieerde alert zijn. Duplicaten worden ontdubbeld.
 */
export function referencedAlertNames(text: string): Set<string> {
  return new Set(text.match(/Zzp[A-Za-z0-9_]+/g) ?? []);
}

/**
 * Leest `metrics_path` uit een Prometheus scrape-config (rauwe tekst). Retourneert de eerste waarde of
 * null als 'ie ontbreekt. Quotes worden gestript. Voldoende voor de drift-gate; geen volledige
 * YAML-semantiek nodig (de test valideert de structuur apart via een echte parser).
 */
export function extractMetricsPath(prometheusText: string): string | null {
  const match = prometheusText.match(/^\s*metrics_path:\s*["']?([^"'\s#]+)["']?/m);
  return match?.[1] ?? null;
}

/**
 * Bepaalt of een Prometheus-config het regelbestand `fileName` (bv. "alerts.yml") via `rule_files`
 * laadt. Puur en tolerant: we eisen dat de bestandsnaam ná een `rule_files`-sleutel ergens voorkomt,
 * zodat een losse vermelding in een comment niet meetelt. Retourneert false als `rule_files` ontbreekt.
 */
export function loadsRuleFile(prometheusText: string, fileName: string): boolean {
  const idx = prometheusText.search(/^\s*rule_files:/m);
  if (idx === -1) return false;
  return prometheusText.slice(idx).includes(fileName);
}

/**
 * Eén knoop in de Alertmanager `route`-boom. We modelleren alleen wat de drift-gate nodig heeft: de
 * receiver van deze knoop, de matchers waarop 'ie routeert, en de geneste subroutes.
 */
export interface AlertmanagerRoute {
  receiver?: string;
  matchers?: string[];
  routes?: AlertmanagerRoute[];
}

/**
 * Verzamelt ELKE receiver-naam die ergens in de route-boom wordt gerefereerd — de top-level receiver
 * én die van elke (diep geneste) subroute. Puur: een geparste route-knoop in, een set namen uit.
 *
 * Alertmanager WEIGERT de héle config te laden als één (ook diep geneste) subroute naar een receiver
 * verwijst die niet in `receivers` staat → een dode alerting-pijplijn, geen enkele alert routeert nog
 * ergens heen. De bestaande gate dekte alleen de top-level `route.receiver`.
 */
export function collectRouteReceivers(route: AlertmanagerRoute | undefined): Set<string> {
  const names = new Set<string>();
  const stack: AlertmanagerRoute[] = route ? [route] : [];
  while (stack.length > 0) {
    const node = stack.pop() as AlertmanagerRoute;
    if (typeof node.receiver === "string" && node.receiver.length > 0) {
      names.add(node.receiver);
    }
    for (const child of node.routes ?? []) stack.push(child);
  }
  return names;
}

/**
 * Verzamelt de `severity`-labelwaarden die `alerts.yml` daadwerkelijk aan alerts hangt.
 * Gedeeld met de routing-gate zodat een subroute die op een severity matcht die GEEN enkele
 * alert draagt (een typo) opvalt.
 */
export function definedSeverities(rulesText: string): Set<string> {
  const severities = new Set<string>();
  for (const match of rulesText.matchAll(/^\s*severity:\s*["']?([A-Za-z][A-Za-z0-9_]*)["']?/gm)) {
    if (match[1]) severities.add(match[1]);
  }
  return severities;
}

/**
 * Verzamelt de `severity`-waarden waarvoor de route-boom een eigen (matcher-)route heeft.
 * Puur: geparste route-boom in, set severity-waarden uit.
 */
export function routedSeverities(route: AlertmanagerRoute | undefined): Set<string> {
  const severities = new Set<string>();
  const stack: AlertmanagerRoute[] = route ? [route] : [];
  while (stack.length > 0) {
    const node = stack.pop() as AlertmanagerRoute;
    for (const matcher of node.matchers ?? []) {
      const match = matcher.match(/severity\s*=~?\s*["']?([^"'\s]+)["']?/);
      if (match?.[1]) {
        for (const value of match[1].split("|")) {
          const trimmed = value.trim();
          if (trimmed) severities.add(trimmed);
        }
      }
    }
    for (const child of node.routes ?? []) stack.push(child);
  }
  return severities;
}
