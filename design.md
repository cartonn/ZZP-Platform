# DESIGN.md — UX/UI-principes (overhaul)

> De **canonieke tokens** (kleur, spacing, radius, typografie) en componentcontracten staan in
> [`design.md`](./design.md) + `src/app/globals.css` + `tailwind.config.ts`. Dit document legt de
> **overhaul-specifieke UX-principes** (§7) vast en de open thema-beslissing. In Fase 5 wordt dit
> verder ingevuld bovenop de cascade.

## ✅ Beslist — dark mode als gebruikerskeuze (toggle)

De eigenaar koos: **dark mode is een keuze op het platform**, geen geforceerde dark-first re-theme.
Het light-thema blijft de standaard; gebruikers kunnen wisselen via de **ThemeToggle** in de header.
Implementatie: Tailwind `darkMode: "class"`, donkere tokenwaarden in `globals.css` (`.dark { … }`),
een no-flash-script in `src/app/layout.tsx` (leest `localStorage`/systeemvoorkeur vóór de paint), en
pure logica in `src/lib/theme.ts` (getest). Omdat de tokens semantisch zijn, werken alle bestaande
componenten in beide thema's zonder wijziging.

## UX-principes (hard, §7)

- **"Aan zet"-principe.** Elke rol ziet bovenaan glashelder wat er nú van hém/haar wordt verwacht
  ("2 urenstaten wachten op je goedkeuring"). Geen zoeken. Gevoed door de next-action-engine.
- **Statushelderheid.** Eén consistente status-badge-taal over álle objecten
  (opdracht/contract/urenstaat/factuur/betaling): zelfde kleuren, labels, iconen. Nooit kleur alleen.
- **Cascade zichtbaar maken.** Waar logisch de keten tonen: "deze factuur volgt uit goedgekeurde
  urenstaat Y / contract X"; herleidbaar terug tot de opdracht (§5 herleidbaarheid).
- **Rechtstreekse betaling expliciet.** UI communiceert helder dat betaling buiten het platform om
  gaat en dat het platform alleen status bijhoudt (Besluit 1).
- **DBA-signalen rustig, niet-alarmerend, altijd met disclaimer** — nooit als juridisch oordeel.
- **Lege/laad/foutstaten overal.** Gedeelde `EmptyState` + `Skeleton` (bestaand).
- **Toegankelijk:** toetsenbordbediening, focus-states, contrast, schermlezer-labels.
- **Responsief:** desktop primair; mobiel bruikbaar voor goedkeur-/betaalmarkering-/opleveracties.
- **Microcopy:** correct, zakelijk Nederlands. Consistentie boven originaliteit.

## Statuskleur-mapping (voorstel, definitief in Fase 5)

| Toestand                                              | Kleurtoken         |
| ----------------------------------------------------- | ------------------ |
| concept / verwacht                                    | `muted`            |
| ingediend / ter goedkeuring / gemarkeerd              | `warning`          |
| goedgekeurd / actief / getekend / bevestigd / betaald | `success`          |
| afgekeurd / te laat / gecrediteerd                    | `danger`           |
| afgerond / gearchiveerd                               | `muted-foreground` |
