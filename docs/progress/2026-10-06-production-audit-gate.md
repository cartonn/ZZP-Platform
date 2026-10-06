# 6 oktober 2026 — productie-audit-poort hersteld + hygiëne-regressietest

Basis: `origin/main` @ `0b73d06b`.

## Bevinding (OWASP A06 — Vulnerable and Outdated Components)

De harde merge-poort `audit` (`node scripts/audit-production.mjs`, oftewel
`npm audit --omit=dev` met blokkade op elke high/critical) was **rood op een verse main** —
vijf high-kwetsbaarheden in de productie-dependency-tree. Daarmee was élke merge naar `main`
geblokkeerd, inclusief deze audit-PR zelf. De advisories waren pas na de laatste merge in de
npm-feed gepubliceerd, dus een eerder groene gate werd stil rood.

De vijf high splitsen in twee oorzaken:

1. **`patch-package` stond in `dependencies`** i.p.v. `devDependencies`. Het is een puur
   build-/install-tijd tool (draait in `postinstall` en past `patches/next+15.5.24.patch` toe),
   maar als productie-dependency sleepte het zijn kwetsbare keten
   `find-yarn-workspace-root → micromatch → braces` (ReDoS/stack-exhaustion DoS) de
   `--omit=dev`-audit in — vier van de vijf high.
2. **`source-map-js@1.2.1`** kwam via `next → postcss` binnen (event-loop DoS via indexed
   source-map section offsets, GHSA-68fv-2mgg-jv7q) — de vijfde high.

## Fix

- `patch-package` verplaatst naar `devDependencies`. De `postinstall` (en dus de next-patch)
  blijft draaien: zowel CI als de Docker-builder doen een volledige `npm install`, en de
  builder kopieert de volledige `node_modules` naar de runtime-stage — niets in productie heeft
  `patch-package` zelf nodig. Geverifieerd: `npx patch-package` → `next@15.5.24 ✔`.
- Override `"source-map-js": "^1.2.2"` toegevoegd (1.2.2 dicht het advies; voldoet aan
  postcss' `^1.x`). Geverifieerd: prod-tree resolve `source-map-js@1.2.2 overridden`.
- Lockfile opnieuw gegenereerd.

Na de fix: `npm audit --omit=dev` → **0 vulnerabilities**; `node scripts/audit-production.mjs`
→ exit 0 ("geen high/critical").

## Regressietest (rood → groen)

`src/lib/security/production-dependency-hygiene.test.ts` (3 asserties):

- `patch-package` NIET in `dependencies` (vóór fix rood: stond er als `^8.0.1`);
- `patch-package` WÉL in `devDependencies` (vóór fix rood: afwezig);
- `source-map-js`-override ≥ 1.2.2 (vóór fix rood: override afwezig).

Alle drie groen na de fix. De test faalt zodra één van beide samenstellingsfouten terugglipt —
een regressie die een groene lokale run makkelijk mist omdat `npm audit` pas rood wordt wanneer
het advies in de feed staat.

## Grenzen

Geen codepad-wijziging; alleen dependency-samenstelling. De `source-map-js`/braces-DoS'en zijn
build-tijd-/toolketen-kwetsbaarheden zonder bereikbaar runtime-pad met gebruikersinvoer op dit
platform, maar de poort telt ze (terecht) als high en moest groen. De vier parallelle
audit-sweeps van deze ronde (server-action-authz, cross-tenant-isolatie, API/SSRF/injectie/
upload, privacy/PII/erasure/k-anonimiteit) vonden geen nieuw bereikbaar gat; losse LAAG-
ontwerpobservaties staan in de backlog.
