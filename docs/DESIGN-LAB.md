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
- **31–40** — reeks 4, toegevoegd bovenop reeks 1+2+3 (run 3-7-2026): Perron (split-flap vertrekbord:
  mechanische omklappende tegels, amber op antraciet, dienstregeling-rijen) · Parel (iriserend
  holografisch/licht: parelmoer-sheen, chroom-metallic, contrast-first op glans) · Zegel (letterpress
  & lakzegel: katoenpapier-grain, deboss-typografie, wax-seal als verificatie-held) · Redactie
  (datajournalistiek: geannoteerde inline-charts, "hoe te lezen"-notities, Tufte data-ink) · Deco
  (art-deco geometrie: gouden linework-ornamenten, zonnestraal/chevron, diepe juweeltinten) · Schemer
  (gouden uur/licht warm: perzik-amber-koraal verlopen, glow achter primaire acties) · Isometrie
  (isometrisch/axonometrisch 3D: echte transform-diepte, blokken met zichtbare dikte, hover-lift) ·
  Spectrum (duotone jaaroverzicht/donker: verzadigde magenta→violet→cyaan verlopen, reuze-typografie) ·
  Botanie (herbarium/licht: inkt-lijnillustratie van bladeren, specimen-labels, geperste-plant-montage) ·
  Kwadrant (beslismatrix/licht: interactief 2×2-coördinatenveld, scatter met kruisdraden + tooltip-
  uitlichting op hover én keyboard). Alle tien gebruiken bestaande lab-fonts — geen nieuwe fonts nodig.
- Onderzochte 2026-trends deze reeks (bron: Pixelmatters/Tubik/CreativeBloq/Canva/925studios/Figma
  e.a.): holografisch/iriserend & chroom-metallic, mechanisch/retro-futuristische interfaces,
  letterpress/analoge textuur & "tactile rebellion" (anti-slop, human-made), datajournalistiek/
  micrographics ("aesthetics of technical information"), art-deco/geometrische revival, warm
  gouden-uur gradient-craft (Stripe/Vercel-niveau), isometrisch/axonometrisch 3D, dopamine/verzadigde
  duotone met reuze-typografie, biofiel/botanisch design en analytische beslismatrix-/scatter-
  positionering.
- **41–50** — reeks 5, toegevoegd bovenop reeks 1–4 (run 3-7-2026): Beton (neo-brutalisme verfijnd:
  dikke zwarte randen, harde offset-schaduw die verspringt bij hover, monospace labels, elektrisch
  lime-accent) · Helvetia (Zwitserse typografie: streng basislijnraster, flush-left, reuze tabulaire
  cijfers, zwart-wit + signaalrood) · Aqua (Frutiger Aero/Neo-Aero revival: glossy gel-oppervlak,
  luchtige blauwgroen-verlopen, bubbelvormen, professioneel getemperd) · Grootboek (green-bar kasboek:
  zebra-geruite regels, kolomlijnen, tabulaire debet/credit/saldo, perforatie-marge) · Duim
  (mobiel-first duimzone-app in telefoonframe: bottom-tab, grote raakvlakken, veegbare kaarten,
  onderaan verankerde acties) · Palet (command-first spotlight/donker: ⌘K-palette als primaire
  navigatie, live resultatenlijst, toetshints, scherm verandert per commando) · Ruimte (spatial glas/
  donker: gelaagde doorschijnende panelen op geordende z-diepte, backdrop-blur-lagen, vibrancy,
  hover-lift) · Paspoort (identiteitsdocument: guilloché-lijnpatroon, MRZ-strip, stempelmotieven voor
  verificatie, holografisch zegel) · Meter (instrumentencluster/donker: radiale SVG-meters met naald +
  tick-boog, dial-multiples, digitale uitlezing, indicatielampen) · Handleiding (technische docs/licht:
  twee-koloms TOC-zijbalk, op-deze-pagina-rail, monospace-annotaties, notice-boxen, ankerlinks). Alle
  tien gebruiken bestaande lab-fonts — geen nieuwe fonts nodig.
