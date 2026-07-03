# DESIGN-LAB.md — Ontwerp-lab (`/ontwerp`)

Een **publiek, inlogvrij** design-lab onder de route `/ontwerp` (niet onder `(protected)`, met
`noindex`) waar de eigenaar via één URL tien onderscheidende, top-1% redesign-concepten van het
hele ZZP Platform naast elkaar bekijkt en daaruit kiest voor de echte herontwerp.

- **Galerij-index** `/ontwerp` — toont alle tien richtingen met preview, naam, designrichting,
  rationale en de onderzochte 2026-trends. Uitgewerkte concepten zijn klikbaar; de rest staat als
  "binnenkort".
- **Concept-pagina** `/ontwerp/<id>` — één volledig uitgewerkt redesign dat de kernschermen
  (dashboard, marktplaats, opdracht-detail met verklaarbare matching, verificatie/zegel, acties,
  facturen) in die designtaal toont, met realistische Nederlandse demo-content en interactie
  (interne scherm-tabs, hover, nav). Puur frontend, mock-data uit
  `src/components/ontwerp/concepts/mock.ts`. **Géén backend, géén wijziging aan de live-app.**

Cadans: **elke run levert de volledige, verse set van tien volwaardige concepten** (alle 10 klikbaar
en uitgewerkt), met een kritische zelf-review die het niveau elke run omhoog tilt. Kwaliteit boven
snelheid binnen elk concept, maar altijd alle tien live. Het woord "AI" komt nergens voor;
UI-taal = Nederlands.

## Architectuur

| Bestand                                              | Rol                                               |
| ---------------------------------------------------- | ------------------------------------------------- |
| `src/app/ontwerp/layout.tsx`                         | Fonts (next/font) + `noindex`                     |
| `src/app/ontwerp/page.tsx`                           | Galerij-index (server, leest registry)            |
| `src/app/ontwerp/[id]/page.tsx`                      | Dynamische route → concept-component-map          |
| `src/components/ontwerp/concepts/registry.ts`        | Metadata van alle 10 richtingen (`available`)     |
| `src/components/ontwerp/concepts/mock.ts`            | Gedeelde Nederlandse demo-content                 |
| `src/components/ontwerp/concepts/concept-<nn>-*.tsx` | De uitgewerkte concept-componenten ('use client') |

## De tien richtingen (run 25-6-2026 — verse set v3)

| #   | Naam    | Designrichting                          | Kerntrends (2026)                                                 |
| --- | ------- | --------------------------------------- | ----------------------------------------------------------------- |
| 01  | Veld    | Bento-grid — modulair besturingssysteem | Bento-grid IA · ruimtelijk gewicht per datapunt · zachte elevatie |
| 02  | Folio   | Redactioneel luxe — modegevoel          | Oversized serif-display · crème papier · typografie-als-held      |
| 03  | Helder  | Toegankelijk hoog-contrast — inclusief  | WCAG-AAA · dikke focus-states · status met label + icoon          |
| 04  | Tij     | Kalme interface — sereen verloop        | Calm interfaces · zacht pastel-verloop · royale radii             |
| 05  | Beurs   | Data-dicht pro — handelsterminal        | Death of white space · tabular + sparklines · lijst+detail        |
| 06  | Klei    | Zacht 3D — claymorphism                 | Claymorphism · tactiele dubbele schaduw · mollige pills           |
| 07  | Puls    | Dopamine kleurblok — kinetisch          | Dopamine-kleur · vlakke kleurvlakken · kinetische micro's         |
| 08  | Nebula  | Techno-futurist — cyber-grid            | Techno-futurist dark · neon-randen op raster · glow-status        |
| 09  | Index   | Database-werkblad — Notion-grade        | Database-views · strategisch minimalisme · typografie-als-UI      |
| 10  | Bastion | Vertrouwen-fintech — marine & messing   | Dark-finance · kluis/schild-motieven · serif-displaymoment        |

> Elke run is een **verse, sterkere set**: de vorige set (Atlas, Aurora, Pers, Kompas, Console,
> Spectra, Lumen, Graphite, Zak, Onyx) is vervangen door bovenstaande tien, gekozen op grond van
> verse 2026-research (twee dominante 2026-esthetieken: techno-futurist dark vs. editorial crème,
> plus bento, calm interfaces, dopamine-kleur, claymorphism, data-dichtheid en accessibility-als-
> esthetiek) en een kritische zelf-review om het niveau op te tillen. De ontwerp-ruimte is bewust
> gespreid: licht-modulair (Veld) vs. redactioneel luxe (Folio) vs. data-dicht (Beurs) vs. database-
> werkblad (Index); kalm-zacht (Tij/Klei) vs. luid-kleur (Puls); en twee onderscheiden donkere
> richtingen — cyber-grid (Nebula) vs. fintech-vertrouwen (Bastion) — plus een toegankelijkheids-
> statement (Helder), zodat geen twee concepten op dezelfde esthetiek leunen.

## Onderzochte trends (2026 — bron voor de richtingen)

- **Layout & dichtheid:** calm over crammed; progressieve onthulling; dashboard-first dat
  status / volgende actie / vertrouwen direct beantwoordt; dichtheid alleen waar verdiend
  (admin-queue dense, freelancer-dashboard kalm); drawers/split-panes boven full-page-navigatie.
