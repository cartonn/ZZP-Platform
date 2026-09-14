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
