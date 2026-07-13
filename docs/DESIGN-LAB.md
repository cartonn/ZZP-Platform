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
