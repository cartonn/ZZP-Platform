# DESIGN.md — ZZP Platform

Het canonieke, agent-leesbare designsysteem. Lees dit vóór elke UI-wijziging; het houdt het
platform op **top-1% SaaS-niveau** (Linear / Stripe / Vercel / Mercury). Drift = bug.

Bron van waarheid voor de implementatie: `src/app/globals.css` (tokens), `tailwind.config.ts`
(mapping) en `src/components/ui/` (primitives). Dit document beschrijft wat dáár staat — wijk je af,
werk beide bij.

> Taalregels (hard): UI = Nederlands, code = Engels. Het woord **"AI"** komt NERGENS voor in UI,
> teksten, comments of docs. Geld = **integer centen** in data, formatteren in de view. Zie `CLAUDE.md`.

---

## 1. Visual theme — "Definitief" (510 + 412 + 324)

De eigenaar koos op 29-7-2026 definitief voor de synthese van drie labconcepten (zie
`docs/ontwerpen/definitief.html`, klikbaar prototype in `docs/ontwerpen/prototype.html` en het
uitrolplan in `docs/ontwerpen/UITROLPLAN.md`): **510 Waarmerk** levert het verhaal (vertrouwen als
held: zegelgroen als gezagskleur, vertrouwensring, waarmerk-motieven), **412 Salon** de huid
(warm ivoorpapier, terracotta als menselijk accent, gastvrije microcopy) en **324 Zephyr** het
skelet (hoge dichtheid, hairline-discipline, de "wat vraagt nu je aandacht"-lijst). Drie regels
dragen de taal: het zegel draagt het merk (verificatie = het product), cijfers zijn typografie
(alles in mono), en eerlijkheid is premium (matchredenen tonen óók de minpunten). Hoge
informatiedichtheid zonder rommel. **Dashboard-first**: elke pagina beantwoordt direct _wat is de
status, wat moet ik nu doen, kan ik dit vertrouwen?_ Geen marketinghomepage als hoofdscherm, geen
decoratieve gradients, geen kaart-in-kaart, geen templategevoel. Scanbare rijen boven sparse
kaarten voor collecties.

**Kern-taal + pagina-signatuur.** De tokens/typografie/primitives hieronder lopen overal door;
daarbovenop krijgt elk paginacluster één eigen motief + held-element (verificatie = het zegel,
facturen = het grootboek, inzicht = het observatorium, …) — nooit 1-op-1 hetzelfde scherm.
De volledige cluster-mapping staat in `docs/ontwerpen/UITROLPLAN.md` §2.

**Dark mode** is een gebruikerskeuze (ThemeToggle), geen geforceerde dark-first. Light is standaard.
Tailwind `darkMode: "class"`, donkere tokenwaarden in `.dark { … }`, no-flash-script in
`layout.tsx`, pure logica in `src/lib/theme.ts`. Tokens zijn semantisch → componenten werken in beide
thema's zonder wijziging.

---

## 2. Kleur (tokens)

Alle kleuren zijn **HSL-triples in CSS-variabelen** (`hsl(var(--token))`), zodat één set semantische
namen in licht én donker draait. **Nooit hardcoded hex in componenten** — gebruik de
semantische token via Tailwind (`bg-primary`, `text-muted-foreground`, …).

### Semantische tokens (palet "Definitief", light)

| Token                                | HSL                           | Rol                                 |
| ------------------------------------ | ----------------------------- | ----------------------------------- |
| `--background`                       | `39 55% 95%`                  | warm ivoorpapier (canvas, 412)      |
| `--foreground`                       | `34 17% 13%`                  | warme inkt (hoofdtekst)             |
| `--muted`                            | `40 40% 91%`                  | subtiel vlak / hover                |
| `--muted-foreground`                 | `34 10% 40%`                  | subtekst (AA-veilig)                |
| `--card`                             | `45 78% 99%`                  | warm-wit vel (kaartvlak)            |
| `--border` / `--input`               | `40 34% 87%` / `40 28% 79%`   | randen / invoerranden               |
| `--ring`                             | `161 70% 28%`                 | focus-ring (merkkleur)              |
| `--primary` / `--primary-foreground` | `161 70% 28%` / `45 60% 98%`  | zegelgroen CTA / tekst erop (510)   |
| `--hero`                             | `161 55% 33%`                 | naam-hero (AA met witte tekst)      |
| `--accent` / `--accent-foreground`   | `150 30% 91%` / `161 55% 20%` | merk-tint-vlak / tekst              |
| `--success`                          | `155 55% 30%`                 | geverifieerd/actief (zegel-familie) |
| `--warning`                          | `16 55% 40%`                  | terracotta — vraagt aandacht (412)  |
| `--danger`                           | `4 68% 44%`                   | fout / destructief                  |
| `--radius`                           | `0.625rem`                    | basis-afronding                     |

