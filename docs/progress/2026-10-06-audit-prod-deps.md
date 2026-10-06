# Productie-audit-poort gedeblokkeerd: patch-package → devDeps + source-map-js (2026-10-06)

## Probleem

De verplichte `audit`-poort (`scripts/audit-production.mjs`, `npm audit --omit=dev`)
blokkeerde élke PR base-breed met "0 critical + 5 high kwetsbaarheid(en) in
productie-deps". Geen regressie van een specifieke PR maar een base-brede
poortstoring door nieuw bekendgemaakte advisories (op #1568, 5 okt, was de poort nog
groen). De vijf high-signalen:

1–4. `patch-package` → `find-yarn-workspace-root` → `micromatch` → `braces`
([GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), `braces`
stack-exhaustion DoS, CWE-674, `<=3.0.3`, nog geen upstream fix). 5. `source-map-js@1.2.1` ([GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q),
event-loop DoS via index-offsets, bereik `1.0.0 - 1.2.1`). Via `next → postcss →
source-map-js`. Fix is de niet-majeure bump naar `1.2.2`.

## Oplossing

- **`patch-package` naar `devDependencies`.** Het is een build-time tool: het draait
  in `postinstall` (`patch-package && prisma generate`) om de Next/React-patch
  (`patches/next+15.5.24.patch`, ADR 0012) toe te passen. Het productie-image
  (`Dockerfile`) installeert álle deps in de builder-stage, past de patch toe en
  kopieert `node_modules` ongewijzigd — er is nergens een productie-only
  `npm ci --omit=dev`. De verscheepte modules en de patch-toepassing veranderen niet;
  alleen de productie-deps-audit ziet de `braces`-tak niet meer. (Deze stap spiegelt
  de analyse van #1553; die PR dekt deze vier, maar niet de nieuwe vijfde advisory.)
- **`source-map-js` override naar `^1.2.2`** in `overrides`, naast de bestaande
  `postcss`/`sharp`/`nanoid`-overrides. Forceert de gepatchte versie in de hele boom.

## Bewijs

- `node scripts/audit-production.mjs` → "geen high/critical (moderate=0, low=0)",
  exit 0 (was: exit 1, 5 high).
- `npm audit --omit=dev` → found 0 vulnerabilities.
- `npx patch-package` → `next@15.5.24 ✔` (patch past nog schoon toe).
- `source-map-js` geïnstalleerd op `1.2.2`; `patch-package` in devDeps, niet in deps.
- `npm run build` groen; `prettier --check` groen.

Geen functionele wijziging. Zodra een gepatchte `braces` upstream verschijnt kan de
patch-package-verplaatsing desgewenst heroverwogen worden; dit is de minimale,
veilige deblokkade nu.
