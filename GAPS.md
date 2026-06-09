# GAPS — gaten-backlog van de zelf-test-lus

Bijgehouden door de persona-sweep (zie `LOOP.md`). Fix-agents werken deze van boven naar beneden af;
gefixte items krijgen `[x]` + PR-nummer. "Productkeuzes" worden NIET gefixt zonder eigenaar-besluit.

## Iteratie 0 — 2026-06-09 (kalibratie)

53 screenshots over 4 persona's → 29 ruwe bevindingen → **16 bevestigd**, 3 productkeuzes, 8 dropped.

### Bevestigd (te fixen)

- [x] **HOOG · BUG** (#226) — Vertrouwensniveau "Volledig geverifieerd" negeerde ontbrekende verplichte
      documenten (`src/lib/trust.ts`). → trust weegt nu VOG+verzekering mee op alle 5 surfaces.
- [x] **HOOG · BUG** (#227) — Afgeronde + betaalde samenwerking toonde nog actieve "Akkoord geven" op de
      modelovereenkomst. → `canSign`/`canChooseType` alleen bij PROPOSED/ACTIVE.
- [x] **HOOG · UX** (#227) — Tegenstrijdige ongelabelde badges op ZZP-detail. → gelabeld als
      "Inzetbaarheid" / "Beschikbaarheid".
- [x] **MIDDEN · COPY** (#229) — Abonnementspagina lekt "Dit is een demo zonder echte betaling"
      (`abonnement/page.tsx`). → demo-tekst weg / neutraal herschrijven.
- [x] **MIDDEN · UX** (#229) — Audit-log toont rauwe JSON met centen + e-mail (`admin/audit/page.tsx`). →
      nette NL key/value + geformatteerde bedragen.
- [x] (#233) **LAAG · COPY** — Engelse native file-knop "Choose File / No file chosen" (bedrijf/documenten/
      certificaten/import). → eigen NL "Bestand kiezen".
- [x] (#231) **LAAG · COPY** — "Pdf"-knoplabel i.p.v. "PDF" (`admin/facturatie/page.tsx`).
- [~] (bewust laag) Native datumvelden: rechter stelde zelf vast dat lang="nl" al gezet is; placeholder volgt de browser-UI-taal. Niet gefixt — zeer lage waarde.
- [x] (#232) **LAAG · UX** — Leads-KPI "Open leads 2" vs 3 zichtbare leads zonder uitleg (subtekst/filter).
- [x] (#231) **LAAG · UX** — "Inzetbaar 0 van 2"-tegel op franchise-inzicht niet klikbaar, geen reden/vervolg.
- [x] (#231) **LAAG · UX** — Factuurlijst toont totaal incl. btw zonder "(incl. btw)"-label.
- [x] (#232) **LAAG · UX** — "Genereer facturen" geeft geen zichtbare terugkoppeling.
- [x] (#231) **LAAG · UX** — Verzekering-herstelactie is onopvallende tekstlink i.p.v. knop.
- [x] (#236) **LAAG · UX** — ZZP'er-toevoegformulier permanent uitgeklapt boven roster (vs. opdrachtgevers via knop).
- [x] (geverifieerd) "Reageren"-knop: geen bug — de testopdracht had al een reactie; de reageer-flow is gedekt door e2e (onboarding/applications) + de abuse-suite.
- [x] **HOOG → harness-artefact** — Zwevend 'N'-element over de sidebar = Next.js **dev-indicator**;
      alleen in `npm run dev`. Opgelost door de sweep tegen een productie-build te draaien
      (`playwright.personas.config.ts`). Geen app-fix.

### Productkeuzes (eigenaar-besluit — niet auto-fixen)

- [x] (#234, primaire accounts) Seed-/demodata is IT/developer i.p.v. zorg (positionering). Verrijken met zorgcontext = keuze.
- [x] (#235) Franchise-diensten-overzicht is read-only zonder doorklik naar dienst-detail.
- [x] (#232) Statistieken: subgroep-percentages tellen niet zichtbaar tot 100% (admins niet apart getoond).
