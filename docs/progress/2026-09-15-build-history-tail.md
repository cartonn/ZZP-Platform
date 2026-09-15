# Oorspronkelijke voortgang — staartarchief 15 september

Ongewijzigd verplaatst uit PROGRESS.md om de hoofdvoortgang binnen 400 regels te houden.

## 2026-09-09 — security/privacy auditronde 6: TOCTOU statusovergang-bypass op support-tickets gedicht (CLAUDE.md regel 3)

**Wat:** security-/privacy-auditronde (orchestrator Opus 4.8 + 3 parallelle adversariële Opus-audits op
niet-overlappende oppervlakken: A authz/IDOR/cross-tenant over álle API-routes + auth-keten + cron/webhooks ·
B server-action-mutaties + guardlagen · C privacy/AVG + injectie). Basis `main` @ 12d5b36c. **Eén MIDDEL
gedicht, één HOOG privacy-item heropend voor eigenaar/FG-besluit**, rest clean met file:line-bewijs.

De gebruiker-zijde support-acties `replyToTicket`/`markResolved` (`src/app/(protected)/support/actions.ts`)
toetsten hun statusovergang tegen een vóór-transactionele snapshot en schreven daarna met een **kale**
`prisma.supportTicket.update({ where: { id } })` — zónder de compound-guard `where: { id, status: from }` die
élk ander statuswijzigend oppervlak in de repo gebruikt. Daardoor kon een race (aanvrager reageert terwijl een
ADMIN het ticket afrondt) de live status blind overschrijven en een overgang forceren die
`SUPPORT_TICKET_TRANSITIONS` verbiedt (bv. `RESOLVED→ESCALATED`): de transitie-map-invariant omzeild via timing,
het admin-besluit stil teruggedraaid. **Fix:** beide acties gebruiken nu `updateMany` mét de statusguard (flip
telt alleen zolang de status écht nog `from` is; verliest de race → count 0, geen write, geen fantoom-audit) en de
audit draagt de `{from,to}`-overgang. Spiegelt `admin/support/actions.ts` exact. **Bestanden:**
`src/app/(protected)/support/actions.ts` + `src/app/(protected)/support/toctou-transition.test.ts` (4 tests,
rood→groen bewezen: 3 falen op de oude kale `update`, alle groen met de guard).

**Heropend (geen code-wijziging — eigenaar/FG-besluit):** publiek `/zzp/[id]` toont individueel herleidbare
reviews (naam + rating + verbatim comment) zonder k-anonimiteitsvloer (HOOG, AVG art. 5(1)(f)/25). Al eerder
geparkeerd; audit C bevestigde dat het live blijft. Product-/juridische afweging (MENSENWERK §5), buiten
agent-scope — besluit vereist vóór go-live met echte documenten. Zie `docs/SECURITY-PRIVACY-BACKLOG.md` ronde 6.

**Checks:** typecheck ✓ · lint ✓ · unit (8519 passed, 2 skipped) ✓ · build ✓ · prettier ✓ · CI-poort verifiëren (PR volgt).

## 2026-09-09 — prod: Dependabot supply-chain-automatisering (npm + github-actions)

**Wat:** `.github/dependabot.yml` toegevoegd — de code-kant van het MENSENWERK "Dependency graph +
Dependabot"-item. De `audit`-CI-poort (`scripts/audit-production.mjs`) **detecteert** high/critical-
advisories in de productie-deps en blokkeert de merge, maar niets **herstelde** ze automatisch: een
bump gebeurde pas als een mens/agent het opmerkte (zie #1444, #01c05fc7). Dependabot sluit dat gat en
opent zelf de herstel-/versie-PR's, zodat het venster tussen een bekend CVE en de fix minimaal is en de
ge-pinde GitHub Actions-versies actueel blijven.

**Config:** twee ecosystemen — `npm` (root; **gegroepeerd** in productie- én dev-buckets voor
minor/patch, majors bewust als losse PR's) en `github-actions` (root; alle actions gegroepeerd). Wekelijks
(maandag 06:00 Europe/Amsterdam), begrensde PR-flux (10 resp. 5) zodat de reviewqueue/CI-poort niet
dichtslibt, `chore`-commit-prefix met scope, label `dependencies`. Elke Dependabot-PR loopt door dezelfde
6 vereiste statuschecks (check/e2e/audit/secret-scan/CodeQL/agent-review) — nooit een automatische merge
zonder groene poort. Security-updates komen out-of-band binnen zodra de repo-web-toggle voor Dependency
graph en Dependabot security updates aanstaat (enige resterende menselijke stap).

**Drift-bewaking:** `scripts/dependabot-config.test.ts` (7 tests) — Dependabot draait niet in CI, dus
zonder deze test kan de config stil verweken (verdwenen ecosysteem/groepering) zonder dat een poort dat
opmerkt. Assert: versie 2, npm + github-actions aanwezig, wekelijks + Europe/Amsterdam, begrensde PR-flux,
npm-productie/dev-groepen, actions-groepering, root-directory.

**Checks:** typecheck ✓ · lint ✓ · unit ✓ · build ✓ · prettier ✓ · CI-poort verifiëren (PR #1453).
