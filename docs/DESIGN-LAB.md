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
- **Totaal nu op `/ontwerp`: 140 concepten** (reeks 1: 01–10, reeks 2: 11–20, reeks 3: 21–30, reeks 4: 31–40, reeks 5: 41–50, reeks 6: 51–60, reeks 7: 61–70, reeks 8: 71–80, reeks 9: 81–90, reeks 10: 91–100, reeks 11: 101–110, reeks 12: 111–120, reeks 13: 121–130, reeks 14: 131–140).
