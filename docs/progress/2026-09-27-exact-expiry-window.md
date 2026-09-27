# Exact venster voor bijna verlopen certificaten — 27 september 2026

## Claim vóór implementatie

Bron: audit 12:36 UTC op main `c89cf17a69382014c7df230459dcbb0c6e5a3541`.
`isExpiringSoon` rondt via `daysUntilExpiry` naar beneden en waarschuwt daardoor
bij 30 dagen plus een fractie al, terwijl zelfstandige en rooster exact 720 uur gebruiken.
Drie synthetische grensgevallen reproduceren de tegenstrijdige opdrachtgeveractie.

Scope: uitsluitend de tijdvergelijking in `src/lib/credentials.ts`, gerichte helper-,
planner- en rolpariteitregressies, en deze voortgangsdocumentatie.
Behoud weergave-afronding, effectieve status, nuldatum en inclusief eindpunt.
Geen query-/loaderwijzigingen aan de bevroren PR #1521, schema, ontwerp of integraties.

Status: geclaimd; implementatie, volledige lokale checks, onafhankelijke review en CI volgen.

## Implementatie en regressiebewijs

Draft #1524 is vóór implementatie geclaimd. `isExpiringSoon` vergelijkt nu de
resterende milliseconden rechtstreeks met `withinDays × 86.400.000`. De inclusief
bovengrens en status-/verlopen-/nuldatumguards blijven staan; `daysUntilExpiry`
blijft voor weergave naar beneden afronden.

Dertien regressiegevallen: tien rood vóór herstel, dertien groen erna.
De echte opdrachtgeverprojectie, zelfstandige-helper en roostertelling stemmen
nu overeen op 720 uur minus/equal/plus één milliseconde en fractionele dagen.
Aanvullend: 0,5/7/30-daagse vensters, geen waarschuwing bij nul venster,
weergave-afronding, statusguards, herinneringsplanner bij vensterintrede,
vervaldatum-deduplicatie en indeling als verval tijdens een langere opdracht.
Zes gerichte suites slagen met 123 tests, inclusief bestaande expiry-task-tests.

Alle directe aanroepers gelezen: certificatenlijst, samenwerkingsbeoordeling en
herinneringsplanner. De samenwerkingsbeoordeling voedt ook dossier en actielijst;
de handmatige reminderwrite kijkt uitsluitend naar ontbrekend/verlopen en wijzigt
niet. Matching/verplichte documenten gebruiken de ongewijzigde verlopencheck.
Bestaande leadtime-nudges houden hun eigen bedoeling en dagweergave.

Dit is pure helper-/projectie-/plannerbewijs; geen nieuwe browser- of
productiedataproef. De kalenderdagselectie in de bestaande expiry-task-query is
niet aangepast. Er zijn geen schema-, machtigings-, query- of ontwerpwijzigingen.
Volledige suite: 861 suites en 9.127 tests groen, 2 suites/3 tests bestaande skips.
Lint, typecheck en volledige formatcontrole geslaagd. Sandboxbuild faalde alleen
op Google Fonts-DNS; netwerkbuild daarna volledig geslaagd. Review, CI, merge en livebewijs volgen apart.
