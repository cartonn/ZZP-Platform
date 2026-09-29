## Openstaande backlog (bovenste eerst; pak er één, lever DoD-groen, push)

> De volledige "Gedaan (niet opnieuw)"-lijst staat in het archief. Alles hieronder is
> **geverifieerd nog open** op 2-9-2026.

### Product / kern

1. **Rooster-marktplaats — publiceer-/claim-kant.** De discovery-kalender (`roster-market.ts`
   `buildRosterCalendar`, read-only `/rooster`) staat. Open: de opdrachtgever dateert losse
   diensten en de ZZP'er claimt er direct één vanuit de kalender.
2. **Lege-, laad- en fouttoestanden naar de Vakwerk-stijl** (PLAN-WERELDKLASSE Fase 2, restpunt).
3. **Mail-intake fase 3:** browserproef gebouwd in #1490, lokaal groen; review/CI nog vereist.
   Webhook → reviewqueue → concept, auth/ownership/duplicaten. Provider/MX/DNS blijft mensenwerk.
4. **Semantiek als uitlegbare scorecomponent** — fundering staat (`src/lib/semantic.ts` +
   `src/lib/services/semantic-matcher.ts`); pgvector blijft geparkeerd achter de ADR-trigger
   (`docs/decisions/0010-semantische-matching.md`: > ~50k discoverable profielen óf scoring
   > ~50 ms p95).

### Robuustheid / techniek

