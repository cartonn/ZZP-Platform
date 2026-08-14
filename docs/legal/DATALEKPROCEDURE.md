# Datalekprocedure (art. 33/34 AVG) — CONCEPT

> **Status: concept, ter toetsing door een jurist/FG.** Dit is de interne procedure;
> de privacyverklaring (/privacy) verwijst ernaar. Geen juridisch advies.

## 1. Wat is een datalek

Elke inbreuk op de beveiliging die leidt tot vernietiging, verlies, wijziging of
ongeoorloofde verstrekking van of toegang tot persoonsgegevens. Voorbeelden op dit
platform: een document (VOG/diploma) zichtbaar voor de verkeerde rol, een gelekte
databasedump, een verkeerd geadresseerde e-mail met persoonsgegevens, een gestolen
sessietoken met accountovername.

## 2. Rollen

- **Incidentcoördinator:** de eigenaar (tot een FG/DPO is aangesteld).
- **Technisch onderzoek:** beheerder(s) met toegang tot auditlog en HealthIncidents.

## 3. Procedure (de 72-uursklok start bij ontdekking)

1. **Detecteren & stoppen** — dicht het lek (sessies intrekken, toegang blokkeren,
   secret roteren). Bewaar bewijs: auditlog-regels, HealthIncident-records, tijdstippen.
2. **Beoordelen (binnen 24 uur)** — welke gegevens, hoeveel betrokkenen, welk risico?
   Bij VOG's, identiteits- of gezondheidsgerelateerde gegevens: standaard **hoog risico**.
3. **Melden bij de AP (binnen 72 uur na ontdekking)** — via het meldloket van
   autoriteitpersoonsgegevens.nl, tenzij het onwaarschijnlijk is dat het lek een risico
   inhoudt. Twijfel = melden. Weekend telt mee. Later melden mag alleen gemotiveerd.
   Meldinhoud: aard van het lek, categorieën en (geschatte) aantallen betrokkenen en
   gegevens, waarschijnlijke gevolgen, genomen en voorgenomen maatregelen, contactpunt.
4. **Betrokkenen informeren** — bij hoog risico: onverwijld, rechtstreeks (e-mail +
   platformnotificatie), in duidelijke taal: wat er is gebeurd, wat de gevolgen kunnen
   zijn, wat wij doen, wat de betrokkene zelf kan doen (bv. wachtwoord wijzigen).
5. **Registreren (altijd, ook bij niet-melden)** — elk datalek in het interne
   datalekregister: datum, omschrijving, beoordeling, wel/niet gemeld + motivering,
   maatregelen. Het register is opvraagbaar door de AP.
6. **Evalueren** — structurele oorzaak wegnemen; zo nodig ADR + backlog-item.

## 4. Verwerkers

Verwerkersovereenkomsten met sub-verwerkers (hosting, opslag, e-mail, betaalprovider,
routing) verplichten hen een inbreuk **onverwijld** aan ons te melden. Waar het platform
zelf verwerker is (namens een opdrachtgever), melden wij onverwijld aan die
verantwoordelijke en ondersteunen wij diens meldplicht.

## 5. Intern datalekregister

Locatie: bijgehouden door de incidentcoördinator (buiten git; bevat persoonsgegevens).
Minimaal per regel: datum ontdekking · omschrijving · categorieën gegevens/betrokkenen ·
risicobeoordeling · AP-melding (ja/nee + datum + motivering) · betrokkenen geïnformeerd
(ja/nee + datum) · maatregelen.
