# DESIGN.md — UX/UI-principes (overhaul)

> De **canonieke tokens** (kleur, spacing, radius, typografie) en componentcontracten staan in
> [`design.md`](./design.md) + `src/app/globals.css` + `tailwind.config.ts`. Dit document legt de
> **overhaul-specifieke UX-principes** (§7) vast en de open thema-beslissing. In Fase 5 wordt dit
> verder ingevuld bovenop de cascade.

## ⚠️ Open beslissing — dark-first vs. het huidige light-thema
De overhaul §7 vraagt **dark-first**; het bestaande design-systeem (`design.md`) is bewust
**light** (Linear/Vercel/Stripe-stijl). Dit is een fundamentele richtingskeuze die het hele
platform raakt → **stop-and-confirm vóór Fase 5** (zie `DECISIONS.md`). Tot die keuze is gemaakt:
geen visuele ombouw; nieuwe schermen volgen het huidige (light) tokensysteem zodat alles consistent
blijft. De tokens zijn semantisch (CSS-variabelen) → een latere thema-omslag raakt geen componenten.

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
| Toestand | Kleurtoken |
|---|---|
| concept / verwacht | `muted` |
| ingediend / ter goedkeuring / gemarkeerd | `warning` |
| goedgekeurd / actief / getekend / bevestigd / betaald | `success` |
| afgekeurd / te laat / gecrediteerd | `danger` |
| afgerond / gearchiveerd | `muted-foreground` |
</content>