0a. **Gedeelde constant-time secret-vergelijking — GEDAAN (10-9, PR #1469).** Eén audited primitive
`constantTimeEqual` (`src/lib/security/constant-time-equal.ts`, HMAC-random-key → 32-byte digests →
`timingSafeEqual`) ontdubbelt het 6× herhaalde `timingSafeEqual`+lengte-check-patroon en dicht de
secret-length-leak op `authorizeCron` + mail-intake (vroege lengte-return op een niet-publiek secret).
Refactor van 6 call-sites (cron/mail-intake/stripe-sig/totp/share-token/feed-token), gedrag behouden;

- ontbrekende `cron-auth`-test (7). Geen menselijke reststap.

0b. **Request-body begrensd op de resterende body-lezende API-endpoints (CWE-400) — GEDAAN (9-9, PR
#1446).** `readLimitedJson`-helper (`src/lib/http/read-limited-text.ts`) trekt de gestreamde
body-grens door naar `push/subscribe` (8 KB), `push/unsubscribe` (4 KB) — beide sessie-auth zónder
rate-limit — en `backups/heartbeat` (1 KB, Bearer). Onbegrensd `request.json()` bufferde de volledige
chunked stream vóór parsen. Gedrag bij geldige body ongewijzigd. Tests: 5× `readLimitedJson`.

0c. **Dependabot supply-chain-automatisering — GEDAAN (9-9, PR #1453).** `.github/dependabot.yml`
(npm productie/dev-groepen + github-actions, wekelijks Europe/Amsterdam, begrensde PR-flux) opent
zelf de herstel-/versie-PR's die de `audit`-poort alleen detecteerde; drift-test
`scripts/dependabot-config.test.ts` (7). Resterend mensenwerk: alleen de web-toggle "Dependency
graph + Dependabot security updates" aanzetten (MENSENWERK). Elke Dependabot-PR loopt door de 6 poorten.

0. **[GELD — HOOG] Dubbel-afronden in `segmentShifts` (`src/lib/shift.ts`) — GEDAAN (7-9, PR volgt).**
   De minuten-doorloop + validatie zijn uit `segmentShift` gedeeld in helper `accumulateShiftMinutes` die de
   RUWE `minutesByCat` teruggeeft; `segmentShift` én `segmentShifts` aggregeren ruwe minuten en ronden precies
   één keer via `segmentsFromMinutes` (`round(Σ minᵢ/60)` i.p.v. `round(Σ round(minᵢ/60))`). Publieke API's
   ongewijzigd; per-losse-dienst-gedrag identiek. Regressietests: 10× 21:50–22:00 → 1,67u (was 1,70u),
   3× 5 nachtmin → 0,25u (was 0,24u). Zie PROGRESS.md bovenaan.

1. **Twee resterende flaky e2e-tests** (slagen op retry, `retries: 2` absorbeert ze — geen
   blocker): `critical-personas.spec.ts:111` (franchise onbestaand-id → 404, soms 200 op de eerste
   poging) en `support.spec.ts:53` (admin-helpdesk, login-timing).
2. **Componenttest `ExpiryOverviewCard`** (review-should-fix #371) — vergt jsdom/testing-library
   naast de Vitest-`node`-omgeving; alleen oppakken als die infra er toch komt.
3. **Perf-refactors (risky, apart oppakken):** `clientCredentialAlerts` overload met voorgefetchte
   rijen (2 queries minder per CLIENT-dashboard); `suggestedFreelancersForClient` fan-out (pool
   één keer fetchen, in-memory scoren); `savedJobIds`-query op `/opdrachten` in de bestaande
   `Promise.all` vouwen.
4. **CSV-uren tonen float-artefact in de CAO-afstem-export** — GEDAAN (9-9, PR #1443). `fmtHours` in
   `prestaties.ts`/`diensten.ts` rondt op honderdsten af en de kale "Uren"-kolom (`X.hours.toString()`)
   loopt door dezelfde formatter; regressietests op alle drie de uren-kolommen (`Uren`/`Reguliere
uren`/`ORT-uren`) in beide export-suites. Geld ongemoeid.
5. **Ongeguard `JSON.parse(p.ortSegments)`** — GEDAAN (9-9, PR #1443). Beide lezers gebruiken nu de
   canonieke try/catch-parser `parseOrtSegments` (stille `[]`-terugval); test: één corrupte rij →
   geen throw, `hasOrt=false`, terugval op uren×tarief.

6. **Prestatie-goedkeuring — twee escalatie-follow-ups** (kern, next-action-engine; bron: audit
   3-9-2026, zelfde stall-thema als de wachttijd-bewuste keur-taak van 3-9). (a) De admin-escalatie
   is nu nog een fire-once-melding; maak er een **duurzame, zelfhelende admin-next-action** van in
   `adminTasks()` (SUBMITTED-prestatie ouder dan de escalatiedrempel op een ACTIVE, niet-bevroren
   inzet) — let op de nav-badge-pariteit (`signals.ts`), anders ondertelt de badge het actiecentrum.
   (b) De **factuur-goedkeuring** (opdrachtgever, SUBMITTED cascade-factuur) heeft — anders dan de
   prestatie-goedkeuring — géén dag-3/7-herinnering + admin-escalatie; spiegel
   `performance-approval-reminders(.ts/-task.ts)` naar een `invoice-approval-reminders`-paar en hang
   het in `api/tasks/run-all`. Sluit de enige un-genudgede opdrachtgever-poort in de cascade.
   **(b) GEDAAN (10-9, PR #1473):** `invoice-approval-reminders(.ts/-task.ts)` gebouwd naar het model van
   `performance-approval-reminders` — dag-3/7-herinnering naar de opdrachtgever (`counterpartyUserId`) op
   een SUBMITTED cascade-factuur + admin-escalatie ná de laatste dag; anker `Invoice.issuedAt`, idempotent
   op `DomainEvent.dedupeKey`, geregistreerd in `run-all`. **(a) GEDAAN in #1487, gemerged en live geverifieerd:** blijvende admin-next-action met
   gedeelde serverquery voor lijst en badge, oudste 50 eerst en automatische statusbewaking.

### Wacht op een eigenaarsbesluit (niet zelf oppakken)

> Voorstel voor de strategische keuzes: **ADR 0011 — focus & wig**
> ([`docs/decisions/0011-focus-en-wig.md`](docs/decisions/0011-focus-en-wig.md), status
> _voorgesteld_). Zolang die niet is aanvaard of verworpen, blijven de punten hieronder liggen.

- **Financiën-consolidatie:** bedragen staan op vijf plekken (dashboard-tegel, Administratie 2×,
  Inzicht, losse kaarten). Voorstel: Administratie = enige bron; dashboard/Inzicht alleen
  doorklik-samenvattingen. Herontwerp, geen incrementje.
- **Toezicht-tab "Integraties & security":** webhooks, malware-scans en CSP-meldingen zijn voor de
  admin onzichtbaar; plus een feed met platformwijzigingen.
- **Actie-engine-consolidatie:** `adminNextActions`/`franchiserNextActions` (`next-actions.ts`) en
  `pendingTasks()` (`actions/pending-tasks.ts`) zijn twee parallelle engines — #567 voedde
  maandenlang de dode. Samenvoegen tot één bron.
- **AVG — notificatie-bodies bij erasure:** een bedrijfsnaam blijft in oude notificaties van
  ontvangers staan na anonimisering (MIDDEL; zelfde aanpak als de auditlog-scrub nodig).
- **Ontwerp-lab archiveren:** de concepten staan nog in `src/`; verplaatsen naar een archiefmap
  buiten de app of een cap per reeks. (Pakket E haalt het lab uit de Docker-image en zet het
  ADMIN-only; de archivering zelf blijft open.)
- **Fee-transparantie-UI:** de fee als aparte regel voor béíde partijen op factuur + samenwerking.
  Geparkeerd tot billing aangaat (`docs/PRIJSADVIES.md`). Symmetrie is geverifieerd: geen
  role-conditional bedragen, tenant-fees in geen enkele partij-UI.
- **Invite-dedup + betaal-event-idempotentie (LAAG):** audit-metadata-string-match →
  `DomainEvent.dedupeKey`; provider-event-id expliciet vastleggen.
- **Web-push (VAPID):** code-kant af (env-validatie, half-activatie-guard, zelftest, heartbeat);
  sleutels genereren en zetten is mensenwerk.

### Mensenwerk (blokkeert livegang, niet door een agent te doen)

- **Juridisch/AVG-review** vóór livegang met echte gevoelige documenten (MENSENWERK §5).
- **E-mail-uitnodiging i.p.v. tijdelijk wachtwoord** bij de onboarding-import — vergt een
  werkende SMTP-/HTTP-mailkoppeling (MENSENWERK §2).
- **Productie-secrets** (`SHARE_TOKEN_SECRET`, `AUTH_URL`, sterke `AUTH_SECRET`), Upstash-Redis
  voor de gedeelde rate-limit-store, `DRILL_DATABASE_URL` voor de herstel-drill (MENSENWERK §1/§7).

---

## Per increment (geen uitzonderingen)

Testbare kern + unit-tests → UI → `npm run typecheck` / `npm run lint` / `npm run test` /
`npm run build` groen + `npx prettier --write .` → commit → **PR naar `main`** → **CI-poort
geverifieerd groen** (`gh pr checks <nr>`, citeer de uitkomst) → `gh pr merge <nr> --squash --auto`
→ werk PROGRESS.md + deze backlog bij.

## QUALITY_CHECKLIST (vóór commit)

```
npm install            # indien dependencies gewijzigd
npm run lint
npm run typecheck
npm run test
npm run build
npx prisma db push     # of migrate, indien schema gewijzigd
npm run db:seed        # indien seed gewijzigd
```

Faalt iets → oorzaak onderzoeken, fixen, checks opnieuw. Pas daarna afvinken. Controleer de
testuitkomst op de `Test Files`/`Tests`-regel — een afgekapte tail verbergt een failure.
