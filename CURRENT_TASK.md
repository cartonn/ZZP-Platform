# CURRENT_TASK.md — Huidige taak

> Eén taak tegelijk. Lees CLAUDE.md en PROGRESS.md voordat je begint.
> Werk dit bestand bij wanneer je naar de volgende taak gaat.

## STATUS: AUTO-MODE — continu doorbouwen (live op Railway)

MVP + meedenk-laag staan **live** op Railway (branch `claude/dazzling-carson-v9Qwk`,
auto-deploy). Geen "klaar"-moment: pak de bovenste open taak uit de backlog, lever af
volgens de Definition of Done (zie CLAUDE.md → AUTO-MODE), commit + push, pak de volgende.
Altijd `git fetch`/rebase vóór commit én push (meerdere agents pushen naar dezelfde branch).

### Backlog (bovenste eerst — houd deze lijst levend)
1. Verloop-detectie als geplande taak (cron/automation = mensenwerk) → echte expiry-notificaties.
2. Semantisch matchen met pgvector zodra productie-Postgres draait (nu al: Postgres ✓).

Gereed: bedrijfsprofiel-compleetheid · admin gebruikers "vraagt aandacht" ·
nieuwe-reactie-notificatie · uitlegbare matching (match-reasons) · next-action-engine
(dashboard draait erop) · beschikbaarheid in matching (score onveranderd, reden + badges) ·
design-polish-pass (gedeelde EmptyState + Skeleton, route-skeletten, reduced-motion).

### Per increment (geen uitzonderingen)
testbare kern + unit-tests → UI → typecheck/lint/test/build groen → e2e + screenshot →
commit → push naar `claude/dazzling-carson-v9Qwk` → werk PROGRESS.md + deze backlog bij.

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
