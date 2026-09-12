# DESIGN.md — ZZP Platform

Het canonieke, agent-leesbare designsysteem. Lees dit vóór elke UI-wijziging; het houdt het
platform op **top-1% SaaS-niveau** (Linear / Stripe / Vercel / Mercury). Drift = bug.

Bron van waarheid voor de implementatie: `src/app/globals.css` (tokens), `tailwind.config.ts`
(mapping) en `src/components/ui/` (primitives). Dit document beschrijft wat dáár staat — wijk je af,
werk beide bij.

> Taalregels (hard): UI = Nederlands, code = Engels. Het woord **"AI"** komt NERGENS voor in UI,
> teksten, comments of docs. Geld = **integer centen** in data, formatteren in de view. Zie `CLAUDE.md`.

---

## 1. Visual theme — Handslag V5

De eigenaar heeft op 10-9-2026 gevraagd de goedgekeurde V5-landingspagina door te trekken
naar het platform: helder blauw, witte werkvlakken, het originele terracotta handenlogo,
Open Sans en voelbare maar rustige diepte. Dit vervangt de eerdere groene/ivoren richting.
De primaire taak blijft centraal staan: wat vraagt aandacht, wat is de status en waar ga ik verder?

Het canvas ligt onder de werkvlakken; knoppen en de actieve navigatie liggen iets hoger.
Alleen navigatie en overlays zweven. Geen parallax of scroll-animaties op werkgegevens.
De hoofdpagina heeft één natuurlijke documentscroll. Op mobiel staan volgende acties vóór
cijfers en collecties; op breed beeld staan ze ernaast. Een mobiele dock toont uitsluitend
de eerste vier toegestane, actieve items uit de bestaande rolnavigatie.

Donker blijft een gebruikerskeuze, met dezelfde blauwe identiteit en zelfstandige statuskleuren.
Tenant-branding en de bestaande autorisatie blijven intact.

---

## 2. Kleur (tokens)

Alle kleuren zijn **HSL-triples in CSS-variabelen** (`hsl(var(--token))`), zodat één set semantische
namen in licht én donker draait. **Nooit hardcoded hex in componenten** — gebruik de
semantische token via Tailwind (`bg-primary`, `text-muted-foreground`, …).

### Semantische tokens

De volledige waarden staan in `src/app/globals.css`. Licht: blauwgetint canvas
(`202.5 61.538462% 94.901961%`), donkerblauwe tekst (`198.782609 100% 22.54902%`),
witte kaarten, primaire acties (`197.857143 100% 32.941176%`) en terracotta merktekens
(`14.769231 63.106796% 59.607843%`): exact de lichte landingwaarden. Donker gebruikt hetzelfde
palet met een donker canvas en lichte blauwe acties. Statuskleuren blijven apart:
groen voor succes, amber voor wachten, rood voor fouten. Terracotta is een merkaccent,
geen tekstkleur voor kleine tekst op wit.

### Regels

- **Eén accentkleur per context** voor CTA's (palette-`primary`). Geen kleurruis.
- De **match-score is de signatuur**: altijd `Badge variant="accent"` (merk-getint), nooit grijs.
- Statuskleuren betekenen iets (zie §7). `warning` ≠ lime/olijf (verwarbaar met success).
- **Kleur nooit als enige signaal** — altijd met label/icoon (toegankelijkheid).

---

## 3. Typografie

**Open Sans** is lokaal gebundeld (`src/app/fonts/open-sans-latin.woff2`) voor zowel UI
als koppen. `--font-display` verwijst naar `--font-sans`. Koppen hebben gewicht 800;
**JetBrains Mono** blijft behouden voor bedragen, uren en andere cijfers.

| Rol                   | Klassen                                                                    |
| --------------------- | -------------------------------------------------------------------------- |
| Paginatitel (h1)      | `font-display text-2xl font-semibold tracking-tight`                       |
| Paginasubtitel        | `text-sm text-muted-foreground`                                            |
| Sectiekop (h2)        | `text-sm font-semibold tracking-tight`                                     |
| Body                  | `text-sm`                                                                  |
| Metadata / timestamps | `.metadata-row` (`text-xs text-muted-foreground`)                          |
| Cijfers / bedragen    | `font-mono` (+ `tracking-tight` bij grote KPI-cijfers)                     |
| KPI-label             | `text-[11px] font-semibold uppercase tracking-wider text-muted-foreground` |

