# Compliance-signaal op de aanbevolen-opdrachten-kaart (2026-10-03)

## Waarom

Een ZZP'er ziet op het opdracht-detail en in de browse-lijst al expliciet welke vereiste
certificaten hij mist of die verlopen zijn (`computeCompliance` → `jobComplianceChip`). Die harde
gatingfactor in de zorg — "ben ik nú inzetbaar voor deze opdracht?" — ontbrak nog op de
aanbevelingskaart "Ook passend bij jouw profiel" (opdracht-detail) en de gerelateerde-opdrachten op
het dashboard. Daar werd alleen de sterkste positieve match-reden getoond. Gevolg: het systeem nudgt
de ZZP'er naar een opdracht waarvoor hij nog niet voldoet, zonder dat te laten zien — strijdig met de
noord-ster (alleen tonen wat telt en actie vraagt) en met de pariteit die detail/browse al bieden.

## Wat

- `src/lib/recommendations.ts` — `JobMatch` krijgt een optioneel `complianceChip`-veld. `recommendedJobs`
  berekent per opdracht `jobComplianceChip(match.compliance, requiredCredCount)` met dezelfde regels als
  de browse-lijst (`requiredCredCount` = aantal `required` certificaateisen). Server-berekend, geen
  client-logica (CLAUDE.md regel 1). `relatedJobsForFreelancer` erft het veld via `recommendedJobs`.
- `src/components/jobs/related-jobs-section.tsx` — rendert de chip onder de kaart wanneer aanwezig:
  warning (ontbrekend/verlopen vereist certificaat) met `ShieldAlert`, muted (in beoordeling) met
  `ShieldQuestion`. Spiegelt exact de chip-weergave op `/opdrachten`.

Geen nieuwe server-helper: `jobComplianceChip`/`computeCompliance`/`scoreJobForFreelancer` bestonden al
en worden hergebruikt. De chip zwijgt zodra de ZZP'er voldoet of de opdracht geen harde certificaateis
stelt, zodat de kaart rustig blijft.

## Bewijs

- `src/lib/recommendations-compliance-chip.test.ts` — echte SQLite-proef met vijf varianten (voldaan,
  geen eis, ontbrekend, verlopen, in beoordeling). Rood vóór de mapping-wijziging (`complianceChip`
  `undefined` i.p.v. de verwachte chip/null), groen erna.
- `npm run typecheck`, `npm run lint`, `npx prettier --check .` en `npm run build` groen; volledige
  `npm run test`-suite groen (zie PR-checks). E2e draait in CI.

## Nevenwerk — base-brede audit-poort gedeblokkeerd

De verplichte `audit`-poort (`scripts/audit-production.mjs`, `npm audit --omit=dev`) blokkeerde élke PR
base-breed op 4 high productie-deps, allemaal uit de `patch-package`-boom via de nieuwe `braces`
stack-exhaustion-DoS-advisory [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
(`braces <=3.0.3`, nog geen upstream fix). `patch-package` is een build-time tool (postinstall past de
Next-patch toe, ADR 0012); het Docker-image installeert dev+runtime in de builder-stage en kopieert
`node_modules` ongewijzigd naar de runtime-stage, dus `patch-package` hoort in `devDependencies`.
Verplaatst van `dependencies` → `devDependencies` + lockfile geregenereerd; niets aan de verscheepte
modules of de patch-toepassing verandert, alleen de productie-deps-audit ziet de kwetsbare `braces`-tak
niet meer. Dit spiegelt de eigenstandige fix-PR #1553; bij een rebase waarin die al op `main` staat,
is deze wijziging een no-op.
