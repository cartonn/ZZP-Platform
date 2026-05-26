# design.md — ZZP Platform design system

> Bron van waarheid voor de UI. Linear/Vercel/Stripe-stijl: rustig, compact, premium,
> dashboard-first, **light** thema. Operationele SaaS, geen marketingsite. UI-taal = Nederlands.
> Tokens leven in `src/app/globals.css` (CSS-variabelen) en `tailwind.config.ts` (Tailwind-mapping).
> Dit document beschrijft ze en legt de component- en kwaliteitscontracten vast.

## Grondregels (niet-onderhandelbaar)
- **Geen slop, geen dode knoppen.** Elke knop/actie doet iets echt of bestaat niet. Nog niet
  gebouwde nav-items tonen als uitgegrijsde "soon", niet als kapotte link.
- **Geen kaart-in-kaart, geen decoratieve gradients, geen hero's.** Full-width secties, lijsten,
  tabellen, panelen. Kaarten alleen voor herhaalde items (kandidaat, document, factuur).
- **Elke status = kleur + label + (waar nuttig) icoon + reden.** Nooit kleur alleen.
- **Elke view heeft loading-, empty-, error- én (waar relevant) geen-toegang-staat.**
- **Tekst valt nooit buiten knoppen/cards**; lange titels/namen `truncate` met `min-w-0`.

## Kleurtokens (HSL-tripletten in `globals.css`, light thema)
Gebruik altijd de Tailwind-semantieknaam, nooit een losse hex.

| Token | Waarde (HSL) | Tailwind | Gebruik |
|---|---|---|---|
| `--background` | `0 0% 100%` | `bg-background` | paginabasis |
| `--foreground` | `240 10% 4%` | `text-foreground` | primaire tekst |
| `--muted` | `240 5% 96%` | `bg-muted` | subtiele vlakken, hover |
| `--muted-foreground` | `240 4% 46%` | `text-muted-foreground` | secundaire tekst/meta |
| `--card` | `0 0% 100%` | `bg-card` | kaart/paneel-oppervlak |
| `--border` | `240 6% 90%` | `border-border` | randen, scheidingslijnen |
| `--input` | `240 6% 90%` | `border-input` | formuliervelden |
| `--ring` | `240 5% 65%` | `ring-ring` | focusring |
| `--primary` | `240 6% 10%` | `bg-primary` | primaire knop, merk-mark |
| `--primary-foreground` | `0 0% 98%` | `text-primary-foreground` | tekst op primary |
| `--accent` | `240 5% 96%` | `bg-accent` | geselecteerde chip/nav-item |
| `--success` | `142 64% 38%` | `text-success` | goedgekeurd/geverifieerd/actief |
| `--warning` | `35 92% 42%` | `text-warning` | review/aandacht/bijna verlopen |
| `--danger` | `0 72% 48%` | `text-danger` | geblokkeerd/afgewezen/verlopen/verwijderen |

Zachte statusvlakken: `bg-success/10 text-success` (idem warning/danger). Wit/licht alleen voor
document-previews, facturen en print/PDF.

## Maat- & vormtokens
- **Radius:** `--radius: 0.5rem` → `rounded-lg` (kaarten), `rounded-md` (knoppen/inputs), `rounded-sm`.
  Chips/badges: `rounded-full`.
- **Spacing:** Tailwind 4px-schaal; voorkeur voor veelvouden van 4/8 (`gap-2/3/4`, `p-4/5`, `py-3`).
- **Typografie:** `--font-sans` (system-sans). Paginatitel `text-xl font-semibold tracking-tight`;
  sectietitel `text-sm font-medium`; body `text-sm`; meta `text-xs text-muted-foreground`;
  getallen `tabular-nums`. Schaal niet met viewport.

## Statuskleur-mapping (semantisch, consistent)
Geïmplementeerd in de badge-componenten — houd deze tabel leidend:

- **Job** (`job-status-badge`): DRAFT→"Concept"/muted · PUBLISHED→"Gepubliceerd"/success · CLOSED→"Gesloten"/default
- **Application** (`application-status-badge`): NEW/default · VIEWED/muted · SHORTLIST/warning · ACCEPTED/success · REJECTED/danger
- **Credential** (`credential-status-badge`): DRAFT/muted · SUBMITTED/default · VERIFIED/success · REJECTED/danger · EXPIRED/warning
- **Invoice** (`invoice-status-badge`): DRAFT/muted · SENT/default · PAID/success · OVERDUE/danger · CANCELLED/muted
- **Collaboration**: PROPOSED/default · ACTIVE/success · COMPLETED/muted · CANCELLED/danger
- **Compliance** (`compliance-badge`): COMPLIANT/success · WARNING/warning · NON_COMPLIANT/danger

