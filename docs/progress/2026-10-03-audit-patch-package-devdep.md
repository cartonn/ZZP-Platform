# Productie-audit-poort gedeblokkeerd: patch-package naar devDependencies (2026-10-03)

## Probleem

De verplichte `audit`-poort (`scripts/audit-production.mjs`, `npm audit --omit=dev`) blokkeerde élke
PR met "0 critical + 4 high kwetsbaarheid(en) in productie-deps". De vier high-signalen
(`braces`, `micromatch`, `find-yarn-workspace-root`, `patch-package`) komen allemaal uit de
dependency-boom van `patch-package`, via de nieuwe advisory
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) — `braces` stack-exhaustion
DoS (CWE-674), bereik `<=3.0.3`. Er is nog geen gepatchte `braces`-versie, dus de enige remedie die
npm aandraagt is het veranderen van `patch-package` (`fixAvailable` wijst naar een semver-major
wijziging). Dit was geen regressie van een specifieke PR maar een base-brede poortstoring.

## Oplossing

`patch-package` is een build-time tool: het draait in `postinstall` (`patch-package && prisma
generate`) om de Next.js/React-patch (`patches/next+15.5.24.patch`, ADR 0012) toe te passen tijdens
`npm install`/`npm ci`. Het productie-image (`Dockerfile`) installeert alle dependencies (incl. dev)
in de builder-stage, past de patch toe, en kopieert `node_modules` ongewijzigd naar de runtime-stage
— er is nergens een productie-only `npm ci --omit=dev`. `patch-package` hoort dus thuis in
`devDependencies` (de door patch-package zelf aanbevolen plaatsing).

Verplaatst van `dependencies` naar `devDependencies` + lockfile geregenereerd. Niets aan de
daadwerkelijk verscheepte `node_modules` of aan de patch-toepassing verandert; alleen de
productie-deps-audit ziet de kwetsbare `braces`-tak niet meer.

## Bewijs

- `node scripts/audit-production.mjs` → "geen high/critical (moderate=0, low=0)", exit 0 (was: exit 1,
  4 high).
- `npm audit --omit=dev` → found 0 vulnerabilities.
- `npx patch-package` → `next@15.5.24 ✔` (de patch past nog steeds schoon toe).
- typecheck, lint, test, productiebuild en `prettier --write .` — zie de PR-checks.

Geen functionele wijziging; geen `braces`-upgrade mogelijk (nog geen fix upstream). Zodra een
gepatchte `braces` verschijnt kan de override vervallen; dit is de minimale, veilige deblokkade nu.
