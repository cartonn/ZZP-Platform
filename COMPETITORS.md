# COMPETITORS — concurrentie-onderzoek & backlog

Bijgehouden door de nachtelijke concurrentie-loop (zie `LOOP.md` / cron 04:27). Openbare bronnen,
peildatum 9 juni 2026. **Geen verzonnen cijfers**; schattingen expliciet gelabeld. Principes vertalen,
nooit design letterlijk kopiëren.

## Ronde 1 — 2026-06-09 (16 platformen)

### Marktkaart (clusters)

| Cluster                     | Spelers                                                                        |
| --------------------------- | ------------------------------------------------------------------------------ |
| Open-marktplaats            | Temper, YoungOnes, Freelance.nl, Hoofdkraan, Upwork, Fiverr, LinkedIn Services |
| Managed-marketplace         | Malt, Toptal, Jellow                                                           |
| Staffing-intermediair       | Planet Interim                                                                 |
| Zorg-rooster-platform       | **PIDZ** (pidz.nl)                                                             |
| Enterprise-inhuur (MSP/VMS) | HeadFirst Group (incl. Striive)                                                |
| Payroll/compliance-SaaS     | Maqqie, **Bendy** (bendy.nl)                                                   |

**Ambigue namen geverifieerd:** **PIDZ** = zorg-flexwerk/zzp-bemiddeling + roostering (VVT/GGZ/GHZ/jeugd),
níét IT. **Bendy** = white-label staffing-SaaS voor uitzend-/flexbureaus (planning, uren, facturatie,
documentverificatie) — géén eigen marktplaats. Beide zijn de meest relevante vergelijking met onze
franchiser/rooster/dossier-kant.

### Teardown-scores (1–5: duidelijkheid / waarde-snelheid / vertrouwen / professioneel / conversie)

| Platform  | dui | waarde | vertr | prof | conv |
| --------- | --- | ------ | ----- | ---- | ---- |
| PIDZ      | 5   | 3      | 5     | 5    | 4    |
| Temper    | 5   | 5      | 3     | 5    | 5    |
| Toptal    | 5   | 4      | 5     | 5    | 4    |
| Malt      | 4   | 4      | 4     | 5    | 4    |
| HeadFirst | 4   | 3      | 5     | 5    | 3    |
| Maqqie    | 4   | 4      | 4     | 4    | 4    |
| Jellow    | 4   | 4      | 4     | 4    | 4    |
| Bendy     | 4   | 2      | 4     | 4    | 3    |

### Kern-inzicht (verdict)

Ons gat is **niet techniek maar zichtbaarheid + eerste indruk**: root redirect → /dashboard, kale login,
geen vertrouwensanker boven de vouw — terwijl alle concurrenten dáár winnen. Veel "verbeteringen"
bestaan al in code (ORT-calculator, no-cure-no-fee-abonnement, trust-niveaus, reistijd-matching,
match-reasons, DBA-modelovereenkomst, de uren→prestatie→factuur-cascade). De grootste laag-risico-winst:
**etaleer bestaande sterktes** + maak de moat (verklaarbare match + geverifieerde zorg-bevoegdheid +
Wet-DBA-verdedigbaarheid) luider en eerder in de funnel zichtbaar.

### Backlog — BOUWEN (duidelijke UX/principe-winst)