---

## 4. Componenten (`src/components/ui/`)

Bouw nieuwe UI met deze primitives. Voeg geen ad-hoc varianten per pagina toe — breid de primitive uit.

- **Button** — varianten `primary` (gevuld), `secondary` (rand), `ghost`, `destructive` (discreet:
  rand + rode tekst, vult pas rood op hover), `danger` (solide rood, **alleen** in
  bevestigingsdialogen). Maten `xs`/`sm`/`md`. `rounded-lg`, `focus-ring`, `hover:shadow-sm`,
  `active:translate-y-px`. **Max. één gevulde `primary` per context**; destructief inline = `destructive`.
- **Badge** — `default` · `muted` · `accent` (merk-getint, voor match/highlight) · `success` ·
  `warning` · `danger`. `rounded-full px-2.5 py-0.5 text-xs font-medium`.
- **Card** — `rounded-lg border border-border bg-card shadow-sm` (subtiele diepte). `CardContent p-5`,
  `CardHeader px-5 py-4 border-b`.
- **Input/Select/Textarea** — `rounded-lg h-10 border border-input px-3`, zichtbare `focus-ring`,
  touch target ≥ 40px, labels via `Field`.
- **Lijsten (canoniek rij-patroon)** — scanbare collecties: één `divide-y`-container, geen losse
  kaarten per item:
  ```
  <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-sm">
    <Link className="card-interactive flex items-center justify-between gap-4 px-5 py-3.5">
      <div className="min-w-0"><p className="truncate font-medium">…</p><p className="metadata-row mt-0.5">…</p></div>
      <div className="flex shrink-0 items-center gap-3">…badges + <ChevronRight/></div>
    </Link>
  </div>
  ```
  Actie-zware item-beheer (bv. certificaten met inline forms) mag wél `Card` per item.
- **EmptyState** / **Skeleton** — gebruik de gedeelde componenten voor lege/laad-staten.

### Signatuurcomponenten

- **Seal** (`seal.tsx`) — hét vertrouwensteken: het originele handenlogo, bij goedkeuring
  in een dubbele zegelring. Tonen: `pending` (zwart), `verified` (oranje), `brand`,
  `expiring` (amber, uitroepteken). Eén consistent zegel,
  geen losse vinkjes verzinnen.
- **MatchMeter** (`match-meter.tsx`) — 10 segmenten naast het percentage; altijd merk-getint.
  Logica getest in `src/lib/meter.ts`.
- **Sparkline** (`sparkline.tsx`) — kleine inline-trend in merkkleur (bv. omzet op het dashboard);
  schaal-logica getest in `src/lib/sparkline.ts`.
- **CascadeStepper** (`cascade-stepper.tsx`) — de keten contract → prestatie → factuur → betaling
  als horizontale stappen (done = merkblauw, actief = merk-ring, fout = danger).
- **TurnBanner** (`turn-banner.tsx`) — de "aan zet"-banier: inkt op papier (klapt om in donker),
  pulserend merkpunt, één boodschap, max. één actie. **Maximaal één per pagina.**
- **Table** (`table.tsx`) — canonieke tabel (`Table/THead/TBody/TR/TH/TD`); cijferkolommen met
  `numeric` (rechts, mono). Geen handgerolde tabellen meer per pagina.

---

## 5. Layout & spacing

- **4px-basisschaal** (Tailwind). Paginasecties `space-y-6`, grids `gap-4`.
- **Canonieke containerbreedtes** (`mx-auto`), één per context:
  - Dashboard / command-center → `max-w-5xl`
  - Collectie / overzicht / data → `max-w-4xl`
  - Formulier / detail / lezen → `max-w-2xl`
