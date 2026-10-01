# Koude-opdracht-signaal bereikbaar voorbij de scan-cap (#1543)

**Datum:** 2026-10-01 · **Branch:** `feat/auto-20261001-202342-25355` · **Basis:** `0b73d06b`

## Probleem

`runJobEngagementTask` (`src/lib/job-engagement-task.ts`) selecteerde koude gepubliceerde
opdrachten met één vaste cap: `SCAN_LIMIT = 200`, `orderBy publishedAt asc`, `take 200`.

De `where` is open-eindig (`status: PUBLISHED`, `publishedAt <= cutoff`) en er is geen
voortgangsmarker op `Job` voor dit signaal. De dedup gebeurt pas bij het aanmaken van het
signaal (DomainEvent `job-cold:<id>`), dus **reeds gewaarschuwde** koude opdrachten blijven de
oudste-200-`publishedAt`-plekken bezetten. Bij meer dan 200 permanent koude opdrachten krijgen
nieuwere koude opdrachten voorbij die 200 **nooit** hun eerste "koude opdracht"-waarschuwing —
permanent gemist, niet alleen vertraagd. Zelfde klasse als de reachability-reeks op de
reminder-runners (#1529–#1534, #1542).

## Fix

De enkele capped `take` is vervangen door een cursor-paginatielus met een stabiele id-cursor
(`orderBy id asc`, `take SCAN_BATCH_SIZE = 200`, `id > afterId`) die door álle matchende rijen
loopt. Plan/dedup/apply gebeuren per pagina; `alerted` en het aantal gescande opdrachten worden
geaccumuleerd. Resultaatvorm `{ alerted, jobs }` ongewijzigd (`jobs` = totaal gescand over alle
pagina's). Geen schema- of gedragswijziging aan welke opdracht koud is, aan de idempotentie of aan
de signaalinhoud.

## Bewijs

- Nieuwe grensproef `src/lib/job-engagement-window.test.ts` (echte SQLite): een verse koude
  opdracht achter 199/200/401 reeds gewaarschuwde koude opdrachten wordt bereikt; herhaalde run
  is idempotent (`{ alerted: 1, jobs: count + 1 }` → `{ alerted: 0, jobs: count + 1 }`). Onder de
  oude vaste cap faalt dit bij 200 en 401.
- Bestaande mock-tests `job-engagement-task.test.ts` en planner `job-engagement.test.ts`
  ongewijzigd groen (loop breekt na één pagina bij minder dan de batchgrootte).
- Volledige lokale poort: lint, typecheck, volledige unit-suite en productiebuild groen;
  prettier toegepast. Onafhankelijke review en CI-poort volgen.
