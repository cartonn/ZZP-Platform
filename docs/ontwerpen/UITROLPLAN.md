# Uitrolplan definitief ontwerp — één taal, elke pagina zijn eigen gezicht

> Status: **keuze definitief (29-7-2026): combinatie 510 + 412 + 324** — bevestigd door
> de eigenaar ("vertrouwen, een warme uitstraling en een duidelijke actielijst").
> De samengesmolten identiteit staat in `docs/ontwerpen/definitief.html`
> (tokens, typografie, dashboard-mockup, signatuur-voorbeelden). Uitrol start met PR 1.
>
> Principe van de eigenaar (29-7-2026): _"elke pagina zijn eigen ontwerp waarvan de
> hoofdontwerp doorloopt, maar niet 1-op-1. De Inzicht-pagina heeft dezelfde kleuren
> en designprincipes als het hoofdontwerp, maar een eigen ontwerp dat over inzicht gaat."_

---

## 1. Hoe dit werkt: kern-taal + pagina-signatuur

**De kern-taal** (loopt overal door, verandert nooit per pagina):

- kleurtokens (`globals.css` CSS-variabelen: achtergrond, ink, accent, succes/waarschuwing/gevaar)
- typografieschaal en fontrollen (display / tekst / mono voor cijfers)
- radius, hairlines, schaduw-discipline, spacing-ritme
- statusbadge-taal (label + icoon, nooit kleur alleen)
- de vaste primitives: navigatie, tabellen, formulieren, empty/loading/error-states

**De pagina-signatuur** (per pagina anders, altijd binnen de kern-taal):

- één **motief** dat vertelt wat de pagina _is_ (het zegel op Verificatie, het
  grootboek op Facturen, het observatorium op Inzicht)
- één **held-element** bovenaan: het antwoord op "wat is hier de status en wat moet ik nu?"
- een eigen **koptekst-behandeling** (eyebrow + titelvorm) die het motief draagt
- hooguit één signatuur-visual per pagina; de rest blijft rustig en gedeeld

Regel: een bezoeker herkent op elke pagina direct hetzelfde platform (kleur, type,
toon), maar voelt óók direct op welke pagina hij is — zonder de navigatie te lezen.

---

## 2. Pagina-signaturen per cluster (alle routes)

| Cluster                      | Routes                                                                                 | Motief ("eigen ontwerp")                                                                                                             | Held-element                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| **Dashboard**                | `/dashboard`                                                                           | _De dagstart_ — begroeting, de dag in één oogopslag                                                                                  | Volgende-beste-actie + vertrouwensniveau                           |
| **Verificatie & vertrouwen** | `/certificaten`, `/documenten`, `/admin/verificaties`, `/vertrouwen/[..]`              | _Het zegel_ — waarmerk-motieven, provenance-tijdlijn van elke beslissing                                                             | Vertrouwensring (x van y gewaarmerkt) + eerstvolgende verloopdatum |
| **Inzicht & cijfers**        | `/inzicht`, `/prestaties`, `/prognose`                                                 | _Het observatorium_ — data als landschap: grote rustige grafieken, één inzicht per sectie in woorden ("je omzet groeit 12%")         | Eén kern-inzicht in tekst, gedragen door één grote grafiek         |
| **Marktplaats**              | `/opdrachten`, `/freelancers`, `/kandidaten(/vergelijk)`, `/favorieten`, `/opgeslagen` | _De etalage_ — aanbod met verklaarbare match-ringen, filters die verdwijnen als ze niet nodig zijn                                   | Beste match uitgelicht, met de redenen zichtbaar                   |
| **Opdracht-detail**          | `/opdrachten/[id]`, `/reacties`                                                        | _Het dossier_ — alles over één opdracht in één kolomritme, status als rode draad                                                     | Statusregel + wat er nú van jou wordt verwacht (TurnBanner)        |
| **Acties & verplichtingen**  | `/acties`, `/openstaand`, `/verplichtingen`, `/notificaties`                           | _De werklijst_ — één geordende lijst met urgentie-labels, afvinkbaar, leeg = compliment                                              | Bovenste actie groot, de rest compact                              |
| **Berichten**                | `/berichten(/*)`                                                                       | _Het gesprek_ — twee-koloms rust, focus op de draad, contextpaneel met opdracht/status                                               | Ongelezen + antwoord-verwachting                                   |
| **Geld**                     | `/facturen(/*)`, `/financien`, `/administratie`, `/ontzorgd(/*)`, `/abonnement`        | _Het grootboek_ — tabulaire cijfers, hairline-regels, saldo-discipline; betrouwbaarheid ademt uit elke rij                           | Openstaand bedrag + eerstvolgende betaal-/aangiftedatum            |
| **Tijd**                     | `/rooster`, `/beschikbaarheid`, `/diensten(/*)`                                        | _Het weefsel_ — de week als raster, beschikbaar/bezet als rustige vlakken, geen kalender-drukte                                      | Deze week in één balk + eerstvolgende dienst                       |
| **Samenwerkingen**           | `/samenwerkingen(/*)`                                                                  | _Het samenspel_ — de cascade (akkoord → uren → factuur → betaling) als stappenlijn                                                   | CascadeStepper: waar staat deze samenwerking nu                    |
| **Academie**                 | `/academie(/*)`                                                                        | _Het leerboek_ — redactionele rust, leesbreedte, voortgang als ingetogen lijn                                                        | Waar je gebleven was + volgende les                                |
| **Identiteit**               | `/profiel(/*)`, `/bedrijf(/*)`, `/account(/*)`, `/zzp/[id]`                            | _Het paspoort_ — wie ben je, wat is geverifieerd; het publieke profiel is het visitekaartje van het waarmerk                         | Compleetheid + wat een opdrachtgever ziet                          |
| **Franchise**                | `/franchise/*`                                                                         | _De bemiddelaarscockpit_ — portfolio-overzicht: leads, zzp'ers, opdrachtgevers als rustige kaartrijen met dezelfde grootboek-cijfers | Wat vraagt vandaag bemiddeling                                     |
| **Admin**                    | `/admin/*`                                                                             | _De controlekamer_ — soberste signatuur: dichtere tabellen, systeemtinten, geen decoratie; queues met wachttijd als eerste kolom     | Oudste wachtende item per queue                                    |
| **Support & ideeën**         | `/support(/*)`, `/ideeen`                                                              | _Het loket_ — menselijke toon, duidelijke verwachting (reactietijd), status per ticket                                               | Openstaande tickets + verwachte reactietijd                        |
| **Auth & poorten**           | `/login`, `/register`, `/wachtwoord-*`, `/geschorst`, `/`                              | _De voordeur_ — het merk in zijn puurste vorm: één kaart, het waarmerk-beeldmerk, nul afleiding                                      | Eén formulier, één boodschap                                       |