## Componentcontracten (`src/components/ui/*`)
- **Button** — varianten `primary` (één per sectie), `secondary` (border), `ghost` (toolbar),
  `danger` (destructief). Maten `sm`/`md`. Icon-only knoppen **verplicht** `aria-label`. `asChild`
  voor links-als-knop.
- **Badge** — `default|muted|success|warning|danger`. Tekst kort; status nooit kleur-alleen.
- **Card** + CardHeader/Title/Content — één niveau, geen nesting.
- **Field** — label (`htmlFor`), `required`-markering, `hint`, `error` met `role="alert"`.
- **Input/Select/Textarea** — `focus-ring`-utility; `border-input`. Selects die na een server-action
  zichtbaar blijven: **controlled** (voorkomt terugspringen na RSC-refresh).
- **CheckChip** — sr-only checkbox in label; `has-[:checked]` + `has-[:focus-visible]`-ring.
- **Progress** — `role="progressbar"` met aria-waarden; kleur schaalt (warning<60<primary<100=success).

## Layout & navigatie
- **AppShell**: desktop sidebar (links, `md:flex`), mobiel een toegankelijke **drawer**
  (`role="dialog"`, Escape/overlay sluiten, auto-sluiten bij routewissel). Header: titel-/merk-mark,
  **notificatiebel met ongelezen-badge**, rol-chip. Role-aware nav (`src/lib/nav.ts`).
- **Dashboard-first**: elke rol ziet bovenaan live, klikbare stat-cards (status → volgende actie),
  geen oversized KPI's.
- Werkscherm = lijst/tabel/queue/detail/form. Detail/queue-items dicht: naam + meta + statuschip + actie.

## Toegankelijkheid (minimaal)
Toetsenbordnavigeerbaar · zichtbare focusstates (`focus-ring`/`has-[:focus-visible]`) · status niet
kleur-alleen · icon-only knoppen met `aria-label` · formulierfouten via `role="alert"` bij het veld ·
`<html lang="nl">` · contrast geschikt voor light thema.

## Responsief
Desktop: sidebar zichtbaar, tabel/paneel-layout. Mobiel (`max-md`): sidebar → drawer, één kolom,
dichte lijstrijen. Screenshots controleren op **desktop én mobiel**.

## Copy-stijl
Kort Nederlands, functioneel. Voorbeelden: "Geverifieerd", "Review nodig", "Verloopt binnenkort",
"Publiceren met waarschuwing". Geen hype ("revolutionair", "magisch", "slim" zonder concrete actie).

## Design-acceptatiecriteria (een feature is pas "design-af" als)
- [ ] Gebruikt uitsluitend tokens (geen losse hex/spacing-magie).
- [ ] Toont status + reden + (waar relevant) risico; status niet kleur-alleen.
- [ ] Heeft loading-, empty-, error- en (indien van toepassing) geen-toegang-staat.
- [ ] Werkt op desktop én mobiel (geverifieerd via screenshot).
- [ ] Toetsenbord + focus + aria in orde; geen dode knoppen.
- [ ] Toont de volgende beste actie duidelijk; verbergt onnodige interne complexiteit.

## ReOS-leerpunten (overgenomen, vertaald naar light Linear-thema)
Het vorige project (Re-integratie OS) had een sterke operationele werkplek-UX. Wat we daarvan
overnemen — aangepast aan dit light thema, niet de donkere ReOS-look gekopieerd:

- **Werkbank, geen marketingdashboard.** Het eerste scherm per rol voelt als een console waar de
  volgende actie meteen duidelijk is.
- **Expliciete rol in de shell + dag-context.** Header leidt met "{Rol} werkplek", een groet en de
  datum, plus één beknopte operationele samenvatting — niet een lege titel.
- **Horizontale metric-strip**, geen oversized KPI-kaarten: compacte, klikbare totalen/risico-tellingen.
- **"Vraagt aandacht"-paneel** naast/onder het overzicht: echte uitzonderingen met *reden + volgende
  actie* (bv. "2 certificaten verlopen binnenkort", "3 nieuwe reacties"). Deterministisch uit data —
  geen verzonnen meldingen, geen dode items. Lege staat is rustig ("Niets dat aandacht vraagt").
- **Dichte werkitems**: identifier/naam · meta · statuschip · volgende actie, op één rij.
- **Split login**: links product-/vertrouwensbewijs, rechts toegang. Rustig, geen hero.
- **Command palette / keyboard hints**: nuttig voor planners/operators, maar laag in de visuele
  hiërarchie (later; alleen als het echt werkt — geen lege sneltoets-hints).

Niet klakkeloos overnemen: ReOS is donker en operator-zwaar; dit platform blijft light en
toegankelijk. Compliance-/auditzichtbaarheid mag hier juist explíciet sterker zijn.

