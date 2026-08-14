# Juridisch fundament — reviewdossier voor externe juristen

Datum: 14 augustus 2026 · Status: **alle documenten zijn CONCEPT versie 1.0** en dragen die
markering zichtbaar op de pagina tot de externe toetsing is afgerond.

## Wat er ligt

| Document                          | Vindplaats                                    | Basis                                                                                                                                                     |
| --------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Algemene voorwaarden              | `/voorwaarden` (src/app/voorwaarden/page.tsx) | BW 6:231 e.v., P2B 2019/1150, DSA art. 11-16, Wet DBA                                                                                                     |
| Privacyverklaring                 | `/privacy` (src/app/privacy/page.tsx)         | AVG art. 13/14; feiten uit het verwerkingsregister (src/lib/compliance/processing-register.ts); bewaartabel wordt live uit `RETENTION_SCHEDULE` gerenderd |
| Cookieverklaring                  | `/cookies` (src/app/cookies/page.tsx)         | Tw art. 11.7a; alleen functionele cookies, dus geen banner                                                                                                |
| Verwerkersovereenkomst (sjabloon) | docs/legal/VERWERKERSOVEREENKOMST-CONCEPT.md  | AVG art. 28 lid 3                                                                                                                                         |
| Datalekprocedure                  | docs/legal/DATALEKPROCEDURE.md                | AVG art. 33/34                                                                                                                                            |

Registratie verwijst expliciet naar voorwaarden + privacyverklaring; de pagina's zijn
inlogvrij (terhandstelling vóór het sluiten van de overeenkomst).

## Hoe de concurrentie het doet (onderzoek 14-8-2026)

Zes platformen onderzocht: PIDZ, Bendy, Zorgwerk (zorg-ZZP) en Malt, Temper, Deel
(generiek). Kernbevindingen die onze keuzes stuurden:

- **Rolkeuze is het juridische fundament en iedereen kiest anders.** Zorgwerk =
  uitzender/werkgever; Bendy = pure software ("nadrukkelijk geen bemiddelaar" — maar
  verstopt die rolbepaling in het privacybeleid); PIDZ = entiteitenconstellatie
  (software-BV contracteert, franchisekantoren bemiddelen); Temper = prikbord-plus;
  Malt = marketplace met escrow/verzekering; Deel = contractspartij per product. Wij
  kiezen expliciet in art. 1 AV: bemiddelaar, geen partij bij de opdracht, geen
  werkgever/uitzendbureau/zorgaanbieder, geen geldstroom onder ons.
- **Wet DBA regelt niemand goed in de openbare voorwaarden.** PIDZ eist zelfs
  persoonlijke uitvoering (pleit tégen zelfstandigheid); Zorgwerk haalde zijn
  zzp-documentatie offline. Temper is de benchmark (660-uurs-plafond per opdrachtgever,
  urenteller, vrij vervangingsrecht, Belastingdienst-modelovereenkomst). Onze AV art. 5
  regelt: gezamenlijke verantwoordelijkheid, geen persoonlijke-uitvoeringsplicht, geen
  gezag, vrijwaring bij herkwalificatie.
- **P2B-verordening 2019/1150 noemt geen van de zes bij naam**; Temper/Malt schorsen
  zelfs "zonder opgaaf van reden". Wij nemen de P2B-elementen bewust wél op
  (schorsingsgronden + motivering, 30 dagen bij beëindiging, 15 dagen bij
  AV-wijziging, ranking-parameters, gratis klachtenroute) — formeel pas verplicht bij
  consumenten-aanbod, maar goedkoop nu en een zichtbare eerlijkheids-differentiator.
- **Privacy-best-practices overgenomen:** concrete bewaartermijnen als tabel (Malt),
  technisch afgedwongen opschoning (Temper/Bendy), geen "door gebruik stemt u in"-
  toestemmingsconstructies (gedeelde zwakte bij PIDZ/Bendy/Zorgwerk).
- **Aansprakelijkheid marktbeeld:** iedereen sluit indirecte schade uit; caps variëren
  (6× maandfee bij PIDZ; factuurwaarde bij Bendy; €25k/€100k bij Zorgwerk; €200k bij
  Malt; $500 bij Deel). Wij: indirect uitgesloten, direct gecapt op 12 maanden betaalde
  vergoedingen, carve-out opzet/bewuste roekeloosheid.