- **Sidebar** (16rem, `bg-card` — een wit vel op het pastel canvas): gegroepeerd in semantische
  secties met subtiele uppercase koppen, geordend naar werkstroom (Werk · Profiel · Financieel ·
  Account / Operatie · Toezicht · Beheer). Header eveneens `bg-card`.
- **Header** (h-14): zoek-pill met ⌘K-hint links, palette/dark-toggle, notificaties, rol rechts.
- Lange formulieren: opdelen in zichtbare secties (`h2`-kop + korte uitleg + `border-b`-scheiding).

---

## 6. Diepte & elevatie

De centrale tokens zijn `--depth-contact`, `--depth-surface`, `--depth-raised` en
`--depth-floating`, met eigen donkere waarden. `shadow-card` gebruikt de oppervlakteschaduw.
Knoppen krijgen een voelbare onderrand; hover lift maximaal 2px en alleen bij een fijne
pointer met hover. Touch heeft een drukstand. Rijen blijven stabiel en krijgen een achtergrondaccent.
Alle componenten respecteren `prefers-reduced-motion`. De gedeelde uitwerking staat in
`src/app/handslag-workspace.css`; breid deze bron uit in plaats van paginavarianten te stapelen.

---

## 7. Interactie, states & status-taal

- **"Aan zet"-principe.** Elke rol ziet bovenaan glashelder wat er nú van hém/haar wordt verwacht
  ("2 urenstaten wachten op je goedkeuring"). Gevoed door de next-action-engine. Geen zoeken.
- **Actie-kleur = merkkleur (blauw).** Alles wat een handeling van de gebruiker vraagt draagt de
  `primary`-merkkleur: de next-action-engine-toon `attention`, de "Aan zet"-signalen, de
  "vraagt actie"-telbadges in de zijbalk en de actieve cascade-stap. Gebruik `text-primary` /
  `bg-primary/10` (of `Badge variant="accent"` voor een chip). Dit is **niet** hetzelfde als de
  status-`warning` (amber): die beschrijft de **toestand** van een object (ingediend / verloopt), niet
  een persoonlijke call-to-action. Eén regel: _"jij moet iets doen" → blauw; "dit is de status" → statuskleur._
- **Statushelderheid — één badge-taal** over álle objecten (opdracht/contract/urenstaat/factuur/betaling):

  | Toestand                                              | Token              |
  | ----------------------------------------------------- | ------------------ |
  | concept / verwacht                                    | `muted`            |
  | ingediend / ter goedkeuring / gemarkeerd              | `warning`          |
  | goedgekeurd / actief / getekend / bevestigd / betaald | `success`          |
  | afgekeurd / te laat / gecrediteerd                    | `danger`           |
  | afgerond / gearchiveerd                               | `muted-foreground` |

- **Cascade zichtbaar.** Toon de keten ("deze factuur volgt uit goedgekeurde urenstaat Y / contract X"),
  herleidbaar tot de opdracht.
- **Rechtstreekse betaling expliciet.** UI communiceert dat betaling buiten het platform om gaat; het
  platform houdt alleen status bij (Besluit 1). Geld via het werkproces gaat nooit via het platform.
- **DBA-signalen** rustig, niet-alarmerend, altijd met disclaimer — nooit als juridisch oordeel.
- **Loading/error/empty overal.** Tekst valt nooit buiten knoppen/cards.
- **Focus zichtbaar** (`focus-ring`, `.card-interactive` focus-visible); toetsenbord-navigatie werkt.
- **Server-side waarheid** — de UI reflecteert de server; de client beslist nooit. Destructieve acties
  discreet tot bevestiging (bevestigingsdialoog = de plek voor solide `danger`).
- `prefers-reduced-motion` gerespecteerd.

---

## 8. Responsive

- < `md`: sidebar → mobiele nav; zoek-pill → compact icoon; rijen/tabellen → gestapelde kaarten.
- Touch targets ruim; geen hover-only affordances zonder tap-equivalent. Print: factuur/detail printbaar.

---

## 9. Do's & Don'ts

**Do** — hergebruik primitives (breid uit, herbouw niet per pagina) · één canonieke breedte per context ·
één gevulde primaire actie per scherm · match-score als `accent`-signatuur · statuskleuren met betekenis ·
server-side waarheid · loading/error/empty overal.