### Eén palet, twee modi

Er is **één identiteit** in licht en donker; het vroegere keuzepaletten-systeem
(bloei / elektrisch-blauw + PaletteSwitcher) is bewust verwijderd — een merk wissel je niet
per gebruiker (ADR 0007). Donker is een gebruikerskeuze via de ThemeToggle; de donkere
waarden staan in `.dark { … }` in `globals.css` (groen-getint donker canvas, lichter zegelgroen).

Contrast is **WCAG AA**-geverifieerd (fg/bg, kaart, subtekst, knop, accent, rand).

### Regels

- **Eén accentkleur per context** voor CTA's (palette-`primary`). Geen kleurruis.
- De **match-score is de signatuur**: altijd `Badge variant="accent"` (merk-getint), nooit grijs.
- Statuskleuren betekenen iets (zie §7). `warning` ≠ lime/olijf (verwarbaar met success).
- **Kleur nooit als enige signaal** — altijd met label/icoon (toegankelijkheid).

---

## 3. Typografie

Drie lettertypen via `next/font` (zelfgehost, zie `layout.tsx`): **Figtree** (`--font-sans`, UI),
**Fraunces** (`--font-display`, serif — koppen en namen) en **JetBrains Mono** (`--font-mono`,
cijfers). Antialiased, `optimizeLegibility`. Cijfers zijn typografie: tarieven, scores, uren en
bedragen altijd in mono — dat is de precisie van het grootboek.

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

- **Seal** (`seal.tsx`) — hét vertrouwensteken: cirkel met dubbele ring + vinkje. Tonen:
  `verified` (zegelgroen), `brand`, `expiring` (amber, uitroepteken). Eén consistent zegel,
  geen losse vinkjes verzinnen.
- **MatchMeter** (`match-meter.tsx`) — 10 segmenten naast het percentage; altijd merk-getint.
  Logica getest in `src/lib/meter.ts`.
- **Sparkline** (`sparkline.tsx`) — kleine inline-trend in merkkleur (bv. omzet op het dashboard);
  schaal-logica getest in `src/lib/sparkline.ts`.
- **CascadeStepper** (`cascade-stepper.tsx`) — de keten contract → prestatie → factuur → betaling
  als horizontale stappen (done = zegelgroen, actief = merk-ring, fout = danger).
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

**Gelaagde elevatie** (Pastel Elevated): crisp border + `shadow-card` — een fijne contactschaduw
plus een wijdere, lage-opacity blauw-getinte ambient (zie `.shadow-card` in globals.css). Tilt
kaarten van het canvas; premium, niet vlak. De `Card`-primitive past `shadow-card` automatisch toe;
losse tegels (KpiTile/GaugeRing/StatCard) ook. Klikbare rijen/cards (`.card-interactive`) krijgen op
hover lichte extra elevatie (`hover:shadow-card`) + `bg-muted/40`, geen schaal. Zwaardere niveaus
(`shadow-lg`/`shadow-xl`) blijven voorbehouden aan overlays (drawer, dialog, command-palette).

---

## 7. Interactie, states & status-taal

- **"Aan zet"-principe.** Elke rol ziet bovenaan glashelder wat er nú van hém/haar wordt verwacht
  ("2 urenstaten wachten op je goedkeuring"). Gevoed door de next-action-engine. Geen zoeken.
- **Actie-kleur = merkkleur (diep oranje).** Alles wat een handeling van de gebruiker vraagt draagt de
  `primary`-merkkleur: de next-action-engine-toon `attention`, de "Aan zet"-signalen, de
  "vraagt actie"-telbadges in de zijbalk en de actieve cascade-stap. Gebruik `text-primary` /
  `bg-primary/10` (of `Badge variant="accent"` voor een chip). Dit is **niet** hetzelfde als de
  status-`warning` (amber): die beschrijft de **toestand** van een object (ingediend / verloopt), niet
  een persoonlijke call-to-action. Eén regel: _"jij moet iets doen" → oranje; "dit is de status" → statuskleur._
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
