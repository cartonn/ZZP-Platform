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

- [ ] **M** Publieke landing + login met vertrouwens-strip (échte platformdata, verificatie-keurmerk) — /login, root, /register
- [ ] **M** "Beste match"-banner met match-reasons op opdracht-detail/reactielijst — /opdrachten/[id], /kandidaten
- [ ] **S** No-cure-no-fee-abonnement expliciet communiceren ("geen werk = geen bijdrage") — /register, /abonnement
- [ ] **S** Verificatie-keurmerk-rij (VOG ✓ · BIG ✓ · Diploma ✓) op kandidaat-/ZZP-profiel — /zzp/[id], /kandidaten
- [x] (#237) **S** ORT-foutpreventie-indicator ("toeslagen automatisch berekend") op prestatie/factuur — /samenwerkingen/[id], /prestaties, /facturen
- [ ] **S** Zekerheids-/risk-reversal-blok op opdracht-detail ("certificaten vooraf geverifieerd") — /opdrachten/[id]
- [ ] **M** Rijkere facet-discovery + resultaattelling op /opdrachten
- [ ] **M** Acceptatie-/grace-venster met auto-akkoord-timer op de uren→prestatie-stap
- [ ] **M** Live, geanonimiseerd activiteits-/liquiditeitssignaal op dashboard (échte data)
- [ ] **M** Multi-apply met auto-opschoning van concurrerende reacties bij acceptatie
- [ ] **L** Web-push + één-tap reageren op ad-hoc diensten (PWA)

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
