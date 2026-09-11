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

## Tweede native bevinding: dispuut

Run `34648866845` gaf op `c36a407874779f3b3824686fdad1931ce57b4072` een nieuwe **BLOCK**:
[bevinding 3993526218](https://github.com/cartonn/ZZP-Platform/pull/1474#discussion_r3993526218).
De terminale case is hersteld, maar bij een actieve samenwerking met dispuut kon de
modelovereenkomst nog wachtzegels tonen. De effectieve serverwaarde sluit daarom ook
`frozen` uit en de kaart krijgt de serverafgeleide dispuutstatus. Alle goedkeuringszegels
zijn tijdens het dispuut onderdrukt; daadwerkelijke handtekeningen blijven als tekst
leesbaar. Hetzelfde effectieve criterium verbergt teken- en vormkeuzeknoppen.
Zeven rendergevallen dekken nu ook ongetekende, deels en volledig getekende disputen.
Twee nieuwe rendertests faalden vóór de fix; alle zeven slagen na de fix.
De echte lokale cascade-repro faalde vóór de fix met vier zegel-/approval-elementen
waar nul verwacht werden. De uitbreiding controleert beide partijen tijdens het dispuut
én het terugkeren van pending/tekenen na oplossing van exact het testdispuut.
Het bestaande server-action-hardeningpunt wordt apart opgevolgd; deze UI-reparatie
claimt geen nieuwe servermutatiebeveiliging. De native BLOCK-bewijzen blijven bewaard.

Hervalidatie na de dispuutfix: `npm run check` volledig geslaagd (lint, typecheck,
8.726 tests met twee bestaande skips, productiebuild); volledige Prettier-controle
geslaagd. De uitgebreide browser-dispuutstroom slaagt op de nieuwe productiebuild,
zonder retries, inclusief herstel na oplossing. De afzonderlijke reviewer vindt geen
nieuwe blocker in de gerichte patch; de nieuwe native SHA-beoordeling blijft vereist.

## Afzonderlijke overnamebevinding

Run `34650142568` gaf op `2fc1862635a9f59c4edf1ef2eba53e208fdb6ebc` **BLOCK** voor
[overnamebevinding 3993609488](https://github.com/cartonn/ZZP-Platform/pull/1474#discussion_r3993609488).
Dit betreft een andere aanroep: het OPEN-overnameverzoek behield een zwart wachtzegel
bij een dispuut. De eerdere twee modelovereenkomstbevindingen waren daarmee hersteld.
De eerste gerichte reparatie voor deze overnameaanroep gebruikt de bestaande
`approvalMark`-helper met `disputed: frozen`; OPEN telt alleen bij een actieve
samenwerking als beoordeling. Daardoor is ook een historische OPEN-aanvraag geen
live goedkeuringssignaal. Bestaande beslissingen blijven buiten dispuut herkenbaar.
De cascade-regressie maakt nu echt een overnameverzoek vóór het dispuut, controleert
pending, nul approval-/sealelementen tijdens dispuut en terugkeer na oplossing.
Vóór de fix faalt de browserassertie met twee elementen waar nul verwacht worden.
Alle nieuw toegevoegde zegelaanroepen worden daarnaast afzonderlijk nagelopen op hun
werkelijke serverquery, eindstatus, dispuut en verloop, vóór de volgende bronfreeze.

De overnamehistorie is na afsluiting ook zonder intrekknop; actieve, onbetwiste
historische goedkeuringen behouden hun feitelijke zegel. De afzonderlijke audit van
alle toegevoegde zegelaanroepen vond buiten deze overnameaanroep geen extra blocker.
De handoffpatch is daarna onafhankelijk beoordeeld zonder nieuwe blocker.

Definitieve lokale controle: 8.726 tests geslaagd, twee bestaande skips; lint/typecheck,
productiebuild en volledige opmaakcontrole geslaagd. Na de aanvullende active-voorwaarde
voor de intrekknop is de productiebuild opnieuw succesvol gemaakt. De 24 browsercontroles
zijn op de uiteindelijke productiebuild opnieuw uitgevoerd met een verse synthetische
database en slagen allemaal zonder retries. Dit omvat ook de uitgebreide overname-/
dispuutstroom en nieuwe mobiele screenshots. De voorafgaande herhaling op een hergebruikte
dataset gaf 23/24: de deeltest verwacht de standaard gedeelde VOG, terwijl de eerdere
uitvoering die zelf had ont-deeld. Dat fixture-resultaat is bewaard; er is geen productcode
of assertion aangepast om die fout weg te drukken. De oorspronkelijke dataset is behouden.
