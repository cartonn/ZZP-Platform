# Certificaatgegevens: gelijktijdige beoordeling behouden

## Claim — 14 september 2026, routine 00:22 UTC

Bron: actuele code op `14be83b6`, `certificaten/actions.ts`,
`persistCredential` zonder nieuw bestand. De fallback schrijft uitsluitend op id,
terwijl het besluit om opnieuw te beoordelen afhangt van een eerdere status/feitenlezing.
Een gelijktijdige adminbeslissing kan dus VERIFIED worden vóór de verouderde write;
andere type-/uitgever-/vervalgegevens krijgen dan ten onrechte dezelfde goedkeuring.
Dit is een bestaande juistheids- en verificatie-invariant, geen nieuw productbesluit.

Scope: alleen de fallback-write bewaken tegen gewijzigde status/versie/ownership,
met regressieproeven op synthetische gegevens. Bestaande herbeoordeling en document-
vervanging behouden. Bestandsgrenzen: `certificaten/actions.ts`, een gerichte
regressiesuite en voortgangsdocumentatie. Geen productiegegevens of integraties.

Status: geclaimd vóór implementatie. Repro, volledige controles, onafhankelijke review,
GitHub-poorten, merge en release zijn nog niet bewezen.

## Reproductie en herstel

De acht nieuwe tests draaien de echte opslagactie met een eigen tijdelijke SQLite-database.
Een deterministische wijziging na de eerste lees simuleert een inmiddels nieuwere rij.
Vier gevallen faalden vóór de fix: goedkeuring, afwijzing, wijziging met dezelfde status,
en een zichtbaarheidssave na opnieuw beoordeelde feiten. Na de fix slagen alle acht;
gewone edits, zichtbaarheid, herbeoordeling en ownership blijven werken. Beide publieke
save-ingangen zijn gedekt. Samen met bestaande certificaatsuites: achttien tests groen.

De fallback gebruikt een conditionele write op id, profiel, status en updatedAt en de
bestaande foutmelding bij nul gewijzigde rijen. Geen audit-/navigatiesucces bij een
verouderde save. Bestandsvervanging en herindienen blijven buiten deze reparatie.
Dit is geïsoleerd bewijs van interleaving, geen echte productieconcurrentieproef.

## Controle vóór review

De volledige suite slaagt: 8.941 tests, twee bestaande skips; lint en volledige opmaak
slagen. De eerste typecheck vond een typeannotatie in de nieuwe testfixture; die is
hersteld. Typecheck en productiebuild worden opnieuw gecontroleerd vóór gereedmaken.
De sandboxbuild kon fonts niet ophalen; de gewone netwerkbuild is apart gestart.
Er is nog geen onafhankelijke/native goedkeuring of releaseclaim.
