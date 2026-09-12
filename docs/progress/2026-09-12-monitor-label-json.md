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

## Reparatie en gerichte validatie

Alleen een succesvolle lege labelzoekuitvoer wordt in `hasLabel()` als een lege
labellijst behandeld. Niet-lege uitvoer blijft door JSON.parse gaan; een mislukte
CLI-opdracht blijft gooien. De incidentzoekopdracht krijgt geen lege-uitvoerfallback.
De bestaande labelrace wordt nog altijd met een tweede labelzoekopdracht bevestigd.

Regressie bewezen: twee nieuwe lege-labelgevallen (lag=true en lag=false) faalden
voor de reparatie met dezelfde JSON-fout; na de reparatie slagen alle 29 tests.
Extra grenzen: mislukte labelread, corrupte of verkeerd gevormde label-JSON en lege
issue-JSON blijven falen zonder incidentmutatie. Een aparte onafhankelijke reviewer
bevestigde de afhandeling en draaide de 29 gerichte tests zelf succesvol.
Volledige lokale validatie: lint en types geslaagd; 8.690 tests geslaagd en twee
bestaande skips. Opmaakcontrole geslaagd. De eerste build stopte op geblokkeerde
lettertypeverbindingen; de aparte build met netwerktoegang is volledig geslaagd.
Review op de definitieve SHA en de zes GitHub-poorten volgen.
PROGRESS.md is teruggebracht onder 400 regels door oudere entries ongewijzigd
naar een gelinkt archief te verplaatsen; geen geschiedenis verwijderd.
