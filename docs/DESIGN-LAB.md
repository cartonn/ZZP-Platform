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

## De tien richtingen (run 24-6-2026 — verse set)

| #   | Naam      | Designrichting                   | Kerntrends (2026)                                         |
| --- | --------- | -------------------------------- | --------------------------------------------------------- |
| 01  | Atelier   | Editorial Swiss — koel           | Instrument-Serif display · hairline-raster · mono-kicker  |
| 02  | Spectraal | Premium spatial dark             | Gelaagde elevatie · luminous accent-glow · glas op chrome |
| 03  | Kompas    | Keyboard-first command console   | Open ⌘K-palet · sneltoets-hints · J/K-navigatie           |
| 04  | Tij       | Ambient aurora-light             | Aurora gradient-mesh · translucente kaarten · grote radii |
| 05  | Krijt     | Neo-brutalism — verfijnd         | 2px-randen + offset · oversized grotesk · lime-accent     |
| 06  | Prisma    | Confident color system           | Bento-raster · rol-gecodeerde accenten · grafiek-fills    |
| 07  | Stratum   | Ops console — terminal-dichtheid | Monospace datagrids · sticky headers · J/K + Enter        |
| 08  | Onthaal   | Warm-human, trust-first          | Vertrouwensmeter · humanist type · geruststellende staten |
| 09  | Veld      | Mobiel-eerst                     | Bottom-nav + bottom-sheet · duim-zone · trust-badges      |
| 10  | Maan      | Refined minimal dark             | Hairline low-chroma · één accent/scherm · tabular mono    |

> Elke run is een **verse, sterkere set**: de vorige set (Stille Precisie, Redactie, Cockpit, Glas,
> Stelling, Nacht, Klare Taal, Warm Onthaal, Stroom, Onderweg) is vervangen door bovenstaande tien,
> gekozen op grond van verse 2026-research en een kritische zelf-review om het niveau op te tillen.

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

- **01–10** — alle tien volledig uitgewerkt en klikbaar op `/ontwerp` (verse set, run 24-6-2026).
