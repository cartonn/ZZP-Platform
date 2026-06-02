# DESIGN.md — ZZP Platform

Het canonieke, agent-leesbare designsysteem. Lees dit vóór elke UI-wijziging; het houdt het
platform op **top-1% SaaS-niveau** (Linear / Stripe / Vercel / Mercury). Drift = bug.

Bron van waarheid voor de implementatie: `src/app/globals.css` (tokens), `tailwind.config.ts`
(mapping) en `src/components/ui/` (primitives). Dit document beschrijft wat dáár staat — wijk je af,
werk beide bij.

> Taalregels (hard): UI = Nederlands, code = Engels. Het woord **"AI"** komt NERGENS voor in UI,
> teksten, comments of docs. Geld = **integer centen** in data, formatteren in de view. Zie `CLAUDE.md`.

---

## 1. Visual theme

Refined minimalism — premium en rustig, niet druk, niet "wireframe". Hoge informatiedichtheid zonder
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
namen op light/dark × 3 palettes draait. **Nooit hardcoded hex in componenten** — gebruik de
semantische token via Tailwind (`bg-primary`, `text-muted-foreground`, …).

### Semantische tokens (standaard-palette, light)

| Token                                | HSL                         | Rol                          |
| ------------------------------------ | --------------------------- | ---------------------------- |
| `--background`                       | `0 0% 100%`                 | paginavlak                   |
| `--foreground`                       | `240 10% 4%`                | hoofdtekst                   |
| `--muted`                            | `240 5% 96%`                | subtiel vlak / hover         |
| `--muted-foreground`                 | `240 5% 40%`                | subtekst (AA-veilig)         |
| `--card`                             | `0 0% 100%`                 | kaartvlak                    |
| `--border` / `--input`               | `240 6% 90%`                | randen / invoerranden        |
| `--ring`                             | `240 5% 65%`                | focus-ring                   |
| `--primary` / `--primary-foreground` | `240 6% 10%` / `0 0% 98%`   | merk-CTA-vlak / tekst erop   |
| `--accent` / `--accent-foreground`   | `240 5% 96%` / `240 6% 10%` | zacht merk-tint-vlak / tekst |
| `--success`                          | `142 64% 38%`               | geslaagd / actief            |
| `--warning`                          | `35 92% 42%`                | let op / verloopt            |
| `--danger`                           | `0 72% 48%`                 | fout / destructief           |
| `--radius`                           | `0.5rem`                    | basis-afronding              |

### Palettes (orthogonaal aan light/dark, via `data-theme` op `<html>`)

Dezelfde tokennamen, dus geen component verandert.

- **standaard** — neutraal, monochroom; witte canvas in light.
- **bloei** — navy-slate merk; light = **licht-oranje** canvas, dark = navy fundament. `--radius: 0.75rem`.
- **elektrisch-blauw** — elektrisch-blauwe signatuur `#0066FF`; light = **licht-blauw** canvas, dark = navy fundament.

> Light-canvas-tint (optie 2/3) zit op de neutrale oppervlakken (background/card/muted/border/input);
> lichtheid blijft AA-veilig, merk-tokens en de donkere modus zijn ongewijzigd.

Contrast is **WCAG AA**-geverifieerd (fg/bg, kaart, subtekst, knop, accent, rand).

### Regels

- **Eén accentkleur per context** voor CTA's (palette-`primary`). Geen kleurruis.
- De **match-score is de signatuur**: altijd `Badge variant="accent"` (merk-getint), nooit grijs.
- Statuskleuren betekenen iets (zie §7). `warning` ≠ lime/olijf (verwarbaar met success).
- **Kleur nooit als enige signaal** — altijd met label/icoon (toegankelijkheid).

---

## 3. Typografie

Systeem-sans (`--font-sans`). Antialiased, `optimizeLegibility`.

| Rol                   | Klassen                                           |
| --------------------- | ------------------------------------------------- |
| Paginatitel (h1)      | `text-xl font-semibold tracking-tight`            |
| Paginasubtitel        | `text-sm text-muted-foreground`                   |
| Sectiekop (h2)        | `text-sm font-semibold tracking-tight`            |
| Body                  | `text-sm`                                         |
| Metadata / timestamps | `.metadata-row` (`text-xs text-muted-foreground`) |
| Cijfers / bedragen    | `tabular-nums`                                    |

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

---

## 5. Layout & spacing

- **4px-basisschaal** (Tailwind). Paginasecties `space-y-6`, grids `gap-4`.
- **Canonieke containerbreedtes** (`mx-auto`), één per context:
  - Dashboard / command-center → `max-w-5xl`
  - Collectie / overzicht / data → `max-w-4xl`
  - Formulier / detail / lezen → `max-w-2xl`
- **Sidebar** (16rem, `bg-muted/30`): gegroepeerd in semantische secties met subtiele uppercase
  koppen, geordend naar werkstroom (Werk · Profiel · Financieel · Account / Operatie · Toezicht · Beheer).
- **Header** (h-14): zoek-pill met ⌘K-hint links, palette/dark-toggle, notificaties, rol rechts.
- Lange formulieren: opdelen in zichtbare secties (`h2`-kop + korte uitleg + `border-b`-scheiding).

---

## 6. Diepte & elevatie

Vlak met crisp borders + **één** subtiele schaduwlaag (`shadow-sm` op cards). Geen zware schaduwen,
geen gestapelde niveaus. Hover op klikbare rijen/cards = `bg-muted/40` (`.card-interactive`), geen schaal.

---

## 7. Interactie, states & status-taal

- **"Aan zet"-principe.** Elke rol ziet bovenaan glashelder wat er nú van hém/haar wordt verwacht
  ("2 urenstaten wachten op je goedkeuring"). Gevoed door de next-action-engine. Geen zoeken.
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
