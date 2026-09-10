#!/usr/bin/env node
// Gate op high/critical-kwetsbaarheden in de PRODUCTIE-dependencies (`--omit=dev`).
//
// `npm audit` is een harde afhankelijkheid van het audit-endpoint van registry.npmjs.org. Dat
// endpoint valt met enige regelmaat uit met HTTP 503 "Service Unavailable" — een storing die niets
// met deze repo te maken heeft, maar die elke PR blokkeert zolang we er blind op afgaan (de exitcode
// van `npm audit` maakt geen onderscheid tussen "endpoint onbereikbaar" en "kwetsbaarheid gevonden").
//
// Daarom onderscheiden we die twee gevallen expliciet op basis van de --json-uitvoer:
//   1. ECHTE audit → de JSON bevat `metadata.vulnerabilities`. We tellen high + critical en falen
//      zodra er één is. De kwetsbaarheids-gate blijft dus volledig intact.
//   2. ONBEREIKBAAR endpoint → de JSON bevat een `error`-object (of is onparsebaar met een
//      herkenbare netwerk-/servicefout in de uitvoer). De audit kán dan niet oordelen; we behandelen
//      de stap als niet-blokkerend met een luide waarschuwing. Backstop: de informatieve
//      volledige-audit-stap en de wekelijkse scheduled Security-run draaien opnieuw zodra het
//      endpoint terug is.
//
// We verzwakken de gate dus NIET — we maken hem alleen bestand tegen een externe service-storing.
// Een onverwachte, niet-herkende uitvoer laten we NIET stil door: die faalt (fail-safe).

import { spawnSync } from "node:child_process";

export const NETWORK_MARKERS = [
  "audit endpoint returned an error",
  "Service Unavailable",
  "503",
  "ENOTFOUND",
  "ECONNRESET",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "ECONNREFUSED",
  "socket hang up",
  "network",
];

/**
 * Pure classificatie van de `npm audit --json`-uitvoer. Geen I/O, zodat dit deterministisch te
 * testen is. Retourneert de beslissing + een leesbare reden.
 * @param {{ stdout?: string, stderr?: string }} io
 * @returns {{ decision: "block" | "clean" | "outage" | "unknown", reason: string, high?: number, critical?: number }}
 */
export function classifyAudit({ stdout = "", stderr = "" } = {}) {
  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    parsed = undefined;
  }

  const vulns = parsed && typeof parsed === "object" ? parsed.metadata?.vulnerabilities : undefined;
  if (vulns && typeof vulns === "object") {
    const high = Number(vulns.high ?? 0);
    const critical = Number(vulns.critical ?? 0);
    if (high + critical > 0) {
      return {
        decision: "block",
        high,
        critical,
        reason: `${critical} critical + ${high} high kwetsbaarheid(en) in productie-deps`,
      };
    }
    return {
      decision: "clean",
      high,
      critical,
      reason: `geen high/critical (moderate=${vulns.moderate ?? 0}, low=${vulns.low ?? 0})`,
    };
  }

  const haystack = `${stdout}\n${stderr}\n${parsed?.error ? JSON.stringify(parsed.error) : ""}`;
  const isNetworkOutage =
    parsed?.error != null || NETWORK_MARKERS.some((marker) => haystack.includes(marker));
  if (isNetworkOutage) {
    return { decision: "outage", reason: "audit-endpoint onbereikbaar (registry-storing)" };
  }

  return { decision: "unknown", reason: "geen rapport en geen herkenbare netwerkfout" };
}

function main() {
  const res = spawnSync("npm", ["audit", "--omit=dev", "--json"], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  const stdout = `${res.stdout ?? ""}`;
  const stderr = `${res.stderr ?? ""}`;
  const result = classifyAudit({ stdout, stderr });

  switch (result.decision) {
    case "block":
      console.error(`npm audit: ${result.reason} — geblokkeerd.`);
      process.exit(1);
      break;
    case "clean":
      console.log(`npm audit: ${result.reason}.`);
      process.exit(0);
      break;
    case "outage":
      console.log(
        "::warning::npm audit-endpoint onbereikbaar (registry-storing) — de productie-audit kon " +
          "niet oordelen en is daarom niet-blokkerend behandeld. De kwetsbaarheids-gate wordt NIET " +
          "omzeild: de wekelijkse scheduled Security-run en de informatieve volledige-audit-stap " +
          "draaien opnieuw zodra het endpoint terug is.",
      );
      console.log(`${stdout}\n${stderr}`.slice(0, 600));
      process.exit(0);
      break;
    default:
      console.error("npm audit gaf onverwachte uitvoer (fail-safe, geblokkeerd):");
      console.error(`exitCode=${res.status} signal=${res.signal ?? "none"}`);
      console.error(`${stdout}\n${stderr}`.slice(0, 2000));
      process.exit(1);
  }
}

// Alleen draaien als dit bestand direct is aangeroepen (niet bij import vanuit de test).
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
