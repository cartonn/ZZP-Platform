# V5-platform: bestaande PR #1474 integreren

Bron: eigenaaropdracht van 10 september om het goedgekeurde Handslag-design ook binnen
het platform te gebruiken, inclusief zwarte wachtende en oranje goedgekeurde handzegels.
De vervolgopdracht van 11 september behoudt de publieke landing altijd in het lichte design.

De coördinator van 20:12 UTC pakt bestaande draft #1474 op vanuit een nieuwe schone worktree
op main `268bfc7ac1a231fa0aef65e60a0b023c2a0c3f2e`. De eerdere PR-head was
`f48fd81c175da321a9fd7c64f8a70a3b8e17bf33`. Geen tweede platform-PR of nieuw productbereik.
De bouwclaim van 20:22 UTC vervolgt dit werk zonder dubbel increment.
Landingspagina, palet, interacties, server-afgeleide doelgroepkeuze, jaartal en alle zeven
landingregressies komen exact uit de actuele hoofdversie. Beide geldige ontwerp- en
historieteksten zijn gecombineerd. Monitor- en registratietimingfix blijven behouden.

De eerste personaronde op `e62a7114` bevestigde bij vier rollen ontbrekende menufocus bij
openen en herstel na Escape. Bij de bemiddelaar liep de header op 390px uit tot 467px
(dashboard) en 419px (acties). De bestaande #1474-bron bevat de reparaties: portal/modal-
focus/inert/scroll-lock, responsieve header en rolgefilterde mobiele navigatie.
De integratiecontrole vond daarnaast het Meer-menu bij alle vier rollen buiten beeld op
320px. Het mobiele paneel wordt nu aan de sticky header begrensd en kan verticaal scrollen;
de desktopverankering aan de knop blijft behouden.

Validatie op een geïsoleerde lokale productiebuild met uitsluitend synthetische data:

- Lint, typecheck en 8.719 tests slagen; twee bestaande tests overgeslagen.
- De eerste build strandde op afgeschermde fonttoegang; de netwerktoegestane build slaagt.
  Ook de nieuwe productiebuild na de menufix slaagt, inclusief lint en typecheck.
- 24 browsercontroles slagen zonder retries: acht rol/thema-combinaties op 320/390/1440px,
  zeven landingregressies, twee privé-documenttests, certificaatdeling, kruisgebruikertoegang,
  vier cascadepaden inclusief afkeuren/dispuut/credit en de volledige opdracht-tot-betalingroute.
- De acht workspace-tests toetsen skiplink, modal-initialisatie, inert, Tab-begrenzing,
  Escape/focusherstel, rolgeautoriseerde docklinks, menu-viewportgrenzen, actieve focus-outline,
  actiepagina-breedte, themaopslag en verminderde beweging.
- De afzonderlijke voorlopige reviewer beoordeelde de gecombineerde diff en de menufix
  zonder concrete blocker; zes gerichte suites met 54 tests slagen in diens eigen controle.
  Dat is nog geen definitieve native PASS op een nieuwe onveranderlijke PR-head.

Geen schemawijziging, nieuwe rol, prijs, integratie of echte betalingsverwerking.
Goedgekeurde zegels volgen effectieve serverstatus; dispuut, afwijzing en verloop
mogen niet als goedgekeurd worden getoond. De onafhankelijke native review en alle
zes actuele GitHub-poorten blijven nodig vóór merge; eerdere reviews zijn geen PASS
voor deze integratie. Livegang moet afzonderlijk uit de werkelijke deployment blijken.

## Native review: historische modelovereenkomst

De eerste native review op `1d5e058f1086fb3320c7fa1ea727760f3bb6dad5` gaf **BLOCK**:
[bevinding 3993250557](https://github.com/cartonn/ZZP-Platform/pull/1474#discussion_r3993250557).
Een afgesloten samenwerking zonder beide handtekeningen hield ten onrechte zwarte
wachtende zegels. Run `34645284534` is volledig afgerond; dit oordeel wordt bewaard.
De eerste gerichte reparatie geeft de bestaande serverafgeleide `agreementStillOpen`
aan de kaart door als `signingOpen`. Gesloten ongetekende rijen krijgen geen wachtzegel;
werkelijke historische handtekeningen en volledig ondertekende akkoorden behouden hun
oranje zegel. De tekst zegt bij gesloten rijen “niet ondertekend”. De tekenrechten zijn
ongewijzigd en worden niet gebruikt als vervanging voor de processtatus.
Vier renderregressies toetsen open/read-only, gesloten/ongetekend, deels en volledig
historisch ondertekend: vóór de fix twee failures, daarna alle vier geslaagd.
De nieuwe commit vereist opnieuw alle poorten en een verse native beoordeling.
