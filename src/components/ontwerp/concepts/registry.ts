// Metadata-register van de ontwerp-lab-concepten. Bevat alle 10 designrichtingen zodat de
// galerij-index de volledige visie toont; `available` markeert welke al volledig uitgewerkt zijn
// (en dus een eigen pagina /ontwerp/<id> hebben). De daadwerkelijke concept-componenten worden in
// de route-map (src/app/ontwerp/[id]/page.tsx) gekoppeld — dit bestand bevat puur data, geen JSX,
// zodat zowel de server-index als de route het kunnen importeren.

export type ConceptMeta = {
  id: string; // "01".."10" — ook het URL-segment
  name: string;
  direction: string; // korte designrichting-omschrijving
  rationale: string; // 1-2 zinnen waarom deze richting werkt voor ons platform
  trends: string[]; // onderzochte 2026-trends die erin zitten
  fonts: string;
  accent: string; // hex voor het swatch-blokje in de galerij
  bg: string; // hex achtergrond voor de preview-tegel
  fg: string; // hex tekstkleur voor de preview-tegel
  available: boolean; // is het concept volledig gebouwd?
};

export const CONCEPTS: ConceptMeta[] = [
  {
    id: "01",
    name: "Helder",
    direction: "Strategische rust — Linear-grade licht",
    rationale:
      "De canon perfect uitgevoerd: OKLCH-neutralen, één elektrisch-indigo accent en 5–9 elementen per scherm. Elk pixel verdient zijn plek; rust is het kwaliteitssignaal.",
    trends: [
      "Strategisch minimalisme / calm UI",
      "OKLCH-neutrale schaal",
      "Single-metric focus + tabular dichtheid",
    ],
    fonts: "Inter + JetBrains Mono",
    accent: "#4f46e5",
    bg: "#fbfbfd",
    fg: "#15161a",
    available: true,
  },
  {
    id: "02",
    name: "Orbit",
    direction: "Ruimtelijke diepte — premium OLED-dark",
    rationale:
      "Diepte als hiërarchie: gelaagde elevatie op echt zwart, een lichtgevend emerald-accent en zachte inner-glow. Wat urgent is, komt letterlijk naar voren.",
    trends: [
      "Spatial depth / layering",
      "OLED true-black + luminous accent",
      "Dark-mode-first tooling",
    ],
    fonts: "Geist + Geist Mono",
    accent: "#34d399",
    bg: "#08090c",
    fg: "#e7e9ee",
    available: true,
  },
  {
    id: "03",
    name: "Folio",
    direction: "Redactioneel — kinetische typografie",
    rationale:
      "Een magazine dat toevallig software is: een oversized Fraunces-display draagt het scherm, asymmetrisch raster en mono-kickers. Vertrouwen via redactionele helderheid.",
    trends: [
      "Kinetische / oversized variabele typografie",
      "Editorial sequential reveal",
      "Asymmetrisch raster + pull-quotes",
    ],
    fonts: "Fraunces + Inter + JetBrains Mono",
    accent: "#b91c1c",
    bg: "#faf8f4",
    fg: "#1b1a17",
    available: true,
  },
  {
    id: "04",
    name: "Haven",
    direction: "Warm-menselijk — vertrouwen eerst",
    rationale:
      "Toegankelijk en geruststellend: een warme zand-palet, grote radii en een centrale vertrouwensmeter verlagen de drempel rond gevoelige documenten. Menselijk, niet klinisch.",
    trends: [
      "Warm-human / trust-first design",
      "Vertrouwensmeter als hero",
      "Geruststellende lege staten",
    ],
    fonts: "Plus Jakarta Sans + Sora",
    accent: "#0d9488",
    bg: "#f7f3ec",
    fg: "#211f1a",
    available: true,
  },
  {
    id: "05",
    name: "Cockpit",
    direction: "Data-dicht pro — financiële cockpit",
    rationale:
      "Bloomberg ontmoet Stripe in het licht: strakke tabular-rijen, inline-sparklines overal en een dichte KPI-rail. Maximale dichtheid die zichzelf verdient, nul rommel.",
    trends: [
      "Data-heavy analytics dichtheid",
      "Inline sparklines + tabular nums",
      "Bento-KPI-rail",
    ],
    fonts: "Inter + JetBrains Mono",
    accent: "#2563eb",
    bg: "#fbfbfa",
    fg: "#14161b",
    available: true,
  },
  {
    id: "06",
    name: "Puls",
    direction: "Expressieve kleur — functionele motion",
    rationale:
      "Energiek maar professioneel: rol-gecodeerde kleurblokken, gradient-accentchips en vieren-bij-succes micro-interacties maken voortgang voelbaar zonder schreeuwerig te worden.",
    trends: [
      "Expressieve kleur + gradients",
      "Motion as functional design",
      "Rol-gecodeerde accenten",
    ],
    fonts: "Plus Jakarta Sans + JetBrains Mono",
    accent: "#7c3aed",
    bg: "#ffffff",
    fg: "#1a1530",
    available: true,
  },
  {
    id: "07",
    name: "Vitre",
    direction: "Glas & vibrancy — visionOS-diepte",
    rationale:
      "Translucente, gematteerde lagen zweven boven een zachte gradient-backdrop — diepte zonder rommel, contrast bewust bewaakt. Premium en ruimtelijk, leesbaar gehouden.",
    trends: [
      "Glassmorphism 2026 (contrast-bewust)",
      "Vibrancy / floating panels",
      "Spatial gradient-backdrop",
    ],
    fonts: "Sora + Inter",
    accent: "#38bdf8",
    bg: "#0f1424",
    fg: "#eaf0fb",
    available: true,
  },
  {
    id: "08",
    name: "Beton",
    direction: "Tactiel brutalisme — verfijnd",
    rationale:
      "Stellig en eerlijk: zichtbaar raster, dikke inkt-randen, harde offset-schaduwen en monospace overal, met één acid-accent. Brutalist met de discipline van een B2B-product.",
    trends: [
      "Tactile brutalism / monospace-everything",
      "Zichtbaar raster + harde offset",
      "Eén acid-accent",
    ],
    fonts: "Space Grotesk + JetBrains Mono",
    accent: "#84cc16",
    bg: "#f4f4ef",
    fg: "#0f0f0d",
    available: true,
  },
  {
    id: "09",
    name: "Mobiel",
    direction: "Mobiel-eerst — duim-zone",
    rationale:
      "Temper-snelheid voor het claimen van diensten in een telefoonframe: bottom-nav, bottom-sheets en optimistisch claimen — mét de B2B-vertrouwenslaag van geverifieerde certificaten.",
    trends: [
      "Mobiel-eerst / thumb-zone",
      "Bottom-nav + bottom-sheets",
      "Optimistisch claimen + trust-badges",
    ],
    fonts: "Inter + JetBrains Mono",
    accent: "#f97316",
    bg: "#ffffff",
    fg: "#15171c",
    available: true,
  },
  {
    id: "10",
    name: "Nocturne",
    direction: "Verfijnd minimaal — quiet luxury dark",
    rationale:
      "Stilte als luxe: vlakke low-chroma-oppervlakken, hairline-randen en één zacht accent per scherm. Linear-night-kalmte met royale witruimte — nul ruis.",
    trends: [
      "Quiet luxury / refined minimal dark",
      "Hairline low-chroma vlakken",
      "Eén accent per scherm",
    ],
    fonts: "Geist + Geist Mono",
    accent: "#818cf8",
    bg: "#0a0a0b",
    fg: "#e6e7ec",
    available: true,
  },
];

export const BUILT = CONCEPTS.filter((c) => c.available);
