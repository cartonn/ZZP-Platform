# CURRENT_TASK.md — Huidige taak

> Eén taak tegelijk. Lees CLAUDE.md en PROGRESS.md voordat je begint.
> Werk dit bestand bij wanneer je naar de volgende taak gaat.

## HANDOFF — operationele stand (lees dit eerst)

- **Live:** test-URL `zzp-platform-production-be07.up.railway.app`. Demo-accounts (wachtwoord
  `demo1234`): `opdrachtgever@`, `zzp@` (Sanne), `admin@zzp-platform.local`.
- **Deploy:** Railway bouwt/deployt branch **`claude/dazzling-carson-v9Qwk`** automatisch (Dockerfile).
  `scripts/start.mjs` doet bij elke boot `prisma db push` + **seed (idempotent)** → de rijke demo-
  inhoud staat er altijd (7 ZZP'ers met certificaten, 6 opdrachten + concept, reacties in alle
  statussen, 2 samenwerkingen, 4 facturen incl. verlopen).
- **24/7-bouw:** Routine **"ZZP auto-build"** in Claude Code on the web (claude.ai/code/routines),
  elke ~2 uur. Orchestrator op **Opus**, builder-subagents op **Sonnet** (zie `.claude/agents/*`).
  Maakt per run een **Linear-issue in team "ZZP Platform HUB"** (In Progress → Done met commit-hash).
  **Let op:** routine-runs pushen naar hun eigen **`claude/epic-*`-branch** — die moet je naar
  `claude/dazzling-carson-v9Qwk` **mergen** (na de poort) om live te gaan. `ANTHROPIC_API_KEY`-secret
  staat in GitHub. (De GitHub-Actions-cron `auto-build.yml` bestaat ook, maar is onbewezen vanuit de
  sessie — de Routine is de gekozen route.)
- **Vóór échte productie (mensenwerk, zie MENSENWERK.md):** juridisch/AVG-review (blokkeert livegang
  met echte gevoelige documenten), betalingen (Stripe/Mollie), echte verificatie-API's (DUO/BIG/iDIN
  — nu demo), e-mail, S3-documentopslag, eigen domein. Code is hierop voorbereid.

---

## STATUS: AUTO-MODE — continu doorbouwen (live op Railway)

MVP + meedenk-laag staan **live** op Railway (branch `claude/dazzling-carson-v9Qwk`,
auto-deploy). Geen "klaar"-moment: pak de bovenste open taak uit de backlog, lever af
volgens de Definition of Done (zie CLAUDE.md → AUTO-MODE), commit + push, pak de volgende.
Altijd `git fetch`/rebase vóór commit én push (meerdere agents pushen naar dezelfde branch).

### Backlog (bovenste eerst — houd deze lijst levend)
1. Semantisch matchen met pgvector — **GEBLOKKEERD in de headless routine-omgeving**:
   vereist productie-Postgres mét `vector`-extensie (lokaal/CI draait op SQLite, dus de
   groene poort dekt het niet) én semantische embeddings uit een extern model (botst met
   "deterministisch, server-side waarheid" + geen-"AI"). Oppakken zodra een mens prod-Postgres
   + embedding-bron heeft gekozen; tot dan onderaan de prioriteit.
2. JWT-staleness bij schorsing/rol-wijziging: status uit DB herlezen in `currentActor`
   (of korte token-TTL) zodat een net-geschorste gebruiker direct geen toegang houdt.
3. Durable rate-limit-store (Redis/Upstash) achter de bestaande `RateLimitStore`-interface
   voor multi-instance; daarna ook rate-limiting op zware mutaties (uploads/verificatie).
4. AVG: verwerkingsregister + bewaartermijnen documenteren/afdwingen (deels mensenwerk).

Gereed: rate-limiting op login + registratie (brute-force-bescherming, deterministische
fixed-window-limiter met pluggbare store) · bedrijfsprofiel-compleetheid · admin gebruikers "vraagt aandacht" ·
nieuwe-reactie-notificatie · uitlegbare matching (match-reasons) · next-action-engine
(dashboard draait erop) · beschikbaarheid in matching (score onveranderd, reden + badges) ·
design-polish-pass (gedeelde EmptyState + Skeleton, route-skeletten, reduced-motion) ·
verloopdetectie als geplande taak (runExpiryTask + POST /api/tasks/expiry met CRON_SECRET,
"verloopt binnenkort"-herinneringen, idempotent via expiryReminderFor).

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
