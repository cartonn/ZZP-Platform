# MISSIE: PRODUCTIE-KLAAR — doorlopende opdracht voor alle agents

> Eigenaar-opdracht 11-6-2026. Werk per iteratie/run één increment volledig af (DoD-groen,
> PR, CI-poort, merge, prod-health) tot de eindstreep hieronder is gehaald. Lees altijd eerst
> CLAUDE.md (incl. 3a), CURRENT_TASK.md, PROGRESS.md, DESIGN.md.

Concurrenten: PIDZ, Bendy, Zorgwerk. Wij winnen op verklaarbare matching, verificatie/
vertrouwen, Wet-DBA/AVG-compliance en een rustiger, mooier product.

## Eindstreep (alles waar = missie af)

### A. Security groen

- [x] npm audit 0 high/critical · scan:secrets groen (CI `security.yml`)
- [x] JWT-staleness: `currentActor` herleest status/rol uit de DB (geschorst = direct buiten)
- [x] Rate-limiting: login/registratie/reset/zelf-verificatie ✓ + berichten/reacties/
      uploads/AVG-export (PR #322)
- [ ] CSP-nonce-pipeline i.p.v. `script-src 'unsafe-inline'` (eigen iteratie; e2e-verifiëren,
      let op static→dynamic rendering)
- [ ] /security-review op het actuele diff zonder open High/Critical
- Mensenwerk (niet blokkeren, wel in MENSENWERK.md): juridisch/AVG-review, SMTP, S3, secrets.

### B. Kritieke gebruikersloops groen (e2e)

- [ ] Playwright dekt: registratie→profiel→certificaat→admin-verificatie→opdracht→reactie→
      match→samenwerking→contract→uren→goedkeuring→factuur→betaling (cascade A–E) voor
      FREELANCER, CLIENT én ADMIN; plus dispuut/credit-zijpad.
- [ ] e2e van advisory → blocking in `ci.yml` (audit T6) zodra 3 opeenvolgende runs groen.

### C. Frontend slick — Vakwerk-ontwerptaal

Bron: branch `claude/gifted-ramanujan-4u3uk7` (tokens/fonts, seal, match-meter,
cascade-stepper, sparkline, stat-card, turn-banner, palette-switcher, held-kaart-dashboard,
ADR-0007, docs/PLAN-WERELDKLASSE.md, docs/ontwerpen/\*.html).

- [ ] Fase 1: tokens + fonts + signatuurcomponenten landen (cherry-pick op actuele main)
- [ ] Fase 2: dashboard held-kaart + stat-cards + warm licht palet (Honing) als default
- [ ] Fase 3: werkproces-/samenwerkingenpagina (cascade-stepper, turn-banner)
- [ ] Fase 4: overige schermen + dark-mode-pariteit + palette-switcher
- Regels: DESIGN.md is canoniek; nul dode knoppen; loading/error/empty overal; geen
  tekst-overflow; elke gewijzigde pagina visueel geverifieerd (e2e-screenshots).

### D. Bergings-backlog (docs/BRANCH-SANERING-2026-06-11.md)

- [x] Afronden-rem (geen COMPLETED met open geld) · [x] CSV-formule-injectie ·
      [x] academie↔vertrouwen
- [ ] FRANCHiser-fallback boekhouding · [ ] AVG-verwerkingsregister `/admin/avg` ·
      [ ] KvK-/BTW-formaatvalidatie · [ ] beschikbaarheidsconflicten · [ ] CLIENT-dashboard
      "wat kan ik oppakken" · [ ] tweezijdige beoordelingen · [ ] iCal-export ·
      [ ] dispuut-triage-prioriteit

## Werkwijze per iteratie

1. `git fetch` + verse branch vanaf `origin/main`; overlap-check (`gh pr list` + main-log +
   PROGRESS-top). 2. Bovenste onafgeronde punt (security/geld eerst); vink hier af wat klaar
   is. 3. Kern + unit-tests → UI → typecheck/lint/test/build/prettier groen. 4. PR → CI-poort
   geverifieerd groen → admin-merge (eigenaar-autorisatie 11-6) → prod-health
   (`/api/health` toont nieuwe commit; anders stoppen met mergen en melden). Railway-checks
   `friendly-optimism`/`artistic-courage` zijn bekend kapot en tellen niet. 5. PROGRESS.md +
   CURRENT_TASK.md bij. 6. Blocker: max 2 herstelpogingen, dan parkeren + noteren.
   PR's 100–300 regels; "AI" nergens in UI/teksten; UI-taal Nederlands.
