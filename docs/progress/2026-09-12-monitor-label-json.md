# Deploybewaking: ontbrekend label veilig herkennen

## Claim — 12 september 2026, bouwslot 00:22 UTC

Bron: geplande monitorruns 34642240781 en 34654487641 op main
268bfc7ac1a231fa0aef65e60a0b023c2a0c3f2e. De incidentstap faalt met
`Unexpected end of JSON input`; dit is geen bewijs van een productiestoring.
Read-only reproductie met GitHub CLI 2.88.1: `gh label list --search deploy-lag
--limit 100 --json name` eindigt met code 0 en lege stdout. De gewone labellijst
toont negen standaardlabels en de REST-labellijst bevestigt dat deploy-lag ontbreekt.
`gh issue list --label deploy-lag --state open --json number` geeft wel `[]`.

Scope: alleen scripts/deploy-lag-watchdog.mjs, de bijbehorende regressietests en
de voortgangsdocumentatie. Behandel de bevestigde lege labelzoekuitvoer als geen
label; behoud harde fouten voor mislukte CLI-opdrachten en corrupte JSON.
Bestaande incidentstatus, commitvergelijking, bronbescherming en reviewcontroles
blijven intact. Implementatie, tests en onafhankelijke review volgen na deze claim.
