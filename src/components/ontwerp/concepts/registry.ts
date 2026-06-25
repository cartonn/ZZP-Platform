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
    name: "Atlas",
    direction: "Zwitsers besturingssysteem — precisieraster",
    rationale:
      "International Typographic Style als bedieningsoppervlak: strak baseline-raster, hairline-regels, één inkt-rood accent en oversized tabular-cijfers. Exactheid is het kwaliteitssignaal; alles staat op de millimeter.",
    trends: [
      "Swiss / International Typographic grid",
      "Tabular-cijfers als data-anker",
      "Keyboard-first (⌘K + J/K)",
    ],
    fonts: "Geist + JetBrains Mono",
    accent: "#dc2626",
    bg: "#fafafa",
    fg: "#0a0a0a",
    available: true,
  },
  {
    id: "02",
    name: "Aurora",
    direction: "Lichtgevend donker — aurora-ambient",
    rationale:
      "Hiërarchie uit licht, niet uit dozen: een zacht aurora-gloed-backdrop op bijna-zwart, iridescente accenten en inner-glow. Wat urgent is, gloeit letterlijk op.",
    trends: ["Ambient / luminous dark", "Iridescente accenten op bijna-zwart", "Glow-as-hierarchy"],
    fonts: "Geist + Geist Mono",
    accent: "#22d3ee",
    bg: "#070912",
    fg: "#e8ecf6",
    available: true,
  },
  {
    id: "03",
    name: "Pers",
    direction: "Riso/krantdruk — redactioneel",
    rationale:
      "Een broadsheet die toevallig software is: warm papier, twee-kleuren riso (kobalt + warm-rood), grote grotesk-koppen, mono-kickers en halftoon-textuur. Vertrouwen via redactionele helderheid.",
    trends: [
      "Riso / newsprint print-esthetiek",
      "Twee-kleuren halftoon-textuur",
      "Broadsheet-kolomraster",
    ],
    fonts: "Space Grotesk + JetBrains Mono",
    accent: "#2440d4",
    bg: "#f5f2ea",
    fg: "#161410",
    available: true,
  },
  {
    id: "04",
    name: "Kompas",
    direction: "Warm-menselijk — wegwijs",
    rationale:
      "Geruststellend en begeleidend: warm steen/salie-palet, royale radii, een vaste 'volgende stap'-wegwijzer en een kalme vertrouwensmeter verlagen de drempel rond gevoelige documenten. Menselijk, niet klinisch.",
    trends: [
      "Warm-human / trust-first",
      "Begeleidende wegwijzer-rail",
      "Geruststellende lege staten",
    ],
    fonts: "Plus Jakarta Sans + Sora",
    accent: "#2f6b4f",
    bg: "#f6f2ec",
    fg: "#20201c",
    available: true,
  },
  {
    id: "05",
    name: "Console",
    direction: "Terminal/IDE — toetsenbord-eerst",
    rationale:
      "Een operator-console voor de power-user: monospace-voorop, command-line-dashboard, vaste statusregel onderaan, J/K-rijnavigatie en ⌘K-palet. Dicht maar leesbaar — voor wie in het toetsenbord leeft.",
    trends: [
      "Terminal / IDE operator-UI",
      "Command-line + ⌘K-palet",
      "Vaste statusregel + J/K-nav",
    ],
    fonts: "JetBrains Mono + Inter",
    accent: "#15803d",
    bg: "#fbfbf9",
    fg: "#14171a",
    available: true,
  },
  {
    id: "06",
    name: "Spectra",
    direction: "Expressieve duotone kleur — kinetisch",
    rationale:
      "Energiek maar professioneel: levendige duotone mesh-gradients, rol-gecodeerde kleurvlakken en kinetische voortgangsmicro-interacties maken vooruitgang voelbaar — nooit schreeuwerig.",
    trends: [
      "Expressieve mesh-gradients",
      "Rol-gecodeerde kleurvlakken",
      "Kinetische voortgang / motion",
    ],
    fonts: "Plus Jakarta Sans + JetBrains Mono",
    accent: "#6366f1",
    bg: "#ffffff",
    fg: "#1a1430",
    available: true,
  },
  {
    id: "07",
    name: "Lumen",
    direction: "Glas & vibrancy — visionOS-diepte",
    rationale:
      "Translucente, gematteerde panelen zweven boven een zachte gradient-backdrop — diepte uit doorschijnendheid, contrast bewust bewaakt. Premium en ruimtelijk, leesbaar gehouden.",
    trends: [
      "Glassmorphism 2026 (contrast-bewust)",
      "Vibrancy / floating panels",
      "Spatial gradient-backdrop",
    ],
    fonts: "Sora + Inter",
    accent: "#38bdf8",
    bg: "#0b1020",
    fg: "#eaf0fb",
    available: true,
  },
  {
    id: "08",
    name: "Graphite",
    direction: "Tactiel brutalisme — blauwdruk",
    rationale:
      "Stellig en eerlijk: zichtbaar structuurraster, dikke inkt-randen, harde offset-schaduwen en blauwdruk-annotaties (maatlijnen, hoekticks) met één signaal-oranje. Brutalist met B2B-discipline.",
    trends: [
      "Tactile brutalism / blueprint",
      "Harde offset-schaduwen",
      "Maatlijn-annotaties + mono",
    ],
    fonts: "Space Grotesk + JetBrains Mono",
    accent: "#ea580c",
    bg: "#ededea",
    fg: "#111113",
    available: true,
  },
  {
    id: "09",
    name: "Zak",
    direction: "Mobiel-eerst — duim-zone",
    rationale:
      "App-native snelheid in een telefoonframe: bottom-nav, bottom-sheets en optimistisch claimen met grote duim-bereikbare acties — mét de B2B-vertrouwenslaag van geverifieerde certificaten.",
    trends: [
      "Mobiel-eerst / thumb-zone",
      "Bottom-nav + bottom-sheets",
      "Optimistisch claimen + trust-badges",
    ],
    fonts: "Inter + JetBrains Mono",
    accent: "#2563eb",
    bg: "#ffffff",
    fg: "#15171c",
    available: true,
  },
  {
    id: "10",
    name: "Onyx",
    direction: "Quiet luxury — verfijnd donker",
    rationale:
      "Stilte als luxe: matte bijna-zwarte vlakken, hairline low-chroma-randen en één warm champagne-accent per scherm. Royale witruimte, één verfijnd display-moment — sieraad-discipline, nul ruis.",
    trends: [
      "Quiet luxury / refined matte dark",
      "Hairline low-chroma vlakken",
      "Eén champagne-accent per scherm",
    ],
    fonts: "Geist + Instrument Serif + Geist Mono",
    accent: "#c8a96a",
    bg: "#0a0a0a",
    fg: "#ece9e3",
    available: true,
  },
];

export const BUILT = CONCEPTS.filter((c) => c.available);
