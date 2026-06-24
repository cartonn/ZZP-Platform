// Metadata-register van de ontwerp-lab-concepten. Bevat alle 10 geplande designrichtingen zodat de
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
    name: "Stille Precisie",
    direction: "Ultra-minimaal mono — Vercel-school",
    rationale:
      "Compromisloos zwart-op-wit waar elke pixel functie is; kleur verschijnt alleen waar status het eist. Het werktuig verdwijnt, de inhoud spreekt.",
    trends: [
      "Mono tabular cijfers",
      "Hairline OKLCH-randen i.p.v. schaduw",
      "Mono-labels als merksignaal",
    ],
    fonts: "Geist Sans + Geist Mono",
    accent: "#2b6cf6",
    bg: "#ffffff",
    fg: "#171717",
    available: true,
  },
  {
    id: "02",
    name: "Redactie",
    direction: "Editorial / redactioneel warm",
    rationale:
      "Magazine-warmte: een display-serif voor het ene cijfer dat telt, op mat-warme crème. Vertrouwen door menselijkheid en rust, niet door drukte.",
    trends: ["Edge-to-edge display-type", "Subtiele noise-textuur", "Warme low-chroma neutralen"],
    fonts: "Fraunces (display) + Inter + mono",
    accent: "#b4532a",
    bg: "#f3ece1",
    fg: "#24201b",
    available: true,
  },
  {
    id: "03",
    name: "Cockpit",
    direction: "Data-dense pro",
    rationale:
      "Datadog-niveau dichtheid voor wie in de queue leeft: compacte rijen, sticky headers, toetsenbordnavigatie. Dichtheid waar die verdiend wordt.",
    trends: ["32px compacte rijen", "J/K-toetsnavigatie + bulkacties", "Geen glas op data"],
    fonts: "Inter (tight) + Geist Mono",
    accent: "#0ea5e9",
    bg: "#0f1729",
    fg: "#e2e8f0",
    available: false,
  },
  {
    id: "04",
    name: "Glas",
    direction: "Glass / depth — digital luxury",
    rationale:
      "Dark-glassmorphism: translucentie en realistisch licht als kwaliteitssignaal. Glas alléén op chrome/modals; data blijft solide en leesbaar.",
    trends: ["backdrop-blur op nav/modals", "Elevatie = urgentie", "Opgetilde accenten op donker"],
    fonts: "Söhne-achtig + mono",
    accent: "#a78bfa",
    bg: "#10131c",
    fg: "#eef0f7",
    available: false,
  },
  {
    id: "05",
    name: "Stelling",
    direction: "Neo-brutalist — verfijnd",
    rationale:
      "Stellig en zelfbewust: rauwe randen en harde offset-schaduwen, maar warm gehouden zodat het professioneel blijft voor de zorg.",
    trends: ["2px-randen + harde offset-schaduw", "Oversized type", "Eén elektrisch accent"],
    fonts: "Condensed grotesque + mono",
    accent: "#16a34a",
    bg: "#fbf9f4",
    fg: "#101010",
    available: false,
  },
  {
    id: "06",
    name: "Nacht",
    direction: "Premium-dark — Linear/Raycast",
    rationale:
      "Donkere cockpit die duur aanvoelt: OKLCH-elevatieschaal, subtiele inner-glow randen en het ⌘K-palet als navigatieruggengraat.",
    trends: ["OKLCH-elevatieschaal", "⌘K command-palet", "Low-chroma oppervlakken"],
    fonts: "Geist Sans + Geist Mono",
    accent: "#7c93ff",
    bg: "#15171f",
    fg: "#e7e9f2",
    available: false,
  },
  {
    id: "07",
    name: "Klare Taal",
    direction: "High-contrast toegankelijk",
    rationale:
      "WCAG-AAA als esthetiek: leesbaarheid als luxe. Ideaal voor de zorg- en AVG-doelgroep — status draagt altijd icoon én tekst, nooit kleur alleen.",
    trends: [
      "OKLCH contrast-locked tokens",
      "Zichtbare focus-ringen",
      "prefers-reduced-motion-pad",
    ],
    fonts: "Inter (hoge x-hoogte) + tabular",
    accent: "#1d4ed8",
    bg: "#ffffff",
    fg: "#0a0a0a",
    available: false,
  },
  {
    id: "08",
    name: "Warm Onthaal",
    direction: "Warm-human",
    rationale:
      "Toegankelijk en vertrouwenwekkend: zachte vormen verlagen de spanning rond documenten en verificatie. Menselijke lettervormen, vriendelijke lege staten.",
    trends: [
      "Grotere radii + zachte schaduw",
      "Humanist letterwerk",
      "Doelgerichte bevestigingsmotion",
    ],
    fonts: "Plus Jakarta Sans + zachte serif",
    accent: "#0f9d77",
    bg: "#fbf7f0",
    fg: "#1f2421",
    available: false,
  },
  {
    id: "09",
    name: "Stroom",
    direction: "Linear-grade product",
    rationale:
      "De benchmark: kalm, snel, toetsenbord-eerst, nul visuele ruis. Progressieve onthulling — status/prioriteit/eigenaar eerst, de rest op klik.",
    trends: ["Progressieve onthulling", "FLIP-layoutovergangen", "⌘K + shortcut-systeem"],
    fonts: "Inter + mono",
    accent: "#5b5bd6",
    bg: "#fbfbfd",
    fg: "#1c1c1f",
    available: false,
  },
  {
    id: "10",
    name: "Onderweg",
    direction: "Mobiel-eerst",
    rationale:
      "Temper-snelheid voor het claimen van diensten, duim-bereikbaar, maar met de B2B-vertrouwenslaag: geverifieerde certificaten en betrouwbare meldingen.",
    trends: [
      "Bottom-sheet + bottom-nav",
      "Duim-zone primaire acties",
      "Optimistisch claimen + reconciliatie",
    ],
    fonts: "Inter (variable) + tabular mono",
    accent: "#e0562d",
    bg: "#ffffff",
    fg: "#16181d",
    available: false,
  },
];

export const BUILT = CONCEPTS.filter((c) => c.available);
