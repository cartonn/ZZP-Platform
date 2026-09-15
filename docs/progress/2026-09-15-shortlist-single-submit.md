# Kandidaten-shortlist: één normale klik zonder herlaad-vangnet

Claim vóór implementatie; basis4dd0b6728f3f556c9f7adebe389b794bca209ec6.
Bron: CURRENT_TASK, technische schuld punt5: na React-reparatie#329 moeten de
herklik/window.stop/reload-omwegen per bestaande browserproef worden verwijderd.

Afgebakend: alleen het shortlistmoment in e2e/applications.spec.ts. Deze proef
gebruikt nog clickUntilGone, dat tussen herhaalde klikken documentnavigaties kan
forceren. Daardoor bewijst groen niet dat één normale handeling de serverstatus
in de huidige pagina verwerkt. De bestaande mutatie revalideert /kandidaten en
hoeft geen volledige documentnavigatie uit te voeren.

Beoogd: één klik; wachten op de echte Shortlist-status in de eigen kandidatenrij;
geen documentnavigatie tijdens die handeling. Behoud de bestaande registratie-,
publicatie-,reactie-,compliance-,badge- en notitietests. Geen wijziging van het
product, gedeelde helpers, time-outs, authenticatie of overige journeys.

Dedup: openPRs en actuele code gecontroleerd; geen bestaande claim voor dit
shortlistmoment. De gedeelde helper blijft voor andere proeven staan. Echte
productiebuild-browsercontrole via CI; geen lokale browser/serverstart.
Volledige lokale checks en aparte onafhankelijke/native reviews volgen.

## Gebouwd en lokaal gecontroleerd

De proef klikt één keer op de Shortlist-knop in de eigen kandidatenrij en wacht
op de exacte Shortlist-badge met het zwarte wachtzegel. Documentnavigaties worden
alleen tijdens deze handeling geteld; de teller moet nul blijven. De listener
wordt ook bij een mislukte verwachting verwijderd. Alle overige ketenstappen blijven.

Lint, types, 8.969 tests (twee bestaande skips) en volledige opmaakcontrole groen.
De sandboxbuild kon bestaande Google-fonts niet ophalen; dezelfde code bouwde
met netwerktoegang succesvol. Er is geen productfix of nieuwe browserbevinding
geclaimd: dit is afbouw van een bestaand testvangnet uit de backlog.
Aparte review, echte browser-CI, native review, merge en release zijn nog niet af.
