# Ondertekenen en bewijsstukken beoordelen

Expliciet eigenaarverzoek op 12 september 2026. Startbasis:
`7fd8b1f1d23b3fc1acae26076e07b9ab49df9e67` (#1485, live geverifieerd).

## Ondertekenen

Beide partijen lezen dezelfde vastgelegde overeenkomst en bevestigen hun naam,
tekenbevoegdheid, toestemming en wachtwoord. De eerste handtekening bewaart tekst,
PDF, inhoudskenmerken en bewijs; pas de tweede activeert een voorgestelde samenwerking.
Een eigen tekenverzoek verdwijnt daarna uit taken en badges. Bestaande akkoorden
krijgen niet achteraf een nieuw bewijs. De oude aanroep zonder formulier activeert niets.

Dit is een gewone elektronische handtekening. Er wordt geen geavanceerde of
gekwalificeerde handtekening, overheidsvalidatie, gekwalificeerd tijdstempel of
gekwalificeerd elektronisch zegel geclaimd. Geschiktheid hangt af van de concrete
rechtshandeling, betrouwbaarheid en omstandigheden. De Handslag-afbeelding is een
productstatus; het ondertekenbewijs ligt in de vastgelegde documentversie en bevestigingen.

Bronnen: [eIDAS artikelen 25–26](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02014R0910-20241018),
[Rijksoverheid](https://www.rijksoverheid.nl/vraag-en-antwoord/digitale-overheid/wat-is-een-elektronische-handtekening),
[RDI](https://www.rdi.nl/documenten/2024/10/28/wettelijke-verplichtingen-geavanceerde-elektronische-handtekening).

## Bewijsstukken

Een bevoegde beheerder registreert de werkelijk uitgevoerde controle, met passend
origineel, persoon, echtheid en toepassingsgebied. Een selectievakje registreert een
menselijke controle; het is geen automatisch antwoord van DUO of Justis. Er gaat geen
bestand automatisch naar een externe controledienst. Status, versiegrendel, audit en
besluit worden atomair opgeslagen. De bestaande beperkte VOG-bewaring blijft gelden.

Een digitale VOG vraagt de originele PDF en controle via de daarvoor bedoelde
dienst; een papieren VOG vraagt het fysieke origineel. Een VOG heeft geen algemene
wettelijke vervaldatum: de gekozen datum is organisatiebeleid voor herbeoordeling.
Een DUO-controle betreft een passend origineel digitaal uittreksel.
Bronnen: [Justis controle-instructies](https://www.justis.nl/producten/verklaring-omtrent-het-gedrag/informatie-over-de-vog-voor-werkgevers-en-organisaties/controleren-van-de-vog),
[Justis geldigheid](https://www.justis.nl/veelgestelde-vragen/hoelang-is-een-vog-geldig),
[DUO diplomacontrole](https://duo.nl/zakelijk/diploma/diplomas/digitaal-diploma-controleren.jsp).

## Privacy en controle

Het gezamenlijke bewijs is alleen beschikbaar voor de contractpartijen en bevoegde
beheerders. Accountexport bevat eigen ondertekenmetadata en een beveiligde bewijslink,
geen ongevraagde documentinhoud of handtekening van de andere partij. Bij een
verwijderverzoek beoordeelt beheer afzonderlijk de bewaarbehoefte en beide belangen.
Zonder besluit blijft het verzoek open. Na toegestane bewijsverwijdering verdwijnen
tekst, PDF en beide handtekeningen atomair; een markering voorkomt reconstructie.

Gerichte tests controleren echte transacties, races, integriteit, bewijsverwijdering,
privacy, auditrollback en de taak-/badgekoppeling. De geïntegreerde volledige suite
slaagde met 8.861 tests (twee bestaande skips). PDF-pagina’s zijn met synthetische
gegevens gerenderd en bekeken. Browserproeven staan in de echte CI, inclusief vier
nieuwe mobiele licht/donkerproeven op 320 en 390 pixels. Er is geen lokale browser
om de eerdere afgebroken toestemming heen gestart.

Nog in uitvoering: volledige verificatie van de geïntegreerde documentbeoordeling,
CI-browsers, onafhankelijke review, zes beschermde poorten en releasecontrole.
Deze tekst is geen bewijs dat deze release al live staat.

## Herstel na de eerste onafhankelijke review en CI

Review van `06aadfdf` vond een achtergebleven aanroep in de demo-seed. De seed
doorloopt nu met beide synthetische accounts de werkelijke wachtwoord-, toestemmings-
en documentbewijsketen. Alleen de expliciete compliancecontrole mag een scenario
voorgesteld laten; andere fouten stoppen de seed. Een afzonderlijke Node-seedconfig
herkent de servercontext zonder de client-importbeveiliging van de app te wijzigen.
De lege lokale proefdatabase levert zeven actieve samenwerkingen met elk twee
handtekeningen, acht prestaties en zeven facturen, waarvan drie betaald.

De eerste CI (`34750938818`) bevestigde de documentcontroles, maar vond ook een
TypeScript-overloadfout in de PDF-bijlagentest en een onjuiste verwachting in de
anonieme browsertest. Deze zijn hersteld: de PDF-test controleert het werkelijke
streamtype; de browser verwacht de bestaande loginredirect en controleert dat die
geen PDF levert. De optionele synthetische PDF-testuitvoer is nu gedocumenteerd.
Volledige lokale suite na herstel: 8.866 geslaagd, twee bestaande skips.
De nieuwe volledige CI en onafhankelijke beoordeling blijven vereist vóór samenvoegen.
