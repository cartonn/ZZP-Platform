# 2026-10-04 — DST-veilige weekgrenzen in de franchiser-dekkingsprognose

## Rol & waarde

Bemiddelaar (franchiser). De vooruitkijkende dekkingsprognose op `/franchise/diensten`
("Wat dreigt onbezet") en de afgeleide acute-open-diensten-next-action moeten open diensten
in de juiste week tonen. Een verkeerd ingedeelde dienst geeft een valse "deze week onderbezet"-
alarm (of onderdrukt juist terecht "alles gedekt"), precies in de week rond een zomer-/wintertijd-
overgang.

## Defect (correctheid, geen productie-incident geclaimd)

`src/lib/franchise/dekkingsprognose.ts` → `bucketFor` leidde `nextWeekStart`/`weekAfterStart` af
met een vaste `7 * DAY_MS`-sprong (168 uur) vanaf het lokale-middernacht-anker `startOfIsoWeek(now)`.
Een kalenderweek met een DST-overgang telt 167 uur (voorjaar) of 169 uur (najaar), dus de vaste
168-uurssprong landt ±1 uur naast de echte "volgende maandag 00:00 lokaal". `startOfIsoWeek` zelf
stapt om die reden al met `setDate`; `bucketFor` was de enige plek die naar milliseconde-rekenen
terugviel. Bovendien vergeleek `bucketFor` de rauwe `startDate.getTime()` met middernacht-ankers.

Zustermodule `src/lib/franchise/acute-open-diensten.ts` → `acuteWindowStart` had exact dezelfde
`+ 7 * DAY_MS`-grens, met de belofte "zelfde grens als de dekkingsprognose zodat de twee niet
driften". Beide zijn nu DST-veilig via `setDate`.

### Repro (Europe/Amsterdam)

Voorjaar 2026: overgang zo 29-03 02:00→03:00; ISO-week ma 23-03 .. zo 29-03 = 167 uur.

- `now` = wo 25-03-2026 12:00; één open dienst start ma 30-03-2026 00:00 (= volgende week).
- Oud: `startOfIsoWeek(now)` = ma 23-03 00:00 CET; `+168u` = 30-03 01:00 CEST. De dienst
  (30-03 00:00 CEST = 29-03 22:00 UTC) ligt vóór die grens → **DEZE_WEEK** (fout), telt mee in
  `needsAttentionNow`.
- Nieuw: weekgrens via `setDate(+7)` = ma 30-03 00:00 lokaal → **VOLGENDE_WEEK** (correct),
  `needsAttentionNow` niet opgeblazen.

## Fix

- `bucketFor`: weekgrenzen via `setDate` (kalenderstap), startdatum op lokale middernacht
  (`startOfLocalDay`) genormaliseerd → dag-granulair, consistent met de middernacht-ankers.
- `acuteWindowStart`: idem via `setDate`; de rauwe-instant-vergelijking in `isStartAcute` blijft
  correct tegen het middernacht-anker (bewezen pariteit met `bucketFor` over alle inputs).
- Geen gedragswijziging buiten DST-weken; bestaande niet-DST-tests ongewijzigd groen.

## Bewijs

- `dekkingsprognose.test.ts`: +3 DST-gevallen (voor-/najaar), TZ gepind via `vi.stubEnv("TZ",
"Europe/Amsterdam")` (patroon uit `expiry-task.test.ts`). Rood op de oude code (3 fout), groen na
  fix; 16 tests in het bestand groen.
- `acute-open-diensten.test.ts`: +3 DST-gevallen; voorjaars-maandagnacht faalt op de oude code,
  groen na fix; 11 tests groen.
- `npm run typecheck`, `npm run lint`, `npx prettier --check .` groen; volledige suite + build via
  de CI-poort.

Read-only afgeleid, geen mutatie, geen nieuw auth-oppervlak, geen geldstroom. Scope: tenant-cockpit
(bemiddelaar) + robuustheid — binnen de routine-scope.