**Don't** — geen hardcoded hex · geen ad-hoc knop/badge-varianten · geen inline solide-rode destructieve
knoppen · geen zes verschillende containerbreedtes · geen sparse kaarten waar een dichte rij hoort ·
geen decoratieve gradients / kaart-in-kaart / templategevoel · **NOOIT het woord "AI"** in UI/tekst/comments.

---

## 10. Agent-prompt (UI-generatie)

> Bouw de UI met de bestaande primitives in `src/components/ui/` en de semantische tokens uit
> `src/app/globals.css` (`bg-primary`, `text-muted-foreground`, … — nooit hex). Volg de
> containerbreedte van de context (dashboard 5xl / collectie 4xl / formulier-detail 2xl). Gebruik voor
> collecties het `divide-y` rij-patroon, de match-score als `Badge variant="accent"`, en destructieve
> acties als `Button variant="destructive"`. Elke view krijgt loading/error/empty. UI in het
> Nederlands; het woord "AI" nergens.

## 11. Publieke Handslag-landingspagina (7 september 2026)

Op expliciet verzoek van de eigenaar heeft Handslag een zelfstandige publieke
landingspagina op /. Het ingelogde platform blijft dashboard-first op /dashboard;
de overige toegangsregels wijzigen niet.

De pagina gebruikt de bestaande kleurvariabelen, Figtree, Fraunces en BrandMark.
De eigen compositie in `src/app/landing.module.css` is redactioneel: een echte foto,
royale typografie, dunne scheidingslijnen en inhoudelijke rijen voor de twee doelgroepen.
Dit is de bewuste uitzondering op de compacte platformlayouts uit paragrafen 1 en 5.
Een doorlopende, uitklapbare uitleg verbindt opdracht, afspraken, uren en factuur.

Fotografie: [Dulcey Lima, Mom's hands with mine](https://unsplash.com/photos/9MTqeBaAOlU),
[Unsplash License](https://unsplash.com/license), gecontroleerd op 7 september 2026.
De foto is illustratief; zij toont geen klant of endorsement van Handslag.
Next Image optimaliseert uitsluitend deze toegestane fotobron en serveert de afbeelding
via de eigen origin. De bronvermelding staat bij de foto. Geen externe fonts of scripts.

Geen verzonnen klantlogo’s, aantallen, reviews, certificeringen of betaalgaranties.
De uitleg vermeldt rechtstreekse betaling en de gefaseerde ingebruikname.
Native links en details werken zonder extra clientscript. Zichtbare focus, ruime
klikvlakken, mobiele navigatie en verminderde beweging blijven onderdeel van het ontwerp.

## Public Handslag V5 landing

The approved V5 homepage scopes its semantic HSL palette in
`src/components/landing/handslag-palette.css`. It preserves the approved white/blue
light design regardless of the device or saved `.dark` preference, as requested
by the owner on 11 September 2026. The landing does not overwrite the saved app theme. Logo accents stay terracotta; action buttons retain light text on blue.
This scope also covers the landing viewport gutter and is removed on app navigation.
The protected application uses the V5 workspace palette and retains its saved light/dark preference.
Audience choices are server-derived query-parameter links, usable without scripts.

## Goedkeuring — eigenaarsspecificatie 10-9-2026

Het originele tweehandslogo is zwart zolang een item op beoordeling of ondertekening wacht.
Na goedkeuring, verificatie of ondertekening wordt het oranje, met een dubbele zegelring.
`Badge approval="pending" | "approved"` koppelt het teken aan het bestaande statuslabel.
Gebruik `approvalMark` met de effectieve serverstatus, nooit op basis van tekst of alleen
success/warning-kleuren. Verlopen, afgewezen, betwiste of ingetrokken items krijgen geen
oranje goedkeuringszegel. Algemeen actief, gepubliceerd, betaald en technische gezondheid
zijn op zichzelf geen goedkeuring. Zwart blijft ook in donkere modus zwart op een licht
ondervlak. Oranje is het merkaccent van het zegel; kleine statuslabels blijven leesbaar.
