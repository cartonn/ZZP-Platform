# Opdracht-DBA-risico volgt de ingestelde drempels — 2 oktober 2026

Draft #1547, geclaimd vóór implementatie op basis van een aantoonbaar verschil tussen de
opgeslagen beheerdersdrempels (`getDbaThresholds()`) en de vaste 6/12-maandsgrenzen die de
opdracht-DBA-vragenlijst hanteerde.

## Bron en waarom

De beheerder kan de DBA-duurdrempels instellen (`platformConfig` → `getDbaThresholds()`), en
de serie #1535/#1537/#1538/#1539 liet de volledige live-samenwerkingspijplijn die drempels
volgen (monitor, overzicht, detail, lijst, filter, dossier-export). Eén oppervlak bleef achter:
`assessDbaRisk` in `src/lib/dba.ts` — de opdracht-vragenlijst-scorer — vergeleek de verwachte
duur nog tegen hardgecodeerde 6/12-maandsgrenzen. Die score wordt als `job.dbaRisk`-snapshot
opgeslagen en daarna getoond op opdrachtdetail, het compliance-blok, het compliance-dossier, het
inzetvorm-signaal en franchise-dienstdetail. Een beheerder die de drempels bijstelt (bv. 3/9)
zag die wijziging dus overal in de samenwerkingspijplijn, maar niet op het opdracht-oppervlak.

## Wat is gebouwd

- `src/lib/dba.ts` — `assessDbaRisk(input, thresholds?)` en `dbaMitigations(input, thresholds?)`
  accepteren optionele drempels; zonder meegegeven drempels blijft de statische `DBA_THRESHOLDS`
  (volledig backward-compatible). De `>`-vergelijking en de score-/niveau-grenzen blijven gelijk;
  alleen de duurgrenzen en de reden-teksten volgen nu de ingestelde waarden.
- `src/lib/model-agreement.ts` — `recommendModelAgreement(input, thresholds?)` reikt de drempels
  door naar de onderliggende inschatting.
- `src/app/(protected)/opdrachten/actions.ts` — de serverautoriteit die `job.dbaRisk` vastlegt
  leest nu eenmaal `getDbaThresholds()` en voedt die aan de scorer.
- `src/app/(protected)/opdrachten/[id]/page.tsx` — de detailweergave herberekent mitigatie en
  modelovereenkomst-aanbeveling met dezelfde ingestelde drempels (alleen voor de eigenaar geladen).
- `src/app/(protected)/opdrachten/job-form.tsx` — de live preview krijgt een `dbaThresholds`-prop
  zodat het formulier dezelfde grenzen toont als de server bij opslag gebruikt; `nieuw/page.tsx`
  en `[id]/bewerken/page.tsx` laden de drempels en geven ze door.

Het type `DbaThresholds` wordt uitsluitend type-only geïmporteerd in de clientcode (erased in de
bundel); `DBA_THRESHOLDS` komt uit de client-veilige `config.ts`.

## Buiten scope (gedocumenteerde follow-up)

De collaboration-modelovereenkomst-aanbeveling (`samenwerkingen/[id]/page.tsx`,
`api/samenwerkingen/[id]/modelovereenkomst/route.ts`, `signing-service.ts`) houdt bewust de
veilige standaard; dat is een apart oppervlak en een volgende kleine increment.

## Bewijs en controles

Gerichte unit-tests uitgebreid: `src/lib/dba.test.ts` (ingestelde drempels sturen de duur-score,
aantoonbaar verschil t.o.v. de standaard, reden-tekst noemt de ingestelde grens, standaard blijft
6/12, `dbaMitigations` reikt de drempels door) en `src/lib/model-agreement.test.ts` (duur-gedreven
aanbeveling volgt de ingestelde drempels). Beide bestanden groen (33 tests). De opdracht-actie-,
invalid-jobstatus- en saved-search-tests blijven groen (25 tests).

Volledige `lint` / `typecheck` / `test` / `build` en `prettier --write .` vervolgens groen; de
GitHub-poort (6 checks incl. onafhankelijke review) is de bindende merge-blokkade en wordt
afzonderlijk geverifieerd.
