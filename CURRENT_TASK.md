# CURRENT_TASK.md — Huidige taak

> Eén taak tegelijk. Lees CLAUDE.md en PROGRESS.md voordat je begint.
> Werk dit bestand bij wanneer je naar de volgende taak gaat.

## NU: Sessie 9 — Polish, performance, a11y, e2e

### Doel
Het hele product strakker, sneller en toegankelijker maken; losse eindjes uit eerdere sessies
opruimen. Geen nieuwe features — kwaliteit verhogen.

### Bekende punten uit eerdere sessies (oppakken)
- **Post-save controlled-select flits** (Sessie 1): direct na een server-action-save toont een
  `<select>` kort de oude waarde tot de RSC-refresh; nette toast/refresh-afhandeling gewenst.
- **Berichtenlijst perf** (Sessie 6): `/berichten` haalt álle messages per conversatie op om
  ongelezen te tellen; vervang door `_count`/`take:1` of een aparte count-query.
- **Dubbel-gesprek-race** (Sessie 6): geen unieke index op (jobId, deelnemerspaar) — overweeg een
  guard of accepteer bewust.
- **SQLite case-sensitieve zoek** (Sessie 2): documenteer/abstraheer; op Postgres insensitive.

### Stappen (kies pragmatisch, hou diffs behapbaar)
1. **A11y-pass:** focus-states overal, `aria-label`s op icon-only knoppen, form-labels, landmark-
   structuur, kleurcontrast, toetsenbordnavigatie door de belangrijkste flows.
2. **Loading/empty/error-states:** controleer elke route op alle drie; voeg `loading.tsx`/skeletons
   toe waar nuttig; consistente lege-staat-teksten.
3. **Performance:** N+1/over-fetching wegwerken (berichtenlijst, dashboards), `select` minimaliseren,
   indexen benutten; meet build-output.
4. **Consistentie:** statuschips, spacing, knop-varianten, Nederlandse microcopy uniform; mobiele
   weergave (sidebar/`max-md`) controleren.
5. **e2e:** een doorlopende "golden path"-test per rol; a11y-smoke (bijv. axe) optioneel.

### Definition of Done (deze sessie)
- [ ] A11y-knelpunten in de hoofdflows verholpen
- [ ] Elke route heeft loading/empty/error; geen console-errors
- [ ] Berichtenlijst-perf gefixt; geen onnodige over-fetching in lijsten
- [ ] typecheck + lint + test + build groen; e2e groen + screenshots gecontroleerd
- [ ] Commit, PROGRESS.md bij, CURRENT_TASK.md naar Sessie 10

### Niet nu doen
Geen nieuwe features. Geen productie-infra (S3/Postgres/mail) — dat is Sessie 10 (code-kant) + mens.

---

## QUALITY_CHECKLIST (gebruik elke sessie vóór commit)
```
npm install            # indien dependencies gewijzigd
npm run lint
npm run typecheck
npm run test
npm run build
npx prisma db push     # of migrate, indien schema gewijzigd
npm run db:seed        # indien seed gewijzigd
# Start dev, klik de gebouwde flow door, check browserconsole op errors
```
Faalt iets → oorzaak onderzoeken, fixen, checks opnieuw. Pas daarna afvinken.
