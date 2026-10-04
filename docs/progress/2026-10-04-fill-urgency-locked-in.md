# Lijst-fill-urgency volgt de locked-in-poort (4 oktober 2026)

## Defect (CLIENT, cross-surface next-action-drift, DOEL 1b)

Op "Mijn opdrachten" (`src/app/(protected)/opdrachten/(index)/page.tsx`) bepaalde de lijst
"vervuld" met een eigen `collaboration.groupBy` (status ≠ CANCELLED). De canonieke poort
`lockedInJobIds` (`src/lib/data/job-locked-in.ts`) én de opdrachtdetail-staffing-card
(`summarizeStaffingRisk`, `opdrachten/[id]/page.tsx:497` — `activeCollabs > 0 || ACCEPTED > 0`)
tellen daarnaast een vastgelegde ACCEPTED-kandidaat in de propose-limbo.

Gevolg: een gepubliceerde opdracht met een geaccepteerde kandidaat maar nog zonder samenwerking
kreeg op de lijst een rood/amber "Start over N dagen · nog niet vervuld"-chip
(`jobFillUrgency`), terwijl het opdrachtdetail geen staffing-waarschuwing toont en dezelfde
lijstpagina het started-signaal al correct via `lockedInJobIds` onderdrukt (regel 727). Drievoudige
tegenspraak + foutieve prikkel ("ga dit bemannen" i.p.v. "stuur het samenwerkingsvoorstel").

## Fix

De fill-urgency-afleiding verhuist naar een getest data-helper
`src/lib/data/job-fill-urgency.ts` (`getJobFillUrgency`) die exact `lockedInJobIds` gebruikt —
dezelfde poort die de pagina al voor started-signaal-onderdrukking hanteert. De poort-query wordt
beperkt tot gepubliceerde opdrachten met startdatum (de enige die een chip kunnen opleveren) en
overgeslagen als er geen kandidaten zijn. Lijst, detail en next-actions sporen nu gelijk; de
bespoke groupBy is uit de 1200-regel-pagina verdwenen.

## Bewijs

- `src/lib/data/job-fill-urgency.test.ts`: 5 gevallen — onderdrukking bij vastgelegde
  ACCEPTED-kandidaat, acute chip bij niet-vastgelegd, kandidaat-selectie van de poort-query
  (concept/geen-datum uitgesloten), poort overgeslagen zonder kandidaten, lege invoer. Groen.
- Volledige gate: typecheck, lint, test (unit), build, prettier — zie PR-body.