**Bewerk-/formulier-pagina's** (`/*/bewerken`, `/*/nieuw`): geen eigen motief — zij
erven de signatuur van hun cluster in de kop, en gebruiken verder uitsluitend de
gedeelde formulier-primitives. Formulieren zijn nooit het moment voor identiteit.

---

## 3. Technische voorbereiding (staat klaar)

1. **Tokens als enige kleurbron.** De keuze wordt vertaald naar de bestaande
   CSS-variabelen in `src/app/globals.css` (+ `tailwind.config.ts` raakt niet aan
   namen). Componenten kennen geen hexwaarden; de omschakeling is één tokenlaag.
2. **Signatuur = component, geen fork.** Per cluster één
   `src/components/signature/<cluster>.tsx` (bv. `SealHeader`, `LedgerHeader`,
   `ObservatoryHeader`) die kop + motief + held-element draagt. Pagina's blijven
   dezelfde data tonen; alleen de signatuurlaag verschilt.
3. **Bestaande signatuur-primitives hergebruiken:** `Seal`, `MatchMeter`,
   `Sparkline`, `CascadeStepper`, `TurnBanner`, `Table` — deze krijgen de nieuwe
   tokens gratis mee.
4. **Fontrollen via `next/font`** in `src/app/layout.tsx`; de keuze bepaalt alleen
   wélke families in de drie rollen (display/tekst/mono) komen.
5. **DESIGN.md wordt bijgewerkt** met de gekozen taal + dit signatuur-principe;
   daarna geldt: drift = bug.

## 4. Uitrolvolgorde (kleine PR's, elk CI-groen)

1. **PR 1 — Fundament:** tokens + fonts + DESIGN.md (geen zichtbare herbouw).
2. **PR 2 — Dashboard + Acties** (de dagstart en de werklijst — meest gezien).
3. **PR 3 — Verificatie-cluster** (zegel-signatuur — de kerndifferentiatie).
4. **PR 4 — Marktplaats + opdracht-detail.**
5. **PR 5 — Geld-cluster** (grootboek-signatuur).
6. **PR 6 — Inzicht-cluster** (observatorium-signatuur).
7. **PR 7 — Tijd + samenwerkingen.**
8. **PR 8 — Identiteit + auth/poorten + publiek vertrouwensdossier.**
9. **PR 9 — Franchise-cockpit.**
10. **PR 10 — Admin-controlekamer + support/academie-restwerk.**

Elke PR: DoD-gates groen + e2e-screenshots als bewijs. Geen pagina half.

---

_Zodra de eigenaar het nummer of de combinatie doorgeeft, wordt sectie 3.1 ingevuld
met de concrete tokens/fonts van die keuze en start PR 1._
