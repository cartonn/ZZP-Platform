# Ingestelde DBA-drempels in het beheeroverzicht — 30 september 2026

Draft #1539, vooraf geclaimd op basis van een bewezen verschil tussen opgeslagen
3/9-maandsgrenzen en vaste 6/12-grenzen in filter en badge. De echte SQLite-proef
plaatste een verhoogde samenwerking in LAAG en toonde geen verhoogde badge.

Het paneel leest eenmaal `getDbaThresholds()` binnen de bestaande geautoriseerde
adminroute. Dezelfde snapshot gaat naar SQL en rijbeoordeling. De query behoudt
standaardwaarden voor bestaande directe aanroepers. Kalendergrenzen, zoekescaping,
statussen, vlaggen, paginering en kindtellingen blijven behouden; geen omzet-
of statusbeleidswijziging.

## Bewijs en controles

Zes blijvende panelregressies faalden vóór de productieaanpassing; vijf bestaande
SQLite-tests slaagden. Na herstel slaagden vijftien gevallen. De uitgebreide suite
voegt ook een configuratiegestuurde telling en paginering over 500 rijen toe.
De grensmatrix gebruikt ontbrekende configuratie, 3/9, 9/18, 6/6 en legacy 12/3,
met maandultimo, schrikkeldag, toekomstige/null-datum en alle bestaande baanvlaggen.
De panelgevallen controleren dat configuratie precies eenmaal gelezen wordt.

Lint, typecheck, repositoryformat en de volledige suite slagen: 874 testbestanden
groen, 2 overgeslagen; 9.244 tests groen en 3 bestaande skips. De definitieve
gerichte suite telt 16 tests. Productiebuild geslaagd; bestaande jose-waarschuwingen
over de Edge-runtime blijven zichtbaar. PostgreSQL en
browsertests blijven CI-verificatie; onafhankelijke review, merge en deploy zijn
nog niet vastgesteld. Bewijsbestanden bij de coördinator: `builder-1539-red.log`,
`builder-1539-focused.log`, `builder-1539-check.log` en `builder-1539-format.log`.

## Oorspronkelijke claim vóór implementatie

Bouwronde 30 september 2026, 20:22 UTC. Claim vóór implementatie.

Bron: echte SQLite-query en serverrender met uitsluitend synthetische data op
main a558c010. Opgeslagen 3/9-maandsgrenzen geven na drie maanden VERHOOGD,
maar het beheeroverzicht plaatst de samenwerking onder LAAG, verbergt de badge
en toont bij VERHOOGD een lege lijst. De ADMIN-rolcontrole gaat aan het panel vooraf.

Scope: één bestaande configuratielezing in het geautoriseerde panel; dezelfde
drempels voeden SQL-selectie/tellingen en badgebeoordeling. Bestandsgrenzen:
src/components/admin/samenwerkingen-panel.tsx, src/lib/data/admin-collaborations.ts,
gerichte bestaande of naastgelegen regressietests en voortgangsdocumentatie.
Behoud datumgrenzen, paginering, zoekescaping, statussen en huidige signalen.

Status: geclaimd; implementatie, validatie, onafhankelijke review, CI en release volgen.