- [x] (#241) **M** Vertrouwens-strip op /login + /register (échte platformdata, verificatie-keurmerk) — kwalitatieve garanties + keurmerk-rij altijd, echte cijfers boven betekenis-drempel; root blijft dashboard-first (geen marketinghomepage, CLAUDE.md)
- [x] (#238) **M** "Beste match"-banner met match-reasons op opdracht-detail/reactielijst — /opdrachten/[id], /kandidaten
- [x] (#239) **S** No-cure-no-fee-abonnement expliciet communiceren ("geen werk = geen bijdrage") — /register, /abonnement
- [x] (#238) **S** Verificatie-keurmerk-rij (VOG ✓ · BIG ✓ · Diploma ✓) op kandidaat-/ZZP-profiel — /zzp/[id], /kandidaten
- [x] (#237) **S** ORT-foutpreventie-indicator ("toeslagen automatisch berekend") op prestatie/factuur — /samenwerkingen/[id], /prestaties, /facturen
- [x] (#239) **S** Zekerheids-/risk-reversal-blok op opdracht-detail ("certificaten vooraf geverifieerd") — /opdrachten/[id]
- [x] (#240) **M** Rijkere facet-discovery + resultaattelling op /opdrachten — telling + branche/werkmodus/tariefrange/bevoegdheid/skills/sorteren bestonden al; locatie-facet (plaats/regio) toegevoegd
- [x] (#243) **M** Acceptatie-/grace-venster met auto-akkoord-timer op de uren→prestatie-stap — autoApprovePerformance (SYSTEM, idempotent, zelfde factuur-cascade) + geplande taak in run-all; ENV-gated `PERFORMANCE_GRACE_DAYS`, standaard UIT (auto-factuur = financieel beleid). Follow-up: deadline-indicator in UI wanneer ingeschakeld
- [x] (#242) **M** Live, geanonimiseerd activiteits-/liquiditeitssignaal op dashboard (échte data) — ZZP'er ziet hoeveelheid werk (open + nieuw deze maand), opdrachtgever ziet aanbod (beschikbaar + geverifieerd); verbergt zich zonder activiteit

> De acht items hierboven zijn gebouwd (#237–#243). De twee onderstaande zijn naar
> "Geparkeerd" verplaatst omdat ze een product-/infra-besluit van de eigenaar vergen
> (zie onder) — niet omdat ze technisch onhaalbaar zijn.

### Geparkeerd — PRODUCT/INFRA-besluit (eigenaar-keuze, niet stilzwijgend bouwen)

- **Multi-apply met auto-opschoning van concurrerende reacties bij acceptatie** — `Job` is impliciet
  single-hire (geen vacature-/posities-veld) en de kloof tussen _accepteren_ en _contract tekenen_ is
  bewust: een opdrachtgever houdt zijn shortlist als backup tot de handtekening staat. Auto-opschonen
  raakt daarom twee open keuzes: (a) **trigger** — bij accept (te vroeg, contract nog niet getekend)
  of pas bij `signContract → ACTIVE` (positie écht gevuld); (b) **wat** — de eigen reacties van de
  ZZP'er intrekken (kost hem kansen) óf de andere kandidaten van die opdracht afwijzen (raakt
  multi-hire/backup-strategie). Beide zijn UX/product-beslissingen, geen veilige default.
- **Web-push + één-tap reageren op ad-hoc diensten (PWA)** — vereist eigenaar-infra: VAPID-sleutels,
  een service worker en push-subscriptie-opslag + toestemming. Buiten wat een agent veilig en
  zelfstandig kan aanzetten zonder productie-secrets.

### Geparkeerd — STRATEGISCH/PRIJS (eigenaar-besluit, niet stilzwijgend bouwen)

- **Payroll/uitzend-tak naast ZZP** (Wet-DBA-vangnet, à la PIDZ/Maqqie/HeadFirst) — verandert het product
  fundamenteel (werkgeverscompliance, verloning, CAO, aansprakelijkheid).
- **Tenant-fee/commissiemodel aanzetten + publiek prijsbeleid** (keuzeset toeslag/staffel/vaste fee) —
  samenhangende prijs-/businesskeuze; billing staat bewust UIT.
- **White-label/tenant-branding** (eigen merk/subdomein/PWA per tenant, à la Bendy/Jellow) —
  multi-tenant-theming-investering; alleen zinvol als de franchise-GTM hierop wordt ingericht.
- **Verzekering/factoring-add-on** (geld-/zekerheidsstroom, à la Bendy/Malt/Temper) — botst met Besluit 1
  (geld loopt nooit via het platform); herziening van dat besluit is eigenaar-keuze.
- **Gestandaardiseerde dienst-pakketten met operationele garanties** (vervang-/spoedgarantie) — vraagt
  operationele toezeggingen + aansprakelijkheid; past minder op de zorgrealiteit.

### Feitcheck-correcties (toegepast — niet als feit presenteren)

- HeadFirst "≥10% besparing jaar 1" = **onjuist/ongelabeld** → ~2,5% netto in het voorbeeld; behandelen als marketingclaim.
- Jellow "€5/uur" = **verouderd/onbronbaar** (afgeschaft 2019; huidige contracting ~€1,50/uur, schatting).
- PIDZ "instellingskosten 15-25% all-in" = **geen traceerbare bron** → markeren als schatting (wel generiek "10-20% inhouden").
- Correct geverifieerd: PIDZ €56,94 (ZZP-abo), Temper €4,90/u, YoungOnes €4,75/u, Maqqie 1%/max 7,5%,
  Planet Interim-abo's, Upwork 0-15%, Fiverr 20%+5,5%, Toptal $79+$500.

## Ronde 2 — 2026-06-10 (verdieping: franchiser/rooster/dossier-kant)

Verdiept: **PIDZ**, **Bendy** en **Zorgwerk** (zorgwerk.nl, incl. ZZP-Markt) — focus op de operatie
en de franchiser/rooster/dossier-kant (waar ronde 1 lichter overheen ging). Bron: openbare sites;
alle volume-/fee-claims expliciet als marketing/schatting gelabeld (zie feitcheck).

### Per concurrent (beter / slechter dan wij)

| Concurrent   | Doet beter                                                                                                                                                     | Doet slechter                                                                                                                             |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **PIDZ**     | Bewezen liquiditeit/dichtheid + fysieke regio-/franchise-infra met menselijke planners → zichtbare "vulgraad"-moat (claim "80% binnen 2u", _marketing_)        | Matching is een black box; geen zichtbare match-redenen, per-document-verificatiestatus, ORT-opbouw of DBA-tooling — wat wij wél tonen    |
| **Bendy**    | Volledige white-label bureau-stack: eigen-merk app in beide stores, Otentica-echtheidsverificatie (BIG/SKJ/KvK/VOG), ingebouwde WTT/ORT-calculator             | Geen eigen marktplaats/liquiditeit, geen DBA/payroll, geen rooster-dossier of leads-CRM, niet ZZP-specifiek — gereedschap zónder netwerk  |
| **Zorgwerk** | API-koppeling op instellingsroosters (Nedap ONS/Intus/Monaco/Ortec) + wekelijkse-uitbetaling-belofte (neemt debiteurenrisico); ZZP-Markt "SOS-knop" vervanging | Verplichte screening + kennismakingsgesprek, geen open doorzoekbare profielen, marges niet transparant — minder zelf-kiezen/transparantie |

**Kern:** de drie bevestigen onze differentiatie (verklaarbare match + zichtbare verificatie/DBA/ORT
die zij missen), maar leggen het zwaartepunt bij de OPERATIE. De grootste laag-risico-winst zit in het
**zichtbaar maken van bestaande data** op de franchiser/cashflow-kant.

### Backlog — BOUWEN (duidelijke UX/principe-winst)

- [x] (#294) **M** Vulgraad/dekkingsoverzicht op /franchise/diensten (PIDZ-moat gedigitaliseerd): vulgraad %, open vs. gevuld, "dreigt onvervuld"-alarm bij 7+ dagen open, aandacht-eerst-sortering. Pure oversight op bestaande velden.
- [x] (#295) **M** Cashflow-vooruitblik "binnenkomend deze week" op /openstaand (Zorgwerk-rust zonder factoring): som van facturen met vervaldatum binnen 7 dagen + per post "verwacht rond <datum>". Toont alleen bestaande betaal-timing; geld blijft PENDING.
- [x] (al gebouwd) **S** Inzetbaarheids-verdict in roster-dossier (PIDZ-kwaliteitsgrip): de roster-dossierdetail toont al `EngageabilityExplanation` (badge + blokkades/aandacht/redenen) als kop-oordeel — rechter zag alleen de lib, niet de UI.
- [x] (al gebouwd) **S** Screening-lat zichtbaar op opdracht-detail (PIDZ-vertrouwen): /opdrachten/[id] heeft al het "Veilig inhuren"-risk-reversal-blok dat de compliance-gate-vóór-bevestiging uitlegt (ronde 1 #239).
- [ ] (volgende ronde) **L** Herplaatsing bij uitval (Zorgwerk/ZZP-Markt "SOS"): annulering van een ACTIVE samenwerking → dienst weer 'open' + direct passende inzetbare ZZP'ers voorstellen. Hergebruikt status-transitie + `suggestedFreelancersForJob` + berichten. L/risicovol (raakt de openstaande-factuur-veiligheidsrem in de cancel-actie); zorgvuldig in een eigen ronde bouwen.

### Geparkeerd — PRODUCT/INFRA (eigenaar-besluit, niet stilzwijgend bouwen)

- **Per-dag-weekrooster-visualisatie op franchise-niveau** (PIDZ-plannersoog) — ADR-0004 parkeert de
  per-dag-rooster-bouw bewust tot eigenaar-akkoord. Zelfs een _read-only_ weekraster raakt dat besluit;
  daarom geparkeerd tot akkoord (dan strikt read-only visualisatie van bestaande `weekdays`, geen plan-engine).
- **Rooster-koppeling met externe instellingssystemen** (Nedap ONS/Ortec, à la Zorgwerk) — diepe
  API-/partnerschapsintegratie (build-vs-buy, datadeling met externe leveranciers). Een lichte
  CSV-dienst-import zou een BOUWEN-voorloper kunnen zijn; de echte API-koppeling = eigenaar.

### Geparkeerd — STRATEGISCH/PRIJS (eigenaar-besluit)

- **Brede inhuurmix onder één dak** (uitzenden/detachering/flexpool/MSP naast ZZP, à la Zorgwerk) —
  raakt de harde regel "geen payroll-tak"; fundamentele positionerings-/businessmodelkeuze.
- **Eigen-merk/white-label app per bureau in de stores** (Bendy-model) — harde regel: geen
  white-label/tenant-branding zonder eigenaar (branding-laag bestaat technisch, activatie = eigenaar).

### Feitcheck-correcties ronde 2 (niet als feit presenteren)

- PIDZ publiceert het **eigen fee-percentage nergens**; "3-15%"/"€3-5/u" komt uit PIDZ's kennisbank als
  algemene markt-bandbreedte, niet als PIDZ-tarief → markt-indicatie/schatting.
- PIDZ-franchisecijfers (entree €100k, jaarfee ~50% omzet, gebied 30-50km, ~€600k/vestiging) komen van
  denationalefranchisegids.nl (projectie 2024), **niet door PIDZ bevestigd** → derde-bron/projectie.
- PIDZ-volumeclaims (8.500+ opdrachten/week, 650+ instellingen, "80% binnen 2u") = **PIDZ-eigen marketing**, onafhankelijk onbevestigd.
- Zorgwerk-claims (75.000+ gescreend, 14.000+ locaties, "elke 20s een match") = **Zorgwerk-eigen marketing**; ZZP-fee "€3/u ex btw" uit support-snippet, opdrachtgever-marge **niet gepubliceerd**.
- ZZP-Markt-prijzen (vast bedrag/maand ZZP'er, % van uurtarief org) **niet in euro's gepubliceerd**; "no-cure-no-pay bij 0-1 diensten" = claim, bedragen onbekend.
- Bendy-prijs (€16/actieve gebruiker/maand + €2.500 opstart, geen take-rate, bron bendy.nl) = SaaS-per-seat zónder marktplaats — niet 1-op-1 met onze fee-logica vergelijkbaar.