## Te toetsen door de jurist (open punten)

1. **Rolbepaling & Waadi.** Klopt de bemiddelaar-positionering, en kan de
   bemiddelaar-/franchiserol feitelijk onder de Waadi vallen (allocatiefunctie →
   registratieplicht, loonverhoudingsnorm)? Wij menen van niet (geen leiding/toezicht-
   overdracht), maar dit is een kernrisico.
2. **DBA-vrijwaring (AV art. 5).** Houdt de vrijwaring voor naheffingen/boetes bij
   herkwalificatie stand; is ketenaansprakelijkheid richting het platform denkbaar?
3. **Aansprakelijkheidsbeperking (AV art. 10).** Cap en uitsluitingen toetsen aan
   reflexwerking grijze/zwarte lijst (kleine ZZP'ers als quasi-consument).
4. **VOG-bewaring.** AP-lijn: een VOG-kopie bewaren mag alleen met aantoonbare
   noodzaak; uitgangspunt is "gezien + datum" registreren. Productbacklog hieronder;
   jurist: welke bewaarvorm is verdedigbaar voor de zorg-vergewisplicht (Wkkgz)?
5. **Renseignering.** Moeten platform of opdrachtgevers gegevens (incl. BSN) aan de
   Belastingdienst renseigneren (art. 22a Uitv.besluit IB 2001), en wie is daarvoor
   verantwoordelijk? PIDZ regelt dit expliciet in de AV; wij nu niet (wij houden geen
   BSN en betalen niet uit).
6. **Verwerkersrol per dienst.** Waar is het platform verwerker i.p.v.
   verantwoordelijke (compliance-dossiers voor zorgorganisaties)? Bepaalt of de
   verwerkersovereenkomst-template richting opdrachtgevers actief moet worden.
7. **Entiteitsgegevens.** Rechtspersoon, KVK-nummer, vestigingsadres en btw-nummer
   invullen op /voorwaarden en /privacy (placeholders staan er) + colofonplicht
   (art. 3:15d BW) — ook een zichtbare vermelding op de site overwegen.
8. **Forumkeuze.** AV noemen nu alleen Nederlands recht; bevoegde rechter expliciet
   maken (concurrenten kiezen de eigen vestigingsrechtbank)?
9. **DPIA is verplicht vóór livegang** met echte documenten (AP-lijst: grootschalige
   strafrechtelijke/gezondheidscontext + screening van werkenden). Mensenwerk, niet
   agent-werk — inplannen.

## Productbacklog met juridische lading (uit het onderzoek)

- **VOG-metadata-modus:** na verificatie het bestand kunnen wissen met behoud van
  verificatie-metadata (geverifieerd op datum X door Y) — AP-lijn, en Bendy's
  ID-verwijderpatroon bewijst dat het product-technisch kan.
- **Downloadbare AV-PDF + versie-archief** (art. 6:227b BW: opslaanbaar; nu alleen
  printbare pagina + "eerdere versies op verzoek").
- **Akkoord-logging bij registratie** (welke AV-versie gold bij acceptatie).
- **Meldknop onrechtmatige content** in de UI (DSA art. 16 notice-and-action; nu
  alleen het e-mailkanaal in AV art. 7).
- **Opschoning inactieve accounts** (12 maanden + 30 dagen vooraankondiging à la
  Malt/Temper) — pas beloven in /privacy als het gebouwd is.
- **DBA-urenteller per opdrachtgever** zichtbaar maken (Temper-benchmark; sluit aan op
  de bestaande opdrachtgever-spreiding-inzichten).
- **Contactpuntenpagina** voor autoriteiten en gebruikers (DSA art. 11/12).

## Procesnotitie

Deze teksten zijn geschreven op basis van eigen onderzoek van autoriteitsbronnen (AP,
ACM, Justis, KVK, EUR-Lex) en een structuur-analyse van zes concurrenten — er is geen
tekst van concurrenten overgenomen. Dit is geen juridisch advies; de CLAUDE.md-regel
blijft van kracht dat de security-/AVG-review vóór livegang door mensen gebeurt.
