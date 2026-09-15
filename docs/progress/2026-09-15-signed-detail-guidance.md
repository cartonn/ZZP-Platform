# Samenwerkingsdetail na eigen handtekening — 15 september 05:00 UTC

Claim vóór implementatie: persona-controle op `e9d6fe38` bevestigt dat het detail
na de eerste handtekening nog een tekenactie toont. De server bewaart dan terecht
PROPOSED/DRAFT tot de andere partij tekent. Lijst/dashboard en contractkaart kennen
de eigen handtekening, maar de statusregel en Aan-zet-items krijgen die niet mee.

Bron: `samenwerkingen/[id]/page.tsx` regels 309/335 versus 686/700;
`cascade/turn-items.ts:63` en `collaboration-status-line.ts`. Het bestaande
`cascadeStage` ondersteunt `viewerHasSigned` al. Dit is nieuwe detailpariteit na #1486,
geen nieuwe tekenmethode of wijziging van juridische/gegevensbewaarregels.

Scope: hergebruik de geladen serverhandtekening voor de detailaanwijzingen;
eigen ondertekenaar wacht, de andere partij houdt zijn tekenactie. Bewaar
certificaatblokkades, geschilbevriezing en terminale statussen. Voeg gerichte
regressies en checks aan de bestaande mobiele tweepartijenproef toe.
Geen productieprobes; controles, onafhankelijke review en echte CI volgen.

## Gebouwd en gericht gecontroleerd

Het detail leidt `viewerHasSigned` eenmaal af uit de al geladen handtekeningen van
de huidige actor. Statusregel, Aan-zet-items en contractkaart gebruiken dezelfde
waarde. Een reeds getekende partij wacht; de tegenpartij behoudt de tekenactie.
Certificaatblokkades blijven vóór deze onderdrukking beoordeeld.

De regressieproef vóór productwijziging eindigt met vier failures en 22 PASS;
na herstel slagen alle 26 tests. Zes nieuwe cases dekken beide rollen, wachten,
ongetekende acties en behoud van certificaatblokkades. Bestaande eindstatus- en
geschiltests blijven groen. Vier bestaande mobiele browsergevallen (320/390px,
licht/donker) controleren nu ook de detailpagina na de eerste handtekening voor
beide partijen. Uitvoering daarvan volgt via echte CI; geen lokale browserclaim.

Huidige-main audit: CI 34930790486 en QA 34930790500, werkelijke joblogs en drie
QA-afbeeldingen geïnspecteerd. Zie de persona-backlog voor aantallen/beperkingen.
Onafhankelijke bronaudits vonden dit pariteitsdefect en geen nieuw bereikbaar
rol-/tenant-/privébestandslek op de onderzochte oppervlakken. Geen productieprobes.

Volledige lokale lint- en typecontrole slagen; 8.951 unittests slagen met twee
bestaande skips. Volledige formattingcontrole slaagt. Productiebuild loopt nog;
onafhankelijke review, actuele GitHub-checks, merge en liveverificatie zijn nog open.
