# Handslag-platform: identiteit van de landingspagina

## Opdracht en basis

De eigenaar meldt op 12 september dat het ingelogde platform nog de oude kleuren
gebruikt en vraagt expliciet om de kleuren en het logo van de landing, inclusief
oranje en goedkeuringszegels. De publieke lichte V5 is al live.

Deze integratie behoudt de bestaande V5-implementatie van PR #1474 op volledige head
`f7c08089fc6a2b3c88c2b6b8a4adf2d390a82696` en integreert die met huidige main
`112e23cdafabcba76d64559d5facdb5cf29b1c82`, inclusief de nieuwe ondertekenbewaking.
Er wordt geen parallel ontwerp gebouwd. De vorige native reviewrun `34652063008`
verliep zonder antwoord en blijft INCOMPLETE. De eerdere inhoudelijke bevindingen
en reparaties blijven in de historie en worden opnieuw beoordeeld.

## Uitvoering

Een vervangende PR krijgt een nieuwe volledige head, volledige actuele controles,
een afzonderlijke sterke review en een nieuwe authentieke GitHub-review. De oude
PR wordt als vervangen gesloten, met zijn bronbranch en eerdere reviewbewijzen
ongewijzigd bewaard. Geen oude PASS, reactie of verlopen venster wordt geïmporteerd.
Alle zes beschermde poorten blijven verplicht. Geen betaalde reviewfallback.

Scope: blauw/wit/oranje, oorspronkelijk tweehandslogo, Open Sans, gedeelde lagen en
schaduwen, responsieve navigatie, toegankelijke hover/focus en servergestuurde zegels.
Zwart betekent wachten op goedkeuring; oranje betekent daadwerkelijk goedgekeurd.
Afwijzing, verloop, intrekking of geschil levert geen onterechte goedkeuring op.

Ook browser- en iPhone-installatie-iconen, manifest en offlinepagina gebruiken de
originele oranje handen. Versiegebonden icoon-URL's en de vernieuwde shellcache
voorkomen dat oude installatiebestanden het vorige merk blijven tonen. Privépagina's
blijven uitgesloten van offlineopslag.

## Uitgevoerde validatie

- Volledige lokale check: lint, typecontrole, 8.755 tests geslaagd (2 bestaande
  skips) en productiebuild geslaagd. Volledige opmaakcontrole geslaagd.
- 21 browserproeven op een eigen productiebuild en synthetische SQLite-database:
  alle geslaagd zonder retries. Vier rollen in licht/donker, 320/390/1440 px,
  toetsenbordfocus, mobiel menu/dock, zeven landingproeven, vier cascadeproeven
  inclusief geschil en herstel, plus manifest/iconen/offlinepagina.
- De browser vergelijkt de daadwerkelijk gerenderde basiskleuren en beide
  logo-paden tussen landing en platform, met een opgeslagen oude groene voorkeur.
  Desktop- en mobiele screenshots zijn visueel geïnspecteerd.
- Afzonderlijke sterke review op de volledige integratie en het icoon-addendum:
  geen blokkerende bevindingen; definitieve headcontrole volgt na commit.

Release via PR #1483: de zes beschermde GitHub-poorten, authentieke native review
op de bevroren definitieve bron en de uiteindelijke live-uitrol volgen nog.
