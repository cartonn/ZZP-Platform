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
  // ── Reeks 3 (run 3-7-2026) — nrs 21–30, toegevoegd bovenop de bestaande set. ──────────────
  {
    id: "21",
    name: "Atlas",
    direction: "Cartografisch — kaart-first matching",
    rationale:
      "Matching wordt ruimtelijk: een gestileerd topografisch kaart-canvas met locatie-pins, reistijd-radiusringen en regio-filters maakt afstand en bereik letterlijk zichtbaar. Cartografische precisie boven abstracte lijsten — de kern-differentiatie van een bemiddelplatform.",
    trends: [
      "Spatial/kaart-first datavisualisatie",
      "Cartografische hairline-contouren",
      "Reistijd/geo als primaire matchfactor",
    ],
    fonts: "Inter + Spline Sans Mono",
    accent: "#167a6b",
    bg: "#f4f1ea",
    fg: "#24312e",
    available: true,
  },
  {
    id: "22",
    name: "Dossier",
    direction: "Neo-skeuomorf archief — tastbare kluis",
    rationale:
      "De neo-skeuomorfisme-golf van 2026, precies toegepast: manila-maptabbladen, kraftpapier, een lakzegel voor geverifieerde certificaten en gestanste ringband geven affordance terug rond gevoelige documenten. Fysieke metaforen wekken vertrouwen waar flat design het verliest.",
    trends: [
      "Neo-skeuomorphism / tactiele revival",
      "Fysieke document-metaforen (map, zegel)",
      "Diepte + dubbele schaduw voor affordance",
    ],
    fonts: "Newsreader + JetBrains Mono",
    accent: "#9a2b1e",
    bg: "#ece4d3",
    fg: "#33291c",
    available: true,
  },
  {
    id: "23",
    name: "Blauwdruk",
    direction: "Technische blauwdruk — drafting-precisie",
    rationale:
      "De blueprint-esthetiek van 2026: wireframe-logica als eindontwerp. Diep navy met millimeter-raster, cyaan lijnwerk, gedimensioneerde annotaties en constructielijnen. Systeemdenken wordt zichtbaar — technisch, exact en onderscheidend van neon-cyber.",
    trends: [
      "Blueprint/drafting-esthetiek",
      "Zichtbaar raster + dimensie-annotaties",
      "Monospace labels, function-forward",
    ],
    fonts: "Geist + IBM Plex Mono",
    accent: "#4db8ff",
    bg: "#0d2137",
    fg: "#cfe3f2",
    available: true,
  },
  {
    id: "24",
    name: "Console",
    direction: "Terminal — monospace phosphor-TUI",
    rationale:
      "Een volwaardige tekst-terminal: alles monospace, een command-prompt met knipperende cursor, box-drawing-randen en toetsafkortingen. Phosphor-groen op bijna-zwart, messcherp leesbaar. Voor de power-user die snelheid boven chrome verkiest — de raw/terminal-trend van 2026.",
    trends: [
      "Terminal/raw aesthetic",
      "Monospace-overal + toetsbediening",
      "Box-drawing + phosphor-contrast",
    ],
    fonts: "IBM Plex Mono",
    accent: "#5df08a",
    bg: "#05080a",
    fg: "#cfe8d4",
    available: true,
  },
  {
    id: "25",
    name: "Reliëf",
    direction: "Soft UI — neumorfisme 2.0",
    rationale:
      "New Neumorphism, verfijnd en toegankelijk: monochrome oppervlakken uit één materiaal geboetseerd met dubbele licht/donker-schaduw en inset-velden, mét een sterk indigo-accent zodat contrast op niveau blijft. Tactiel op high-refresh schermen, zonder de grijs-op-grijs-valkuil.",
    trends: [
      "Soft UI / neumorfisme-revival",
      "Dubbele schaduw + inset-affordance",
      "Toegankelijk accent tegen grijs-op-grijs",
    ],
    fonts: "Manrope + Plus Jakarta Sans",
    accent: "#5b6cf0",
    bg: "#e6e9ef",
    fg: "#2b3242",
    available: true,
  },
  {
    id: "26",
    name: "Perforatie",
    direction: "Ticket & instapkaart — tastbaar-speels",
    rationale:
      "Elke opdracht, factuur en certificaat wordt een ticket: geperforeerde randen, een afscheurbare stub, streepjescode en statusstempels maken status fysiek voelbaar. Speels maar strak en premium — een tastbare metafoor die scanbaarheid en plezier combineert.",
    trends: [
      "Skeuomorfe ticket/stub-metafoor",
      "Perforatie + tear-lines als structuur",
      "Stempels als statustaal",
    ],
    fonts: "Space Grotesk + Spline Sans Mono",
    accent: "#d1462f",
    bg: "#eef0f3",
    fg: "#1c2530",
    available: true,
  },
  {
    id: "27",
    name: "Courant",
    direction: "Broadsheet — redactionele krant",
    rationale:
      "Een kwaliteitskrant die software werd: masthead met datumlijn, meerkoloms opmaak, drop caps, hairline-kolomregels en één spot-rood. Hoge dichtheid en gezag via journalistieke typografie — tijdloos en onderscheidend van glossy mode-editorial.",
    trends: [
      "Broadsheet/editorial met masthead",
      "Meerkoloms + drop caps + hairlines",
      "Hoog-contrast serif, spaarzaam spot-rood",
    ],
    fonts: "Fraunces + Libre Franklin",
    accent: "#a11d1d",
    bg: "#f7f4ec",
    fg: "#1a1a17",
    available: true,
  },
  {
    id: "28",
    name: "Riso",
    direction: "Risograph — duotone drukwerk",
    rationale:
      "Risograph-drukwerk als interface: twee-inkts duotone (kobalt + fluor-roze) op ongebleekt papier, halftoon-textuur, lichte misregister en korrel. Bold, grafisch en craft-vol — draait om druktechniek en overdruk, niet om vlakke kleurblokken.",
    trends: [
      "Risograph/duotone print-craft",
      "Halftoon-textuur + misregister",
      "Bold grafische koppen op papier",
    ],
    fonts: "Bricolage Grotesque + Space Grotesk",
    accent: "#ff3d8b",
    bg: "#f3efe3",
    fg: "#16161d",
    available: true,
  },
  {
    id: "29",
    name: "Signaal",
    direction: "Hi-vis workwear — industrieel signaal",
    rationale:
      "Werkkleding-esthetiek voor veldwerkers: antraciet met veiligheids-oranje en hi-vis geel, spaarzame hazard-strepen, stencil-vette koppen en industriële labels. Stoer én premium, met functionele signaaltaal en hoge leesbaarheid — herkenbaar voor wie in het veld staat.",
    trends: [
      "Industrieel/workwear signaaldesign",
      "Hazard-stripes als spaarzaam accent",
      "Stencil-koppen + functionele labels",
    ],
    fonts: "Space Grotesk + Spline Sans Mono",
    accent: "#ff6a00",
    bg: "#17181a",
    fg: "#f2f2ef",
    available: true,
  },
  {
    id: "30",
    name: "Vitrine",
    direction: "Museale curatie — galerie & wandlabel",
    rationale:
      "Een gecureerde, museale presentatie: royale passe-partout, elegante wandlabel-onderschriften, zachte spotlight en veel ademruimte. Elke opdracht en elk certificaat wordt als tentoongesteld object gepresenteerd — reverent en premium, met museale motieven boven kale witruimte.",
    trends: [
      "Museale curatie / wandlabel-typografie",
      "Passe-partout + spotlight-belichting",
      "Object-als-exponaat, ingetogen luxe",
    ],
    fonts: "Instrument Serif + Manrope",
    accent: "#7c6a45",
    bg: "#f6f4f0",
    fg: "#1e1c19",
    available: true,
  },
  // ── Reeks 4 (run 3-7-2026) — nrs 31–40, toegevoegd bovenop de bestaande set. ──────────────
  {
    id: "31",
    name: "Perron",
    direction: "Split-flap vertrekbord — mechanisch tijdschema",
    rationale:
      "Een station-vertrekbord als interface: mechanische split-flap-tegels klappen om voor koppen en cijfers, amber signaalkleur op antraciet, opdrachten als dienstregeling-rijen. Analoog-kinetisch en scanbaar — geen scanlines, echt mechaniek.",
    trends: [
      "Mechanisch/retro-futuristisch",
      "Split-flap kinetische tegels",
      "Dienstregeling-dichtheid",
    ],
    fonts: "Spline Sans Mono + Space Grotesk",
    accent: "#f5a623",
    bg: "#0d0f12",
    fg: "#f0ede4",
    available: true,
  },
  {
    id: "32",
    name: "Parel",
    direction: "Iriserend holografisch — parelmoer & chroom",
    rationale:
      "Parelmoer-sheen op een licht canvas: iriserende randen, chroom-metallic accenten en glanzende pill-knoppen boven rustige, leesbare inhoud. Modern en premium — legibiliteit gaat vóór het effect.",
    trends: [
      "Holografisch/iriserend (2026)",
      "Chroom & metallic accenten",
      "Contrast-first op glans",
    ],
    fonts: "Bricolage Grotesque + Inter",
    accent: "#a78bfa",
    bg: "#f4f2fb",
    fg: "#1b1a2e",
    available: true,
  },
  {
    id: "33",
    name: "Zegel",
    direction: "Letterpress & lakzegel — ambachtelijk vertrouwen",
    rationale:
      "Katoenpapier met deboss-typografie en een lakzegel-motief als vertrouwensteken: de verificatielaag is de held. Warm, tastbaar en ambachtelijk rond gevoelige documenten — analoge craft tegen slop.",
    trends: [
      "Letterpress/analoge textuur",
      "Tactiele deboss-typografie",
      "Zegel als vertrouwensmotief",
    ],
    fonts: "Fraunces + Spline Sans Mono",
    accent: "#8a3324",
    bg: "#f0e9dc",
    fg: "#241f1a",
    available: true,
  },
  {
    id: "34",
    name: "Redactie",
    direction: "Datajournalistiek — geannoteerde grafiek-editorial",
    rationale:
      "NYT/FT-stijl data-storytelling: mooie inline-grafieken met redactionele annotaties en 'hoe te lezen'-notities, serif-koppen boven zakelijke body. Data-ink minimalisme — de cijfers vertellen het verhaal, niet de chrome.",
    trends: [
      "Datajournalistiek / micrographics",
      "Tufte data-ink minimalisme",
      "Geannoteerde inline-charts",
    ],
    fonts: "Newsreader + Inter",
    accent: "#1a5e63",
    bg: "#fbfaf7",
    fg: "#14181a",
    available: true,
  },
  {
    id: "35",
    name: "Deco",
    direction: "Art-deco geometrie — jewel & goud",
    rationale:
      "Art-deco luxe: symmetrische gouden linework-ornamenten, getrapte geometrie en zonnestraal-motieven in diepe juweeltinten, met één verfijnd serif-displaymoment. Elegant, symmetrisch en onmiskenbaar premium.",
    trends: [
      "Art-deco / geometrische revival",
      "Goud linework op juweeltinten",
      "Symmetrie & getrapte ornamentiek",
    ],
    fonts: "Fraunces + Manrope",
    accent: "#c9a24b",
    bg: "#10231f",
    fg: "#f2ede0",
    available: true,
  },
  {
    id: "36",
    name: "Schemer",
    direction: "Gouden uur — warm verloop, optimistisch",
    rationale:
      "Gouden-uur-sfeer: warme perzik/amber/roze verlopen op Stripe/Vercel-niveau, zacht en licht, met glow achter primaire acties. Optimistisch en menselijk, veel lucht — vertrouwen via warmte in plaats van strengheid.",
    trends: [
      "Warm gradient-craft (light)",
      "Gouden-uur / optimistische kleur",
      "Glow-accent op primaire actie",
    ],
    fonts: "Sora + Inter",
    accent: "#f97362",
    bg: "#fdf3ec",
    fg: "#2a1f22",
    available: true,
  },
  {
    id: "37",
    name: "Isometrie",
    direction: "Isometrisch 3D — axonometrische diepte",
    rationale:
      "Axonometrische diepte, speels maar strak: kaarten en KPI-blokken met echte 3D-projectie, zichtbare dikte en zachte slagschaduw, data als iso-blokken. Bij hover komt een blok naar voren — dimensie zonder rommel.",
    trends: [
      "Isometrisch/axonometrisch 3D (2026)",
      "Diepte via echte transform",
      "Kinetische hover-lift",
    ],
    fonts: "Space Grotesk + Inter",
    accent: "#6366f1",
    bg: "#eef0f7",
    fg: "#1c1e2b",
    available: true,
  },
  {
    id: "38",
    name: "Spectrum",
    direction: "Duotone jaaroverzicht — bold type & verloop",
    rationale:
      "Jaaroverzicht-energie: reuze bold koppen, levendige duotone-verlopen (magenta→violet→cyaan) en cijfers-als-held, met kleurblok-secties die per scherm van tint wisselen. Dopamine-design dat leesbaar blijft.",
    trends: [
      "Dopamine / verzadigde duotone",
      "Reuze-typografie als held",
      "Gradient-secties per scherm",
    ],
    fonts: "Bricolage Grotesque + Space Grotesk",
    accent: "#ff2d78",
    bg: "#120a1f",
    fg: "#f6ecff",
    available: true,
  },
  {
    id: "39",
    name: "Botanie",
    direction: "Herbarium — botanisch specimen & inkt",
    rationale:
      "Biofiele herbarium-esthetiek: papier met fijne inkt-lijnillustraties van bladeren, specimen-labels en geperste-plant-composities in salie-groen en inktbruin. Rustgevend en natuurlijk — elk certificaat als tentoongesteld specimen.",
    trends: [
      "Biofiel/botanisch (2026)",
      "Inkt-lijnillustratie als canvas",
      "Herbarium specimen-labels",
    ],
    fonts: "Newsreader + Libre Franklin",
    accent: "#3f6b3a",
    bg: "#f2f1e6",
    fg: "#23271f",
    available: true,
  },
  {
    id: "40",
    name: "Kwadrant",
    direction: "Beslismatrix — analytisch coördinatenveld",
    rationale:
      "Matching zichtbaar als positie: opdrachten geplot op een 2×2-beslismatrix (match × tarief) met kwadrant-labels, rasterlijnen en kruisdraden. Hover licht een punt uit met tooltip — strak analytisch, coördinaten in plaats van geografie.",
    trends: [
      "Analytisch coördinatenveld",
      "Beslismatrix / scatter-positionering",
      "Interactieve tooltip-uitlichting",
    ],
    fonts: "Geist + Geist Mono",
    accent: "#2563eb",
    bg: "#f7f8fa",
    fg: "#101318",
    available: true,
  },
  // ── Reeks 5 (run 3-7-2026) — nrs 41–50, toegevoegd bovenop de bestaande set. ──────────────
  {
    id: "41",
    name: "Beton",
    direction: "Neo-brutalisme, verfijnd — structuur als stijl",
    rationale:
      "Ruwe, eerlijke structuur maar premium uitgevoerd: dikke zwarte randen, harde offset-slagschaduwen die verspringen bij hover, monospace micro-labels en één elektrische accentkleur. Bold en zelfverzekerd, tóch messcherp leesbaar — brutalisme als raster, niet als chaos.",
    trends: [
      "Neo-brutalisme / intentional incompleteness (2026)",
      "Harde offset-schaduw + dikke randen",
      "Zichtbare rasterstructuur, status met label+icoon",
    ],
    fonts: "Space Grotesk + IBM Plex Mono",
    accent: "#b8f000",
    bg: "#f4f1e9",
    fg: "#14110c",
    available: true,
  },
  {
    id: "42",
    name: "Helvetia",
    direction: "Zwitserse typografie — rasterstreng",
    rationale:
      "Internationale typografische stijl (Müller-Brockmann): strak basislijnraster, flush-left, wiskundige witruimte, hairline-regels en reuze tabulaire cijfers als held. Zwart-wit met één signaalrood — rigoureus, tijdloos en glashelder, zonder één decoratie te veel.",
    trends: [
      "Swiss / internationale typografische stijl",
      "Rasterrigueur + hairline-systeem",
      "Cijfer-als-held, minimale kleur",
    ],
    fonts: "Inter + IBM Plex Mono",
    accent: "#e2231a",
    bg: "#ffffff",
    fg: "#111111",
    available: true,
  },
  {
    id: "43",
    name: "Aqua",
    direction: "Frutiger Aero revival — glanzend & fris",
    rationale:
      "De glossy 2000's-esthetiek keert in 2026 terug als 'Neo-Aero': lichtgevende gel-oppervlakken, luchtige blauwgroene verlopen en bubbelvormen, professioneel getemperd. Optimistisch en fris rond vertrouwen, met gloss als accent — nooit als ruis; data blijft leesbaar.",
    trends: [
      "Frutiger Aero / Neo-Aero revival (2026)",
      "Glossy gel-oppervlak + blauwgroen verloop",
      "Bubbelvormen, luchtige helderheid",
    ],
    fonts: "Sora + Inter",
    accent: "#12b5c9",
    bg: "#eef6fb",
    fg: "#0b2a3a",
    available: true,
  },
  {
    id: "44",
    name: "Grootboek",
    direction: "Geruit kasboek — grootboek & saldo",
    rationale:
      "Het klassieke groen-gestreepte boekhoudpapier als rustige financiële werkplek: zebra-geruite regels, verticale kolomlijnen, tabulaire cijfers en meelopende saldi met perforatie-marge. De facturen- en omzetschermen schitteren — een kalm gedrukt grootboek, geen live terminal.",
    trends: [
      "Ledger / green-bar accounting revival",
      "Zebra-geruite regels + kolomlijnen",
      "Tabulaire debet/credit/saldo-dichtheid",
    ],
    fonts: "IBM Plex Mono + Newsreader",
    accent: "#2f6b3f",
    bg: "#f5f3e7",
    fg: "#1c2417",
    available: true,
  },
  {
    id: "45",
    name: "Duim",
    direction: "Mobiel-first — duimzone-app",
    rationale:
      "Het hele platform als een top-mobiele app, getoond in een telefoonframe: bottom-tab-bar in de duimzone, grote raakvlakken, veegbare opdrachtkaarten en onderaan verankerde primaire acties. Eén-hand-ergonomie eerst — het voelt als een verzonden iOS/Android-app.",
    trends: [
      "Mobile-first / thumb-zone ergonomie",
      "Bottom-tab + sheet-navigatie",
      "Grote raakvlakken, veeggebaren",
    ],
    fonts: "Manrope + Inter",
    accent: "#4f46e5",
    bg: "#eceef2",
    fg: "#12141a",
    available: true,
  },
  {
    id: "46",
    name: "Palet",
    direction: "Command-first — toetsenbord-spotlight",
    rationale:
      "Menu's schalen niet; een command-palette wel. Een centrale ⌘K-spotlight is de primaire navigatie, met live resultatenlijst, toetshints (↑↓ ⏎ esc) en secties (Navigatie/Acties/Opdrachten). Het scherm verandert terwijl je een commando 'uitvoert' — toetsenbord-first, Raycast/Superhuman-energie.",
    trends: [
      "Command palette als primaire navigatie (2026)",
      "Toetsenbord-first / spotlight-flow",
      "Kalme dark, live fuzzy-resultaten",
    ],
    fonts: "Geist + Geist Mono",
    accent: "#7c5cff",
    bg: "#0b0d12",
    fg: "#e6e9f0",
    available: true,
  },
  {
    id: "47",
    name: "Ruimte",
    direction: "Ruimtelijke diepte — spatial glas (dark)",
    rationale:
      "De spatial-UI-trend met terughoudendheid: doorschijnende glaspanelen op geordende z-dieptes boven een dimensionele achtergrond, echte diepte via schaal/blur/schaduwlagen en vibrancy. Panelen liften naar de kijker bij hover — gloss verhult nooit de data. Donker, gelaagd, premium.",
    trends: [
      "Spatial UI / visionOS-vibrancy (2026)",
      "Geordende z-diepte + backdrop-blur-lagen",
      "Vibrancy met behoud van leesbaarheid",
    ],
    fonts: "Geist + Geist Mono",
    accent: "#64d2ff",
    bg: "#0e1220",
    fg: "#eef1f8",
    available: true,
  },
  {
    id: "48",
    name: "Paspoort",
    direction: "Identiteitsdocument — beveiligingsgravure",
    rationale:
      "De verificatielaag als officieel ID-document: fijne guilloché-lijnpatronen, een MRZ-achtige machine-leesbare strip, stempelmotieven voor VERIFIED/EXPIRING en een holografisch zegel. Vertrouwen via de beeldtaal van paspoort en identiteitskaart — de verificatie is onmiskenbaar de held.",
    trends: [
      "Security-engraving / guilloché & MRZ",
      "Stempel- & zegelmotief voor vertrouwen",
      "ID-document-layout, officiële beeldtaal",
    ],
    fonts: "IBM Plex Mono + Libre Franklin",
    accent: "#1e40af",
    bg: "#ece7d9",
    fg: "#16233f",
    available: true,
  },
  {
    id: "49",
    name: "Meter",
    direction: "Instrumentenpaneel — analoge meters",
    rationale:
      "Een cockpit-instrumentencluster: KPI's en match-scores als radiale meters met naalden en tick-bogen, kleine dial-multiples en digitale uitlezingen. Verificatiestatussen als indicatielampen. Precisie-engineering-gevoel — ronde analoge meters, geen dienstregeling.",
    trends: [
      "Skeuomorf instrument / gauge-cluster",
      "SVG-meters met naald + tick-boog",
      "Digitale uitlezing + indicatielampen",
    ],
    fonts: "Space Grotesk + Spline Sans Mono",
    accent: "#34d399",
    bg: "#0f1417",
    fg: "#e8ece8",
    available: true,
  },
  {
    id: "50",
    name: "Handleiding",
    direction: "Technische documentatie — docs-referentie",
    rationale:
      "De docs-esthetiek (Stripe/dev-docs) toegepast op het product zelf: twee-koloms layout met TOC-zijbalk, 'op deze pagina'-rail, monospace-annotaties, notice-boxen en gedocumenteerde tabellen met ankerlinks. Kalm, precies en ultra-leesbaar — de anti-decoratieve, informatie-eerst richting.",
    trends: [
      "Technical mono / docs-referentie-UI",
      "Twee-koloms TOC + op-deze-pagina-rail",
      "Informatie-eerst, ankerlinks & notices",
    ],
    fonts: "Inter + Geist Mono",
    accent: "#635bff",
    bg: "#fbfbfd",
    fg: "#1a1f2b",
    available: true,
  },
];

export const BUILT = CONCEPTS.filter((c) => c.available);
