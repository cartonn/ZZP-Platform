# Gerichte vervolgfix na onafhankelijke BLOCK (2026-10-07)

De eerste reparatie hieronder maakte drie high-signalen via Prisma zichtbaar.
Na de onafhankelijke BLOCK is alleen @prisma/config → deepmerge-ts exact 8.0.2
overridden; Prisma zelf blijft 6.19.3. Dit onderdrukt geen advisory of auditpoort.
De schone installatie bevat uitsluitend deepmerge-ts 8.0.2; productie-audit geeft
0 high/critical/moderate + 1 low en de ongewijzigde auditpoort slaagt. Volledige
audit: 10 high + 3 moderate + 1 low; dus geen algemene cleanclaim.

## Compatibiliteitsgrond

Lokaal @prisma/config/dist/index.js importeert uitsluitend deepmerge en geeft die
als merger aan c12; prisma.config.ts bevat gewone schema-/migratieopties.
De upstream [Prisma-wijziging #30189](https://github.com/prisma/prisma/pull/30189)
voert dezelfde 7.1.5 → 8.0.2-overgang voor de config-package uit en rapporteert
142 geslaagde tests. De [v8-changelog](https://github.com/RebeccaStevens/deepmerge-ts/blob/v8.0.2/CHANGELOG.md)
noemt wijzigingen in Into-mutatie, type-API's en botsende Map-waarden; deze callsite
gebruikt die niet. Node >=16.9.0 is ondersteund, inclusief onze Node 22.
De lokale Prisma-/runtimeproeven blijven nodig naast dit upstream-bewijs.

## Hernieuwde lokale validatie

- Schone npm ci met de Next 15.5.24-patch daadwerkelijk toegepast; npm ls bevestigt
  exact deepmerge-ts 8.0.2 onder de gerichte override.
- Auditpoort groen op zowel volledige installatie als werkelijk geprunde kopie.
  De resterende low is esbuild; raw npm audit eindigt daarom nog met exit 1, terwijl
  de ongewijzigde high/critical-poort terecht slaagt.
- Hernieuwde lint/typecheck/formatting en productiebuild geslaagd. De volledige
  suite geeft 874 geslaagde bestanden + 2 bestaande skips, 9.244 geslaagde tests
  - 3 bestaande skips.
- Na prune zijn patch-package/braces/micromatch/find-yarn-workspace-root/Tailwind/
  Vitest/ESLint afwezig; Prisma/dotenv/tsx/client aanwezig. De productiepatch blijft
  intact, native Sharp produceert een PNG en deepmerge 8 combineert gewone
  migratieconfiguratie zonder verlies.
- Geprunde Prisma validate en generate slagen; db push maakt een nieuwe lokale
  SQLite-database en npx prisma db seed vult alleen referentiedata. Preflight laadt
  met synthetische productie-instellingen (verwachte attention, exit 0). Geen
  appserver of externe integratie gestart.
- Docker-context verwijst naar ontbrekende /var/run/docker.sock; Colima is niet
  actief. Geen VM/daemon of onbekende dienst gestart. De bestaande CI-jobs
  migrations en e2e-postgres gebruiken disposable Postgres 16, maar bouwen niet
  het Dockerfile en bewijzen de uiteindelijke image niet. De lokale diff is nog
  niet gepusht; bestaande CI kan haar dus nog niet valideren. Linux-imagebuild en
  Docker/Postgres-boot blijven expliciet onbewezen.

---

## Historie eerste reparatie (vervolgstatus hierboven is leidend)

# Vervolg #1570: werkelijke runtimeboom (2026-10-06)

De oorspronkelijke rapportage hieronder blijft als historie bewaard, maar haar
conclusie dat de productiepoort veilig gedeblokkeerd was, is vervallen. De oude
Dockerfile kopieerde alle node_modules en voerde postinstall uit voordat patches/
aanwezig was. Alleen patch-package als dev markeren verwijderde zijn kwetsbare
braces-keten dus niet uit de image.

De reparatie start op origin/main `0b73d06be371a7a45a4b7fed712bc1fb0222ef01` en
behoudt de volledige bestaande #1570-head
`ae7cba60c4748070e3345c1bd0ed3adb9ac76f37` via fast-forward. Geen nieuwe PR of
remote-mutatie uitgevoerd.

- Bestaande source-map-js 1.2.2 behouden; sharp 0.35.4 → 0.35.5 (bijbehorende
  native modules/libvips mee bijgewerkt), zonder overige versie-updates.
- patches/ vóór de schone lockfile-installatie gekopieerd; dev-gereedschap is
  beschikbaar tijdens postinstall en build. Patchfouten stoppen de installatie
  expliciet via --error-on-fail.
- Na de build verwijdert npm prune --omit=dev --ignore-scripts daadwerkelijk
  ontwikkelgereedschap. Geen lifecycle-herinstallatie die de Next-patch overschrijft.
- prisma, dotenv en tsx zijn runtime-afhankelijkheden: start.mjs gebruikt preflight,
  Prisma-migraties en db seed; prisma.config.ts laadt dotenv en start tsx. Deze
  worden dus niet blind verwijderd.

## Open blokkade en beperkingen

De productie-audit bevat nu 3 high + 1 low, volledige audit 13 high + 3 moderate +
1 low. De drie high-signalen zijn prisma → @prisma/config → deepmerge-ts <8.0.0,
[GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx).
Een Prisma-downgrade of deepmerge-ts-majoroverride is niet blind doorgevoerd.
De verplichte auditpoort blijft intact en moet deze echte runtimeboom blokkeren.
De advisory bewijst geen bereikbare onbetrouwbare config-invoer in deze app.

Docker CLI is aanwezig, maar de daemon/socket ontbreekt. Geen Linux-imagebuild,
PostgreSQL-boot, browser-e2e, remote CI of release geverifieerd. Lokale controles
gebruiken uitsluitend synthetische instellingen en geïsoleerde SQLite-data.

## Validatie reparatie

- Schone npm ci slaagt; bestaande Next 15.5.24-patch daadwerkelijk toegepast.
- Lint, typecheck en repositoryformatting groen; 874 testbestanden geslaagd,
  2 bestaande skips; 9.244 tests geslaagd en 3 bestaande skips. Productiebuild groen
  (bestaande jose Edge Runtime-waarschuwingen blijven zichtbaar).
- In een afzonderlijke kopie na dezelfde prune ontbreken patch-package, braces,
  micromatch, find-yarn-workspace-root, tailwindcss, vitest en eslint daadwerkelijk.
  Prisma/dotenv/tsx/client blijven aanwezig; de Next-productiepatch blijft intact;
  sharp genereert een PNG uit synthetische pixels.
- Geprunde runtime laadt productie-preflight (verwachte attention, exit 0 bij
  synthetische configuratie), Prisma-config en schema; een nieuw lokaal SQLite-bestand
  wordt aangemaakt en de referentiedata-seed via npm slaagt zonder demo-gegevens.
  Een eerste directe .bin/prisma-aanroep miste de npm-PATH voor tsx; de echte npm/npx-
  aanroepomgeving is vervolgens geverifieerd. Geen server of externe dienst gestart.
- Audit van de geprunde runtime bevestigt 3 high + 1 low. De ongewijzigde
  scripts/audit-production.mjs blokkeert met exit 1.

---

## Historische oorspronkelijke rapportage (vervangen door bovenstaande)

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
