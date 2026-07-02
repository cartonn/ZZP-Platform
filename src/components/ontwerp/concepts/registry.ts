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
  // ── Reeks 2 (run 2-7-2026) — nrs 11–20, toegevoegd bovenop de bestaande set. ──────────────
  {
    id: "11",
    name: "Terra",
    direction: "Warm-humanist — organisch & menselijk",
    rationale:
      "Zorg is mensenwerk: warme aarde- en salietinten, organische vormen, zachte ronde hoeken en een humanistische serif. Rustgevend en vertrouwd rond gevoelige documenten, zonder ook maar iets aan dichtheid in te leveren.",
    trends: [
      "Warm-humanist / natuurpalet",
      "Organische vormen als canvas",
      "Humanistische serif + zachte grotesk",
    ],
    fonts: "Newsreader + Libre Franklin",
    accent: "#b4552d",
    bg: "#f5efe6",
    fg: "#2a2620",
    available: true,
  },
  {
    id: "12",
    name: "Glas",
    direction: "Glasmorfisme 2.0 — diepte & laagwerk",
    rationale:
      "Bevroren glas met echte diepte: translucente panelen, backdrop-blur en laag-op-laag hiërarchie boven een levendig maar bewaakt verloop. Modern en premium, mét bewaakt contrast op elk glasvlak — legibiliteit gaat vóór effect.",
    trends: [
      "Glasmorfisme met diepte-lagen",
      "Backdrop-blur + translucente chrome",
      "Contrast-first op glas",
    ],
    fonts: "Bricolage Grotesque + Inter",
    accent: "#6d5cf5",
    bg: "#eef1fb",
    fg: "#191a2e",
    available: true,
  },
  {
    id: "13",
    name: "Prisma",
    direction: "Verfijnd neo-brutalisme — structureel",
    rationale:
      "Neo-brutalisme, maar getemd tot productiekwaliteit: dikke zwarte hairlines, harde offset-schaduwen en zichtbaar raster, gecombineerd met strakke spacing en tabulaire cijfers. Zelfverzekerd en onmiskenbaar, nooit rommelig.",
    trends: [
      "Neo-brutalisme (refined)",
      "Harde offset-schaduw + dikke rand",
      "Zichtbaar raster als structuur",
    ],
    fonts: "Space Grotesk + Spline Sans Mono",
    accent: "#ffd23f",
    bg: "#f4f4ef",
    fg: "#111111",
    available: true,
  },
  {
    id: "14",
    name: "Raster",
    direction: "Zwitsers monochroom — typografisch raster",
    rationale:
      "Zuiver Zwitsers: alleen zwart, wit en één rode signaalkleur op een streng typografisch hairline-raster. Cijfers en labels dragen de hiërarchie, geen decoratie. Tijdloos, streng en messcherp leesbaar.",
    trends: [
      "Zwitsers/International Style-raster",
      "Monochroom + één signaalrood",
      "Typografie-als-UI, hairline-kolommen",
    ],
    fonts: "Libre Franklin + Spline Sans Mono",
    accent: "#e4002b",
    bg: "#ffffff",
    fg: "#0a0a0a",
    available: true,
  },
  {
    id: "15",
    name: "Zenit",
    direction: "Mobiel-first — native app-shell",
    rationale:
      "Ontworpen voor de duim: een telefoon-app-shell met onderste tab-bar, sheets, grote raakvlakken en een verticale kaartstroom. De ZZP'er regelt reacties, uren en documenten onderweg — snel, native aanvoelend, foutloos.",
    trends: [
      "Mobiel-first / thumb-zone-navigatie",
      "Bottom-tab + bottom-sheets",
      "Kaartstroom + grote raakvlakken",
    ],
    fonts: "Plus Jakarta Sans + Inter",
    accent: "#0ea5e9",
    bg: "#f2f5f9",
    fg: "#0f172a",
    available: true,
  },
  {
    id: "16",
    name: "Aurora",
    direction: "Levendig verloop — mesh & gloed",
    rationale:
      "Een premium-consument-esthetiek: zachte aurora-verlopen en gloed als sfeer, op strakke witte kaarten die de data helder houden. Kleur schept emotie en merkgevoel; de inhoud blijft rustig en scanbaar.",
    trends: [
      "Aurora/mesh-gradient als sfeer",
      "Gloed-accenten + kleurrijke depth",
      "Premium-consumer op strakke kaarten",
    ],
    fonts: "Sora + Inter",
    accent: "#d946ef",
    bg: "#0f1020",
    fg: "#f2ecff",
    available: true,
  },
  {
    id: "17",
    name: "Kanaal",
    direction: "Command-first — toetsenbord & spotlight",
    rationale:
      "Voor de power-user en bemiddelaar: een zwevend ⌘K-spotlight-palet staat centraal, elke actie heeft een toetsafkorting en een J/K-navigeerbare lijst. Snelheid als product — bereik alles in twee toetsaanslagen.",
    trends: [
      "Command-palette-first (⌘K)",
      "Keyboard-first + toetshints overal",
      "Spotlight/launcher als hoofdnavigatie",
    ],
    fonts: "Geist + IBM Plex Mono",
    accent: "#7c8cff",
    bg: "#101216",
    fg: "#e7e9ee",
    available: true,
  },
  {
    id: "18",
    name: "Kompas",
    direction: "Reis & tijdlijn — wayfinding",
    rationale:
      "Elke opdracht is een reis: een horizontale tijdlijn met haltes (reactie → match → verificatie → contract → factuur) maakt voortgang en de volgende beste stap letterlijk zichtbaar. Oriëntatie boven abstractie.",
    trends: [
      "Journey/timeline-wayfinding",
      "Pipeline-as-narrative + haltes",
      "Next-best-step visueel verankerd",
    ],
    fonts: "Bricolage Grotesque + Geist Mono",
    accent: "#0d9488",
    bg: "#f6f8f7",
    fg: "#132420",
    available: true,
  },
  {
    id: "19",
    name: "Puur",
    direction: "Whitespace-maximalisme — kalme luxe",
    rationale:
      "Het tegenovergestelde van druk: royale witruimte, dunne typografie, één actie per blik en progressive disclosure. Apple-achtige kalme luxe die vertrouwen wekt door rust — precies wat gevoelige documenten verdienen.",
    trends: [
      "Whitespace-maximalisme / calm luxe",
      "Progressive disclosure (één beslissing)",
      "Dunne display-type + veel lucht",
    ],
    fonts: "Manrope + Newsreader",
    accent: "#111827",
    bg: "#fbfbfa",
    fg: "#111827",
    available: true,
  },
  {
    id: "20",
    name: "Karbon",
    direction: "OLED-donker — expressief high-contrast",
    rationale:
      "Puur zwart OLED-canvas met één vurig accent en messcherp contrast: dark-mode-first zoals 2026 het wil. Minimalistisch en expressief tegelijk, cijfers gloeien, chrome verdwijnt — de data en de status zijn de show.",
    trends: [
      "OLED-zwart / dark-mode-first",
      "Eén vurig accent + high-contrast",
      "Expressief minimalisme, gloei-cijfers",
    ],
    fonts: "Geist + IBM Plex Mono",
    accent: "#ff5c39",
    bg: "#000000",
    fg: "#f4f4f5",
    available: true,
  },
];

export const BUILT = CONCEPTS.filter((c) => c.available);
