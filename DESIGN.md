# DESIGN.md — ZZP Platform

Het canonieke, agent-leesbare designsysteem. Lees dit vóór elke UI-wijziging; het houdt het
platform op **top-1% SaaS-niveau** (Linear / Stripe / Vercel / Mercury). Drift = bug.

Bron van waarheid voor de implementatie: `src/app/globals.css` (tokens), `tailwind.config.ts`
(mapping) en `src/components/ui/` (primitives). Dit document beschrijft wat dáár staat — wijk je af,
werk beide bij.

> Taalregels (hard): UI = Nederlands, code = Engels. Het woord **"AI"** komt NERGENS voor in UI,
> teksten, comments of docs. Geld = **integer centen** in data, formatteren in de view. Zie `CLAUDE.md`.

---

## 1. Visual theme — "Vakwerk"

Refined minimalism met een eigen identiteit (zie `docs/ontwerpen/VAKWERK.md` +
`docs/ontwerpen/vakwerk.html`): **pastelblauw papier** als canvas, **witte vellen** (kaarten),
**klein-blauw** als merkkleur en **zegelgroen** voor geverifieerd. Drie regels dragen de taal:
het zegel draagt het merk (verificatie = het product), cijfers zijn typografie (alles in mono),
en eerlijkheid is premium (matchredenen tonen óók de minpunten). Hoge informatiedichtheid zonder
rommel. **Dashboard-first**: elke pagina beantwoordt direct _wat is de status, wat moet ik nu doen,
kan ik dit vertrouwen?_ Geen marketinghomepage als hoofdscherm, geen decoratieve gradients, geen
kaart-in-kaart, geen templategevoel. Scanbare rijen boven sparse kaarten voor collecties.

**Dark mode** is een gebruikerskeuze (ThemeToggle), geen geforceerde dark-first. Light is standaard.
Tailwind `darkMode: "class"`, donkere tokenwaarden in `.dark { … }`, no-flash-script in
`layout.tsx`, pure logica in `src/lib/theme.ts`. Tokens zijn semantisch → componenten werken in beide
thema's zonder wijziging.

---

## 2. Kleur (tokens)

Alle kleuren zijn **HSL-triples in CSS-variabelen** (`hsl(var(--token))`), zodat één set semantische
namen in licht én donker draait. **Nooit hardcoded hex in componenten** — gebruik de
semantische token via Tailwind (`bg-primary`, `text-muted-foreground`, …).

### Semantische tokens (standaard-palette "Vakwerk", light)

| Token                                | HSL                           | Rol                              |
| ------------------------------------ | ----------------------------- | -------------------------------- |
| `--background`                       | `216 42% 97%`                 | pastelblauw papier (canvas)      |
| `--foreground`                       | `228 20% 11%`                 | inkt (hoofdtekst)                |
| `--muted`                            | `217 32% 93%`                 | subtiel vlak / hover             |
| `--muted-foreground`                 | `226 12% 40%`                 | subtekst (AA-veilig)             |
| `--card`                             | `0 0% 100%`                   | wit vel (kaartvlak)              |
| `--border` / `--input`               | `218 24% 89%` / `218 24% 86%` | randen / invoerranden            |
| `--ring`                             | `227 82% 55%`                 | focus-ring (merkkleur)           |
| `--primary` / `--primary-foreground` | `227 82% 55%` / `0 0% 100%`   | royaalblauw CTA / tekst erop     |
| `--accent` / `--accent-foreground`   | `226 96% 95%` / `227 66% 42%` | merk-tint-vlak / tekst           |
| `--success`                          | `155 75% 27%`                 | zegelgroen — geverifieerd/actief |
| `--warning`                          | `36 90% 36%`                  | let op / verloopt                |
| `--danger`                           | `0 64% 44%`                   | fout / destructief               |
| `--radius`                           | `0.75rem`                     | basis-afronding                  |

### Eén palet, twee modi

Er is **één identiteit** (Vakwerk) in licht en donker; het vroegere keuzepaletten-systeem
(bloei / elektrisch-blauw + PaletteSwitcher) is bewust verwijderd — een merk wissel je niet
per gebruiker (ADR 0007). Donker is een gebruikerskeuze via de ThemeToggle.

Contrast is **WCAG AA**-geverifieerd (fg/bg, kaart, subtekst, knop, accent, rand).

### Regels

- **Eén accentkleur per context** voor CTA's (palette-`primary`). Geen kleurruis.
- De **match-score is de signatuur**: altijd `Badge variant="accent"` (merk-getint), nooit grijs.
- Statuskleuren betekenen iets (zie §7). `warning` ≠ lime/olijf (verwarbaar met success).
- **Kleur nooit als enige signaal** — altijd met label/icoon (toegankelijkheid).

---

## 3. Typografie

Drie lettertypen via `next/font` (zelfgehost, zie `layout.tsx`): **Inter** (`--font-sans`, UI),
**Schibsted Grotesk** (`--font-display`, koppen) en **JetBrains Mono** (`--font-mono`, cijfers).
Antialiased, `optimizeLegibility`. Cijfers zijn typografie: tarieven, scores, uren en bedragen
altijd in mono — dat is de Vakwerk-precisie.

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

### Vakwerk-signatuurcomponenten

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
