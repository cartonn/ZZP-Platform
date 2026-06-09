# 0007 — Vakwerk als ontwerptaal en standaardpalet

- Status: geaccepteerd
- Datum: 2026-06-09

## Context

Het platform had een foutloos maar gezichtsloos designsysteem: systeemfont, bijna-monochroom
standaardpalet, geen datavisualisatie en drie wissel-paletten zonder duidelijke merkidentiteit.
De eigenaar vroeg om een wereldklasse-niveau en koos uit de ontwerpverkenning
(`docs/ontwerpen/vakwerk.html`) expliciet voor de lichte variant met een pastel achtergrond.

## Besluit

1. **Vakwerk wordt het standaardpalet**: pastelblauw papier (`--background: 214 60% 96%`),
   witte vellen (kaarten), klein-blauw als merkkleur (`--primary: 234 71% 45%`), zegelgroen
   voor geverifieerd (`--success: 155 75% 27%`), radius 0.75rem. Donkere modus uit dezelfde
   semantische tokens. De bestaande paletten (bloei, elektrisch-blauw) blijven als keuze werken.
2. **Typografie**: Inter (UI), Schibsted Grotesk (koppen), JetBrains Mono (alle cijfers) via
   `next/font` — zelfgehost, geen runtime-afhankelijkheid.
3. **Signatuurcomponenten** in `src/components/ui/`: `Seal`, `MatchMeter`, `Sparkline`,
   `CascadeStepper`, `TurnBanner`, `Table`. Pure logica in `src/lib/` (meter, sparkline,
   revenue) met unit-tests.
4. **Routekaart**: vervolg in `docs/PLAN-WERELDKLASSE.md` (fase 2–5: UX-herordening,
   reviews/flexpools/tariefinzicht, backend-hardening, mobiel).

## Gevolgen

- DESIGN.md §1–§5 beschrijft de nieuwe taal; afwijken = drift = bug.
- Handgerolde tabellen migreren stapsgewijs naar de `Table`-primitives.
- De "aan zet"-informatie krijgt overal de `TurnBanner`-vorm (max. één per pagina).
- KPI-cijfers en bedragen renderen in mono (`font-mono`), labels als overline.
