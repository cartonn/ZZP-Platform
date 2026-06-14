# ADR-0008: Terminologie & informatie-architectuur — één canoniek begrippenkader

- **Status:** geaccepteerd
- **Datum:** 2026-06-14

## Context

De UI gebruikte domeinbegrippen niet consistent en twee termen waren overladen.

**Overload 1 — Opdracht vs. Dienst.** "Diensten" betekende bij de ZZP'er (`/diensten`) de
gewerkte diensten/urenstaten en bij de franchisenemer (`/franchise/diensten`) de nog in te vullen
diensten. Tegelijkertijd bestond "Opdracht" als term voor een losse werkvraag. De grens was nergens
vastgelegd.

**Overload 2 — Reactie vs. Kandidaat.** "Application" verscheen op sommige schermen als "Reactie"
en op andere als "Kandidaat", zonder dat het onderscheid uitgelegd was.

Termen stonden als losse hardcoded strings (vooral in `src/lib/nav.ts`), waardoor schermen
ongemerkt uiteen konden lopen. `docs/PLAN-WERELDKLASSE.md` Fase 2 vraagt om één begrippenkader,
vastgelegd als ADR, zodat de navlabels en toekomstige schermen hieruit putten.

## Besluit

Eén canoniek begrippenkader, vastgelegd als bron van waarheid in `src/lib/terminology.ts`
(`TERM` / `TERM_PLURAL` + helperfunctie `term()`). `src/lib/nav.ts` en toekomstige schermen
putten uit die constanten. Een vangrail-unit-test dwingt af dat de nav-labels niet van het kader
afdrijven.

### Canoniek glossarium

| Begrip (code-concept) | Canoniek NL (enkelvoud) | Meervoud       | Route                           | Toelichting                                              |
| --------------------- | ----------------------- | -------------- | ------------------------------- | -------------------------------------------------------- |
| job                   | Opdracht                | Opdrachten     | /opdrachten                     | De werkvraag/vacature van een opdrachtgever              |
| application           | Reactie                 | Reacties       | /reacties                       | Een ZZP'er reageert op een opdracht (ZZP'er-perspectief) |
| candidate             | Kandidaat               | Kandidaten     | /kandidaten                     | Dezelfde reactie, bezien vanuit de opdrachtgever         |
| collaboration         | Samenwerking            | Samenwerkingen | /samenwerkingen                 | Getekende samenwerking na een match                      |
| performance           | Prestatie               | Prestaties     | /prestaties                     | Ingediende uren/oplevering binnen een samenwerking       |
| shift                 | Dienst                  | Diensten       | /diensten · /franchise/diensten | Een concrete geplande/gewerkte dienst (shift)            |
| invoice               | Factuur                 | Facturen       | /facturen                       | —                                                        |
| action                | Actie                   | Acties         | /acties                         | Een openstaande next-action/taak                         |
| message               | Bericht                 | Berichten      | /berichten                      | —                                                        |
| credential            | Certificaat             | Certificaten   | /certificaten                   | —                                                        |
| document              | Document                | Documenten     | /documenten                     | —                                                        |

### Opgeloste overloads

1. **Opdracht ↔ Dienst** — aparte begrippen. Een _Opdracht_ is de werkvraag/vacature van een
   opdrachtgever. Een _Dienst_ is een concrete geplande of gewerkte dienst (shift) in de planning.
   De ZZP'er-`/diensten` (gewerkte diensten) en franchise-`/diensten` (in te vullen diensten)
   zijn hetzelfde begrip in verschillende levensfasen — beide terecht "Dienst".

2. **Reactie ↔ Kandidaat** — hetzelfde onderliggende `Application`-record, maar
   perspectief-afhankelijk. "Reactie" toont de ZZP'er zijn eigen reacties; "Kandidaat" is hoe de
   opdrachtgever diezelfde reacties ziet. Het onderscheid is bewust behouden (perspectief is
   betekenisvol), maar nu expliciet vastgelegd zodat toekomstige schermen niet willekeurig wisselen.

## Gevolgen

**Voordelen**

- Drift is onmogelijk: de vangrail-unit-test faalt als een nav-label afwijkt van de constanten.
- Schermen zijn consistent zonder dat elke ontwikkelaar het begrippenkader uit zijn hoofd kent.
- Onboarding van nieuwe contributors is eenvoudiger — één plek om te kijken.

**Kosten / grenzen**

- Alleen de navigatie (`src/lib/nav.ts`) is nu gewired op `src/lib/terminology.ts`. Overige
  schermen migreren incrementeel naar de constanten; hardcoded strings buiten nav zijn toegestaan
  tot ze aan de beurt zijn.
- De term-constanten dekken UI-labels (enkelvoud + meervoud) en routes. De volledige microcopy
  (helpteksten, notificaties, e-mail) valt buiten dit kader en volgt het glossarium als richtlijn,
  niet als afdwingbaar contract.

## Alternatieven

1. **Niets vastleggen, vertrouwen op conventie.** Heeft geleid tot de huidige overloads; verworpen.
2. **Centraal vertaalbestand (i18n-json).** Overkill voor een Nederlandstalige UI; voegt een
   abstractielaag toe die geen probleem oplost dat hier speelt. Kan later, als meertaligheid nodig
   is, bovenop de constanten worden geplaatst.
3. **Enum in de database.** Domeinbegrippen zijn UI-zorg, geen datamodel-zorg; architectuurregel 6
   raadt string-enums aan. Verworpen.
