# Verwerkersovereenkomst (art. 28 AVG) — CONCEPT-SJABLOON

> **Status: concept, ter toetsing door een jurist.** Dit sjabloon geldt voor situaties
> waarin Handslag als **verwerker** optreedt namens een opdrachtgever/zorgorganisatie
> (bv. het bijhouden van compliance-dossiers in hun opdracht). Voor de eigen
> platformdoeleinden (accounts, matching, verificatie-workflow, facturatie) is Handslag
> **zelfstandig verwerkingsverantwoordelijke** — dan geldt de privacyverklaring en is
> deze overeenkomst niet van toepassing. De rolbepaling per dienst is een expliciet
> te toetsen juridisch punt (zie REVIEW-DOOR-JURIST.md).

**Partijen:** [Opdrachtgever/rechtspersoon] ("Verwerkingsverantwoordelijke") en
[Handslag-rechtspersoon, KVK-nummer] ("Verwerker"). Onlosmakelijk verbonden met de
hoofdovereenkomst (platformgebruik).

## Art. 1 — Onderwerp en duur

1. Verwerker verwerkt persoonsgegevens uitsluitend ten behoeve van de in **Bijlage 1**
   omschreven diensten, voor de duur van de hoofdovereenkomst.
2. Aard en doel van de verwerking, soorten persoonsgegevens en categorieën betrokkenen
   staan in Bijlage 1.

## Art. 2 — Instructies

1. Verwerker verwerkt uitsluitend op schriftelijke instructie van
   Verwerkingsverantwoordelijke, tenzij een Unierechtelijke of lidstaatrechtelijke
   bepaling tot verwerking verplicht; in dat geval meldt Verwerker die verplichting
   vooraf, tenzij die wetgeving dit verbiedt.
2. Verwerker informeert Verwerkingsverantwoordelijke onmiddellijk als een instructie
   naar zijn oordeel inbreuk maakt op de AVG.

## Art. 3 — Geheimhouding

Tot verwerking bevoegde personen hebben zich contractueel tot vertrouwelijkheid
verbonden of zijn aan een wettelijke geheimhoudingsplicht onderworpen.

## Art. 4 — Beveiliging (art. 32 AVG)

Verwerker treft passende technische en organisatorische maatregelen, waaronder ten
minste: versleutelde verbindingen (TLS), versleutelde opslag van documenten,
rolgebaseerde toegang (RBAC), wachtwoord-hashing, auditlogging van toegang tot
gevoelige documenten, geautomatiseerde afdwinging van bewaartermijnen en periodieke
beveiligingsreviews. Wijzigingen mogen het beveiligingsniveau nooit verlagen.

## Art. 5 — Subverwerkers

1. Verwerkingsverantwoordelijke verleent algemene schriftelijke toestemming voor de
   subverwerkers in **Bijlage 2** (hosting, opslag, e-mail, betaalprovider, routing).
2. Verwerker meldt voorgenomen wijzigingen vooraf; Verwerkingsverantwoordelijke kan
   binnen [14] dagen gemotiveerd bezwaar maken.
3. Verwerker legt aan elke subverwerker dezelfde verplichtingen op als in deze
   overeenkomst en blijft volledig aansprakelijk voor de nakoming daarvan.

## Art. 6 — Doorgifte buiten de EER

Alleen met passende waarborgen (adequaatheidsbesluit of modelcontractbepalingen/SCC's),
vermeld per subverwerker in Bijlage 2.

## Art. 7 — Bijstand

Verwerker verleent, rekening houdend met de aard van de verwerking, redelijke bijstand
bij: verzoeken van betrokkenen (art. 12–23), beveiliging (art. 32), datalekmeldingen
(art. 33/34), DPIA's (art. 35) en voorafgaande raadpleging (art. 36).

## Art. 8 — Datalekken

Verwerker meldt een inbreuk in verband met persoonsgegevens **onverwijld, uiterlijk
binnen 24 uur na ontdekking** aan Verwerkingsverantwoordelijke, met alle informatie die
nodig is voor diens meldplicht (zie ook docs/legal/DATALEKPROCEDURE.md).

## Art. 9 — Einde van de overeenkomst

Na afloop wist Verwerker alle persoonsgegevens of geeft ze terug (keuze van
Verwerkingsverantwoordelijke) en verwijdert bestaande kopieën, tenzij opslag wettelijk
verplicht is (bv. fiscale bewaarplicht — dan uitsluitend voor dat doel en die duur).

## Art. 10 — Audit

Verwerker stelt alle informatie ter beschikking die nodig is om naleving aan te tonen en
maakt audits mogelijk, uit te voeren door Verwerkingsverantwoordelijke of een door deze
gemachtigde auditor, met redelijke aankondiging en maximaal [1×] per jaar behoudens
incidenten.

## Bijlage 1 — Verwerkingsspecificatie (in te vullen per dienst)

| Onderdeel                            | Invulling                              |
| ------------------------------------ | -------------------------------------- |
| Diensten                             | [bv. compliance-dossier zorgverleners] |
| Aard/doel                            | [—]                                    |
| Persoonsgegevens                     | [—]                                    |
| Bijzondere/strafrechtelijke gegevens | [bv. VOG-verificatiestatus]            |
| Categorieën betrokkenen              | [ZZP'ers]                              |

## Bijlage 2 — Subverwerkers

| Subverwerker           | Dienst                                    | Locatie/doorgifte | Waarborg               |
| ---------------------- | ----------------------------------------- | ----------------- | ---------------------- |
| [Hostingprovider]      | applicatie + database                     | EU                | verwerkersovereenkomst |
| [Opslagprovider]       | versleutelde documentopslag               | EU                | verwerkersovereenkomst |
| [E-maildienstverlener] | transactionele e-mail                     | [EU/VS]           | DPA + SCC's            |
| [Betaaldienstverlener] | abonnementsbetalingen                     | EU                | DPA                    |
| [Route-dienstverlener] | reistijdberekening (alleen indien actief) | [EU/VS]           | DPA + SCC's            |