- **Typografie:** variable fonts standaard; mono tabular cijfers voor euro's/uren/data/verloop als
  kwaliteitssignaal; neo-grotesk + mono-metadata; één display-moment.
- **Kleur:** OKLCH als default (rol-eerst, L-locked contrast, één bron licht/donker); accenten
  optillen op donker; low-chroma oppervlakken, chroma sparen voor accent + status.
- **Motion:** doelgericht (state-communicatie), 120–220ms; `prefers-reduced-motion` verplicht; geen
  confetti/parallax/scroll-jacking.
- **Command-menu:** ⌘K-palet (cmdk) + J/K-tabelnavigatie als onderscheidende "moat".
- **Esthetiek-richtingen:** verfijnd brutalism, dark-glassmorphism 2.0 (glas alléén op chrome),
  editorial-warm, mono-zwart, high-contrast-als-esthetiek.
- **Concurrenten:** Pidz (kapotte meldingen, trage uren-goedkeuring → onze wins: betrouwbare
  meldingen, transparante server-waarheid, verklaarbare matching); Zorgwerk (incrementeel,
  app-centrisch → wij: desktop power-user-dichtheid + keyboard-first); Temper/YoungOnes (mobiele
  snelheid → wij: + B2B-vertrouwenslaag); Malt/Deel (compliance-as-product + verklaarbare profielen,
  gelokaliseerd naar NL ZZP/zorg). Niemand leidt op het trio **verklaarbare matching +
  next-best-action + gevisualiseerde verificatie** — dat is onze verdedigbare positie.

## Status

> De galerij **accumuleert**: elke run voegt 10 concepten toe, de vorige blijven staan. `/ontwerp`
> toont alle concepten die ooit zijn gebouwd (index groeit automatisch mee met `CONCEPTS`).

- **01–10** — reeks 1, volledig uitgewerkt en klikbaar op `/ontwerp` (set v3, run 25-6-2026:
  Veld · Folio · Helder · Tij · Beurs · Klei · Puls · Nebula · Index · Bastion).
- **11–20** — reeks 2, toegevoegd bovenop reeks 1 (run 2-7-2026): Terra (warm-humanist organisch) ·
  Glas (glasmorfisme 2.0, diepte) · Prisma (verfijnd neo-brutalisme) · Raster (Zwitsers monochroom,
  typografisch raster) · Zenit (mobiel-first native app-shell) · Aurora (levendig aurora/mesh-verloop) ·
  Kanaal (command-first, ⌘K-spotlight) · Kompas (reis/tijdlijn wayfinding) · Puur (whitespace-maximalisme,
  kalme luxe) · Karbon (OLED-donker, expressief high-contrast). Nieuwe fonts toegevoegd aan de lab-layout:
  Bricolage Grotesque, Newsreader, Spline Sans Mono, Libre Franklin, IBM Plex Mono.
- Onderzochte 2026-trends deze reeks: glasmorfisme-met-diepte, verfijnd neo-brutalisme,
  whitespace-maximalisme/calm-luxe & progressive disclosure, dark-mode-first (OLED), command-palette
  als standaardverwachting, mobiel-first/thumb-zone, aurora/mesh-gradient, Zwitsers/International-Style
  monochroom, warm-humanist natuurpalet en journey/timeline-wayfinding.
- **21–30** — reeks 3, toegevoegd bovenop reeks 1+2 (run 3-7-2026): Atlas (cartografisch, kaart-first
  matching met contouren/pins/reistijd-ringen) · Dossier (neo-skeuomorf archief: maptabbladen,
  kraftpapier, lakzegel) · Blauwdruk (technische blueprint: mm-raster, cyaan lijnwerk, dimensie-
  annotaties) · Console (terminal/TUI, phosphor-groen, command-prompt, box-drawing) · Reliëf (Soft-UI/
  neumorfisme 2.0, dubbele schaduw + inset, indigo-accent voor contrast) · Perforatie (ticket/instap-
  kaart: perforatie, afscheurstub, streepjescode, stempels) · Courant (broadsheet-krant: masthead,
  meerkoloms, drop caps, spot-rood) · Riso (risograph duotone: kobalt+fluor-roze, halftoon, misregister) ·
  Signaal (hi-vis workwear: antraciet + veiligheids-oranje, hazard-strepen, stencil-koppen) · Vitrine
  (museale curatie: passe-partout, wandlabels, spotlight, cat.nr). Alle tien gebruiken bestaande lab-
  fonts — geen nieuwe fonts nodig.
- Onderzochte 2026-trends deze reeks (bron: Tubik/SaaSUI/Setproduct/Userology e.a.): blueprint-/
  drafting-esthetiek (wireframe-logica als eindontwerp), terminal/raw aesthetic, neo-skeuomorphism &
  Soft-UI/neumorfisme-revival (affordance terug na de "usability ceiling" van flat design), spatial/
  kaart-first datavisualisatie, risograph/duotone print-craft, broadsheet-editorial, ticket/stub-
  skeuomorfie, industrieel-workwear signaaldesign en museale wandlabel-curatie.
- **Totaal nu op `/ontwerp`: 30 concepten** (reeks 1: 01–10, reeks 2: 11–20, reeks 3: 21–30).