- Onderzochte 2026-trends deze reeks (bron: SaaSUI/Tubik/Setproduct/WeAreTenet/Kittl/aigoodies e.a.):
  neo-brutalisme & "intentional incompleteness" (ruwe, schematische, brutaal heldere layouts), Swiss/
  internationale typografische stijl, Frutiger Aero/Neo-Aero revival (glossy blauwgroen als reactie op
  minimalisme), green-bar ledger/tabulaire dichtheid, mobile-first thumb-zone-ergonomie, command-palette
  als primaire navigatie (menu's schalen niet), spatial UI/visionOS-vibrancy met terughoudendheid,
  security-engraving/guilloché & MRZ als vertrouwensmotief, skeuomorf instrument/gauge-cluster en
  technical-mono docs-referentie-esthetiek.
- **51–60** — reeks 6, toegevoegd bovenop reeks 1–5 (run 4-7-2026): Teletekst (NOS-Teletekst-revival:
  zwart canvas, blokkerige mono, klassieke teletekst-kleuren, genummerd pagina-index-menu, mozaïek-
  blokgrafiek, gekleurde fastext-functiebalk) · Metrokaart (transit-lijndiagram als navigatie: gekleurde
  lijnen, stations als klikbare nodes, verificatie-overstapcapsule, 45°/90°-geometrie, credential-haltes
  met waarschuwingsnodes) · Bauhaus (De Stijl-geometrie: primaire kleuren + zwart op off-white, dikke
  kaderlijnen, cirkel/driehoek/kwart als functionele glyphs, Mondriaan-KPI-vlakken) · Inkt (e-ink/e-paper:
  puur monochroom papierwit + inkt-grijs, dither-halftoon-status, harde 1px-lijnen, geen depth, refresh-
  flits) · Aquarel (waterverf: zachte painterly wassingen + papier-textuur op de achtergrond, crisp
  content-kaarten erbovenop) · Kiosk (10-voet groot-format touch: XL-raakvlakken, grote type, dikke
  focus-ringen, één centrale volgende-actie-kaart) · Origami (gevouwen papier: vouwlijnen + licht/donker-
  facetten voor diepte via belichting, dog-ear-details, geen slagschaduw) · Textiel (geweven stof:
  kruislingse weefsel-textuur, dashed stiksel-seams, ingenaaide stof-labels voor status/certificaten) ·
  Memphis (80s-postmodernisme: squiggles, terrazzo, confetti in gebalanceerde felle kleuren rond crisp
  kaarten met offset-schaduw) · Schetsboek (hand-getekend: hydration-stabiele wiebel-randen, marker-
  highlights achter koppen, kantlijn-annotaties, plakband-hoekjes op schetspapier). Alle tien gebruiken
  bestaande lab-fonts — geen nieuwe fonts nodig.
- Onderzochte 2026-trends deze reeks: retro-computing/teletekst-revival & nostalgische informatiediensten,
  transit-/lijndiagram-datavisualisatie als navigatie, Bauhaus/De-Stijl-geometrie-revival, e-ink/e-paper-
  esthetiek & low-stimulation "calm tech", painterly/waterverf-craft als anti-slop human-made textuur,
  10-voet/groot-format & accessible XL-touch-interfaces, gevouwen-papier/facet-belichting als depth zonder
  schaduw, textiel/geweven-textuur & "tactile rebellion", Memphis/postmodern-speels geometrisch en
  hand-drawn/wireframe-als-kunst.
- **61–70** — reeks 7, toegevoegd bovenop reeks 1–6 (run 4-7-2026): Stroom (Kanban-flowboard als
  besturingssysteem: opdrachten/reacties/verificaties/facturen als kaarten in getinte lanes met tellers,
  drag-affordances, lift-hover; status-als-plaats) · Neonzon (synthwave/retrowave-zonsondergang: magenta→
  oranje zon met horizon-perspectiefgrid en chroom/neon-koppen in de hero, crisp donkere glazige panelen
  met neon-hairlines eronder) · Strip (graphic-novel/pop-art: dikke inktcontouren met offset-schaduw,
  Ben-Day halftone, comic-panelen en tekstballonnen voor matching-redenen, starburst-labels) · Solar
  (solarpunk techno-optimisme: zon-boog met stralen, blad-glyphs, organische ronde vlakken in amber+groen,
  hoopvol-warm) · Kinetiek (kinetische typografie als identiteit: ademende variable-font-koppen, lopende
  KPI-ticker-marquee, hover-kinetische kaarten, diagonale accent-strepen — alles in CSS-keyframes met
  reduced-motion-respect) · Prikbord (skeuomorf prikbord/scrapbook: kurk-textuur, opgeprikte gedraaide
  kaartjes met slagschaduw en punaises, washi-tape-hoekjes, rode-draad-SVG tussen opdracht ↔ vereist
  certificaat) · Parcours (smaakvol gamified vertrouwens-reis: SVG-voortgangsringen, niveau-badges brons/
  zilver/goud, quest-achtige acties met XP, verificatie als mijlpalen-level-up) · Pictogram (ISOTYPE
  pictogram-first: zelf-getekend 15-delig SVG-pictogramsysteem + herhaalde ISOTYPE-eenheden voor KPI's,
  signaletiek-helderheid, altijd label naast pictogram) · Haard (cozy warm-dark: espresso met kaars-amber
  gloed en koper-hairlines, warme diffuse schaduwen, uitnodigend i.p.v. klinisch, ruime crème-leesbaarheid)
  · Krijt (schoolbord: leisteen-groen bord met deterministische krijt-textuur en gewiste vegen, met-de-hand-
  getekende krijt-onderstrepingen/pijlen, serif-italic handgeschreven-aandoende koppen). Alle tien gebruiken
  bestaande lab-fonts — geen nieuwe fonts nodig.
- Onderzochte 2026-trends deze reeks: board/pijplijn-als-informatiearchitectuur (status-als-plaats),
  synthwave/retrowave-revival & neon-op-donker-glas, pop-art/graphic-novel & Ben-Day-halftone, solarpunk/
  techno-optimisme & organische curven, kinetische/variable-font-typografie met motion-first + reduced-
  motion-bewustzijn, skeuomorf scrapbook/rode-draad-relaties, smaakvolle gamified progressie & vertrouwens-
  level-up, ISOTYPE/pictogram-als-datataal & signaletiek, cozy warm-dark (amber i.p.v. neon) als laag-
  prikkelende dark-mode, en chalkboard/krijt-textuur als warm-onderwijzende human-made stijl.
- **71–80** — reeks 8, toegevoegd bovenop reeks 1–7 (run 4-7-2026): Vertrek (Solari-vertrekbord: split-flap-
  rijen die kinetisch-mechanisch naar hun eindwaarde rollen, antraciet bord + amber, opdrachten/statussen als
  klappend bord) · Bon (thermische kassabon: getande scheurranden, dot-matrix monospace, barcode en opgetelde
  totaalregels, facturen als afgerekende bonnen op warm papier) · Printplaat (PCB/circuit board: groen soldeer-
  masker met koperbanen die chip-kaarten verbinden, silkscreen-labels, soldeer-eilandjes en via's, matching als
  pin-diagram) · Sterrenbeeld (sterrenkaart: opdrachten/kandidaten als sterren verbonden door constellatie-
  haarlijnen tot een matching-graaf, helderheid = match-sterkte, premium-donker celestiaal) · Cinema (cinematisch
  letterbox: widescreen cinemascope-banden, title-card serif, scene-nummering, filmkorrel en scrubber-tijdlijn) ·
  Etiket (apotheek-/lab-label: omkaderde recept-koppen, dossiernummers, gestempelde geverifieerd-zegels, klinische
  precisie passend bij zorg) · Arcade (retro-game HUD: match% als power-bar, score-tellers, missie-labels,
  getemde scanline/CRT-gloed, speels maar strak) · Zilver (zilver-gelatine zwart-wit fotografie: contactvel-raster
  met sprocket-frames, hoog-contrast grijs, filmkorrel en frame-annotaties, editorial-luxe) · Radar (sonar-
  radarscope: concentrische afstandsringen + draaiende sweep die blips oplicht, afstand = reistijd, phosphor-gloed)
  · Terrazzo (gespikkeld terrazzo-steen: warme kalksteen-vlakken met deterministische spikkels in salie/oker/klei/
  hemelblauw, tactiel-premium-speels, messcherpe leesbaarheid). Alle tien gebruiken bestaande lab-fonts.
- Onderzochte 2026-trends deze reeks: kinetische typografie & mechanische split-flap-revival, tactiele print-/
  receipt-esthetiek, techno-/retrofuturist PCB-revival, data-visualisatie-als-verhaal (constellatie-graaf),
  cinematisch editorial & letterbox, skeuomorfe tactiele label-revival, retrofuturistische arcade-/game-HUD,
  editorial zwart-wit fotografie-as-UI, radar/sonar-scope voor nabijheids-matching, en tactiele oppervlakte-
  textuur (terrazzo) als merkgevoel.
- **81–90** — reeks 9, toegevoegd bovenop reeks 1–8 (run 5-7-2026): Vloeiglas (Apple **Liquid Glass**
  2026: lagen als levend, brekend glas met specular-randen, adaptieve doorschijnendheid en refractie-diepte
  i.p.v. platte vlakken) · Japandi (wabi-sabi/Japandi quiet-luxury: gedempte keramiek-tinten, tatami-achtig
  asymmetrisch raster, ruime "ma"-negatieve-ruimte, natuurlijke hand-imperfectie) · Therma (thermografie/
  infrarood-heatmap datataal: colormap indigo→magenta→amber codeert match/urgentie/omzet als gloed, nachtzicht-
  instrumentatie op bijna-zwart) · Draad (Superhuman/Linear-grade snelheids-inbox: hele platform als toetsenbord-
  gedreven triage-draden met split lees-paneel, shortcut-hints en inbox-zero-werkmodel) · Focus (enkelvoudige
  zen-focusmodus: één taak tegelijk oversized en centraal, progressive disclosure dimt de rest weg — Things/iA-rust)
  · Revisie (versiebeheer/diff-esthetiek: verificatie als reviewbare diff met +/- regels, commit-tijdlijn, review-
  goot en monospace-metadata als auditspoor) · Kader (fintech-ops canvas à la Mercury/Ramp/Stripe: saldo als held,
  grote afgeronde area-/staafgrafieken, luchtige financiële helderheid) · Widget (glanceable widget-home iOS/Family:
  stapelbare levende widget-tegels met diepte en parallax, elk een mini-app met eigen actie) · Lumen (bioluminescente
  diepzee-dark: bijna-zwart teal met organische gloed/caustics die alleen oplichten waar het telt, expressief zonder
  neon-hardheid) · Marmer (klassiek geaderd Carrara-marmer, quiet luxury & erfgoed: serif-kapitalen, goud-hairline,
  plint-rust, erfgoed-bankgevoel). Alle tien gebruiken bestaande lab-fonts — geen nieuwe fonts nodig.
- Onderzochte 2026-trends deze reeks: Apple **Liquid Glass** / refractief materiaal (iOS 26→27) als grootste OS-
  designverschuiving, Japandi/wabi-sabi & "quiet luxury with purpose", expressieve data-viz-colormaps (thermografie/
  heatmap), keyboard-first speed-triage (Superhuman/Linear) als productiviteitsparadigma, focusmodus/single-tasking &
  progressive disclosure (calm productivity), dev-tool-esthetiek (diff/commit/audit) die naar SaaS overwaait, fintech-
  ops dashboards (Mercury/Ramp/Stripe) met saldo-held & grote afgeronde grafieken, glanceable widget-home-metafoor,
  organisch dark-theme met bio-gloed i.p.v. neon, en erfgoed-materiaal (geaderd marmer + goud) als vertrouwensgebaar.
- **91–100** — reeks 10, toegevoegd bovenop reeks 1–9 (run 5-7-2026): Agenda (kalender-first/time-blocking
  à la Amie/Cron/Notion Calendar: dag-tijdraster met gekleurde tijdblokken, coral "nu"-lijn, matches als
  inplanbare blokken) · Doek (oneindig freeform canvas tldraw/FigJam/Muse: zwevende kaarten op gestippeld
  doek, relatielijnen, werkende zoom-chrome 60–140% + mini-map) · Kaart (swipe-deck matching, opdrachten als
  speelkaart-deck, mobiel-first telefoon-frame met swipe-stempels en match-dial) · Gesprek (conversationeel
  formulier à la Typeform: één vraag per scherm, voortgangsbalk, Enter↵-hints, verificatie als stap-voor-stap
  wizard) · Bubbel (berichten-first chat-shell iMessage/WhatsApp-grade: alles een thread met tijdstempels,
  lees-bevestiging en quick-replies, dashboard als inbox) · Montage (video-editor tijdlijn/scrubber Final Cut/
  Premiere-grade dark pro: programma-monitor + tracks met clips, sleepbare playhead, zoombare tijdliniaal) ·
  Groef (vinyl & hifi-warmte: album-hoes-tegels, concentrische-groeven-plaat, VU-meter uit data, "nu speelt"-
  balk — Teenage Engineering × Braun) · Ringen (voortgangsringen/activity-app Apple-Fitness-grade, levendig
  dark: verificatie/match/omzet als kleurrijke arcs, elke ring met numeriek label — nooit alleen kleur) ·
  Delft (Delfts-blauw tegeltableau, Nederlands erfgoed: porseleinen tegel-velden met kobalt dubbelkader en
  sierhoekjes, strak-modern niet kitsch) · Boekband (Penguin-klassieker tri-band paperback als redactionele
  reeks: kop-/voetband + wit middenveld met serif-titel, bandkleur codeert categorie). Alle tien gebruiken
  bestaande lab-fonts — geen nieuwe fonts nodig.
- Onderzochte 2026-trends deze reeks: calendar-first/time-blocking productiviteits-UX (Amie/Cron/Notion Calendar),
  spatial/infinite-canvas & node-and-edge relatievisualisatie (tldraw/FigJam/Muse), swipe-deck/card-stack als
  matching-paradigma, conversationeel/één-vraag-per-scherm formulieren (Typeform) voor kalme geleide flows,
  chat-shell/berichten-first als besturingsmodel, pro-editor-tijdlijn (scrubber/tracks/timecode) die naar SaaS
  overwaait, hifi/vinyl-materiaaltaal & tactiele nostalgie-premium (Teenage Engineering/Braun), activity-ringen als
  glanceable voortgangs-metafoor, en cultureel-erfgoed-materiaal (Delfts-blauw keramiek, Penguin-boekomslag-systeem)
  als vertrouwens- en herkenbaarheidsgebaar.
- **101–110** — reeks 11, toegevoegd bovenop reeks 1–10 (run 5-7-2026): Chroom (retrofuturistisch
  liquid-metal/geborsteld chroom met glossy bevels en één elektrisch cyaan neon-accent, Y2K-optimisme —
  METAAL als hoofdmateriaal, licht i.p.v. neon-op-zwart) · Verhaal (scrollytelling/data-storytelling:
  het dashboard leest als een scrollend narratief, cijfers in volzinnen, redactionele koppen en
  progressive reveal i.p.v. tegelwand) · Kliniek (klinisch medisch dossier: koel mint/teal op wit,
  medicijn-etiket-monospace-labels, hairlines en status-codes — direct passend bij BIG/VOG/diploma's) ·
  Meteo (weerbericht-datakaart/KNMI-taal: isobaren-SVG, blauw→rood heatzones voor match-druk,
  druk/wind/temp-meetwaarden) · Karton (kraft/corrugated-textuur, dashed-stiksel-randen, roterende
  stempel-badges, eco/sustainability & verzend-metafoor — niet beton) · Röntgen (medische scan: diep
  antraciet met lichtgevende cyaan lijn-art, scan-glow, contour-percentages — "doorlichten" als
  vertrouwensmetafoor bij verificatie) · Perkament (verlucht manuscript: warm perkament, kalligrafische
  koppen, drop-cap sier-initialen en pure-CSS bladgoud/wax-verificatiezegels — herkomst & ambacht) ·
  Nachtdienst (warme blauwlicht-arme nacht-modus voor avond/nachtdiensten in de zorg: gedimd amber op
  houtskool, `isNightShift()` licht avond/nacht-opdrachten uit) · Constructie (Russisch constructivisme/
  agitprop: diagonale rode balk + schuine assen, vette Bricolage-kapitalen, blok-nummering, streng
  rood/zwart — data blijft rechtop leesbaar) · Fresco (renaissance-fresco: kalkpleister-textuur via
  radiale gradients, terracotta + azuriet-pigment, klassieke gecentreerde composities/tondo, Instrument
  Serif-kapitalen). Alle tien gebruiken bestaande lab-fonts — geen nieuwe fonts nodig.
- Onderzochte 2026-trends deze reeks: retrofuturisme/Y2K-optimisme & liquid-metal/chrome-materiaaltaal,
  data-storytelling/scrollytelling (narratief boven dichtheid, progressive disclosure), calm serif +
  ledger-numerals typografie, sustainability/"machine-experience" met eerlijk-materiaal (kraft/karton),
  domein-native esthetiek voor de zorg (klinisch dossier, medische scan/doorlicht, blauwlicht-arme
  nacht-modus voor nachtdiensten), heritage/craft als vertrouwensgebaar (verlucht manuscript + bladgoud),
  en historische kunststromingen als dashboard-affiche (constructivisme, renaissance-fresco).
- **111–120** — reeks 12, toegevoegd bovenop reeks 1–11 (run 6-7-2026): Gebrandschilderd
  (kathedraal-glas-in-lood: juweelkleurig glas — kobalt/robijn/smaragd/amber — achter near-black
  loodlijnen op donkere steen, radiale door-glas-gloed, verificatie als gebrandschilderd medaillon —
  jewel-licht i.p.v. transparant glasmorfisme) · Zellige (Marokkaans mozaïek: islamitische geometrische
  tessellatie, achtvoudige-ster/rozet-SVG-motieven en interlocking dividers in warm majolica-blauw/
  saffraan/terra op kalk-wit — patroon als informatie-architectuur, niet Bauhaus/Deco/Delft) ·
  Filatelie (postzegelalbum: getande zegels met perforatie-gaatjes en ronde frankeerstempels die
  geverifieerde credentials "afstempelen", crème album-papier, Libre Franklin + mono waarde-cijfers —
  collectie-metafoor, niet ticket/lakzegel) · Ponskaart (Hollerith/IBM-ponskaart: manila-buff kaart met
  afgesneden hoek, geponste kolommen 0-9 en drukinkt-rode regels, IBM Plex Mono — vroege-computing
  telling strak & premium, niet terminal/PCB) · Scorebord (stadion-LED-jumbotron: dot-matrix in amber/
  groen/rood met glow op zwart-groen, KPI's als scorebord-cijfers, match als team-duel, verificatie als
  status-lightboard — energiek high-contrast, data glashelder, niet Arcade/split-flap) · Seismograaf
  (meettrommel: doorlopende deterministische inktlijn met scherpe uitslagen op millimeterpapier, nullijn
  - tijdmarkeringen, amplitude = urgentie — kalm-technisch, niet Meter/Radar/Therma) · Lakwerk (Japans
    urushi-lak: gepolijst zwart-lak met maki-e goudpoeder-flecks en gouden hairline-panelen, één
    cinnaber-accent, Instrument Serif — quiet luxury, verificatie als maki-e zegel) · Entomologie
    (verzamelaarslade: gespelde specimens met SVG-insectenspeld en wit determinatielabel/catalogusnummer
    op ivoor cottonboard met houten lade-rand, latijnse annotaties — "gedetermineerd & gelabeld", niet
    herbarium/vitrine) · Emaille (cloisonné: glanzende vitreus-emaille badges met messing hairline-cloisons
    en specular glans op licht porselein, Sora — speels-premium keurmerk-schildjes, niet Parel/Klei/Reliëf) ·
    Batik (Indonesisch was-resist: parang/kawung/ceplok-motieven met craquelé-scheurtjes in indigo/soga/
    crème, batik-doek-panelen, Newsreader — cultureel-warm-donker, data modern uitgelijnd, niet Textiel/
    Delft/Aquarel). Alle tien gebruiken bestaande lab-fonts — geen nieuwe fonts nodig.
- Onderzochte 2026-trends deze reeks: craft-revival & heritage-materialiteit als vertrouwensgebaar
  (gebrandschilderd glas, Japans lakwerk, cloisonné-emaille), niet-westerse ornamenttalen als
  informatie-architectuur (Marokkaanse zellige-tessellatie, Indonesische batik), collectie- &
  archief-metaforen voor credentials/verificatie (filatelie-album, entomologische specimen-lade),
  retro-tech "honest computing" strak hermaakt (Hollerith-ponskaart), analoge meet-/registratie-datataal
  (seismograaf-inktlijn), en expressief high-contrast display met bewaakte leesbaarheid (stadion-LED-scorebord).
- **Reeks 13 (run 6-7-2026, nrs 121–130):** Compositie (De Stijl / neoplasticisme: orthogonaal
  zwart hairline-raster met asymmetrische primaire kleurvlakken, Nederlands erfgoed, Space Grotesk —
  niet Bauhaus/Constructie) · Uurwerk (haute horlogerie: gunmetal wijzerplaat met guilloché-gravure,
  messing-goud subdial-complicaties voor KPI's, Fraunces — verificatie als chronometer-keurmerk,
  niet Meter) · Portolaan (historische zeekaart: kompasroos + radiale rhumb-lijnen + dieptelood op
  perkament, matching als navigatie, Newsreader — niet Atlas/Radar) · Suminagashi (Japanse drijvende
  inkt-marmering: concentrische inkt-ringen op rijstpapier, sereen/low-stimulation, Sora — niet
  Aquarel/Japandi) · Typemachine (mechanisch schrift: monospace body op typpapier met rood-zwarte
  inktlint-tweekleur, IBM Plex Mono — tactiel-ambachtelijk, niet Console/Courant) · Histologie
  (H&E-kleuring: eosine-magenta/hematoxyline-paars weefsel-textuur op objectglas met meetschaal,
  klinisch passend bij zorg, niet Kliniek/Röntgen) · Cyanotype (fotografische zonnedruk à la Anna
  Atkins: witte silhouetten op Pruisisch blauw met belichtings-vignetten, monochroom, niet
  Blauwdruk/Röntgen) · Spectraal (audio-DAW: waveform-balken, spectraal-analyzer, EQ-banden en
  VU-gloed, niveau-meters als statustaal, Geist Mono — niet Montage/Groef/Seismograaf) · Seinvlaggen
  (maritieme codetaal: internationale seinvlag-motieven in rood/geel/blauw/wit als status-alfabet,
  bold-geordend, Space Grotesk — niet Signaal/Bauhaus) · Jaarringen (dendrochronologie: concentrische
  boom-groeiringen coderen tijd/mijlpalen in warm spint-/kernhout, organische data-viz, Newsreader —
  niet Ringen/Groef). Alle tien gebruiken bestaande lab-fonts — geen nieuwe fonts nodig.
- Onderzochte 2026-trends deze reeks: analoge/cyanotype- en fotografische procédés als
  vertrouwens-esthetiek (cyanotype-zonnedruk, histologie-objectglas), erfgoed-material­iteit met
  Nederlandse wortels (De Stijl neoplasticisme, portolaan-zeekaart), haute-craft luxe als
  verificatiegebaar (guilloché-horlogerie), organische/natuurlijke data-visualisatie (dendro-jaarringen,
  suminagashi-marmering), gecodeerde signaal-systemen als statustaal (maritieme seinvlaggen) en
  audio-native interfaces (waveform/spectrum-DAW) — elk onderscheidend gehouden van bestaande richtingen.
- **Reeks 14 (run 6-7-2026, nrs 131–140):** Atelier (couture-naaipatroon: tissue-papier met
  stippel-kniplijnen, kerf-notches en maatgradatie in inktblauw + rood signaal, Fraunces —
  editorial-technisch, niet Folio/Botanie) · Sluis (Deltawerken/waterpeil-infographic: staalblauw
  met NAP-peilschalen, sluis-doorsnedes en debiet-stroom, data-dicht ingenieurs, Geist — niet
  Meteo/Portolaan) · Wegwijzer (ANWB-snelwegbebording: RWS-groene/ANWB-blauwe borden met
  signage-typografie, de opdracht-reis als bewegwijzerde afritten, Libre Franklin — niet
  Metrokaart/Pictogram) · Cockpit (avionics glass-cockpit: donker antraciet met avionics-groen/amber,
  attention-managed statuskern + checklists, Geist Mono — niet Meter/Console) · Kaartenbak
  (bibliotheek-kaartcatalogus: warm eiken met crème indexkaarten, A–Z-tabkaarten en messing
  labelhouders, Newsreader — niet Dossier/Boekband) · Loep (pro-tool inspector: master-detail met
  properties-paneel, chips en inline-acties, ultra-precies, Inter — niet Index/Revisie/Kader) ·
  Neonbord (hand-gebogen neon-uithangbord: meerlaagse glow-buisletters op donkere muur, oplichtende
  status-badges, Space Grotesk — niet Neonzon/Chroom) · Kruissteek (geteld kruissteek-sampler:
  X-steek-pixelraster als layout-grid op linnen met DMC-garenchips, JetBrains Mono — niet
  Textiel/Memphis) · Knooppunt (force-directed relatiegraaf: knopen ZZP'er↔opdracht↔opdrachtgever↔
  credential met edge-gewicht = match-sterkte, verklaarbare matching, Geist — niet
  Sterrenbeeld/Metrokaart) · Situatiekamer (ops-wallboard/NOC: donker high-density statusmuur met
  severity-triage en verificatie-wachtrij, altijd label+icoon, Geist — niet Kiosk/Scorebord/Beurs).
  Alle tien gebruiken bestaande lab-fonts — geen nieuwe fonts nodig.
- Onderzochte 2026-trends deze reeks: attention-managed interfaces uit high-stakes domeinen
  (avionics glass-cockpit, NOC-situatiekamer) als antwoord op "toon alleen wat actie vraagt";
  wayfinding & infrastructuur-datataal met Nederlandse wortels (ANWB-bebording, Deltawerken-peilen);
  netwerk-/graafvisualisatie voor verklaarbare matching (force-directed relatiegraaf); pro-tool
  master-detail inspector-paradigma (Figma/Linear-grade dichtheid); en ambachtelijke material- &
  craft-esthetiek strak hermaakt (hand-gebogen neon-signage, geteld kruissteek-borduren,
  bibliotheek-kaartcatalogus) — elk onderscheidend gehouden van bestaande richtingen.
- **Reeks 15 (run 7-7-2026, nrs 141–150):** Schijnwerper (cinematische spotlight: donker canvas waar
  één radiale lichtkegel valt op wat NU actie vraagt, rest gedimd — attention-routing/spatial focus,
  Space Grotesk — niet Schemer/Nachtdienst) · Rasterpunt (Ben-Day halftone: meters/avatars/dichtheid
  opgebouwd uit drukkerspunten, twee-tint pop-art newsprint, Space Grotesk — de stip zelf als
  materiaal, niet Riso/Strip) · Kantlijn (marginalia/geannoteerd manuscript: brede kantlijn met
  margenoten, verwijstekens en voetnoot-apparaat naast gelinieerde kolom, Newsreader — annotatie als
  UI, niet Redactie/Courant) · Warmtekaart (heatmap-gedreven: calendar-heatmaps, match-matrices en
  regio-dichtheid waar intensiteit = kleurverzadiging, sequentiële schaal + cijfer-in-cel, Geist —
  eerste heatmap-concept) · Meetlint (technische maatvoering: liniaal-schalen, maatlijnen met
  maatgetallen en tolerantie-notatie, elk datapunt opgemeten, Spline Sans Mono — niet Blauwdruk/Meter)
  · Noir (film-noir monochroom: diep zwart-wit contrast met één warm amber-accent, venetian-blind-
  schaduwen en grain, Bricolage — dramatische lichtregie, niet Schemer/Nachtdienst) · Zonnewijzer
  (schaduw & zonnetijd: warm zandsteen met gnomon-schaduwen over de kaarten, tijd/voortgang als
  schaduwhoek, Fraunces — niet Uurwerk/Solar) · Totem (gestapelde chunky blokken: kaarten als dikke
  afgeronde bouwblokken met offset-schaduw en diepte, speels-tactiel verticaal, Bricolage — niet
  Memphis/Klei) · Gel (gooey fluïde UI: zachte organische blobs met translucente lagen die
  samensmelten en morphen bij hover, Sora — niet Tij/Klei) · Manifest (constructivistische avant-garde:
  bold diagonale composities in rood/zwart/crème met zware grotesk, data in geroteerde banners,
  Bricolage — dynamische diagonaal, niet Bauhaus/Deco). Alle tien gebruiken bestaande lab-fonts.
- Onderzochte 2026-trends deze reeks: attention-routing & progressive disclosure via belichting/dimming
  (spotlight-canvas als antwoord op "toon alleen wat telt"); print-revival & material-craft strak
  hermaakt (Ben-Day halftone, marginalia/voetnoot-apparaat, film-noir fotografische drama); data-viz
  als primaire layout (heatmap-matrices, technische maatvoering met dimension-lines); natuurlijk licht
  & organische vorm (zonnewijzer-schaduw, gooey fluïde blobs); en expressieve, tactiele richtingen
  (gestapelde block-UI, constructivistische diagonaal) — elk onderscheidend gehouden van bestaande.
- **Reeks 16 (run 7-7-2026, nrs 151–160):** Fosfor (fosforgroene CRT-terminal, command-line-first met
  scanlines/glow en een prominent commandopalet — keyboard-first, niet Teletekst) · Zwerk (ruimtelijke
  visionOS-diepte: gelaagde translucente panelen met parallax z-diepte en depth-of-field boven een
  omgevingsgradient — spatial layering, niet Glas/Vloeiglas/Gel) · Reglet (guilloché-veiligheidsgravure:
  intaglio-hairline-rozetten en microtekst als vertrouwensmotief van waardepapier, ivoor + groen-goud —
  niet Paspoort/Filatelie/Zegel) · Halogeen (warme dark met amber halo-gloed, houtskool i.p.v. koud
  blauw — warm-dark-trend, niet Schemer/Noir) · Cel (spreadsheet-native: frozen headers, celselectie en
  keyboard-cel-navigatie als volledige UI-metafoor — niet Beurs/Grootboek) · Marge (editorial
  minimalisme/slow UI: dramatische witruimte en groot display-type, Fraunces — niet Tij) · Karmijn
  (monochroom-tonaal: de hele UI in gradaties van één rijke tint, status via toon + icoon — niet
  Spectrum/Palet) · Raamwerk (zichtbare constructielijnen: hairline-grids, registratie-ticks en
  meetlijnen in neutraal papierwit — ingenieurs-esthetiek, niet Blauwdruk) · Panorama (horizontaal
  wide-canvas: schermen als aangrenzende panelen met filmstrip-glide en mobiel-snap — ruimtelijke
  horizontale navigatie) · Bouwplaats (hi-vis werkplaats: signaalgeel + zwart, hazard-diagonaalstrepen
  en stencil-koppen voor veldwerk — industrieel, niet Neon/Scorebord). Alle tien gebruiken bestaande
  lab-fonts.
- Onderzochte 2026-trends deze reeks: keyboard-first & command-driven interfaces (terminal-revival,
  commandopalet als hoofdnavigatie); spatial/visionOS-diepte (gelaagde translucentie, depth-of-field,
  parallax); warm dark mode (amber halo i.p.v. koud grijs-blauw); data-native structuren (spreadsheet-
  grid, zichtbare constructie-/meetlijnen); editorial slow UI met dramatische witruimte; monochroom-
  tonale één-hue-immersie; interactie-gedreven horizontale navigatie (wide-canvas glide); en material/
  domein-esthetiek strak hermaakt (guilloché-veiligheidsgravure, hi-vis PPE) — elk onderscheidend
  gehouden van de bestaande 150.
- **Reeks 17 (run 7-7-2026, nrs 161–170):** Kintsugi (keramiek met onregelmatige gouden reparatie-naden
  als scheidslijn — de breuk hersteld in goud als vertrouwens-metafoor, warme crème-steen + craquelé,
  Fraunces — niet Lakwerk/Perkament) · Bureaublad (spatial venster-OS: menubalk, sleepbare venster-kaarten
  met traffic-light-chroom en diepte, dock onderaan als navigatie — OS-metafoor, niet Widget/Zwerk) ·
  Zwartlicht (UV-echtheidscontrole op bijna-zwart: beveiligingskenmerken die oplichten in fluor-magenta/
  cyaan, gloed alléén op geverifieerd/echt — security-glow, niet Röntgen/Neonbord) · Krijtstreep
  (sartoriaal maatpak: fijne pinstripe-wol in antraciet/marine met ivoor + messing accent, quiet luxury —
  afgewerkt pak, niet Textiel/couture-patroon) · Vorst (koel crystalline: frosted glas met ijskristal-
  fractals en rijp-randen, ijsblauw/zilver — bevroren, niet Vloeiglas/Gel/Glas) · Legpuzzel (matching als
  in elkaar passende puzzelstukken, ontbrekende credential = ontbrekend stukje — vorm-als-betekenis,
  speels-strak) · Marqueterie (houtinleg/intarsia: ingelegde geometrische banden in noten/eiken/kersen
  met nerf-textuur en messing filets — edel hout, niet Karton/Kraft) · Weegschaal (justitie-/apothekers-
  balans als layout: symmetrisch evenwicht, kantelende weegbalk die plus↔min en geverifieerd↔te-doen
  weegt, messing op warm papier — eerlijkheid/tweezijdig) · Almanak (Nederlandse getijden-almanak:
  perkament met marineblauwe drukinkt, dichte getijtabellen, maanfase-glyphs en kompasroos — print-data-
  density, niet Zeekaart/Beurs) · Caleidoscoop (radiale 12-voudige spiegelsymmetrie via conic-gradients/
  SVG als strak-begrensde accenten in headers/badges/match-ringen boven clean-witte content — expressief
  premium, niet Zellige/Memphis). Alle tien gebruiken bestaande lab-fonts.
- Onderzochte 2026-trends deze reeks: material-craft & wabi-sabi ambacht als vertrouwenstaal (kintsugi
  gouden naad, houtinleg/intarsia, sartoriale pinstripe-wol); spatial/OS-metaforen (venster-OS met dock);
  refined dark mode met gerichte luminescentie als betekenis (UV-security-glow, gloed = state, niet
  decoratie); crystalline/frosted materiaal (ijskristal-fractals, kouder dan liquid-glass); vorm-als-
  betekenis & expressief-joyful premium (puzzelstuk = match, radiale kaleidoscoop-symmetrie op neutrale
  basis); en print-revival data-density met symboolrijke informatie (maritieme almanak, evenwicht/balans-
  metafoor voor eerlijke, verklaarbare matching) — elk onderscheidend gehouden van de bestaande 160.
- **Reeks 18 (run 8-7-2026, nrs 171–180):** Diafragma (fotografische scherptediepte: scherm-in-focus
  messcherp, secundaire panelen bokeh/blur, aperture-lamellenring als match-motief — spatial depth, niet
  Loep/Cinema) · Notariaat (ledger-serif formeel: perkament-ivoor, serif-koppen + tabulaire ledger-cijfers,
  geëmbosseerd zegel — leest als aangifte, niet Dossier/Grootboek/Zegel) · Mycelium (biofiel organisch
  netwerk: mos-en-klei-palet, SVG-schimmeldraden verbinden matches/samenwerkingen — levende warmte, niet
  Botanie/Knooppunt) · Letterpers (diepdruk/deboss: type en kaarten fysiek in dik papier geperst, inkt-
  squash-randen, geperst zegel — tactiel drukwerk, niet Typemachine/Riso/Courant) · Parallax (bewegende
  dieptelagen: lagen zweven op verschillende snelheid mee met de cursor, cast-shadow-scheiding, voorste
  content scherp — spatial motion) · Magneet (magnetische micro-interacties: knoppen/kaarten/match-ring
  trekken naar de cursor en veren met snap terug — micro-delight, niet Kinetiek) · Korrel (filmkorrel &
  scanlines: statisch gegenereerde grain-overlay + CRT-lijnen op strak grid — analoge warmte, niet Riso/
  Noir/Cyanotype) · Sediment (geologische strata: horizontale aardlagen met band-kleur en depositie-lijnen,
  diepte = gewicht/tijd — stratigrafie, niet Jaarringen/Terrazzo/Marmer) · Damast (tone-on-tone geweven
  jacquard: fijn ornament kleur-op-kleur onder strakke content, jacquard-glans bij hover — ingetogen luxe,
  niet Textiel/Batik/Zellige) · Diorama (papiergesneden dieptelagen: gestapelde uitgesneden papierlagen met
  cast-shadows, lagen schuiven bij hover uit elkaar — shadowbox-diepte, niet Origami/Karton/Legpuzzel).
- Onderzochte 2026-trends deze reeks: **spatial depth** graduated van hype naar praktijk (scherptediepte-
  focusvlakken, muisgestuurde parallax-lagen, papercut-shadowbox) — diepte als informatie-hiërarchie zonder
  visuele ruis; **type-dominant / ledger-serif** (elegante serif + tabulaire cijfers die "als een aangifte
  lezen, geen pitch deck"); **tactiele textuur & materiaal-warmte** als tegenwicht voor flat minimalism
  (letterpress deboss, mathematisch gegenereerde film-grain/scanlines, geweven jacquard); **micro-
  interactions / magnetic cursor** (magnetische aantrekking + spring-snap als micro-delight); en **biophilic
  / human-centered warmth** (organische mycelium-netwerken, aardse strata) — elk onderscheidend gehouden van
  de bestaande 170.
- **Reeks 19 (run 8-7-2026, nrs 181–190):** Refractie (Liquid Glass / visionOS-2026: échte optische
  lenswerking — translucente panelen breken het coördinaatraster erachter via feDisplacement, specular
  edge-highlights + hover-sweep, koel iris/violet — geen platte glassmorphism) · Hoogtelijn (topografische
  contour-cartografie: hoogtelijnen + hypsometrische tinten groen→zandbruin, coördinaat-hairlines, match% =
  hoogte — data-terrein, niet Atlas/Portolaan/Wegwijzer) · Halftoon (CMYK-halftoon drukwerk: fijne dot-
  gradient beeldvlakken, offset-registratiekruisjes, spot-magenta over zwart, puntdichtheid = waarde —
  analoog print-revival, niet Riso/Ponskaart) · Molecuul (moleculaire chemie: zeshoekige skeletformules +
  bal-en-staaf-knopen met exacte bindingshoeken, matching = affiniteit — clinisch-lab, niet Mycelium/
  Knooppunt) · Diepzee (bioluminescent abyssaal donker: gloeiende aqua/cyaan-accenten + sonar-ping-ringen in
  inktblauw, KPI's gloeien als kwallen — organisch oceaanlicht, niet CRT/Neon/Nachtdienst) · Jaloezie
  (cinematografisch licht & schaduw: diagonale goud-amber banden als zonlicht door luxaflex over solide
  content — filmisch-noir sfeer, niet Noir/Cinema) · Suprematie (suprematisme Malevich/Lissitzky: vrij-
  zwevende geometrische vlakken + dynamische diagonalen, rood/zwart op warm-wit — spanning & witruimte, niet
  Bauhaus/Memphis/Manifest) · Vouwkaart (gevouwen papieren wegenkaart: vouwlijnen delen het scherm in
  panelen, secties vouwen open/dicht, legenda-typografie — het fysieke object, niet kaart-content) ·
  Passepartout (museum passe-partout: elk blok als kunstwerk in beveled mat-venster met museum-label-
  typografie + serene marge — galerie-omlijsting, niet Vitrine/Kader) · Amber (monochroom amber: één
  merkkleur door alles heen op donker-warme basis, rijke lichtheid-ladder, status via lichtheid+vorm+icoon —
  warm editorial-duotoon, niet Fosfor/Neon).
- Onderzochte 2026-trends deze reeks: **Liquid Glass / spatiale refractie** als bepalende OS-esthetiek
  (visionOS/iOS 26 — dynamische optische lenswerking i.p.v. statische blur; refractie, translucentie en
  diepte als levend materiaal); **cartografische & wetenschappelijke datavisualisatie** (hypsometrische
  hoogtekaarten, moleculaire skeletgeometrie als informatiesysteem); **analoog print-revival** (CMYK-
  halftoon, offset-registratie als grafisch systeem); **cinematografisch licht & bioluminescentie** in
  donkere modi (venetian-blind licht/schaduw, organisch glow-licht met WCAG-contrast i.p.v. neon); en
  **avant-garde kunsthistorie** (suprematisme, museale passe-partout, monochroom merkkleur-systeem) — elk
  onderscheidend gehouden van de bestaande 180.
- **Reeks 20 (run 8-7-2026, nrs 191–200):** Glasvezel (fiber-optic light-routing: dunne lichtgevende
  glasvezel-strengen verbinden datapunten op donker canvas, deterministische licht-puls langs de vezel als
  motion-with-purpose, één koel cyaan-accent — licht als informatie, niet Knooppunt/Neon) · Nieuwe Beelding
  (De Stijl / Mondriaan-Rietveld: streng orthogonaal raster met dikke zwarte scheidingslijnen + primair
  rood/geel/blauw op wit, gebalanceerd-asymmetrische compositie — iconisch NL, andere uitvoering dan
  Compositie/Bauhaus/Suprematie) · Kalligrafie (copperplate inkt-editorial: warm perkament + aubergine-inkt,
  grote italic swash-koppen, gouden hairline-flourishes, ledger-cijfers — vloeiend-formeel vertrouwen, niet
  Notariaat/Letterpers/Typemachine) · Heraldiek (wapenschild-vertrouwenstaal: verificatie als heraldische
  schilden met velden/ordinaties, bordeaux/goud/nachtblauw op perkament, geverifieerd = verzegeld wapen —
  emblematisch, niet Zegel/Paspoort/Passepartout) · Sequencer (DAW piano-roll timeline: diensten als clips
  op tijdlijn-lanen met playhead + transport + ⌘K command-palette, donkere studio-UI — keyboard-first
  planning, niet Metrokaart/Agenda) · Observatorium (planetarium orbitale planning: concentrische orbit-
  ringen met opdrachten/acties als planeten op hun baan, afstand = urgentie, verificatie = uitgelijnde
  constellatie — orbitaal/hemelbol, niet Sterrenbeeld/Radar) · Speelkaart (speelkaarten-taal: opdrachten als
  kaarten met suit-indices ♠♥♦♣, licht waaierende hand + 3D kaart-flip op crème vilt — speels-tactiel, niet
  Kaart/Legpuzzel) · Telraam (abacus-datavisualisatie: KPI's als kralen-op-messingstaven in warm houten
  frame, waarde = geschoven kralen — tactiel-ambachtelijk, niet Weegschaal/Meetlint) · Perspectief (één-punts
  lineair perspectief: convergerende vluchtlijnen naar verdwijnpunt + terugwijkend vloerraster, kaarten met
  echte Z-diepte — spatiale ruimte, niet Isometrie/Diorama/Parallax) · Hologram (holografische iriserende
  echtheidsfolie: verificatie als kleur-verschuivend echtheidszegel op donker basisvlak, iridescente
  hairline-randen — security/echtheid, niet Chroom/Zwartlicht/Reglet · mijlpaal nr. 200).
- Onderzochte 2026-trends deze reeks: **spatiale diepte-hiërarchie** (één-punts perspectief, orbitale
  planetarium-lagen, fiber-optic diepte — interfaces als ruimte met oppervlakken, niet als plat canvas);
  **command-/keyboard-first** (DAW-transport + ⌘K-palette als primaire navigatie); **tactiele maximalisme &
  materiaal-metaforen** (abacus-kralen, speelkaarten-vilt, houten frames — warmte & aanraakbaarheid tegen
  steriele minimalisme); **editorial serif + ledger-cijfers** (copperplate-kalligrafie, heraldische
  small-caps); en **motion-with-purpose** (licht-puls langs glasvezel, iriserende folie-shift) — elk
  onderscheidend gehouden van de bestaande 190.
- **Reeks 21 (run 9-7-2026, nrs 201–210):** Sneltoets (keyboard-first command deck: permanente
  ⌘K-palette stuurt alle navigatie aan, monospace kbd-chips overal, J/K-rijselectie — power-user-snelheid,
  niet Schijnwerper/Sequencer) · Tijdbalk (swimlane-Gantt: opdrachten/samenwerkingen als balken langs één
  tijd-as met vandaag-lijn, vervaldatums als markers, facturen als mijlpalen — temporele planning, niet
  Agenda/Metrokaart/Uurwerk) · Triage (inbox-zero queue: heterogene wachtrij met split-view en snelle
  triage-acties + kbd-hints, inbox-zero-empty-state — werkfilosofie, niet Kaartenbak/Prikbord) · Kolommen
  (Kanban-workflowbord: opdracht-pijplijn en verificatie-flow als stadia-kolommen met tellingen en
  kaart-lift — workflow-board, niet Kwadrant/Widget) · Leder (verfijnd skeuomorfisme: gestikt cognac-leder,
  embossed labels, wax-zegels voor verificatie — skeuo-revival met smaak, niet Lakwerk/Textiel/Boekband) ·
  Vuurtoren (maritiem baken: roterende lichtkegel + afstandsringen, opdrachten als schepen op reistijd —
  nabijheid als matching-hoofdas, niet Radar/Diepzee/Portolaan) · Steendruk (fijnkunst-lithografie: tonale
  krijt-korrel, beperkt inkt-palet op kalksteen-crème, registratie-kruisjes + plaatrand — ambachtelijke
  print, niet Riso/Letterpers/Cyanotype) · Parelmoer (nacre/iriserende folie op wit: zachte
  mint-lila-perzik-glans alleen op sleutelelementen, clean witte basis — premium foil, niet
  Hologram/Chroom/Spectraal) · Klapbord (split-flap Solari-vertrekbord: KPI's/bedragen als omklappende
  tegels met middennaad + flip-transitie, amber op antraciet — mechanische nostalgie, niet
  Teletekst/Scorebord) · Sjabloon (industrieel spray-stencil: uitgesneden-letter-koppen met sjabloon-bruggen,
  kratlabels, spaarzame waarschuwingstape op kraft/beton — industriële markering, niet
  Letterpers/Typemachine).
- Onderzochte 2026-trends deze reeks: **keyboard-/command-first UX** (⌘K-deck, inbox-triage,
  Superhuman/Linear/Raycast-idioom als primaire interactie i.p.v. decoratie); **temporele & workflow-
  structuur** (swimlane-Gantt, Kanban-stadia — de structuur ís de UI); **verfijnd skeuomorfisme &
  mechanische/analoge nostalgie** (gestikt leder, split-flap Solari, industrieel stencil — tactiliteit &
  materiaal tegen steriel minimalisme); **iriserende folie/nacre** (holographic foil, maar licht & premium
  op wit); en **ambachtelijke print-esthetiek** (tonale steendruk met beperkt inkt-palet) — elk
  onderscheidend gehouden van de bestaande 200.
- **Reeks 22 (run 9-7-2026, nrs 211–220):** Getal (data-als-typografie: kerncijfers Zwitsers-groot
  in tabulaire numeralen, hiërarchie via schaal + witruimte i.p.v. kaders — oversized-numeric, niet
  Beurs/Grootboek) · Loket (digitale-overheid-vertrouwen: Rijkshuisstijl-blauw op wit, "u bent
  hier"-stappen + statusbalken, institutionele degelijkheid rond VOG/BIG — govtech-civic, niet
  Helder/Handleiding) · Contour (monoline outline: puur lijnwerk, hairline-randen en outline-iconen,
  near-zero fills/schaduwen, kleur alleen bij hover/actief — line-art-minimalisme, niet Blauwdruk/Raster) ·
  Marker (highlighter-annotatie: fluor-markeerstiftvegen achter sleutelwoorden, handgeschreven
  onderstreping op actieve tabs, marginale notities — redactioneel-menselijke emfase, niet
  Kantlijn/Redactie) · Kwelder (biofiel-natuurlijk: gedempte salie/klei/zand, organische radii, laag-
  prikkelend en warm — natural-calm-palet, niet Tij/Japandi/Botanie) · Cassette (retro hi-fi paneel:
  geborsteld donker vlak, VU-meter-segmenten voor score/omzet, amber displaylicht, cassette-labelstroken —
  analoge hi-fi-nostalgie, niet Klapbord/Console/Sequencer) · Blok (verfijnd neubrutalisme: harde
  2px-randen + offset-slagschaduwen, platte heldere vlakken, knoppen die "indrukken" — tactiel color-
  blocking, niet Memphis/Bauhaus) · Middernacht (premium product-dark: diep blauw-zwart, hairline-glow-
  borders, elektrisch-indigo accent, ⌘K-command-menu — schoon Linear/Vercel-dark zonder neon, niet
  Nebula/Noir/Nachtdienst) · Onthaal (warm-menselijk gastvrij: crème/perzik/terracotta, royale radii en
  grote raakvlakken, hartelijke maar zakelijke toon — human-centered warmte, niet Haard/Klei) · Snoep
  (kleurrijk-speels: candy roze/lila/mint/citroen op zacht-wit, ronde vormen en bounce-hover, blije
  empty-states — tasteful-playful, niet Memphis/Arcade).
- Onderzochte 2026-trends deze reeks: **data-as-typography & oversized-numeric display** (het cijfer
  zelf als compositie); **govtech/civic-trust & accessibility-first** (institutionele helderheid als
  vertrouwenstaal rond gevoelige verificatie); **monoline/outline-UI & annotation-emfase** (line-art-
  minimalisme, highlighter-as-emphasis); **biophilic/natural-calm palettes** (gedempt-aards, low-
  stimulation); **analoge/mechanische nostalgie & refined neubrutalism** (VU-meter/hi-fi, hard-shadow
  color-blocking, tactiele press-states); **premium product-dark met hairline-glow & keyboard-first
  ⌘K**; en **warm human-centered + tasteful-playful maximalism** (gastvrije warmte, candy-kleur met
  behoud van contrast) — elk onderscheidend gehouden van de bestaande 210.
- **Reeks 23 (run 9-7-2026, nrs 221–230):** Duplex (duotoon split-screen editorial: dramatische
  asymmetrische split met harde verticale scheidslijn, oversized display-typografie, twee basiskleuren +
  één vermiljoen-accent — bold-duotone, niet Folio/Redactie) · Grafiet (monochroom tactiel-mat: potlood-
  op-papier met deterministische SVG-arcering, warme grijsschaal, exact één oker/roest-accent —
  monochrome-refinement, niet Krijt/Schetsboek) · Kwarts (kristallijn frosted glas: koele translucente
  backdrop-blur-panelen, gefacetteerde clip-path-randen, ijsblauw/lila hoek-refractie, gestapelde glaslagen —
  spatial-translucency-2.0, mineraal i.p.v. Glas/Vloeiglas) · Veer (ultralicht & luchtig: veel witruimte,
  zwevende kaarten met diffuse schaduw, spring-easing lift op hover — airy/gewichtloos, niet Puur/Ruimte) ·
  Anker (maritiem-industrieel solide: diep staalblauw + koper-accent, robuuste randen, touw-/ketting-SVG —
  industrial-trust, niet Beton/Karbon) · Etage (gelaagde z-depth stacking: verdiepingen-metafoor, dubbele
  offset-schaduwlagen, zichtbare stapelblokjes — layered-depth, niet Relief/Isometrie) · Kompres (hyperdense
  keyboard-first command-center: mono-grid, ⌘K-palette, sneltoets-chips, tabulaire operator-view — dense-
  keyboard-first, niet Beurs/Console) · Saffier (juweel premium-dark: diep saffierblauw + goud-champagne,
  edelsteen-facet-glans, serif-koppen — jewel-tone-luxe, niet Middernacht/Zilver) · Vonk (energiek elektrisch:
  antraciet met fel volt-lime accent, gloed-op-focus, voltmeter-boog + energiebalken — motion-forward, niet
  Neonzon/Puls) · Horizon (ultra-wide panoramisch cinematisch: horizontale ritmiek, full-bleed dageraad-
  gradient met horizon-lijn, opkomende-zon-match-boog — panoramic-calm, niet Panorama/Zwerk).
- Onderzochte 2026-trends deze reeks: **bold-duotone split-screen editorial** & **monochrome-refinement met
  tactiele textuur**; **spatial-translucency 2.0** (frosted glas met facet-randen en lichtbreking);
  **airy/weightless whitespace met spring-motion**; **industrial-solid trust-materialen** (navy + koper,
  degelijk vakwerk); **z-depth/layered-stacking** als navigatie-metafoor; **hyperdense keyboard-first
  command-centers** (⌘K, mono-grid); **jewel-tone premium-dark** (saffier + goud); **electric motion-forward
  met glow-on-focus**; en **ultra-wide panoramic/cinematic-calm** (horizon-ritmiek, dageraad-gradient) — elk
  onderscheidend gehouden van de bestaande 220.
- **Reeks 24 (run 10-7-2026, nrs 231–240):** Carson (anti-design / gedeconstrueerd raster: bewust gebroken
  grid, overlappende & geroteerde Anton-koppen, sterk wisselende schaal, diagonale rode annotatie —
  kern-data blijft leesbaar; expressieve chaos aan de randen, niet Neubrutalisme/Suprematie) · Draadmodel
  (wireframe-as-final-UI: lo-fi grijze outline-kaders, kruis-placeholders, hachuur, handgeschreven
  Architects-callouts met stippellijn-pijltjes, één blauw accent — function-forward, niet Blauwdruk/Constructie) ·
  Knipsel (ransom-note / zine-collage: uitgeknipte letters in wisselende fonts op papiersnippers, gescheurde
  randen, plakband-strips, deterministische fotokopie-korrel, stempel-badges — DIY-punk, niet Riso/Courant) ·
  Systeem (systeem-brutalisme / raw HTML: Times-koppen + system-ui + monospace, blauwe onderstreepte links,
  native form-controls, zwarte hairline-tabellen, nul decoratie — anti-Liquid-Glass pro-functie, niet
  Helvetia/Technische-documentatie) · Jugendstil (art nouveau: Mucha-zweeplijnen als SVG-ornament, botanische
  smeedijzer-frames, salie-goud-palet, Cormorant-serif — organische elegantie, niet Deco/Marmer) · Ukiyo-e
  (Japanse houtblokdruk: platte kleurvelden, houtsnede-outline, golf-/berg-motief, indigo + vermiljoen op
  rijstpapier, Shippori-mincho — niet Urushi/Japandi) · Op-art (optische kinetiek: zwart-wit lijnvelden &
  moiré-accenten die schuiven op hover, één signaalkleur, data op rustige egale vlakken — Vasarely/Riley,
  niet Meettrommel) · Voxel (isometrische pixelblokken: voxel-torens met dithered kubus-schaduw, KPI's als
  torens, status-blokjes, Silkscreen-koppen — game-strategiekaart, niet Isometrie/Relief) · Stickervel (die-cut
  stickers: dikke witte omranding + slagschaduw + lichte kantel, glans-highlight, vrolijke stickerset op grid,
  Baloo-koppen — verzamel-gevoel, niet Snoep/Memphis) · Glitch (RGB-split & databending: chromatische
  aberratie op koppen, scanlines, datamosh-hover op donker antraciet, data blijft rotsvast scherp,
  Space-Mono — digitale-decay met terughoudendheid, respecteert reduced-motion, niet Fosfor/Techno-futurist).
- Onderzochte 2026-trends deze reeks: **anti-design / broken-grid revival** (David Carson, botsende
  typografie); **wireframe-as-final-UI** (function-forward, de blauwdruk ís het product); **ransom-note / zine
  & lo-fi print-esthetiek**; **raw-HTML / systeem-brutalisme** als anti-Liquid-Glass-tegenbeweging;
  **art-nouveau organische ornament-revival**; **ukiyo-e houtblokdruk / vlakke kleurvelden**; **op-art /
  optische kinetiek met moiré**; **voxel / isometrische pixel-datavisualisatie**; **die-cut sticker-badges /
  tasteful-playful maximalism**; en **glitch / RGB-split databending** — elk onderscheidend gehouden van de
  bestaande 230.
- Reeks 25 (241–250, run 10-7-2026) — tien richtingen die verschillen van de bestaande 240:
  Adaptief (progressive disclosure / rol-adaptieve interface: rol-schakelaar reflowt het scherm, kaarten
  klappen op verzoek uit — bewust mínder in de juiste volgorde, niet Widget/Kompres) · Etmaal (circadiaan /
  tijd-adaptief: dag-tijdlijn kantelt het hele palet van warm daglicht naar koel gedimd nacht, dienstritme
  voor de zorg — niet Nachtdienst/Schemer) · Anaglyf (stereoscopische rood-cyaan kanaalverschuiving als
  sfeer op koppen/randen, data blijft rotsvast scherp, respecteert reduced-motion — niet Glitch/Refractie) ·
  Osmose (fluïde metaballs: gooey-filter laat avatars/statusstippen samensmelten & splitsen, trage organische
  motion, data crisp — niet Suminagashi/Gel) · Variabel (variable fonts als systeem: één display-face draagt
  hiërarchie via gewicht/breedte/optische as, gewichtsverschuiving op hover, Bricolage — niet Letterpers/
  Nieuwe-Beelding) · Zwaartekracht (spatial physics: kaarten als objecten met massa, meebewegende gelaagde
  schaduw, press-in bij indrukken — niet Etage/Kwarts) · Serre (solarpunk daglicht-optimisme: botanisch groen
  - warm messing, organische hoeken, bladlijnen omlijsten crisp data, Fraunces — niet Botanie/Japandi) ·
    Choreografie (motion-first: georkestreerde staggered reveals met per-index delay bij navigatie, sturen de
    aandacht, strikt reduced-motion-safe — niet Vonk/Kinetiek) · Warmte (warm-menselijk: aardetinten, ronde
    vormen, diffuse schaduw, mens & vertrouwenssignalen centraal, Fraunces + Manrope — niet Haard/Leder) ·
    Duiding (data-journalistiek: geannoteerde charts met bijschriften, match-redenen als datastory, redactioneel
    kolomraster, Newsreader — verklarende infographic, niet Beurs/Grootboek).
- Onderzochte 2026-trends deze reeks: **progressive disclosure als kernpatroon** & **rol-adaptieve/
  gepersonaliseerde layout** (het dominante SaaS-dashboard-patroon van 2026); **tijd-adaptief / circadiaans
  thema** (context-bewuste dag→nacht-modus); **anaglyf / stereoscopische diepte**; **metaball / gooey fluïde
  vormtaal**; **variable fonts als volledig designsysteem** (assen dragen hiërarchie, kinetische typografie);
  **spatial UX** (objecten met gewicht & diepte); **solarpunk / verduurzaamd-tech optimisme**; **motion-first
  choreografie** (staggered reveals, betekenisvolle layout-transities); **warm-menselijk mens-centraal
  ontwerp**; en **data-journalistiek / verklarende infographic** — elk onderscheidend gehouden van de
  bestaande 240 en reduced-motion-bewust.
- Reeks 26 (251–260, run 11-7-2026) — tien richtingen die verschillen van de bestaande 250:
  Lenticulair (optische lenticulaire lens: panelen met diagonale ribbel-textuur, kaarten/tegels kantelen op
  hover/focus via parallax naar een tweede laag, opdracht-redenen "flippen" in beeld, indigo→magenta accent-
  shift, reduced-motion-safe — niet Anaglyf/Stereoscopisch) · Nixie (gloeiende oranje cijferbuizen: KPI's,
  tarieven en factuurbedragen als amber Nixie-cijfers met spookcijfers op warm-zwart mesh-backplate, labels
  AA-scherp — niet Fosfor-terminal/Split-flap) · Ferrofluid (glossy zwarte magnetische-vloeistof blobs via
  SVG goo-filter met iriserend violet/cyaan rim-light, subtiel hover-reagerend, decoratief — niet Osmose/
  Gooey/Metaballs) · Lapidair (gegraveerde kalksteen met Trajan-Cormorant-kapitalen, geïnciseerd V-cut
  teksteffect, Romeinse interpuncten, permanentie/vertrouwen voor certificaten — niet Copperplate/Guilloché) ·
  Patch (modulair Eurorack-synthrek: matching als patchkabels met catenaire bezier-doorhang tussen ZZP'er-
  module en opdracht-jacks, knoppen/LED's/silkscreen, redenen als signaalroutering — niet DAW/Retro-hifi) ·
  Emaille (vintage geëmailleerd reclamebord, NS/Verkade-nostalgie: dubbele keyline-randen, afgeschilferde
  hoeken, porselein-gloss, vet condensed Anton in beperkt crème/kobalt/rood-palet — niet Neon/Apotheek-label) ·
  Reliëf (tactiel emboss + braille-stipmotieven als sectie-markers/status, maar echte AA/AAA-contrast en dikke
  focusringen, status altijd icoon + label — reliëf in randen, niet in leesbaarheid; niet Soft-UI/Helder) ·
  Zettel (Zettelkasten-kennisbank: notitie-kaarten met [[backlinks]] als primaire navigatie, kennisgraaf-
  zijpaneel dat verbonden nodes oplicht bij hover, redenen als gekoppelde referenties — niet Relatiegraaf/
  Bibliotheek) · Plotter (generatieve pen-plotter: doorlopende single-stroke lijnillustraties, hatching-vulling,
  registratie-hoekmarkeringen, grafieken als continue plotter-lijnen op crème — niet Monoline/Constructielijnen) ·
  Lichtbak (diapositief op verlichte lichtbak: 35mm dia-mounts/filmstrips die van achteren oplichten, amber
  sprocket-detail, loep-vergroting op hover, marktplaats als contact-sheet grid — niet Video-editor/Cinematisch).
- Onderzochte 2026-trends deze reeks: **lenticulaire/parallax-reveal micro-interacties**; **retro-tech
  numerieke displays** (Nixie-glow als datataal); **ferrofluid/magnetische organisch-scherpe accentvormen**;
  **lapidaire/geïnciseerde typografie als vertrouwenssignaal**; **modulaire/patch-routing als verklaarbare
  matching-metafoor**; **porselein-emaille signage-revival**; **toegankelijkheid-als-esthetiek met tactiel
  reliëf** (AA/AAA, geen low-contrast neumorfisme); **Zettelkasten/backlink-kennisgrafen** (Obsidian/Roam-
  paradigma); **generatieve pen-plotter continulijn**; en **fotografische lichtbak/diapositief met loupe** —
  elk onderscheidend gehouden van de bestaande 250 en reduced-motion-/AA-bewust.
- Reeks 27 (261–270, run 11-7-2026) — tien richtingen die verschillen van de bestaande 260:
  Arcana (tarot/esoterisch-mystiek: diep aubergine met gouden hairline-linework, celestiale motieven en
  arcana-kaart-frames met Romeinse-cijfer-hoeken, verificatie als wax-zegel/insignia, crème body voor AA —
  niet Deco/Haute-horlogerie) · Reisaffiche (vintage 1930s reisposter: platte art-deco SVG-landschapsbanden
  als hero, condensed Anton-display in beperkt teal/oker/crème/rood, opdrachten als "bestemmingen", streng
  grid eronder — niet Courant/Penguin/Constructivisme) · Bouwpakket (exploded-view montagehandleiding:
  IKEA/technische assemblage-energie, genummerde ballon-callouts met streeplijn-leaders, "stap 1/2/3"-
  structuur, verificatie als "onderdeel geverifieerd/ontbreekt" — niet Blauwdruk/Isometrie/Maatvoering) ·
  Honingraat (hexagonale tessellatie als informatie-architectuur: KPI's/modules in zeshoekige cellen die
  oplichten bij hover, honingraat-backdrop, warm amber/antraciet — niet Bento/Gestapelde-blokken) ·
  Scheurkalender (Nederlands dagblok & dagspreuk: perforatie-strip, afgescheurde hoek, page-flip hover,
  next-action als "vandaag"-blok, serif-getallen op kalender-rood/papierwit — niet Kalender-first/Agenda) ·
  Kruiswoord (genummerd puzzelraster als UI: zwart-wit cellen met superscript-nummers dragen cijfers/status,
  "horizontaal/verticaal"-aanwijzingen als nav/acties, één actieve-cel-accent — niet Hollerith/Spreadsheet) ·
  Vaporwave (pastel-mall & marmeren buste: zacht cyaan/roze op donker-violet, perspectief-rastervloer,
  buste/zuil-silhouetten, glazige panelen — onderscheiden van Synthwave-zonsondergang: geen zon/scanlines) ·
  Recept (kookboek/receptkaart: warme crème kaarten, "ingrediënten"-kolom naast genummerde "bereidingswijze",
  tijd/portie-chips voor tarief/uren, verificatie als keurmerk-zegel — niet Warm-humanist/Terra) · Nautilus
  (Fibonacci-spiraal & phyllotaxis: echte logaritmische gulden-spiraal, 137,5°-puntveld als dataviz, φ-ratio
  grid, match als spiraal-arc, off-white/inktgroen/goud — niet Sterrenkaart/Dendrochronologie) · Staalkaart
  (verfchip/Pantone-waaier: elk onderdeel een kleurstaal met code-label + naam, uitwaaierende chip-stapel op
  hover, systematisch kleur-coderen van secties, elke status een eigen swatch + icoon — niet Palet/Terrazzo).
- Onderzochte 2026-trends deze reeks: **esoterisch-mystieke gouden linework-revival**; **vintage travel-poster/
  art-deco flat-illustratie**; **exploded-view/assemblage-diagram als interface**; **hexagonale tessellatie als
  grid-alternatief voor bento**; **skeuomorfe scheurkalender/tear-off micro-interactie**; **puzzelraster als
  informatie-architectuur**; **vaporwave-revival** (onderscheiden van synthwave); **kookboek/receptkaart-
  metafoor**; **gulden snede/phyllotaxis als natuurlijk-mathematische designtaal**; en **verfchip/staalkaart-
  waaier als systematisch kleur-coderingssysteem** — elk onderscheidend gehouden van de bestaande 260 en
  reduced-motion-/AA-bewust.
- **Totaal nu op `/ontwerp`: 270 concepten** (reeks 1: 01–10, reeks 2: 11–20, reeks 3: 21–30, reeks 4: 31–40, reeks 5: 41–50, reeks 6: 51–60, reeks 7: 61–70, reeks 8: 71–80, reeks 9: 81–90, reeks 10: 91–100, reeks 11: 101–110, reeks 12: 111–120, reeks 13: 121–130, reeks 14: 131–140, reeks 15: 141–150, reeks 16: 151–160, reeks 17: 161–170, reeks 18: 171–180, reeks 19: 181–190, reeks 20: 191–200, reeks 21: 201–210, reeks 22: 211–220, reeks 23: 221–230, reeks 24: 231–240, reeks 25: 241–250, reeks 26: 251–260, reeks 27: 261–270).

## Reeks 28 (271–280) — keyboard-first, maritiem, dichroïsch, meetlat, solarisatie, sgraffito, duotone, split-flap, bioluminescent, kalkverf

- **10 nieuwe richtingen toegevoegd** (append-only; niets van 01–270 gewijzigd):
  - **271 Klavier** — toetsenbord-first: prominent ⌘K-commandopalet als centrale besturing, keycap-primitives
    met 3D-emboss + druk-animatie, per-rij sneltoets-hints, vilt-groen op ivoor, mono-forward (niet Console/
    Teletekst — palet-driven i.p.v. terminal).
  - **272 Windroos** — nautische wayfinding: kompasroos als échte radiale navigatie (inline-SVG), zeekaart-
    hairline-peilingen, match als kompaspeiling-meter, cartografische serif-cijfers, messing-op-diepteal
    (niet Kompas/Portolaan — radiale nav + peiling-gauge).
  - **273 Dichroïsch** — iriserend dichroïsch glas, premium-dark: spectrale gradient-hairlines die van tint
    wisselen bij hover (background-position-transition), bijna-zwarte glasvlakken, prismatische gloed (niet
    Glas/Vloeiglas/Parelmoer — bewegende hue-shift i.p.v. statische glasmorf).
  - **274 Getallenas** — meetlat als data-ruggegraat: doorlopende liniaal-as met maatstreepjes plaatst match/
    tarief/uren exact op schaal, graph-paper-raster, één rode maatlijn, tabulaire precisie (niet Meetlint/
    Maatvoering — as als informatie-architectuur, alles op de schaal uitgelijnd).
  - **275 Solarisatie** — fotografische solarisatie (Sabattier): donkere donkere-kamer-esthetiek met
    omgekeerde luminantie-omslag, magenta/cyaan gloei-randen, grain via CSS + mix-blend screen, match-orb met
    gloeiende ring (niet Noir/Zwartlicht/Fosfor — luminantie-inversie i.p.v. glow-op-zwart).
  - **276 Sgraffito** — ingekraste pleisterlagen: warm aards pleisterpalet (terracotta/oker/olijf), gegraveerde
    dubbele-hairline-scheidingen + carved inset-schaduwen, scratch-hatch backdrop, humanistische serif (niet
    Fresco/Perkament/Terra — incised layering als signature).
  - **277 Duotoon** — bold Pantone-duotone poster: twee-inkten (diep indigo + hot koraal) op warm papier,
    oversized display-numerals, platte kleurvlakken + harde offset-schaduwen, hero wisselt de inkten bij hover
    (niet Riso/Memphis — strakke duotone i.p.v. grain/speels).
  - **278 Splitflap** — Solari split-flap vertrekbord: zwarte tegels met scharnierlijn, mechanische
    flip-animatie (reduced-motion-bewust) bij screen-wissel/hover, amber-op-zwart mono, match/tarief/status als
    flap-tegels (niet Scorebord/Nixie/Teletekst — split-flap mechaniek als signature).
  - **279 Bioluminescentie** — gloeiende diepzee: bijna-zwart oppervlak waarin alleen wat telt oplicht in
    bio-cyaan (bloom via box-shadow/radiale gradients), organische vormen, ademende pulse op belangrijke acties,
    gloed volgt hover (niet Diepzee/Nebula/Lumen — bio-glow + breathing als aandachtssturing).
  - **280 Kalkverf** — limewash matte muren: warme krijtachtige matte vlakken met wolkige kleurovergangen,
    volledig zonder glans of schaduw, humanistische sans met veel lucht (niet Japandi/Kalk/Marmer — geschilderde
    matte wash i.p.v. steen/textuur).
- Onderzochte 2026-trends deze reeks: **keyboard-first / command-menu als primaire besturing**; **radiale/
  kompas-navigatie**; **dichroïsch/iriserend glas met hue-shift-microinteractie**; **meetlat/getallenlijn als
  informatie-architectuur**; **fotografische solarisatie (luminantie-inversie) als dark-art richting**;
  **sgraffito/incised-plaster tactiliteit**; **bold Pantone-duotone poster-typografie**; **split-flap/Solari
  mechanische micro-interactie**; **bioluminescente bloom + breathing motion** (reduced-motion-bewust); en
  **limewash/matte kalkverf-oppervlakken** — elk onderscheidend gehouden van de bestaande 270 en AA-/reduced-
  motion-bewust.
- **Totaal na reeks 28 op `/ontwerp`: 280 concepten** (reeks 28: 271–280).

## Reeks 29 (281–290) — cartografisch, broadsheet, spectrogram, blauwdruk, manuscript, origami, amber-CRT, herbarium, glas-in-lood, Zwitsers

- **10 nieuwe richtingen toegevoegd** (append-only; niets van 01–280 gewijzigd):
  - **281 Atlas** — cartografisch/topografisch (light): hoogtelijn-textuur + graticule-grid via CSS/SVG,
    kaart-pins met plaatsnaam en coördinaat/reistijd-gevoel, gedempt survey-palet, navigatie als legenda (niet
    Windroos/Portolaan — contour-kaart i.p.v. kompas/peiling).
  - **282 Courant** — krant-broadsheet, redactioneel & dicht (light): masthead met haarlijnen, meerkoloms-
    lay-out, drop caps, kolomscheidingslijnen, inkt-op-krantenpapier met één oxbloed-accent, beurspagina-tabel
    (niet Folio — nieuwskrant/hoge dichtheid i.p.v. modeblad-luxe).
  - **283 Spectraal** — audio-waveform/spectrogram data-viz (dark): equalizer-balken als KPI's, match-% als
    amplitude, spectrogram-band als divider, cyaan→violet→magenta spectrum, gloed-op-hover (niet Beurs/Nebula —
    geluids-/waveform-metafoor als signature).
  - **284 Blauwdruk** — architecturale blauwdruk/technische tekening (dark blue): drafting-grid, maatvoerings-
    pijlen naar labels, leader lines, revisie-titelblok, cyaan/wit lijnwerk op #0b2540 (niet Nebula — drafting/
    wireframe-logic i.p.v. neon-cyber).
  - **285 Perkament** — manuscript/vellum (warm light): geïllumineerde initiaal, lakzegel als verificatie-/
    vertrouwenssymbool ("Bezegeld"), rode rubricering, ganzenveer-serif op sepia (niet Folio/Terra — historisch
    manuscript-autoriteit).
  - **286 Origami** — gevouwen papier/geometrische vouwen (light pastel): kaarten met clip-path vouwhoek en
    gefacetteerde licht/schaduw-gradients, offset-vouwschaduw, crisp geometrische hoeken (niet Klei — gevouwen
    facet-geometrie i.p.v. zacht 3D).
  - **287 Amber** — CRT-terminal, amber-fosfor retro-futurist (dark): scanline-textuur, knipperende cursor,
    status-ticker, box-drawing randen, command-prompt-UI, warm amber (geen groen/neon) (niet Nebula/Console —
    amber-fosfor CRT als signature).
  - **288 Herbarium** — botanische illustratie/herbarium-vel (light): crème papier + fijn raster, inline-SVG
    plant-line-art, getypte soort-/classificatie-labels, gedroogd-plant-palet, serif+sans (niet Terra —
    botanisch/herbarium met line-art i.p.v. warm-humanist).
  - **289 Glas-in-lood** — gebrandschilderd raam/mozaïek (juweeltinten): gekleurde glasvlakken met loodlijn-
    scheiding, robijn/saffier/smaragd/amber op donker loodwerk, venster-compositie, statuskleuren als glas
    (niet Terrazzo/Delft — glas-in-lood met loodlijnen).
  - **290 Zwitsers** — International Typographic Style/Swiss grid revival (light): streng zichtbaar raster,
    grote index-numerals, flush-left grotesk, hiërarchie via type/witruimte, monochroom + één felrood (niet
    Puls — puur Zwitsers i.p.v. kleurblokken).
- Onderzochte 2026-trends deze reeks: **editorial/broadsheet-split (cream+serif vs techno-futurist)**;
  **cartografische/kaart-gestuurde interfaces**; **wireframe-logic/blueprint als eindontwerp**; **waveform/
  spectrogram data-viz**; **retro-futurisme & CRT-amber-fosfor**; **botanische line-art & herbarium**;
  **glas-in-lood/mozaïek-compositie**; **Swiss grid revival (8pt-raster, grotesk, flush-left)** — elk
  onderscheidend gehouden van de bestaande 280 en AA-/reduced-motion-bewust.
- **Totaal nu op `/ontwerp`: 290 concepten** (reeks 29: 281–290).

## Reeks 30 (291–300) — 2026-07-13

- Tien nieuwe, onderling radicaal verschillende richtingen, elk onderscheidend gehouden van de bestaande 290:
  - **291 Futurisme** — Italiaans futurisme/dynamiek (light): scherpe diagonalen, SVG force-lines, gekantelde
    en gefragmenteerde display-type (skew), schuine badges/nav, pijl-motieven, vermiljoen op gebroken-wit
    (niet Memphis/Deco — futuristische bewegingsenergie i.p.v. decoratieve vormen).
  - **292 Instant** — Polaroid/instant-film (warm): witte emulsie-frames met dikke onderrand-caption, chemische
    randgloed, gestapelde/geroteerde fotokaarten, handgeschreven bijschriften (niet Schetsboek — analoge
    fotografie-nostalgie i.p.v. potloodschets).
  - **293 Aero** — Frutiger Aero revival (glossy light): glazen aqua-oppervlakken met CSS-glans-highlights,
    aqua-verlopen, hemelblauwe glow, bolle glossy pill-knoppen, natuur-tech optimisme (niet Aqua/Gel — jaren-2000
    glossy-glas revival met bewaakt contrast).
  - **294 Zeefdruk** — pop-art silkscreen/CMYK-misregistratie (bold light): magenta/cyaan ghost-lagen nét naast
    de zwarte sleutellaag, grove halftoon-rasters, dikke omtrek + harde offset-schaduw (niet Riso — silkscreen-
    misregistratie met leesbare key-layer i.p.v. duotoon-korrel).
  - **295 Echolood** — onderzeese sonar/spectrogram-waterval (dark): spectrogram-waterval als kern-datavisualisatie,
    peilkompas met sweep-ringen, akoestische golfvorm, diepte-peilprofiel, fosforgloed op diepzee-zwart (niet
    Radar/Seismograaf — akoestisch spectrogram i.p.v. radar-sweep alleen).
  - **296 Windtunnel** — aerodynamica/flow-field streamlines (dark technisch): laminaire streamline-veldlijnen als
    achtergrond, meetraster-hairlines, velocity-gauges met drukverschil, één limoen-cyaan accent (niet Stroom/
    Choreografie — laminaire veldlijnen i.p.v. deeltjes/motion).
  - **297 Aquaduct** — Romeinse ingenieurskunst/travertijn-arcades (warm light): rondboog-arcades als layout-raster,
    travertijn-korrel, gebeitelde kapitaal-type, Romeinse nummering, terracotta accent (niet Beton/Bouwplaats —
    klassieke arcade-architectuur i.p.v. brutalistisch beton).
  - **298 Astrolabium** — messing hemel-instrument/gegraveerd (dark brass): concentrische graadringen met tick-
    schalen, roterende alidade als layout-motief, klassieke serif op nachtblauw (niet Observatorium/Windroos —
    gegraveerd messing instrument i.p.v. sterrenkaart).
  - **299 Lampion** — papieren lantaarn/warme gloed (warm dark-to-glow): zachte gloed-orbs, oplichtende ronde
    kaarten met papier-gradient, amber-koraal gloedringen op aubergine (niet Neonbord/Haard — warme lantaarn-gloed
    i.p.v. neon, met lichte tekst voor contrast).
  - **300 Zoötroop** — pre-cinema bewegingsstrip/zoetrope (playful light): sequentiële frames met filmstrip-
    perforaties, radiale zoetrope-trommel met sleuven als hoofdmotief, stroboscopisch ritme (niet Cinema/Kinetiek —
    zoetrope-frame-sequenties als kinetisch hoofdmotief).
- Onderzochte 2026-trends deze reeks: **futuristische dynamiek & force-lines**; **analoge instant-film-nostalgie**;
  **Frutiger Aero glossy-glas revival**; **silkscreen/CMYK-misregistratie**; **sonar/spectrogram-waterval-dataviz**;
  **flow-field/laminaire streamlines**; **klassieke arcade-architectuur als layout-raster**; **gegraveerde
  instrument-UI (astrolabium)**; **warme gloed-lichtbronnen in dark themes**; **zoetrope/sequentiële-frame-kinetiek** —
  elk AA-/contrast-bewust en onderscheidend van de bestaande 290.
- **Totaal nu op `/ontwerp`: 300 concepten** (reeks 30: 291–300).

## Reeks 31 (301–310) — 2026-07-14

- Tien nieuwe, onderling radicaal verschillende richtingen, elk onderscheidend gehouden van de bestaande 300:
  - **301 Ganzenbord** — speels bordspel-parcours (light, kleurrijk): de next-action-engine als genummerd
    tegelpad met een bonzende pion, dobbelsteen-tegels met pips, hover-lift en chunky drop-shadow-knoppen
    (niet Speelkaart/Arcade — bordspel-parcours als voortgangs-metafoor).
  - **302 Lopende band** — kaiten-conveyor/kinetische matchstroom (warm hout + mint): matches schuiven op een
    auto-scrollende band met pauze-op-hover en reduced-motion-fallback naar statische strook, belt-tread-slats
    als motief (niet Stroom/Choreografie — continue horizontale conveyor met motion-veiligheid).
  - **303 Maquette** — isometrische schaalmaquette (museumwit): isometrische module-blokjes met zachte
    slagschaduw, hoogte codeert match, fijne maatstreepjes, plinth-cards die zweven (niet Isometrie/Diorama —
    architecturale schaalmaquette met maatstreep-precisie).
  - **304 Zoutvlak** — woestijn-zoutvlakte minimalisme (warm neutraal): enorme witruimte, horizon-lijnen,
    kalme SaltMeter, één bleek-turquoise mirage-accent (niet Japandi/Tij — luxe door leegte en horizontale rust).
  - **305 Partituur** — muzieknotatie (ivoor + inkt + bordeaux): notenbalken als ordenend raster, match als
    noothoogte op de balk in SVG, dynamiek-tekens als status (niet Klavier/Sequencer — notatie/partituur i.p.v.
    toetsen/step-grid).
  - **306 Laboratorium** — periodiek systeem/chemie-lab (koel wit + reagent-violet): credentials als element-
    tegels (symbool + atoomnummer), match als titratie-meetschaal, laboratoriumglas-motief (niet Kliniek/
    Histologie — element-tegels + meetschalen als exacte status-taal).
  - **307 Veiling** — veilinghuis (perkament/antraciet + messing): opdrachten als kavels met paddle-nummers,
    wax-zegel-match-hallmark, serif-lotnummers, hamer/afslag-motief (niet Folio/Notariaat — ceremonieel bieden
    op kavels).
  - **308 Magma** — premium-dark met molten energie (obsidiaan + lava): gloed uitsluitend op urgentie/energie,
    radiale MagmaCore-gauge die gloeit bij hoge match en afkoelt bij lage, WCAG-contrast bewaakt (niet Fosfor/
    Middernacht — gerichte lava-gloed op koel-donkere rust).
  - **309 Zeppelin** — retro-futuristische luchtvaart (warme lucht + brass): geklonken bull-eye portholes met
    brass sweep-arc, navigatie als reisroute met legs/stops, art-deco display-type (niet Vuurtoren/Kompas —
    optimistisch retro-futurisme rond luchtvaart).
  - **310 Kruidenier** — verse marktschappen (krijtwit + verse productkleuren): opdrachten/documenten als
    producten op schappen met swing-ticket prijskaartjes, halve-cirkel weegschaal-dial, aisle-navigatie (niet
    Recept/Etiket — retail-schap als informatie-architectuur).
- Onderzochte 2026-trends deze reeks: **playful gamification/board-journey**; **kinetische conveyor-flow met
  reduced-motion-veiligheid**; **ruimtelijke/isometrische informatie-architectuur**; **calm-interface luxe door
  leegte**; **ritmische notatie-dataviz**; **periodiek-systeem-tegels als status-taal**; **ceremonieel premium-
  editorial**; **premium dark-mode met gerichte gloed-accenten**; **retro-futurisme/art-deco**; **retail-schap als
  layout** — elk AA-/contrast-bewust en onderscheidend van de bestaande 300.
- **Totaal nu op `/ontwerp`: 310 concepten** (reeks 31: 301–310).

## Reeks 32 (311–320) — 2026-07-14

- Tien nieuwe, onderling radicaal verschillende richtingen, elk onderscheidend gehouden van de bestaande 310:
  - **311 Waas** — progressive blur / scherptediepte (koel licht): diepte via gelaagde `backdrop-blur` en
    translucente glasvlakken i.p.v. schaduw, voorgrond scherp en diepere lagen vervagen, glazen match-gauge
    (niet Glas/Vloeiglas — scherptediepte als informatie-hiërarchie).
  - **312 Mechaniek** — verfijnd toetsenbord-skeuomorfisme (warm-grijs chassis + oranje legende): chunky
    keycap-oppervlakken met top-bevel en drukschaduw, echte press-travel, keyboard-first command-balk met
    keycap-hints (niet Klavier/Sneltoets — tactiele keycaps als bedienings-metafoor).
  - **313 Kladblok** — neo-utilitair "honest software" (bijna z/w + functioneel blauw): eerlijke 1px-borders,
    dichte tabellen, monospace-labelwerk (`// section`, `~/path`), Linear-achtig properties-paneel, nul
    decoratie (niet Console/Teletekst — unstyled-UI-eerlijkheid als esthetiek).
  - **314 Lichtkrant** — LED-matrix ticker-bord (houtskool + amber/emerald): scrollende status-strip, silkscreen
    dot-matrix koppen, oplichtende pixel-regels, tabulaire LED-cijfers (niet Neonbord/Scorebord — live
    stations-ticker als navigatie).
  - **315 Dauw** — kalm-fris condens & koel glas (mint/aqua): frosted glas-kaarten met fijne highlight-rand,
    druppel-match-ringen, heel veel lucht, lage prikkeling maar verfrissend (niet Tij/Japandi — koel-fris
    condens-motief i.p.v. warme rust).
  - **316 Rekenkamer** — premium fintech-grootboek (diepgroen + inkt): kwitantie-rijen, hairlines, rechts-
    uitgelijnde tabulaire bedragen, samenvattings-totalen, Mercury/Ramp-precisie (niet Grootboek/Bon —
    premium ledger-terminal rond geld).
  - **317 Diagonaal** — gebroken grid / kinetische diagonalen (fris licht + violet): schuine `clip-path`-hero-
    banden, geskewde accenten en wig-matchmeter, terwijl content-blokken recht en leesbaar blijven (niet
    Isometrie/Suprematie — broken-grid-energie met behoud van leesbaarheid).
  - **318 Filigraan** — hairline-filigrein / juweel-precisie (warm-wit + dun goud): piepdunne SVG-hoekornamenten,
    ruit-scheidingstekens, dun match-medaillon, ruim gespatieerde Cormorant-capitalen (niet Zilver/Draad —
    precisie via dunne lijn en luxe-minimalisme).
  - **319 Nachtmarkt** — feestelijk-donker met lantaarn-neon (houtskool + amber/magenta/jade): gloeiende chips,
    lantaarn-highlights, kleurrijk-speels én premium tegelijk, WCAG-contrast bewaakt (niet Middernacht/Neonzon —
    warme markt-sfeer in het donker).
  - **320 Handpalm** — mobiel-first duim-zone-ontwerp (fris licht + indigo): realistisch telefoon-frame op
    desktop, bottom-sheet-navigatie, sticky action-bar in duimbereik, swipe-kaarten met gesture-hints (niet
    Duim/Widget — thumb-first bottom-nav als bedieningsmodel).
- Onderzochte 2026-trends deze reeks: **progressive/gelaagde blur & scherptediepte-hiërarchie**; **verfijnd
  skeuomorfisme / tactiele keycaps**; **honest/unstyled UI als esthetiek**; **dot-matrix/live-ticker revival**;
  **calm-interface met koel-fris glasmorfisme**; **premium fintech-ledger-precisie**; **broken/diagonal grids**;
  **hairline-filigrein luxe-minimalisme**; **warm premium-dark met neon-accenten**; **thumb-first/duim-zone
  mobiel-ontwerp** — elk AA-/contrast-bewust en onderscheidend van de bestaande 310.
- **Totaal nu op `/ontwerp`: 320 concepten** (reeks 32: 311–320).

### Reeks 33 (run 15-7-2026) — nrs 321–330

- **321 Mistral** — kinetische variabele-typografie / motion-first (licht + elektrisch blauw): oversized
  Anton display-koppen met variërend gewicht/breedte, een ticker/marquee-strip als nav, letters die
  gestaffeld reageren op hover; beweging draagt de hiërarchie (niet Courant/Redactie — typografie-als-motion).
- **322 Kwik** — spatial depth / gelaagde translucentie (diep leisteen + cyaan): meerdere translucente
  glas-lagen met eigen blur en parallax-offset bij hover, licht-door-glas highlights, 2026 spatial-UI-energie
  puur in CSS (niet Vloeiglas/Glas — echte laag-diepte i.p.v. één glasvlak).
- **323 Beitel** — neo-brutalist-refined editorial (crème + geel): massieve 2px borders, harde offset-schaduw
  zonder blur, mono-uppercase labels, primaire kleurvlakken als codering, dikke focus-ring — ruw maar geordend
  en toegankelijk (niet Bauhaus/Memphis — gedisciplineerd brutalisme).
- **324 Zephyr** — quiet luxury / stille elegantie (warm taupe + inkt-blauw): hairline-scheidingen, verfijnde
  Newsreader-serif-koppen, extreme spatie-discipline zonder dichtheid te verliezen (niet Japandi/Marmer —
  ingetogen luxe via hairline + één accent).
- **325 Kommando** — keyboard-first CLI-workspace (terminal-donker + groen): werkend command-palette (⌘K),
  monospace-panelen, `g`+letter-chords, kbd-chips en een pinned statusregel onderaan (niet Console/Sneltoets —
  een volledige toetsenbord-gedreven terminal-omgeving).
- **326 Glans** — glossy premium-dark fashion-tech (hoogglans zwart + champagne): grote editorial serif naast
  strakke grotesk, sheen op randen, modeblad-op-zwart (niet Folio/Noir — donkere hoogglans i.p.v. crème/mat).
- **327 Kobalt** — single-hue tonal / mono-kleursysteem (kobalt-trappen + koper): de hele UI uit één kleurfamilie
  in ~12 tonale trappen, diepte via tonale lagen i.p.v. schaduw, één warm contrast-accent (niet Kobalt-blauw als
  accent elders — tonaal designsysteem als geheel).
- **328 Etalage** — marketplace-forward retail-polish (licht + violet/groen): opdracht-kaarten als premium
  winkel-etalage, filter-/sorteer-/opslaan-interacties, productpagina-achtige opdrachtdetail (niet Vitrine/Kiosk —
  e-commerce-conversie-UX rond matching).
- **329 Aubergine** — premium pruim / durvend kleurverhaal (diepe aubergine + mauve + abrikoos): volwassen,
  smaakvol jewel-palet met bewaakt contrast (niet Saffier/Amber — pruim/aubergine als hoofdkleur).
- **330 Momentum** — performance-data / sportieve energie (fris + limoen): grote krachtige cijfers,
  voortgangsringen en streak-bars maken momentum voelbaar, matching/omzet/verificatie als "prestaties"
  (niet Scorebord/Parcours — motiverend performance-dashboard).
- Onderzochte 2026-trends deze reeks: **kinetische/variabele-font typografie**; **spatial UI met gelaagde
  translucentie & parallax-diepte**; **verfijnd neo-brutalisme**; **quiet-luxury hairline-minimalisme**;
  **command-menu/keyboard-first workspaces**; **glossy premium-dark editorial**; **single-hue tonal
  designsystemen**; **marketplace/retail-polish UX**; **onverwachte jewel-/pruimpaletten**;
  **performance-/momentum-dashboards** — elk AA-/contrast-bewust en onderscheidend van de bestaande 320.
- **Totaal nu op `/ontwerp`: 330 concepten** (reeks 33: 321–330).

## Reeks 34 — 331–340 (atmosfeer, ambacht & ruimtelijke data)

- **331 Nevel** — atmosferische mesh-gradient / sfeer als hiërarchie (light, indigo→cyaan→roze):
  zachte functionele mesh-gradients (Stripe/Apple-Music-evolutie 2026) als kleurige waas achter
  bijna-witte glaskaarten; de gradient stuurt focus (niet Aurora/Progressive-blur — licht & diffuus
  met gradient als hiërarchie).
- **332 Reliëf** — neumorfisme / levend tactiel mono-reliëf (soft grijs): alles uit één geëmboss
  materiaal, opstaande knoppen & ingedrukte velden met dubbele schaduw, maar contrast-bewust en
  status altijd label+icoon (niet Klei/Emaille — monochroom soft-UI i.p.v. kleurige klei).
- **333 Sferisch** — immersieve 3D-relatiegraaf / ruimtelijke matching (dark): matching als
  gloeiende relatie-graaf (ZZP'er↔opdracht↔certificaat) in gelaagde translucente panelen met echte
  z-diepte (niet Spatial-depth/Knooppunt — spatial-data-viz van de match zelf).
- **334 Zine** — handgemaakte collage & fotokopie-textuur (anti-perfectie, warm papier): knip-plak
  collage, halftone-korrel, plakband-hoekjes en marker-onderstreping, tóch leesbaar (de 2026
  anti-perfectie/handcraft-rebellie).
- **335 Aquarel** — geschilderde wassingen / zachte pigmentwarmte (light): bloedende waterverf-vlekken
  als accenten, geschilderde statuskleuren, serif-elegantie — menselijke warmte tegen steriele perfectie.
- **336 Kinfolk** — fotografisch redactioneel / warm magazine (warm light): grote redactionele koppen,
  royale marges, full-bleed duotoon-beeldvlakken en bijschrift-typografie (magazine-rust, niet Folio/Verhaal).
- **337 Riso** — risograaf duotoon-fluor / halftone-grain (bold): twee fluor spot-inkten die overprinten
  met halftone-punten en mis-registratie-offset op ongebleekt papier (niet Silkscreen/Pop-art — riso-print-ambacht).
- **338 Grafiet** — handgetekend potlood-schets / technisch-editorial (mono + potlood-blauw): schets-wireframe-
  lijnen, grid-papier en handgeschreven annotaties naast strakke technische data (niet Blauwdruk — potlood i.p.v. cyanotype).
- **339 Kompres** — database-canvas / Notion-Airtable-velden (light + violet): kleur-getagde select-velden,
  inline-bewerkbare cellen, type-iconen en een record-zijpaneel (spreadsheet-native productiviteit, niet Beurs/Grootboek).
- **340 Galerie** — museumzaal / white-cube curatie (light): elk datapunt hangt als een werk met klein
  expositielabel en dunne passe-partout in overvloedige witruimte (curatie & rust, niet Veilinghuis/Etalage).
- Onderzochte 2026-trends deze reeks: **functionele atmosferische mesh-gradients**; **neumorfisme /
  living-interfaces tactiel**; **spatial UI & 3D-relatie-/netwerkvisualisatie**; **anti-perfectie
  handcraft/zine-esthetiek**; **geschilderde aquarel-warmte tegen steriele perfectie**; **redactioneel
  magazine-minimalisme**; **risograaf/duotoon print-ambacht**; **hand-drawn schets-wireframes**;
  **database-/spreadsheet-native UI (Notion/Airtable)**; **white-cube museale curatie** — elk
  contrast-bewust en onderscheidend van de bestaande 330.
- **Totaal nu op `/ontwerp`: 340 concepten** (reeks 34: 331–340).

## Reeks 35 (341–350)

> Reeks 34 (331–340) landt via PR #778 (Nevel, Reliëf, Sferisch, Zine, Aquarel, Kinfolk, Riso, Grafiet,
> Kompres, Galerie). Deze reeks 35 (341–350) voegt tien opnieuw onderscheidende richtingen toe.

- **341 Meridiaan** — nautische zeekaart / wayfinding-navigatie (koper op kaart-crème + marineblauw):
  latitude/longitude-hairlines, kompasroos, next-actions als "koers uitzetten", matching als "peiling" met
  bearing-chips (niet Kompas/Portolaan — een volledige zeekaart-wayfinding-taal met peiling-metafoor).
- **342 Terracotta** — mediterraan aardewerk / warm-menselijk (terracotta + olijf + zand): vlak-editorial
  warmte, ronde vormen, gastvrije toon rond een streng verificatieproces (niet Klei/Karton — warme
  aarde-editorial, geen 3D/textuur).
- **343 Kobaltglas** — premium-dark glasmorphism / diepte & lichtbreking (diep kobalt + ijsblauw): gelaagde
  translucente panelen met glans-randen, één accent, contrast-bewust op elke glaslaag (niet Glas/Vloeiglas —
  diep-kobalt spatial depth i.p.v. licht glas).
- **344 Passer** — technisch drafting / precisie-instrument (wit + cyaan): constructielijnen, cirkelbogen,
  meetwaarden met pijltjes, matching als gemeten tolerantie (niet Blauwdruk — wit-technisch drafting i.p.v.
  donkere cyanotype).
- **345 Schaduwspel** — high-contrast licht & schaduw / sculpturaal (monochroom + amber): dramatische harde
  slagschaduwen en spotlight-vlakken, diepte uit schaduw i.p.v. kleur (niet Noir/Schijnwerper — sculpturale
  offset-schaduw als hoofdmiddel).
- **346 Vlonder** — warm natuurlijk hout / geaard (hout + mos + hemel): horizontale plank-ritmes, groei-ringen,
  heuvel-grafieken, verificatie als "vaste grond" (niet Textiel/Serre — geaarde hout/steiger-natuur).
- **347 Ivoor** — ultra-minimaal monochroom / luxe van weglaten (ivoor + hairlines): extreme typografische
  rust, kleur alleen voor status, data-dichtheid zonder rommel (niet Marmer/Japandi — monochroom ivoor met
  redactioneel zetsel-ritme).
- **348 Kwintet** — muzikaal ritme / partituur-cadans (aubergine + goud + ivoor): vijf-lijns notenbalk als
  layout, maatstrepen als scheiding, staccato-hiërarchie (niet Partituur — lichter, warmer, kwintet-ritme).
- **349 Vensterbank** — huiselijk daglicht / gastvrij (daglicht-wit + hout + plant + perzik): ochtendlicht-gloed,
  zachte licht-schaduw, low-stimulation en verzorgd (niet Tij/Haard — huiselijk raamlicht met biophilic warmte).
- **350 Loden** — loodgrijs industrieel / machine-precisie (gunmetal + fel signaal-accent): geborsteld-metaal
  hints, tabulaire cijfers, compacte pro-dichtheid voor de bemiddelaar (niet Grafiet/Beton — industrieel
  gunmetal met één signaal-accent).
- Onderzochte 2026-trends deze reeks: **cartografische wayfinding-UI**; **warme aarde-paletten (terracotta/olijf)**;
  **spatial glasmorphism met lichtbreking**; **technisch drafting / meetwaarden-UI**; **dramatische harde
  slagschaduwen**; **biophilic natuurtinten & plank-ritme**; **quiet-luxury monochroom minimalisme**; **ritmische
  partituur-layout**; **calm / low-stimulation daglicht-UI**; **industrieel gunmetal pro-dichtheid** — elk
  AA-/contrast-bewust, deterministisch en onderscheidend van de bestaande 340.
- **Totaal nu op `/ontwerp`: 350 concepten** (reeks 35: 341–350; reeks 34 331–340 via PR #778).

## Reeks 38 — concepten 371–380 — 2026-07-17

Tien nieuwe, onderscheidende richtingen, elk met eigen bestand en alle 6 kernschermen (dashboard,
marktplaats, opdracht, verificatie, acties, facturen). Additief toegevoegd bovenop 370 — niets
overschreven. Elke richting is vooraf tegen de registry gecontroleerd om herhaling te vermijden.

- **371 Deco** — Art Deco / geometrisch goud (onyx/smaragd + champagne-goud): symmetrische waaiers,
  chevrons en fijne dubbele goudlijnen — statige, tijdloze luxe.
- **372 Marqueterie** — houtinlegwerk / fineer & intarsia (warme fineerkleuren): geometrische parket-
  panelen met contrasterende inleg-randen en boomnerf — ambachtelijke, tactiele precisie.
- **373 Gebrand** — glas-in-lood / kathedraal juweeltinten (kobalt/robijn/smaragd): panelen met zwarte
  lood-scheidslijnen en zachte binnengloed — diep, kleurrijk en sacraal-premium.
- **374 Anaglyph** — stereo-3D / rood-cyaan reliëf (donkere basis): chromatische kanaal-offsets en
  dubbele randcontouren die diepte suggereren — speels-technisch en onderscheidend.
- **375 Guilloché** — securité-graveerlijnen / waarmerk (securité-groen op ivoor + goud): ineengevlochten
  gegraveerde curven, rozet-medaillons en microtekst — verificatie als echtheidszegel.
- **376 Warmtekaart** — thermografie / warmte als intensiteit (magma-verloop op diepzwart): warmte gelijk
  aan activiteit en match-intensiteit, met meetuitlezingen — analytisch en data-dicht.
- **377 Oscilloscoop** — fosfor-golfvorm / meetlab-signaal (fosforgroen op division-raster): live
  golfvormen, V/div-uitlezingen en signaal-vergrendeling als verificatie — technisch-precies.
- **378 Seismograaf** — registratiestrook / analoge inktlijn (roodbruine inkt op crème strook): amplitude
  als activiteit, pieken als gebeurtenissen — een warme, wetenschappelijke tijd-registratie.
- **379 Batik** — wax-resist textiel / indigo & soga (crème-resist + accent-oranje): parang/kawung-patronen
  met craquelé-adertjes — gelaagde, warme textielrijkdom, strak toegepast.
- **380 Scherenschnitt** — papierknipsel / symmetrisch silhouet (knip-zwart op ivoor + rood zegel):
  gespiegelde geknipte ornamenten en filigrein-kaders — elegant, hoog-contrast en ambachtelijk.
- Onderzochte 2026-trends deze reeks: **art-deco geometrie & goud-linework**; **marqueterie/craft-fineer
  als materiaal-UI**; **stained-glass juweel-panelen met lichtdiepte**; **anaglyph/stereo-diepte als
  hiërarchie**; **guilloché securité-graveerwerk (waarmerk/echtheid)**; **thermografische magma-heatmap
  data-viz**; **oscilloscoop-golfvorm-instrumentatie**; **analoge strip-chart/seismogram-registratie**;
  **batik wax-resist textielpatronen**; **scherenschnitt papier-silhouet & filigrein** — elk contrast-
  bewust, deterministisch en onderscheidend van de bestaande 370.
- **Totaal nu op `/ontwerp`: 380 concepten** (reeks 38: 371–380).

## Reeks 37 — concepten 361–370 — 2026-07-17

Tien nieuwe, onderscheidende richtingen, elk met eigen bestand en alle 6 kernschermen (dashboard,
marktplaats, opdracht, verificatie, acties, facturen). Additief toegevoegd bovenop 360 — niets
overschreven.

- **361 Zetsel** — Zwitserse typografische rasterposter / International Typographic Style (inkt op
  papier + rood accent): zichtbaar modulair raster, oversized grotesk-numerieken en geroteerde
  kantlijn-labels — dichtheid wordt ritme, niets staat toevallig.
- **362 Lagen** — spatiale diepte / visionOS-glas (licht lucht-verloop, violet): doorschijnende
  frosted-glass panelen op echte z-diepte met vibrancy en gestapelde schaduw, hiërarchie via diepte.
- **363 Boarding** — instapkaart-utility / ticket & perforatie (papierwit + blauw): geperforeerde
  scheur-randen, monospace ticket-codes en stub-secties maken opdracht-metadata direct scanbaar.
- **364 Golfslag** — kinetisch motion-forward / vloeiende golven (aqua + teal): organische SVG-golven
  als voortgang en deining, reduced-motion-bewust — voortgang wordt letterlijk voelbaar.
- **365 Kwartet** — speelkaart / kwartet-metafoor (kaartkarton + suit-accenten): hoek-indices,
  suit-gecodeerde categorieën en 4-up kwartet-grids; matching-score als kaartwaarde.
- **366 Ledger** — grootboek / analoog dubbel-boekhouden (greenbar-papier + grootboek-groen):
  debet/credit-kolommen, tabulaire cijfers, dubbele onderstreping en stempel-status — warm en analoog.
- **367 Blauwuur** — schemer premium-dark / cinematisch blauw uur (indigo→pruim + gedempt goud):
  zachte gloed rond focus, glas-panelen, serif-displaymoment — filmisch kalm, contrast-bewust.
- **368 Draaiboek** — productie-callsheet / storyboard (productie-papier + regie-geel): scène-genummerde
  secties, cue-lijst met tijdkolommen en regie-notities — ideaal voor de next-action-engine als cues.
- **369 Passe-partout** — museale omlijsting / galerie & provenance (kalk + oker): royale mat-marges,
  museum-labels en dubbele kaderlijn; verificatie wordt authenticatie met provenance.
- **370 Sextant** — nautisch instrument / cartografie (zeekaart-crème + messing): kompasroos-motief,
  gegraveerde schaalverdeling en coördinaat-uitlezingen — navigeren als metafoor voor matching & peiling.
- Onderzochte 2026-trends deze reeks: **International Typographic Style / oversized numerieke display**;
  **spatial UI / visionOS-vibrancy met gelaagde glas-diepte**; **skeuomorfe ticket/pass-metafoor**;
  **motion-first kinetische interfaces met reduced-motion-respect**; **playful collectible-card-codering**;
  **analoge greenbar-ledger-esthetiek**; **atmosferische dark-mode zonder neon**; **callsheet/storyboard-
  structuur voor actie-hiërarchie**; **museale mat/omlijsting & provenance-typografie**; **cartografisch
  nautisch-instrument** — elk contrast-bewust, deterministisch en onderscheidend van de bestaande 360.
- **Totaal nu op `/ontwerp`: 370 concepten** (reeks 37: 361–370).

## Reeks 36 — concepten 351–360

Tien nieuwe, onderscheidende richtingen, elk met eigen bestand en alle 6 kernschermen (dashboard,
marktplaats, opdracht, verificatie, acties, facturen). Additief toegevoegd bovenop 350 — niets
overschreven.

- **351 Baken** — vertrektijdenbord / split-flap dot-matrix (amber op antraciet): mechanische flip/tick,
  tabulaire mono-cijfers als bestemmingsborden, elke status leest als een aankondiging.
- **352 Diepzee** — bioluminescent deep-dark (marineblauw + cyaan gloed): diepte via gelaagde gloed en
  blur, aandacht licht op waar het telt, rustig en premium maar contrast-bewust leesbaar.
- **353 Atelier** — architecten-blauwdruk op warm perkament (blauwdruk-blauw): titelblok-koppen,
  leader-lines en maatlijnen met schaalstreepjes, ingenieurs-precisie met ambachtelijke warmte.
- **354 Kwarts** — iriserend/holografisch op ijswit (laag-verzadigd spectrum): frosted-glas panelen,
  kristallijne facetten, high-key licht met donkere inkt voor scherp, toegankelijk contrast.
- **355 Meridiaan** — cartografisch / wayfinding (aardse inkt op perkament): zelf getekende hoogtelijnen,
  coördinaat-labels en kompasroos, oriëntatie op de volgende beste route.
- **356 Halogeen** — warm nacht-dashboard (amber gloeilamplicht op houtskool): gloed rond focus,
  kaarslicht-vignet, behaaglijk maar data-scherp voor de avond-/nachtdienstplanner.
- **357 Prisma** — kleurrijk-speels spectrum (kleurgecodeerd, 8pt-grid): elk domein een eigen heldere
  kleur, speels én professioneel (Family/Superlist-energie) zonder losse pixel.
- **358 Sediment** — geologische lagen / stratigrafie (aardetinten): navigatie als boorkern, koppen met
  diepte-labels, informatie als afzettingslagen — warm, tactiel, rustgevend.
- **359 Zonnewijzer** — solarpunk / natuurlijk-warm (terracotta + zand + mos): organische zachte vormen,
  terugkerend zonnewijzer-motief dat voortgang aftast, optimistisch en menselijk.
- **360 Notenbalk** — ritmisch baseline-grid / muzikaal (monochroom + rood accent): hairline notenlijnen,
  maatstrepen en maat-genummerde secties, dichtheid als cadans.
- Onderzochte 2026-trends deze reeks: **kinetische / split-flap typografie**; **bioluminescent deep-dark
  met gelaagde gloed**; **technische blueprint-annotatie & maatvoering**; **holografische/iriserende
  sheen op high-key licht**; **cartografische wayfinding-UI**; **cozy-dark warm ambient light**;
  **kleurgecodeerde speels-professionele systemen**; **stratigrafische gelaagde informatie-architectuur**;
  **solarpunk / biophilic natuurtinten**; **ritmisch muzikaal baseline-grid** — elk AA-/contrast-bewust,
  deterministisch, en onderscheidend van de bestaande 350.
- **Totaal nu op `/ontwerp`: 360 concepten** (reeks 36: 351–360).

## Reeks 39 — concepten 381–390 (17-07-2026)

Tien nieuwe, additief toegevoegde richtingen bovenop 380 — niets overschreven. Elk concept dekt de
zes kernschermen (dashboard, marktplaats, opdracht, verificatie, acties, facturen) met de gedeelde
Nederlandse mock-data, werkende zoek/sorteer/filter + empty-state, `statusMeta` (label + icoon, nooit
kleur alleen), focus-visible ringen en `motion-reduce`-respect.

- **381 Dampkring** — premium-dark met atmosferische glas-diepte (inkt-blauw + cyaan/violet gloed):
  gelaagde verlopen, luminescente glas-panelen met lichtrand, rustig-ruimtelijk maar contrast-bewust.
- **382 Maalstroom** — kleurrijk-kinetisch, radiale energie (crème + koraal/indigo/citroen): conische
  verlopen en draaikolk-motief, speels maar strak, beweging zonder rommel.
- **383 Leporello** — redactioneel concertina/vouwblad (warm papier + bordeaux): horizontale gevouwen
  panelen met zichtbare vouwlijnen, oversized serif-koppen, strak kolomraster.
- **384 Majolica** — warm-menselijk geglazuurd aardewerk (crème + terracotta/kobalt): keramiek-tegels
  met glazuur-glans en subtiel patroon, ring-match-meters, tactiel en betrouwbaar.
- **385 Kwartslag** — verfijnd neo-brutalisme (lichtgrijs + elektrisch geel op inkt): dikke randen,
  harde offset-slagschaduw, Anton-display, 90°-kwartslag-vormen, monospace-labels.
- **386 Telegraaf** — data-dicht telex-terminal (papier + amber): monospace overal, tickerband-koppen,
  glyph-statusregels (`[OK]`/`[!!]`), compacte registertabellen, twee-koloms lijst+detail.
- **387 Zoutkristal** — toegankelijk hoog-contrast, kristallijn (wit/bijna-zwart + diepblauw ≥7:1):
  facet-geometrie, dikke focusringen, grote raakvlakken, status met label + icoon + facet-patroon.
- **388 Lichtorgel** — bento-grid met luminescent equalizer-motief (donkere basis + spectrum): lichtbalken
  vertalen voortgang/match/activiteit naar een cyaan→violet→magenta-spectrum, elk datapunt eigen gewicht.
- **389 Schaduwdoos** — verfijnd soft-depth/neumorfisme (warm off-white + gedempt indigo): gelaagde dozen
  met echte diepte-hiërarchie, dubbele schaduw, mollig-strak met bewaakt contrast.
- **390 Windvaan** — mobiel-first wayfinding (fris licht + marine/oranje): telefoon-frame met bottom-tab-bar
  op mobiel, kompas-rail op desktop, windroos wijst de volgende beste actie als richtingwijzer.
- Onderzochte 2026-trends deze reeks: **premium-dark atmosferische glas-diepte**; **kinetische radiale/
  conische kleur**; **redactionele concertina-vouwlayouts**; **ceramische/materiële warmte**; **verfijnd
  neo-brutalisme met harde offset-schaduw**; **data-dichte wire-/telex-terminals**; **accessibility-as-
  aesthetic (WCAG-AAA, ≥7:1) met kristallijne geometrie**; **bento-grids met eigen lichttaal (equalizer)**;
  **soft-depth/neumorfisme met bewaakt contrast**; **mobiel-first thumb-zone wayfinding** — elk
  deterministisch, toegankelijk en onderscheidend van de bestaande 380.
- **Totaal na reeks 39 op `/ontwerp`: 390 concepten** (reeks 39: 381–390).

## Reeks 40 (391–400)

- **391 Risograaf** — riso-print duotone (fluor-roze + federal-blue op papier-wit): twee spotkleuren
  die overlappen tot een derde tint, halftone-korrel en bewuste 1-2px mis-registratie als accent.
- **392 E-ink** — e-paper leesrust (grijswaarden + diepe inkt-accent): geditherd monochroom, scherpe
  hairlines, tabulaire cijfers — lage prikkel, maximale leesrust rond gevoelige documenten.
- **393 Synthwave** — retro-neon arcade (diep indigo + magenta/cyaan): perspectief-grid-horizon,
  subtiele scanlines en glow-accenten in premium-dark, functioneel en leesbaar gehouden.
- **394 Origami** — gevouwen papier & facetten (papier-wit + inkt-blauw): lichtgradiënt-facetten die
  vouwlijnen suggereren, scherpe creases en zachte vouw-schaduw — 3D-diepte puur via licht.
- **395 Terrazzo** — gespikkeld steen (room + pastel-confetti): verspreide steen-chips, zachte
  salie/terracotta/oker-accenten en luchtige afgeronde vormen — warm-speels en premium.
- **396 Borduurwerk** — kruissteek op aida-raster (linnen + indigo/framboos/mosgroen): fijn stramien,
  kruissteek-motieven, draad-kleuren en gestikte dashed randen als steken — tactiel maar ordelijk.
- **397 Metrokaart** — transit-schema wayfinding (wit + verzadigde OV-lijnkleuren): gekleurde lijnen
  verbinden stappen, ronde stations markeren mijlpalen — verificatie/next-action als een reisroute.
- **398 Herbarium** — geperste botanie & archieflabels (vergeeld papier + botanisch groen/zegel-rood):
  archieflabel-kaartjes met veldjes en subtiele botanische lijn-accenten — curatorieel en betrouwbaar.
- **399 Printplaat** — PCB-traces & vias (donkergroen soldeermasker + koper/goud): traces verbinden
  componenten, ronde vias als knopen, zeefdruk-witte mono-labels — matching als signaal-routing.
- **400 Almanak** — astronomische efemeride (nacht-inkt + perkament + messing): data-dichte tabellen
  met tabulaire cijfers en gravure-hairlines, constellatie-motieven — facturen/verificatie als almanak.
- Onderzochte 2026-trends deze reeks: **riso/print-revival met duotone & korrel**; **e-ink/calm
  low-stimulation leesinterfaces**; **retro-neon/vaporwave in premium-dark**; **papier-craft met
  facet-diepte**; **terrazzo & organische speelsheid**; **textiel/craft-esthetiek**; **transit-diagram
  wayfinding**; **curatoriële archief-esthetiek met botanische accenten**; **PCB/circuit-schematiek**;
  **data-dichte editorial-tabellen met astronomische motieven** — elk deterministisch, toegankelijk en
  onderscheidend van de bestaande 390.
- **Totaal nu op `/ontwerp`: 400 concepten** (reeks 40: 391–400).

## Reeks 41 (401–410)

- **401 Meniscus** — Liquid Glass, dynamische specular refractie (licht, #eef2f8 + #3b82f6): heldere
  glaspanelen met highlight-randen en lensbreking, content op solide leesvlakken — contrast vóór effect.
- **402 Schuinte** — anti-grid, gebroken diagonaal editorial (#f5f3ee + vermiljoen #ff4d2e): diagonale
  scheidingen en licht gekantelde blokken, oversized koppen die de kolomlijn doorbreken, content recht.
- **403 Zandsteen** — stille luxe, mineraal steen-palet (#ece7de + taupe #9a8873): zandsteen/kalktinten,
  dunne serif-koppen en hairlines, minimale accenten — koel-ingetogen quiet luxury, rust en vertrouwen.
- **404 Regelkamer** — mission-control ops-dashboard (licht #f4f6f9 + ops-blauw #0ea5e9): live-tegels,
  statusstrips, tabulaire cijfers en dichte tabellen — alles in één oogopslag voor de bemiddelaar.
- **405 Speelgoed** — soft-3D consumer-dopamine (#f6f1fb + magenta #ff5da2): mollige zacht-3D vormen,
  ronde kaarten met kleurschaduw en spring-hover — vrolijk en toegankelijk, nooit kinderachtig.
- **406 Jaarverslag** — corporate annual-report editorial (licht #fbfaf7 + bosgroen #0b5d3b): serif-koppen,
  reuze tabulaire cijfers als held en hairline-financiële tabellen — de facturen/omzet-schermen schitteren.
- **407 Vectorveld** — neon wireframe vector line-art (donker #070b10 + lime #a3e635): gloeiende
  vectorlijnen, wireframe-kaders en SVG line-art nodes voor matching — data als lichtgevende lijntekening.
- **408 Duinpan** — Nederlands kust/duin, kalm coastal (#f2efe6 + zeeblauwgroen #3f7d84): zandtinten,
  helmgras-groen en golfcontouren met veel lucht — laag-prikkelend en vertrouwd rond gevoelige documenten.
- **409 Marktkraam** — streekmarkt & luifel, ambachtelijk-warm (#f7f1e4 + marktrood #d1462f): luifel-strepen
  als spaarzaam accent en krijtbord-kaartjes — de marktplaats als levendige markt, strak en leesbaar.
- **410 Nachtwacht** — gouden-eeuw chiaroscuro, donker museaal (#12100c + goud #c9a24a): Rembrandt-licht
  met goud-schijnwerper op de kern-content en één serif-displaymoment — de verificatielaag als meesterwerk.
- Onderzochte 2026-trends deze reeks: **Apple Liquid Glass / specular refractie**; **anti-grid /
  broken-grid editorial**; **quiet luxury met mineraal steen-palet**; **mission-control ops-dashboards
  in licht**; **soft-3D consumer-dopamine (Family/Arc)**; **corporate annual-report editorial met
  cijfer-als-held**; **vector line-art / plotter-glow**; **kalm coastal natuurpalet**; **markt-/handel-
  metafoor**; **barok chiaroscuro museaal-donker** — elk deterministisch, toegankelijk en onderscheidend
  van de bestaande 400.
- **Totaal nu op `/ontwerp`: 410 concepten** (reeks 41: 401–410).
