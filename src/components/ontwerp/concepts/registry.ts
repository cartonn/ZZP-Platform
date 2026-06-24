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
    name: "Atelier",
    direction: "Editorial Swiss — koel redactioneel",
    rationale:
      "Magazine-grade rust: een display-serif voor het ene cijfer dat telt, hairline-rasters en royale witruimte op koel papier. Vertrouwen door helderheid, niet door drukte.",
    trends: ["Instrument-Serif display-moment", "Hairline Swiss-raster", "Mono kicker-labels"],
    fonts: "Instrument Serif + Inter + JetBrains Mono",
    accent: "#3a3a8c",
    bg: "#f6f5f2",
    fg: "#1a1a1a",
    available: true,
  },
  {
    id: "02",
    name: "Spectraal",
    direction: "Premium spatial dark",
    rationale:
      "Ruimtelijke diepte als kwaliteitssignaal: gelaagde OKLCH-elevatie en een lichtgevend violet accent. Glas alléén op de chrome, data blijft solide — elevatie = urgentie.",
    trends: ["Gelaagde elevatie-diepte", "Luminous accent-glow", "Glas op chrome, ⌘K-balk"],
    fonts: "Geist + Geist Mono",
    accent: "#a78bfa",
    bg: "#0b0b10",
    fg: "#e8e8f2",
    available: true,
  },
  {
    id: "03",
    name: "Kompas",
    direction: "Keyboard-first command console",
    rationale:
      "Raycast-grade snelheid: het ⌘K-palet is de ruggengraat, elke rij toont zijn sneltoets. Voor de power-user die de queue beheerst zonder de muis aan te raken.",
    trends: ["Open ⌘K-commandopalet", "Sneltoets-hints op elke rij", "J/K-tabelnavigatie"],
    fonts: "Inter + JetBrains Mono",
    accent: "#0d9488",
    bg: "#fafafa",
    fg: "#171717",
    available: true,
  },
  {
    id: "04",
    name: "Tij",
    direction: "Ambient aurora-light",
    rationale:
      "Kalmte als luxe: een zachte aurora-waas, translucente kaarten en grote radii verlagen de spanning rond documenten en verificatie. Premium en geruststellend.",
    trends: [
      "Aurora gradient-mesh waas",
      "Translucente glas-kaarten",
      "Grote radii + zachte diepte",
    ],
    fonts: "Sora + Inter + mono",
    accent: "#0ea5e9",
    bg: "#eef6fc",
    fg: "#16242e",
    available: true,
  },
  {
    id: "05",
    name: "Krijt",
    direction: "Neo-brutalism — verfijnd",
    rationale:
      "Stellig en zelfbewust: 2px-inktranden, harde offset-schaduwen en oversized grotesk-type, warm gehouden zodat het professioneel blijft voor de zorg.",
    trends: ["2px-randen + harde offset", "Oversized Space-Grotesk", "Eén elektrisch lime-accent"],
    fonts: "Space Grotesk + JetBrains Mono",
    accent: "#65a30d",
    bg: "#fbfaf6",
    fg: "#111111",
    available: true,
  },
  {
    id: "06",
    name: "Prisma",
    direction: "Confident color system",
    rationale:
      "Stripe-grade kleur met discipline: een bento-raster, rol-gecodeerde accenten en lichte grafiek-fills maken data positief en scanbaar zonder ooit schreeuwerig te worden.",
    trends: ["Bento-KPI-raster", "Rol-gecodeerde accenten", "Subtiele grafiek-fills + sparklines"],
    fonts: "Inter + JetBrains Mono",
    accent: "#6366f1",
    bg: "#ffffff",
    fg: "#1e1b2e",
    available: true,
  },
  {
    id: "07",
    name: "Stratum",
    direction: "Ops console — terminal-dichtheid",
    rationale:
      "Control-room-niveau dichtheid voor wie in de queue leeft: monospace datagrids, sticky headers, status-dots en toetsenbordnavigatie. Dichtheid waar die verdiend wordt.",
    trends: ["Monospace datagrids", "Sticky headers + 30px-rijen", "J/K + Enter-navigatie"],
    fonts: "JetBrains Mono + Inter",
    accent: "#0891b2",
    bg: "#0d1117",
    fg: "#c9d1d9",
    available: true,
  },
  {
    id: "08",
    name: "Onthaal",
    direction: "Warm-human, trust-first",
    rationale:
      "Toegankelijk en vertrouwenwekkend: een warme vertrouwensmeter staat centraal, zachte vormen en humanist letterwerk verlagen de drempel rond gevoelige documenten.",
    trends: [
      "Vertrouwensmeter centraal",
      "Humanist letterwerk + grote radii",
      "Geruststellende lege staten",
    ],
    fonts: "Sora + Inter",
    accent: "#059669",
    bg: "#fbf7f1",
    fg: "#1f2421",
    available: true,
  },
  {
    id: "09",
    name: "Veld",
    direction: "Mobiel-eerst",
    rationale:
      "Temper-snelheid voor het claimen van diensten, duim-bereikbaar via bottom-nav en bottom-sheets, maar mét de B2B-vertrouwenslaag: geverifieerde certificaten op elke kaart.",
    trends: [
      "Bottom-nav + bottom-sheet",
      "Duim-zone primaire acties",
      "Optimistisch claimen + trust-badges",
    ],
    fonts: "Inter + tabular mono",
    accent: "#ea580c",
    bg: "#ffffff",
    fg: "#16181d",
    available: true,
  },
  {
    id: "10",
    name: "Maan",
    direction: "Refined minimal dark",
    rationale:
      "Quiet luxury in het donker: vlakke oppervlakken, hairline-randen en low-chroma met één zacht blauw accent per scherm. Linear-night-kalmte, nul ruis.",
    trends: [
      "Hairline low-chroma vlakken",
      "Eén accent per scherm",
      "Tabular mono + royale witruimte",
    ],
    fonts: "Geist + Geist Mono",
    accent: "#93a4ff",
    bg: "#0a0a0c",
    fg: "#e6e7ee",
    available: true,
  },
];

export const BUILT = CONCEPTS.filter((c) => c.available);
