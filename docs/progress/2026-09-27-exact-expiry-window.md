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
