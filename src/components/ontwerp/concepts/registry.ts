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
    name: "Veld",
    direction: "Bento-grid — modulair besturingssysteem",
    rationale:
      "De bento-grid van 2026, juist toegepast: elk datapunt krijgt zijn eigen tegel met eigen ruimtelijk gewicht. Asymmetrische modules, zachte elevatie, één indigo-accent — speels maar strak, alles in beeld zonder rommel.",
    trends: [
      "Bento-grid als informatie-architectuur",
      "Ruimtelijk gewicht per datapunt",
      "Zachte elevatie + ring-hairlines",
    ],
    fonts: "Geist + Geist Mono",
    accent: "#4f46e5",
    bg: "#f6f6f4",
    fg: "#171717",
    available: true,
  },
  {
    id: "02",
    name: "Folio",
    direction: "Redactioneel luxe — modegevoel",
    rationale:
      "Een glossy modeblad dat toevallig software is: crème papier, oversized Fraunces-serif, hairline-regels en één diep claret-accent. Vertrouwen via redactionele rust en premium typografie.",
    trends: [
      "Editorial / oversized serif-display",
      "Crème papier + hairline-kolomraster",
      "Typografie als hoofdrolspeler",
    ],
    fonts: "Fraunces + JetBrains Mono",
    accent: "#7a1f2b",
    bg: "#faf7f0",
    fg: "#1a1714",
    available: true,
  },
  {
    id: "03",
    name: "Helder",
    direction: "Toegankelijk hoog-contrast — inclusief",
    rationale:
      "Bewijs dat toegankelijk mooi is: WCAG-AAA-contrast, royale leesbare typografie, dikke focusringen en grote raakvlakken. Status nooit alleen op kleur — altijd label én icoon. Zelfverzekerd en glashelder.",
    trends: [
      "Accessibility-as-aesthetic (WCAG-AAA)",
      "Royale type + dikke focus-states",
      "Status met label + icoon, nooit kleur-alleen",
    ],
    fonts: "Manrope + Inter",
    accent: "#1d4ed8",
    bg: "#ffffff",
    fg: "#0a0a0a",
    available: true,
  },
  {
    id: "04",
    name: "Tij",
    direction: "Kalme interface — sereen verloop",
    rationale:
      "Een kalme interface (trend 2026): laag-prikkelend, vertrouwen via zachtheid. Subtiel pastel-verloop, rounded-3xl vlakken, veel lucht en zachte schaduwen — geruststellend rond gevoelige documenten.",
    trends: [
      "Calm interfaces / low-stimulation",
      "Zacht pastel-verloop",
      "Royale radii + diffuse schaduw",
    ],
    fonts: "Sora + Plus Jakarta Sans",
    accent: "#8b9dff",
    bg: "#f3f2fb",
    fg: "#23222e",
    available: true,
  },
  {
    id: "05",
    name: "Beurs",
    direction: "Data-dicht pro — handelsterminal",
    rationale:
      "Een handelsterminal voor de bemiddelaar: maximale informatiedichtheid (de 'death of white space'-trend). Compacte rijen, tabulaire cijfers overal, inline-sparklines en een twee-paneel lijst+detail. Elke pixel werkt.",
    trends: [
      "Death of white space / data-dichtheid",
      "Tabulaire cijfers + inline-sparklines",
      "Twee-paneel lijst+detail",
    ],
    fonts: "Inter + JetBrains Mono",
    accent: "#047857",
    bg: "#f8fafc",
    fg: "#0f172a",
    available: true,
  },
  {
    id: "06",
    name: "Klei",
    direction: "Zacht 3D — claymorphism",
    rationale:
      "Tactiele klei-oppervlakken: warme off-white, pluizige rounded-3xl-kaarten met zachte dubbele schaduw, inset-velden en mollige pill-knoppen. Uitnodigend en aanraakbaar, mét bewaakt contrast.",
    trends: ["Claymorphism / zacht 3D", "Tactiele dubbele schaduw", "Mollige pill-componenten"],
    fonts: "Plus Jakarta Sans + Manrope",
    accent: "#ff6b5e",
    bg: "#efeae3",
    fg: "#2a2622",
    available: true,
  },
  {
    id: "07",
    name: "Puls",
    direction: "Dopamine kleurblok — kinetisch",
    rationale:
      "Vlakke kleurblokken in een dopamine-palet: energiek maar gestructureerd, Swiss-meets-bold. Verzadigde vlakken coderen rollen/secties, kinetische voortgangsbalken maken vooruitgang voelbaar — luid in kleur, rustig in lay-out.",
    trends: [
      "Dopamine-kleur / bold color-blocking",
      "Vlakke kleurvlakken (geen mesh)",
      "Kinetische micro-interacties",
    ],
    fonts: "Space Grotesk + Inter",
    accent: "#2563eb",
    bg: "#ffffff",
    fg: "#101012",
    available: true,
  },
  {
    id: "08",
    name: "Nebula",
    direction: "Techno-futurist — cyber-grid",
    rationale:
      "De techno-futurist-esthetiek van 2026: bijna-zwart met een subtiel raster, neon cyaan/violet-accenten, scherpe randen die oplichten bij hover en een deployment-board-energie. Scherp, technisch, premium-cyber.",
    trends: ["Techno-futurist dark", "Neon-randen op raster", "Deployment-board / glow-status"],
    fonts: "Geist + Geist Mono",
    accent: "#22e0c8",
    bg: "#08090d",
    fg: "#e6f1f0",
    available: true,
  },
  {
    id: "09",
    name: "Index",
    direction: "Database-werkblad — Notion-grade",
    rationale:
      "Een verfijnd document-database-werkblad: rustige grijswaarden, database-views met property-chips, een view-switcher (Tabel/Bord/Lijst) en ⌘K-toetsenbordbediening. Typografie als UI, strategisch minimalisme — georganiseerd en snel.",
    trends: ["Database-views / workspace-UI", "Strategisch minimalisme", "Typografie-als-UI + ⌘K"],
    fonts: "Inter + JetBrains Mono",
    accent: "#2563eb",
    bg: "#fbfbfa",
    fg: "#1c1c1a",
    available: true,
  },
  {
    id: "10",
    name: "Bastion",
    direction: "Vertrouwen-fintech — marine & messing",
    rationale:
      "Premium financieel vertrouwen, Mercury/Stripe-niveau, gebouwd voor gevoelige documenten: diep marineblauw met verfijnd messing-accent, subtiele kluis/schild-motieven en één serif-displaymoment. De verificatielaag is de held.",
    trends: [
      "Dark-mode-first finance/luxe",
      "Vertrouwen-/kluis-motieven",
      "Serif-displaymoment + tabulaire cijfers",
    ],
    fonts: "Geist + Instrument Serif + Geist Mono",
    accent: "#c9a227",
    bg: "#0c1424",
    fg: "#e8edf6",
    available: true,
  },
];

export const BUILT = CONCEPTS.filter((c) => c.available);
