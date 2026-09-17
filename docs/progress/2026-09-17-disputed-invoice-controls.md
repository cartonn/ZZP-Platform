# Factuurknoppen volgen het dispuut

Persona-ronde 17 september 05:00 UTC; draftclaim #1508 vóór implementatie.
Basis `b6fea77c7fbcc213c0337cd0b4781fbb538aa8c1`.

Bron: onafhankelijke FREELANCER/CLIENT-broncontrole. Het factuurdetail berekent
`canSend`, `canCancel` en `canPay` zonder de geladen `disputedAt`. Daardoor staan
Versturen/Annuleren/Markeer als betaald naast In dispuut, terwijl de bestaande
serveracties alle drie weigeren. Een partij kan een dispuut openen op een ACTIVE
samenwerking met een losse factuur; #1506 bewaakt de write al. Dit is misleidende
bediening, geen gevonden mutatie- of autorisatiebypass.

Scope: de drie knoppredicaten op `facturen/[id]/page.tsx`, gerichte renderproeven
naast de pagina en voortgang. Bewaar serverguards, documenten, bedragen, vormgeving
en overige factuurhandelingen. Geen betaalintegratie, fiscale of juridische wijziging.

Vijftien echte detailpaginarenders gebruiken synthetische database-/actorfixtures
(en een synchrone vervanger voor de niet-gerelateerde vertaalde async statusbadge).
Vóór herstel: vijf inhoudelijke regressies rood, tien controleproeven groen.
Daarna alle vijftien groen. De drie predicaten bewaken nu ook `!disputed`;
geen serveractie veranderd. De matrix bewaakt twee partijen, DRAFT/SENT/OVERDUE,
behoud van normale knoppen en PDF-link, geen legacyknoppen op cascadefacturen en
afwijzing van een buitenstaander. Geen browser- of database-erasureclaim.

Zeventien gerichte suites: 202 tests groen, één expliciet overgeslagen lokale
PostgreSQL-proef. Volledige controle, aparte review en echte PR-CI volgen.

Vierrollencontrole op de basiscommit: recente fixes #1493/#1498/#1503/#1506/#1507
in broncode bevestigd. Echte main-CI 35183785911: 178 browserproeven groen,
één bestaande skip; PostgreSQL-browserdoorsnede 24 groen. QA 35183785966:
61 groen, één skip (ontbrekend test-CRON_SECRET). Dit zijn overlappende suites,
geen op te tellen unieke gebruikersflows. Drie echte QA-afbeeldingen bekeken:
adminverificatie, opdrachtgeverdashboard, ZZP-certificaten; geen nieuw visueel
defect vastgesteld op die afbeeldingen. Mobiele/toetsenbordproeven steunen op
bestaande browser-CI; geen nieuwe lokale browser gestart.

Afzonderlijke FRANCHISER-bronbevinding: 50 afgedekte historische verlopen
certificaten kunnen een later onafgedekt certificaat uit kandidaatvensters
verdringen. Nog geen dynamische repro; apart vervolgitem in persona-backlog.
Niet meegenomen in deze kleine dispuutreparatie. Beide auditrapporten en
uitvoeringslogs staan in het lokale routineregister. Merge/live wordt apart bewezen.
