# Persona-sweep — gaten-backlog

> **Datum:** 2026-08-23 (run 88) · **main-commit basis:** `84ac27d3`
> **Uitkomst:** **2 defecten gevonden én gefixt** (1× data-integriteit/validatie-consistentie should-fix in de
> bulk-CSV-import; 1× screen-consistentie should-fix in de Voortgang-stepper `chain-steps.ts`). 3 parallelle
> adversariële Opus-audits op niet-overlappende oppervlakken (authz/IDOR/tenant-isolatie · cascade/geld-integriteit
>
> - next-action-engine · malicieuze input/CSV/XSS/upload). De authz/IDOR-audit (delta sinds de laatste schone
>   checkpoint `c68420e0` t/m `84ac27d3`, 57 bestanden: AVG-erasure-fix #1201, billing-webhook-auth-heartbeat,
>   `/api/metrics` cron-gated, verifier-decorators, systeemstatus-kaarten) vond **0 nieuwe bereikbare gaten**; de
>   malicieuze-input-audit vond **0** buiten de CSV-import (CSV-export-kern, XSS, upload-scan, money/hours-bounds
>   geverifieerd schoon). Live Playwright niet gedraaid (Google-Fonts-host niet in de proxy-allowlist → `next/font`
>   faalt lokaal met ECONNRESET; e2e draait in CI met font-toegang) — audits waren de vind-route.
>
> * **OPGELOST — should-fix: bulk-CSV-import (`/admin/import`) omzeilde de canonieke Zod-veldvalidatie
>   (data-integriteit/validatie-consistentie, CLAUDE.md regel 2/6):** `buildImportPreview`
>   (`src/lib/onboarding/import.ts`) bouwde de rij ad-hoc en liep NIET door `registerSchema`/
>   `freelancerProfileSchema` (de enige-bron-van-waarheid overal elders). Concreet ongevalideerd:
>   `kvkNumber`/`btwNumber` (geen `isValidKvk`/`isValidBtwId`, geen normalisatie — elk ander pad doet dit),
>   `name`/`companyName` (alleen min-lengte, geen bovengrens; canoniek 120/160), `headline`/`location` (geen
>   bovengrens; canoniek 120). Enige admin-only mutatiepad dat de gedeelde keten omzeilde → een tweede, zwakkere
>   waarheidsbron. **Niet XSS** (JSX escapet; CSV-exports via gedeelde `escapeCsvField`-kern), dus geen HIGH — wél
>   een echte should-fix. **Fix:** `parseKvk`/`parseBtw`-helpers (spiegelen `parseWebsite`: ongeldig → waarschuwing
>   - droppen, geldig → genormaliseerd), `capText` voor headline/locatie (te lang → waarschuwing + afkappen op 120),
>     en te lange naam/bedrijfsnaam → fout (niet-importeerbaar, spiegelt de harde canonieke grens). +7 tests. De
>     server-actie her-valideerde de website al defense-in-depth; KvK/BTW komen nu in canonieke vorm de DB in.
> * **OPGELOST — should-fix: Voortgang-stepper (`buildChainSteps`) maskeerde een niet-afgewikkelde vorige-cyclus-
>   factuur (DOEL 1b, screen-consistentie, CLAUDE.md regel 1):** `chain-steps.ts:70` nulde `inv` bij ELKE
>   `performanceNewerThanInvoice`-situatie, dus zodra de ZZP'er verse cyclus-2-uren indiende terwijl de cyclus-1-
>   factuur nog OPEN stond (REJECTED/DRAFT/SUBMITTED/APPROVED/OVERDUE), viel de Factuur-stap door naar de default
>   "Volgt na goedkeuring prestatie" (waiting) en de Betaling-stap naar "waiting" — een kalme, foutloze flow terwijl
>   de status-line op HETZELFDE scherm (via `priorCyclePhase`/`priorCycleFreelancerPhase` in `stage.ts`) de
>   openstaande factuuractie toonde ("corrigeer de afgekeurde factuur" / "keur de factuur"). **Fix:** null `inv`
>   alléén als de vorige-cyclus-factuur is AFGEWIKKELD (`PAID`/`PROCESSED`/`CREDITED`); een nog-open factuur blijft
>   zichtbaar met haar echte status. Viewer-agnostisch (toont objectieve keten-toestand, niet wie aan zet is) → geen
>   drift met de per-viewer status-line, en losgekoppeld van de `stage.ts`-herwerking in open PR #1192. +6 tests.
> * **GEVONDEN — al in-flight (NIET opnieuw opgepakt, voorkomt merge-conflict): CLIENT ziet "niets te doen" terwijl
>   een SUBMITTED vorige-cyclus-factuur op zijn goedkeuring wacht (`stage.ts`).** De cascade-`priorCycle`-rescue
>   draaide alleen voor de ZZP'er (`isFreelancer && performanceNewerThanInvoice`); voor de opdrachtgever-viewer werd
>   `inv` genuld en toonde de status-line "Je hoeft nu niets te doen" terwijl `/acties` de keur-taak wél toonde.
>   **Dit is precies wat open PR #1192 (persona-sweep run 87) al fixt** (`priorCycleFreelancerPhase` →
>   viewer-bewuste `priorCyclePhase(viewer, …)`). Zodra #1192 gemerged is, is deze bevinding gedekt; niet
>   gedupliceerd om conflicten te vermijden.

> **Datum:** 2026-08-22 (run 87) · **main-commit basis:** `1d6ab0f5`
> **Uitkomst:** **3 next-action-/screen-consistentie-defecten gevonden én gefixt** (2× stepper-zelftegenspraak in
> `chain-steps.ts` — should-fix, FREELANCER/CLIENT; 1× verkeerde partij-aan-zet-verwoording franchiser — nit).
> 4 parallelle adversariële Opus-audits op niet-overlappende oppervlakken (authz/IDOR/tenant-isolatie ·
> cascade/geld-integriteit + verboden statusovergangen · next-action-engine · malicieuze input/CSV/XSS/upload) +
> live Playwright-sweep (bundled Chromium) over alle 4 rollen. Authz/IDOR (route-handlers + server-actions
> enumeratief nagelopen: document-endpoints anti-oracle 404, tenant-isolatie centraal, cascade party-checks
> TOCTOU-veilig), malicieuze-input (Zod money/hours-bounds, gedeelde CSV-escape-kern, upload magic-byte-sniff,
> geen `*OrThrow` → 404-vs-500) en geld-integriteit (dual-path invoice-helpers cascade-aware, `computeVat`
> integer-centen) vonden **0 nieuwe bereikbare gaten**. Live: privilege-escalatie (FREELANCER/CLIENT → /admin/\*
> redirect naar dashboard), onzin-id → 404-niet-500 (8/8), login+dashboard+/acties per rol groen. (`/rooster` en
> `/administratie` voor FREELANCER/CLIENT zijn `requireActor`-schermen met per-actor/tenant-gescopete inhoud —
> geen leak, by design.)
>
> - **OPGELOST — should-fix: "Voortgang"-stepper (`buildChainSteps`) sprak de status-line tegen bij een
>   `CREDITED`-factuur (DOEL 1b, screen-consistentie, CLAUDE.md regel 1):** `src/lib/cascade/chain-steps.ts` had
>   geen `CREDITED`-tak; op een nog-ACTIVE samenwerking met een gecrediteerde (teruggedraaide) factuur — bereikbaar
>   via `creditInvoice` op APPROVED/OVERDUE (`lifecycles.ts` staat het toe) — viel de Factuur-stap door naar de
>   default "Volgt na goedkeuring prestatie" (waiting) en de Betaling-stap naar "Volgt na factuurgoedkeuring",
>   terwijl de status-line op HETZELFDE scherm (via `stage.ts`, dat CREDITED wél als afgewikkelde eindtoestand
>   kent) "Factuur gecrediteerd" toonde. **Fix:** CREDITED-tak toegevoegd aan zowel Factuur (done · "Gecrediteerd")
>   als Betaling (done · "Niet verschuldigd (gecrediteerd)"), spiegelt `stage.ts`. +2 regressietests.
> - **OPGELOST — should-fix: "Voortgang"-stepper Betaling-stap negeerde `OVERDUE` (DOEL 1b, screen-consistentie):**
>   in dezelfde `buildChainSteps` testte `invApproved` alleen op `"APPROVED"`, niet op `"OVERDUE"`. Op een ACTIVE
>   samenwerking met APPROVED-prestatie + OVERDUE-factuur toonde de status-line "markeer de betaling" (betalingsfase,
>   actie nodig) maar de Betaling-stap "waiting · Volgt na factuurgoedkeuring" — alsof de factuur nog goedgekeurd
>   moest worden terwijl die al goedgekeurd én te laat is. `stage.ts:142` behandelt `APPROVED || OVERDUE` al als
>   dezelfde betalingsfase. **Fix:** `invApproved = inv === "APPROVED" || inv === "OVERDUE"`, aparte detail-tekst
>   voor OVERDUE ("Wachten op betaling — te laat"). +1 regressietest.
> - **OPGELOST — nit: franchiser-taak `franchiseNotEngageableTask` wees de verkeerde partij aan (DOEL 1b,
>   partij-aan-zet):** de subtitle "Blokkeert plaatsing — vul de ontbrekende verificatie aan" wordt aan de FRANCHISER
>   getoond, maar alleen de ZZP'er kan een bewijsstuk uploaden; de enige franchiser-actie op die pagina is "Stuur
>   herinnering". De zustertaak `franchiseCredentialExpiryTask` verwoordt dit correct ("Vraag de ZZP'er…"). **Fix:**
>   subtitle → "Blokkeert plaatsing — vraag de ZZP'er het bewijsstuk aan te vullen" (`src/lib/actions/tasks.ts`).

> **Datum:** 2026-08-21 (run 86) · **main-commit basis:** `ba636008`
> **Uitkomst:** **2 next-action-/screen-consistentie-defecten gevonden én gefixt (1 BLOCKER FRANCHISER, 1 should-fix
> FREELANCER/CLIENT); 1 inert geld-trap geparkeerd.**
> 4 parallelle adversariële Opus-audits op niet-overlappende oppervlakken (authz/IDOR/tenant-isolatie ·
> cascade/geld-integriteit + verboden statusovergangen · next-action-engine · malicieuze input/CSV/XSS/upload).
> Authz/IDOR (route-handlers + server-actions enumeratief nagelopen: document-endpoints anti-oracle 404,
> tenant-isolatie centraal, cascade party-checks TOCTOU-veilig) én malicieuze-input (Zod money/hours-bounds,
> gedeelde CSV-escape-kern, upload magic-byte-sniff, geen `*OrThrow` → 404-vs-500) vonden **0 nieuwe bereikbare
> gaten**. **Live geverifieerd** (Playwright/bundled Chromium tegen de productie-server): critical-personas
> adversarieel **12/12 groen** (privilege-escalatie, cross-rol datalek, twee-context IDOR, onzin-id→404-niet-500,
> malicieuze lege-titel-opdracht), acties/next-action-suite groen, lifecycle-cascade groen.
>
> - **OPGELOST — BLOCKER: bemiddelaar-next-action voor roster-certificaatverval verdween zodra het cert
>   feitelijk verliep (DOEL 1b, next-action-correctheid, CLAUDE.md regel 1):** `franchiserTasks`
>   (`src/lib/actions/pending-tasks.ts`) haalde alleen de in-venster `(now, soon]` verlopende VERIFIED-certs op
>   (`expiringRosterCreds` → `rosterExpiringByProfile`); zodra `expiresAt <= now` viel het cert uit BEIDE en was
>   er — anders dan de ZZP-zijde (`freelancerTasks`) — GEEN franchiser "reeds verlopen"-tak. `franchiseNotEngageableTask`
>   dekte het niet (engageability kijkt alleen naar verplichte documenten VOG/verzekering), dus een niet-verplicht
>   maar job-vereist certificaattype (bv. BIG) dat verliep werd onzichtbaar op /acties, de badge én de rail —
>   precies wanneer het compliance-probleem ERGER werd. **Fix:** nieuwe pure `rosterExpiredByProfile` (computed-verval
>   `status==="EXPIRED" || (VERIFIED && expiresAt<=now)`, superseded/gedekt-uitgesloten, verplichte typen buiten),
>   builder `franchiseCredentialExpiredTask` (prioriteitsband `franchiserCredentialExpired: 72`, boven "binnenkort"),
>   aparte tenant-gescopete `expiredRosterCreds`-query in `franchiserTasks`, mutueel exclusief met "binnenkort" op
>   `expiresAt<=now`. +9 tests (7 helper + 1 builder + union).
> - **OPGELOST — should-fix: "Voortgang"-stepper (`buildChainSteps`) sprak zichzelf tegen op multi-cyclus
>   samenwerkingen (DOEL 1b, screen-consistentie):** de stepper evalueerde `.some()` over de VOLLEDIGE prestatie-/
>   factuurhistorie, dus op een ACTIVE-samenwerking met cyclus 1 betaald + cyclus 2 verse uren toonde 'ie ten
>   onrechte "Prestatie: Goedgekeurd" + "Factuur/Betaling: Betaald · niets te doen" — terwijl de `collaborationStatusLine`
>   op HETZELFDE scherm (via `stage.ts`/`isPerformanceNewerThanInvoice`) correct de cyclus-2-actie toonde. **Fix:**
>   `buildChainSteps` herschreven om de nieuwste prestatie/factuur (index 0 van de `createdAt desc`-arrays) + de vlag
>   `performanceNewerThanInvoice` te gebruiken (spiegelt `stage.ts`: vorige-cyclus-factuur wordt genuld). `page.tsx`
>   tilt de recency-const boven beide callsites → één bron, geen drift. +multi-cyclus-regressietests (28 groen).
> - **GEPARKEERD (should-fix, inert — feature bewust uitgesteld/mensenwerk): Event F platformfee-`followups`
>   is dode plumbing.** `planPaymentConfirmedEvent` (`src/lib/cascade/handlers.ts:485-496`) pusht bij
>   `PLATFORM_FEE.enabled && trigger==="AFTER_PAYMENT"` een `PLATFORM_FEE_INVOICED`-event op `effects.followups`,
>   maar noch `applyCascadeEffects` (`apply.ts`) noch `persistInTransaction` (`commands-shared.ts`) consumeert
>   `followups` ooit → stil gedropt. Inert vandaag (`PLATFORM_FEE.enabled=false`, bedragen 0), dus geen live geld
>   in het geding, maar een stille-faal-val: zodra iemand de fee-flag aanzet worden platformfees nooit gefactureerd
>   zónder fout/log. Event F's runtime-activering is bewust uitgesteld tot "Fase 7 / na het fee-besluit"
>   (`platform-fee.ts` docstring) — dus fix = OFWEL `followups` echt bedraden (= Event F bouwen, mensenwerk/besluit),
>   OFWEL de dode plumbing weghalen + een boot-guard die `PLATFORM_FEE.enabled` weigert tot Event F echt gewired is.
>   Buiten scope van deze run gehouden (geen live impact); expliciet MENSENWERK vóór de fee-flag ooit aangaat.

> **Datum:** 2026-08-20 (run 85) · **main-commit basis:** `7556aa65`
> **Uitkomst:** **1 geld-integriteit/drift-defect gevonden én gefixt (HIGH, FRANCHISER + ZZP'er/CLIENT).**
> 4 parallelle adversariële Opus-audits op niet-overlappende oppervlakken (authz/IDOR/tenant-isolatie ·
> cascade/geld-integriteit + verboden statusovergangen · next-action-engine · malicieuze input/CSV/XSS/
> upload). Authz/IDOR (39 route-handlers + ~53 server-actions enumeratief nagelopen: document-endpoints
> anti-oracle 404, tenant-isolatie centraal + unit-getest, cascade party-checks TOCTOU-veilig) én
> malicieuze-input (Zod money/hours-bounds, gedeelde CSV-escape-kern, upload magic-byte-sniff +
> UUID-storage-key, geen `findUniqueOrThrow` → 404-vs-500) vonden **0 nieuwe bereikbare gaten**.
>
> - **OPGELOST — franchiser-KPI's + /facturen "Betaald" telden cascade-facturen niet mee (HIGH,
>   geld-integriteit/drift, DOEL 1/DOEL 2, CLAUDE.md regel 1/5):** `src/lib/tenant-stats.ts`
>   (getTenantStats paid/open-aggregaten + getTenantCompanyBreakdown) filterde op de legacy
>   `status: "PAID"` / `status IN (SENT,OVERDUE)`, en `src/components/administratie/facturen-panel.tsx`
>   telde `paidCents` + de twee `paidAt`-afleidingen op `inv.status === "PAID"`. Cascade-facturen (de
>   primaire flow) houden hun live `status` op `'DRAFT'` en bewegen alleen via `lifecycleStatus`
>   (PAID/PROCESSED) → alléén op `status` filteren mist ELKE cascade-factuur. `client-stats.ts`/
>   `freelancer-stats.ts` en de Openstaand-kaart 3 regels lager gebruikten de canonieke dual-path-regel
>   al; tenant-stats + de Betaald-kaart niet → de franchiser zag een near-nul betaalde omzet en de
>   Betaald-kaart/DSO-voorspelling driftte van de rest van de app. **Fix:** `paidRevenueInvoiceWhere` +
>   `outstandingInvoiceWhere` in tenant-stats' 3 queries; `isInvoicePaidRevenue(inv)` in facturen-panel.
>   Puur read-only aggregatie, geen schema-/mutatie-/authz-oppervlak. +regressietest (betaalde-omzet-som
>   over gemengde fixture: cascade-PAID/status=DRAFT telt mee → 1500_00; oude regel → 500_00).
> - **OPGELOST — next-action: VERIFIED-cert voorbij `expiresAt` (nog niet cron-geflipt naar EXPIRED)
>   kreeg geen vernieuw-actie (should-fix, DOEL 1b, next-action-correctheid):** `pending-tasks.ts`
>   (`freelancerTasks`) matchte een niet-verplicht verlopen certificaat alléén op de letterlijke
>   `status === "EXPIRED"`. De flip VERIFIED→EXPIRED gebeurt cron/admin-gedreven (`runExpiryTask`);
>   tussen runs door (of als `CRON_SECRET` nog niet gezet is) heeft een feitelijk verlopen cert nog
>   status VERIFIED en viel het door beide takken heen (niet "verloopt binnenkort" want `expiresAt > now`
>   faalt; niet "expired" want status ≠ EXPIRED) → géén `credential-fix`-taak op /acties/badge/dashboard,
>   terwijl `isExpired`/`computeCompliance`/`collaborationExpiredRequiredCredentials` en de verplicht-
>   document-verlengkandidaat 30 regels lager al de computed-check `status==="VERIFIED" && expiresAt<=now`
>   gebruiken → het vertrouwensniveau zakte zonder herstelactie. **Fix:** de expired-non-mandatory-tak
>   gebruikt nu diezelfde computed-check. +regressietest (VERIFIED + verleden `expiresAt` → fix-taak).
> - **GEPARKEERD (nit, geen defect) — dode prioriteitsband `credentialExpiryBatch: 58` in
>   `src/lib/next-actions.ts:74`:** de constante wordt door geen enkele emitter gebruikt (grep: 0
>   verwijzingen); de expiry-batch is cron/admin-gedreven, niet als admin-next-action ontsloten.
>   Opruimen (of bewust bedraden als admin-vangnet-taak) — buiten scope van deze run gehouden om de
>   PR strak op de twee gedrags-fixes te houden.

> **Routine-increment 2026-08-21 — GEDAAN (geen sweep, UX/data-waarde):** proactieve
> kandidaat-beslissing-reminders (cron) voor de opdrachtgever. Opdrachtgevers kregen al reminders om te
> keuren en te betalen, maar niets voor het vroegste trechterlek: een reeds-bekeken kandidaat
> (VIEWED/SHORTLIST) die te lang op een beslissing wacht en koud wordt. Nieuwe pure planner
> `application-decision-reminders.ts` + runner `application-decision-reminders-task.ts` (patroon van
> `performance-approval-reminders`); vuurt op de bestaande `WAIT_ATTENTION_DAYS`-drempels + offsets
> `REMINDERS.applicationDecisionDays` [0, 7] → geen drift met het `staleApplications`-schermsignaal.
> Notificatie → /kandidaten, idempotent via DomainEvent dedupeKey, audit-label + registratie in
> run-all. Puur/server-side, geen schema-/authz-/geldstroom-oppervlak. +18 tests. Gate groen. PR #1186.
>
> **Routine-increment 2026-08-21 — GEDAAN (geen sweep, UX/data-waarde):** betaalgedrag-signaal op
> de bemiddelaar-opdrachtgeverslijst `/franchise/opdrachtgevers`. De lijst toonde relatiegezondheid
> (activiteit) maar geen betaalgedrag — juist de bemiddelaar moet structureel-trage betalers zien
> (cashflow hele pool + eigen fee-inning). Nu een rustige extra badge naast de gezondheidsbadge
> ("Betaalt op tijd"/"Betaalt vaak laat", alleen bij uitgesproken reputatie) uit de bestaande pure
> `getPaymentBehaviorForCompanies` + `paymentTrustChip`; nieuwe pure `paymentTrustChipBadgeVariant`
> (chip-toon → Badge-variant, één bron). Tenant-gescopete ids, alleen geaggregeerd oordeel (geen
> factuurdata). Read-only, geen schema-/mutatie-/authz-oppervlak. +2 tests. Gate groen. PR #1180.

> **Routine-increment 2026-08-20 — GEDAAN (geen sweep, UX/data-waarde):** dubbelboek-signaal op
> de opdracht-detail voor de ZZP'er. Het bestaande agenda-signaal dekte alleen zelf-gezette
> onbeschikbaar/beperkt-vensters; een al **lopende (ACTIVE) samenwerking** die hetzelfde tijdvak
> beslaat werd niet gesignaleerd. Nieuwe pure `src/lib/job-collaboration-conflict.ts`
> (`assessJobCollaborationConflict`, deterministisch, open-einde-veilig) + rustige danger-kaart
> `job-collaboration-conflict-card.tsx`, gewired in `opdrachten/[id]/page.tsx` (owner- + venster-
> gescoopte query, huidige opdracht uitgesloten, alleen niet-eigenaar ZZP'er zonder actieve reactie).
> Advies-only, geen mutatie-/authz-oppervlak. +10 tests. Gate groen (typecheck/lint/test 6445/build/
> prettier). PR #1171.

> **Routine-increment 2026-08-20 — GEDAAN (geen sweep, UX/data-waarde):** flexpool-
> beschikbaarheidsstrip voor de opdrachtgever. De flexpool (`/favorieten` + de flexpool-tab)
> toonde per ZZP'er wél een beschikbaarheidsbadge maar geen aggregaat — bij een poule naar
> `take: 100` moest de opdrachtgever rij-voor-rij scannen om te zien wie er nú beschikbaar is.
> Nieuwe pure `src/lib/favorites-summary.ts` (`summarizeFlexpool`, totaal-behoudend) + rustige
> strip bovenaan `FlexpoolPanel` die leidt met "Beschikbaar nu: N", afgeleid uit exact dezelfde
> rijen als de lijst (geen drift). Display-only, geen schema-/mutatie-/authz-oppervlak. +6 tests.
> Gate groen (typecheck/lint/test 6425/build/prettier). PR #1170.

> **Datum:** 2026-08-20 (run 84) · **main-commit basis:** `9ab0fa25`
> **Uitkomst:** **1 geld-integriteit/drift-defect gevonden én gefixt** (MED — de omzettrend-grafieken
> (`revenue-trend.ts`, alle 4 rollen) telden een **afgewezen (REJECTED) cascade-factuur als fantoom-omzet**
> terwijl de maanddoel-widget diezelfde factuur al uitsloot → twee omzetdefinities voor dezelfde periode).
> Deze run kon voor het eerst **lokaal builden** (env-proxy-workaround: `NODE_USE_ENV_PROXY=1` +
> `NODE_EXTRA_CA_CERTS` laat undici's fetch de agent-proxy honoreren → `next/font/google` lukt;
> "✓ Compiled successfully"). 4 parallelle adversariële Opus-code-audits op niet-overlappende oppervlakken
> (authz/IDOR/tenant-isolatie · cascade/geld-integriteit + verboden statusovergangen · next-action-engine/
> badge-pariteit · malicieuze input/CSV/XSS/upload). Authz/IDOR, cascade/geld én malicieuze-input vonden
> **0 nieuwe bereikbare gaten**; de next-action-audit her-rapporteerde de bekende badge/`/acties`-cap-klasse
> die run 83 al als GEEN-DEFECT verifieerde (zie hieronder).
>
> - **OPGELOST — omzettrend telde een REJECTED cascade-factuur als fantoom-omzet (MED, geld-integriteit,
>   DOEL 1/DOEL 2, CLAUDE.md regel 1/5):** `src/lib/revenue-trend.ts` (alle 4 fetchers: freelancer/client/
>   tenant/platform) gebruikte `revenueCountedInvoiceWhere` (sluit alléén CREDITED uit), terwijl de
>   maanddoel-widget (`src/lib/data/monthly-income.ts`) `realizedRevenueInvoiceWhere` gebruikt (sluit óók
>   DRAFT/REJECTED uit). Een cascade-factuur zet `issuedAt` bij SUBMITTED; wordt hij daarna afgewezen
>   (SUBMITTED→REJECTED), dan blijft `issuedAt` staan → de trend-grafiek telde 'm nog als omzet, terwijl
>   de maanddoel-widget diezelfde afgewezen factuur al uitsloot. Twee omzetdefinities, zelfde periode,
>   verschillende getallen (de lopende-maand-waarde in de trend ≠ het maanddoel-bedrag). **Fix:** alle 4
>   fetchers gebruiken nu `realizedRevenueInvoiceWhere` → de trend spiegelt exact de canonieke
>   realized-regel van de maanddoel-widget; de nu-verweesde `revenue-recognition.ts` (enige consument was
>   revenue-trend) + zijn test verwijderd (geen slop). +regressietest (REJECTED-fixture: RED onder de oude
>   where → 80000, GROEN nu → 30000).
>
> **GEEN-DEFECT (run 84, met verificatie — her-bevestigt run 83):**
>
> - **GEEN DEFECT — "badge (unbounded `.count()`) ≠ `/acties` (`take: MAX=50`) voor ADMIN/CLIENT/FRANCHISER":**
>   de next-action-audit rapporteerde dat de nav-badges rauwe `.count()` gebruiken terwijl de `/acties`-
>   emitters op `MAX=50` cappen (pending-tasks.ts:134-135, expliciet "+N meer buiten beschouwing"), dus bij
>   > 50 open rijen toont de badge het echte aantal en `/acties` maar 50. **Verificatie:** dit is exact de
>   > klasse die run 83 al als GEEN-DEFECT verifieerde. De badge moet de **echte, afhandelbare backlog**
>   > weerspiegelen — de bestemming van elke badge toont de volledige (ongewindowde) wachtrij: ADMIN-
>   > verificaties (`/admin/verificaties`, `findMany` zonder `take`), CLIENT-prestaties (elke
>   > `performanceApproveTask` linkt naar de samenwerkings-detailpagina `/samenwerkingen/[id]`, per-collab
>   > onbegrensd), enz. `/acties` is een **bewust begrensde top-50-aggregator** ("+N meer"), geen bron van
>   > waarheid. De aanbevolen fix (badge cappen op `Math.min(count, 50)`) zou de badge juist laten ónder-tellen
>   > t.o.v. de echte backlog + de bestemmingspagina — dezelfde wrong-direction-regressie die run 83 al
>   > afwees. **Geen actie.**

> **Datum:** 2026-08-19 (run 83) · **main-commit basis:** `55aa62e3`
> **Uitkomst:** **1 geld-integriteit/drift-defect gevonden én gefixt** (MED — /openstaand-pagina + CSV
> dupliceerden de openstaand-statusregel inline i.p.v. de canonieke `isInvoiceOutstanding`). 4 parallelle
> adversariële Opus-code-audits op niet-overlappende oppervlakken (authz/IDOR/tenant-isolatie ·
> cascade/geld-integriteit + verboden statusovergangen · next-action-engine/badge-pariteit ·
> malicieuze input/CSV/XSS/upload). Authz/IDOR én malicieuze-input vonden **0 bereikbare gaten**; de
> cascade/geld-audit leverde de gefixte /openstaand-dedup. (Live Playwright-probe is aan CI overgelaten
> — het egressbeleid van deze sessie weigert `next/font/google`-fetches → lokale build/probe faalt; geen
> codedefect.)
>
> - **OPGELOST — /openstaand consumeert de canonieke openstaand-regel (MED, geld-integriteit, DOEL 2):**
>   `src/app/api/administratie/openstaand/route.ts:61` en `src/components/administratie/openstaand-panel.tsx:76`
>   rolden de openstaand-regel (cascade `SUBMITTED/APPROVED/OVERDUE`, legacy `SENT/OVERDUE`) inline als
>   literal-arrays uit, terwijl `src/lib/administration/outstanding.ts` (`isInvoiceOutstanding`) al de
>   canonieke bron is die 9 andere consumenten delen. Twee definities van hetzelfde getal → drift-val
>   op de pagina die letterlijk "openstaand" heet zodra `OUTSTANDING_LIFECYCLE` wijzigt. **Fix:** beide
>   `.filter(isInvoiceOutstanding)` + import; +regressietest `openstaand-consistency.test.ts` (bron-niveau,
>   RED vóór de fix). Geen gedragswijziging vandaag (literals matchten de canonieke set).
>
> **GEPARKEERD / GEEN-DEFECT (run 83, met verificatie):**
>
> - **GEEN DEFECT — "ADMIN nav-badge overcount vs /acties (>50)":** de next-action-audit meldde dat de
>   ADMIN-badges (`signals.ts:1035-1052`: pendingVerifications/openDisputes/openSupportTickets/
>   pendingNoShowVerdicts/openAdminHandoffs) rauwe `.count()` gebruiken terwijl `adminTasks()` op 50 capt.
>   **Verificatie:** de badge-bestemming `/admin/verificaties/page.tsx:51` doet `findMany({ where: { status:
"SUBMITTED" } })` **zónder `take`** → toont de volledige wachtrij; alle rijen zijn daar bereikbaar en
>   afhandelbaar. De badge klopt dus met zijn eigen bestemming; alleen de secundaire `/acties`-aggregator
>   capt op 50 (bewust, "+N meer buiten beschouwing"). De audit-claim "5 nieuwste zijn nergens
>   afhandelbaar" is onjuist. De aanbevolen fix (badge cappen op 50) zou de badge juist laten ónder-tellen
>   t.o.v. de echte backlog + de queue-pagina — een wrong-direction-regressie. **Geen actie.**
> - **OPGELOST (2026-08-20, PR #1165) — CLIENT cascade-badge mist expliciete `collaboration.status:
"ACTIVE"`-filter:** `signals.ts` (`cascadePerf`/`cascadeInv`) scopte alleen op `company.userId` +
>   `disputedAt: null`, terwijl de /acties-emitters (`pending-tasks.ts` `approvePerformances`/
>   `approveInvoices`) óók `status: "ACTIVE"` vereisen (en de factuurtelling miste de expliciete
>   `company: { userId }`-scope). Nu onbereikbaar (een SUBMITTED-prestatie/-factuur kan niet coëxisteren
>   met een niet-ACTIVE samenwerking — de cancel/complete-guards blokkeren dat), maar defense-in-depth:
>   een toekomstige guard-wijziging zou het gat stil kunnen heropenen. **Fix:** `status: "ACTIVE"` (+
>   `company: { userId }` op de factuurtelling) toegevoegd aan beide badge-query's zodat ze exact de
>   WHERE van hun /acties-emitter spiegelen; +regressietest `signals.cascade-active-parity.test.ts`.
>
> ---
>
> **Vorige run:**
>
> **Datum:** 2026-08-18 (run 82) · **main-commit basis:** `1a3e68e1`
> **Uitkomst:** **1 bereikbaar HIGH DOEL 1b-defect gevonden én gefixt** (FREELANCER cascadebadge outer-
> window-blindheid + 2 sub-vectoren) + **1 HIGH geld/administratie-defect gevonden en GEPARKEERD** (aparte
> PR — domeinmotor). 4 parallelle adversariële Opus-code-audits op niet-overlappende oppervlakken
> (authz/IDOR/tenant-isolatie · cascade/geld-integriteit + verboden statusovergangen · next-action-engine-
> correctheid · malicieuze input/CSV/XSS/upload). De authz/IDOR- én malicieuze-input-audits vonden **0
> bereikbare gaten**; de next-action-audit leverde de gefixte badge-defecten, de cascade/geld-audit het
> geparkeerde HIGH-item. (De live Playwright-probe is aan CI overgelaten — het remote-egressbeleid van deze
> sessie weigert `next/font/google`-fetches; geen codedefect.)
>
> - **OPGELOST — FREELANCER `/samenwerkingen`-cascadebadge outer-window-blindheid (HIGH + 2 MED, DOEL 1b):**
>   de badge (`cascadeWork`, signals.ts) las de cascade-taken uit één gecombineerde `collaboration.findMany(
{ orderBy: { updatedAt: "desc" }, take: 50 })`, terwijl /acties (`freelancerTasks`, pending-tasks.ts) al
>   was losgekoppeld naar aparte, status-gefilterde, `createdAt asc`-queries. `Collaboration.updatedAt` bumpt
>   niet bij een prestatie indienen of factuur (goed)keuren → voor een ACTIVE-samenwerking bevroren op het
>   teken-moment; bij >50 gelijktijdige PROPOSED+ACTIVE viel een ouder-getekende met openstaand werk buiten
>   het venster en verdween de actie PERMANENT uit de badge (niet self-healing), terwijl /acties + de rail 'm
>   toonden. Sub-vectoren: `invoices: { take: 5 }` zónder orderBy (ondertelling + flicker) en prestatie-fase
>   uit alléén de laatste prestatie (miste een oudere REJECTED). **Fix:** gedeelde
>   `src/lib/data/freelancer-cascade-work.ts` (5 WHERE-builders gedeeld met /acties + `getFreelancerCascade-
WorkCount` die de 4 emitters exact spiegelt); collab-vereist-cert-gaten uit de ongewindowde
>   `credentialCollabWhere`-query. Dode pure `countFreelancerCascadeWork` verwijderd. +12 tests.
>
> **GEPARKEERD (run 82, HIGH — aparte PR, administratie-domeinmotor "niet aankomen behalve voor tests"):**
>
> - **HIGH (geld/administratie-integriteit — CLAUDE.md regel 1/5):** een SUBMITTED- of REJECTED-cascade-
>   factuur boekt bij eerste indiening omzet (`OMZET`) + af-te-dragen-BTW (`BTW_AF_TE_DRAGEN`) + debiteur
>   (`DEBITEUREN`) in het grootboek (`ledger.ts planInvoiceSubmitted`, via `handlers.ts planInvoiceSubmitted-
Event`), maar er is **geen enkele terugboek-transitie voor welke rol dan ook**. De lifecycle-machine
>   (`lifecycles.ts`) maakt `CREDITED` alléén bereikbaar vanuit APPROVED/OVERDUE/PAID/PROCESSED; vanuit
>   SUBMITTED zijn de enige uitgangen APPROVED/REJECTED, vanuit REJECTED alleen SUBMITTED. `creditInvoice`
>   gooit dus voor een SUBMITTED/REJECTED-factuur (óók voor admin), en legacy `cancelInvoice` weigert cascade-
>   facturen. `planInvoiceRejectedEvent` boekt bewust niet terug. **Repro:** prestatie goedgekeurd → concept-
>   factuur; ZZP'er dient factuur in (SUBMITTED → omzet+BTW+debiteur geboekt); opdrachtgever wijst af (of
>   keurt nooit goed). Er is nu geen pad dat de bedragen terugboekt → de BTW-aangifte (`overview.ts vatReturn`)
>   over-declareert af-te-dragen-BTW, de debiteurenbalans toont een fantoom-post, en de status-gebaseerde
>   rapporten (`outstanding.ts`/`realized-revenue.ts` sluiten REJECTED uit) spreken de grootboek-gebaseerde
>   tegen. **Secundair (LOW/MED):** `revenueCountedInvoiceWhere` (revenue-trend) telt een REJECTED-factuur
>   nog als omzet (sluit alleen CREDITED uit) terwijl `realizedRevenueInvoiceWhere` (maandinkomen-widget)
>   REJECTED wél uitsluit → twee omzetdefinities, zelfde periode, verschillende getallen. **Aanbevolen fix
>   (eigen PR + zorgvuldige review):** sta `SUBMITTED→CREDITED`/`REJECTED→CREDITED` toe met terugboekende
>   postings (`reversePayment: false`), óf laat `planInvoiceRejectedEvent` de reversal boeken. **Waarom
>   geparkeerd:** raakt de administratie-domeinmotor (audit-backlog: "niet aankomen behalve voor tests") én
>   bevat een BTW-/product-keuze (auto-crediteren bij afwijzing?) die een gefocuste, apart-gereviewde PR
>   verdient — geen autonome self-merge.
>
> ---
>
> **Vorige run:**
>
> **Datum:** 2026-08-18 (run 81) · **main-commit basis:** `94088b32`
> **Uitkomst:** **1 bereikbaar DOEL 1b-defect gevonden én gefixt** (next-action-engine outer-window-
> blindheid, MED). 4 parallelle adversariële Opus-code-audits op niet-overlappende oppervlakken
> (authz/IDOR/tenant-isolatie, cascade/geld-integriteit + verboden statusovergangen, next-action-engine-
> correctheid, malicieuze input/CSV/XSS). Drie audits (authz/IDOR/tenant, cascade/geld, malicieuze input)
> vonden **0 bereikbare gaten**; de next-action-audit leverde de fix hieronder + één lager-vertrouwen
> geparkeerd item. De live build/probe kon lokaal niet draaien (het remote-egressbeleid van deze sessie
> weigert `next/font/google`-fetches via undici → OOM/ECONNRESET; omzeild voor de build met een undici-
> ProxyAgent-preload, maar de e2e-probe is aan CI overgelaten — geen codedefect).
>
> - **OPGELOST — outer-window-blindheid op de teken-/indien-taak (DOEL 1b, MED):** de "Contract
>   ondertekenen"-taak (`contractSignTask`, PROPOSED — ZZP'er én opdrachtgever) en de "Uren indienen"-taak
>   (`performanceSubmitTask`, ACTIVE zonder ingediende prestatie) werden afgeleid uit dezelfde gecapte
>   `collaboration.findMany({ orderBy: { updatedAt: "desc" }, take: MAX })` die run 77-79 al voor de geld-/
>   keur-/certificaat-emitters had losgekoppeld — maar déze twee bleven achter. `Collaboration.updatedAt`
>   wordt alleen bij een directe mutatie op de rij gebumpt (tekenen/dispuut/annuleren/auto-afronding);
>   voorstellen-én-wachten of een prestatie indienen raakt de rij niet. Bij >MAX gelijktijdige PROPOSED+
>   ACTIVE-samenwerkingen viel een ouder-voorgestelde (teken-taak) of ouder-getekende ACTIVE-samenwerking-
>   zonder-prestatie (indien-taak) buiten het venster en verdween de taak PERMANENT uit /acties, de badge én
>   de dashboard-rail (de actie zelf bumpt `updatedAt` niet → niet self-healing), terwijl het
>   samenwerkingsdetail de partij nog wél als "aan zet" toonde en het geld muurvast zat (alleen een
>   APPROVED-prestatie wordt ooit een factuur). **Fix:** beide taken uit dedicated, status-gefilterde,
>   ONGEWINDOWDE queries (`status: "PROPOSED"` resp. `status: "ACTIVE"` + `OR: [{performances:{none:{}}},
{performances:{some:{status:"DRAFT"}}}]`, `orderBy: createdAt asc` → oudste blijft staan, self-healing),
>   gespiegeld aan `rejectedPerfs`/`openInvoices`/`credentialCollabs` (run 76-79). Bestanden:
>   `src/lib/actions/pending-tasks.ts` (freelancer + client). +6 regressietests
>   (`pending-tasks-sign-submit-outer-window.test.ts`: teken-taak ZZP'er/opdrachtgever + indien-taak buiten
>   het venster; mock in `pending-tasks-contract-sign-compliance.test.ts` bijgewerkt naar de nieuwe
>   query-vormen).
>
> **OPGELOST (run 82, 2026-08-18) — `franchiseNotEngageableTask` roster-cap op `id: asc` (bemiddelaar,
> DOEL 1b):** de roster-inzetbaarheidsscan haalde de roster-leden op met
> `prisma.freelancerProfile.findMany({ where:{tenantId}, orderBy:{id:"asc"}, take: MAX })` en berekende
> inzetbaarheid pas ná de cap. Anders dan de FIFO-admin-queues (die legen naarmate oudere items worden
> afgehandeld) groeit een tenant-roster alleen maar — een niet-inzetbaar lid (ontbrekend/verlopen
> verplicht document) voorbij de 50ste (op `id`-volgorde) werd door `computeEngageability` NOOIT
> beoordeeld, dus leverde het permanent geen taak op /acties, de badge én de rail (de blokkerende actie
> bumpt geen venster → niet self-healing). **Fix:** beide oppervlakken (pending-tasks.ts + signals.ts)
> scannen nu ONGEWINDOWD (geen `take`) de volledige tenant-roster via een gedeelde bron
> (`src/lib/data/roster-engageability.ts`: `ROSTER_ENGAGEABILITY_SELECT` + `evaluateRosterEngageability`)
> — dat sluit zowel de 50-cap-blindheid als de fragiele "houd orderBy/take identiek"-drift-invariant af
> (per tenant een beheerbaar aantal profielen, spiegelt de ongelimiteerde `company.findMany({tenantId})`).
> +outer-window-regressietest (55 inzetbaar + 1 niet-inzetbaar als 56e; take-aware roster-mock) +
> helper-unittests + badge/acties-query-shape-asserts omgezet naar "geen take". Bestanden:
> `src/lib/data/roster-engageability.ts` (+test), `src/lib/signals.ts`, `src/lib/actions/pending-tasks.ts`,
> `src/lib/signals.roster-order.test.ts`, `src/lib/actions/pending-tasks-franchiser.test.ts`.
>
> ---
>
> **Vorige run:**
>
> **Datum:** 2026-08-17 (run 80) · **main-commit basis:** `060537a7`
> **Uitkomst:** **3 bereikbare defecten gevonden én gefixt** (1× server-side-waarheid/geld-KPI-correctheid
> HOOG, 2× next-action-engine flicker DOEL 1b MED). 4 parallelle adversariële Opus-code-audits op
> niet-overlappende oppervlakken (authz/IDOR/tenant-isolatie · cascade/geld-integriteit + verboden
> statusovergangen · next-action-engine-correctheid · malicieuze input/CSV/XSS/upload) + een live
> Playwright-probe (28 checks, 4 rollen: privilege-escalatie ZZP'er/opdrachtgever/bemiddelaar → `/admin/*`
> en `/franchise/*` alle geweigerd/redirect, IDOR/onzin-id → 404, nooit 500). De authz/IDOR-,
> malicieuze-input-audits én alle live probes vonden **0 bereikbare gaten**; de cascade/geld-audit vond de
> HOOG-bevinding, de next-action-audit de 2 flicker-fixes. Alle drie gefixt met rood→groen-regressietests.
>
> - **OPGELOST — geld-KPI's negeerden legacy loose-facturen door scoping op een NULL-kolom (HOOG,
>   server-side-waarheid — CLAUDE.md regel 1):** álle omzet-KPI-queries scoopten op `Invoice.issuerUserId`/
>   `counterpartyUserId` — kolommen die alléén de cascade-handler zet en die NULL blijven voor legacy
>   loose-facturen (`createInvoice` zet ze nooit). Gecombineerd met de dual-path where-helpers
>   (`paidRevenueInvoiceWhere`/`outstandingInvoiceWhere`/`revenueCountedInvoiceWhere`) was hun legacy-tak
>   dóde code: de outer `issuerUserId = userId`-AND matchte nooit een NULL-rij, dus élke legacy betaalde/
>   openstaande/verstuurde factuur viel uit de KPI's van ZZP'er én opdrachtgever (ondergroef #1124). **Fix:**
>   scope via de altijd-gevulde relatie `collaboration.freelancer.userId` / `collaboration.company.userId`
>   (patroon van `data/monthly-income.ts`), where-helpers behouden. 8 call-sites over `freelancer-stats.ts`,
>   `client-stats.ts`, `freelancer-revenue-breakdown.ts`, `client-spend-breakdown.ts`, `revenue-trend.ts`
>   (tenant/platform-trend bewust ongemoeid). +rood→groen-tests (legacy loose-fixtures + kruis-gebruiker-
>   isolatie). Repro: ZZP'er maakt een losse factuur op een samenwerking zonder prestaties → opdrachtgever
>   betaalt → bedrag verscheen nooit in "betaalde omzet"/"uitgaven voldaan" of de omzet-trend.
> - **OPGELOST — 2× next-action flicker (DOEL 1b, MED):** twee gewindowde queries in `pending-tasks.ts`
>   hadden `take: MAX` zonder `orderBy` → niet-deterministisch venster, taak flikkert tussen page-loads bij
>   > MAX rijen. `unreadConversations` (`conversationParticipant.findMany` vóór `.slice(0, MAX)`) →
>   > `orderBy: { conversationId: "asc" }`; client `cascadeOverduePayments` (`invoice.findMany`,
>   > lifecycleStatus OVERDUE) → `orderBy: { createdAt: "asc" }`. +2 regressietests op de query-args.
> - **Bevestigd schoon deze run:** authz/rol/ownership-keten & tenant-isolatie (franchiser), documenten
>   privé (404-anti-oracle), Zod-grenzen op geld/uren (int4-overflow), required-reason (trim vóór check),
>   XSS/CSV-injectie/upload-MIME, verboden statusovergangen (assert vóór write op elke cascade-pad).

---

> **Datum:** 2026-08-16 (run 79) · **main-commit basis:** `5cf777d2`
> **Uitkomst:** **4 bereikbare defecten gevonden én gefixt** (1× server-side-waarheid/integriteit HOOG,
> 1× functionele KPI-correctheid MED, 2× next-action-engine DOEL 1b MED/LAAG). 4 parallelle adversariële
> Opus-code-audits op niet-overlappende oppervlakken (authz/IDOR/tenant-isolatie, cascade/geld-integriteit
>
> - verboden statusovergangen, next-action-engine-correctheid, malicieuze input/CSV/XSS) + een live
>   Playwright-probe (17 checks: privilege-escalatie ZZP'er/opdrachtgever/bemiddelaar → `/admin/*` en
>   `/franchise/*`, IDOR/onzin-id → 404/redirect, nooit 500). De authz/IDOR- en malicieuze-input-audits én
>   alle 17 runtime-probes vonden **0 bereikbare gaten**; de cascade- en next-action-audits leverden elk twee
>   fixes. Alle vier gefixt met rood→groen-regressietests op niet-overlappende bestanden (2 subagents).
>
> * **OPGELOST — server-side-waarheid geschonden: legacy factuur-acties konden een cascade-factuur muteren
>   (HOOG, integriteit — CLAUDE.md regel 1/2/5):** `sendInvoice`/`markInvoicePaid`/`cancelInvoice`
>   (`src/app/(protected)/facturen/actions.ts`) checkten NIET of de factuur een cascade-factuur is
>   (`lifecycleStatus != null`) vóór het toepassen van een legacy `assertInvoiceTransition` + schrijven van
>   de legacy `status`. Een cascade-factuur houdt haar legacy `status` bewust op `DRAFT` de hele lifecycle
>   door (SUBMITTED/APPROVED); `INVOICE_TRANSITIONS.DRAFT` staat DRAFT→CANCELLED/SENT toe, dus
>   `cancelInvoice(cascadeInvoiceId)` — door de eigenende ZZP'er direct aangeroepen — slaagde en schreef
>   `status:"CANCELLED"` + een **valse `INVOICE_CANCELLED`-auditregel** voor een factuur die de echte
>   cascade-state-machine nooit annuleerde, waarna `revenue-trend.ts`'s `status:{not:"CANCELLED"}`-filters de
>   lopende factuur uit élk omzet-dashboard lieten vallen. De precondition werd alléén client-side afgedwongen
>   (`cascade`-gate in `facturen/[id]/page.tsx`). **Fix:** `if (invoice.lifecycleStatus != null) throw new
Error(CASCADE_FLOW_MESSAGE)` na de ownership-/dispuut-check in alle drie de acties (spiegelt de bestaande
>   `createInvoice`-guard). +6 tests (cascade-factuur → geweigerd, geen updateMany/audit; legacy-factuur →
>   loopt door).
> * **OPGELOST — "Openstaand"-KPI ondertelde openstaande cascade-facturen (MED, functionele correctheid):**
>   `getFreelancerStats` (`src/lib/freelancer-stats.ts`) telde openstaand op `status IN (SENT,OVERDUE)` —
>   puur de legacy-kolom. Cascade-facturen (de primaire flow) houden legacy `status` op DRAFT terwijl ze
>   SUBMITTED/APPROVED zijn, dus echte openstaande omzet was onzichtbaar tot de betaaltermijn (~30 dgn)
>   verstreek en de te-laat-cron de rij op OVERDUE zette → de ZZP'er zag op `/inzicht` tot 30 dagen te weinig
>   openstaand per factuur. **Fix:** hergebruik de bestaande canonieke `outstandingInvoiceWhere`
>   (`src/lib/administration/outstanding.ts`, OR over lifecycle SUBMITTED/APPROVED/OVERDUE + legacy
>   SENT/OVERDUE) die `client-stats.ts` al gebruikt — geen derde divergente kopie. +tests (cascade
>   SUBMITTED/APPROVED/OVERDUE meegeteld ondanks legacy DRAFT; PAID/CANCELLED/DRAFT niet).
> * **OPGELOST — outer-window-blindheid op de certificaat-taken van de ZZP'er (DOEL 1b, MED):** de drie
>   samenwerking-gebonden certificaat-taken (`credentialCollabExpiry`/`Expired`/`Missing`,
>   `src/lib/actions/pending-tasks.ts`) werden afgeleid uit de `collabs`-relatie (`orderBy: updatedAt desc,
take: MAX`). Run 78 dichtte ditzelfde `updatedAt`-venstergat voor de geld-taken (openInvoices/rejectedPerfs)
>   maar niet voor deze drie certificaat-emitters. Een verlopend/afgekeurd/ontbrekend vereist certificaat bumpt
>   `Collaboration.updatedAt` niet, dus bij >MAX gelijktijdige samenwerkingen viel een ouder-getekende
>   samenwerking met een compliance-gat buiten `take: MAX` en verdween de aanlever-/vernieuw-taak PERMANENT uit
>   /acties, de badge én de dashboard-rail (niet self-healing), terwijl de opdrachtgever de spiegel-alert wél
>   zag. **Fix:** dedicated, `credentialRequirements: { some: { required: true } }`-gefilterde, `createdAt
asc`-geordende query (alleen certificaat-dragende samenwerkingen vullen het venster, oudste blijft staan →
>   self-healing); spiegelt het run-78 `openInvoices`-patroon. +2 regressietests.
> * **OPGELOST — non-deterministisch venster in de opdrachtgever-compliance-query (DOEL 1b, LAAG):**
>   `clientCredentialAlerts` (`src/lib/collaboration-alerts.ts`) window-de 200 samenwerkingen **zonder
>   `orderBy`** — de enige `take: N`-query in deze familie zonder ordening. Bij >200 gelijktijdige
>   ACTIVE-samenwerkingen was wélke 200-van-N rijen Prisma teruggaf niet gegarandeerd → de hoogste
>   opdrachtgever-next-action (`clientComplianceTask`, P.complianceRipple=85) kon tussen page-loads flapperen.
>   **Fix:** `orderBy: { createdAt: "asc" }` (deterministisch, oudste blijft staan → self-healing) +
>   `job: { credentialRequirements: { some: { required: true } } }`-filter (alleen samenwerkingen die een
>   alert kúnnen opleveren vullen het venster). +regressietest op de query-argumenten.
>
> **Geparkeerd (met repro, niet gefixt deze run):**
>
> - ~~**`revenue-trend.ts` leunt op de legacy `status`-kolom (MED, functionele correctheid — zelfde wortel als
>   de KPI-fix):**~~ **OPGELOST (2026-08-16, PR #1119):** de omzet-trend-queries filterden op
>   `status: { not: "CANCELLED" }` (legacy-kolom); een gecrediteerde/teruggedraaide cascade-factuur
>   (lifecycleStatus `CREDITED`, legacy `status` blijft `DRAFT`) glipte door de filter en werd op alle vier
>   de omzet-dashboards (freelancer/client/tenant/platform) tóch als omzet meegeteld. **Fix:** gedeelde
>   reporting-helper `src/lib/administration/revenue-recognition.ts` (`isInvoiceRevenueCounted` +
>   `revenueCountedInvoiceWhere`, gespiegeld op `outstandingInvoiceWhere`/`isInvoiceSettled`): cascade telt
>   mee tenzij `CREDITED`, legacy tenzij `CANCELLED`; alle vier de fetchers in `revenue-trend.ts` gebruiken
>   nu `...revenueCountedInvoiceWhere`. +9 tests.
>   _Resterend (apart, niet in deze fix):_ ~~`freelancer-stats.ts`/`client-stats.ts` tellen "betaalde omzet"
>   op `status: "PAID"` (legacy-only, mist cascade-PAID)~~ — **OPGELOST (2026-08-17, PR #1124):** canonieke
>   `src/lib/administration/paid-revenue.ts` (`isInvoicePaidRevenue`/`paidRevenueInvoiceWhere`, cascade
>   PAID/PROCESSED + legacy PAID; CREDITED/CANCELLED tellen niet mee) gewired in `earnedCents` + `spentCents`.
> - ~~**Authz-audit-residu (LAAG, dekking):** de authz/IDOR/tenant-audit was representatief, niet 100%
>   bestandsdekkend; de action-bestanden `abonnement`, `academie`, `beschikbaarheid`, `ideeen`, `ontzorgd/*`,
>   `prognose`, `rooster`, `uitgaven`, `search` zijn niet individueel geopend.~~ **NAGELOPEN (2026-08-17,
>   PR #1131):** alle negen bestanden + hun helpers individueel adversarieel geaudit (2 parallelle Opus
>   security-subagents op niet-overlappende sets). 8/9 schoon (volledige auth→rol→ownership→Zod→audit-keten,
>   TOCTOU-veilige compound-guards, anti-oracle-scoping). **1 reachable robuustheidsdefect gevonden + gefixt:**
>   `ideeen/actions.ts` (`createIdea`/`toggleVote`/`addComment`) miste — als enige open UGC-oppervlak — de
>   volume-rem die élke andere UGC-mutatie wél heeft → scripted notificatie-/DB-/audit-flood + harassment.
>   Gefixt met een gedeelde `ideaEngagementRateLimiter` (+6 tests). _Forward-looking (geen huidige exploit,
>   genoteerd): `ontzorgd/aangifte startFiling` roept `partner.prepareConcept` aan vóór de dedup-check; onder
>   de huidige `NoopTaxFilingPartner` kosteloos, maar wire een rate-limiter zodra `TAX_PARTNER_DRIVER=live`._
>
> ---
>
> **Vorige run:**
>
> **Datum:** 2026-08-15 (run 78) · **main-commit basis:** `f90828b0`
> **Uitkomst:** **2 bereikbare defecten gevonden én gefixt** (1× cascade/geld-integriteit HOOG-MED,
> 1× next-action-engine MED; geen geparkeerde correctheids-/beveiligingsitems deze run). 4 parallelle
> adversariële Opus-code-audits op niet-overlappende oppervlakken (authz/IDOR/tenant-isolatie,
> cascade/geld-integriteit + verboden statusovergangen, next-action-engine-correctheid, malicieuze
> input/CSV/XSS). Twee audits (authz/IDOR/tenant, malicieuze input) vonden **0 bereikbare gaten**; de
> cascade- en next-action-audits leverden elk één fix.
>
> - **OPGELOST — TOCTOU-race in het handmatige afronden/annuleren van een samenwerking (HOOG-MED,
>   geld-integriteit):** `applyCollaborationStatusChange` (`src/app/(protected)/samenwerkingen/actions.ts`)
>   her-leest binnen de `$transaction` de facturen + `performance.count({SUBMITTED})` en berekent de
>   blok-reden, maar schrijft de status daarna weg met een APARTE `updateMany({ where: { id, status: from } })`
>   waarvan de `where` enkel id + status bewaakt — niet de geld-/prestatievoorwaarden. De transactie zette
>   **geen `isolationLevel`** (Postgres-default READ COMMITTED), dus een gelijktijdige `submitPerformance`
>   (die `Collaboration.status` nooit aanraakt) kon in het gat tussen de her-lees en de write een
>   SUBMITTED-prestatie committen → de samenwerking rondde af/annuleerde mét een onbeoordeelde prestatie
>   (of een vers ingediende openstaande factuur) die daarna nooit meer goedgekeurd/gefactureerd/betaald kon
>   worden (geld muurvast). **Geschonden regel:** "afronden met open geld/onbeoordeelde prestatie moet
>   onmogelijk zijn" + atomaire compound-guard. **Fix:** nieuwe pure `collaborationTerminableGuard()` in
>   `src/lib/cascade/completion.ts` (spiegelt `collaborationCompletableGuard`, zonder de current-invoice-
>   uitsluiting — álle facturen tellen mee) in de `updateMany.where` gevlochten, alleen voor
>   COMPLETED/CANCELLED → check en write zijn één atomair SQL-statement; glipt er werk/geld binnen dan
>   matcht de rij niet meer (count 0) → de bestaande `count !== 1`-rem rolt de hele transactie terug. +1
>   unit-test (guard-vorm, geen id-uitsluiting).
> - **OPGELOST — outer-window-blindheid in de next-action-engine (MED, DOEL 1b):** `freelancerTasks` én
>   `clientTasks` (`src/lib/actions/pending-tasks.ts`) leidden de geld-/keur-taken af uit de
>   `performances`/`invoices`-subrelaties van een `collabs`-query met `orderBy: { updatedAt: "desc" },
take: 50`. `Collaboration.updatedAt` is een `@updatedAt`-kolom die ALLEEN bij een directe mutatie op
>   de samenwerkingsrij wordt bijgewerkt (contract tekenen, dispuut, annuleren, auto-afronding) — het
>   indienen/goedkeuren van een prestatie of factuur raakt de rij nooit. Bij >50 gelijktijdige
>   PROPOSED/ACTIVE-samenwerkingen ordent het venster puur op "hoe recent is het contract getekend",
>   blind voor welke samenwerking openstaand geld-/keurwerk heeft; een ouder-getekende samenwerking met
>   een verse APPROVED/OVERDUE-factuur of SUBMITTED-prestatie viel uit `take: 50` en verdween — anders dan
>   de inner-window-bugs van run 76/77 — **permanent en niet-self-healing** uit /acties, de dashboard-rail
>   én de badge (het afhandelen bumpt `updatedAt` niet). **Fix:** de betaal-/concept-taken (ZZP'er) en de
>   keur-taken (opdrachtgever) uit dedicated, status-gefilterde, ONGEWINDOWDE queries gescoopt direct op de
>   samenwerkings-eigenaar (`collaboration.freelancer.userId` / `collaboration.company.userId`) — spiegelt
>   exact het run-77 `rejectedPerfs`-patroon; self-healing. De fase-taken die het collab-niveau echt nodig
>   hebben (`contractSignTask`, `performanceSubmitTask`, certificaat/compliance) blijven op het venster.
>   +1 regressietest (taak achter een buiten-venster geduwde samenwerking blijft zichtbaar). Realistisch
>   bij institutionele opdrachtgevers/franchise-zware ZZP'ers met veel gelijktijdige inzet.
>
> ---
>
> **Vorige run:**
>
> **Datum:** 2026-08-15 (run 77) · **main-commit basis:** `22cef90b`
> **Uitkomst:** **2 bereikbare DOEL 1b-defecten gevonden én gefixt** (beide next-action-engine,
> beide vensterbepaalde onzichtbaarheid; geen geparkeerde items deze run). 4 parallelle adversariële
> Opus-code-audits op niet-overlappende oppervlakken (authz/IDOR/tenant-isolatie, cascade/geld-integriteit
>
> - verboden statusovergangen, next-action-engine-correctheid, malicieuze input/CSV/XSS). Drie van de
>   vier audits vonden **0 bereikbare gaten**; de next-action-audit leverde de twee fixes hieronder.
>
> * **OPGELOST — afgekeurde prestatie viel uit het actiecentrum achter >5 nieuwere prestaties
>   (DOEL 1b, MED):** de herindien-lus in `freelancerTasks` (`src/lib/actions/pending-tasks.ts`) las de
>   REJECTED-prestaties uit de `collabs`-relatie, die op `orderBy: createdAt desc, take: 5` staat (nodig
>   om via `performances[0]` de fase te bepalen). Run 76 haalde de _positionele_ blindheid weg
>   (`performances[0]`-only), maar niet de _venster_-blindheid: zodra ≥5 nieuwere prestaties op één
>   ACTIVE-samenwerking bestaan, valt een afgekeurde prestatie uit een oude cyclus volledig uit het venster
>   van 5 nieuwste rijen → de herindien-taak verdween stil uit `/acties`, de badge én de dashboard-rail,
>   terwijl het geld muurvast zit (alleen een APPROVED-prestatie wordt ooit een factuur). **Repro:** perf-1
>   REJECTED (nooit hersteld) → daarna 5+ nieuwere cycli (perf-2..perf-6, willekeurige status; `createPerformance`
>   gate't alleen op ACTIVE + geen dispuut, MILESTONE heeft geen overlap-guard). **Fix:** REJECTED-prestaties
>   apart, status-gefilterd én ongewindowd ophalen (`prisma.performance.findMany`), losgekoppeld van de
>   venster-relatie — self-healing, spiegelt de factuur-lus die al eerst op status filtert vóór de take.
>   +1 regressietest (afgekeurde prestatie achter 6 nieuwere blijft zichtbaar).
> * **OPGELOST — non-deterministische keur-slice aan opdrachtgever-kant (DOEL 1b, LAAG):** de
>   `clientTasks`-collabs-query las `performances`/`invoices` (beide SUBMITTED) met `take: 5` **zónder
>   `orderBy`** — als enige plek in het bestand waar die conventie ontbrak. Bij >5 gelijktijdig SUBMITTED-rijen
>   op één samenwerking was wélke 5 keur-taken verschenen arbitrair per request; een taak kon tussen
>   page-loads flappen (verschijnen/verdwijnen zonder afhandeling). **Fix:** `orderBy: { createdAt: "asc" }`
>   op beide (oudste-eerst → venster schuift self-healing mee), conform de conventie elders in het bestand.
>
> **Geparkeerd (nit, niet gefixt):** `drawer-resolver.tsx:32` — de identiteits-verificatie-drawer toont het
> generieke `"Afronden"`-label i.p.v. iets specifiekers ("Verifieer je identiteit"). Puur cosmetisch, geen
> correctheids-/beveiligingsdefect. Prioriteit LAAG.
>
> ---
>
> **Vorige run:**
>
> **Datum:** 2026-08-14 (run 76) · **main-commit basis:** `33e4bdec`
> **Uitkomst:** **1 bereikbaar DOEL 1b-defect gevonden én gefixt** (+ 1 meegenomen should-fix; geen
> geparkeerde items deze run). 4 parallelle adversariële Opus-code-audits op niet-overlappende
> oppervlakken; de live Playwright-sweep bleef ongedaan (prod-build compileert lokaal wél groen deze
> run, maar de doorklik-sweep is niet uitgevoerd — de code-audits dekten DOEL 1/1b/2 op codeniveau af).
>
> - **OPGELOST — afgekeurde vorige-cyclus-prestatie onzichtbaar in het actiecentrum (DOEL 1b, MED):**
>   `freelancerTasks` (`src/lib/actions/pending-tasks.ts`) las voor de prestatie-fase enkel
>   `c.performances[0]` (de nieuwste). Op één ACTIVE-samenwerking kunnen meerdere cycli naast elkaar
>   bestaan (`createPerformance` gate't alleen op ACTIVE + geen dispuut). **Repro:** cyclus-1-prestatie
>   REJECTED → daarna cyclus-2-uren ingediend + APPROVED (nieuwer → `performances[0]`). De herindien-taak
>   voor de afgekeurde cyclus-1-uren verdween volledig uit `/acties`, de dashboard-rail én de badge,
>   terwijl het geld muurvast zit (alleen een APPROVED-prestatie wordt ooit een factuur). Alleen het
>   samenwerkingsdetail toonde de correctie-knop nog. **Geschonden regel:** next-action moet de juiste
>   eerstvolgende stap voor de partij "aan zet" tonen en niet stil wegvallen. **Fix:** itereer over álle
>   prestaties, emit `performanceResubmitTask` per REJECTED-rij (perf-id-gesleuteld → dedupe-veilig),
>   symmetrisch met de factuur-lus die al over álle openstaande facturen liep. Contrast: de factuur-kant
>   van exact dit multi-cyclus-probleem was al expliciet gefixt (`priorCycleFreelancerPhase` in
>   `stage.ts` + de all-invoices-lus); de prestatie-kant had geen equivalent. +4 regressietests.
> - **OPGELOST — non-deterministische factuur-slice (should-fix, LAAG):** de `c.invoices`-query in
>   dezelfde enumerator had `take: 5` zónder `orderBy` → wélke 5 openstaande cascade-facturen terugkwamen
>   was arbitrair; bij >5 openstaande facturen op één samenwerking kon een factuur-taak tussen requests
>   flappen (verschijnen/verdwijnen zonder afhandeling). **Fix:** `orderBy: { createdAt: "asc" }`
>   (oudste-eerst), conform de expliciet-ordering-conventie elders in dit bestand.
>
> Drie van de vier audits (franchise-tenant-isolatie, cascade/geld-integriteit + verboden
> statusovergangen, nieuwere feature-acties + input/CSV-injectie) vonden **0 bereikbare gaten** —
> auth→rol→ownership→Zod→actie→audit-keten, CWE-203-anti-oracle, tenant-scope-in-de-write,
> numeric-clamps (uren ≤1000, rate ≤€2000, milestone ≤€1M), CSV-formule-guard (=,+,-,@ geneutraliseerd),
> atomaire compound-guards (`updateMany({where:{id,status:from,disputedAt:null,…}})`) en de invoice-
> numbering-race allemaal geverifieerd dicht.
>
> ---
>
> **Vorige run:**
>
> **Datum:** 2026-08-14 (run 75) · **main-commit basis:** `858d0fa7`
> **Uitkomst:** **2 bereikbare defecten gevonden én gefixt** (geen geparkeerde items deze run).
> Live Playwright-sweep niet mogelijk (netwerk-policy 404't de Google-Fonts-woff2-assets → `next/font`
> faalt bij de prod-build; CI heeft die toegang wél). Pivot naar 4 parallelle adversariële Opus-code-audits.
>
> - **OPGELOST — race in factuurnummer-toewijzing (HOOG):** `allocateInvoiceNumber`
>   (`src/lib/administration/persist.ts`) deed read-then-write met een voor-berekend volgnummer; onder
>   Postgres READ COMMITTED botsten twee gelijktijdige `submitInvoice`-aanroepen van dezelfde ZZP'er op de
>   Invoice-uniekheid `[issuerKey, partyInvoiceNumber]` → rauwe, onvertaalde P2002 i.p.v. nette doorloop.
>   **Repro:** ZZP'er met 2 actieve samenwerkingen (elk een DRAFT-cascadefactuur) dient beide (bijna)
>   gelijktijdig in (twee tabs / dubbelklik). **Fix:** atomaire upsert-increment
>   (`update: { lastSeq: { increment: 1 } }`) onder de rij-lock → elk uniek nummer, geen botsing.
>   Regressie: `persist.test.ts` (nieuw, +6). SQLite serialiseert writes → kon de race lokaal nooit tonen
>   (daarom onopgemerkt tot nu).
> - **OPGELOST — dispuut-venster in auto-afronding (LAAG):** `collaborationCompletableGuard`
>   (`src/lib/cascade/completion.ts`) toetste `disputedAt` niet in de write; een dispuut geopend in het
>   sub-transactie-venster kon een samenwerking op COMPLETED laten springen ondanks bevriezing. **Fix:**
>   `disputedAt: null` aan de guard-where (afronding is `optional` → valt weg bij een net-geopend dispuut,
>   betaling blijft staan). +1 regressietest.
>
> Drie van de vier audits (API-authz-keten, tenant-isolatie + next-action-engine, input-validatie/injectie)
> vonden **0 bereikbare gaten** — auth→rol→ownership→Zod→actie→audit-keten, CWE-203-anti-oracle, cron-secret-
> gating, CSV/iCal-escaping, upload-magic-byte-checks, numeric-clamps en de next-action-role-dispatch/
> stale-task-guards allemaal geverifieerd dicht.
>
> ---
>
> **Vorige run:**
>
> **Datum:** 2026-08-13 (run 74) · **main-commit basis:** `68c9a84b`
> **Uitkomst:** **GEEN bereikbaar gat gevonden** — alle vier rollen (ZZP'er, opdrachtgever, bemiddelaar,
> admin) getest op DOEL 1 (werkt + echte acties), DOEL 1b (next-action-engine) en DOEL 2 (adversarieel).
> Dekking deze run:
>
> - **Live persona-sweep (Playwright/Chromium, echte prod-build + seed, alle 4 rollen — 30 checks, 0 fail):**
>   - **IDOR/cross-partij:** ZZP'er + opdrachtgever bij andermans privé-document / factuur-PDF / samenwerking-
>     dossier via een echt (gegokt) id → **elke keer 404** (correct geweigerd, geen 200, geen lek). Positieve
>     controle: eigen document / eigen factuur-PDF → 200 (dus de 404's zijn echte weigeringen, geen dode route).
>   - **Cross-tenant:** bemiddelaar (tenant "Noord") bij een samenwerking-dossier / factuur-PDF / document van
>     de default-tenant → **elke keer 404**.
>   - **Privilege-escalatie:** ZZP'er/opdrachtgever/bemiddelaar naar `/admin/*`; ZZP'er/bemiddelaar naar
>     `/franchise/*` → middleware redirect naar `/dashboard` (geverifieerd op `finalUrl`, geen 200-op-admin).
>   - **Robuustheid:** onzin-id's op `/api/documents/[id]` (`../../etc/passwd`, `%00`, `'OR'1'='1`,
>     `<script>`, absurd groot getal) → **elke keer 404, nul 500**.
>   - **Echte actie-uitvoering (DOEL 1) + next-action-verdwijnen (DOEL 1b):** admin keurt een verificatie
>     goed → wachtrij 6 → 5, item verdwijnt, **server-side waarheid bevestigd** (`Credential.SUBMITTED` 6→5,
>     `CREDENTIAL_VERIFIED`-audit geschreven). Afwijzen zónder reden → formulier blijft open (reden verplicht,
>     server-side afgedwongen), geen crash. IDOR-poging liet bovendien een `DOCUMENT_ACCESS_DENIED`-audit
>     achter → de volledige keten auth→rol→ownership→actie→audit werkt end-to-end.
>   - **Next-action-coherentie:** `/acties` + nav-badges kloppen per rol (ZZP'er badge 4 = 4 acties;
>     opdrachtgever 2 = 2; bemiddelaar 2 = 2 met ZZP'ers-/Diensten-badges die de twee taken spiegelen;
>     admin Verificaties-badge 6 = 6 in wachtrij). Juiste partij "aan zet", juiste volgorde.
> - **Twee parallelle adversariële Opus-code-audits → schoon:**
>   - **Bemiddelaar-surfaces + tenant-isolatie** (`/franchise/**` + `src/lib/franchise/*`, `tenancy.ts`,
>     `shift-handoff.ts`): elke mutatie/read `requireRole` + `ownsViaTenant`/`tenantScopeWhere`; unknown-id en
>     cross-tenant-id geven identieke respons (CWE-203 anti-oracle); Zod-grenzen op alle input; audit overal.
>     Geen `route.ts` onder `/franchise` (geen ongeguarde API-parallel).
>   - **Cascade/statusovergangen + money-integriteit** (`src/lib/cascade/**`, `lifecycles.ts`,
>     `state-machine.ts`, administratie-persist, samenwerking-/no-show-actions): elke forward-transitie via
>     expliciete state-machine, compound-guard **in-transactie** (TOCTOU dicht), afronden/annuleren geblokkeerd
>     bij open factuur / `SUBMITTED`-prestatie, dubbel-factuur onmogelijk (`Invoice.performanceId @unique`),
>     contract-sign het enige pad naar `ACTIVE`, geld cent-exact met harde onder-/bovengrenzen.
>
> **GEPARKEERD (deze run — 1 item, PLAUSIBLE, mensenwerk):**
>
> - **ESCALATIE NAAR MENS (product-semantiek, geen code-bug — MENSENWERK §5):** `completionBlockReason`/
>   `cancellationBlockReason` (`src/lib/cascade/completion.ts:83-120`) blokkeren afronden/annuleren van een
>   samenwerking op open facturen en `SUBMITTED`-prestaties, maar **niet** op een `NoShowReport` met
>   `verdict: "PENDING"`. **Repro:** een samenwerking met een openstaand (nog niet door admin beoordeeld)
>   no-show-rapport kan toch worden afgerond/geannuleerd. **Waarom géén auto-fix:** dit is waarschijnlijk
>   bewust — no-show-adjudicatie voedt de platform-brede betrouwbaarheidsstand (`noShowStanding`,
>   `NO_SHOW_LIMIT`), niet de geldstroom van één specifieke samenwerking, en no-show-rapporten zijn expliciet
>   toegestaan op reeds-`CANCELLED` samenwerkingen. Of dit een gat is of gewenst gedrag is een
>   product-/security-keuze voor een mens, niet voor een agent. Prioriteit: LOW.

> **Datum:** 2026-08-12 (run 72) · **main-commit basis:** `e4297a46`
> **Uitkomst:** **1 bereikbaar DOEL 2-robuustheidsdefect GEVONDEN + GEFIXT** (MED, 5 route-handlers →
> rauwe 500 i.p.v. nette 401/403), plus 2 LOW geparkeerd met repro. Live persona-sweep (alle 4 rollen,
> Playwright/Chromium): **schoon** — privilege-escalatie naar `/admin/*` en `/franchise/*` wordt door de
> middleware correct naar `/dashboard` geredirect (geen 200-op-admin; de eerste ruwe status-200 bleek een
> redirect, geverifieerd op finalUrl+heading, géén escalatie); onzin-id's (SQLi-string, path-traversal,
> `%00`, XSS-string, groot getal) op samenwerkingen/facturen/opdrachten/dossier/PDF/documenten-routes →
> geen enkele 500; sequentiële-id IDOR op `/api/facturen/[id]/pdf`, `/api/documents/[id]`,
> `/api/samenwerkingen/[id]/dossier` als ZZP'er/opdrachtgever → geen enkele 200 (correct geweigerd);
> `/acties` per rol coherent met de echte status. Drie parallelle adversariële Opus-code-audits:
> document-/bestandsprivacy + share-tokens → **schoon** (volledige auth→rol→ownership→audit-keten +
> CWE-203-anti-oracle + path-traversal-guard + HMAC-timing-safe overal aanwezig); cascade/statusovergangen
>
> - money-math → **schoon** (elke forward-transitie compound-guarded in-tx, dispuut-freeze her-gecheckt
>   in-tx, dubbel-factuur structureel onmogelijk via `@unique(performanceId)`, BTW/ORT/credit cent-exact);
>   nieuwste routes (metrics/agenda/systeemstatus/openstaand/prognose/inzicht/diensten-CSV/prestaties) →
>   **dit ene defect** + ICS/CSV-injectie & feed-token-auth schoon.
>
> 1. **GEFIXT — MED (DOEL 2, robuustheid, "verboden/onzin → nette status, nooit 500"):** vijf CSV-/template-
>    download-route-handlers riepen `requireActor()`/`requireRole()` **ongevangen** aan:
>    `src/app/(protected)/diensten/export/route.ts:10`, `.../prognose/export/route.ts:10`,
>    `.../prestaties/export/route.ts:9`, `.../verplichtingen/export/route.ts:10`,
>    `.../admin/import/template/route.ts:6`. De 16 andere export/PDF/dossier-routes (o.a. `/api/agenda`,
>    `/api/administratie/openstaand`, alle `[id]/pdf`) vangen `AuthorizationError` al af tot
>    `new Response(e.message, { status: e.status })`. **Repro:** gebruiker logt in (JWT `maxAge` 8u,
>    `status`-claim gezet bij sign-in en daarna niet meer ververst); admin schorst het account of de
>    AVG-anonimiseringstaak anonimiseert het → de middleware laat door op de **stale** `ACTIVE`-JWT-claim,
>    maar `requireActor()` leest vers uit de DB, ziet `status !== ACTIVE`/`anonymizedAt` en werpt 401/403 →
>    zonder try/catch borrelt die ongevangen op → Next.js serveert een **rauwe 500** i.p.v. de nette
>    401/403. Fail-closed (geen data-lek), maar inconsistent met het eigen patroon en vervuilt monitoring.
>    **Fix:** dezelfde inline `try/catch(AuthorizationError)`-guard als de sibling-routes in alle 5 files.
>    +5 regressietests (`src/app/(protected)/export-auth-error.test.ts`: elke route geeft 401/403, geen throw).
>
> **GEPARKEERD (deze run — LOW, met repro):**
>
> - **LOW (DOEL 2, cascade-robuustheid, geen data-corruptie):** `allocateInvoiceNumber`
>   (`src/lib/administration/persist.ts:52-69`, via `commands-shared.ts:202-207` in `persistInTransaction`)
>   leest `InvoiceSequence.lastSeq = N` met `findUnique` (geen `FOR UPDATE`) en schrijft
>   `upsert({ data: { lastSeq: N+1 } })` — een **overwrite**, geen `{ increment: 1 }`. **Repro:** één ZZP'er
>   dient twee DRAFT-cascadefacturen vrijwel gelijktijdig in (dubbelklik/twee tabs); beide transacties lezen
>   `N`, berekenen `N+1`, botsen op `@@unique([issuerKey, partyInvoiceNumber])` → de tweede transactie rolt
>   **volledig** terug (incl. de sequence-upsert), dus geen dubbel factuurnummer en geen corrupte teller.
>   **Effect:** de tweede indiening faalt met een generieke interne fout (P2002 via `throwSafeActionError`)
>   i.p.v. een vriendelijke "probeer opnieuw"; een retry slaagt met het juiste nummer. **Waarom geparkeerd:**
>   raakt de administratie-domeinmotor (audit-backlog: "niet aankomen behalve voor tests") en verdient een
>   eigen gefocuste PR. **Aanbevolen fix:** atomair `update({ data: { lastSeq: { increment: 1 } } })` of
>   `SELECT … FOR UPDATE` zodat gelijktijdige indieningen netjes serialiseren.
> - ~~**LOW (DOEL 2, consistentie — server actions):** `src/app/(protected)/diensten/importeer/actions.ts:25`
>   en `src/app/(protected)/prestaties/actions.ts:26` roepen `requireActor()` óók ongevangen aan; als server
>   actions is de faalmodus een generieke client-error-boundary i.p.v. een rauwe HTTP-500, dus lagere
>   prioriteit.~~ **→ GEDAAN (2026-08-13, PR #1077):** beide actions vangen de `AuthorizationError` nu af
>   en geven een net resultaat met de gecureerde melding terug (`{ imported/skipped/errors }` resp.
>   `{ approved/failed/error }`) i.p.v. een ongevangen throw naar de client-error-boundary. Parity met de op
>   #1067 gehardde download-routes. +2 regressietests (`server-action-auth-error.test.ts`).
>
> ---

> **Datum:** 2026-08-12 (run 71) · **main-commit basis:** `c3f04410`
> **Uitkomst:** **1 bereikbaar DOEL 1b-defect GEVONDEN + GEFIXT** (MED, badge↔/acties-pariteit). Drie parallelle
> adversariële Opus-audits: recente money-math (WIK-staffel handelsrente/incassokosten #1051, credit/BTW, ORT) →
> **schoon** (exhaustieve brute-force cent-vergelijking tegen exacte rationale rekenkunde, nul mismatches; de
> aanmaning-bedragen zijn bovendien display-only, raken geen money-flow); newest authz/IDOR/cross-tenant/AVG
> (shift-handoff, reviews-reveal double-blind, franchise-roster/diensten-mutaties, account-export/erasure) →
> **schoon** (volledige auth→rol→ownership/tenant→Zod→transitie→audit-keten + CWE-203 anti-oracle overal aanwezig);
> next-action/badge-pariteit → **dit ene gat**.
>
> 1. **GEFIXT — MED (DOEL 1b, bemiddelaar — /franchise/samenwerkingen-badge miste het vervolgsignaal):** een
>    aflopende plaatsing binnen de tenant emit op `/acties` (`franchiseCollaborationRenewalTask`, pending-tasks.ts,
>    sinds #1052) een "plan een vervolg"-taak die naar `/franchise/samenwerkingen` linkt, maar `navBadges`
>    (`signals.ts`) telde voor de FRANCHISER alléén leads/shift-overnames/roster/diensten. `/franchise/samenwerkingen`
>    was het enige franchiser-navitem met een /acties-taak zónder badge — het "signaal op één oppervlak"-anti-patroon
>    (de partij-zijde kreeg die pariteit al in #1034). **Repro:** FRANCHISER met één ACTIEVE, niet-gedisputeerde
>    samenwerking op een tenant-opdracht (`job.tenantId = franchiser.tenantId`) met `endDate` binnen het
>    renewal-venster → `/acties` toont de taak + telt mee in de /acties-badge + rail, maar `/franchise/samenwerkingen`
>    toont **geen** badge (0). **Fix:** nieuwe `SignalCounts`-sleutel `franchiseRenewals` (`SIGNAL_HREF`
>    `/franchise/samenwerkingen`, tone `attention`); de FRANCHISER-tak roept de **bestaande gedeelde**
>    `renewalAttentionBadgeCount({ job: { tenantId } }, now)` aan — exact dezelfde bron/venster/cap/attentiegrens als
>    /acties → kan niet driften. +2 `buildBadges`-tests + nieuw `signals.badge-gaps-run71.test.ts` (3 e2e via
>    `navBadges`, incl. tenant-scope-assertie).
>
> ---

> **Datum:** 2026-08-11 (run 70) · **main-commit basis:** `b171426c`
> **Uitkomst:** **2 bereikbare defecten GEVONDEN + GEFIXT** in niet-overlappende bestanden (2 MED),
> plus 4 geparkeerd met repro. Vier parallelle Opus-audits: franchise-tenant-isolatie/IDOR → **schoon**
> (volledige trace van elke id-nemende franchise-mutatie/-read tegen `tenantId`/`ownsViaTenant`/
> `tenantScopeWhere`); cascade-TOCTOU/statusovergangen → **1 MED + 2 LOW** (dispuut-freeze + terminale
> grendels overal aanwezig; geen ontbrekende freeze); malicieuze input → **1 MED + 1 LOW** (profiel/
> bericht/beschikbaarheid/reviews/upload/uren/CSV/PDF al hard); next-action-/badge-logica → **1 MED**
> (echte badge↔lijst-tegenstelling met één samenwerking, niet de geparkeerde >50-drift).
>
> 1. **GEFIXT — MED (DOEL 2, robuustheid/DoS, CWE-400 — onbegrensde support-body):** de support-body's
>    (nieuw ticket `ticketSchema.body`, gebruikersreactie `replySchema.body` in
>    `src/app/(protected)/support/actions.ts`, én de helpdeskreactie in
>    `src/app/(protected)/admin/support/actions.ts`) waren begrensd op `.min()` maar **niet op `.max()`**,
>    terwijl `subject` (140) en elk ander vrije-tekstveld in de repo (bericht 5000, bio 2000, idee 4000)
>    wél een bovengrens hebben. **Repro:** elke geauthenticeerde gebruiker POST `createTicket`/
>    `replyToTicket`/`adminReply` met een body van ~11 MB (bounded door de 12 MB server-action-limiet) →
>    slaagt `.min()`, stroomt ongefilterd naar de TEXT-kolom (`SupportTicket`/`SupportMessage.body`) én
>    de triage-keyword-scan; herhaalbaar (geen dedup) → goedkope opslag-/CPU-abuse. **Verwacht:** schone
>    Zod-afwijzing zoals `messageSchema`. **Fix:** `.max(5000)` op alle drie de body's + regressietests
>    (`support/support-body-cap.test.ts` nieuw, `admin/support/admin-reply.test.ts` uitgebreid).
> 2. **GEFIXT — MED (DOEL 1b, badge↔lijst-pariteit, beide rollen — fantoom contract-onderteken-actie):**
>    de `/samenwerkingen`-nav-badge telde voor **elke** PROPOSED samenwerking een contract-onderteken-
>    actie (`countFreelancerCascadeWork` `signals.ts` PROPOSED → +1; client `cascadeProposed` =
>    `collaboration.count(PROPOSED)`), terwijl `/acties` (`pending-tasks.ts`, run 58) die taak juist
>    **onderdrukt** zodra de plaatsing door een certificaat-gat is geblokkeerd
>    (`collaborationPlacementBlocked` → NON_COMPLIANT; `signContract` weigert dan server-side, het
>    samenwerkingsdetail verbergt de teken-knop al). **Repro:** één PROPOSED, niet-gedisputeerde
>    samenwerking met een `required` `JobCredentialRequirement` van een niet-verplicht type dat de ZZP'er
>    mist/verlopen heeft → `/samenwerkingen`-badge toont `+1`, maar `/acties` + het detail tonen **geen**
>    onderteken-actie (de badge wijst naar het verkeerde scherm en klaart pas als het certificaat wordt
>    hersteld of het voorstel wordt geannuleerd). Bereikbaar met één samenwerking — **niet** de
>    geparkeerde >50-teldrift. **Fix:** beide badge-tellers spiegelen nu dezelfde pure
>    `collaborationPlacementBlocked`-gate (freelancer: cascade-query haalt `job.credentialRequirements` +
>    het volledige certificaatdossier op → `placementBlocked` per collab; client: `cascadeProposed` →
>    nieuwe `countClientSignableProposals` die de geblokkeerde plaatsingen uitsluit, gecapt op
>    `CASCADE_SCAN_LIMIT` gelijk aan de list-slice). Eén bron van waarheid → kan niet driften. +6 tests
>    (`signals.test.ts` PROPOSED-placementBlocked, `signals.badge-gaps-run70.test.ts` query-vorm beide
>    rollen; `signals.cascade-dispute.test.ts` bijgewerkt naar de findMany-teller met behoud van de
>    `disputedAt:null`-invariant).
>
> **GEPARKEERD (deze run — lager geprioriteerd / product-beslissing nodig, met repro):**
>
> - **MED (DOEL 2, cascade, dubbele-facturatie-backstop omzeilbaar met periode-loze HOURS-urenstaat):**
>   de dubbel-factuur-rem (`assertNoOverlappingHoursPerformance`, `performance-commands.ts:280-305`, +
>   de in-tx-tweeling `commands-shared.ts:164-182`) slaat bewust over zodra `periodStart`/`periodEnd`
>   `null` is ("zonder periode is overlap niet te bepalen"). Maar `validatePerformanceForm`
>   (`validation.ts:404-432`) **vereist geen periode** voor HOURS (de form-datumvelden zijn niet
>   `required`). **Repro:** een ZZP'er dient tweemaal een HOURS-urenstaat in met identieke uren en géén
>   periode → beide slaan de overlap-rem over (pre-check én in-tx) → elk draait zijn eigen
>   goedkeur→factuur→betaling-cascade → tweemaal betaald voor hetzelfde werk. **Backstopped by default:**
>   de opdrachtgever keurt elke prestatie handmatig (ziet/weigert de dubbel); volledig geautomatiseerd
>   pas met `PERFORMANCE_GRACE_DAYS > 0` (default UIT, opt-in). **Waarom geparkeerd:** de "geen periode →
>   niet blokkeren"-grens is een **gedocumenteerde ontwerpkeuze**, en periode-loos uren loggen is een
>   legitieme UI-flow (de datumvelden zijn optioneel) — een periode verplicht stellen is een
>   **product-beslissing** die money-kritische cascadecode raakt en een eigen gefocuste PR + seed/tests-
>   sweep verdient. **Aanbevolen fix:** ofwel periode verplicht voor HOURS (+ seed/tests bijwerken), ofwel
>   een periode-loze exact-duplicaat-dedup op dezelfde samenwerking.
> - **GEFIXT — LOW (DOEL 2, CWE-203 existence-oracle):** `createPerformance` (`performance-commands.ts`)
>   gaf "Samenwerking niet gevonden." (onbestaand id) vs "Alleen de ZZP'er kan een prestatie
>   vastleggen." (bestaat, geen partij) — twee onderscheidbare meldingen die naar de client lekken (via
>   `logAndSubmitPerformanceAction`, MILESTONE-pad). De 5 siblings (`submit/approve/reject/update/
editAndResubmit`) waren hier al op geünificeerd (#903); `createPerformance` was de enige die achterbleef.
>   **Fix (PR #1056):** een niet-partij (noch ZZP'er, noch opdrachtgever, noch admin) krijgt nu exact
>   dezelfde "Samenwerking niet gevonden."-melding als een onbekend id; alleen de opdrachtgever (partij,
>   verkeerde kant) houdt de behulpzame rolmelding. +2 regressietests in `anti-oracle-party.test.ts`.
> - **GEFIXT — LOW (DOEL 1b, freelancer — sub-symptoom van #2):** in exact de geblokkeerde-PROPOSED-staat
>   kreeg de ZZP'er op `/acties` de `credentialCollabMissing`/`-Expired`-taak (niet-verplicht vereist type),
>   maar geen enkele nav-badge telde die (`credentialAlerts` = `rejected + expiring(VERIFIED) +
mandatoryAlerts` dekt een niet-verplicht ontbrekend/verlopen vereist cert niet). Na fix #2 toonde
>   `/samenwerkingen` correct 0; de `/certificaten`-badge ondertelde de échte actie nog. **Fix (PR #1059):**
>   nieuwe gedeelde pure `collaborationRequiredCredentialGaps` (bundelt de VERLOPEN + ONTBREKEND collab-
>   gaten achter één mandatory/rejected-uitsluitingsfilter); pending-tasks.ts (/acties) én signals.ts
>   (de `/certificaten`-badge) delen die helper op dezelfde certificaatset → de badge telt het gat nu mee
>   en kan niet driften. De expiry-tak zat al in de badge-`expiring`, dus alleen verlopen/ontbrekend telt
>   extra. +7 tests.
> - **GEFIXT — LOW (DOEL 1, CSV-import — te-strakke overlap-collisie):** `importDienstenAction`
>   (`diensten/importeer/actions.ts`) rondde elke dienst naar de hele dag → twee legitieme
>   diensten op dezelfde kalenderdag (dag- + nachtblok, gangbaar in de zorg) kregen identieke periodes
>   en botsten op de overlap-rem (`OVERLAPPING_PERFORMANCE_MESSAGE`) → de tweede werd geweigerd (idem
>   een nachtdienst gevolgd door een dienst de dag erna). **Fix (PR #1062):** de import gebruikt nu de
>   **exacte** diensttijden uit de parser als periode i.p.v. `00:00:00`–`23:59:59` van de kalenderdag;
>   twee niet-overlappende diensten overlappen dan niet meer, terwijl een écht duplicaat (identiek
>   tijdvenster) wél geweigerd blijft. +2 tests (exacte periode; dag+nachtdienst-scenario).
> - **NIT (DOEL 2, franchise skillIds uncapped):** `franchise/zzpers/actions.ts:74`
>   `formData.getAll("skillIds")` heeft geen lengte-cap (contrast: `freelancerProfileSchema.skillIds`
>   `.max(50)`); alleen bestaande skills persisteren dus geen slechte staat, enkel querylast op een
>   semi-vertrouwde rol. Al geannoteerd `// unbounded-allow`. Cap voor consistentie.
>
> ---

> **Datum:** 2026-08-11 (run 69) · **main-commit basis:** `5d5e2dc5`
> **Uitkomst:** **2 bereikbare defecten GEVONDEN + GEFIXT** in 2 niet-overlappende bestanden (1 HIGH,
> 1 MED). Vier parallelle Opus-audits: authz/IDOR/cross-tenant → **schoon** (volledige trace van
> franchise-mutaties, samenwerking/cascade-commands, document/PDF/dossier-routes, RBAC-middleware);
> cascade/status-TOCTOU → **1 HIGH**; next-action/badge-drift → **2 geparkeerd (>50-drift)**;
> malicieuze input/robuustheid → **1 MED** (rest schoon: VAT/hours/CSV/upload/expense-caps al hard).
>
> 1. **GEFIXT — HIGH (DOEL 2, dispuut-bevriezing lek op `cancelInvoice`):** `cancelInvoice`
>    (`src/app/(protected)/facturen/actions.ts`) miste — anders dan zijn siblings `sendInvoice`
>    (regel 284) en `markInvoicePaid` (regel 336) — de `disputedAt`-rem. **Repro:** FREELANCER maakt
>    - verzendt een losse factuur op een ACTIVE-samenwerking (status SENT) → CLIENT/FREELANCER opent
>      een dispuut op de samenwerking (`collaboration.disputedAt` gezet) → FREELANCER roept
>      `cancelInvoice(id)` direct aan. `assertInvoiceTransition("SENT","CANCELLED")` is geldig en er is
>      geen dispuut-check → de factuur wordt **eenzijdig geannuleerd mid-dispuut**, de gedisputeerde
>      geldregel gewist vóór de admin beslecht. **Verwacht:** geweigerd met `DISPUTE_FROZEN_INVOICE_MESSAGE`.
>      Geschonden regel: cascade-brede `assertNotDisputed`-bevriezing / CLAUDE.md regel 1-2. **Fix:**
>      dispuut-check direct na ownership + regressietest.
> 2. **GEFIXT — MED (DOEL 2, robuustheid/DoS, CWE-400 — onbegrensde bulk-triage-batch):**
>    `bulkChangeApplicationStatus` (`src/app/(protected)/kandidaten/actions.ts`) had geen plafond op
>    `formData.getAll("appId")`. **Repro:** geauthenticeerde CLIENT POST met tienduizenden `appId`-velden
>    (bounded door de 12 MB body-limiet) → onbegrensde `id in (...)`-`findMany` + een sequentiële per-id-
>    transactie waarvan de timeout bewust op 120s staat → één request houdt tot 2 min een DB-transactie/
>    -connectie open; een handvol parallelle requests put de pool uit. **Verwacht:** schone afwijzing zoals
>    `MAX_INVOICE_LINES`/`MAX_IMPORT_SIZE`. **Fix:** `MAX_BULK_TRIAGE_IDS = 200` + vroege afwijzing vóór DB.
>
> **GEPARKEERD (deze run — lager geprioriteerd, met repro):**
>
> - **MED (DOEL 1b, FREELANCER+CLIENT, badge-drift >50):** de `/berichten`-nav-badge leest een **exacte**
>   unread-telling (`unreadConversationCount`, `signals.ts:379-398`, geen `take`) terwijl `/acties`
>   (`unreadConversations`, `pending-tasks.ts:121-167`) na `.slice(0, 50)` één `messageReplyTask` per
>   gesprek toont **zonder residu-rollup** — en de basis-`conversationParticipant.findMany` heeft **geen
>   `orderBy`**. Repro: 55 ongelezen gesprekken → badge `55`, /acties toont 50; welke 5 wegvallen is
>   niet-deterministisch. Fix: cap droppen (owner-scoped, precedent = cert-dossier) óf residu-rollup +
>   deterministische `orderBy`.
> - **MED (DOEL 1b, ADMIN + FRANCHISER, badge-drift >50):** de 7 ADMIN-wachtrij-badges (`signals.ts:909-934`,
>   kale `count()`) en de FRANCHISER `openHandoffs`-badge (`signals.ts:737`) zijn **exact**, terwijl
>   `adminTasks`/`franchiserTasks` (`pending-tasks.ts`) elke wachtrij op `take:50` cappen **zonder
>   `+N meer`-rollup**. Repro: 62 SUBMITTED credentials → `/admin/verificaties`-badge `62`, /acties toont 50.
>   Rest van de #1022-klasse (die alleen de slice-`orderBy` deterministisch maakte, niet badge=list).
>   Fix: cap droppen op deze platform-brede wachtrijen óf residu-rollup per categorie.
> - **LOW (DOEL 2, consistentie):** `updatePerformance` (`src/lib/cascade/performance-commands.ts:210-268`)
>   her-verifieert de dispuut/terminaal-pre-checks **niet** binnen de `updateMany`-transactie (alleen
>   `status: perf.status` gegrendeld). Vandaag onschadelijk (bewerkt alleen DRAFT/REJECTED-veldwaarden;
>   `submitPerformance` her-grendelt vers), maar het wijkt af van de TOCTOU-doctrine van de rest van de module.
>
> ---

> **Datum:** 2026-08-02 (run 68) · **main-commit basis:** `d29520ca`
> **Uitkomst:** **5 bereikbare defecten GEVONDEN + GEFIXT** in 2 niet-overlappende bestanden (1 HIGH,
> 4 MED). Live-sweep (4 rollen, curl+DB): RBAC-redirects, IDOR (document/factuur-PDF/dossier),
> path-traversal, cron-/webhook-auth, ~70 pagina's zonder 500 — **schoon**. Vier parallelle Opus-audits:
> franchiser-tenant-isolatie → **schoon**; VAT/hours/CSV/expenses-input → **schoon op één na**;
> cascade-TOCTOU/status → **1 HIGH + 1 MED**; next-action/badge-drift → **1 (bijna-)HIGH + 2 MED**.
>
> 1. **GEFIXT — HIGH (DOEL 2, server-side-waarheid-drift op de losse-factuurflow):** `createInvoice`
>    (`src/app/(protected)/facturen/actions.ts`) controleerde `auth → rol → ownership → cascade-gate → Zod`
>    maar **nooit `Collaboration.status`**. De factureerbaarheidsregel (`invoiceableCollaborationsWhere`:
>    `status ∈ {ACTIVE, COMPLETED}`) leefde alléén in de keuzelijst-query van `/facturen/nieuw` — puur
>    "tonen". Een ZZP'er kon de action rechtstreeks met een **PROPOSED** (ongetekend contract) of
>    **CANCELLED** `collaborationId` aanroepen en tóch een factuur maken → sturen → laten betalen (CLAUDE.md
>    regel 1/2). **Fix:** nieuwe pure `collaborationBillableForLegacyInvoice` (spiegelt de status/dispuut-
>    delen van `invoiceableCollaborationsWhere`) als pre-check **én** als in-transactie-grendel (TOCTOU:
>    her-leest status+`disputedAt` binnen de create-transactie → geannuleerd/gedisputeerd in het venster →
>    `NotBillableRaceError` → rollback, geen id-lek). Zelfde bron voor keuzelijst en gate → geen drift.
> 2. **GEFIXT — MED (DOEL 2, dispuut-bevriezing lek op de legacy-factuuracties):** `createInvoice`/
>    `sendInvoice`/`markInvoicePaid` lazen `disputedAt` niet, terwijl elke andere geldstroom-mutatie in de
>    cascade-laag al via `assertNotDisputed` bevriest. Op een ACTIVE-maar-gedisputeerde samenwerking kon dus
>    tóch een losse factuur worden gemaakt/verzonden/betaald. **Fix:** `disputedAt: null` toegevoegd aan
>    `invoiceableCollaborationsWhere` + `collaborationBillableForLegacyInvoice` (dekt `createInvoice`) en een
>    expliciete `DISPUTE_FROZEN_INVOICE_MESSAGE`-rem op `sendInvoice`/`markInvoicePaid`.
> 3. **GEFIXT — MED (DOEL 2, robuustheid/DoS op `createInvoice`):** `parseLines` had **geen plafond** op
>    het aantal factuurregels (`formData.getAll` onbegrensd) — een geauthenticeerde ZZP'er kon binnen de
>    12 MB body-limiet tienduizenden regeltripels sturen → ongecontroleerde validatielus + zeer grote geneste
>    multi-row insert in één transactie (CWE-400). **Fix:** `MAX_INVOICE_LINES = 200`, vroege schone afwijzing
>    (spiegelt de bestaande `MAX_SHIFTS_PER_PERFORMANCE`/`MAX_IMPORT_SIZE`-caps).
> 4. **GEFIXT — MED (DOEL 1b, FRANCHISER badge-undercount t.o.v. /acties):** de `openDienstAlerts`-badge-query
>    (`src/lib/signals.ts`) miste de `collaborations: { none: { status: "ACTIVE" } }`-filter die haar /acties-
>    tegenhanger (`pending-tasks.ts` `franchiseAcuteDienstTask`) wél heeft; de zuster-`staleDiensten`-query
>    had hem al. Bij een tenant met ≥50 PUBLISHED diensten konden gevulde/start-loze diensten (die door
>    `nulls:"first"` vooraan sorteren) een écht acute dienst uit de `take:50`-slice duwen → badge stiller dan
>    /acties. **Fix:** filter toegevoegd; de open-query is nu identiek gescoopt aan pending-tasks.ts.
> 5. **GEFIXT — MED (DOEL 1b, CLIENT niet-deterministische slice):** de `staleCandidates`- (VIEWED/SHORTLIST)
>    en `acceptedCandidates`- (ACCEPTED) badge-queries in `signals.ts` misten de `orderBy` die hun /acties-
>    tegenhangers (`staleApplicationsTask` `createdAt:asc`, `proposeCollaborationTask` `updatedAt:asc`) wél
>    hebben. Boven 50 rijen kon de `take`-slice een ander subset (en dus een andere telling) pakken dan
>    /acties. **Fix:** identieke `orderBy` toegevoegd aan beide. +2 regressietestbestanden
>    (`facturen/actions.test.ts` uitgebreid: status/dispuut/regelplafond-gates + TOCTOU; nieuw
>    `signals.badge-gaps-run67.test.ts`: query-vorm-asserts). Gate: typecheck, lint, test (5606), build,
>    prettier groen.
>
> **GEPARKEERD (deze run — lager geprioriteerd, met repro):**
>
> - ~~**NIT (DOEL 1b, FRANCHISER):** de roster-query (`freelancerProfile.findMany({ where:{tenantId}, take:50 })`)
>   heeft op **beide** oppervlakken (`signals.ts` roster-badge + `pending-tasks.ts` `franchiseNotEngageableTask`/
>   `franchiseCredentialExpiryTask`) **geen `orderBy`**.~~ **GEFIXT (2026-08-02e, PR #1039):** deterministische
>   `orderBy: { id: "asc" }` op beide roster-queries → identieke truncatie, de /franchise/zzpers-badge kan niet
>   meer driften van /acties bij >50 roster-leden. +2 tests (`signals.roster-order.test.ts` nieuw;
>   `pending-tasks-franchiser.test.ts` uitgebreid met de orderBy-invariant).
> - ~~**LOW (DOEL 2, robuustheid):** `createInvoice` heeft (anders dan de PDF-/export-routes met
>   `documentPdfRateLimiter`/`exportRateLimiter`) **geen rate-limiter**. Het regelplafond hierboven dekt de
>   ergste variant af; een per-actor rate-limiter op de mutatie is defense-in-depth.~~ **GEFIXT
>   (2026-08-10, PR #1043):** nieuw `invoiceCreateRateLimiter` (default 30/uur, `INVOICE_CREATE_RATE_LIMIT`),
>   gecheckt op `actor.id` vóór de zware DB-reads/-writes én vóór `loadOwnedCollaboration` (geen
>   ownership-lek). +4 tests (limiter-config + rem-melding/geen-lek/happy-path in `facturen/actions.test.ts`).
> - **LOW (robuustheid):** detail-not-found-routes (`/samenwerkingen/<onzin>`, `/opdrachten/<onzin>`,
>   `/facturen/<onzin>`) renderen de 404-UI met **HTTP 200** i.p.v. 404 (via een custom not-found-component
>   i.p.v. `notFound()`). Geen security-impact (geen data-lek), wel een SEO/correctheids-nit.
>
> ---

> **Datum:** 2026-08-02 (run 67) · **main-commit basis:** `192cb0b7`
> **Uitkomst:** **1 bereikbaar defect GEVONDEN + GEFIXT** (HIGH — monetisatie-/moderatie-integriteit
> onder concurrency op `changeJobStatus`). Twee parallelle Opus-audits: TOCTOU/status-integriteit →
> **1 HIGH gevonden**; next-action-/badge-asymmetrie → **3 kandidaten geïdentificeerd, geparkeerd**.
>
> 1. **GEFIXT — HIGH (DOEL 2, plan-limiet-bypass + moderatie-resurrectie via ongeguarde publiceer-write):**
>    `changeJobStatus` (`src/app/(protected)/opdrachten/actions.ts`) las `job.status` niet-transactioneel,
>    telde de plan-limiet (`canApply`) in een **aparte** read, en schreef de nieuwe status daarna met een
>    **ongeguarde** `job.update({ where: { id } })`. **(1) Plan-limiet-bypass:** twee gelijktijdige publish-
>    verzoeken van een FREE-opdrachtgever (`maxJobs=1`) lezen beide `activeCount=0`, passeren beide
>    `canApply(1,0)` → 2 actieve opdrachten op een 1-plan (CLAUDE.md regel 1: server-side feature-limiet
>    omzeild; elke geauthenticeerde CLIENT kan dit, directe monetisatie-impact). **(2) Moderatie-resurrectie:**
>    `adminCloseJob` zet CLOSED terwijl de eigenaar heropent (owner passeerde `assertJobTransition` op de stale
>    DRAFT/CLOSED-waarde) → de blinde owner-write landt als laatste en overschrijft de moderatie-CLOSED terug
>    naar PUBLISHED. **Fix:** interactieve transactie met compound-guarded `updateMany({ where: { id, status:
from } })` + count-gate (0 → `StaleJobStatusError` → rollback, geen resurrectie) én de plan-telling
>    **binnen** de transactie ná de write (write-lock serialiseert gelijktijdige publishes → de tweede telt de
>    eerste mee → `canApply` faalt → `PlanLimitReachedError` → rollback). `canApply` blijft de enige bron van
>    waarheid; onbeperkte plannen (`maxJobs=-1`) slaan de telling over maar houden de guard. +4 regressietests
>    (`publish-toctou.test.ts`). Gate: typecheck, lint, test (5587), build, prettier groen.
>
> **GEPARKEERD (deze run — next-action/badge-asymmetrie-scan, geen security):**
>
> - ~~**MED (DOEL 1b, CLIENT+FREELANCER):** `collaborationRenewalTask` (ACTIVE-samenwerking op/voorbij
>   `endDate`) staat op /acties + de dashboard-rail (attention bij post-due) maar ontbreekt in de
>   `/samenwerkingen`-nav-badge.~~ **GEFIXT (2026-08-02, PR #1034):** nieuwe pure `countAttentionRenewals`
>   (`collaboration-renewal.ts`) + `renewalAttentionBadgeCount`-query in `signals.ts` (spiegelt `renewalTasks`
>   één-op-één: partij-scope, `status:ACTIVE`, `disputedAt:null`, hetzelfde endDate-venster, cap/ordering) →
>   telt mee in `cascadeWork` voor beide rollen. Dezelfde `summarizeCollaborationRenewal`-bron als /acties →
>   kan niet driften. +7 tests (pure grens + badge-integratie). Gate: typecheck, lint, test (5594), build,
>   prettier groen.
> - ~~**MED (DOEL 1b, FREELANCER):** het urencriterium-signaal ("onhaalbaar / dit jaar niet meer",
>   `getHoursCriterionSummary`) leeft alleen op `/inzicht`; geen /acties-tegenhanger. Hoge financiële inzet
>   (zelfstandigenaftrek) maar zachtere/seizoensgebonden actie.~~ **→ GEDAAN (2026-08-13, PR #1079):**
>   `freelancerTasks` emit het nu als next-action (`hours-criterion`, `P.hoursCriterionDueSoon: 51`) op
>   /acties + de dashboard-rail + de /acties-badge, via een pure gate `hoursCriterionNeedsAction`
>   (seizoen H2/Q4 · activiteit · niet-op-koers · nog haalbaar — `onhaalbaar` geeft bewust géén taak).
>   Deep-link `/ontzorgd/uren` (de indirecte-uren-registratie). Read-only, geen schema-/mutatie-/auth-
>   oppervlak, geen extra query (hergebruikt `getHoursCriterionSummary`). +9 tests. Gate groen.
> - ~~**LOW (DOEL 1b, FRANCHISER):** de dashboard-seal "Verloopt binnenkort" (`dashboard/page.tsx` rauwe
>   `credential.count`) is **niet** superseded-aware, terwijl /acties + de `/franchise/zzpers`-badge
>   (`rosterExpiringByProfile`) superseded certs wél uitsluiten → seal luider dan /acties.~~ **GEFIXT
>   (2026-08-02, PR #1038):** nieuwe gedeelde helper `summarizeRosterExpiringSoon`
>   (`src/lib/data/roster-expiry.ts`) draait dezelfde twee-staps, supersede-aware aggregatie als /acties +
>   de badge; de zegel leest nu `.certs` i.p.v. de rauwe telling. +5 tests. Zelfde klasse als #1026/#1030,
>   nu ook op de seal gedicht.
>
> ---

> **Datum:** 2026-08-02 (run 66) · **main-commit basis:** `947426a1`
> **Uitkomst:** **2 bereikbare defecten GEVONDEN + GEFIXT** (document-integriteit HIGH, TOCTOU +
> next-action cross-surface drift MED). Drie parallelle Opus-audits (authz/IDOR/cross-tenant +
> document-privacy → **schoon, niets nieuws**; financiële/status-integriteit → **1 HIGH gevonden**;
> next-action-correctheid → **1 MED gevonden**).
>
> 1. **GEFIXT — HIGH (DOEL 2, document-substitutie via ontbrekende status-guard op de trust-kritische
>    verificatieflow):** `persistCredential` (`src/app/(protected)/certificaten/actions.ts`) deed in de
>    `hasFile`-hertindien-tak een **ongeguarde** `tx.credential.update({ where: { id } })` ná een niet-
>    transactionele statuslees (`loadOwnedCredential`) en ná een **trage** `putBlob` (AV-scan + storage-
>    put, echte netwerk-I/O van meerdere seconden). Repro: een `SUBMITTED`-credential met document `D0`;
>    de ZZP'er uploadt een vervangend bestand (resubmit=false, dus géén status-check in die tak) terwijl
>    `putBlob` loopt. Een gelijktijdige admin keurt `D0` goed (`verifyCredential`, compound-guard op
>    `status:SUBMITTED` matcht nog) → `VERIFIED`, `verifiedAt`, `credentialVerification` naar `D0`. De
>    ZZP'er-transactie commit dan de blinde write: `documentId` wordt stil overschreven naar het nieuwe,
>    **ongeziene** bestand op de nu-`VERIFIED` rij, en `deleteDocumentById` verwijdert `D0` — het bewijs
>    dat de admin daadwerkelijk beoordeelde — onherstelbaar. Eindstaat: een VERIFIED-credential (kern-
>    differentiatie: geverifieerde VOG/diploma) wijst naar een document dat niemand keurde; het gekeurde
>    is weg. Schending CLAUDE.md regel 2/3 (compound-guarded write; server-side waarheid; expliciete
>    transitiemap). Exact de TOCTOU-klasse die de rest van dit bestand al had (run-54 `applyExternalVerification`)
>    — de drie resterende ongeguarde siblings. **Fix:** compound-guarded `updateMany({ where: { id, status } })`
>    - count-gate (0 → `StaleCredentialError` → rollback, geen doc-swap, geen `verificationRequest`,
>      `deleteDocumentById` draait niet → beoordeeld document blijft), hergebruikt het bestaande
>      `STALE_CREDENTIAL_MESSAGE`. Dezelfde guard op de twee siblings in dit bestand (de no-file `reverify`-tak
>      - `requestVerification`). +2 regressietests (`persist-toctou.test.ts`: verloren race → geen swap/geen
>        delete; gewonnen race → swap + oud doc opgeruimd). Gate: typecheck, lint, test, build, prettier groen.
> 2. **GEFIXT — MED (DOEL 1b, niet-deterministische undercount + badge-drift op de FREELANCER-cert-
>    dossierquery):** de certificaatdossierquery in `freelancerTasks` (`src/lib/actions/pending-tasks.ts`)
>    draaide met `take: MAX` (50) **zonder `orderBy`**, terwijl deze query de hoogste-prioriteit next-actions
>    voedt (afgewezen/verlopend/ontbrekend-verplicht cert + de compliance-gebonden certtaken van een lopende
>    samenwerking) én de superseded-detectie. De /certificaten-nav-badge (`signals.ts`) telt ditzelfde
>    dossier **onbegrensd** (exacte `count` + volledig VERIFIED-dossier + verplichte-doc-rijen) en claimt
>    gelijkheid met /acties. Zonder `orderBy` was de MAX-slice niet-deterministisch, én zodra het dossier
>    > 50 rijen telt viel een concreet, actie-behoevend cert willekeurig buiten de slice → het verscheen wél
>    > in de badge maar niet als next-action (inclusief de compliance-blokkerende collab-certtaken). Exact de
>    > drift-klasse van #1022 (admin-wachtrijen). **Fix:** de query is nu **onbegrensd** (geen `take`) — spiegelt
>    > de onbegrensde badge/pagina drift-proof (owner-scoped, inherent begrensd tot het persoonlijke
>    > certificaatdossier); dit maakt bovendien de superseded-detectie correcter (had álle VERIFIED-exemplaren
>    > van een type nodig). +1 regressietest (`pending-tasks-freelancer-credential-unbounded.test.ts`:
>    > dossierquery zonder `take`). Gate groen.
>
> ---

> **Datum:** 2026-08-02 (run 65) · **main-commit basis:** `055fd02e`
> **Uitkomst:** **1 bereikbaar defect GEVONDEN + GEFIXT** (status-integriteit HIGH, cross-actor TOCTOU) +
> **1 geparkeerd** (bevestigd bereikbaar, volgende increment). Twee parallelle Opus-audits (TOCTOU/status-
> integriteit → 1 gevonden; next-action cross-surface drift → 1 gevonden).
>
> 1. **GEFIXT — HIGH (DOEL 2, verboden `Application.status`-overgang via cross-actor TOCTOU):** de drie
>    `Application.status`-schrijvers — `changeApplicationStatus` + `bulkChangeApplicationStatus`
>    (`src/app/(protected)/kandidaten/actions.ts`, opdrachtgever) en `withdrawApplication`
>    (`src/app/(protected)/reacties/actions.ts`, ZZP'er) — deden een **ongeguarde**
>    `prisma.application.update({ where: { id } })` ná een niet-transactionele pre-lees + overgangscheck op
>    de stale `from`. Anders dan de eerdere TOCTOU-fixes (dubbelklik/twee tabs van één actor) racen hier
>    **twee verschillende actoren**: de opdrachtgever wijzigt de status terwijl de ZZP'er zijn reactie
>    parallel intrekt (`WITHDRAWN`, terminaal in `APPLICATION_TRANSITIONS`). In het venster landde de blinde
>    write dan alsnog op de al-ingetrokken/-besliste rij → een verboden overgang (WITHDRAWN→REJECTED,
>    ACCEPTED→WITHDRAWN — niet in de map, CLAUDE.md regel 3) + een valse notificatie ("afgewezen" naar een
>    ZZP'er die al introk, of "ingetrokken" met een verweesde samenwerking bij een net-geaccepteerde reactie).
>    De `app.collaboration`-guard is zelf uit de stale lees afgeleid en sluit dit venster niet. **Fix:**
>    compound-guarded `updateMany({ where: { id, status: from } })` in een interactieve transactie met
>    count-gate (0 → geen audit/notificatie); single-acties gooien "inmiddels gewijzigd", de bulk telt de
>    geracete rij als overgeslagen (`updated = eligible − raced`) + `{ timeout, maxWait }` op de lus-transactie.
>    +6 regressietests (`application-status-toctou.test.ts`). Gate: typecheck, lint, test (5573), build, prettier groen.
>
> **→ GEDAAN (2026-08-02, PR volgt):** de FREELANCER `/certificaten`-nav-badge
> (`src/lib/signals.ts`, `navBadges("FREELANCER")`, de `expiring`-`prisma.credential.count`) telde
> superseded verlopende VERIFIED-certs mee die `/acties` + de dashboard-rail (`pending-tasks.ts`,
> `supersededVerifiedCredentialIds`) al **uitsluiten**. Repro: ZZP'er vernieuwt door een nieuw cert van
> hetzelfde type aan te maken (oud verloopt < 30d, nieuw > 30d) → `/acties` toont 0 credential-taken, de badge
> toonde "1 attention" die nooit klaart. Exact de drift-klasse die #1026 op de **franchiser**-roster-badge
> dichtte, hier op de ZZP-eigen certificatenbadge. **Fix:** de badge spiegelt nu de supersede-aware
> aggregatie van /acties — `findMany` van het volledige VERIFIED-dossier → `supersededVerifiedCredentialIds`
> → in-memory telling van de in-venster verlopende, niet-superseded exemplaren. Eén bron van waarheid, kan
> niet meer driften. +2 regressietests (`signals.badge-gaps-run65.test.ts`). Gate: typecheck, lint, test
> (5580), build, prettier groen.
>
> ---

> **Datum:** 2026-08-01 (run 64) · **main-commit basis:** `748dc88a`
> **Uitkomst:** **2 bereikbare defecten GEVONDEN + GEFIXT** (status-/legale integriteit HIGH +
> next-action-consistentie MED). Drie parallelle Opus-audits (authz/IDOR/cross-tenant + document-
> privacy → **schoon, niets nieuws**; financiële/status-integriteit → **1 gevonden**;
> next-action-correctheid → **1 gevonden**) + live Playwright/Chromium-sweep over alle vier rollen
> (28 checks, 0 fails: DOEL 1 dashboards + /acties renderen; DOEL 2 privilege-escalatie → redirect
> naar /dashboard; junk/IDOR/SQLi/path-traversal-id's → soft-404/404, nooit 500; unauth → /login).
>
> 1. **GEFIXT — HIGH (DOEL 2, verboden veld-overschrijving via TOCTOU op de modelovereenkomst-vorm,
>    Wet-DBA integriteit):** `setAgreementTypeAction` (`src/app/(protected)/samenwerkingen/[id]/actions.ts`)
>    schreef `agreementType` (het type Wet-DBA modelovereenkomst) met een **ongeguarde**
>    `prisma.collaboration.update({ where: { id } })`, ná een niet-transactionele pre-lees van de teken-
>    timestamps (`agreementFreelancerSignedAt`/`agreementClientSignedAt`). De pre-lees is exact de
>    invariant die de actie belooft te bewaken ("vorm mag alleen wijzigen zolang niemand tekende"). In
>    het TOCTOU-venster kan een parallelle `signModelAgreementAction` (dubbele tab / gelijktijdige
>    partij) een handtekening zetten tussen de lees en de write; de blinde write landde dan alsnog op de
>    al-getekende rij → de handtekening hing **stil aan een ánder overeenkomsttype** dan getoond/
>    getekend. `src/lib/dba-audit.ts` leidt de misclassificatie-/compliance-risico's af uit
>    `agreementType` + de teken-timestamps sámen → dossier-corruptie op een legaal-significante rij.
>    Schending CLAUDE.md regel 2/3 (compound-guarded write; server-side waarheid). Exact de TOCTOU-klasse
>    die de rest van de cascade + de cron-taken al hadden (#1006/#1007/#1014/#1018/#1019) — de laatste
>    ongeguarde sibling. **Fix:** compound-guarded `updateMany({ where: { id,
agreementFreelancerSignedAt: null, agreementClientSignedAt: null } })` + count-gate (0 →
>    geweigerd, geen stille overschrijving); de pre-lees blijft als snelle UX-fout + ownership/anti-
>    oracle-guard. +3 regressietests (guard-where op beide-null; TOCTOU count 0 → weiger; vroege
>    weigering zonder write bij al-getekend). Gate: typecheck, lint, test, build, prettier groen.
> 2. **GEFIXT — MED (DOEL 1b, niet-deterministische undercount op /acties — admin-wachtrijen):** vier
>    begrensde admin-queries in `adminTasks()` (`src/lib/actions/pending-tasks.ts`: SUBMITTED-
>    verificaties, PENDING-gebruikers, open disputen, AVG-verwijderverzoeken) draaiden met `take: MAX`
>    (50) **zonder `orderBy`**. Prisma garandeert zonder expliciete ordering geen rijvolgorde → wélke
>    50-van-N rijen /acties (+ dashboard-rail + `pendingTaskCount`-badge) toont is arbitrair en kan per
>    request verschuiven. De nav-badges (`signals.ts`) tellen deze wachtrijen **exact/onbegrensd** en
>    claimen expliciet gelijkheid met /acties ("symmetrisch … zodat badge en /acties gelijk tellen").
>    Zodra één wachtrij > 50 groeit (aannemelijk voor de SUBMITTED-verificatiewachtrij, de kern-
>    differentiatie) valt een concrete, actie-behoevende rij willekeurig weg → een "ontbrekende taak"
>    die de badge tegenspreekt; welke ontbreekt is niet-deterministisch. Exact de bug-klasse van de
>    run-61-fix (franchiser acute-onbezet undercount) en inconsistent met de zuster-queries in dezelfde
>    `Promise.all` (`noShowReports`/`supportTickets`/`openHandoffs` hébben al `orderBy`). **Fix:**
>    `orderBy: { createdAt: "asc" }` op elk van de vier queries (oudst eerst, deterministisch). +1
>    regressietest (elke begrensde admin-query wordt met een `orderBy` aangeroepen). Gate groen.
>
> ---

> **Datum:** 2026-08-01 (run 63) · **main-commit basis:** `2c7ba1e6`
> **Uitkomst:** **1 bereikbaar defect GEVONDEN + GEFIXT** (financiële/status-integriteit) + **2 geparkeerd**.
> Drie parallelle Opus-audits (authz/IDOR/cross-tenant + document-privacy → **schoon**; financiële/status-
> integriteit → **1 gevonden**; next-action-correctheid → **1 gevonden**) + live smoke-sweep (unauth →
> alle protected routes 307 redirect naar /login; junk/IDOR-id's → geen 500).
>
> 1. **GEFIXT — HIGH (DOEL 2, verboden statusoverschrijving via TOCTOU op de prestatie-correctie):**
>    `updatePerformance` (`src/lib/cascade/performance-commands.ts`) was de énige schrijf-sibling in dat
>    bestand die de financiële velden (`hours`/`rateCents`/`amountCents`/`ortSegments`/`shifts`) wegschreef
>    met een **ongeguarde** `prisma.performance.update({ where: { id } })`. De statuscheck (`∈ {DRAFT,
REJECTED}`) leunt op de pre-transactionele `loadPerformance`-lees; tussen die lees en de write kan een
>    parallelle `submitPerformance` de rij al naar SUBMITTED hebben geflipt (dubbelklik/twee tabs op
>    `editAndResubmitPerformanceAction` — geen server-side dubbel-submit-rem). De blinde veld-write landde
>    dan **stil op de SUBMITTED-rij**: uren/tarief overschreven zónder nieuw `PERFORMANCE_SUBMITTED`-event,
>    zónder audit en zónder her-notificatie — waarna de opdrachtgever bij `approvePerformance` een bedrag
>    goedkeurt (concept-factuur) dat hij nooit zag. Schending CLAUDE.md regel 2/3 (compound-guarded write;
>    server-side waarheid). Exact het TOCTOU-patroon dat de rest van de cascade + de cron-taken al hadden
>    (#1006/#1007/#1014/#1018). **Fix:** compound-guarded `updateMany({ where: { id, status: perf.status } })`
>    - count-gate (0 → `CascadeError`, geen stille overschrijving). +3 regressietests (guard-where op de
>      geziene status; TOCTOU count 0 → weiger; happy path count 1). Gate: typecheck, lint, test, build,
>      prettier groen.
>
> **GEPARKEERD (deze run):**
>
> - **MED (DOEL 1b, next-action prioriteit-inversie, FREELANCER):** in `src/lib/next-actions.ts` staat
>   `credentialExpiringForCollab: 75` **boven** `vatDeadlineOverdue: 74`. Een **pre-due** nudge (vereist
>   certificaat van een lopende samenwerking verloopt bínnenkort, nog geldig; `COLLAB_CREDENTIAL_EXPIRY_
WINDOW_DAYS = 30`) rangschikt op `/acties`/badge/rail **boven** een **reeds-verstreken**, boete-dragende
>   BTW-aangifte (`vatDeadlineOverdue`, na de uiterste indieningsdatum met saldo). Dezelfde klasse als de
>   run-62-fix (`clientCascadeOverduePayment` post-due boven pre-due `vatDeadlineDueSoon`), nu voor het paar
>   credential-expiry↔BTW. Repro: FREELANCER met een ACTIVE samenwerking waarvan een vereist certificaat
>   over ~10 dagen verloopt (nog geldig) + een onbetaalde/onaangegeven verstreken BTW-kwartaal → de "verloopt
>   binnenkort"-taak staat boven "BTW te laat, boeterisico". **Fix (voorstel):** `credentialExpiringForCollab`
>   → 73 (onder `vatDeadlineOverdue` 74, boven `contractSign` 72 en `credentialExpiring` 70), + regressie-
>   assertie `P.vatDeadlineOverdue > P.credentialExpiringForCollab` in `tasks.test.ts`. **Reden geparkeerd:**
>   oordeelsafhankelijke herordening tussen twee domeinen (compliance↔fiscaal); losgehouden van de harde
>   integriteitsfix om die PR schoon-groen te houden. Prioriteit: MED.
>   **→ GEDAAN (2026-08-01):** `credentialExpiringForCollab` 75 → 73; +1 regressietest
>   (`P.credentialExpiringForCollab < P.vatDeadlineOverdue` én `> P.contractSign`). Post-due>pre-due
>   consistent met de code-conventie (clientCascadeOverduePayment 59 > vatDeadlineDueSoon 58).
> - **LOW (DOEL 1, functioneel — geen security):** `approveSubmittedPerformancesAction`
>   (`src/app/(protected)/prestaties/actions.ts`) scopet de query op `collaboration.company.userId === actor.id`;
>   een ADMIN-aanroeper vindt 0 rijen → de bulk-goedkeuring is een stille no-op voor admins. Faalt gesloten
>   (geen ongeautoriseerde toegang), dus geen beveiligingsdefect. Overweeg: admin-pad expliciet toestaan óf
>   de knop voor admins verbergen. Prioriteit: LOW.
>
> ---

> **Datum:** 2026-07-31 (run 62) · **main-commit basis:** `8906af07`
> **Uitkomst:** **3 bereikbare defecten GEVONDEN + GEFIXT.** Drie parallelle Opus-audits (authz/IDOR/
> cross-tenant + document-privacy → **schoon**; financiële/status-integriteit → **2 gevonden**;
> next-action-correctheid → **1 gevonden**) + live Playwright/Chromium-sweep over alle vier rollen
> (36 checks, 0 fails: DOEL 1 dashboards + /acties renderen; DOEL 2 privilege-escalatie → 307 redirect
> naar /dashboard; junk/IDOR/SQLi-id's → soft-404/404, nooit 500).
>
> 1. **GEFIXT — MED (DOEL 2, verboden statusovergang via TOCTOU op de abonnement-verval-cron):** de
>    verval-cron (`src/lib/subscription-expiry-task.ts`) schreef `CANCELLED` + `currentPeriodEnd:null`
>    met een **ongeguarde** array-vorm `subscription.update({ where: { id } })`. De kandidaten komen uit
>    een `findMany`-snapshot van vóór de transactie; verlengt de gebruiker in dat venster zijn abonnement
>    (Mollie-webhook schuift `currentPeriodEnd` vooruit — de rij blijft ACTIVE), dan overschreef de blinde
>    cron die rij alsnog naar CANCELLED → een net-betalende klant stil naar Gratis gedowngraded + een
>    valse "verlopen"-notificatie. Exact dezelfde TOCTOU-klasse als de verloop-cron (#1006) en
>    PAST_DUE→CANCELLED (#1007), hier nog niet gefixt. **Fix:** interactieve transactie + compound-guarded
>    `updateMany({ where: { id, status: "ACTIVE", currentPeriodEnd: <snapshot> } })` (guard óók op
>    `currentPeriodEnd` omdat een renewal de status ACTIVE laat maar de periode opschuift), count-gate
>    (0 → geen event/notify/audit), `EXPIRY_TX_OPTIONS`. `SubscriptionExpiryItem` draagt nu
>    `currentPeriodEnd`. +2 regressietests (TOCTOU-venster + compound-guard), faithful mock (updateMany
>    honoreert de guard, snapshot≠live).
> 2. **GEFIXT — MED (DOEL 2, verboden overgang PAID→OVERDUE via TOCTOU op de betaalherinner-cron):**
>    `runPaymentReminderTask` (`src/lib/payment-reminders-task.ts`) markeerde verstreken facturen OVERDUE
>    met een **ongeguarde** `invoice.update({ where: { id } })`; de `assert("APPROVED","OVERDUE")` toetst
>    alleen de statische lifecycle-kaart, niet de live rij. Bevestigt de opdrachtgever in het race-venster
>    de betaling via de reguliere cascade (APPROVED→PAID, compound-guarded in `apply.ts`), dan overschreef
>    de cron die rij alsnog PAID→OVERDUE — een overgang die **niet in de lifecycle-map** staat (CLAUDE.md
>    regel 3) — waardoor een al-betaalde factuur weer als "te laat" toonde en een valse aanmaning kon
>    triggeren. **Fix:** compound-guarded `updateMany({ where: { id, lifecycleStatus: "APPROVED" } })`,
>    count-gate. +2 regressietests (TOCTOU PAID-rij niet geflipt + compound-guard), faithful mock.
> 3. **GEFIXT — MED (DOEL 1b, prioriteit-inversie op /acties bij de opdrachtgever):** in
>    `src/lib/next-actions.ts` stond `clientCascadeOverduePayment: 57` **onder** `vatDeadlineDueSoon: 58`,
>    terwijl de code-commentaar expliciet "post-due, dus boven de pre-due nudge" belooft. Gevolg: een
>    **reeds-verstreken** cascade-betaalverplichting (echte, openstaande schuld) rangschikte op /acties,
>    de rail en de badge **onder** een louter naderende (nog-niet-verstreken, geen boeterisico)
>    BTW-aangifte-deadline van dezelfde opdrachtgever — verkeerde volgorde. **Fix:**
>    `clientCascadeOverduePayment` → 59 (blijft onder `overdueInvoice` 60, nu boven `vatDeadlineDueSoon`
>    58). +1 regressie-assertie (`> P.vatDeadlineDueSoon`) naast de bestaande band-asserties.
>
> **GEPARKEERD (deze run, LOW):** de betaalherinner-cron bepaalt `reminders`/`escalations` nog uit de
> stale snapshot; een factuur die in het race-venster PAID wordt, wordt niet meer OVERDUE gemarkeerd
> (fix 2) maar zou in dezelfde tick nog een reeds-geplande herinnering/aanmaning kunnen sturen. Smal
> venster, alleen bij AUTO_REMINDERS-entitlement; secundair aan de statusfout. Prioriteit: LOW.
> **→ GEFIXT (2026-08-01, PR #1018):** vóór het signaleren herleest `runPaymentReminderTask` nu de live
> `lifecycleStatus` (`invoice.findMany where id in signalInvoiceIds`) en laat alleen betaalbare facturen
> (APPROVED/OVERDUE) door — een in het venster PAID/bevroren/gecrediteerde factuur krijgt geen valse
> herinnering/aanmaning/escalatie meer. Spiegelbeeld van de guarded OVERDUE-markering. +2 regressietests.
>
> ---

> **Datum:** 2026-07-31 (run 61) · **main-commit basis:** `f90b143e`
> **Uitkomst:** **2 bereikbare defecten GEVONDEN + GEFIXT.** Drie parallelle Opus-audits (authz/IDOR/
> cross-tenant + document-privacy; financiële/status-integriteit; next-action-correctheid).
>
> 1. **GEFIXT — MED (DOEL 2, verboden statusovergang via een TOCTOU-race):** de credential-verloop-cron
>    (`src/lib/expiry-task.ts`) schreef `EXPIRED` met een **ongeguarde** `updateMany({ where: { id: { in } } })`.
>    De kandidaten komen uit een `findMany`-snapshot van vóór de transactie; dient de ZZP'er in dat venster
>    een nieuw bewijsstuk in (`VERIFIED → SUBMITTED`, `certificaten/actions.ts`), dan overschreef de blinde
>    cron die rij alsnog naar `EXPIRED` — een overgang die **niet in `CREDENTIAL_TRANSITIONS`** staat
>    (SUBMITTED→EXPIRED) en die de zojuist ingediende herbeoordeling stil terugdraaide + een valse
>    "verlopen"-notificatie stuurde. Schending CLAUDE.md regel 3 ("geen losse status-updates") + de
>    invariant "alleen een VERIFIED-credential kan verlopen". **Fix:** interactieve transactie +
>    compound-guarded `updateMany({ where: { id: { in }, status: "VERIFIED" } })` (zelfde TOCTOU-patroon als
>    de rest van de cascade), read-back van de daadwerkelijk geflipte rijen zodat notificaties/audit exact
>    de echt-verlopen certificaten dekken; de herinnerings-write is nu ook VERIFIED-guarded. +1 regressietest
>    (rood→groen) + faithful mock (honort de status-guard, interactieve `$transaction`).
> 2. **GEFIXT — MED (DOEL 1b, franchiser acute-onbezet undercount — bevestigd bereikbaar):** de open-diensten-
>    query in `franchiserTasks` (`src/lib/actions/pending-tasks.ts`) haalde **óók gevulde** diensten op en
>    sorteerde `startDate` nulls-first vóór de `take: 50`-slice. Een tenant met ≥50 gevulde, start-loze
>    diensten (open-eind zorgplaatsingen) vulde de hele slice → één écht acute, **ongevulde** dienst viel
>    eruit en verscheen ≥7 dagen niet op `/acties`, de rail of de badge. Dit is precies de run-60
>    "GEPARKEERD"-rand, nu met een reproducerende fixture bevestigd. **Fix:** query gescoped op
>    `collaborations: { none: { status: "ACTIVE" } }` (gelijkgetrokken met de zuster-`staleDiensten`-query),
>    zodat de volledige `MAX`-ruimte voor echt-open diensten is. +1 regressietest (faithful job.findMany-mock
>    met filter/orderBy/take, rood→groen).
>
> **Review-hardening (agent-review PASS, should-fix opgevolgd op fix 1):** (a) de interactieve
> transactie kreeg een expliciete `{ timeout: 120_000, maxWait: 10_000 }` — de array-vorm had geen
> wall-clock-limiet, dus zonder deze optie kon een piek richting de `take: 2000`-cap de Prisma-default
> van 5s overschrijden en de héle batch terugrollen. (b) De herinnerings-notificatie is nu **symmetrisch**
> met het verloop-pad: een intussen opnieuw-ingediend (SUBMITTED) credential krijgt géén "verloopt
> binnenkort"-melding meer (her-lezing op `status: VERIFIED` vóór notify + audit). +1 regressietest.
>
> **GEPARKEERD (deze run, LOW — nit uit agent-review):** bij twee gelijktijdige runs (admin-knop +
> cron/`run-all`) kan run B een door run A geflipte EXPIRED-rij in de read-back als eigen verloop
> meetellen → dubbele "verlopen"-melding/audit. Geen regressie (oude code was slechter, geen datacorruptie);
> `updateMany().count` geeft de echte flip-telling maar mist de ids voor notificaties. Prioriteit: LOW.
>
> **GEFIXT (2026-07-31, PR #1007):** `past-due-task.ts` — de `PAST_DUE → CANCELLED`-downgrade
> schreef met een ongeguarde single-row `subscription.update`. De kandidaten komen uit een
> `findMany`-snapshot van vóór de transactie; herstelt de gebruiker in dat venster zijn betaling
> (webhook: `PAST_DUE → ACTIVE`, een geldige overgang), dan overschreef de blinde cron die rij alsnog
> naar `CANCELLED` → een net-betalende klant stil naar Gratis gedowngraded + een valse "teruggezet naar
> Gratis"-notificatie. **Fix:** interactieve transactie + compound-guarded
> `updateMany({ where: { id, status: "PAST_DUE" } })` met count-gate (0 → niets schrijven), zelfde
> patroon als de verloop-cron (#1006); hardt ook twee gelijktijdige runs (dedupeKey-collisie). +2
> regressietests (reactivatie-in-venster → geen downgrade; compound-guard geverifieerd), faithful mock
> (`updateMany` honoreert `where.status`, interactieve `$transaction`).
>
> ---

> **Datum:** 2026-07-30 (run 60) · **main-commit basis:** `adc7cd3f`
> **Uitkomst:** **0 bereikbare defecten · 2 defense-in-depth-hardeningen GEFIXT** (500-randen op de
> financiële cascade-motor). Drie parallelle Opus-audits (authz/IDOR/cross-tenant + document-privacy;
> financiële/status-integriteit; next-action-correctheid) + live Playwright/Chromium-sweep over alle vier
> rollen → **schoon** op bereikbare defecten, consistent met runs 40–59.
>
> - **DOEL 1/1b (live):** alle vier rollen (zzp@/opdrachtgever@/franchise@/admin@) loggen in en renderen
>   dashboard + /acties zonder error-boundary (200, geen 5XX). **DOEL 2 (live):** privilege-escalatie
>   FREELANCER→`/admin/verificaties|disputen|statistieken` + `/franchise/diensten` en CLIENT→`/admin/*`,
>   `/franchise/diensten` → **redirect /dashboard** (geen toegang); junk/IDOR-id's (crafted CUID, SQLi,
>   path-traversal, XSS-string, nul-UUID) over `/samenwerkingen|/facturen|/opdrachten/[id]` → **nul 500's**
>   (anti-oracle soft-404); `/api/documents/{junk}` → **404**.
> - **Drie audits schoon:** authz-keten (`currentActor` live-rol, `tenantScopeWhere`/`ownsViaTenant`,
>   `canAccessDocument` owner/ADMIN, soft-404 op alle privé-routes, `requireRole` per admin/franchise-page),
>   financiële/status-integriteit (state-machines, VAT/ORT integer-cent + int4-headroom, dedupeKey +
>   compound-guarded `updateMany`, completion-guards in-tx), next-action-correctheid (elke emitter
>   kruis-gecheckt tegen zijn command-guard: juiste staat/partij, verdwijnt na afhandelen, geen dode knop).
>
> **GEFIXT — defense-in-depth (DOEL 2, "nooit 500" op de geld-cascade):**
>
> 1. **`computeOrt` gaf een stille NaN-subtotaal bij een onbekende categorie** (`src/lib/ort.ts`). Een
>    segment met een categorie buiten `ORT_CATEGORIES` gaf `rates[cat]=undefined` → `Math.round(NaN)` →
>    NaN-subtotaal dat ongemerkt de BTW/administratie in stroomde (bevestigd rood via een losse repro).
>    **Fix:** categorie-guard (`VALID_SEGMENT_CATEGORIES`) + niet-eindige-uren-guard → harde weigering
>    i.p.v. stille corruptie. Niet bereikbaar via huidige callers (alle schrijvers leveren enum-categorie);
>    borgt de pure motor. +2 tests.
> 2. **`performanceSubtotalCents` wierp een rauwe `Error` bij ontbrekende velden** (`src/lib/cascade/handlers.ts`).
>    **Fix:** `CascadeError` op de vier guards (rate/hours/amount null) — consistent met de rest van de
>    cascade-module en netjes doorgestuurd door de enige `instanceof CascadeError`-catch
>    (`samenwerkingen/actions.ts:440`). _(Nuance na de review: een rauwe `Error` mét NL-tekst passeert
>    `throwSafeActionError` op zichzelf óók veilig — `isInternalError` markeert alleen Prisma/system-fouten
>    als intern — dus dit is een consistentie-/leesbaarheidsverbetering, geen echte 500-fix. De 500-borging
>    van deze run zit in fix 1, de NaN-guard.)_ Niet bereikbaar (validatie/CSV-import weigeren deze staten
>    vóór approve); +1 test.
>
> _(Beide items waren door de financiële-integriteit-audit van run 59 als bevestigd-onbereikbaar
> geparkeerd — deze run geborgd zodat de laatste twee theoretische 500-randen op de geld-kern dicht zijn.)_
>
> **GEFIXT (2026-07-30d, PR #999):** de run-59-noot
> (`franchiserTasks` roster-expiry-aggregaat telde een superseded verlopend cert mee, ~r958) — bevestigd
> bereikbaar met een fixture (tenant-ZZP'er met twee VERIFIED-certs van hetzelfde type: oud verloopt
> binnenkort, nieuw dekt het type ruim). Nu onderdrukt via de pure `rosterExpiringByProfile`
> (`src/lib/credentials.ts`), die de bestaande `supersededVerifiedCredentialIds` per ZZP'er toepast —
> gelijk getrokken met de ZZP-zijde (`freelancerTasks`, run 59). +9 tests (6 pure-helper + 3 integratie).
>
> **GEPARKEERD (ongewijzigd, niet-bevestigd bereikbaar):** een franchiser-undercount-rand als één tenant >50
> gepubliceerde open diensten heeft (`acuteDienstIds` afgeleid van de `take:50`-slice) — undercount, geen
> dubbeltelling; geen fixture bevestigd.
>
> ---

> **Datum:** 2026-07-30 (run 59) · **main-commit basis:** `4db36002`
> **Uitkomst:** **2 bevindingen GEVONDEN + GEFIXT** (beide DOEL 1b — next-action-correctheid). Drie
> parallelle Opus-audits: authz/IDOR/cross-tenant/document-privacy **schoon** (anti-oracle-404's,
> `tenantScopeWhere`/`ownsViaTenant`, `canAccessDocument` owner/ADMIN-only, detail-IDOR → `notFound()`,
> geen client-side gating; niets exploiteerbaars gevonden), next-action-correctheid → **2 gevonden**.
>
> **GEVONDEN + GEFIXT — MED (DOEL 1b, valse verloop-nudge op een superseded certificaat):** de generieke
> expiry-loop in `freelancerTasks` (`src/lib/actions/pending-tasks.ts` ~r358) emitteerde
> `credentialFixTask(id, title, "expiring")` voor **elk** VERIFIED-cert dat binnen 30 dagen verloopt,
> puur op credential-id — zonder per-type supersede-check. **Repro:** ZZP'er met twee VERIFIED-certs van
> hetzelfde type (bv. LICENSE: oud verloopt over 10 dagen, nieuw over 400 — vroeg vernieuwd). Het oudere,
> eerder-vervallende exemplaar kreeg een "Certificaat verloopt binnenkort"-taak op `/acties` én de
> dashboard-"Volgende acties", terwijl de compliance per type al op het laatst-vervallende exemplaar leunt
> (`collaborationCredentialExpiryConcerns`) → een valse nudge die nooit nuttig verdwijnt (het nieuwe cert
> dekt het type al). **Geschonden regel:** CLAUDE.md regel 1 (server-side waarheid; client mag tonen, nooit
> beslissen) + "geen dode knoppen" + de next-action-belofte. **Fix:** pure
> `supersededVerifiedCredentialIds(creds, now)` (`src/lib/credentials.ts`) markeert een VERIFIED-cert als
> superseded zodra er een ánder nu-geldig VERIFIED-cert van hetzelfde type bestaat dat later óf onbeperkt
> geldig is; de loop onderdrukt die ids. De collab-gebonden expiry-tak leunde al op het laatst-vervallende
> exemplaar per type — deze fix trekt de generieke tak gelijk (geen drift). +7 tests (4 pure-helper, 3
> integratie via `freelancerTasks`: superseded → geen taak, solo → wél taak, onbeperkt-geldige vervanger).
>
> **GEVONDEN + GEFIXT — LOW (DOEL 1b, franchise-rollup-prioriteit hing van push-volgorde af):**
> `franchiseStaleDienstTask` en `franchiseStaleDienstRollupTask` (`src/lib/actions/tasks.ts`) deelden
> `P.franchiserServiceStale` (65), terwijl de doc-comment "lagere prioriteit dan de per-dienst-taak"
> belooft; de volgorde klopte alleen bij toeval (stabiele sort + push-volgorde). **Fix:** nieuwe band
> `P.franchiserServiceStaleRollup` (64, strikt onder de per-dienst-taak, boven `franchiserLeadFollowup` 50)
> → "specifieke oudste diensten voorop" is nu robuust, niet insertie-afhankelijk. +1 prioriteit-assertie-test.
>
> **GEPARKEERD (geen fix deze run) — speculatief, niet-bevestigd bereikbaar:**
>
> - ~~**`credentialExpiredForCollab`/franchiser-roster-aggregaat kan een superseded verlopend cert meetellen.**~~
>   **GEDAAN (2026-08-01, PR #1026):** de /acties-bron (`franchiserTasks` → `rosterExpiringByProfile`) sloot
>   superseded exemplaren al uit, maar de `/franchise/zzpers`-**nav-badge** (`signals.ts`, `expiringProfiles`)
>   telde nog via een rauwe `expiresAt: { gte, lte }`-query zónder supersede-check → de badge over-rapporteerde
>   t.o.v. /acties (een ZZP'er die vernieuwde door een nieuw cert van hetzelfde type aan te maken telde alsnog
>   mee). **Fix:** de badge draait nu exact dezelfde twee-staps, supersede-aware `rosterExpiringByProfile`-
>   aggregatie (kandidaat-scope → volledig VERIFIED-dossier per kandidaat → uitsluiting superseded) → badge =
>   /acties, één bron van waarheid, kan niet meer driften. +2 regressietests (superseded telt niet; gemengd
>   echt+superseded → count 1). Gate: typecheck, lint, test (5568), build, prettier groen.
>
> ---

> **Datum:** 2026-07-29 (run 58) · **main-commit basis:** `222d4b90`
> **Uitkomst:** **1 bevinding GEVONDEN + GEFIXT** (HIGH DOEL-1b: een dode "Contract ondertekenen"-
> next-action op elke PROPOSED samenwerking waarvan de plaatsing door een certificaat-gat is
> geblokkeerd — voor zowel ZZP'er als opdrachtgever). Verse prod-build (exit 0) + idempotente demo-seed
> (`SEED_DEMO=true`, ephemere SQLite `qa.db`, `next start` op 3100). Live Playwright/Chromium over alle
> vier rollen.
>
> - **DOEL 1** echte actie: ADMIN "Goedkeuren" op `/admin/verificaties` → knoppen 6→5 (server-waarheid
>   veranderde). **DOEL 1b** `/acties` per rol logisch en rol-correct (franchise: "Sofia niet inzetbaar" +
>   "1 dienst dreigt onbezet"). **DOEL 2** adversarieel (allemaal geweigerd, nul 5XX): privilege-escalatie
>   zzp/client/franchise → 307/redirect /dashboard; IDOR privé-document (Youssef VOG) → 404; cross-party/
>   cross-tenant factuurdetail + samenwerkingsdossier → **soft-404** (200-status, nul gelekte partijdata —
>   bevestigd via body-render tegen een owner-control (Sanne ziet wél haar eigen factuur/samenwerking) én
>   een junk-id-control (identieke lengte, nul velden)); junk/traversal/SQLi/XSS-id (6 varianten × 3 routes)
>   → soft-404, nooit 500; onauth → login. Drie parallelle Opus-audits: authz/IDOR/cross-tenant **schoon**
>   (franchise-tenant-scoping, privé-routes, admin-oppervlak geverifieerd), financiële/status-integriteit
>   **schoon** (cascade-completion-guards, VAT/credit-math, idempotentie via dedupeKey/compound-updateMany;
>   één DiD-noot geparkeerd), next-action-correctheid → **1 HIGH gevonden**.
>
> **GEVONDEN + GEFIXT — HIGH (DOEL 1b, dode "Onderteken"-next-action bij geblokkeerde plaatsing):** de
> item-engine (`freelancerTasks` regel ~473 + `clientTasks` regel ~827 in `src/lib/actions/pending-tasks.ts`)
> pushte `contractSignTask` (resolver `oneClick`, band `P.contractSign` 72) **onvoorwaardelijk** op elke
> `PROPOSED` samenwerking. Maar `signContract` (`src/lib/cascade/contract-commands.ts:59-76`) **gooit**
> zolang de plaatsing door een certificaat-gat is geblokkeerd (een vereist certificaat ontbreekt of is
> verlopen → `computeCompliance` = NON_COMPLIANT → `complianceBlocksPlacement`). **Repro:** een `PROPOSED`
> samenwerking waarvan de opdracht een `JobCredentialRequirement` (`required`) heeft en de ZZP'er mist dat
> type of het is verlopen. `/acties`, de dashboard-"Volgende acties" én de zijbalk-badge tonen zowel de
> ZZP'er áls de opdrachtgever een `oneClick` "Contract ondertekenen"; klikken → `signContract` weigert →
> de samenwerking blijft PROPOSED → de taak verdwijnt nooit. Het samenwerkingsdetail
> (`samenwerkingen/[id]/page.tsx:611-637`) verbergt die knop in exact dezelfde staat al (ZZP'er ziet
> "Naar mijn certificaten", opdrachtgever géén knop) → de actie-surfaces spreken het detail (en de server)
> tegen. Bij de opdrachtgever is het bovendien de **verkeerde partij aan zet** (alleen de ZZP'er levert het
> bewijsstuk aan) zónder compensatie: `clientCredentialAlerts` scoopt alleen `ACTIVE`, niet `PROPOSED`, dus
> de opdrachtgever kreeg géén compliance-nudge — alleen de dode teken-knop. **Geschonden regel:** CLAUDE.md
> regel 1 (server-side is de waarheid; client mag tonen, nooit beslissen) + Designfilosofie/AUTO-MODE §5
> "geen dode knoppen" + de next-action-belofte (juiste stap, juiste partij aan zet). **Fix:** nieuwe pure
> helper `collaborationPlacementBlocked(requiredTypes, credentials, now)` (`src/lib/collaborations.ts`)
> spiegelt exact de command-guard (`computeCompliance` + `complianceBlocksPlacement`, dezelfde functies →
> geen drift). Beide emitters onderdrukken `contractSignTask` zodra de plaatsing geblokkeerd is; de ZZP'er
> houdt zijn échte volgende stap (`credential-collab-missing`/`credential-collab-expired`, die dezelfde
> `collabs` gebruiken en dus óók PROPOSED dekken). De opdrachtgever-collab-query kreeg
> `credentialRequirements` + `freelancer.credentials` voor de gate. Rood→groen: +7 tests
> (`pending-tasks-contract-sign-compliance.test.ts`: freelancer missing/expired → geen taak, wél de
> aanlever-taak; geldig/in-beoordeling → wél; opdrachtgever verkeerde-partij-onderdrukking, compliant → wél,
> geen-harde-eis → wél).
>
> **GEPARKEERD (geen fix deze run) — LOW/latent, defense-in-depth:**
>
> - ~~**`assertPerformanceWithinLimits` heeft geen expliciete `rateCents`-bovengrens** (`performance-commands.ts`).~~
>   **GEFIXT (2026-07-29, PR #974):** `MAX_PERFORMANCE_RATE_CENTS = 200_000` (€2.000/u, gelijk aan de
>   `collaborationProposalSchema`-cap) toegevoegd in `validation.ts`; de HOURS-tak weigert nu een niet-eindig
>   tarief én een tarief boven het plafond. De server-guard is zelfstandig i.p.v. afhankelijk van de upstream-
>   invariant. +6 tests.

---

> **Datum:** 2026-07-29 (run 57) · **main-commit basis:** `ef6608c6`
> **Uitkomst:** **2 bevindingen GEVONDEN + GEFIXT** (1 HIGH DOEL-1b next-action-asymmetrie: een volledig
> ONTBREKEND vereist niet-verplicht certificaat gaf de ZZP'er géén actie terwijl de opdrachtgever wél een
> "mist een vereist certificaat"-alert kreeg — de missing/DRAFT-spiegel van de EXPIRED-fix uit run 56;
> 1 MED/HIGH DOEL-2 audit-/status-integriteit: TOCTOU / dubbel-indienen op `approveAndSubmit` (aangifte)).
> Verse prod-build (exit 0) + idempotente demo-seed (`SEED_DEMO=true`, ephemere SQLite `qa.db`, `next start`
> op 3100). Live Playwright/Chromium over alle vier rollen.
>
> - **DOEL 1** echte actie: ADMIN "Goedkeuren" op `/admin/verificaties` → knoppen 6→5 (status veranderde),
>   `/acties` afgehandelde actie verdween. **DOEL 1b** `/acties` per rol logisch en rol-correct (zzp: verplicht
>   document ontbreekt + 4 open; client: 1 nieuwe reactie + bedrijfsprofiel 90%; franchise: ZZP'er niet inzetbaar
>   - onbezette dienst; admin: 15 certificaat-/ticket-beoordelingen). **DOEL 2** adversarieel (allemaal geweigerd,
>     nul 5XX): privilege-escalatie zzp/client/franchise → 11×/admin/_ + 4×/franchise/_ → 307 /dashboard; IDOR
>     privé-document (youssef VOG) → 404; cross-party/cross-tenant samenwerking/factuur → soft-404 "Niet gevonden"
>     (bevestigd via body-render: nul gelekte partijnamen, tekstlengte identiek aan de junk-id-control); junk/
>     traversal/SQLi/XSS-id (6 varianten) → soft-404, nooit 500; onauth → 307 /login. Screen-load-sweep over 34
>     rol-schermen: 0 error-boundaries, 0 5XX. Twee parallelle Opus-audits (next-action-correctheid → 1 HIGH gevonden;
>     mutatie-authz/TOCTOU → 1 MED/HIGH gevonden). Malicieuze-invoer-validatie (negatief/NaN/absurd/datum, per-segment
>     ORT-grens) geïnspecteerd — robuust.
>
> **GEVONDEN + GEFIXT — HIGH (DOEL 1b, ontbrekend vereist certificaat — next-action-asymmetrie):** voor een
> `ACTIVE`/`PROPOSED` samenwerking waarvan de opdracht een `required` `JobCredentialRequirement` van een
> NIET-verplicht type (`LICENSE`/`DIPLOMA`/`CERTIFICATE`/`OTHER`) heeft, en de ZZP'er heeft géén bruikbaar
> exemplaar van dat type (geen rij, of alléén een `DRAFT`), kreeg **alleen de opdrachtgever** een actie
> (`clientComplianceTask`, prio `complianceRipple` 85, "mist een vereist certificaat — vraag de ZZP'er om aan te
> leveren"), terwijl de **ZZP'er** — de énige die het bewijsstuk kan aanleveren — **niets** in `/acties`, de
> dashboard-rail of de zijbalk-badge zag. `computeCompliance` bucket zo'n type als `missing`; `clientHasComplianceAction`
> vuurt op `missing`, maar de freelancer-tak (`freelancerTasks`) had géén emitter voor `missing`: `mandatoryDocumentTask`
> dekt alleen VOG/verzekering, `credentialFixTask("rejected")` vereist een REJECTED-rij, en `collaborationExpiredRequiredCredentials`
> slaat een volledig ontbrekend type expliciet over (`if (!cred) continue`). Dit is precies de missing/DRAFT-variant
> van de EXPIRED-asymmetrie die run 56 dichtte. **Geschonden regel:** CLAUDE.md regel 1 (server-side waarheid, één bron —
> dezelfde vereist-cert-gap gaf een live client-actie én een lege freelancer-lijst) + de next-action-belofte
> ("de juiste eerstvolgende stap voor de juiste partij aan zet"). **Fix:** nieuwe pure helper
> `collaborationMissingRequiredCredentials` (`src/lib/collaboration-credential-expiry.ts`) — per vereist niet-verplicht
> type zonder geldig/in-beoordeling/verlopen exemplaar één zorg, met optioneel de meest recente `DRAFT`-id als
> aanlever-kandidaat; nieuwe taak `credential-collab-missing` (prio `credentialMissingForCollab: 81`, net onder
> REEDS-verlopen 82, boven afgewezen 80; deep-link `/certificaten/{draftId}/bewerken` of `/certificaten/nieuw?type=<T>`).
> Aanroeper sluit verplichte én reeds-afgewezen typen uit → geen dubbele/tegenstrijdige rij. Rood→groen: +6 helper-tests
>
> - 5 surface-tests (`pending-tasks-missing-collab-credential.test.ts`: ontbrekend → aanlever-taak; DRAFT → deep-link
>   naar concept; geldig/SUBMITTED → geen taak; afgewezen → alleen fix-taak).
>
> **GEVONDEN + GEFIXT — MED/HIGH (DOEL 2, TOCTOU / dubbel-indienen op `approveAndSubmit`):** `approveAndSubmit`
> (`src/app/(protected)/ontzorgd/aangifte/actions.ts`) las de status één keer (stale snapshot), asserteerde de
> overgang op die lezing, riep dan **`partner.submit()`** aan (een EXTERN, onomkeerbaar effect — in productie de
> echte SBR/Digipoort-aangifte bij de Belastingdienst) en schreef pas dáárna blind terug via `update({ where: { id } })`
> — géén compound-guard, anders dan alle andere cascade-commando's (`resolveDispute`/`openDispute`/invoice/performance
> gebruiken al de guarded `updateMany`). **Repro:** twee gelijktijdige aanroepen (dubbelklik "Definitief indienen",
> herhaalde/replayed server-action-POST) op één `CONCEPT_KLAAR`-verzoek passeren beide de assert en roepen **beide**
> `partner.submit()` aan → dubbele aangifte bij de Belastingdienst + twee `TAX_FILING_SUBMITTED`-auditregels (met
> verschillende `submissionRef`) voor één verzoek, terwijl de kolom stil alleen de laatste ref houdt. **Geschonden
> regel:** CLAUDE.md regel 5 (audit exact één keer per reëel event) + regel 1 (server-side waarheid, symmetrisch over
> concurrente paden). **Fix:** claim de overgang ATOMISCH vóór het externe effect met compound-guarded
> `updateMany({ where: { id, status: "CONCEPT_KLAAR" }, data: { status: "INGEDIEND", clientApprovedAt } })`; `count === 0`
> → concurrente indiening won → gooit, roept de partner NIET aan, schrijft geen tweede audit. Faalt `partner.submit()`
> ná de claim → compensatie zet terug naar `CONCEPT_KLAAR` (retry blijft mogelijk). `revokeFiling` kreeg dezelfde
> compound-guard (voorkomt dubbele `TAX_FILING_REVOKED`-audit). **Escalatie (MENSENWERK.md §5):** vóór een live
> `TAX_PARTNER_DRIVER` (echte SBR/Digipoort) moet dit dichtgetimmerd blijven — het pad leidt tot een echte
> aangifte. Rood→groen: +5 tests (`approve-submit-toctou.test.ts`: gewonnen → één submit + één audit; verloren →
> geen submit/audit; submit-faal → compensatie; revoke gewonnen/verloren).

---

> **Datum:** 2026-07-28 (run 56) · **main-commit basis:** `9fa656bb`
> **Uitkomst:** **2 bevindingen GEVONDEN + GEFIXT** (1 HIGH DOEL-1b next-action-asymmetrie: verlopen vereist
> niet-verplicht certificaat gaf de ZZP'er géén actie terwijl de opdrachtgever wél een "certificaat verlopen"-
> alert kreeg; 1 MED DOEL-2 audit-integriteit: TOCTOU op `resolveDispute`). Verse prod-build (exit 0) + idempotente
> demo-seed (`SEED_DEMO=true`, ephemere SQLite `qa.db`, `next start` op 3100).
>
> - Live Playwright/Chromium over alle vier rollen: login → /dashboard voor admin/zzp/client/franchise (4/4),
>   alle rol-schermen laden zonder 5XX/pageerror. **DOEL 1** echte actie: ADMIN "Goedkeuren" op /admin/verificaties →
>   knoppen 6→4 (status veranderde). **DOEL 1b** /acties per rol logisch en rol-correct (admin: certificaat-beoordelingen;
>   zzp: ontbrekend document + BTW-aangifte + reactie + uitnodiging; client: reacties beoordelen + profiel; franchise:
>   ZZP'er niet-inzetbaar + onbezette dienst). **DOEL 2** adversarieel (allemaal geweigerd, nul 5XX): privilege-escalatie
>   zzp/client/franchise → 7×/admin/_ + 4×/franchise/_ → 307 /dashboard; IDOR factuur-PDF/dossier/dba-dossier/modelovereenkomst
>   → eigen 200, andermans 404; junk/traversal/SQLi-id (6 varianten × 4 routes) → 404 nooit 500; onauth → 307 /login.
>   Drie parallelle Opus-audits (authz/IDOR/cross-tenant/document-privacy — **schoon**; malicieuze invoer/verboden
>   statusovergangen/financiële integriteit — 1 MED gefixt + 1 latent geparkeerd; next-action-correctheid — 1 HIGH gefixt).
>
> **GEVONDEN + GEFIXT — HIGH (DOEL 1b, next-action-asymmetrie op verlopen vereist certificaat):** de freelancer-
> tak van de next-action-engine (`freelancerTasks` in `src/lib/actions/pending-tasks.ts`) emitte per certificaat
> alleen bij `REJECTED` (fix-taak) en `VERIFIED`-maar-binnenkort-verlopend (verval-taak). Een certificaat dat REEDS
> `EXPIRED` is (door `runExpiryTask`, voor élk `CredentialType`) viel door álle drie de freelancer-emitters: geen
> `credential-fix`, geen `mandatory-document` (die dekt alleen VOG/verzekering), en `collaborationCredentialExpiryConcerns`
> slaat al-verlopen certificaten expliciet over ("al verlopen → elders afgehandeld" — maar "elders" bestond alleen voor
> verplichte typen). **Repro:** FREELANCER met een ACTIVE samenwerking waarvan de opdracht een `JobCredentialRequirement`
> van type `CERTIFICATE`/`DIPLOMA`/`LICENSE`/`OTHER` heeft; hun enige geverifieerde certificaat van dat type verloopt →
> cron zet `EXPIRED`. `/acties` en de dashboard-"Volgende acties" tonen de ZZP'er **niets**, terwijl `clientComplianceTask`
> (prio 85) de opdrachtgever wél "Certificaat van X is verlopen — vraag om vernieuwing" toont. De ZZP'er is de énige die
> kan handelen (bewijsstuk vernieuwen) maar zag geen actie — en het certificaat verdween juist op het urgente moment
> (vlak daarvoor toonde het nog "verloopt over N dagen"). **Geschonden regel:** CLAUDE.md — server-side waarheid + de
> next-action-belofte ("vraagt het de juiste eerstvolgende stap voor de juiste partij aan zet?"): een ontbrekende, niet-
> verdwijnende/niet-escalerende next-action is een DEFECT. **Fix:** nieuwe pure helper `collaborationExpiredRequiredCredentials`
> (samenwerking-gebonden, per type, alleen als er géén geldige vervanger is; kiest het meest recent verlopen exemplaar als
> vernieuw-kandidaat) + nieuwe taak `credential-collab-expired` (prio `credentialExpiredForCollab: 82`, deep-link naar het
> vernieuw-formulier). Aanroeper sluit verplichte typen (eigen mandatory-taak) én reeds-afgewezen typen (eigen fix-taak) uit
> → geen dubbele/tegenstrijdige rij. Rood→groen: +5 helper-tests (verlopen zonder vervanger; VERIFIED-voorbij-vervaldatum;
> géén zorg met geldige vervanger; niet-vereist type genegeerd; meest-recent-verlopen + dedup over samenwerkingen).
>
> **GEVONDEN + GEFIXT — MED (DOEL 2, TOCTOU op `resolveDispute`):** `resolveDispute` (`src/lib/cascade/dispute-commands.ts`)
> las `col.disputedAt` één keer (stale snapshot) en deed daarna in een APARTE array-`$transaction` een onvoorwaardelijke
> `collaboration.update({ where: { id } })` — géén compound-guard, ander dan zijn zuster `openDispute` (die run 55 juist
> atomair maakte) en alle andere cascade-commando's. **Repro:** twee admins (of één admin die het formulier dubbel verstuurt)
> roepen gelijktijdig `resolveDisputeAction(colId)` aan op een disputed samenwerking; beide passeren de pre-check en schrijven
> beide hun EIGEN `DISPUTE_RESOLVED` domein-event, audit-rij én twee "Dispuut opgelost"-notificaties → dubbele audit-/event-
> rijen voor één reëel dispuut + dubbele meldingen aan beide partijen. **Geschonden regel:** CLAUDE.md regel 5 (audit exact
> één keer per reëel event) + regel 1 (server-side waarheid, symmetrisch over concurrente paden). **Fix:** interactieve
> `$transaction(async (tx) => …)` met compound-guarded `updateMany({ where: { id, disputedAt: { not: null } }, data: {…} })`;
> `count === 0` → concurrente resolve won → hele transactie rolt terug (geen tweede event/notificatie/audit). Rood→groen:
> `resolve-dispute-toctou.test.ts` (+3: rolrem vóór alles; verloren race → geen tweede fanout + guard-where = id+disputedAt-not-null;
> gewonnen race count:1 → één event + twee notificaties + één audit).
>
> **GEPARKEERD (geen fix deze run) — LOW/latent, defense-in-depth:**
>
> - ~~**`assertPerformanceWithinLimits` begrenst `hours`, niet de `ortSegments`**~~ **GEDAAN (2026-07-28d, PR #960)** —
>   (`src/lib/cascade/performance-commands.ts`). De doc-comment claimde "dekt élk pad, onafhankelijk van het formulier",
>   maar de subtotaal-som loopt via `ortSegments` (`handlers.ts performanceSubtotalCents`), niet `hours`. Vandaag NIET
>   bereikbaar (beide call-sites leiden `hours` af als segment-som, `validatePerformanceForm` begrenst die), dus geen live
>   exploit — maar de "onafhankelijk van het formulier"-garantie was voor de ORT-dimensie vals. **Fix:** bij `type==="HOURS"`
>   en `ortSegments?.length` valideert de guard nu de segment-som direct — elk segment-uur eindig (`Number.isFinite`, vangt
>   NaN/Infinity die door de `< 0`-check glippen) + niet-negatief, som `> 0` en `≤ MAX_PERFORMANCE_HOURS`; symmetrisch met de
>   `hours`-grens, zelfde cap/meldingen. +6 tests (NaN/Infinity, negatief segment, som=0, som > MAX zónder `hours`, normale
>   verdeling toegestaan, MILESTONE-pad ongemoeid). Gate: typecheck, lint, test, build, prettier groen.
> - ~~**Cosmetisch: `AVAILABILITY_UPDATED` mist een label in `src/lib/audit-labels.ts`**~~ **GEDAAN (2026-07-28f, PR #962)** —
>   bleek breder dan één actie: **54** geëmitteerde audit-acties misten een NL-label (o.a. `SHIFT_HANDOFF_*`, `NO_SHOW_*`,
>   `CREDENTIAL_VERIFY_BLOCKED`, `IDENTITY_VERIFY_BLOCKED`, `DOCUMENT_DELETE_DENIED`, `DISPUTE_ESCALATED`, retentie-snoei,
>   systeem-zelftests). Admin- én bemiddelaar-audit-logboek + CSV-export toonden die als ruwe fallback. Alle 54 gelabeld +
>   een **drift-gate** (`hasAuditActionLabel` + broncode-scan-test) die faalt zodra een nieuw geëmitteerde actie geen label
>   heeft. Puur presentatie, geen schema/mutatie/auth-oppervlak. Gate groen.

---

> **Datum:** 2026-07-28 (run 55) · **main-commit basis:** `591bb031`
> **Uitkomst:** **2 bevindingen GEVONDEN + GEFIXT** (1 HIGH DOEL-2 financiële/status-integriteit: TOCTOU op
> `openDispute`; 1 LOW-MED DOEL-1b cross-surface badge-divergentie: FREELANCER cascade-badge zonder `orderBy`).
> Verse prod-build (exit 0) + idempotente demo-seed (`SEED_DEMO=true`, ephemere SQLite `qa.db`, `next start` op 3100)
>
> - live Playwright/Chromium-smoke over alle vier rollen (**30/30 PASS**: login → /dashboard voor admin/zzp/client/
>   franchise; /acties + /dashboard laden zonder crash; nul pageerror; DOEL 1 echte actie ADMIN "Goedkeuren" op
>   /admin/verificaties → Goedkeuren-knoppen 6→5; DOEL 2 privilege-escalatie ZZP/CLIENT/FRANCHISER → /admin/\*+/franchise
>   → redirect /dashboard; IDOR ZZP → vreemde factuur-PDF (Iris/Emma) → 404, eigen factuur-PDF → 200,
>   junk/traversal-id → 404 nooit 500; robuustheid onzin-id op detailroutes → geen 500) + drie parallelle Opus-audits
>   (authz/IDOR/cross-tenant/document-privacy — **schoon**, geen novel defect; malicieuze invoer/verboden
>   statusovergangen/financiële integriteit — 1 HIGH, nu gefixt; next-action-correctheid — 1 LOW-MED, nu gefixt).
>
> **GEVONDEN + GEFIXT — HIGH (DOEL 2, TOCTOU op `openDispute`):** `openDispute`
> (`src/lib/cascade/dispute-commands.ts`) borgde de "dispuut alleen op een ACTIVE samenwerking"-regel alleen tegen een
> **stale in-memory snapshot** (`col.status`, gelezen vóór een awaited admin-`findMany`), en deed de write via de
> array-vorm `prisma.$transaction([...])` met `collaboration.update({ where: { id } })` — **enkel op id, geen
> compound-guard**. Elke zuster-command die collaboration-state raakt (`confirmPayment`/`cancel` via
> `persistEventAndEffects`, `applyCollaborationStatusChange`) her-verifieert de status BINNEN de write via een
> compound-guarded `updateMany({ where: { id, status } })`; dit ene pad niet. **Repro:** FREELANCER/CLIENT roept
> `openDisputeAction(colId, reden)` aan op een ACTIVE samenwerking; server leest `status: "ACTIVE"`, passeert de rem,
> en awaitет de admin-lookup. In dat venster commit een concurrente `confirmPaymentAction` (compound-guarded,
> ACTIVE→COMPLETED) éérst; `openDispute`'s transactie schrijft daarna blind `disputedAt` op de nu-COMPLETED rij. **Gevolg:**
> `creditInvoice` checkt `assertNotDisputed` (met `allowCompleted:true` juist zodat een betaalde klus nog gecorrigeerd
> kan worden) → met `disputedAt` gezet is de correctie-/creditfactuur-route permanent geblokkeerd (griefing, bereikbaar
> door twee partijen of één partij met twee tabs rond het moment van eindbetaling/annulering). Distinct van run 53 (fixte
> alleen de sequentiële/naïeve bypass) en run 54 (zelfde TOCTOU-klasse, ander pad: `applyExternalVerification`).
> **Geschonden regel:** CLAUDE.md regel 3 (statusovergangen via een atomair-afgedwongen rem, niet tegen een stale
> snapshot) + regel 1 (server-side waarheid, symmetrisch over álle paden incl. het concurrente). **Fix:**
> interactieve `$transaction(async (tx) => …)` met compound-guarded `tx.collaboration.updateMany({ where: { id,
status: "ACTIVE", disputedAt: null }, data: { disputedAt, disputeReason } })`; `count===0` → her-lees in-tx om de juiste
> melding te kiezen ("al een open dispuut" vs "alleen op een actieve samenwerking") → hele transactie rolt terug, géén
> event/notificaties/audit. Een gelijktijdige eindbetaling/annulering wint nu. Rood→groen: `open-dispute-toctou.test.ts`
> (+3: verloren race COMPLETED → geen write + guard-where = id+ACTIVE+disputedAt:null; verloren race door concurrent
> dispuut → "al een open dispuut"; gewonnen race count:1 → event + tegenpartij- + admin-notificatie + audit). _(MENSENWERK:
> vóór livegang — mens kan checken of een productie-record ooit door deze race is geraakt: een `Collaboration` met
> `disputedAt != null` én `status` COMPLETED/CANCELLED.)_
>
> **GEVONDEN + GEFIXT — LOW-MED (DOEL 1b, cross-surface badge-divergentie boven 50):** de FREELANCER
> `/samenwerkingen`-nav-badge (`cascadeWork`, `navBadges` in `src/lib/signals.ts`) telde lopende/voorgestelde
> samenwerkingen via een `collaboration.findMany` **zonder `orderBy`**, terwijl de autoritaire /acties-bron voor exact
> ditzelfde signaal (`freelancerTasks`, `pending-tasks.ts`) dezelfde scope met `orderBy: { updatedAt: "desc" }` + `take:
MAX` (=50) leest. Beide cappen op 50 (`CASCADE_SCAN_LIMIT === MAX`); bij >50 lopende/voorgestelde samenwerkingen pakten
> de twee (structureel verschillende) queries een andere 50-rij-subset → een ander cascade-taakaantal → de badge
> divergeerde van /acties + de dashboard-rail. Exact de klasse die run 54 al voor de FRANCHISER credential-expiry-badge
> dichtte, niet toegepast op deze sibling. **Geschonden regel:** DOEL 1b (één bron van waarheid; badge/acties/detail
> gelijk). **Fix:** `orderBy: { updatedAt: "desc" }` op de badge-query → beide truncaten identiek, matcht
> `pending-tasks.ts`. Rood→groen: `signals.freelancer-cascade-order.test.ts` (+1: cascade-collab-query heeft orderBy
> updatedAt desc + take 50). Full gate: typecheck, lint, test, build, prettier groen.

> **Datum:** 2026-07-27 (run 54) · **main-commit basis:** `d85fd436`
> **Uitkomst:** **4 bevindingen GEVONDEN + GEFIXT** (1 HOOG financiële/verificatie-integriteit: TOCTOU op
> credential-zelfverificatie; 2 MED/LOW security existence-oracle; 1 LOW-MED DOEL-1b cross-surface
> badge-divergentie). Verse prod-build (exit 0) + idempotente demo-seed (`SEED_DEMO=true`, ephemere SQLite
> `qa.db`, `next start` op poort 3100) + live persona-smoke over alle vier rollen (Playwright/Chromium,
> **40/40 PASS**: login → /dashboard voor admin/zzp/client/franchise; `/acties` + `/dashboard` laden zonder
> crash; nul 5xx; DOEL 2 privilege-escalatie ZZP/CLIENT/FRANCHISER → `/admin/*`+`/franchise` → redirect
> `/dashboard`; junk/traversal/sqli-id → soft-404/404, nooit 500) + IDOR-fetch (ZZP/FRANCHISER → vreemd
> document/dossier/factuur-PDF → 404/soft-404, geen data-lek; eigenaar-invoice-PDF 200, vreemde 404; soft-404
> lekt geen tegenpartij-PII) + DOEL-1 echte actie (ADMIN "Goedkeuren" op `/admin/verificaties` → knoppen 6→5,
> next-action verdwijnt) + drie parallelle Opus-audits (authz/IDOR/cross-tenant/document-privacy;
> malicieuze invoer/verboden statusovergangen/financiële integriteit; next-action-correctheid).
>
> **GEVONDEN + GEFIXT — HOOG (DOEL 2, financiële/verificatie-integriteit — TOCTOU op credential-zelfverificatie):**
> `applyExternalVerification` (`src/app/(protected)/certificaten/actions.ts`) — de gedeelde write van de DUO/BIG-
> zelfverificatie — deed een **losse `credential.update({ where: { id } })`** ná de externe netwerkcall
> (`getDiplomaVerifier()/getBigVerifier().verify(...)`, echte HTTP-latency in productie), met `assertTransition`
> alleen tegen de **stale in-memory `fromStatus`** die vóór de call werd gelezen (`loadOwnedCredential`). Elke
> zuster-statusmutatie (`verifyCredential`/`rejectCredential`, `sendInvoice`/`markInvoicePaid`, `setBillingStatusAction`)
> gebruikt de compound-guarded `updateMany({ where: { id, status: from } })` + `count===0`-rem juist tegen deze race;
> dit ene pad niet. **Repro:** FREELANCER start DUO/BIG-verificatie op een SUBMITTED-diploma/BIG-registratie; terwijl
> de HTTP-call loopt wijst een ADMIN dezelfde credential af (`REJECTED`, guarded updateMany matcht nog SUBMITTED →
> slaagt); de call resolvet `verified:true` en `applyExternalVerification` overschrijft de rij blind naar
> `VERIFIED, rejectionReason:null` — een ongeldige **REJECTED→VERIFIED**-overgang die de admin-afwijzing van een
> mogelijk-frauduleus certificaat stil ongedaan maakt, zónder opzet (ongelukkige timing volstaat). Raakt de
> kern-differentiatie (geverifieerde VOG/diploma/BIG gate placement). **Geschonden regel:** CLAUDE.md regel 3
> (statusovergangen via expliciete rem — hier tegen een stale snapshot i.p.v. de actuele rij) + regel 1 (server-side
> waarheid, symmetrisch over álle paden incl. het concurrente). **Fix:** `applyExternalVerification` schrijft nu via
> een interactieve `$transaction(async (tx) => …)` met compound-guarded `tx.credential.updateMany({ where: { id,
status: fromStatus }, data: { status: "VERIFIED", … } })`; `count===0` → `StaleCredentialError` → hele transactie
> rolt terug, géén VERIFIED/verificatie-record/audit, nette "Dit certificaat is inmiddels beoordeeld"-melding. Een
> gelijktijdige admin-beslissing (of elke andere statuswijziging) wint nu. Rood→groen: `verify-toctou.test.ts` (+2:
> race verloren `count:0` → geen write/record/audit; race gewonnen `count:1` → VERIFIED + record + audit). _(MENSENWERK:
> vóór livegang met echte VOG/diploma/BIG-data — mens verifieert de guarded-updateMany-fix en checkt of een bestaand
> productie-record ooit door deze race is geraakt: `AuditLog` `CREDENTIAL_REJECTED` gevolgd door een latere
> `CREDENTIAL_VERIFIED` op dezelfde `entityId`.)_
>
> **GEVONDEN + GEFIXT — MED (DOEL 2, CWE-203 existence-oracle — return-based):** `changeJobStatus`
> (`src/app/(protected)/opdrachten/actions.ts`) gaf voor een onbekend `jobId` `{ error: "Opdracht niet gevonden." }`
> maar voor een bestaand-maar-vreemd id `{ error: "Geen toegang tot deze resource." }` (`assertOwnership` →
> `AuthorizationError`, **teruggegeven** i.p.v. gethrowd → niet door Next.js geredigeerd). Een CLIENT kon zo met een
> gegokt id Job-ids platform-breed (incl. cross-tenant/CONCEPT) aftasten. Exact de klasse die dit **zelfde bestand** al
> tweemaal dichtte (`saveJob`, `inviteSuggestedFreelancersToJob`, met expliciete CWE-203-comments); `changeJobStatus`
> was de gemiste sibling. **Geschonden regel:** CLAUDE.md regel 2 (ownership-keten, ononderscheidbaar van "niet
> gevonden"). **Fix:** `if (!job || !owns(actor, job.company.userId)) return { error: "Opdracht niet gevonden." };`
> (`assertOwnership`-import + try/catch verwijderd). Rood→groen: +1 test in `opdrachten/actions.test.ts` (niet-gevonden
> en niet-eigen geven identieke fout, muteren niets).
>
> **GEVONDEN + GEFIXT — LOW-MED (DOEL 2, CWE-203 existence-oracle — throw-based):** `loadOwnedApplication`
> (`src/app/(protected)/kandidaten/actions.ts`, gebruikt door `changeApplicationStatus`/`saveApplicationNote`) throwde
> `Error("Reactie niet gevonden.")` bij onbekend id maar een andere `AuthorizationError` (`assertOwnership`) bij een
> bestaand-maar-vreemd id. Sibling `withdrawApplication` (`reacties/actions.ts`) op ditzelfde Application-model collapset
> al naar één melding. **Fix:** `if (!app || app.job.company.userId !== actor.id) throw new Error("Reactie niet
gevonden.");` (`assertOwnership`-import verwijderd). Rood→groen: `kandidaten/anti-oracle-party.test.ts` (+2:
> niet-eigen reactie geeft identieke fout als niet-gevonden, muteert niets — voor beide callers).
>
> **GEVONDEN + GEFIXT — LOW-MED (DOEL 1b, cross-surface "signaal op één oppervlak" — badge-divergentie boven 50):**
> de FRANCHISER `/franchise/zzpers`-nav-badge (`rosterAlerts`, `src/lib/signals.ts`) telt (bijna-)verlopende
> certificaten via een `credential.findMany` die — anders dan de `/acties`-bron (`franchiseCredentialExpiryTask`,
> `pending-tasks.ts`, `orderBy: { expiresAt: "asc" }`) — **géén `orderBy`** had. Beide cappen op 50
> (`CASCADE_SCAN_LIMIT === MAX === 50`); bij >50 verlopende certificaten binnen één tenant pakten de twee queries een
> andere 50-rij-subset → een ander distinct-profiel-aantal → de badge divergeerde van `/acties`+de dashboard-rail.
> Distincte variant van het geparkeerde run-53-item 3 (dat is unbounded-count-vs-capped-list; dit is
> beide-capped-maar-andere-orde). **Geschonden regel:** DOEL 1b (één bron van waarheid; badge/acties/detail gelijk).
> **Fix:** `orderBy: { expiresAt: "asc" }` op de badge-query → beide truncaten identiek. Rood→groen: +1 test in
> `signals.badge-gaps-run52.test.ts` (badge-query heeft `orderBy expiresAt asc` + `take 50`). Full gate: typecheck,
> lint, **5194 tests**, build, prettier groen.

> **Datum:** 2026-07-27 (run 53) · **main-commit basis:** `c46a8f0a`
> **Uitkomst:** **1 bevinding GEVONDEN + GEFIXT** (DOEL 2, client-side-only gate op een echte mutatie:
> `openDispute` mist een server-side statusrem). Verse prod-build (exit 0) + idempotente demo-seed
> (`SEED_DEMO=true`, ephemere SQLite `qa.db`, `next start` op poort 3100) + live persona-smoke over alle
> vier rollen (Playwright/Chromium 1194, **20/20 PASS**: login → /dashboard voor admin/zzp/client/franchise;
> `/acties` laadt zonder crash; nul 5xx; DOEL 2 privilege-escalatie ZZP→`/admin/verificaties` en
> CLIENT→`/franchise` → redirect `/dashboard`; junk/traversal/sqli-id → 200 soft-404, nooit 500;
> fix-validatie: COMPLETED samenwerking toont geen dispuut-opener) + drie parallelle Opus-audits
> (authz/IDOR/cross-tenant/document-privacy — **schoon**; malicieuze invoer/verboden statusovergangen/
> financiële integriteit — 1 bevinding, nu gefixt; next-action-correctheid — geen HIGH, alleen LOW/
> productbesluit-items hieronder geparkeerd).
>
> **GEVONDEN + GEFIXT — MED (DOEL 2, CLAUDE.md regel 1 — client-side-only gate op een echte mutatie):**
> `openDispute` (`src/lib/cascade/dispute-commands.ts`) las alleen `col.disputedAt`, **niet** `col.status`.
> De UI toont het dispuut-formulier alléén bij een ACTIVE samenwerking (`active && …` in
> `samenwerkingen/[id]/page.tsx`), maar niets borgde die regel server-side: een partij kon `openDisputeAction`
> **rechtstreeks** aanroepen op een PROPOSED/COMPLETED/CANCELLED samenwerking. Impact per status: **COMPLETED**
> → zet `disputedAt` en blokkeert eenzijdig de correctie-/creditfactuur-route (`creditInvoice` checkt
> `assertNotDisputed`) op een reeds betaalde klus — een griefing-vector; **PROPOSED** → landmijn (dispuut →
> signContract op een bevroren deal; `contract-dispute-freeze.test.ts`, run 40, dekte alleen de downstream-
> command af, nooit de bron — deze fix dicht de bron); **CANCELLED** → no-op vlag zonder cascade om te
> bevriezen. Elke andere cascade-command borgt dit al via `assertCollaborationNotTerminal` /
> `terminalCollaborationError`. **Geschonden regel:** CLAUDE.md regel 1 (server-side is de waarheid; client
> mag tonen, nooit beslissen) + regel 3 (statusovergangen via expliciete rem). **Fix:** `openDispute` weigert
> nu hard tenzij `status === "ACTIVE"` (een dispuut = "bevries de lópende cascade" → alleen zinvol op een
> actieve inzet), ná de `assertParty`-check (dus geen oracle: alleen een partij ziet de statusmelding).
> Rood→groen: `open-dispute-status-guard.test.ts` (+5: PROPOSED/COMPLETED/CANCELLED geweigerd zonder write,
> ACTIVE schrijft door, al-lopend dispuut op ACTIVE nog steeds geweigerd). Full gate groen.
>
> **GEPARKEERD — LOW/productbesluit (next-action-audit run 53, niet-blokkerend):**
>
> 1. ~~**LOW-MED (productbesluit "Besluit 1"):**~~ **GEDAAN (2026-07-29, PR #967)** — een cascade-factuur die
>    APPROVED→OVERDUE flipt gaf de bétalende partij (CLIENT) geen signaal op enig oppervlak — alleen de freelancer
>    kreeg `paymentConfirmTask(overdue)`. Opgelost met een read-only, informatieve next-action
>    `clientCascadeOverduePaymentTask` (opdrachtgever-spiegel; band `P.clientCascadeOverduePayment = 57`, post-due,
>    boven de pre-due nudge en onder de generieke roll-up) op /acties + dashboard-rail + nav-badge. Deep-link naar het
>    samenwerkingsdetail — géén nieuwe betaal-mutatie (out-of-band-model onveranderd): "betaal 'm of laat de betaling
>    bevestigen". Verdwijnt zodra de ZZP'er de betaling registreert (→ PAID). `countClientCascadeWork` kreeg
>    `overduePaymentNudges` (badge niet stiller dan /acties). +6 tests (5 surface + 1 badge). Ref: `signals.ts`,
>    `tasks.ts`, `pending-tasks.ts`, `next-actions.ts`.
> 2. **LOW (cosmetisch):** een tweede VERIFIED-certificaat van hetzelfde type (oud, bijna verlopen) naast een
>    vernieuwd geldig exemplaar levert een overbodige `credentialFixTask("expiring")` die deep-linkt naar het
>    reeds-vervangen certificaat; alleen bereikbaar als de ZZP'er een _nieuw_ certificaat aanmaakte i.p.v. het
>    bestaande te bewerken. Ref: `pending-tasks.ts:352-361` vs `collaboration-credential-expiry.ts:71-79`.
> 3. **LOW (onbereikbaar bij realistische volumes):** `unreadConversations`/admin-verificatie-`/acties`-lijst
>    slicet op `MAX=50` terwijl de nav-badge een onbegrensde `count` is → boven 50 items onder-rapporteert de
>    `/acties`-badge t.o.v. de nav-badge. Ref: `pending-tasks.ts:121-127,1006-1014` vs `signals.ts:335-354,721`.
> 4. **LOW (immaterieel):** franchiser roster-expiry gebruikt `gte: now` op beide oppervlakken terwijl de
>    freelancer-conventie `gt: now` is — alleen de exact-`now`-milliseconde-grens verschilt van de conventie
>    (de twee franchiser-oppervlakken zijn onderling consistent). Ref: `pending-tasks.ts:796`, `signals.ts:609`.

> **Datum:** 2026-07-26 (run 52) · **main-commit basis:** `929fb2b5`
> **Uitkomst:** **2 bevindingen GEVONDEN + GEFIXT** (1 MED financiële integriteit: TOCTOU-race omzeilt de
> run-51 anti-dubbelfacturatie-guard; 1 MED DOEL-1b cross-surface: FRANCHISER nav-badge ontbreekt op
> `/franchise/zzpers` + `/franchise/diensten`). Verse prod-build (exit 0) + live persona-smoke over alle vier
> rollen (Playwright/Chromium, 19/19: login OK; `/acties` laadt; DOEL 2: privilege-escalatie → redirect
> `/dashboard`; junk-id → geen 500; nul 5xx) + drie parallelle Opus-audits (authz/IDOR/cross-tenant/document-
> privacy; malicieuze invoer + verboden statusovergangen; next-action-correctheid). De authz/IDOR/cross-tenant-
> en document-/PDF-/dossier-privacy-audit kwam **schoon** terug (de diff sinds run 51 = alleen de al-gedocumenteerde
> #927/#928/#929-fixes; brede steekproef op ontzorgd/ideeën/academie/support/berichten/documenten zonder gat).
>
> **GEVONDEN + GEFIXT — MED (DOEL 2, financiële integriteit — TOCTOU-race op de anti-dubbelfacturatie-guard):**
> `assertNoOverlappingHoursPerformance` (`src/lib/cascade/performance-commands.ts`, run-51-fix #927) was een
> **pre-transactionele** `findFirst` vóór `persistEventAndEffects`. Bij twee (bijna-)gelijktijdige
> `submitPerformance`-aanroepen voor twee DRAFT-urenstaten met overlappende periode op dezelfde samenwerking
> zagen beide requests elkaar in de pre-check nog als DRAFT (nog geen SUBMITTED), passeerden beide de guard en
> committen elk hun eigen SUBMITTED-write (verschillende rijen → geen CAS-conflict) → **twee urenstaten voor
> dezelfde periode → dubbel uitbetaald** via twee onafhankelijke goedkeur→factuur→betaal-cascades. Precies het
> scenario dat #927 sequentieel dichtte, nu via concurrency (reëel op Postgres READ COMMITTED; op SQLite
> serialiseren writes globaal). De dispuut-/terminale-siblings in dezelfde file hadden deze in-transactie-
> herverificatie wél (`disputeGuardCollaborationId`/`terminalGuard`). **Geschonden regel:** CLAUDE.md regel 1
> (server-side waarheid, geen dubbele persistentie — symmetrisch over álle paden incl. het concurrente).
> **Fix:** nieuwe `overlapGuardPerformanceId`-ref op `persistEventAndEffects` → `persistInTransaction`
> her-verifieert de overlap-query BINNEN de `prisma.$transaction` (op `tx`), vóór er iets wordt weggeschreven;
> bij overlap rolt de hele transactie terug. Zelfde querylogica + gedeelde melding-constante
> (`OVERLAPPING_PERFORMANCE_MESSAGE`, geen id-lek) als de pre-check (die blijft voor snelle fail). Sluit het
> interleaved-venster (perfB commit ná perfA's pre-check maar vóór perfA's write). Rood→groen:
> `performance-commands.test.ts` (+3 cases: in-tx-guard, doorgegeven ref-semantiek, MILESTONE-skip).
> _Residu (LOW, geparkeerd):_ de truly-simultane race (beide lezen vóór beide schrijven) sluit alleen een
> DB-niveau exclusion/partial-unique-constraint op `(collaborationId, periodStart, periodEnd)` volledig af —
> niet declaratief in Prisma-`db push` over SQLite+Postgres; de in-tx-guard dekt het realistische vector
> (CSV-dubbelimport, dubbelklik, interleaved submit).
>
> **GEVONDEN + GEFIXT — MED (DOEL 1b, cross-surface "signaal op één oppervlak" — FRANCHISER nav-badge stil):**
> `navBadges()` (`src/lib/signals.ts`, FRANCHISER-tak) berekende alleen `overdueLeads` (→ `/franchise/leads`) en
> `openHandoffs` (→ `/franchise/shift-overnames`), terwijl `franchiserTasks()` (`pending-tasks.ts`) attention-tone
> item-taken emit die naar twee ándere nav-items wijzen die nooit een badge kregen: `/franchise/zzpers`
> (`franchiseNotEngageableTask` prio 84 + `franchiseCredentialExpiryTask` prio 70) en `/franchise/diensten`
> (`franchiseAcuteDienstTask` prio 78 + `franchiseStaleDienstTask`/rollup prio 65). Een bemiddelaar die via de
> sidebar (niet het dashboard) navigeert had nul signaal dat die pagina's aandacht vereisen — exact het
> anti-patroon dat het project al voor CLIENT (`/kandidaten` run 46/47, `/samenwerkingen` run 46) en ADMIN
> (`/admin/gebruikersbeheer` run 46) dichtte, maar nooit voor de FRANCHISER's eigen operationele pagina's.
> **Geschonden regel:** DOEL 1b (één bron van waarheid; badge/acties/detail gelijk). **Fix:** twee nieuwe
> `SignalCounts`-keys `rosterAlerts` (→ `/franchise/zzpers`) en `openDienstAlerts` (→ `/franchise/diensten`),
> beide `attention`, geteld met EXACT de predicaten van `franchiserTasks` — hergebruik van de pure helpers
> `computeEngageability`, `summarizeAcuteOpenDiensten`, `isStartAcute` (geen circular import naar pending-tasks;
> geen logica-duplicatie) + pure `countFranchiseDienstAlerts` (acuut-aggregaat max 1 + getoonde stale-rijen max 3
>
> - rollup bij residu, acute/stale-overlap ontdubbeld). Alle queries tenant-gescoped + `take`-begrensd. De
>   bestaande leads/handoff-badges + andere rollen onveranderd. Rood→groen: `signals.badge-gaps-run52.test.ts`
>   (+ cross-tenant-isolatie, dedup, verdwijnt-na-oplossing, helper-unit-tests). Full gate: typecheck, lint,
>   **5106 tests**, build, prettier groen.

> **Datum:** 2026-07-26 (run 51) · **main-commit basis:** `3fea61da`
> **Uitkomst:** **3 bevindingen GEVONDEN + GEFIXT** (1 MED financiële integriteit: dubbelfacturatie
> via overlappende urenstaat-perioden; 2 LOW financiële-integriteit-consistentie: €0-losse-factuur +
> `proposedRate` min 0). Verse prod-build (exit 0). Drie parallelle Opus-audits (authz/IDOR/cross-tenant/
> document-privacy; malicieuze invoer + verboden statusovergangen; next-action-correctheid) + drie
> parallelle Opus-fix-workers op niet-overlappende bestanden. De authz/IDOR/cross-tenant-, document-/PDF-/
> dossier-privacy-, AVG-erasure-, cron- en admin-rolpoorten kwamen (opnieuw) **schoon** terug; de #917-
> favorieten-fix en de #918-sessie-invalidatie zijn geverifieerd intact.
>
> **GEVONDEN + GEFIXT — MED (DOEL 2, financiële integriteit — dubbelfacturatie-vector):** `submitPerformance`
> (`src/lib/cascade/performance-commands.ts`) had **geen** rem tegen het indienen van een tweede HOURS-urenstaat
> waarvan de periode overlapt met een reeds in de cascade levende urenstaat op dezelfde samenwerking. Een ZZP'er
> kon zo — handmatig óf via de CSV-diensten-import (die per regel `createPerformance`→`submitPerformance` draait) —
> **twee prestaties voor exact dezelfde gewerkte periode** indienen; elke draait haar eigen goedkeur→factuur→
> betaling-cascade → dubbel uitbetaald. Geen enkele bestaande guard (`assertNotDisputed`,
> `assertCollaborationNotTerminal`, `assertPerformanceWithinLimits`) dekte duplicatie. **Repro:** FREELANCER,
> ACTIVE-samenwerking, `createPerformance`+`submitPerformance` tweemaal met dezelfde `periodStart`/`periodEnd`.
> **Geschonden regel:** CLAUDE.md regel 1 (server-side waarheid, geen dubbele/absurde persistentie). **Fix:**
> nieuwe pre-transactionele `assertNoOverlappingHoursPerformance` in `submitPerformance` (symmetrisch met de
> dispuut-/terminale-siblings): weigert een HOURS-indiening met een volledige periode als er een niet-REJECTED/
> niet-DRAFT (SUBMITTED/APPROVED) HOURS-prestatie op dezelfde samenwerking overlapt (`start < nieuw.eind AND
eind > nieuw.start`), met zelf-uitsluiting (opnieuw indienen na afkeuren mag) en skip bij MILESTONE/null-periode.
> Geen id-lek ("Er bestaat al een ingediende urenstaat voor deze periode."). Rood→groen: `performance-commands.test.ts`
> (+6 cases, red→green geverifieerd door de guard-call te verwijderen).
>
> **GEVONDEN + GEFIXT — LOW (DOEL 2, financiële-integriteit-consistentie):** (a) de losse-factuur-flow
> (`src/app/(protected)/facturen/actions.ts` `parseLines`) liet een **€0-totaal** persisteren (`invoiceLineSchema`
> stond `unitCents: 0` toe en er was geen totaal-check) → nu `total <= 0` geweigerd ("Het factuurbedrag moet groter
> dan € 0 zijn."; per-regel €0 blijft toegestaan voor korting/gratis regel). (b) `applicationSchema.proposedRate`
> (`src/lib/validation.ts`) stond min 0 toe, inconsistent met de zuster-tariefvelden (`rateMin/rateMax`,
> `collaborationProposalSchema.rate`, alle `optionalInt(2000, 1)` sinds de #917/`7a6957cc`-loonroof-hardening) →
> `optionalInt(2000, 1)` (leeg blijft toegestaan; expliciet €0 geweigerd). Display-only, geen bindend tarief.
> Rood→groen: `facturen/actions.test.ts` + `validation.test.ts`.
>
> **GEPARKEERD uit deze run (repro + prioriteit):**
>
> - **LOW (DOEL 1b, franchiser dedup-edge >50 diensten):** `pending-tasks.ts` `openDiensten`/`staleDiensten` zijn
>   twee onafhankelijke `take: 50`-queries met verschillende ordering; de acute-vs-stale-dedup (filter tegen
>   `acuteDienstIds`) kan bij **>50 gelijktijdig gepubliceerde diensten binnen één tenant** een dienst dubbel
>   tellen (acute-aggregaat + stale-rollup). Alleen op grote-franchise-schaal; geen impact vandaag. Prioriteit LOW.
> - ~~**LOW (DOEL 2, CWE-203 existence-oracle — herbevestigd, nog steeds bewust geparkeerd):** de void-cascade-
>   commando's (`submitInvoice`/`creditInvoice`/`updatePerformance`/`submitPerformance`/`confirmPayment`) geven een
>   onderscheidbare "niet jouw partij"- vs "niet gevonden"-melding.~~ **GEDAAN (2026-07-26, PR #928):** alle zeven
>   void-commando's (bovenstaande + `signContract`/`openDispute`) folden nu een niet-partij naar exact de resource-eigen
>   "… niet gevonden."-melding (via een `notFoundMessage`-param op `assertParty` en een expliciete niet-partij-check
>   vóór de rolmelding); een echte partij aan de verkeerde kant houdt de behulpzame rolmelding. Symmetrisch met de
>   al-gefixte return-based approve/reject-commando's (#903). Defense-in-depth (throw blijft in prod geredigeerd),
>   maar een refactor naar return-based state kan het gat niet meer heropenen. +11 tests (`anti-oracle-party.test.ts`).

> **Datum:** 2026-07-25 (run 50) · **main-commit basis:** `61135b18`
> **Uitkomst:** **2 bevindingen GEVONDEN + GEFIXT — beide HOOG** (1 authz/tenant/privacy: flexpool-favoriet
> omzeilde de zichtbaarheids-/tenant-poort; 1 financiële integriteit: bindend €0/uur-tarief → €0-facturen
> voor echte uren) + 2 LOW/should-fix geparkeerd. Verse prod-build (exit 0). Drie parallelle Opus-audits
> (authz/IDOR/cross-tenant/document-privacy; malicieuze invoer + verboden statusovergangen; next-action-
> correctheid). De document-/PDF-/dossier-routes, AVG-erasure, cron en admin-rolpoorten kwamen (opnieuw)
> schoon terug; de kern-cascade bleef symmetrisch gehard.
>
> **GEVONDEN + GEFIXT — HOOG (DOEL 2, authz/tenant-isolatie + privacy):** `addFavorite`/`saveFavoriteNote`/
> `removeFavorite` (`src/app/(protected)/favorieten/actions.ts`) laadden het doel-ZZP-profiel via een
> **ongescoopte `findUnique` (alleen bestaanscheck)** — de zichtbaarheids-/tenant-poort ontbrak volledig.
> Elk ander opdrachtgever-gericht vind-oppervlak (`/zzp/[id]` via `profileVisibleTo` + `tenantEntityVisibleTo`;
> `toggleSavedJob`; `startConversationWithFreelancer` + `inviteFreelancerToJob` via `discoverableFreelancerWhere`
>
> - `visibleFreelancersWhere`) dwingt die grens wél af. **Repro:** een ingelogde CLIENT roept `addFavorite(id)`
>   aan met het id van een **PRIVATE** of **cross-tenant** `FreelancerProfile` (id te gokken/uit een ander oppervlak);
>   de UI zou op `/zzp/[id]` 404'en, maar de actie sloeg de favoriet op + schreef een `FAVORITE_ADDED`-audit → het
>   profiel verschijnt daarna op `/favorieten` (`FlexpoolPanel`, gefilterd op enkel `user.status = ACTIVE`, **niet**
>   op zichtbaarheid/tenant) met **naam, headline, locatie, uurtarief en beschikbaarheid** — PII/relatie-data die de
>   CLIENT nooit mocht zien. **Geschonden regel:** CLAUDE.md regel 1 & 2 (server-side waarheid + ownership-keten) +
>   tenant-isolatie. **Fix:** `loadCompanyAndProfile` scoopt het profiel bij TOEVOEGEN via `findFirst` met
>   `discoverableFreelancerWhere` + `visibleFreelancersWhere(actor)` → een niet-zichtbaar/cross-tenant profiel is
>   onvindbaar en geeft dezelfde "ZZP'er niet gevonden." als een onbestaand id (anti-oracle). Verwijderen/notitie op
>   een reeds-eigen (companyId-gescoopte) favoriet houdt de poort bewust UIT (opruimen mag nooit vastlopen als een
>   profiel later privé/geschorst raakt). Rood→groen: `favorieten/actions.test.ts` (+4).
>
> **GEVONDEN + GEFIXT — HOOG (DOEL 2, financiële integriteit — €0-loonroof-vector):** `collaborationProposalSchema.rate`
> (`src/lib/validation.ts`) gebruikte `optionalInt(2000)` → **min 0**, terwijl de zuster-opdracht-rate (`rateMin`/
> `rateMax`) al `optionalInt(2000, 1)` (**min €1**) is met exact deze reden ("anders '€ 0/uur'… oogt als bug"). Een
> CLIENT kon zo een **bindend €0/uur-tarief** vastleggen op `Collaboration.rate`; de ZZP'er tekent, dient een normale
> urenstaat in en de cascade leidt er **stilzwijgend €0-facturen** voor écht gewerkte uren uit af — de hele keten
> (`assertPerformanceWithinLimits` valideerde alleen `hours`/`amountCents`, niet `rateCents`; `computeVat`/`ort`
> weigeren enkel < 0, niet = 0) liet het door tot een auto-afgeronde €0-samenwerking. **Geschonden regel:** CLAUDE.md
> regel 1 ("geen absurde bedragen persisteren", symmetrisch over álle paden). **Fix:** (a) `rate: optionalInt(2000, 1)`
> (leeg = geen tarief blijft toegestaan; ingevuld = min €1); (b) formulier `min={1}`
> (`propose-collaboration.tsx`); (c) defense-in-depth `rateCents <= 0`-poort in `assertPerformanceWithinLimits`
> (HOURS-tak) zodat ook CSV-import + toekomstige ingangen gedekt zijn. Rood→groen: `validation.test.ts` (+3),
> `performance-commands.test.ts` (+5).
>
> **GEPARKEERD uit deze run (repro + prioriteit):**
>
> - ~~**SHOULD-FIX (DOEL 1b, franchiser next-action undercount):** `pending-tasks.ts:962-967` capt de "stale dienst"-
>   taken op `.slice(0, 3)` **zonder rollup/"+N meer"**~~ **GEDAAN (2026-07-25, PR #920):** de residu-diensten (#4+, na
>   uitsluiting van de acute-dedup-set) worden nu gebundeld in één rollup-taak `franchiseStaleDienstRollupTask(count)`
>   (`tasks.ts`, kind `franchise-stale-service-rollup`, `resolver:"link"` → `/franchise/diensten`, band
>   `P.franchiserServiceStale`) — spiegelt `franchiseAcuteDienstTask`. Zo tellen `/acties` + de badge
>   (`pendingTaskCount`) het residu ook mee (+1) i.p.v. het stil te laten wegvallen; de rail bundelt al via
>   z'n top-N-overloop. Read-only, geen schemawijziging. +3 tests (`pending-tasks-franchiser.test.ts`).
> - ~~**LOW (DOEL 1b, rail-floor — herbevestigd):** `reviewPromptClosing` (48) kan op de sluitingsdag onder de harde
>   top-6-dashboardrail-slice zakken achter gewone niet-verlopende attentie-taken (mandatoryDoc 84 … messagesAwaiting 55),
>   terwijl het blind-beoordelingsvenster daarna **onherstelbaar** dicht is.~~ **GEDAAN (2026-07-25, PR #921):** gekozen
>   voor de **gereserveerde floor-slot** (niet de band ophogen — dat zou de rank-ordening op `/acties` + badges
>   misrepresenteren). Nieuw `deadlineFloor?: boolean` op `TaskBase` (gezet op `reviewLeaveTask` bij `closingSoon`) +
>   pure `selectDashboardTasks(tasks, max)` die garandeert dat elke floor-taak (tot `max`) in de gesneden dashboard-rail
>   zit, met behoud van rank-volgorde; +9 tests. Rank-ordening buiten de rail ongewijzigd. **Follow-up (2026-07-25):**
>   de agent-review op #921 flagde dat `DashboardActions` dood is; de live rail zit in `dashboard/page.tsx`
>   (`tasksToActions` → `tasks.slice(0, 6)`). De helper is daar alsnog ingewired (`selectDashboardTasks(tasks, 6)`)
>   zodat de floor-slot productie-effect heeft.

> **Datum:** 2026-07-25 (run 49) · **main-commit basis:** `1cd87a97`
> **Uitkomst:** **2 bevindingen GEVONDEN + GEFIXT** (1 HOOG functioneel/robuustheid: CSV-diensten-import
> creëerde onafhandelbare urenstaten; 1 MED security/existence-oracle CWE-203 in de cascade goedkeur/
> afkeur-commando's) + LOW's geparkeerd. Verse prod-build (exit 0) + live persona-smoke over alle vier
> rollen (login OK; DOEL 1: ADMIN goedkeur-actie liet de verificatiewachtrij 6→5 én `/acties` 16→15
> zakken; DOEL 2: privilege-escalatie → opaque-redirect, junk/traversal document-id → 404 (geen 500),
> cron GET → 405 / POST zonder secret → 503 fail-closed) + drie parallelle Opus-audits (authz/IDOR/
> cross-tenant/document-privacy; malicieuze invoer + verboden statusovergangen; next-action-correctheid).
> De next-action-audit kwam **schoon** terug (geen HIGH/MED — de historisch buggy naden dispuut-vries/
> terminal-masking/overdue-dubbeltelling/rejected-vs-mandatory/renewal-never-disappears zijn elk gegrendeld
> en getest). De document-/PDF-/dossier-privacy, AVG-wisflow en admin-rolpoorten kwamen schoon terug.
>
> **GEVONDEN + GEFIXT — HOOG (DOEL 1/2, robuustheid — onafhandelbare cascade-staat):** `importDienstenAction`
> (`src/app/(protected)/diensten/importeer/actions.ts`) maakte + diende per CSV-regel een HOURS-prestatie
> in **zonder te controleren of de samenwerking een uurtarief heeft**. `Collaboration.rate` is `Int?` en
> optioneel bij het voorstel (`rate: optionalInt` in `validation.ts`), dus een ACTIEVE samenwerking zónder
> tarief is bereikbaar. De **handmatige** urenstaat weigert dit netjes vóór persistentie (`validatePerformanceForm`
> → "Er is geen uurtarief ingesteld…"), maar de import riep die validator niet aan en gaf `rateCents = null`
> rechtstreeks door. Resultaat: N **SUBMITTED**-urenstaten met `rateCents = null` die de opdrachtgever **niet
> kan goedkeuren** (`performanceSubtotalCents` gooit "Urenstaat mist een uurtarief.") én die de ZZP'er **niet
> kan corrigeren** (er is geen tarief-veld in de UI en `editAndResubmit` recomputet hetzelfde ontbrekende
> tarief) — een permanent vastgelopen samenwerking. **Geschonden regel:** CLAUDE.md regel 1 (server-side
> waarheid, symmetrisch over álle paden) — de import-grens miste de rate-presence-poort die het handmatige
> pad wél afdwingt. **Fix:** vóór de rij-loop `rateCents == null` → één heldere melding (`imported: 0`),
> exact zoals `validatePerformanceForm`. Rood→groen: +1 test in `diensten/importeer/actions.test.ts`.
>
> **GEVONDEN + GEFIXT — MED (DOEL 2, CWE-203 existence-oracle in de cascade-commandolaag):** `approvePerformance`/
> `rejectPerformance` (`performance-commands.ts`) en `approveInvoice`/`rejectInvoice` (`invoice-commands.ts`)
> gooiden ná de `loadPerformance`/`loadCascadeInvoice`-existence-check een **rolmelding** ("Alleen de
> opdrachtgever kan …") die verschilde van de "… niet gevonden."-melding bij een onbekend id — óók voor een
> actor die **helemaal geen partij** is bij de resource. Deze meldingen worden door de useActionState-drawers
> (`approve/rejectPerformanceState`, `approve/rejectInvoiceState`) als **returnwaarde** aan de client getoond
> — en returnwaarden worden **niet** door Next.js geredigeerd (anders dan een gegooide server-action-fout).
> Dus een ingelogde niet-partij kon met een gegokt id het **bestaan** van andermans prestatie/factuur aftasten
> ("niet gevonden" vs "alleen de opdrachtgever kan…"). **Geschonden regel:** CLAUDE.md regel 2 (ownership binnen
> dezelfde afgevangen keten) + anti-oracle. **Fix:** vóór de rolcheck een niet-partij-check die exact dezelfde
> "… niet gevonden."-melding gooit; een echte partij aan de verkeerde kant (bv. de ZZP'er die zijn eigen
> prestatie wil goedkeuren) houdt wél de behulpzame rolmelding. Rood→groen: +6 tests (`anti-oracle-party.test.ts`).
>
> **GEPARKEERD uit deze run (repro + prioriteit):**
>
> - ~~**LOW (defense-in-depth, DOEL 2):** dezelfde not-found-vs-rolmelding-divergentie bestaat nog in de
>   **void**-cascade-commando's (`submitPerformance`/`submitInvoice`/`creditInvoice`/`confirmPayment`/
>   `signContract`/`openDispute`).~~ **GEDAAN (2026-07-26, PR #928):** de niet-partij→"… niet gevonden."-fold is
>   nu op alle void-commando's toegepast (zie run 51-entry). Latent gat gesloten; +11 tests.
> - **LOW (DOEL 1b, misleidende subtitel) — GEDAAN (2026-07-25, PR #914):** `overdueInvoiceTask(residualOverdue,
"FREELANCER")` (`pending-tasks.ts`) toonde subtitel "Volg op bij de opdrachtgever", maar de residual-roll-up
>   kon bij een ZZP'er met >50 niet-disputed samenwerkingen (de `take: MAX`-slice) een cascade-OVERDUE-factuur
>   bevatten waar de echte actie "markeer de betaling zodra je bent betaald" is. **Fix:** residu gesplitst in
>   legacy (opdrachtgever aan zet → "volg op") vs cascade (ZZP'er markeert → "markeer de betaling") via
>   `overdueInvoiceBreakdown` + een `chase`/`confirm`-variant op `overdueInvoiceTask` (eigen id per variant).
> - ~~**LOW (DOEL 1b, rail-floor):** `reviewPromptClosing` (48) en `staleApplications`/client-stale (52) kunnen
>   onder de harde top-6-slice van de dashboard-rail zakken terwijl een sluitend blind-beoordelingsvenster
>   **onherstelbaar** is na sluiting.~~ **GEDAAN (2026-07-25, PR #921):** gereserveerde floor-slot via
>   `deadlineFloor` + `selectDashboardTasks` (zie run 50-entry). Alleen `reviewLeaveTask`/`closingSoon` is
>   onomkeerbaar-met-deadline → floor; `staleApplications` blijft bewust rank-only (herstelbaar signaal).
> - **NIT (dode constante):** `P.credentialExpiryBatch` (58) heeft geen enkele builder-caller → veilig te
>   verwijderen (suggereert een admin-"draai de expiry-check"-actie die niet meer bestaat).
> - **LOW (uit run 48, blijft staan):** `setBillingStatusAction` neemt `to` als rauwe TS-parameter zonder
>   `safeParse` — inmiddels afgedekt door #907 (Zod-grensvalidatie); verifiëren en anders sluiten.

> **Datum:** 2026-07-24 (run 48) · **main-commit basis:** `8ccc9c78`
> **Uitkomst:** **3 bevindingen GEVONDEN + GEFIXT** (1 security/existence-oracle HOOG-prio + 1 DOEL-1b
> next-action-prioriteit + 1 dode-code-drift-hazard) + 2 geparkeerd met repro. Verse prod-build (exit 0)
>
> - drie parallelle Opus-audits (authz/IDOR/cross-tenant/existence-oracle/document-privacy; malicieuze invoer +
>   verboden statusovergangen; next-action-correctheid over alle vier rollen). De authz-audit vond de document-/
>   PDF-dossier-routes, de AVG-wisflow, de agenda-ICS-feed en de admin-rolpoorten **schoon** (identieke 404 op
>   niet-gevonden én niet-van-jou, DENIED-audit bewaard). De malicieuze-invoer/status-audit vond de kern-cascade
>   **symmetrisch clean** (`assertNotDisputed`/terminal-guards op elk command-pad incl. CSV-import; `rateCents`
>   altijd server-side herlezen en `0..2000`-geklemd; `computeVat` throwt op negatief; CSV-injectie via `escapeCsvField`).
>
> **GEVONDEN + GEFIXT — MED/security (DOEL 2, CWE-203 existence-oracle):** `importDienstenAction`
> (`src/app/(protected)/diensten/importeer/actions.ts:48-51`) scheidde na een `findUnique` de "Samenwerking niet
> gevonden."-tak van een "Je hebt geen toegang tot deze samenwerking."-tak — beide als **teruggegeven** `errors[]`
> (geen throw → nooit door Next.js geredigeerd, altijd client-zichtbaar). Een ingelogde ZZP'er kon zo met een gegokt
> `collaborationId` het **bestaan** van andermans samenwerking aftasten (gevoelige relatie-metadata). Ditzelfde pad
> viel buiten de eerdere anti-oracle-sweeps (#899/#902) in `samenwerkingen/`/`opdrachten/`/`uitgaven/`. **Geschonden
> regel:** CLAUDE.md regel 2 (ownership binnen dezelfde afgevangen keten, ononderscheidbaar van "niet gevonden").
> **Fix:** onbekend id én andermans samenwerking → exact dezelfde melding (`if (!col || col.freelancer.userId !== actor.id)`).
> Rood→groen: nieuw testbestand `diensten/importeer/actions.test.ts` (identieke-melding-assert + rolpoort).
>
> **GEVONDEN + GEFIXT — MED (DOEL 1b, next-action-prioriteit — urgente actie valt van de rail):** `reviewLeaveTask`
> (`src/lib/actions/tasks.ts`) liet de **toon** naar "attention" escaleren zodra het beoordelingsvenster ≤3 dagen
> open stond, maar hield de **prioriteit** op `P.reviewPrompt` (24, één-na-laagste band). De dashboard-rail slicet
> hard op de top-6 (`DashboardActions`), dus een bijna-gesloten, daarna **onherstelbaar** blind beoordelingsvenster
> (anti-vergeldingsslot) kon onder cosmetische info-nudges (`completeness` 30, `availabilityStale` 40) van de rail
> vallen terwijl het z'n eigen "attention"-styling tegensprak. **Fix:** nieuwe band `P.reviewPromptClosing` (48, boven
> completeness/beschikbaarheid); `reviewLeaveTask` bumpt de prioriteit mee met de toon zodra `closingSoon`. Rood→groen:
> 2 tests aangescherpt in `tasks.test.ts`.
>
> **GEVONDEN + GEFIXT — LOW (drift-hazard, dode code — zelfde klasse als #902):** `franchiserNextActions`
> (`src/lib/next-actions.ts`) had nog twee operationele takken (`notEngageable`/`staleDiensten` + hun
> `FranchiserStaleDienst`/`FranchiserNotEngageable`-interfaces) die **geen enkele productie-caller** raakte — de enige
> caller `franchiseGuidedSetupTasks` geeft alleen de guided-setup-inputs mee. De echte operationele taken worden al
> apart en correct geëmit door `franchiserTasks` in `pending-tasks.ts` (`franchiserNotEngageableTask`/
> `franchiserStaleDienstTask`). Dit is exact de drift-hazard die #902 elders net wegnam. **Fix:** de dode takken +
> interfaces verwijderd uit `franchiserNextActions`/`FranchiserActionInput` (guided-setup-tak behouden, gewired via
> `franchiseGuidedSetupTasks`); `next-actions.test.ts` gesnoeid tot de guided-setup-cases. De `P.franchiserServiceStale`/
> `P.franchiserRosterNotEngageable`-banden blijven (nog gewired door de levende item-taken).
>
> **GEPARKEERD uit deze run (repro + prioriteit):**
>
> - **LOW (DOEL 2, robuustheid/consistentie):** `setBillingStatusAction` (`src/app/(protected)/admin/facturatie/actions.ts:41`)
>   neemt `to: PlatformBillingStatus` als rauwe TS-parameter zonder `safeParse` aan de server-action-grens, anders dan
>   de zusjes `changeCollaborationStatus`/`judgeNoShowReport` (die wél Zod-validaten). Een non-enum-`to` wordt vandaag
>   nog veilig geweigerd (`.includes()===false` → `PlatformBillingTransitionError`), maar als een **onafgevangen** throw
>   i.p.v. een nette melding — één stap van de projectconventie af. ADMIN-gated + gebonden args → lage exploiteerbaarheid.
>   **Fix-richting:** `platformBillingStatusSchema.safeParse(to)` vóór `assertPlatformBillingTransition`. Prio: LOW.
> - **NIT (duplicatie, DOEL 1b-nuance):** `PendingTask.resolver` (`src/lib/actions/tasks.ts:34`) is decoratieve
>   metadata die de render-laag (`action-list.tsx` switcht op `task.kind`, `drawer-resolver.tsx` op `data.kind`)
>   nooit leest, en de union-waarde `"approveReject"` wordt door geen enkele task-builder gezet (approve/reject-taken
>   gebruiken `resolver: "drawer"`). Geen bug vandaag (alle kinds correct gewired), maar duplicatie die stil kan driften.
>   **Fix-richting:** óf `task.resolver` daadwerkelijk in de switch wiren als bron van waarheid, óf het veld + de
>   ongebruikte enum-waarde schrappen. Prio: NIT.

> **Datum:** 2026-07-24 (run 47) · **main-commit basis:** `7ec1ba7c`
> **Uitkomst:** **5 bevindingen GEVONDEN + GEFIXT** (4 security/existence-oracle + 1 DOEL-1b tegenspraak) + 3
> geparkeerd met repro. Verse prod-build (exit 0) + drie parallelle Opus-audits (authz/IDOR/cross-tenant/
> existence-oracle; malicieuze invoer + verboden statusovergangen; next-action-correctheid over alle vier rollen).
> De malicieuze-invoer/status-audit kwam **schoon** terug op de kernketen (cascade-commands symmetrisch
> `assertNotDisputed`/terminal-guard; elke getal/datum-parse `Number.isFinite`/`isNaN`-gerguard vóór Prisma;
> `assertPerformanceWithinLimits` centraal ook op het CSV-importpad; CSV-injectie via `escapeCsvField` afgevangen).
>
> **GEVONDEN + GEFIXT — BLOCKER/security (DOEL 2, CWE-203 existence-oracle via throw-vs-resolve):** `inviteFreelancerToJob`
> en `inviteSuggestedFreelancersToJob` (`src/app/(protected)/opdrachten/actions.ts:525`, `:620`) deden `if (!job) return;`
> (stil succes) gevolgd door `assertOwnership(...)` dat voor een niet-eigen opdracht een **onafgevangen**
> `AuthorizationError` throwde. Deze `void`-server-actions zijn direct aanroepbaar: een onbekend `jobId` resolvete stil,
> een bestaand-maar-vreemd id (incl. ongepubliceerde **CONCEPT**-opdracht van een concurrent) rejecte — een observeerbaar
> throw-vs-resolve-verschil (onafhankelijk van Next.js' prod-message-redactie) waarmee een CLIENT andermans opdracht-id's
> kon enumereren. **Geschonden regel:** CLAUDE.md regel 2 (ownership binnen dezelfde afgevangen keten) + anti-oracle.
> **Fix:** onbekend én niet-eigen → exact dezelfde stille afhandeling (`if (!job || !owns(actor, job.company.userId)) return;`).
> Rood→groen: +1 test (`opdrachten/actions.test.ts`).
>
> **GEVONDEN + GEFIXT — MED/security (zelfde klasse):** (a) `saveJob`-edit (`opdrachten/actions.ts:141`) gaf voor een
> geknutseld `jobId` van een ander bedrijf een onafgevangen throw i.p.v. de nette `{ error: "Opdracht niet gevonden." }`
> die een onbekend id gaf → gelijkgetrokken. (b) `deleteExpense` (`uitgaven/actions.ts:134`) scheidde onbekend-id
> (`{ error }`) van andermans-uitgave (throw) — de projecttest asserteerde dat verschil zelfs → nu `findFirst({ id, userId })`
> zodat beide per constructie identiek zijn (financieel record, AVG-adjacent). (c) `editAndResubmitPerformanceAction`
> (`samenwerkingen/[id]/actions.ts:253`) gaf "Je hebt geen toegang tot deze prestatie." vs "Prestatie niet gevonden."
> (tekst-divergentie) → één melding. Rood→groen: `uitgaven/actions.test.ts`, `edit-resubmit-authz.test.ts` aangescherpt
> naar identieke-melding-asserts.
>
> **GEVONDEN + GEFIXT — MED (DOEL 1b, "signaal op één oppervlak" — tegenspraak):** `/prestaties` (`src/lib/prestaties.ts`
> `getPrestatiesForClient` + `prestaties/page.tsx`) telde een **SUBMITTED-prestatie van een BEVROREN (disputed)
> samenwerking** als "wacht op jouw goedkeuring" mét een "Keuren →"-actie en in de bulk-groepen — terwijl de nav-badge
> (`pendingPerformances`), `/acties` (`performanceApproveTask`) én de cascade-fase disputed al uitsluiten en
> `approvePerformance` server-side weigert (`assertNotDisputed`). Een niet-verdwijnende, server-side falende actie die
> alle andere oppervlakken tegenspreekt. **Fix:** `disputed`-vlag op elke rij (`collaboration.disputedAt != null`); nieuwe
> pure `approvablePerformances()` voedt de pending-telling én de bulk-selectie (disputed uitgesloten); de rij toont nu
> "In dispuut → Dispuut behandelen" i.p.v. "Keuren →". Rood→groen: +3 tests (`prestaties.test.ts`).
>
> **GEPARKEERD uit deze run (repro + prioriteit):**
>
> - ~~**MED (DOEL 1b, badge-gat):** de `/kandidaten`-nav-badge telt alleen `newApplications` (`status:"NEW"`),
>   maar `proposeCollaborationTask` (geaccepteerd-zonder-voorstel) en `staleApplicationsTask` (VIEWED/SHORTLIST
>   te lang onbeslist) verschijnen wél op `/acties`+rail. Een opdrachtgever met 0 NEW maar een
>   geaccepteerde-kandidaat-in-limbo zag géén badge op `/kandidaten`.~~ **GEDAAN 2026-07-24 (PR volgt):**
>   `navBadges` CLIENT-tak telt nu de drie niet-overlappende predicaten (NEW + stale VIEWED/SHORTLIST +
>   geaccepteerd-zonder-voorstel) via de bestaande pure helpers (`summarizeStaleClientApplications`,
>   `pendingCollaborationProposals`) — badge = som van de losse `/acties`-taken. +5 tests
>   (`signals.badge-gaps-run47.test.ts`).
> - ~~**HOOG-maar-dode-code (drift-hazard):** `freelancerNextActions`/`clientNextActions`/`adminNextActions`
>   (`src/lib/next-actions.ts:101/198/284`) hebben **nul productie-callers** (alleen `franchiserNextActions` is gewired)
>   en zijn materieel gedivergeerd van de levende engine (`adminNextActions` bevat zelfs een fantoom-actie
>   `admin-expiring-credentials` die `adminTasks` niet emit). `PROGRESS.md` documenteert dat een dood next-action-codepad
>   ooit een echte bug gaf.~~ **GEDAAN 2026-07-24 (PR volgt):** de drie dode aggregators + hun input-interfaces
>   verwijderd uit `next-actions.ts`, én het volledig-dode zusje `src/lib/cascade/next-actions.ts`
>   (`cascadeFreelancerActions`/`cascadeClientActions` — óók nul productie-callers, comment "al gewired in
>   dashboardData" was stale) mét testbestand verwijderd. Behouden: `franchiserNextActions` (gewired via
>   `franchiseGuidedSetupTasks`), `P`-banden, `rankNextActions`, `formatMissing` — de enige levende exports.
>   De item-engine (`actions/tasks.ts` + `pending-tasks.ts`) is nu de énige next-action-bron → geen parallel
>   codepad dat stil kan driften. `next-actions.test.ts` gesnoeid tot de behouden exports; stale comment in
>   `tasks.ts` bijgewerkt.
> - **LOW (DOEL 1b, bewust zachter):** `paymentDueSoonTask` (`/acties`, pre-due nudge) heeft geen teller in de
>   `/financien`-CLIENT-badge (`signals.ts:392-461`, telt alleen post-due `overdueInvoices`). Zelfde asymmetrie-klasse,
>   maar bewuste "info"-toon; grensgeval. Prio: LOW.

> **Datum:** 2026-07-23 (run 46) · **main-commit basis:** `6c09e1a6`
> **Uitkomst:** **3 bevindingen GEVONDEN + GEFIXT** (1 HIGH/security + 2 DOEL-1b nav-badge). Verse prod-build
> (exit 0) + drie parallelle Opus-audits (authz/IDOR/cross-tenant/document-privacy; malicieuze invoer +
> verboden statusovergangen; next-action-correctheid). De malicieuze-invoer/status-audit kwam **schoon** terug
> op de kernketen (elke datum/getal-parse `isNaN`/`Number.isFinite`-gerguard vóór Prisma; `assertTransition`/
> terminal-guards symmetrisch; int4-overflow-klem op factuurbedragen).
>
> **GEVONDEN + GEFIXT — HIGH/security (DOEL 2, CWE-203 existence-oracle, terugkerende bugklasse):** acht
> mutaties in de samenwerkingen-module scheidden na een geslaagde `findUnique` een "niet gevonden"-tak van een
> "geen toegang/geen partij"-tak met **onderscheidbare** meldingen — een ingelogde actor (buitenstaander, de
> ZZP'er zelf, of een niet-betrokken CLIENT) kon zo via een gegokt id het **bestaan** van een willekeurige
> samenwerking aftasten (exact wat de anti-oracle-fixes #867/shift-handoff/setDienstStatus elders bewust dicht
> houden). Bevestigd client-lekkend (return-state, verbatim gerenderd): `createReviewAction`
> (`src/app/(protected)/samenwerkingen/[id]/review-actions.ts:50`), `reportNoShow`
> (`no-show-actions.ts:61`), `sendCredentialReminder` (`actions.ts:494`),
> `applyCollaborationStatusChange` (`actions.ts:194`, geforward via `toSafeActionError` in `cancelCollaboration`).
> Plus vier throw-varianten in `[id]/actions.ts` (`setOrtProfileAction:297`, `setWeekdaysAction:354`,
> `setAgreementTypeAction:400`, `signModelAgreementAction:441`) — defense-in-depth + beleidsconsistentie.
> **Geschonden regel:** anti-oracle / server-side waarheid (CLAUDE.md). **Fix:** onbekend id én geen-partij
> geven nu EXACT dezelfde melding ("Samenwerking niet gevonden."). Rood→groen: 8 tests (`review-oracle.test.ts`,
> `no-show-oracle.test.ts`, aangescherpte `credential-reminder.test.ts`).
>
> **GEVONDEN + GEFIXT — MED (DOEL 1b, "signaal op één oppervlak"): ADMIN Gebruikers-nav stil bij hoogste-prio-taak.**
> De ADMIN-nav-badge (`signals.ts` navBadges) queryde nooit `User.status="PENDING"` of `deletionRequestedAt`,
> terwijl `/acties` (`pending-tasks.ts adminTasks`) er `adminActivateUserTask` (prio 60) én `adminDeletionRequestTask`
> (prio 100 — het blokkerende AVG-verwijderverzoek, hoogste in de engine) voor toont. Admin met 0 andere signalen
>
> - 1 verwijderverzoek zag een schone Gebruikers-nav. **Fix:** twee `user.count` (exact de `adminTasks`-predicaten)
>   → badge op het echte nav-href `/admin/gebruikersbeheer`, dynamische toon (attention bij verwijderverzoek, anders
>   info). Rood→groen in `signals.badge-gaps-run46.test.ts`.
>
> **GEVONDEN + GEFIXT — MED (DOEL 1b): CLIENT compliance-ripple-taak onzichtbaar op /samenwerkingen-badge.**
> `clientComplianceTask` (`tasks.ts`, prio 85, hoogste CLIENT-prio: vereist certificaat ontbrekend/verlopen op een
> ACTIVE niet-disputed samenwerking) verscheen op /acties + dashboard-rail maar niet in de `cascadeWork`-badge
> (`countClientCascadeWork` telde alleen proposed/submitted). **Fix:** `clientCredentialAlerts(userId)` gefilterd op
> `clientHasComplianceAction` meegeteld in `countClientCascadeWork` (geen dedup — losse acties, gelijk aan /acties).
> Rood→groen in `signals.badge-gaps-run46.test.ts` (6 tests totaal met GAT 1).
>
> **GEPARKEERD uit deze run (repro + prioriteit):**
>
> - **LOW (defense-in-depth, vangrail-dekkingsgat):** de "elke `findMany()` heeft `take:` of een
>   `unbounded-allow`-marker"-vangrail (`src/lib/unbounded-queries.test.ts`, `walkAppDir`) scant alleen `src/app`,
>   nooit `src/lib` — ongemarkeerde onbegrensde `findMany()`'s onder `src/lib` (o.a. `account-export.ts`,
>   `actions/drawer-data.ts`, `franchise/dienst-voordracht.ts`) glippen erdoor. Geen daarvan is nu
>   attacker-inflatable; een toekomstige `src/lib`-toevoeging met een opblaasbare tabel wel. **Fix-richting:**
>   `walkAppDir()` óók `src/lib` laten scannen (markers toevoegen aan de bestaande hits). Prioriteit: LOW.
> - **LOW (dode code):** `src/lib/next-actions.ts` (`freelancerNextActions`/`clientNextActions`/`adminNextActions`)
>   heeft nul productie-callers (alleen `franchiserNextActions` is gewired). Twee parallelle next-action-aggregaten
>   kunnen stil driften t.o.v. de echte engine (`pending-tasks.ts`/`tasks.ts`). **Fix-richting:** verwijderen of
>   wiren in een aparte pass. Prioriteit: LOW.

> **Datum:** 2026-07-23 (run 45) · **main-commit basis:** `4992ff6b`
> **Uitkomst:** **3 bevindingen GEVONDEN + GEFIXT** (1 MED/security + 2 DOEL-1b cross-surface) + 2
> geparkeerd met repro. Verse prod-build (exit 0) + drie parallelle Opus-audits (authz/IDOR/cross-
> tenant/document-privacy; malicieuze invoer + verboden statusovergangen; next-action-correctheid over
> alle vier rollen). De malicieuze-invoer/status-audit kwam **schoon** terug op de kernketen (cascade-
> command-familie symmetrisch `assertNotDisputed`/terminal-guard; elke datum/getal-parse `isNaN`/
> `Number.isFinite`-gerguard vóór Prisma; CSV-injectie afgevangen).
>
> **GEVONDEN + GEFIXT — MED/security (DOEL 2, CWE-203 cross-tenant existence-oracle op de shift-overname-
> aanvraag):** `requestShiftHandoff` (`src/app/(protected)/samenwerkingen/shift-handoff-actions.ts:71-83`)
> gaf voor een voorgestelde overnemer (`candidateFreelancerId`, een `FreelancerProfile.id`) **drie
> onderscheidbare** meldingen: onbekend id ("Voorgestelde overnemer niet gevonden."), bestaand-maar-
> andere-tenant ("De voorgestelde overnemer valt buiten deze bemiddeling.") en succes. Het veld staat
> niet in het formulier, maar de server-action is direct aanroepbaar; élke ZZP'er met één ACTIEVE
> samenwerking (de enige poort, `canRequestHandoff`) kon zo, ongelimiteerd (de check draait vóór de
> transactie, geen side-effect), het bestaan + tenant-lidmaatschap van een willekeurig profiel aftasten —
> exact wat `tenantEntityVisibleTo` op `/zzp/[id]` en `loadDecidableHandoff` (fix #867) bewust indistinct
> houden. Zelfde bugklasse die #867 in de sibling admin-functie fixte; deze functie in hetzelfde
> feature-bestand werd gemist. **Geschonden regel:** tenant-isolatie / anti-oracle (CLAUDE.md
> server-side waarheid + documenten/entiteiten privé). **Fix:** onbekend id en cross-tenant geven nu
> exact dezelfde melding ("Ongeldige voorgestelde overnemer."); zelf-voorstellen houdt een eigen melding
> (lekt niets). **Companion (LOW, zelfde bestand):** `cancelShiftHandoff` onderscheidde "niet gevonden"
> van "niet van jou" → gelijkgetrokken naar één melding + de geweigerde IDOR-poging op een bestaand-maar-
> vreemd id wordt nu geaudit (`SHIFT_HANDOFF_CANCEL_DENIED`, spiegelt `DOCUMENT_DELETE_DENIED`).
> Rood→groen: 7 tests (`shift-handoff-oracle.test.ts`).
>
> **GEVONDEN + GEFIXT — MED (DOEL 1b, "signaal op één oppervlak": ADMIN no-show-uitschrijfbadge stil):**
> de `/admin/no-shows`-nav-badge (`openNoShows`, `signals.ts`) telde **alleen** `verdict:"PENDING"`-
> meldingen, terwijl `/acties` (`adminSuspendNoShowTask`, `pending-tasks.ts`) én de pagina zelf ("Grens
> bereikt — beoordeel uitschrijving") óók een besluit tonen voor een ZZP'er op/over de grens ongegronde
> no-shows (nog ACTIEF). Gevolg: een admin met een échte uitschrijf-beslissing in de wachtrij (en 0
> PENDING-meldingen) zag een schone nav — actie op /acties + pagina, stil op de badge. **Fix:** dezelfde
> `groupBy(UNJUSTIFIED, having ≥ NO_SHOW_LIMIT)` + ACTIVE-filter als `/acties` opgeteld bij `openNoShows`
> → de badge dekt beide wachtrijen op die pagina, gelijk aan het aantal no-show-taken op /acties.
> Rood→groen: 3 tests (`signals.badge-gaps.test.ts`).
>
> **GEVONDEN + GEFIXT — MED (DOEL 1b, "signaal op één oppervlak": FREELANCER verplicht-document-badge
> stil):** de `/certificaten`-nav-badge (`credentialAlerts = rejected + expiring`, `signals.ts`) telde
> alleen REJECTED + binnenkort-verlopende VERIFIED certificaten en negeerde een **ontbrekend/verlopen
> verplicht document** (VOG/verzekering), terwijl `/acties` + de dashboard-rail daar wél een
> `mandatoryDocumentTask` tonen. Een verse ZZP'er (100% profiel, identiteit geverifieerd, nul
> certificaten → VOG+verzekering beide "missing", blokkeert inzetbaarheid) zag twee acties op /acties
> maar een stille `/certificaten`-nav — precies de pagina die de remediatie bevat. **Fix:** nieuwe pure
> helper `mandatoryDocumentAlertCount` (`mandatory-documents.ts`) — exact de emissieconditie van
> `mandatoryDocumentTask` (missing/expired, ontdubbeld tegen REJECTED-types die al in `rejected` zitten;
> `inReview` telt niet, daar is de admin aan zet) — opgeteld bij `credentialAlerts`. Eén bron van
> waarheid, geen dubbeltelling. Rood→groen: 5 tests (`mandatory-documents.test.ts`).
>
> **GEPARKEERD uit deze run (repro + prioriteit, voor een volgende increment):**
>
> - ~~**MED (DOEL 2, robuustheid/abuse — geen rate-limit/dedup op `reportNoShow`):**
>   `reportNoShow` (`src/app/(protected)/samenwerkingen/no-show-actions.ts:18-65`) is aanroepbaar door
>   elke CLIENT/FRANCHISER die partij is bij een ACTIVE/CANCELLED samenwerking en heeft — anders dan
>   élke sibling-UGC-mutatie (`sendMessage`→`messageRateLimiter`, `inviteFreelancerToJob`→
>   `inviteRateLimiter`, uploads→`uploadRateLimiter`) — **geen rate-limiter** noch **dedup**.~~
>   **GEDAAN (2026-07-23, PR #883):** twee lagen, geen schemawijziging (dus geen `db push`-risico op
>   bestaande data). (1) `noShowReportRateLimiter` (`rate-limit.ts`, default `NO_SHOW_REPORT_RATE_LIMIT=10`/
>   melder/uur, parity met invite/message/application) vóór de reads/writes → nette veldfout bij
>   overschrijding, geen throw. (2) Same-day-dedup: `findFirst` op `collaborationId` + het UTC-dagvenster
>   van `occurredOn` (nieuwe pure `noShowOccurredOnDayRange` in `no-show.ts`) vóór de create → dezelfde
>   gemiste dienst per dag maar één keer meldbaar, ook bij een geknutselde POST met tijdcomponent. De
>   ownership-/rol-/statuspoort blijft ongewijzigd de bron van toegang (defense-in-depth). +5 tests
>   (1 limiter-venster in `rate-limit.test.ts`, 4 dagvenster in `no-show.test.ts`).
> - **LOW (defense-in-depth, vangrail-dekkingsgat):** de "elke `findMany()` heeft `take:` of een
>   `unbounded-allow`-marker"-vangrail (`src/lib/unbounded-queries.test.ts:52-53`, `walkAppDir`) scant
>   alleen `src/app`, nooit `src/lib` — er staan ongemarkeerde onbegrensde `findMany()`'s onder `src/lib`
>   (o.a. `account-export.ts`, `actions/drawer-data.ts`, `franchise/dienst-voordracht.ts:224`). Geen daarvan
>   is nu attacker-inflatable (cron/eigen-data/eigen-tenant), maar een tóekomstige `src/lib`-toevoeging met
>   een echt door onbevoegden opblaasbare tabel glipt er stil doorheen. **Fix-richting:** `walkAppDir()` óók
>   `src/lib` laten lopen (of een parallelle `src/lib`-vangrail). Prioriteit: LOW.

> **Datum:** 2026-07-22 (run 44) · **main-commit basis:** `40eb1485`
> **Uitkomst:** **3 bevindingen GEVONDEN + GEFIXT.** Live doorklik-sweep (Playwright/Chromium, alle vier
> rollen) + drie parallelle Opus-audits (authz/IDOR/cross-tenant/document-privacy; malicieuze invoer +
> verboden statusovergangen; next-action-correctheid). Live geverifieerd **schoon**: privilege-escalatie
> (elke niet-admin-rol → redirect `/dashboard`), IDOR/cross-tenant op échte id's (collab/factuur/document/
> PDF/dossier → anti-oracle 404 "Niet gevonden."), onzin-id's (nette not-found, geen 500), en DOEL 1b
> end-to-end op het nieuwste oppervlak (uitnodiging-respons: actie uitgevoerd → verdween correct 4→3).
>
> **GEVONDEN + GEFIXT — MED/robuustheid (DOEL 2, malicieuze invoer → 500):** `createFranchiseDienst`
> (`src/lib/franchise/dienst.ts:25` schema + `:116` gebruik) had `startDate: z.string().trim().optional()`
> — élke string passeerde — en bouwde daarna `new Date(startDate)` **zonder isNaN-guard**, dat als
> `Invalid Date` doorstroomde naar `prisma.job.create` (DateTime-kolom) → `PrismaClientValidationError`.
> `publishDienst`/de wizard vangen alleen `AuthorizationError`, dus de throw werd een ongevangen
> server-action-fout → **500 / generieke error-boundary** i.p.v. een nette veldfout. Een franchiser die
> een dienst publiceert met een geknutselde `startDate=onzin` triggerde dit. **Geschonden regel:**
> CLAUDE.md regel 2 (Zod-validatie vóór actie) + DOEL 2 (malicieuze invoer → nette weigering, geen 500).
> Enige uitzondering: elk zibling-datumpad guardt al correct (`jobSchema.startDate` = `z.coerce.date()`,
> performance/uitgaven met isNaN). **Fix:** `dienstSchema.startDate` spiegelt nu `jobSchema`
> (`z.union([z.literal(""), z.coerce.date()]).optional().transform(...)`) — leeg → geen startdatum,
> onzin → Zod-veldfout. Rood→groen: 3 tests (`dienst.test.ts`: geldige datum → Date; leeg → undefined;
> onzin → geweigerd).
>
> **GEVONDEN + GEFIXT — MED (DOEL 1b, cross-surface: OPEN dienst-overname mist op /acties):** een OPEN
> `ShiftHandoff` werd door de nav-badge geteld (franchiser tenant-scoped `openHandoffs`; admin
> platform-breed `openAdminHandoffs`, beide `attention`) maar ontbrak volledig op `/acties`, de
> dashboard-"Volgende acties"-zone én de `/acties`-teller (`pendingTaskCount`) — `franchiserTasks`/
> `adminTasks` (`pending-tasks.ts`) bouwden geen overname-taak. De nav-badge riep dus "actie vereist"
> terwijl het actiecentrum zweeg over dezelfde verplichting (het "signaal op één oppervlak"-anti-patroon).
> Op een OPEN overname is de franchiser/admin genuine "aan zet" (`shift-handoff.ts`: franchiser óf admin
> beslist). **Geschonden regel:** DOEL 1b (één bron van waarheid; badge/acties/detail gelijk). **Fix:**
> nieuwe pure builder `shiftHandoffTask` (`tasks.ts`, prio `P.disputeOpen`=76, tone `attention`, href
> `/franchise/shift-overnames` resp. `/admin/shift-overnames` — exact de badge-hrefs uit `signals.ts`);
> geëmit uit `franchiserTasks` (tenant-scoped) + `adminTasks` (platform-breed) met dezelfde `status:"OPEN"`-
> query als de badge → verdwijnt zodra APPROVED/REJECTED/CANCELLED. Rood→groen: 4 tests
> (`pending-tasks.shift-handoff.test.ts`: franchiser 1×, admin 1×, andere tenant 0×, APPROVED 0×).
>
> **GEVONDEN + GEFIXT — LOW/security (DOEL 2, CWE-203 cross-tenant existence-oracle):** `setDienstStatus`
> (`src/app/(protected)/franchise/diensten/actions.ts:32-33`) gebruikte `assertSameTenant` (gooit
> onderscheidbare `AuthorizationError("Geen toegang tot deze bemiddeling-resource.", 403)`) i.p.v. de
> geünificeerde `ownsViaTenant`-melding — een onbekend id gaf "Dienst niet gevonden.", een dienst van een
> ándere tenant een andere 403, waarmee een franchiser het bestaan van andermans dienst kon aftasten.
> Zelfde bugklasse die het team al fixte in `admin/shift-overnames` (`ee458d26`); `proposeFreelancer` in
> hetzelfde bestand deed het al goed. **Fix:** `if (!job || !ownsViaTenant(actor, job.tenantId)) throw
new Error("Dienst niet gevonden.")` — onbekend én cross-tenant geven nu exact dezelfde melding, geen
> update/audit. Rood→groen: 1 test (`set-dienst-status.test.ts`: cross-tenant = zelfde melding, DB niet geraakt).

> **Datum:** 2026-07-22 (run 43) · **main-commit basis:** `c0cd40bc`
> **Uitkomst:** **3 bevindingen GEVONDEN + GEFIXT.** Drie parallelle Opus-audits (authz/IDOR/cross-
> tenant/document-privacy; malicieuze invoer + verboden statusovergangen; next-action-correctheid over
> alle vier rollen). De malicieuze-invoer/status-audit kwam **schoon** terug (elke mutatie:
> auth→rol→ownership→Zod/bounds→state-machine-assert→transactie→audit, met TOCTOU-herchecks binnen de
> transactie; datum/uren/bedrag-parsing double-guarded met `isNaN`/`Number.isFinite` vóór de DB; shift-
> DoS begrensd via `MAX_SHIFT_HOURS`/`MAX_SHIFTS_PER_PERFORMANCE`; cascade-transities via `assert`).
>
> **GEVONDEN + GEFIXT — HIGH (DOEL 1b, cross-surface: CLIENT contract-onderteken-badge ontbrak):**
> de CLIENT-nav-badge `cascadeWork` (`signals.ts` navBadges CLIENT-tak) berekende `cascadePerf +
cascadeInv` — alléén SUBMITTED-prestaties + SUBMITTED-facturen — en telde de **PROPOSED-samenwerking**
> (contract nog te ondertekenen) NIET, terwijl de FREELANCER-tak (`countFreelancerCascadeWork`, PROPOSED
> → +1), `/acties` (`pending-tasks.ts` `contractSignTask`, prio `P.contractSign=72`) én de cascade-fase
> (`stage.ts` `youAreUp: true` voor béíde partijen op een niet-getekend contract) 'm wél tonen. Gevolg:
> een opdrachtgever met alléén een nog-te-tekenen contract als open cascade-item zag de `/samenwerkingen`-
> zijbalk-badge op 0 terwijl /acties + de samenwerking-detail "Contract ondertekenen" toonden — de badge
> sprak twee andere surfaces tegen (het "signaal op één oppervlak"-anti-patroon, hier omgekeerd: signaal
> mist op de badge). **Geschonden regel:** DOEL 1b (één bron van waarheid; badge/acties/detail gelijk) +
> server-side waarheid. **Fix:** nieuwe dispuut-gescopete PROPOSED-telling
> (`collaboration.count({ company:{userId}, status:"PROPOSED", disputedAt:null })`) opgeteld via de nieuwe
> pure helper `countClientCascadeWork` (symmetrisch met `countFreelancerCascadeWork`, los testbaar).
> Rood→groen: 4 tests (`signals.test.ts` 3× helper; `signals.cascade-dispute.test.ts` 1× dispuut-scope).
>
> **GEVONDEN + GEFIXT — MED/security (DOEL 2, CWE-203 existence-oracle op de gevoeligste routes):**
> de zes on-demand document/PDF/dossier-`api`-routes (`/api/documents/[id]`, `facturen/[id]/pdf`,
> `prestaties/[id]/pdf`, `samenwerkingen/[id]/{dossier,dba-dossier,modelovereenkomst}`) gaven **404 "Niet
> gevonden."** voor een onbekend id maar een onderscheidbare **403 "Geen toegang."** voor een geldig-maar-
> vreemd id — direct waarneembaar via HTTP-status + body. Op VOG/diploma/BIG-document-id's verraadt dat
> het bestaan van andermans gevoelige document (ja/nee-oracle), inconsistent met het anti-oracle-standpunt
> dat de rest van de codebase zelf hanteert (`assertSameTenant`/`ownsViaTenant`, identieke respons voor
> onbekend vs cross-tenant). **Geschonden regel:** documenten privé (CLAUDE.md regel 4) + DOEL 2 (nette,
> ononderscheidbare weigering). **Fix:** cross-party geeft nu exact dezelfde 404 "Niet gevonden." als een
> onbekend id; de `*_ACCESS_DENIED`-audit blijft (IDOR-enumeratie zichtbaar in het spoor). Rood→groen:
> 2 nieuwe tests (`documents/[id]/route.test.ts`) + 5 bijgewerkte assertions (`pdf-routes-audit.test.ts`,
> `dossier-routes-audit.test.ts`).
>
> **GEVONDEN + GEFIXT — MED (DOEL 1b, niet-deterministische acute-dienst-slice):** de `openDiensten`-query
> in `franchiserTasks` (`pending-tasks.ts`) had `take: MAX (50)` **zonder `orderBy`** — welke 50 van een
> tenant met >50 gepubliceerde diensten terugkwamen was niet-deterministisch. Die query voedt zowel de
> `franchiseAcuteDienstTask`-aggregaat als de `acuteDienstIds`-dedup-set; een genuine-acute dienst (start
> deze week / geen startdatum) buiten de arbitraire slice werd onderteld t.o.v. de onbegrensde
> `/franchise/diensten`-pagina én kon als minder-urgente `franchise-stale-service` opduiken i.p.v. de
> acute bucket. **Fix:** `orderBy: [{ startDate: { sort:"asc", nulls:"first" } }, { createdAt:"asc" }]`
> — acuut-eerst (`isStartAcute` telt null-start + vroeg-start als acuut), deterministisch en consistent
> met de acute-definitie op de pagina.

> **Datum:** 2026-07-21 (run 42) · **main-commit basis:** `ae64d9f7`
> **Uitkomst:** **2 bevindingen GEVONDEN + GEFIXT** — 1 MED (DOEL 2, malicieuze invoer: ongeldige
> prestatie-periode-datum viel door naar Prisma) én 1 MED (DOEL 1b, cross-surface-inconsistentie:
> lead-opvolgtaak op /acties gebruikte een andere overdue-grens dan de badge + leadpagina). Drie
> parallelle Opus-audits (authz/IDOR/cross-tenant/document-privacy; malicieuze invoer + verboden
> statusovergangen; next-action-correctheid over alle vier rollen). De authz/IDOR/tenant-audit kwam
> **schoon** terug (alle document-/PDF-/dossier-routes checken ownership ná de DB-lookup + audit;
> franchise-acties her-checken `assertSameTenant`/`ownsViaTenant` vóór elke write; cross-tenant vs
> onbekend-id geven identieke responses — geen existence-oracle).
>
> **GEVONDEN + GEFIXT — MED (DOEL 2, malicieuze invoer: ongeldige periode-datum → generieke catch-all):**
> `parsePerformanceInput` (`samenwerkingen/[id]/actions.ts:94-95`) bouwde `periodStart`/`periodEnd` met
> bare `new Date(raw)` zonder `isNaN`-check, en `validatePerformanceForm` (`validation.ts:375`) toetste
> de periode **alléén** als bíede ruwe waarden truthy waren én controleerde enkel `s > e` (NaN-datums
> werden overgeslagen). Een geknutselde form-POST naar `logAndSubmitPerformanceAction`/
> `editAndResubmitPerformanceAction` met `type=HOURS`, `periodStart=onzin` (of één losse garbage-datum)
> passeerde zo de validatie en stroomde als `Invalid Date` door naar `prisma.performance.create` →
> `PrismaClientValidationError` → gevangen door `toSafeActionError` → **generieke** "Er is een fout
> opgetreden"-melding i.p.v. een leesbare veldfout (geen 500/lek, maar een gat tegen "Zod-validatie op
> elke mutatie" + herhaalbare interne-error-logruis). **Geschonden regel:** CLAUDE.md regel 2 (validatie
> vóór actie) + DOEL 2 (malicieuze invoer → nette weigering). **Fix (twee lagen):** (1) `isNaN`-weigering
> in `parsePerformanceInput` vóór de DB-lookup; (2) `validatePerformanceForm` weigert nu élke losse
> ongeldige datum ("Vul een geldige periode in") — de pure validator is op zichzelf correct én
> unit-getest. Rood→groen: 2 tests in `validation.test.ts` (garbage periodStart; losse garbage periodEnd).
>
> **GEVONDEN + GEFIXT — MED (DOEL 1b, cross-surface-inconsistentie op de lead-overdue-grens):**
> de bemiddelaar-taak "lead wacht op opvolging" op /acties (`pending-tasks.ts:769`, feed van
> `franchiseLeadFollowupTask`) telde met een **timestamp**-grens (`nextFollowUp: { lte: now }`), terwijl
> de nav-badge (`overdueLeads`, `signals.ts:378`) én de "— te laat"-markering op `/franchise/leads`
> (`page.tsx:93-96`) een **dagniveau**-grens (`< startOfUtcDay`) gebruiken. Gevolg: een lead die eerder
> vandaag verviel (bv. 09:00, bekeken om 15:00) verscheen wél als taak op /acties én verhoogde de
> algemene /acties-teller, maar de `/franchise/leads`-badge bleef 0 en de lead was op zijn eigen pagina
> niet "te laat" — tot ~24u lang, elke dag. Precies het anti-patroon "drie surfaces spreken elkaar
> tegen". **Geschonden regel:** DOEL 1b (één bron van waarheid; /acties, badge en lijst gelijk) +
> server-side waarheid. **Fix:** `pending-tasks.ts` gebruikt nu dezelfde `lt: startOfUtcDay(now)`-grens
> (import van `startOfUtcDay` uit `signals.ts`, geen circulaire import). Rood→groen: 2 tests in
> `pending-tasks-franchiser.test.ts` (lead die eerder-vandaag verviel telt NIET; lead van gisteren telt WÉL).
>
> **GEPARKEERD uit deze run (repro + prioriteit, voor een volgende increment):**
>
> - **NIT (code-health / herhaal-defect-risico):** twee volledige parallelle "next-action"-aggregaat-
>   engines zijn dode code, niet gekoppeld aan enige UI: `freelancerNextActions`/`clientNextActions`/
>   `adminNextActions` in `src/lib/next-actions.ts` (alleen `franchiserNextActions` is echt gewired via
>   `franchiseGuidedSetupTasks`) en `cascadeFreelancerActions`/`cascadeClientActions` in
>   `src/lib/cascade/next-actions.ts` — buiten hun eigen testbestanden nul productie-callers. Dit is een
>   bewezen defect-vector: `pending-tasks-client-compliance.test.ts` documenteert dat een compliance-
>   ripple-signaal ooit alléén in de dode `clientNextActions` leefde en apart naar de item-engine moest
>   worden geport. `cascade/next-actions.ts` is al verder gedrift (`P.payment=58` maakt geen onderscheid
>   OVERDUE vs APPROVED, anders dan de live `paymentConfirmTask`). Aanbeveling: beide dode modules
>   verwijderen (of wiren en de duplicaat item-engine-logica schrappen). Prioriteit: LOW. Aparte PR
>   (raakt veel testbestanden; geen gebruikersimpact — puur drift-preventie).

> **Datum:** 2026-07-21 (run 41) · **main-commit basis:** `567322d2`
> **Uitkomst:** **1 HIGH (DOEL 2, robuustheid — onbegrensde dienst-doorloop-lus → event-loop-DoS)
> én 1 MED (DOEL 1b, contradictoire/dode CLIENT-cascadebadge op een bevroren deal) gevonden én
> OPGELOST.** Verse prod-build (`npm run build`, exit 0) + drie parallelle Opus-audits (next-action-
> correctheid over alle vier rollen; authz/IDOR/cross-tenant/document-privacy; malicieuze invoer +
> verboden statusovergangen). Vier rollen via het echte credentials-endpoint (`demo1234`).
>
> **GEVONDEN + GEFIXT — HIGH (DOEL 2, robuustheid — onbegrensde O(duur)-lus blokkeert de event-loop):**
> `segmentShift` (`src/lib/shift.ts:87`) loopt een dienst `[start, end)` in vaste stappen van 15 min
> door om ORT-categorieën af te leiden; de kosten zijn O(duur) **zonder bovengrens**. Reachable via
> `logAndSubmitPerformanceAction` (`samenwerkingen/[id]/actions.ts:189` → `parsePerformanceInput` →
> `segmentShifts`, regel 128) — dat draait **vóór** `createPerformance`'s ownership/ACTIVE/dispuut-
> checks en de shift-validatie (`:111-115`) toetste alleen `isNaN` + `end<=start`, **geen maximale
> duur**. Een geknutselde POST als élke geauthenticeerde gebruiker (elke rol, willekeurige/afwezige
> `collaborationId`) met `shiftStart=2000-01-01T00:00`, `shiftEnd=9999-12-31T23:59` → `new Date(...)`
> is een geldige eindige tijd → passeert de checks → `segmentShift` draait ~2.8×10⁸ iteraties
> (uitrekbaar tot ~10¹⁰ via jaar 275760) **synchroon op de request-thread** → event-loop-blokkade voor
> het hele proces (effectieve DoS/request-timeout). De bestaande `MAX_PERFORMANCE_HOURS`-grens vuurt pas
> **ná** de lus. Tweede pad: CSV-import (`diensten.ts:parseCsvShifts` → `importDienstenAction`) — één
> CSV-rij `2000-01-01T00:00;9999-12-31T23:59` triggert dezelfde lus vóór `assertPerformanceWithinLimits`.
> **Geschonden regel:** server-side waarheid (CLAUDE.md regel 1 — de `datetime-local max` is niet
> af te dwingen) + DOEL 2 (malicieuze invoer → nette weigering, nooit een hang). **Fix (defense-in-
> depth, drie lagen):** (1) harde duurgrens `MAX_SHIFT_HOURS = 1000` in de pure motor `segmentShift`
> (throw bij `end-start > MAX·uur` — de lus kan nooit meer onbegrensd draaien, ongeacht caller);
> (2) nette input-weigering vóór segmentatie in `parsePerformanceInput` (duur én
> `MAX_SHIFTS_PER_PERFORMANCE = 100` dienstrijen — begrenst óók de rij-amplificatie) én in
> `parseCsvShifts` (regelfout per dienst). Rood→groen: `shift.test.ts` (4 duurgrens-tests, incl. een
> `< 1000ms`-hang-assert op jaar 9999) + `diensten.test.ts` (1 CSV-duurtest). De grens (1000 u ≈ 42
> dagen) is ruim boven elke echte aaneengesloten dienst en spiegelt de bestaande `MAX_PERFORMANCE_HOURS`.
>
> **GEVONDEN + GEFIXT — MED (DOEL 1b, contradictoire/dode CLIENT-cascadebadge op een bevroren deal):**
> de CLIENT-navbadges `cascadeWork` + `pendingPerformances` (`src/lib/signals.ts:334-340`, in
> `navBadges`) telden een **SUBMITTED-prestatie** en een **SUBMITTED-cascadefactuur** op een
> **BEVROREN (dispuut)** samenwerking mee — de FREELANCER-tak (`:279-284`) had de `disputedAt: null`-
> grens wél, de CLIENT-tak niet. Gevolg: bij een open dispuut (`disputedAt` gezet, status blijft
> ACTIVE, prestatie blijft SUBMITTED) toont het collab-detail "Dispuut — werkproces bevroren"
> (`cascade/stage.ts:68`, youAreUp false) en `/acties` géén goedkeur-taak (`pending-tasks.ts:652`
> filtert `disputedAt:null`), maar de `/samenwerkingen`- én `/prestaties`-zijbalkbadges telden het nog
> als werk "aan zet". Klikt de opdrachtgever door, dan weigert `approvePerformance`/`approveInvoice`
> server-side (`assertNotDisputed`) → een dode, tegenstrijdige teller. **Geschonden regel:** DOEL 1b
> (next-action/badge mag de cascade-fase niet tegenspreken; één bron voor /acties, rail én badge) +
> server-side waarheid. **Fix:** `collaboration: { …, disputedAt: null }` toegevoegd aan beide CLIENT-
> cascadequery's — symmetrisch met de FREELANCER-tak en met `/acties`. Rood→groen:
> `signals.cascade-dispute.test.ts` (2 tests: prestatie- én factuurtelling scopen op een
> niet-bevroren samenwerking).
>
> **DOEL 1 (werkt het, live):** verse prod-build (exit 0), vier rollen ingelogd. Authz/IDOR/tenant-
> audit kwam **schoon** terug: alle document-/PDF-/dossier-routes gaten ownership ná de DB-lookup +
> audit (403/404, nooit 200-met-data); franchise-acties her-checken `ownsViaTenant`/`assertSameTenant`
> vóór de write; cross-tenant vs onbekend-id geven identieke responses (geen existence-oracle); de
> nieuwe `db-selftest` is ADMIN-only + rate-limited + strikt read-only (geen data-/`DATABASE_URL`-lek).
>
> **Checks:** `npm run typecheck` · `npm run lint` (✔ 0 warnings) · `npm run test`
> (**4686 passed**, +7) · `npm run build` (exit 0) · `npx prettier --write .` — allemaal groen.
>
> **GEPARKEERD uit deze run (repro + prioriteit, voor een volgende increment):**
>
> - ~~**MED (DOEL 1b, contradictoir op het collab-detail — multi-cycle):** `cascadeStage` (`stage.ts:100-104`
>   & `:117-120`) roept de prior-cycle-rescue `priorCycleFreelancerPhase` **alleen** aan onder
>   `perf === "SUBMITTED"`; bij `perf === "REJECTED"` of `null/"DRAFT"` valt een nog-open cycle-1-factuur
>   (DRAFT/REJECTED/APPROVED/OVERDUE) stil weg (`stage.ts:75` nult de factuur voor álle takken). De
>   item-engine (`pending-tasks.ts:463-482`) toont wél beide taken. **Repro:** FREELANCER, ACTIVE collab,
>   cycle-1-factuur APPROVED niet betaald, dan cycle-2-uren DRAFT of REJECTED → `/acties` toont "markeer
>   betaling" + "corrigeer uren", maar het collab-detail/dashboard "Wat loopt er nu" verbergt de betaal-
>   actie. Narrow (multi-cycle) maar reachable.~~ **GEDAAN (2026-07-21, PR #859):** de multi-cyclus-rescue
>   is uit de SUBMITTED-tak gehaald en vóór álle prestatie-fasen geplaatst (`isFreelancer &&
performanceNewerThanInvoice` → `priorCycleFreelancerPhase`). Een openstaande vorige-cyclus-factuur
>   staat verder in de keten dan een verse cyclus-2-prestatie en wint dus als primaire fase, ongeacht of
>   die nieuwe prestatie null/DRAFT/REJECTED/SUBMITTED/APPROVED is; `priorCycleFreelancerPhase` geeft
>   `null` zodra de vorige factuur niets meer van de ZZP'er vraagt (SUBMITTED/PAID/…) → de reguliere fase
>   neemt dan over. Freelancer-only (de opdrachtgever ziet ongewijzigd zijn eigen fase). Detail, dashboard
>   én /acties tonen nu dezelfde betaal-/factuuractie. +7 tests in `stage.test.ts`.
> - ~~**MED-LOW (DOEL 1b, niet-verdwijnende next-action):** `collaborationRenewalTask` (`tasks.ts:717-743`,
>   gated `collaboration-renewal.ts:57`) vuurt attention voor een over-de-einddatum ACTIVE-samenwerking
>   (`overdue`) onbeperkt; de "vervolg"-actie verandert `status`/`endDate` van díe samenwerking niet, dus
>   de taak is nergens afhandelbaar — exact het anti-patroon dat de codebase voor no-shows bewust vermeed
>   (`no-show.ts:41-46`). Overweeg 'm (net als no-show) naar een passief dashboardsignaal te verplaatsen,
>   of de over-de-einddatum-tak te dempen na N dagen.~~ **GEDAAN (2026-07-21, PR #858):** grace-venster
>   `RENEWAL_OVERDUE_GRACE_DAYS = 30` in het pure `summarizeCollaborationRenewal` (nieuwe fase `"lapsed"`,
>   `attention: false` voorbij grace) → /acties, badge, dashboard-rail én detail-nudge convergeren via de
>   ene bron; `renewalTasks`-query kreeg een `gte`-grace-vloer. Tests +6.
> - ~~**LOW (DOEL 1b, dubbeltelling):** een understaffte PUBLISHED-dienst (≥7 dagen open, geen ACTIVE
>   collab, start deze week/verleden) wordt zowel in `franchiseAcuteDienstTask` (aggregate) als als
>   specifieke `franchiseStaleDienstTask` geteld (`pending-tasks.ts:840-851` + `:880-883`) → dezelfde
>   dienst telt twee keer in de badge.~~ **GEDAAN (2026-07-21, PR #865):** de stale-lijst filtert nu de
>   diensten weg die al in het acute-aggregaat zitten (`acuteDienstIds`-set, zelfde `isStartAcute`-
>   definitie als het aggregaat). De acute-tak is het urgentere, gebundelde signaal en wint; de
>   stale-lijst toont alleen de resterende, niet-acute lang-open diensten (starten later) → elke dienst
>   telt precies één keer op /acties + in de badge. +2 tests in `pending-tasks-franchiser.test.ts`.
> - **LOW (defense-in-depth, latent):** de middleware-matcher (`src/middleware.ts:158`) sluit elk pad
>   mét een punt uit van de middleware (incl. de rol-redirects); vandaag veilig omdat elke admin-/
>   franchise-pagina zelf `requireRole` doet. Overweeg een lint/test die afdwingt dat elke admin-/
>   franchise-paginamodule `requireRole` aanroept, zodat de middleware nooit de enige laag wordt.

> **Datum:** 2026-07-20 (run 40) · **main-commit basis:** `e7c947aa`
> **Uitkomst:** **2 bevindingen (1 MED + 1 LOW, DOEL 2 — dispuut-vries niet volledig over de
> statusmutatie-familie) gevonden én OPGELOST**; 4 DOEL-1b-bevindingen (2 MED + 2 LOW) uit de
> next-action-audit geparkeerd met repro. Verse prod-build (`npm run build`, exit 0) + idempotente
> demo-seed (`SEED_DEMO=true`) op ephemere SQLite (`qa.db`), prod-server (`node scripts/start.mjs`,
> poort 3100, `LOGIN_/REGISTER_RATE_LIMIT=100000`). Vier rollen ingelogd via het echte
> credentials-endpoint (`demo1234`). Live adversariële HTTP-probes + drie parallelle Opus-audits
> (next-action-correctheid, cascade/invoice-authz + numerieke grenzen, tenant-isolatie/doc-privacy).
>
> **DOEL 1 (werkt het, live):** privilege-escalatie (ZZP/CLIENT/FRANCHISER → `/admin/*`; admin →
> `/franchise`) → **307-redirect**, nooit 200/500. Cross-party read (andermans samenwerking/factuur
> via echt id) → soft-403-paneel (HTTP 200, "geen toegang", **géén datalek**). Document-download
> (`/api/documents/<id>`) cross-party → **403**; cross-party factuur/prestatie-PDF (`/api/facturen/…/pdf`,
> `/api/prestaties/…/pdf`) → **403/404** met audit; eigen PDF → 200 `application/pdf`. Junk/traversal-id
> → soft-404. CRON (`/api/tasks/*`) fail-closed **503** zonder `CRON_SECRET`; billing-webhook zonder
> handtekening → altijd 200 (provider verifieert, geen retry-storm, default-provider inert).
>
> **GEVONDEN + GEFIXT — MED (DOEL 2 — dispuut bevriest de statuswijziging niet):** `applyCollaborationStatusChange`
> (`src/app/(protected)/samenwerkingen/actions.ts`, via `changeCollaborationStatus`/`cancelCollaboration`)
> was de **enige** statusmutatie op een samenwerking die `disputedAt` **niet** las. De hele
> cascade-command-familie bevriest bij een open dispuut (`assertNotDisputed` / in-tx
> `disputeGuardCollaborationId`). Gevolg: een partij kon een **bevroren** (`disputedAt` gezet) deal
> unilateraal op **COMPLETED** zetten; `cascadeStage` evalueert COMPLETED (stage.ts:65) vóór
> `disputed` (stage.ts:68), dus de fase-badge flipte van "Dispuut — bevroren" naar "Afgerond ✓" en
> **maskeerde het open dispuut** tijdens een admin-only governance-hold (`resolveDispute` is
> ADMIN-only). **Geschonden regel:** statusovergang/dispuut-vries + consistentie met de
> command-familie (CLAUDE.md "dispuut bevriest de cascade"). **Fix:** pre-transactionele **én**
> in-transactie (TOCTOU-dichte) dispuut-vries op COMPLETED/CANCELLED. Rood→groen:
> `dispute-freeze-status.test.ts` (4 tests).
>
> **GEVONDEN + GEFIXT — LOW (DOEL 2, defense-in-depth — signContract bevriest niet):** `signContract`
> (`src/lib/cascade/contract-commands.ts`, event A) las `disputedAt` niet en gaf géén
> `disputeGuardCollaborationId` mee. Omdat `openDispute` een dispuut op een PROPOSED samenwerking
> toestaat (geen status-check), kon: dispuut openen → `signContract` → PROPOSED→ACTIVE op een bevroren
> deal (downstream cascade bevriest daarna wél, dus impact bleef bij die ene contractstap). **Fix:**
> pre-check + `disputeGuardCollaborationId: collaborationId` (in-tx grendel), symmetrisch met de
> familie. Rood→groen: `contract-dispute-freeze.test.ts` (2 tests). (Twee bestaande happy-path tests —
> `completion-race.test.ts`, `idempotency.test.ts` — kregen de nieuwe in-tx `collaboration.findUnique`
> in hun tx-mock.)
>
> **Checks:** `npm run typecheck` · `npm run lint` · `npm run test` (**4642 passed**, +6) ·
> `npm run build` (exit 0) · `npx prettier --check .` — allemaal groen.
>
> **GEPARKEERD uit deze run (DOEL 1b, next-action-audit — repro + prioriteit, voor een volgende increment):**
>
> - ~~**MED (single-source-schending):** de **franchiser**-dashboardrail wijkt af van `/acties` + de
>   badge. `dashboard/page.tsx:643` bouwt `franchiserNextActions(...)` en voegt die bij
>   `fActionSource` (`:1022`), terwijl `franchiserTasks` (`pending-tasks.ts:710-849`) géén
>   guided-setup-items levert.~~ **GEDAAN (2026-07-20, PR #852):** geleide opzet naar de item-engine
>   geport — nieuwe `franchiseGuidedSetupTasks` (`actions/tasks.ts`) wraps de guided-tak van
>   `franchiserNextActions` als ENIGE bron van waarheid (tekst/href/tone/prioriteit) en levert
>   `PendingTask[]` (kind `franchise-guided-setup`, resolver `link` → `default`-tak, geen UI-wiring);
>   gewired in `franchiserTasks` (4 extra tenant-gescopete counts in de bestaande `Promise.all`). De
>   dashboard-rail bron is nu puur `tasks` (`activation`-veld volledig verwijderd). `/acties`, de
>   badge én de rail delen zo exact één bron — spiegelt de run-38-fix voor de operationele items.
>   +3 tests. Gate: typecheck, lint, unit-tests, build, prettier groen.
> - ~~**MED (verkeerde partij "aan zet" + tegenstrijdige subtitel):** `clientComplianceTask` toont de
>   **opdrachtgever** een attention-taak "Certificaat van X in beoordeling — handel vóór het certificaat
>   vervalt" wanneer een vereist certificaat enkel een **SUBMITTED** (verse indiening, `inReview`,
>   `gap=false`) cert heeft.~~ **GEDAAN (2026-07-20, PR #853):** nieuwe pure predicate
>   `clientHasComplianceAction(alert)` (`collaboration-alerts.ts`) — gap (ontbrekend/verlopen) of
>   binnenkort-verlopend → client is aan zet; **alleen `inReview` → nee** (admin verifieert). Gate in
>   `pending-tasks.ts` (`clientTasks`) emit de client-compliance-taak alleen bij een échte client-actie;
>   een inReview-only-melding blijft wél zichtbaar als informatieve telling in de dashboard-momentopname
>   (`summarizeClientCompliance`), maar niet als openstaande next-action. Voedt `/acties`, rail én badge
>   (één bron). +7 tests. Gate: typecheck, lint, unit-tests, build, prettier groen.
> - ~~**LOW (niet-verdwijnende taak):** `noShowWarningTask` staat permanent in `/acties` + badge voor elke
>   ZZP'er met ≥1 `UNJUSTIFIED` no-show — er is geen afhandel-pad (verdicts zijn blijvende historie). Botst
>   met de `/acties`-belofte "afgehandelde acties verdwijnen vanzelf".~~ **GEDAAN (2026-07-21, PR #854):**
>   verplaatst naar een passief historie-signaal op het ZZP-dashboard. Nieuwe pure `noShowStandingNotice`
>   (`no-show.ts`, enige bron) + passief `WsNotice`/`notice`-slot op `WorkspaceDashboard` (warning onder de
>   grens, danger op de grens); de FREELANCER-dashboardtak telt de ongegronde no-shows + deep-link naar de
>   recentste melding. Het no-show-taakblok is uit `freelancerTasks` verwijderd (`noShowWarningTask` + de
>   `no-show-warning` kind weg; viel op de default link-resolver → geen registry-wijziging). +8 tests.
>   Gate: typecheck, lint, 4671 unit-tests, build, prettier groen.
> - ~~**LOW (dubbele taak + verkeerde deep-link):** een verplicht certificaat-type met een `REJECTED`
>   **én** een VERIFIED-maar-verlopen cert levert twee taken (`credential-fix` →
>   `/certificaten/{id}/bewerken` én `mandatory-document` → `/certificaten/nieuw?type=…`); de
>   rejected-vs-missing-dedup (`pending-tasks.ts:369-372`) slaat alleen `state==="missing"` over, niet
>   `"expired"`. Ook wijst de verlopen-deeplink naar "nieuw aanmaken" i.p.v. verlengen.~~ **GEDAAN
>   (2026-07-21, PR #856):** de rejected-vs-mandatory-onderdrukking dekt nu élke niet-satisfied staat
>   (`missing` én `expired`) — een afgewezen cert onderdrukt óók de mandatory-taak wanneer dat type
>   dáárnaast een VERIFIED-maar-verlopen cert heeft (dat het als `expired` classificeert); de
>   `credentialFixTask` blijft de enige canonieke rij. De `expired`-mandatory-taak deep-linkt nu naar
>   het VERLENGEN van het bestaande certificaat (`/certificaten/{credId}/bewerken`, meest recent
>   verlopen exemplaar bij meerdere) i.p.v. een nieuw aanmaken; `mandatoryDocumentTask` kreeg een
>   optionele `renewCredId` + "vernieuw"-subtitel. Bestanden: `src/lib/actions/tasks.ts`,
>   `src/lib/actions/pending-tasks.ts`. +6 tests. Gate: typecheck, lint, unit-tests, build, prettier groen.

> **Datum:** 2026-07-20 (run 39) · **main-commit basis:** `dd6e2159`
> **Uitkomst:** **1 MED (DOEL 2, defense-in-depth — ontbrekende dispuut-vries op `createPerformance`)
> gevonden én OPGELOST.** Verse prod-build (`npm run build`, exit 0) + idempotente demo-seed
> (`SEED_DEMO=true`; 13 samenwerkingen / 7 facturen / 48 grootboekregels) op ephemere SQLite
> (`qa.db`), prod-server (`node scripts/start.mjs`, poort 3100, `LOGIN_/REGISTER_RATE_LIMIT=100000`).
> Vier rollen ingelogd via het echte credentials-endpoint (`demo1234`). Drie parallelle Opus-audits:
> (1) cascade/invoice-authz + numerieke grenzen, (2) next-action-correctheid over alle vier rollen,
> (3) tenant-isolatie + route-handlers/document-privacy.
>
> **DOEL 1 (werkt het, live):** alle kernschermen per rol → 200, nul 5xx (server-log schoon). Elke rol
> `/dashboard` + `/acties` → 200.
>
> **DOEL 1b (next-action-correctheid):** géén wrong/missing/duplicate/niet-verdwijnende next-action
> gevonden. Één bron (`computeTasks`) voedt `/acties`, de badge én de dashboard-rail; stage-vs-item
> in overeenstemming; disputed-samenwerkingen consistent uitgesloten voor beide partijen (alleen ADMIN
> "aan zet"); dedup-logica (rejected-vs-missing-mandatory, collab-gated-vs-generiek-expiring,
> overdue-rollup-vs-per-collab) correct. (Geparkeerde MED "verlopen niet-verplicht certificaat" wordt
> al gedekt door open PR #841 — niet gedupliceerd.)
>
> **DOEL 2 (adversarieel):** privilege-escalatie (ZZP/CLIENT/FRANCHISER → `/admin/*`; admin →
> `/franchise`) → **307-redirect**, nooit 200/500. Junk/traversal-id → soft-404 (nooit 500);
> `/api/documents/<junk>` → 404. Document-download/PDF/dossier-routes volgen consistent
> auth→ownership→404-vs-403 + audit (geen existence-oracle); cron/webhook fail-closed. Franchise-
> tenant-isolatie (`ownsViaTenant`/`assertSameTenant`) sluitend; geen cross-tenant-lek.
>
> **GEVONDEN + GEFIXT — MED (DOEL 2, defense-in-depth — dispuut bevriest de cascade niet volledig):**
> `createPerformance` (`cascade/performance-commands.ts:109`) was de **enige** prestatie-command die
> **geen** `assertNotDisputed` aanriep — álle siblings (`updatePerformance`/`submitPerformance`/
> `approvePerformance`/`autoApprovePerformance`/`rejectPerformance`) doen dat wél. Gevolg: een open
> dispuut bevriest de cascade (`disputedAt` gezet, `status` blijft ACTIVE), maar een ZZP'er kon tóch
> nog een nieuwe **concept**-prestatie (DRAFT) vastleggen op een bevroren deal. Vandaag geen
> geld-/statuslek (een DRAFT is inert tot `submitPerformance`, dat de vries wél afdwingt), maar een
> landmijn tegen de invariant "dispuut bevriest de cascade" (CLAUDE.md) — een bevroren deal mag geen
> nieuw werk accumuleren. **Geschonden regel:** statusovergang/dispuut-vries + consistentie met de
> sibling-familie. **Fix:** `await assertNotDisputed(input.collaborationId)` toegevoegd ná de
> ACTIVE-check, symmetrisch met de siblings. Rood→groen: `create-performance-dispute-freeze.test.ts`
> (2 tests: weigert concept-prestatie bij open dispuut; staat toe zonder dispuut).
>
> **GEPARKEERD uit deze run (repro + prioriteit, voor een volgende increment):**
>
> - **LOW (DOEL 2, robuustheid/consistentie):** `updatePerformance` heeft alleen een
>   pre-transactionele terminale-status-rem (bij-design, geen event/effect); de enige caller pairt het
>   altijd met `submitPerformance` (dat de volledige TOCTOU-grendel draagt). Geen geld-/statuslek —
>   park.
> - **LOW (DOEL 1b, dode metadata):** `PendingTask.resolver` (`actions/tasks.ts:32`) wordt nooit door
>   de UI gelezen (`action-list.tsx` schakelt op `task.kind` met een eigen map). Gedrag is correct,
>   maar het veld kan stil driften. Overweeg wiren-op-`resolver` of het veld droppen.
> - **LOW (DOEL 2):** admin-bulk-approve (`(protected)/prestaties/actions.ts:31-36`) is een dode knop
>   voor ADMIN (query filtert `company.userId = actor.id`, geen ADMIN-special-case). Admin routeert
>   niet naar `/prestaties`; faalt veilig/leeg.

> **Datum:** 2026-07-19 (run 38) · **main-commit basis:** `fb4d4f2e`
> **Uitkomst:** **1 HIGH (DOEL 1b, cross-surface-inconsistentie / ontbrekende next-action voor de
> bemiddelaar) gevonden én OPGELOST.** Verse prod-build (`npm run build`, exit 0) + drie parallelle
> Opus-audits: (1) franchise-tenant-isolatie + dossier-routes, (2) cascade/collaboration-authz +
> state-machine + numerieke grenzen, (3) next-action-correctheid (`pending-tasks.ts` vs dashboard/
> `next-actions.ts`/`stage.ts`) over alle vier rollen.
>
> **DOEL 2 (adversarieel):** géén reachable authz/IDOR/tenant/transitie/numeriek-bound-gat gevonden.
> Alle franchise-server-acties volgen auth→rol→tenant(`ownsViaTenant`/`assertSameTenant`)→`safeParse`→
> transitie→audit; onbekende/cross-tenant-id's collapsen naar een silent no-op (geen existence-oracle).
> Dossier-routes (`dossier`/`dba-dossier`/`modelovereenkomst`) weigeren een FRANCHISER (403 + audit) —
> stricter dan nodig, geen lek. De cascade-mutatie-oppervlakte is uniform gehard (compound-`where`-
> writes + in-transactie TOCTOU-herverificatie); numerieke grenzen (`assertPerformanceWithinLimits`,
> int4-factuur-clamp, ORT-rates) weren negatief/absurd. **Geparkeerd (defense-in-depth, niet reachable):**
> `rejectPerformance`/`rejectInvoice`/`creditInvoice`/`updatePerformance` missen de terminale-status-
> grendel (`assertCollaborationNotTerminal`/`terminalGuard`) die hun forward-cascade-siblings wél
> hebben — vandaag onbereikbaar via `cancellation/completionBlockReason`, maar een landmijn (MED).
> Admin-bulk-approve (`prestaties/actions.ts`) filtert op `company.userId = actor.id` óók voor ADMIN →
> dode knop voor admin (LOW, faalt veilig/leeg).
>
> **GEVONDEN + GEFIXT — HIGH (DOEL 1b, FRANCHISER: `/acties` + zijbalk-badge misten een hele klasse
> next-actions):** het bemiddelaar-dashboard toont zijn "Volgende acties"-rail als `[...tasks,
...activation]` — waarbij `activation` (`franchiserNextActions`) óók de **operationele**
> attentiepunten `franchiser-not-engageable-{id}` (roster-ZZP'er blokkeert plaatsing: verplicht
> document ontbreekt/verlopen of verificatie incompleet) en `franchiser-stale-service-{id}` (dienst te
> lang open zonder plaatsing) bevat. Maar `/acties` (`pendingTasks`) en de zijbalk-badge
> (`pendingTaskCount` → `computeTasks`) worden **alleen** door de item-engine (`franchiserTasks`)
> gevoed, die die twee klassen niet emitteerde. Gevolg: een bemiddelaar die aantoonbaar "aan zet" was
> (een niet-inzetbare roster-ZZP'er, een verweesde open dienst) zag dat op het dashboard, maar **niet**
> op `/acties` en het werd **niet** in de badge geteld — een MISSING/ontbrekende next-action op twee
> van de drie oppervlakken, tegen de eigen invariant "één bron voor /acties, rail én badge".
> **Geschonden regel:** next-action moet de juiste eerstvolgende stap vragen op elk oppervlak, niet
> ontbreken (DOEL 1b) + server-side waarheid. **Fix:** de twee operationele generatoren geport naar de
> item-engine (`franchiseNotEngageableTask`/`franchiseStaleDienstTask` in `tasks.ts`; berekend in
> `franchiserTasks` via dezelfde `computeEngageability`-helper + stale-dienst-drempel als het
> dashboard), en de dashboard-rail levert die items nu via `tasks` i.p.v. `activation` (geen
> dubbeltelling; guided-setup blijft in `activation`). Zo tonen `/acties`, de badge én de rail exact
> dezelfde acties. Rood→groen: `pending-tasks-franchiser.test.ts` (4 tests: INACTIEF roster-lid →
> not-engageable-taak met juiste id/tone/deep-link; verdwijnt bij volledig inzetbaar roster;
> stale-dienst-taak met dagentelling + deep-link; geen stale-taak zonder te lang open dienst).
>
> **GEPARKEERD uit deze run (repro + prioriteit, voor een volgende increment):**
>
> - ~~**MED (DOEL 2, defense-in-depth):** terminale-status-grendel ontbreekt op `rejectPerformance`
>   (`cascade/performance-commands.ts:402`), `rejectInvoice`/`creditInvoice` (`invoice-commands.ts:165,
222`) en `updatePerformance` (`performance-commands.ts:152`)~~ **GEDAAN (2026-07-19, PR #839):**
>   `assertCollaborationNotTerminal` + `terminalGuard` toegevoegd aan alle vier (met `allowCompleted`/
>   `terminalGuardAllowCompleted` voor `creditInvoice` — post-completion creditnota blijft legitiem),
>   symmetrisch met de forward-siblings (#825). +6 command-level tests. Rood→groen; gate groen.
> - ~~**MED-HIGH (DOEL 1b):** de BTW-deadline-taak (`data/vat-deadline.ts` + `administration/vat-
deadline.ts:previousQuarter`) checkt uitsluitend het net-afgesloten kwartaal; een overgeslagen,
>   nooit-ingediend kwartaalsaldo verdwijnt stil bij kwartaal-rollover (geen "afgehandeld"-vlag).~~
>   **GEDAAN (2026-07-19, PR #840):** nieuwe pure `summarizeVatDeadlines` scant alle onafgewikkelde
>   kwartalen binnen een begrensd venster (`VAT_DEADLINE_LOOKBACK_QUARTERS = 8`, 2 jaar) vanaf
>   `previousQuarter(now)` terug, oudste-eerst; data-loader `getVatDeadlinesForActor` (plural) +
>   pending-tasks-wiring emit één taak per onafgewikkeld kwartaal. Een overgeslagen kwartaal verdwijnt
>   niet meer stil bij de rollover. +11 tests. Gate groen.
> - ~~**MED (DOEL 1b):** een échte-verlopen (`EXPIRED`) NIET-verplicht certificaat (DIPLOMA/CERTIFICATE/
>   LICENSE/OTHER) geeft de ZZP'er na de expiry-notificatie géén blijvende vernieuw-next-action
>   (`pending-tasks.ts:269-279` matcht alleen REJECTED/expiring-VERIFIED, niet `EXPIRED`; mandatory
>   dekt alleen VOG/INSURANCE).~~ **GEDAAN (2026-07-20, PR #841):** `"expired"`-cause toegevoegd aan
>   `credentialFixTask` (band `P.credentialExpired = 69`); `pending-tasks.ts` emit die voor een EXPIRED
>   certificaat van een NIET-verplicht type (verplichte types blijven bij `mandatoryDocumentTask("expired")`
>   → geen dubbele rij). +3 tests. Gate groen.
> - **LOW (DOEL 2):** admin-bulk-approve (`prestaties/actions.ts:31-36`) is een dode knop voor ADMIN
>   (query filtert `company.userId = actor.id`, geen ADMIN-special-case zoals `approvePerformance`).
>
> ---

> **Datum:** 2026-07-19 (run 37) · **main-commit basis:** `dc488530`
> **Uitkomst:** **1 MED (DOEL 1b, dubbele/tegenstrijdige next-action) gevonden én OPGELOST.** Verse
> prod-build + idempotente demo-seed (`SEED_DEMO=true`; 13 samenwerkingen / 7 facturen / 48
> grootboekregels) op ephemere SQLite (`qa.db`), prod-server (`next start`, poort 3100,
> `LOGIN_/REGISTER_RATE_LIMIT=100000`). Vier rollen ingelogd via het echte credentials-endpoint
> (`demo1234`); cookie-getrouwe curl-sweep + live Playwright-doorklik (Chromium) + twee parallelle
> Opus code-audits (next-action-correctheid; cascade-authz/state-machine/IDOR/tenant-isolatie).
>
> **DOEL 1 (werkt het, live):** alle kernschermen per rol → 200, nul 5xx (server-log schoon). ADMIN
> klikte live "Goedkeuren" op `/admin/verificaties` → knoppen **6→5** én de afgehandelde next-action
> verdween; keten auth→rol→ownership→transitie→audit end-to-end correct. Geen pageerror/500 over de
> vier rollen (Playwright).
>
> **DOEL 1b (next-action-correctheid):** de live motor (`pending-tasks.ts`) is consistent met de
> data (0 pending propose-collaboration → 0 getoond, klopt). Eén dubbele/tegenstrijdige next-action
> gevonden (zie hieronder). De nieuwe `proposeCollaborationTask`/`pendingCollaborationProposals`
> (accepted-proposal.ts) is correct: vuurt alleen voor ACCEPTED-zonder-collaboration, verdwijnt na
> het voorstel, dubbelt niet met `contractSign`, ownership-gescoopt.
>
> **DOEL 2 (adversarieel, live):** privilege-escalatie (ZZP/CLIENT/FRANCHISER → `/admin/*`;
> niet-FRANCHISER → `/franchise/*`; CLIENT/FRANCHISER → `/certificaten`/`/documenten`) → **307**.
> IDOR met echte vreemde id's: vreemd document / factuur-PDF / samenwerking-dossier / dba-dossier /
> modelovereenkomst → **403**; eigen resource → 200. Detailpagina's van een vreemde resource →
> **soft-404** ("bestaat niet / geen toegang", geen data-leak). Cross-tenant: FRANCHISER →
> main-tenant zzper/opdrachtgever/samenwerking → **soft-404** (eigen-tenant zzper rendert wél).
> Cron-endpoints (`/api/tasks/*`) zonder secret → **503** (fail-closed). `billing/webhook` unsigned
> `{}` → 200 no-op (geen mutatie zonder provider-geverifieerde ref, by design). Admin-export/PDF als
> ZZP → **403**. Media path-traversal (`..%2F..%2Fetc%2Fpasswd`) → **404**. Junk/sqli/XSS in
> query-params (`' OR 1=1`, `<script>`, negatieve page/min) → **200 zonder 500**, XSS ge-escaped
> (geen live `<script>`). De cascade-authz-audit vond **geen** reachable authz/transitie/IDOR/
> tenant/audit/numeriek-bound-gat (mutatie-oppervlak uniform gehard langs auth→rol→ownership→Zod→
> actie→audit).
>
> **GEVONDEN + GEFIXT — MED (DOEL 1b, dubbele + tegenstrijdige next-action bij afgewezen verplicht
> document):** een FREELANCER met een **REJECTED** verplicht certificaat (VOG/verzekering) kreeg op
> `/acties` **twee** rijen voor hetzelfde fysieke document: (1) `credentialFixTask` ("Afgewezen
> certificaat opnieuw indienen" → `/certificaten/{id}/bewerken`, correct) én (2) `mandatoryDocumentTask`
> ("Verplicht document ontbreekt: VOG" → `/certificaten/nieuw`, **fout**). Oorzaak: een REJECTED-
> certificaat valt in de `missing`-emmer van `computeCompliance` (`matching.ts:105-113` — niet
> VERIFIED/SUBMITTED/EXPIRED), waardoor de mandatory-tak het als "ontbreekt" behandelde. De tweede rij
> wees naar het **aanmaken van een nieuw** document i.p.v. het **herstellen** van het afgewezene —
> een foutieve remediatie, en de rijen hadden verschillende id's (`credential-fix:{id}` vs
> `mandatory-document:VOG`) zodat `rankTasks` ze nooit dedupte (beide telden ook mee in de sidebar-
> badge). **Geschonden regel:** next-action moet de juiste eerstvolgende stap vragen, niet dubbelen of
> zichzelf tegenspreken (DOEL 1b) + server-side waarheid. **Fix:** in `pending-tasks.ts` de
> "missing"-mandatory-taak onderdrukken voor een type dat al een REJECTED-certificaat heeft (de
> fix-taak dekt het al, met de juiste bewerk-link); de "expired"-tak (echt verlopen certificaat,
> correcte vernieuw-link) blijft ongemoeid. Chirurgische guard: `if (doc.state === "missing" &&
rejectedTypes.has(doc.type)) continue;`. Rood→groen: `pending-tasks-rejected-mandatory.test.ts`
> (4 tests: REJECTED-VOG → alleen fix-taak; echt-ontbrekend → mandatory blijft; EXPIRED → mandatory
> blijft; REJECTED-VOG onderdrukt alleen VOG, niet een ontbrekende INSURANCE).
>
> **GEPARKEERD — LAAG (product-flow-gat, geen fout in de motor):** wanneer een CLIENT een reactie
> accepteert (application ACCEPTED) → een voorstel stuurt (PROPOSED-collaboration) → die collaboration
> **CANCELLED** wordt (geldige overgang), blijft de application op ACCEPTED staan met een
> (geannuleerde) collaboration-rij eraan. `pendingCollaborationProposals` onderdrukt de propose-taak
> (er ís een collaboration), de collabs-query sluit CANCELLED uit (geen contract-taak) → de ACCEPTED-
> reactie nudged niemand. `proposeCollaboration` blokkeert her-voorstellen hard (`applicationId
@unique`), dus er ís geen next-action die de motor kán tonen — het is een flow-gat (moet annuleren
> de reactie heropenen?), geen onjuiste next-action. **LAAG.**
> **→ GEDAAN (2026-08-01, PR #1025):** re-voorstel ontgrendeld. Nieuwe gedeelde bron van waarheid
> `src/lib/collaboration-reproposal.ts` (`REPROPOSABLE_CANCELLED_WHERE` + `isReproposableCancelledProposal`/
> `collaborationBlocksProposal`): een CANCELLED-collaboration die nooit is getekend/actief werd
> (`contractStatus != SIGNED`, geen handtekeningen, geen `completedAt`, geen facturen/prestaties) is een
> herbruikbaar voorstel. `proposeCollaboration` reset dan **dezelfde** @unique-rij via een
> compound-guarded `updateMany` (TOCTOU-dicht) i.p.v. hard te weigeren (audit `COLLABORATION_REPROPOSED`).
> De next-action-enumerator + badge + kandidaten-triage delen `collaborationBlocksProposal`, zodat de
> propose-taak (leeftijd geankerd op `cancelledAt`) weer opduikt en de UI het voorstelformulier toont
> i.p.v. een dode "bekijk samenwerking"-knop. Geen schemawijziging.

---

> **Datum:** 2026-07-18 (run 36) · **main-commit basis:** `dd47c9f`
> **Uitkomst:** **1 HIGH (DOEL 2, verboden statusovergang / geld-correctheid) + 1 LAAG (DOEL 2,
> robuustheid) gevonden én OPGELOST.** Parallelle Opus security-audit op de ~15 recent gewijzigde
> bestanden + cascade/authz-motor + tenant-isolatie.
>
> **GEVONDEN + GEFIXT — HIGH (DOEL 2, verboden statusovergang — cascade loopt door ná annulering):**
> de annuleer-rem in `applyCollaborationStatusChange` (`samenwerkingen/actions.ts`) checkte alléén
> "openstaande" facturen via `outstandingInvoiceWhere` (lifecycleStatus SUBMITTED/APPROVED/OVERDUE) —
> **NIET** een DRAFT-cascadefactuur en **helemaal geen** ingediende (SUBMITTED) prestatie. Asymmetrisch
> met de afronden-rem (`completionBlockReason`, die DRAFT-facturen én SUBMITTED-prestaties telt).
> **Repro:** FREELANCER dient een prestatie in op een ACTIVE samenwerking (→ SUBMITTED); CLIENT
> annuleert de samenwerking (**slaagde** — de rem zag de prestatie niet); CLIENT keurt de nu-verweesde
> prestatie alsnog goed → DRAFT-factuur → indienen → goedkeuren → "markeer betaald" → **volledige
> facturatiecascade op een geannuleerde deal** (de downstream cascade-commando's — `approvePerformance`/
> `submitInvoice`/`approveInvoice`/`confirmPayment` — checken de collaboration-status niet; alleen
> `submitPerformance` blokkeert nieuw werk ná annulering via `status !== "ACTIVE"`). **Geschonden regel:**
> "afronden/annuleren met open geld/onbeoordeelde prestatie moet onmogelijk zijn" (CLAUDE.md) +
> server-side waarheid. **Fix:** de annuleer-rem is nu **symmetrisch** met de afronden-rem — nieuwe pure
> helper `cancellationBlockReason` (spiegelt `completionBlockReason`, annuleer-bewoording) telt élke
> niet-afgewikkelde factuur (óók DRAFT) én elke SUBMITTED-prestatie, toegepast in **zowel de pre-check
> als de in-transactie her-verificatie** (TOCTOU-dicht, spiegelt de afrond-rem). Zo is het venster aan
> de voorkant gesloten: annuleren kan niet meer met werk-in-uitvoering, en `submitPerformance` blokkeert
> al nieuw werk erna → de verweesde-cascade is onbereikbaar. Rood→groen: `completion.test.ts`
> (`cancellationBlockReason`, 6 tests) + `samenwerkingen/completion-race.test.ts` (annuleer-rem: prestatie/
> DRAFT-factuur/TOCTOU-race/schone-annulering/PAID-geen-vals-positief, 5 tests).
>
> **~~GEPARKEERD~~ GEDAAN — MED (DOEL 2, defense-in-depth — cascade-commando's checken terminale
> collab-status niet) (2026-07-18, PR #825):** `approvePerformance`/`submitInvoice`/`approveInvoice`/
> `confirmPayment` (`src/lib/cascade/{performance,invoice,payment}-commands.ts`) gebruikten alleen
> `assertNotDisputed` en checkten niet of de samenwerking al CANCELLED/COMPLETED (terminaal) is. Erger:
> **ook `submitPerformance` deed dat niet** — `createPerformance` eist ACTIVE, maar een DRAFT-prestatie
> die vóór annulering is aangemaakt kon ná annulering alsnog worden ingediend (de annuleer-rem telt
> alleen SUBMITTED-prestaties, niet DRAFT) → een reachable weespad naar de facturatiecascade op een
> geannuleerde deal. **Fix:** systemische terminale-status-rem die `assertNotDisputed` spiegelt —
> een pure `terminalCollaborationError` (bron van waarheid voor bewoording/logica), een
> pre-transactionele `assertCollaborationNotTerminal` én een in-transactie TOCTOU-grendel (`terminalGuard`
> op `persistEventAndEffects`, hergebruikt de dispuut-guard-lees, geen extra query). Toegepast op
> `submitPerformance`/`approvePerformance`/`autoApprovePerformance`/`submitInvoice`/`approveInvoice`
> (CANCELLED + COMPLETED geweigerd) en `confirmPayment` (alleen CANCELLED — die command produceert de
> afronding zélf, COMPLETED toegestaan). Rood→groen: `terminal-status-guard.test.ts` (13 tests).
>
> **~~GEPARKEERD~~ GEDAAN — LAAG (UX, geen dode knoppen — `frozen` dekt CANCELLED niet) (2026-07-19,
> PR #833):** de samenwerking-detailpagina (`samenwerkingen/[id]/page.tsx`) leidde `frozen` alleen af uit
> `disputedAt`, niet uit `status === "CANCELLED"`/`"COMPLETED"`. Reachable dode knop: een FREELANCER met
> een afgekeurde prestatie op een terminale inzet zag "Corrigeer en dien opnieuw in" → server weigert
> (`assertCollaborationNotTerminal`, #825). **Fix:** pure `collaboration-lock.ts`
> (`collaborationLockReason`/`collaborationActionsLocked`/`terminalLockNotice`, dispuut > terminaal) +
> de forward-cascade-actieformulieren achter `!actionsLocked` (dispuut of terminaal) i.p.v. `!frozen`;
> terminale toelichtingsregel. Dispuut-bewoording (`disputed: frozen`) + legitieme post-completion
> creditering ongemoeid. +6 tests. Read-only afleiding, geen schema-/mutatie-/authz-wijziging.
>
> **Robuustheid-LOW (uit run 35, nu OPGELOST):** throwing `.parse` op vijandige enum → gehard met
> `safeParse` in **alle zes** server-acties (`admin/no-shows`, `admin/gebruikers`, `abonnement`,
> `samenwerkingen`, `kandidaten`, `opdrachten`). Zes rood→groen-tests. Zie de OPGELOST-regel in de
> run-35-sectie hieronder.

---

> **Datum:** 2026-07-18 (run 35) · **main-commit basis:** `3a4a4ae`
> **Uitkomst:** **2 integriteitsdefecten gevonden én OPGELOST** (1 MED + 1 LAAG, beide DOEL 2 —
> server-side-waarheid / verboden statusovergang). Verse prod-build (`npm run build`), schema-push +
> idempotente demo-seed (`SEED_DEMO=true`; 13 samenwerkingen / 7 facturen / 48 grootboekregels) op
> ephemere SQLite (`qa.db`), prod-server (`next start`, poort 3100, `LOGIN_/REGISTER_RATE_LIMIT=100000`,
> `STORAGE_DRIVER=local`). Vier rollen ingelogd via het echte credentials-endpoint (`demo1234`);
> cookie-getrouwe `curl`-sweep + live Playwright-doorklik + drie parallelle Opus-code-audits (cascade-
> authz/state-machine, franchise/admin-tenant-isolatie, next-action-correctheid + malicieuze invoer).
>
> **DOEL 1 (werkt het, live):** alle kernschermen per rol → 200, nul 5xx. ADMIN klikte live
> "Goedkeuren" op `/admin/verificaties` → knoppen **6→5** én de afgehandelde next-action verdween;
> keten auth→rol→ownership→transitie→audit→revalidate end-to-end correct. Geen pageerror/500 over de
> vier rollen (Playwright).
>
> **DOEL 1b (next-action-correctheid):** de live motor (`pending-tasks.ts` + `cascadeStage`) is 1:1
> consistent met de state-machine (`cascade/stage.ts`) voor alle vier rollen — geen verkeerde/dubbele/
> niet-verdwijnende/ontbrekende actie. De parked dode aggregators (`freelancerNextActions`/
> `clientNextActions`/`cascadeFreelancerActions`) zijn **nog steeds dood** (geen niet-test-caller);
> blijft LAAG/latent.
>
> **DOEL 2 (adversarieel, live):** privilege-escalatie (ZZP/CLIENT/FRANCHISER → `/admin/*`;
> niet-FRANCHISER → `/franchise/*`) → **307**. IDOR met echte vreemde id's (vreemd document / factuur-
> PDF / samenwerking-dossier) → **403** voor ZZP + FRANCHISER; eigen resource → 200. Junk/sqli/
> traversal-id (`00…0`-cuid, `1' OR '1'='1`, `..%2F..%2Fetc%2Fpasswd`) → **soft-404 "bestaat niet"**,
> nooit 500 en geen datalek. CSV-export draagt de formule-injectie-guard (`escapeCsvField` →
> `'`-prefix). Franchise/admin-audit: **geen** cross-tenant-IDOR / admin-bypass / reason-bypass.
>
> **GEVONDEN + GEFIXT — MED (DOEL 2, verboden statusovergang — TOCTOU-race bij afronden):** de
> handmatige samenwerking-afronding (`applyCollaborationStatusChange` in
> `src/app/(protected)/samenwerkingen/actions.ts`) berekende de afronden-/annuleer-rem (open geld /
> onbeoordeelde prestatie) met een **losse, niet-transactionele** lees vóór een **ONVOORWAARDELIJKE**
> `collaboration.update`. Een parallelle actie tussen die pre-check en de write (de tegenpartij dient
> een prestatie in, of er verschijnt een nieuwe factuur) kon de samenwerking op **COMPLETED** zetten
> terwijl er nog open geld of een onbeoordeelde prestatie was — waarna `cascadeStage()` COMPLETED als
> terminaal ziet en die prestatie/factuur nooit meer opduikt. **Geschonden regel:** "afronden met
> open geld/onbeoordeelde prestatie moet onmogelijk zijn" (CLAUDE.md) + server-side waarheid.
> **Fix:** de hele wegschrijving loopt nu in één interactieve `$transaction`; de rem wordt **binnen**
> de transactie her-geverifieerd en de statuswrite is **voorwaardelijk** op de verwachte `from`-status
> (`updateMany where status=from`, `count !== 1` → rollback), spiegelt de optimistic-concurrency van
> `apply.ts`. Rood→groen: `samenwerkingen/completion-race.test.ts` (4 tests: race-prestatie, race-
> factuur, gelijktijdige transitie count 0, en schone happy-path met `completedAt`-stempel).
>
> **GEVONDEN + GEFIXT — LAAG (DOEL 2, server-side waarheid — latente negatief-bedrag-poort):**
> `assertPerformanceWithinLimits` (`src/lib/cascade/performance-commands.ts`) claimt dé server-side
> bron van waarheid te zijn "voor élk pad" naar `createPerformance`/`updatePerformance`, maar dwong
> alleen een **bovengrens + `Number.isFinite`** af — géén afwijzing van **negatieve/nul** uren of
> bedragen. Vandaag niet uitvoerbaar via de gewire paden (de UI-Zod `validatePerformanceForm` vangt
> het), maar een toekomstige/admin-caller die die check overslaat kon een negatieve-uren-prestatie
> persisteren → `performanceSubtotalCents` maakt daar een negatieve factuur van. **Fix:** `<= 0`-
> afwijzing toegevoegd voor beide takken (HOURS/MILESTONE), null-pad ("nog niet ingevuld") behouden.
> Rood→groen: `performance-commands.test.ts` (10 tests).
>
> **~~GEPARKEERD~~ GEDAAN — MED (DOEL 2, confirmPayment-tak van dezelfde race) (2026-07-18, PR #821):**
> de automatische afronding-bij-betaling (`confirmPayment`) las `hasOtherOpenWork` vóór de transactie;
> de completion-write in `apply.ts` was wél optimistic op `status=ACTIVE`, maar dat sloot de
> _open-werk_-race niet (een gelijktijdig ingediende prestatie verandert de collaboration-status niet)
> → collab kon COMPLETED worden met een SUBMITTED-prestatie. **Fix (opt-in, generiek in de motor):**
> `StatusChange` kreeg twee optionele velden — `guard` (extra relationele where-condities die náást de
> `from`-match binnen de transactie opnieuw worden getoetst) en `optional` (een `count === 0` telt dan
> als "voorwaarde verviel, sla over" i.p.v. een harde rollback). `planPaymentConfirmedEvent` zet de
> afrond-statuswijziging op `optional: true` + `collaborationCompletableGuard(invoiceId)` (geen SUBMITTED-
> prestatie én geen andere niet-afgewikkelde factuur, de huidige uitgesloten — dezelfde afgewikkeld-sets
> als `isInvoiceSettled`). Verscheen er intussen open werk, dan valt alléén de afronding weg; de betaling
> boekt door. Rood→groen: guard-shape (`completion.test.ts`), applier guard-merge + optional-skip +
> behouden throw bij niet-optional (`apply.test.ts`), planner-emit (`handlers.test.ts`). Bestaande
> status-changes zonder `guard`/`optional` blijven identiek (additief).
>
> **~~GEPARKEERD~~ OPGELOST — LAAG (DOEL 2, robuustheid — throwing `.parse` op vijandige enum)
> (2026-07-18, run 36):** `admin/no-shows/actions.ts` + `admin/gebruikers/actions.ts` gebruikten de
> throwing `.parse` op een client-waarde → onafgevangen ZodError/500 i.p.v. nette domeinfout. **Gefixt
> én uitgebreid** naar alle zes acties met dezelfde klasse (`abonnement`, `samenwerkingen`,
> `kandidaten`, `opdrachten`): elke actie hardt nu met `safeParse` vóór DB-I/O; `changeJobStatus`
> retourneert `{ error }` passend bij `JobStatusState`. Zes rood→groen-tests toegevoegd.

---

> **Datum:** 2026-07-17 (run 34) · **main-commit basis:** `5b27a92`
> **Uitkomst:** **1 next-action-correctheidsdefect (DOEL 1b) gevonden én OPGELOST** — de
> opdrachtgever kreeg voor een **cascade-factuur die OVER DE VERVALDATUM** raakte een
> "Markeer als betaald"-next-action, terwijl hij die actie in de cascade helemaal niet uitvoert.
> Verse prod-build (`npm run build`), schema-push + idempotente demo-seed (`SEED_DEMO=true`; 13
> samenwerkingen/7 facturen/48 grootboekregels) op ephemere SQLite (`prisma/qa.db`), prod-server
> (`next start`, poort 3100, `LOGIN_/REGISTER_RATE_LIMIT=100000`, `STORAGE_DRIVER=local`). Vier rollen
> ingelogd via het echte credentials-endpoint (`demo1234`); cookie-getrouwe `curl`-sweep + drie
> parallelle Opus-code-audits (IDOR/authz-keten, malicieuze invoer, next-action-correctheid).
>
> **DOEL 1 (werkt het, live):** privilege-escalatie-poort en soft-404-robuustheid opnieuw bevestigd
> (zie DOEL 2). **DOEL 2 (adversarieel, live — alle correct):** privilege-escalatie (ZZP/CLIENT/
> FRANCHISER → `/admin/*`; niet-FRANCHISER → `/franchise/*`) → **307-redirect**, nooit 200/500.
> IDOR met **echte vreemde id's** uit de DB (vreemde factuur-PDF, samenwerking-`dossier`, privé-
> `document`) → **403** voor ZZP + FRANCHISER; eigen resource → 200. Junk/sqli/traversal-id
> (`000…0`-cuid, `1' OR '1'='1`, `..%2F..%2Fetc%2Fpasswd`, `/api/media/..`) → **404**, nooit 500.
> De twee code-audits over de authz-keten (auth→rol→ownership→Zod→actie→audit) en malicieuze
> numerieke/CSV/upload-invoer kwamen **schoon** terug — geen uitvoerbaar gat (ownership altijd vóór de
> mutatie, `Number.isFinite`-guards + int4-clamps overal, CSV-formule-guard + upload-magic-byte-check).
>
> **GEVONDEN + GEFIXT — MED (next-action-correctheid, DOEL 1b — verkeerde partij aan zet):** de
> generieke overdue-roll-up telde voor de **opdrachtgever** óók **cascade-facturen**
> (`lifecycleStatus="OVERDUE"`) mee (`overdueInvoiceCount("CLIENT")` in `src/lib/signals.ts`), wat een
> `overdueInvoiceTask(count,"CLIENT")` met subtitel **"Markeer als betaald"** (tone `attention`, link
> `/facturen`) opleverde. In de cascade registreert de **ZZP'er** de betaling (`cascade/stage.ts` stap
> 6: `youAreUp:isFreelancer`, "Markeer de betaling zodra je bent betaald"); de opdrachtgever staat op
> **"Wacht op betalingsbevestiging"** (`youAreUp:false`) en heeft voor een cascade-factuur **nergens**
> een "Markeer als betaald"-knop (`facturen/[id]/page.tsx` `canPay = !cascade`). De next-action was dus
> een **dode, niet-verdwijnende nudge** die de cascade-fase tegensprak en naar een niet-bestaande knop
> wees. **Repro (pre-fix):** log in als de opdrachtgever van een ACTIVE-samenwerking met een APPROVED
> cascade-factuur → zet die factuur op `lifecycleStatus=OVERDUE` (dueAt in het verleden) → `/acties` en
> `/dashboard` tonen "X facturen over de vervaldatum · Markeer als betaald" terwijl de opdrachtgever
> daar niets kan afrekenen. **Geschonden regel:** server-side waarheid / next-action-correctheid
> (DOEL 1b) — de getoonde actie hoort bij de andere partij en verdwijnt nooit vanuit de opdrachtgever.
> **Fix:** de cascade-tak `{ lifecycleStatus: "OVERDUE" }` in `overdueInvoiceCount` geldt nu **alleen
> voor FREELANCER** (de ZZP-kant ontdubbelt al met `surfacedOverdue` in `pending-tasks.ts`); de
> opdrachtgever telt uitsluitend **legacy-/handmatige** facturen (`lifecycleStatus=null`), waar hij wél
> een mark-paid-knop heeft. Rood→groen unit-test in `signals.overdue.test.ts` (CLIENT-`OR` bevat geen
> cascade-tak meer; elke tak eist `lifecycleStatus=null`).
>
> **GEPARKEERD — LAAG (dode code, DOEL 1b, latent):** twee ongewirede next-action-aggregators bevatten
> onvolledige/asymmetrische logica die zou bijten zodra iemand ze rendert. (1) `freelancerNextActions`/
> `clientNextActions` in `src/lib/next-actions.ts` (regels 97-177/194-266) missen de midden-cascade-
> acties (uren indienen, factuur indienen, betaling markeren, corrigeren; opdrachtgever mist "uren
> goedkeuren"/"factuur goedkeuren"). (2) `cascadeFreelancerActions` in `src/lib/cascade/next-actions.ts`
> (15-65) mist de ZZP-instapactie "dien je uren in" (Event B1), terwijl `cascadeClientActions` beide
> client-stappen wél dekt. Beide paden hebben **geen niet-test-caller** (alleen `franchiserNextActions`
> is gewired via `dashboard/page.tsx`); de gerenderde `pendingTasks()`+`cascadeStage`-motor is wél
> consistent met de state-machine. `prompts/WORKSPACE_OVERHAUL.md:32` ("al gewired in dashboardData")
> is **verouderd/onjuist**. **Prioriteit LAAG** (latent). Aanbeveling: verwijder de dode aggregators óf
> vul ze aan vóór hergebruik, en corrigeer de stale doc-claim.

---

> **Datum:** 2026-07-17 (run 33) · **main-commit basis:** `ab78f40`
> **Uitkomst:** **1 robuustheidsgat (HOOG) gevonden én OPGELOST** (DOEL 2) — een niet-eindig getal
> (`NaN`) in de prestatie-invoer (urenstaat/oplevering) glipte door álle bovengrens-validatie.
> Verse prod-build (`npm run build`), schema-push + idempotente demo-seed (`SEED_DEMO=true`; 13
> samenwerkingen/7 facturen/48 grootboekregels/16 tickets/14 gesprekken) op ephemere SQLite (`qa.db`),
> prod-server (`next start`, poort 3100, `LOGIN_/REGISTER_RATE_LIMIT=100000`, `STORAGE_DRIVER=local`).
> Vier rollen ingelogd via het echte credentials-endpoint (`demo1234`); cookie-getrouwe `curl`-sweep.
>
> **DOEL 1 (werkt het, live):** smoke over alle kernschermen per rol — ZZP'er
> (`/dashboard /acties /opdrachten /facturen /samenwerkingen /documenten /profiel /berichten`), CLIENT
> (`/dashboard /acties /opdrachten /kandidaten /samenwerkingen /facturen /bedrijf`), FRANCHISER
> (`/franchise/zzpers /diensten /samenwerkingen /facturatie /opdrachtgevers /leads /shift-overnames`),
> ADMIN (`/admin/verificaties /gebruikers /statistieken /disputen /no-shows /facturatie /systeemstatus
/franchises`) → **alle 200, nul 5xx**.
>
> **DOEL 2 (adversarieel, live — alle correct):** privilege-escalatie (ZZP/CLIENT/FRANCHISER →
> `/admin/*`; niet-FRANCHISER → `/franchise/*`) → **307-redirect**, nooit 200-inhoud/500. Junk/sqli/
> traversal-id (`1' OR '1'='1`, all-zeros-cuid, `job-999999`) → **soft-404 "bestaat niet"** (status
> 200, not-found-kaart, geen datalek); `/api/documents/..%2F..%2Fetc%2Fpasswd` → **404**.
>
> **GEVONDEN + GEFIXT — HOOG (robuustheid, DOEL 2 — malicieuze/absurde invoer):** de
> prestatie-invoer (`validatePerformanceForm` in `src/lib/validation.ts`) begrensde uren/bedrag met
> `<= 0` (ondergrens) en `> MAX` (bovengrens), maar **`NaN` is noch `<= 0` noch `> MAX`** (beide
> vergelijkingen zijn `false`). Een geknutselde POST naar de urenstaat-/oplevering-server-action met
> `hours=abc` (of `amount=abc`) levert `Number("abc") = NaN` — de manuele parser in
> `samenwerkingen/[id]/actions.ts` gebruikt géén Zod/coerce. `NaN` glipte door de validatie, zou als
> `Float` persisteren en bij factuurafleiding (`hourlySubtotalCents = Math.round(hours × rateCents)` →
> `Int`-kolom `totalCents`) een `NaN` opleveren → **Prisma-conversiefout → 500** i.p.v. een nette
> weigering — precies de faalmodus die de bestaande `MAX`-grens blijkens de code-commentaar juist wilde
> voorkomen. **Repro (pre-fix):** log in als ZZP'er met een ACTIVE-samenwerking → POST de urenstaat met
> `hours=abc` (browser-`type=number` omzeild) → prestatie met `hours=NaN` persisteert; bij
> goedkeuring/factuur volgt een 500. **Geschonden regel:** CLAUDE.md regel 1 (server-side waarheid;
> een geknutselde POST omzeilt het formulier) + DOEL 2 (malicieuze invoer → nette weigering, nooit
> 500). **Fix:** `!Number.isFinite(...)`-guard vóór de grensvergelijkingen in `validatePerformanceForm`
> (uren, ORT-totaal én milestone-bedrag) — dezelfde idiome die de codebase al bij een
> percentageveld (`actions.ts:275`) hanteert — plus defense-in-depth in
> `assertPerformanceWithinLimits` (`cascade/performance-commands.ts`, dekt óók het CSV-import- en
> admin-pad). Rood→groen unit-tests toegevoegd (`validation.test.ts`: `hours`/`ortTotal`/`amount` = NaN
> geweigerd; `Infinity` was al gedekt door `> MAX`). `Infinity`/`-Infinity` bleven correct (resp. door
> `> MAX` en `<= 0` gevangen); alleen `NaN` was het gat.

> **Datum:** 2026-07-16 (run 32) · **main-commit basis:** `b31717a`
> **Uitkomst:** **1 next-action-correctheidsdefect gevonden én OPGELOST** (DOEL 1b) — de nieuwe
> plaatsbaarheids-chip op het roster (#793) sprak zichzelf tegen met het detail. Verse prod-build
> (`npm run build`), schema-push + idempotente demo-seed (`SEED_DEMO=true`; 13 samenwerkingen/7
> facturen/48 grootboekregels/16 tickets/14 gesprekken) op ephemere SQLite (`qa.db`), prod-server
> (`next start`, poort 3100, `LOGIN_/REGISTER_RATE_LIMIT=100000`, `STORAGE_DRIVER=local`). Vier
> rollen ingelogd via het echte formulier (`demo1234`); Playwright met de vooraf-geïnstalleerde
> Chromium + cookie-getrouwe `curl`. Twee parallelle Opus-audits over de diff sinds run 31
> (`363aefe..b31717a`: roster-placement + rejection-pattern).
>
> **DOEL 1 (echte actie, live geverifieerd):** ADMIN klikte **"Goedkeuren"** op `/admin/verificaties`
> → Goedkeuren-knoppen **6→5**; de afgehandelde next-action verdween, de keten
> auth→rol→ownership→transitie→audit→revalidate werkt end-to-end.
>
> **DOEL 1b (next-action-correctheid):** `/acties` per rol gekruist tegen de seed — ZZP'er (2:
> ontbrekend verplicht "Verzekering" + onbeantwoord bericht Mark Jansen), CLIENT (2: 1 nieuwe reactie
>
> - bedrijfsprofiel 90% → logo), FRANCHISER (1: "1 dienst dreigt onbezet · direct vulbaar uit je
>   roster"), ADMIN (16: 6 certificaat-beoordelingen + 10 supporttickets). Juiste partij aan zet,
>   juiste volgorde, verdwijnt na afhandeling.
>
> **GEVONDEN + GEFIXT — MED (next-action-consistentie, DOEL 1b):** de plaatsbaarheids-chip
> "N passende diensten" op `/franchise/zzpers` (uit #793) telde de **rúwe** match-telling
> (`roster-placement.ts:countPlaceableDiensten`), terwijl de detail-suggestiekaart waarheen de chip
> deep-linkt maar **`DIENST_SUGGESTIE_LIMIT` (6)** rijen toont (`dienst-suggesties.ts:87`
> `.slice(0, limit)`). Een vrije ZZP'er die 8 open diensten matcht kreeg dus de chip "8 passende
> diensten", maar het detail toonde er 6 — een directe tegenspraak, terwijl de module-doc net belóóft
> dat de chip "exact overeenkomt met de rijen die de bemiddelaar op het detail ziet". **Repro
> (pre-fix):** geef een idle-ready ZZP'er ≥7 PUBLISHED tenant-diensten met matchscore ≥55 →
> `/franchise/zzpers` chip claimt het volledige getal; open het profiel → suggestie-kaart toont 6. Niet
> in de demo getriggerd (de franchise-tenant heeft 1 PUBLISHED dienst), wél triviaal reachable.
> **Geschonden regel:** interne consistentie van de next-action-engine (DOEL 1b) — lijst mag detail
> niet tegenspreken. **Fix:** `placeableChipLabel` begrenst boven de kaart-limiet tot "N+ passende
> diensten" (chip claimt nooit méér dan het detail toont; ≤ limiet blijft exact); daarnaast kreeg de
> open-diensten-query in `franchise/zzpers/page.tsx` `orderBy: { publishedAt: "desc" }` zodat lijst en
> detail bij >100 diensten hetzelfde deterministische nieuwste-100-venster pakken (was: geen
> `orderBy`, niet-deterministische subset). Rood→groen unit-tests toegevoegd
> (`roster-placement.test.ts`: exact tot de limiet, "6+" erboven).
>
> **DOEL 2 (adversarieel — alle correct):** privilege-escalatie (ZZP/CLIENT/FRANCHISER →
> `/admin/verificaties|gebruikers|statistieken|disputen|no-shows|facturatie`; niet-FRANCHISER →
> `/franchise`) → **307-redirect**, nooit 200-inhoud/500. IDOR/cross-partij + **cross-tenant** met
> een **echt vreemde** samenwerking/factuur (Emma de Boer / ZorgGroep Midden B.V. — niet de demo-
> partijen) via `/samenwerkingen/<id>` + `/facturen/<id>` → **soft-404 "Niet gevonden"** (status 200,
> not-found-kaart gerenderd; **nul** vreemde inhoud — de counterparty-namen kwamen **0×** in de body
> voor over alle drie de niet-gerechtigde rollen). Privé-document van een ander via
> `/api/documents/<id>` → **403**. Junk/traversal/sqli/xss-id (`1' OR '1'='1`, `..%2F..%2Fetc%2Fpasswd`,
> `<script>`, all-zeros-cuid, `job-999999`) over `/api/documents/<junk>` → **404**; over de RSC-pagina's
> → not-found-kaart, **nooit 500**.
>
> **GEPARKEERD — LOW (design-spanning, DOEL 1b-nuance):** de plaatsbaarheids-**chip** is idle-gated
> (`page.tsx:197-198`: alleen vrij-inzetbare ZZP'ers), maar de **detail**-suggestiekaart is dat niet
> (`zzpers/[id]/page.tsx` → `getDienstSuggestiesForFreelancer` zonder idle-filter). Een ZZP'er met een
> ACTIVE-samenwerking of status LIMITED/UNAVAILABLE toont dus wél suggestie-rijen op het detail maar
> géén chip op de lijst. Dit is **afwezigheid** van een chip (geen fout getal), verdedigbaar als
> bewuste bench-scoping — geen harde tegenspraak, daarom LOW. Product-beslissing (chip ook tonen voor
> niet-idle, of detail-kaart óók idle-scopen) vóór een eventuele fix.

> **Datum:** 2026-07-16 (run 31) · **main-commit basis:** `363aefe`
> **Uitkomst:** **GEEN gaten gevonden** — DOEL 1, 1b én 2 schoon over alle vier de rollen. Eén
> onafhankelijke, diepe Opus-audit over de volledige diff sinds run 30 (`bc4fa99..363aefe`: vier
> nieuwe next-action-loaders + de verifier-/rate-limit-zelftesten + de admin-mutatieketen) leverde
> **geen HIGH/MED-defect** op — alleen één LOW product-oordeel (L1, hieronder geparkeerd). Verse
> prod-build (`npm run build`), schema-push + idempotente demo-seed (`SEED_DEMO=true`, 13
> samenwerkingen/7 facturen/48 grootboekregels/16 tickets/14 gesprekken) op ephemere SQLite
> (`qa.db`), prod-server (`next start`, poort 3100, `LOGIN_/REGISTER_RATE_LIMIT=100000`,
> `STORAGE_DRIVER=local`). Vier rollen ingelogd via het echte formulier (`demo1234`); Playwright met
> de vooraf-geïnstalleerde Chromium (`chromium-1194`, `executablePath`) + cookie-getrouwe `fetch`/`curl`.
>
> **DOEL 1 (echte actie, live geverifieerd):** ADMIN klikte **"Goedkeuren"** op `/admin/verificaties`
> → Goedkeuren-knoppen **6→5**; de afgehandelde next-action verdween, de keten
> auth→rol→ownership→transitie→audit→revalidate werkt end-to-end.
>
> **DOEL 1b (next-action-correctheid — alle correct):** `/acties` per rol gekruist tegen de seed —
> ZZP'er (2: ontbrekend verplicht document "Verzekering" + onbeantwoord bericht van Mark Jansen),
> CLIENT (2: 1 nieuwe reactie beoordelen + bedrijfsprofiel 90% → logo toevoegen), FRANCHISER
> (1: "1 dienst dreigt onbezet · direct vulbaar uit je roster — voordragen kan nu" — de nieuwe
> acute-onbezet-loader uit #789/#785; live geverifieerd correct: de enige PUBLISHED-dienst van tenant
> `zorgbemiddeling-noord` ("Nachtdienst verpleegkundige — Geriatrie") heeft `startDate = null`
> (acuut/GEEN_DATUM) en **nul** samenwerkingen → geen PROPOSED-uitzondering actief, dus geen phantom),
> ADMIN (16: certificaat-beoordelingen + supporttickets). Juiste partij "aan zet", juiste volgorde,
> verdwijnt na afhandeling; geen dubbele/tegenstrijdige/niet-verdwijnende actie.
>
> **DOEL 2 (adversarieel — alle correct):** privilege-escalatie (ZZP/CLIENT/FRANCHISER →
> `/admin/verificaties|gebruikers|statistieken|disputen|no-shows|facturatie`; niet-FRANCHISER →
> `/franchise`) via cookie-getrouwe `fetch` → **opaque redirect (status 0)**, nooit 200-inhoud/500.
> IDOR/cross-partij met **echte vreemde id's** (documenten van Youssef/Lisa) → **403** voor
> ZZP/CLIENT/FRANCHISER; ADMIN 200 = by-design geaudit oversight, geen lek. Vreemde
> samenwerking/factuur (`/samenwerkingen/<id>`, `/facturen/<id>`) → **soft-404 "Niet gevonden"**
> (status 200, `NEXT_REDIRECT`-marker, **nul** gelekte inhoud — geen Urenstaat/Factuurregel/BTW/€/
> Contract/grootboek in de body). Junk/traversal/sqli/xss-id (`..%2F..%2Fetc%2Fpasswd`, `1' OR '1'='1`,
> `<script>`, all-zeros-cuid) over `/api/documents/<junk>` + `/samenwerkingen|/facturen|/zzp/<junk>`
> → **404**, nooit 500.
> **False-positive weerlegd:** `/rooster` gaf CLIENT een 200 i.p.v. een 3xx — maar de `redirect("/opdrachten")`
> voor CLIENT vuurt wél, via Next's streaming-fallback (`<meta http-equiv="refresh">` + `NEXT_REDIRECT`);
> de body bevat **nul** roster-inhoud (geen Claim/Beschikbare/Sterke-match-markers). Geen lek, geen defect.
>
> **GEPARKEERD — LOW (product-oordeel, DOEL 1b-nuance):** `acute-open-diensten.ts:55` +
> `pending-tasks.ts:553` definiëren `filled` strikt als "heeft een `ACTIVE` samenwerking". Een dienst
> met een reeds **PROPOSED** (contract verstuurd, wacht op handtekening ZZP'er) samenwerking telt
> daardoor als onbezet en kan — bij een acute startdatum — de "dienst dreigt onbezet"-next-action voeden,
> terwijl die dienst feitelijk al _bezig is_ met vullen. **Geen defect deze run:** (a) niet getriggerd in
> de demo (de acute dienst heeft nul samenwerkingen); (b) de diensten-pagina-kaart gebruikt exact dezelfde
> `ACTIVE`-only-definitie → geen tegenspraak tussen surfaces (dus geen DOEL 1b-schending); (c) een
> voorstel is geen gegarandeerde vulling (de ZZP'er kan weigeren). Product-beslissing (voorgesteld=bezig?
> of pas ACTIVE=bezig?) vóór een fix. Repro als het wél triggert: geef een acute PUBLISHED-tenantdienst
> zonder ACTIVE-samenwerking maar mét een PROPOSED-samenwerking → `/acties` (franchiser) toont "dreigt
> onbezet". Prioriteit: LOW.

> **Datum:** 2026-07-15 (run 30) · **main-commit basis:** `bc4fa99`
> **Uitkomst:** **1 next-action-correctheidsdefect gevonden én OPGELOST** (DOEL 1b) — de nieuwe
> compliance-ripple next-action van de opdrachtgever (#777) respecteerde de dispuut-bevriezing niet.
> Verse prod-build (`npm run build`), schema-push + idempotente demo-seed (`SEED_DEMO=true`, 13
> samenwerkingen/7 facturen/48 grootboekregels/16 tickets/14 gesprekken) op ephemere SQLite (`qa.db`),
> prod-server (`next start`, poort 3100, `LOGIN_/REGISTER_RATE_LIMIT=100000`, `STORAGE_DRIVER=local`).
> Vier rollen via het echte formulier (`demo1234`); Playwright met de vooraf-geïnstalleerde Chromium.
> Twee parallelle Opus-Explore-subagents (security-audit + next-action-correctheid over de diff sinds
> run 29, `89132d1..bc4fa99`).
>
> **GEVONDEN + GEFIXT — MED (next-action-correctheid, DOEL 1b):** een open dispuut zet
> `Collaboration.disputedAt` maar houdt `status = ACTIVE` (`cascade/dispute-commands.ts:47`); het
> werkproces is dan **bevroren** (`cascade/stage.ts:68-69` → "Dispuut — werkproces bevroren",
> `youAreUp:false`) en levert bij élke andere opdrachtgever-taak/-signaal géén next-action op — overal
> filtert het platform `disputedAt: null` (`pending-tasks.ts:401`, `signals.ts` overdue-count). De
> compliance-ripple-loader (`clientCredentialAlerts`, uit #777) deed dat als **enige** niet: de query
> filterde alleen `status:"ACTIVE"`. **Repro (live, pre-fix):** `zorggroep@` met een ACTIVE-samenwerking
> (Iris Hendriks, opdracht vereist VOG) in dispuut + verlopen VOG → `/acties` toont "Certificaat van Iris
> Hendriks is verlopen (VOG) · vraag de ZZP'er om te vernieuwen" als **hoogste** opdrachtgever-actie
> (`P.complianceRipple = 85`), en `/samenwerkingen` toont "Dispuut — werkproces bevroren · Stap 0 van 6"
> mét de compliance-actiebadge op **dezelfde kaart** (twee tegenstrijdige signalen). Dashboard-kaart +
> zijbalk-badge idem. **Geschonden regel:** interne consistentie van de next-action-engine (DOEL 1b) —
> een next-action mag de echte (bevroren) status niet tegenspreken. **Fix (3 surfaces, consistent met de
> rest):** (1) `clientCredentialAlertsFromRows` slaat een rij met `disputedAt !== null` over (pure functie
> → testbaar zonder DB; dekt `/acties` én de dashboard-kaart, beide lopen erdoorheen); (2)
> `clientCredentialAlerts`- + dashboard-query filteren `disputedAt: null` (conventie/efficiëntie); (3) de
> `/samenwerkingen`-lijst berekent de compliance-melding alleen bij `c.disputedAt === null`. **Live
> geverifieerd (fixed build):** dispuut open → phantom-taak weg van `/acties`, alleen "Dispuut — bevroren"
> op `/samenwerkingen`; dispuut opgeheven → de compliance-taak keert correct terug. Test rood→groen:
> `collaboration-alerts.test.ts` (+`disputedAt` op de row-helper + 2 cases). Bestanden:
> `collaboration-alerts.ts`, `dashboard/page.tsx`, `samenwerkingen/page.tsx`, `collaboration-alerts.test.ts`.
> Gate groen (typecheck, lint, **4213 unit-tests**, build, prettier).
>
> **DOEL 1 (echte actie, live):** ADMIN klikte "Goedkeuren" op `/admin/verificaties` → de keten
> auth→rol→ownership→transitie→audit→revalidate werkt (afgehandelde next-action verdwijnt). De
> compliance-fix zelf is end-to-end live geverifieerd (zie boven).
>
> **DOEL 2 (adversarieel — alle correct):** privilege-escalatie (ZZP/CLIENT/FRANCHISER →
> `/admin/verificaties|gebruikers|statistieken|disputen` + niet-FRANCHISER → `/franchise*`) via
> in-browser `fetch` (cookie-getrouw) → **opaque redirect (status 0), nooit 200-inhoud/500**.
> Junk/traversal/sqli/xss-id (`..%2F..%2Fetc%2Fpasswd`, `1' OR '1'='1`, `<script>`, all-zeros-cuid) over
> `/samenwerkingen|/facturen|/opdrachten|/zzp` + `/api/documents/<junk>` → soft-404/404, **nooit 500**.
> Onafhankelijke security-audit over de diff `89132d1..bc4fa99` (nieuwe roster-fill-loader
> `getRosterFillSignals` + compliance-loader): tenant-/owner-scoping CLEAN, geen IDOR/cross-tenant, geen
> N+1, geen nieuw mutatie-oppervlak.

> **Datum:** 2026-07-15 (run 29) · **main-commit basis:** `89132d1`
> **Uitkomst:** **GEEN gaten gevonden** — DOEL 1, 1b én 2 schoon over alle vier de rollen; twee
> echte acties end-to-end geverifieerd + een onafhankelijke, diepe security-audit (Opus-Explore) over
> alle 51 `actions.ts` + API-routes zonder bevindingen. Verse prod-build (`npm run build`, `BUILD_ID`
> geverifieerd), schema-push + idempotente demo-seed (`SEED_DEMO=true`, 13 samenwerkingen/7 facturen/
> 48 grootboekregels/16 tickets/14 gesprekken) op ephemere SQLite (`qa.db`), prod-server (`next start`,
> poort 3100, `LOGIN_/REGISTER_RATE_LIMIT=100000`, `STORAGE_DRIVER=local`). Vier rollen ingelogd via het
> echte formulier (`demo1234`); Playwright met de vooraf-geïnstalleerde Chromium (`chromium-1194`,
> `executablePath`). Eén parallelle Opus-Explore-security-subagent (authz/IDOR/tenant-isolatie over alle
> mutaties).
>
> **DOEL 1 (echte actie, live geverifieerd — 2 cascades end-to-end):**
> (a) **CLIENT** (logiflow) klikte **"Goedkeuren"** op een SUBMITTED cascade-factuur → `/acties`
> **3→2** (de factuur-goedkeur-taak verdween), de keten auth→rol→ownership→transitie→audit→revalidate
> werkte, en de fase schoof door naar **betaling** met de **ZZP'er (julia) aan zet**: julia's `/acties`
> toont nu "Markeer de betaling zodra je bent betaald" en de samenwerking een **"Betaling ontvangen"**-knop.
> (b) **ADMIN** klikte **"Goedkeuren"** op `/admin/verificaties` → `/acties` **16→15** (de afgehandelde
> verificatie-next-action verdween). Alle rol-schermen laadden **HTTP 200, nul 5xx**.
>
> **DOEL 1b (next-action-correctheid — alle correct):** `/acties` per rol gekruist tegen de seed —
> ZZP'er (2: ontbrekend verplicht doc "Verzekering" + onbeantwoord bericht), CLIENT (2: 1 nieuwe reactie
> beoordelen + bedrijfsprofiel 90%), FRANCHISER ("Alles is afgehandeld" — 0, klopt: een vandaag uitgezette
> dienst zonder reacties vraagt nog geen bemiddelaar-actie; roster-compliance/leads leveren geen
> openstaande taak), ADMIN (16 = 6 certificaat-beoordelingen + 10 supporttickets — telling exact gelijk
> aan de getoonde items). Alle acties: juiste partij "aan zet", juiste volgorde, verdwijnen na afhandeling.
> Bemiddelaar-dashboard "Volgende acties" is by-design een superset van `/acties` (item-taken + operationele
> attentiepunten zoals te lang open diensten; `dashboard/page.tsx:1044-1049`) — geen tegenspraak.
>
> **DOEL 2 (adversarieel — alle correct):** privilege-escalatie (ZZP/CLIENT/FRANCHISER →
> `/admin/verificaties|gebruikers|statistieken|disputen|no-shows|facturatie|franchises`; niet-FRANCHISER →
> `/franchise`) → **302-redirect naar `/dashboard`**, nooit 200-inhoud/500. IDOR via in-browser `fetch`
> (cookie-getrouw) met **echte vreemde id's**: vreemd document (Youssef) → **403** voor ZZP/CLIENT/FRANCHISER;
> eigen document → **200**; vreemde cascade-factuur-PDF (Iris) → **404**; vreemde samenwerking (Iris ACTIVE)
> → **"Niet gevonden"** (`notFound()` op `samenwerkingen/[id]/page.tsx:167`, geen datalek — bevestigd op de
> gerenderde inhoud). Junk/traversal/sqli/xss-id (`'; DROP TABLE`, `../../etc/passwd`, `%00`,
> `<script>`, absurde getallen) over `/samenwerkingen|/facturen|/opdrachten|/zzp` + `/api/documents/<junk>`
> → **nooit 500**. Onafhankelijke diepe security-audit: **CLEAN** (mutatieketen auth→rol→ownership→Zod→
> actie→audit consistent toegepast; cascade-commands her-laden de entiteit en checken party-ownership;
> franchise-mutaties `assertSameTenant`/`ownsViaTenant`; document/PDF/export-routes party/owner-of-admin +
> `private, no-store` + audit; admin-acties `requireRole("ADMIN")` + expliciete transitiemaps; cron
> `authorizeCron`).
>
> **Conclusie:** na 28 eerdere rondes blijft het platform dicht op authz/IDOR/tenant-isolatie én coherent
> op de next-action-engine. Deze run levert een docs-only PR (bewijs van de sweep); geen code-fix nodig.

> **Datum:** 2026-07-14 (run 28) · **main-commit basis:** `797c8a3`
> **Uitkomst:** **1 next-action-correctheidsdefect gevonden én OPGELOST** (DOEL 1b) — de generieke
> "factuur over de vervaldatum"-roll-up van de ZZP'er (`overdueInvoiceCount`) keyt op het legacy
> `status`-veld, terwijl de specifieke betaal-taak én de `surfacedOverdue`-aftrek op `lifecycleStatus`
> keyen → een cascade-factuur kon in een smal venster als **dubbele** next-action verschijnen. Verse
> prod-build (`npm run build`), schema-push + idempotente demo-seed (`SEED_DEMO=true`, 13 samenwerkingen/
> 7 facturen/16 tickets) op ephemere SQLite (`qa.db`), prod-server (`next start`, poort 3100,
> `LOGIN_/REGISTER_RATE_LIMIT=100000`, `STORAGE_DRIVER=local`). Vier rollen ingelogd via het echte
> formulier (`demo1234`); Playwright met de vooraf-geïnstalleerde Chromium (`chromium-1194`). Eén
> parallelle Opus-Explore-subagent (next-action-engine + authz/tenant-map over de diff `797c8a3~8..797c8a3`).
>
> **DOEL 1 (echte actie, live geverifieerd):** ADMIN klikte **"Goedkeuren"** op `/admin/verificaties`
> → Goedkeuren-knoppen **6→5** én de `/acties`-nav-badge **16→15** (de keten
> auth→rol→ownership→transitie→audit→revalidate werkt end-to-end; de afgehandelde next-action verdween).
>
> **DOEL 1b (next-action-correctheid — 1 DEFECT gevonden + gefixt):** `/acties` per rol gekruist tegen
> de seed — ZZP'er (2), CLIENT (2), ADMIN (16), FRANCHISER ("Alles is afgehandeld" — 0, klopt). Alle
> zichtbare acties logisch/juiste volgorde. **GEVONDEN + GEFIXT (zie hieronder):** het veld-mismatch-naad
> tussen `overdueInvoiceCount` (legacy `status`) en de cascade-`surfacedOverdue`-aftrek (`lifecycleStatus`).
>
> **DOEL 2 (adversarieel — alle correct):** privilege-escalatie (ZZP/CLIENT/FRANCHISER →
> `/admin/verificaties|gebruikers|statistieken|disputen|support|no-shows|dienst-overnames|facturatie`;
> niet-FRANCHISER → `/franchise`) → **302-redirect naar login/dashboard**, nooit 200-inhoud/500 (client →
> `/admin/verificaties` landde geverifieerd op `/dashboard`). IDOR via in-browser `fetch` (cookie-getrouw)
> met **echte vreemde id's** uit de DB: vreemd document (Youssef), vreemde factuur-PDF (Emma), samenwerking-
> `dossier`/`dba-dossier` (Iris) → **403** voor ZZP/CLIENT/FRANCHISER; eigen document + eigen factuur-PDF →
> **200**; ADMIN 200 op alle drie = by-design geaudit oversight. Junk/traversal/sqli/xss-id over
> `/facturen|/samenwerkingen|/opdrachten|/zzp` + `/api/documents/<junk>` → **nooit 500**. Cron
> (`/api/tasks/run-all|expiry`): **GET → 405**, **POST zonder secret → 503** (fail-closed). Forged
> betaal-webhook (`tr_fake_replay_999`) → **200 ack maar inert**, nooit 500.
>
> **GEVONDEN + GEFIXT — MED (next-action-correctheid, DOEL 1b):** `overdueInvoiceCount`
> (`src/lib/signals.ts:186`) voedt de generieke "N facturen over de vervaldatum"-roll-up van de ZZP'er via
> de residu-aftrek in `pending-tasks.ts:298` (`residualOverdue = max(0, overdue − surfacedOverdue)`). De
> query keyde op het **legacy `status`-veld** (`status=OVERDUE OR status=SENT && dueAt<now`), terwijl
> `surfacedOverdue` (die de specifieke betaal-taak aftrekt) en de collabs-query op **`lifecycleStatus`**
> keyen. Deze twee velden lopen uiteen voor een gemigreerde-en-daarna-via-cascade-goedgekeurde factuur
> (`lifecycleStatus=APPROVED`, legacy `status=SENT`-restant, `dueAt<now`): de APPROVED-tak toont een
> specifieke "betaling markeren"-taak **zonder** `surfacedOverdue` te verhogen, terwijl
> `overdueInvoiceCount` diezelfde factuur via de SENT-tak telt → residu > 0 → **dezelfde factuur ook als
> generieke roll-up = dubbele next-action** (venster < 24u, tot de dagelijkse `payment-reminders-task`
> `lifecycleStatus` én `status` samen op OVERDUE koppelt). Cascade-facturen alleen divergeren nooit
> (APPROVED-cascade behoudt legacy `status=DRAFT`); de naad is de gemigreerde/handmatige-legacy-route.
> **Geschonden regel:** interne consistentie van de next-action-engine (DOEL 1b) — een dubbele next-action
> is een defect. **Fix:** `overdueInvoiceCount` keyt cascade-facturen nu op `lifecycleStatus=OVERDUE` en
> laat het legacy `status`-veld alléén gelden voor facturen zonder lifecycle (`lifecycleStatus=null`), zodat
> een APPROVED cascade-/gemigreerde factuur niet dubbel telt. Gedrag blijft identiek voor alle normale
> gevallen (cascade OVERDUE koppelt beide velden; legacy/handmatige facturen houden hun status-detectie).
> Test rood→groen: `signals.overdue.test.ts` (bijgewerkte scoping-assert + 1 regressietest die de
> lifecycleStatus=null-clausulering op elke legacy-tak afdwingt). Gate groen (typecheck, lint, **4129
> unit-tests**, build, prettier).

> **Datum:** 2026-07-14 (run 27) · **main-commit basis:** `d4f1f87`
> **Uitkomst:** **2 defecten gevonden én OPGELOST** — (1) een next-action-correctheidsdefect (DOEL 1b):
> de `/samenwerkingen`-cascadebadge van de ZZP'er ondertelde OVER-DE-VERVALDATUM-cascadefacturen; (2) een
> privacy-defense-in-depth-gat (DOEL 2): de gehardende Sentry-`beforeSend`-scrubber scrubde `extra`/`contexts`
> niet. Verse prod-build (`npm run build`), schema-push + idempotente demo-seed (`SEED_DEMO=true`, 13
> samenwerkingen/7 facturen/16 tickets) op ephemere SQLite (`qa.db`), prod-server (`next start`, poort 3100,
> `LOGIN_/REGISTER_RATE_LIMIT=100000`, `STORAGE_DRIVER=local`). Vier rollen ingelogd via het echte formulier
> (`demo1234`); Playwright met de vooraf-geïnstalleerde Chromium (`chromium-1194`). Twee parallelle Opus-
> subagents (security-audit over de diff `95b317b..d4f1f87` + next-action-correctheid-audit).
>
> **DOEL 1 (echte actie, live geverifieerd):** ADMIN klikte **"Goedkeuren"** op `/admin/verificaties`
> → Goedkeuren-knoppen **6→5** (de keten auth→rol→ownership→transitie→audit→revalidate werkt end-to-end;
> de afgehandelde actie verdween). CLIENT malicieuze opdracht-forminput (`<script>`-titel + lege verplichte
> omschrijving + `rateMin=-50` + `rateMax=1e12`) via het echte formulier → **Zod-geweigerd, op-form gebleven,
> géén `<script>`-job in de lijst (geen XSS)**. Telemetrie-endpoints (`/api/client-error`, `/api/csp-report`)
> met kapotte/gigantische payloads → **204, nooit 500**; `/api/push/subscribe` met foute vorm → **400 (Zod)**.
>
> **DOEL 1b (next-action-correctheid — 1 DEFECT gevonden + gefixt):** `/acties` per rol gekruist tegen DB +
> zijbalk-badges — ZZP'er (2), CLIENT (2), ADMIN (16), FRANCHISER-workspace laadt; "Uren goedkeuren"-nav toont
> **géén** badge voor de CLIENT (0 SUBMITTED-prestaties in scope — correct, badge sprak de lege lijst niet
> tegen). **GEVONDEN + GEFIXT (zie hieronder):** de ZZP-`/samenwerkingen`-cascadebadge ondertelde OVERDUE-
> cascadefacturen die `/acties` én de cascade-fase (`stage.ts`, "aan zet"/attention) wél tonen.
>
> **DOEL 2 (adversarieel — alle correct, + 1 hardening):** privilege-escalatie (ZZP/CLIENT/FRANCHISER →
> `/admin/verificaties|gebruikers|statistieken|disputen|support`; niet-FRANCHISER → `/franchise`) → **opaque
> redirect, nooit 200/500**. IDOR via in-browser `fetch` (cookie-getrouw): vreemde factuur-PDF + vreemd
> samenwerking-`dossier` + vreemd document → **403** voor ZZP/CLIENT/FRANCHISER; eigen resources → **200** voor
> de partijen (+ ADMIN op document). Cross-tenant: FRANCHISER opent platform-job als dienst
> (`/franchise/diensten/job-1`, `tenantId=null`) → **soft-404, jobtitel NIET gelekt**; eigen dienst laadt.
> Junk-/traversal-/sqli-/xss-id over `/facturen|/samenwerkingen|/opdrachten|/zzp` → **nooit 500**. Forged
> betaal-webhook (`tr_fake_replay_123`) → **200 ack maar inert**. Cron (`/api/tasks/run-all|expiry`): **GET →
> 405**, **POST zonder secret → 503** (fail-closed). Alle `/acties` per rol zonder error-boundary.
>
> **GEVONDEN + GEFIXT — MED (next-action-correctheid, DOEL 1b):** de ZZP-`/samenwerkingen`-nav-badge
> (`countFreelancerCascadeWork` via `navBadges` in `src/lib/signals.ts`) telt de cascade-taken waar de ZZP'er
> "aan zet" is. De onderliggende query (`signals.ts`, invoices-`where`) filterde
> `lifecycleStatus in [DRAFT,REJECTED,APPROVED]` — **`OVERDUE` ontbrak**, terwijl `/acties`
> (`pending-tasks.ts:246`) OVERDUE wél meeneemt en er een `paymentConfirmTask` ("betaling markeren") van maakt,
> en `cascade/stage.ts:136` een OVERDUE-factuur als fase `payment` met `youAreUp:true`/tone `attention` toont.
> **Repro:** ZZP'er met een ACTIVE, niet-disputed samenwerking, laatste prestatie `APPROVED`, cascadefactuur
> `lifecycleStatus=OVERDUE` (dagelijkse `payment-reminders-task` flipt APPROVED→OVERDUE) → `/acties` en het
> detailscherm tonen een actieve "betaling markeren"-taak/fase, maar de `/samenwerkingen`-zijbalkbadge telt
> **0** voor die samenwerking → de badge sprak zijn eigen docstring ("mag de aan-zet-lijst niet ondertellen")
> en de detailfase tegen. **Geschonden regel:** interne consistentie van de next-action-engine (DOEL 1b) —
> een verdwijnende/onderteldende next-action is een defect. **Fix:** `OVERDUE` toegevoegd aan de invoices-
> filter + het `openInvoiceStatuses`-type + de `FreelancerCascadeCollab`-docstring in `src/lib/signals.ts`;
> `countFreelancerCascadeWork` telt een OVERDUE-factuur nu als +1 (dezelfde ZZP-actie als APPROVED). Test
> rood→groen: `signals.test.ts` (+1 case: OVERDUE-factuur telt mee; combinatie met indien-fase = 2).
>
> **GEVONDEN + GEFIXT — LAAG (privacy-defense-in-depth, DOEL 2):** de gehardende Sentry-`beforeSend`-scrubber
> (`src/lib/observability/sentry-options.ts`, uit #760) scrubde `request`/`user`/`server_name`, maar liet
> `event.extra` en `event.contexts` ongemoeid — precies het `extra`-veld waar `report.ts` de call-site-context
> (`ReportContext.extra`) rechtstreeks in doorgeeft aan de externe (mogelijk buiten-EER) verwerker. Huidige
> aanroepers geven alleen pad/digest/componentStack door (geen live lek), maar het "niet-gevoelige extra"-
> contract was niet afgedwongen: een toekomstige aanroeper die een gebruikersobject/e-mail/naam in `extra`
> zet, zou dat ongeredacteerd versturen — wat het AVG-doel van díe commit ondermijnt. **Fix:** `extra` en
> `contexts` gaan nu door de bestaande recursieve PII/secret-redactie van de logger (`redact`, key-allowlist +
> e-mailmaskering uit #753) — geen duplicatie, consistent met de rest van de observability-laag. Test
> rood→groen: `sentry-options.test.ts` (+2 cases: PII-sleutels in `extra` geredacteerd/e-mail in vrije tekst
> gemaskeerd; e-mailwaarde in `contexts` gemaskeerd + origineel onaangetast). Gate groen (typecheck, lint,
> **4114 unit-tests**, build, prettier).

> **Datum:** 2026-07-13 (run 26) · **main-commit basis:** `6c89a68`
> **Uitkomst:** **1 HOOG revenue-integriteitsgat gevonden én OPGELOST** (betaal-webhook: herspeelde
> `providerRef` heractiveerde een geannuleerd/verlopen abonnement gratis). Verse prod-build
> (`npm run build`), schema-push + idempotente demo-seed (`SEED_DEMO=true`) op ephemere SQLite
> (`qa.db`), prod-server (`next start`, poort 3100, `LOGIN_/REGISTER_RATE_LIMIT=100000`,
> `STORAGE_DRIVER=local`). Vier rollen ingelogd via het echte formulier (`demo1234`); Playwright met
> de vooraf-geïnstalleerde Chromium (`chromium-1194`). Eén parallelle Opus-security-subagent over de
> diff sinds run 25 (`c56addd..HEAD`, #738–#747).
>
> **DOEL 1 (echte actie, live geverifieerd):** ADMIN klikte **"Goedkeuren"** op `/admin/verificaties`
> → Goedkeuren-knoppen **6→5** (keten auth→rol→ownership→transitie→audit→revalidate werkt). CLIENT
> malicieuze opdracht-forminput (`<script>`-titel + lege verplichte omschrijving + `rateMin=-50` +
> `rateMax=1e12`) via het echte formulier → **Zod-geweigerd, op-form gebleven, jobs 20→20, 0 malicieuze
> jobs**.
>
> **DOEL 1b (next-action-correctheid):** `/acties` per rol gekruist tegen DB + zijbalk-badges — ZZP'er
> (2: ontbrekend document _Verzekering_ + gespreksreactie _Mark Jansen_ = badge "2"), CLIENT (2: 1 nieuwe
> reactie = badge "Reacties 1" + bedrijfsprofiel 90%), ADMIN (16 = 6 SUBMITTED-certificaten + 10 helpdesk,
> matcht de badges), FRANCHISER-workspace laadt. Alle acties logisch, juiste volgorde/partij, geen
> dubbele/tegenstrijdige/niet-verdwijnende actie; geen error-boundary op enige `/acties`.
>
> **DOEL 2 (adversarieel — alle correct):** privilege-escalatie (ZZP/CLIENT/FRANCHISER →
> `/admin/verificaties|gebruikers|statistieken|disputen`; niet-FRANCHISER → `/franchise`) → opaque
> redirect/geweigerd, **nooit 200/500**. IDOR via in-browser `fetch` (cookie-getrouw): vreemde factuur-PDF
>
> - vreemd samenwerking-`dossier` → **403** voor ZZP + FRANCHISER; eigen document → **200**, vreemd
>   document → **403**. Cross-tenant: FRANCHISER opent platform-job als dienst (`/franchise/diensten/job-1`,
>   `tenantId=null`) → **soft-404 "niet gevonden", jobtitel NIET gelekt** (`getDienstDetail` geeft null bij
>   tenant-mismatch → `notFound()`); eigen dienst (`dienst-noord-nacht`) laadt. Junk-/traversal-/sqli-id
>   (`/facturen|/samenwerkingen/<junk>`, `..%2F..%2Fetc%2Fpasswd`, `1' OR '1'='1`) → soft-404, **nooit 500**.
>   Forged ongesigneerde betaal-webhook (`sub_fake`) → **200 ack maar inert** (0 nep-subscription, geen
>   statuswijziging). Cron (`/api/tasks/run-all`): **GET → 405**, **POST zonder secret → 503** (fail-closed).
>   Alle franchise-subpagina's (`samenwerkingen|leads|facturatie|opdrachtgevers`) → 200, geen error-boundary.
>
> **GEVONDEN + GEFIXT — HOOG (revenue-integriteit; via de parallelle Opus-security-subagent, diff
> `c56addd..HEAD`):** `SUBSCRIPTION_TRANSITIONS.CANCELLED` stond `["PENDING","ACTIVE"]` toe. De
> betaal-webhook (`/api/billing/webhook`) is de enige map-gebonden schrijver naar `ACTIVE` en reactiveert
> zodra `paymentStatus(ref)==="paid" && sub.status!=="ACTIVE" && canSubscriptionTransition(sub.status,"ACTIVE")`.
> Mollie ondertekent zijn webhook niet (`resolveWebhookRef` haalt enkel de id uit de body) en de
> expiry-taak zet een verlopen abonnement op `CANCELLED` **zonder de `providerRef` te wissen**
> (`subscription-expiry-task.ts:106`). Repro: betaald abonnement verloopt → `CANCELLED` (oude `tr_X`
> blijft staan) → `POST /api/billing/webhook` met `tr_X` → provider geeft gezaghebbend permanent `"paid"`
> → `CANCELLED→ACTIVE` toegestaan → sub weer `ACTIVE` met verse +1 maand-periode, **zonder nieuwe
> betaling**, herhaalbaar/onbeperkt. **Geschonden regel:** CLAUDE.md regel 3 (ongeldige/onveilige overgang
> moet worden geweigerd). #745 beoogde deze klasse te dichten maar liet de overgang in de map staan (de
> code-comment noemde het verwijderen al als openstaand). **Fix:** `CANCELLED: ["PENDING"]` (`enums.ts`) —
> heractiveren vereist nu een verse checkout (`changeSubscription` → `PENDING` met een **nieuwe**
> `providerRef` → `PENDING→ACTIVE`; de gratis/mock-activatie doet een directe upsert buiten de map, dus
> geen legitiem pad brak). Tests rood→groen: `subscription-transitions.test.ts` (`CANCELLED→ACTIVE` nu
> `false`) + `webhook/route.test.ts` (CANCELLED-sub + herspeelde `"paid"` → geen `update`/`audit`).
> Bestanden: `enums.ts`, `billing/subscription-transitions.ts` (comment), + 2 tests. Gate groen
> (typecheck, lint, **4026 unit-tests**, build, prettier).
>
> **Geparkeerd — MED (verwante replay-vector, niet gefixt deze run):** dezelfde niet-geroteerde
> `providerRef` maakt óók `PAST_DUE → ACTIVE` herspeelbaar (een dunning-/expiry-pad kan `PAST_DUE` zetten
> met de oude ref; herspelen van de permanent-"paid" ref reactiveert). `PAST_DUE → ACTIVE` is echter een
> **legitieme** overgang (betaling hersteld) en robuust sluiten vergt "verbruikte providerRef"-tracking
> (een `lastActivatedProviderRef`-kolom of eenmalige `currentPeriodEnd`-vooruitgang per ref) — dat hoort
> bij het recurring-billing-ontwerp (MENSENWERK §3, nog niet geïmplementeerd). Repro: `PAST_DUE`-sub met
> ongewijzigde `providerRef` → `POST /api/billing/webhook` met die ref → `PAST_DUE→ACTIVE`. Prioriteit MED:
> pak samen met de echte billing-koppeling vóór go-live.
>
> ---
>
> **Datum:** 2026-07-12 (run 25) · **main-commit basis:** `c56addd`
> **Uitkomst:** **Geen defecten/gaten gevonden.** Verse prod-build (`npm run build`), schema-push +
> idempotente demo-seed (`SEED_DEMO=true`, 13 samenwerkingen/7 facturen/16 tickets) op ephemere SQLite
> (`qa.db`), prod-server (`next start`, poort 3100, `LOGIN_/REGISTER_RATE_LIMIT=100000`,
> `STORAGE_DRIVER=local`). Vier rollen ingelogd via het echte formulier (`demo1234`); Playwright met de
> vooraf-geïnstalleerde Chromium (`chromium-1194`).
>
> **DOEL 1 (echte actie, live geverifieerd):** ADMIN klikte **"Goedkeuren"** op `/admin/verificaties`
> → Goedkeuren-knoppen **6→5** (de afgehandelde certificaat-actie verdween correct; de next-action-keten
> auth→rol→ownership→transitie→audit→revalidate werkt end-to-end). FRANCHISER opende de eigen dienst
> (`/franchise/diensten/dienst-noord-nacht`) → voordragen-scherm met roster-kandidaten rendert (200, geen
> error-boundary). Eigen factuur-PDF (`collab-1`) → **200** voor beide partijen (ZZP'er + opdrachtgever).
>
> **DOEL 1b (next-action-correctheid):** `/acties` per rol gecontroleerd tegen de echte staat — ZZP'er
> (2), CLIENT (2), ADMIN (16: certificaat-queue + supporttickets), FRANCHISER (bemiddelings-workspace).
> Alle getoonde acties logisch, in de juiste volgorde, voor de juiste partij aan zet; geen error-boundary
> op enige `/acties`.
>
> **DOEL 2 (adversarieel — alle correct):** privilege-escalatie via **in-browser `fetch`** (cookie-getrouw):
> ZZP/CLIENT/FRANCHISER → `/admin/verificaties|gebruikers|statistieken|disputen|audit` → **redirect/403/404,
> nooit 200/500**; niet-FRANCHISER → `/franchise` → idem. IDOR/cross-partij: vreemde factuur-PDF (Iris'
> DRAFT, `/api/facturen/[id]/pdf`) → **403/404** voor alle 3 niet-partij-rollen; eigen factuur-PDF → **200**
> voor de 2 partijen, **403** voor de niet-partij FRANCHISER; vreemde samenwerking-`dossier`/`dba-dossier`/
> `modelovereenkomst` → **403/404** voor alle 3. Document-privacy (`/api/documents/<Sanne VOG>`): eigenaar +
> ADMIN → **200**, CLIENT/FRANCHISER → **403**, junk → **404**. **Cross-tenant (franchise-tenant):** FRANCHISER
> opent een platform-opdracht als dienst (`/franchise/diensten/job-1`, `tenantId=null`) → **"Niet gevonden"**
> soft-404 (`getDienstDetail`/`getRosterCandidatesForDienst` geven `null` bij `job.tenantId !== actor.tenantId`);
> geen dienst-titel/kandidaat-data gelekt. Junk-/traversal-/sqli-/xss-id (`/facturen|/samenwerkingen|/opdrachten|
/zzp/<junk>`, `..%2F..%2Fetc%2Fpasswd`, `1' OR '1'='1`, `<script>`, all-zeros-cuid) over 2 rollen → soft-404,
> **nooit 500**. Cron-endpoints (`/api/tasks/run-all|expiry|payment-reminders`): **GET → 405**, **POST zonder
> `CRON_SECRET` → 503**.
>
> **Server-side guards herbevestigd (lezing + live):** het dubbele-boeking-/reistijd-signaal bij het voordragen
> (`roster-double-booking.ts` / `dienst-voordracht.ts`) is tenant-veilig — `getRosterCandidatesForDienst` haalt
> alleen `freelancerProfile.where:{tenantId}` op, draagt `Job.tenantId` mee per plaatsing en zet `viewerTenantId
= actor.tenantId`; `detectDoubleBooking` telt overlap wél mee maar toont een titel **alleen** binnen de eigen
> tenant (fix #731 intact). `proposeFreelancer` guardt zowel dienst (`job.tenantId !== tenantId`) als ZZP'er
> (`where:{ id, tenantId }`). Geen zwakke plek gevonden — het platform is na 24 eerdere sweeps grondig gehard.
> Alleen deze docs-update, geen code-wijziging deze run.
>
> ---
>
> **Datum:** 2026-07-12 (run 24) · **main-commit basis:** `ce740b7`
> **Uitkomst:** **Geen defecten/gaten gevonden.** Verse prod-build (`npm run build`), schema-push +
> idempotente demo-seed (`SEED_DEMO=true`) op ephemere SQLite (`qa.db`), prod-server (`next start`,
> poort 3100, `LOGIN_/REGISTER_RATE_LIMIT=100000`, `STORAGE_DRIVER=local`). Vier rollen ingelogd via het
> echte formulier (`demo1234`); Playwright met de vooraf-geïnstalleerde Chromium (`chromium-1194`).
>
> **DOEL 1 (echte actie, live + DB-geverifieerd):** ADMIN klikte **"Goedkeuren"** op `/admin/verificaties`
> → Goedkeuren-knoppen **6→5** (de afgehandelde certificaat-actie verdween correct; de next-action-keten
> auth→rol→ownership→transitie→audit→revalidate werkt end-to-end). Eigen factuur-PDF (`collab-1`) → **200
> `application/pdf`** voor beide partijen; eigen samenwerking-`dossier`/`dba-dossier`/`modelovereenkomst` →
> **200** voor beide partijen.
>
> **DOEL 1b (next-action-correctheid):** `/acties` per rol gecontroleerd tegen de echte staat — ZZP'er (2:
> ontbrekend verplicht document _Verzekering_ + openstaande gespreksreactie _Mark Jansen_, matcht de
> zijbalk-badge "2"), CLIENT (2), FRANCHISER (leeg — klopt: geen bijna-verlopende-cert- of verstreken-lead-
> taken open in de seed), ADMIN (rijke queue: certificaat-verificaties + supporttickets). Alle getoonde
> acties zijn logisch, in de juiste volgorde, voor de juiste partij aan zet; geen dubbele, tegenstrijdige of
> niet-verdwijnende acties.
>
> **DOEL 2 (adversarieel, ~90 probes — alle correct):** privilege-escalatie (ZZP/CLIENT/FRANCHISER →
> `/admin/verificaties|gebruikers|statistieken|disputen|audit`; niet-FRANCHISER → `/franchise`) → **redirect
> (opaqueredirect/3xx), nooit 200/500**. IDOR/cross-partij + cross-tenant via **in-browser `fetch`** (cookie-
> getrouw, met de JUISTE routes `/api/facturen/[id]/pdf` en `/api/samenwerkingen/[id]/{dossier,dba-dossier,
modelovereenkomst}`): vreemde factuur-PDF (Iris' DRAFT) → **403** voor alle 3 niet-partij-rollen; vreemde
> samenwerking-docs (Iris+zorggroep, ACTIVE) → **403** voor alle 3; FRANCHISER bij `collab-1` (niet-partij,
> andere tenant) → **403** op factuur-PDF én alle 3 doc-routes; eigen resources → **200** voor de partijen.
> Document-privacy (`/api/documents/<Youssef VOG>`): eigenaar + ADMIN → **200**, andere rollen → **403**,
> junk → **404**. Junk-/traversal-/sqli-/xss-id (`/facturen|/samenwerkingen|/opdrachten|/zzp/<junk>`,
> `..%2F..%2Fetc%2Fpasswd`, `1' OR '1'='1`, `<script>…`, all-zeros-cuid) over 2 rollen → soft-404, **nooit
> 500**. Cron-endpoints (`/api/tasks/run-all|expiry|payment-reminders`): **GET → 405**, **POST zonder
> `CRON_SECRET` → 503**. Betaal-webhook (`/api/billing/webhook`) met ongesigneerde/vervalste payload → **200
> maar inert**: geverifieerd in de handler dat `resolveWebhookRef` de ongesigneerde ping als `null` afwijst
> en de status altijd gezaghebbend bij de provider wordt opgehaald (server-side waarheid, geen forgeable
> statuswijziging). Admin-CSV-export als niet-admin → **404**. Malicieuze opdracht-input (XSS-titel
> `<script>` + `rateMin=-50` + `rateMax=1e12` + lege verplichte omschrijving) via het echte formulier →
> **Zod-geweigerd, op-form gebleven, validatiefout getoond, 0 malicieuze jobs** (`job.count` 20→20).
>
> **Server-side guards herbevestigd:** de authz-keten `requireActor → Zod → ownership → assertTransition →
audit` weert consistent elke cross-partij/cross-tenant-toegang met **403** (niet 404-als-toevallig-verkeerde-
> route — deze run gebruikte bewust de juiste route-paden om echte authz i.p.v. route-afwezigheid te toetsen).
> Geen enkele zwakke plek gevonden — het platform is na 23 eerdere sweeps grondig gehard. Alleen deze
> docs-update, geen code-wijziging deze run.
>
> ---
>
> **Datum:** 2026-07-11 (run 23) · **main-commit basis:** `e2fd922`
> **Uitkomst:** **Geen defecten/gaten gevonden.** Verse prod-build (`npm run build`), schema-push +
> idempotente demo-seed (`SEED_DEMO=true`) op ephemere SQLite (`qa.db`), prod-server (`next start`,
> poort 3100, `LOGIN_/REGISTER_RATE_LIMIT=100000`, `STORAGE_DRIVER=local`). Vier rollen ingelogd via het
> echte formulier (`demo1234`); Playwright met de vooraf-geïnstalleerde Chromium (`chromium-1194`).
>
> **DOEL 1 (echte actie, live + DB-geverifieerd):** ADMIN klikte **"Goedkeuren"** op `/admin/verificaties`
> → Goedkeuren-knoppen **6→5** én de `/acties`-teller **16→15** (de afgehandelde certificaat-actie verdween
> correct — de next-action-keten auth→rol→ownership→transitie→audit→revalidate werkt end-to-end).
> FREELANCER (Sanne) heeft al op `job-10` gereageerd → detail toont correct "Je hebt gereageerd" i.p.v. een
> reageerknop. Eigen factuur-PDF (`collab-1`) → 200 `application/pdf` voor beide partijen; eigen DBA-dossier +
> modelovereenkomst → 200 `application/pdf`.
>
> **DOEL 1b (next-action-correctheid):** `/acties` per rol gecontroleerd tegen de echte staat — ZZP'er (2:
> ontbrekend verplicht document + openstaande gespreksreactie), CLIENT (2: nieuwe reactie beoordelen +
> bedrijfsprofiel-compleetheid), ADMIN (16: certificaat-queue + supporttickets), FRANCHISER ("alles
> afgehandeld" — klopt: `franchiserTasks` genereert alleen bijna-verlopende-cert- en verstreken-lead-taken,
> en geen van beide staat open in de seed). Alle getoonde acties zijn logisch, in de juiste volgorde, voor de
> juiste partij aan zet; geen dubbele, tegenstrijdige of niet-verdwijnende acties.
>
> **DOEL 2 (adversarieel, ~110 probes — alle correct):** privilege-escalatie (ZZP/CLIENT/FRANCHISER →
> `/admin/verificaties|gebruikers|statistieken|disputen|audit`; niet-FRANCHISER → `/franchise`) → **redirect
> naar eigen dashboard**. IDOR/cross-tenant via **in-browser `fetch`** (cookie-getrouw): vreemde factuur-PDF →
> **403**, vreemd samenwerking-`dossier`/`dba-dossier`/`modelovereenkomst` → **403** voor alle 3 niet-partij-
> rollen, admin-CSV-export als niet-admin → **403**, eigen resources → **200**. Document-privacy
> (`/api/documents/<id>`): eigenaar + ADMIN → **200**, andere rollen → **403**, junk → **404**. Junk-/traversal-/
> sqli-id (`/facturen|/samenwerkingen|/opdrachten/<junk>`, `..%2F..%2Fetc%2Fpasswd`, `1' OR '1'='1`,
> `<script>`) → soft-404/404, **nooit 500**. `/api/tasks/run-all|expiry|payment-reminders` zonder methode →
> **405**. Brede smoke van alle hoofd-routes per rol (57 routes) → geen 500/error-boundary (5 valse "500"-
> treffers waren geserialiseerde id's in de RSC-payload, geverifieerd geen error-boundary).
>
> **Server-side guards geverifieerd (lezing + live):** `changeCollaborationStatus` volgt
> `requireActor → Zod → ownership (partyUserIds) → assertCollaborationTransition → geld-/prestatie-rem`
> (`completionBlockReason` blokkeert COMPLETED bij open geld/onbeoordeelde prestatie; `outstandingInvoiceWhere`
> blokkeert CANCELLED bij openstaande factuur; ACTIVE alleen via contract-ondertekening). Geen enkele
> zwakke plek gevonden — het platform is na 22 eerdere sweeps grondig gehard. Alleen deze docs-update, geen
> code-wijziging deze run.
>
> ---
>
> **Datum:** 2026-07-11 (run 22) · **main-commit basis:** `9efcda6`
> **Uitkomst:** **3 cascade/next-action-defecten gevonden én OPGELOST** (1 BLOCKER + 2 should-fix). Verse
> prod-build (`npm run build`), schema-push + idempotente demo-seed (`SEED_DEMO=true`) op ephemere SQLite
> (`qa.db`), prod-server (`node scripts/start.mjs`, poort 3100, `LOGIN_/REGISTER_RATE_LIMIT=100000`,
> `STORAGE_DRIVER=local`). Vier rollen ingelogd via het echte formulier (`demo1234`); Playwright met de
> vooraf-geïnstalleerde Chromium. Twee parallelle Opus-reviews (security + next-action-correctheid) over
> diff `666ff53..9efcda6` (#710–#720).
>
> **DOEL 1 (echte actie, live + DB-geverifieerd):** ADMIN klikte **"Goedkeuren"** op `/admin/verificaties`
> → Goedkeuren-knoppen **6→5**. FREELANCER (Sanne) **reageerde** op `job-10` → nieuwe `Application` (NEW,
> DB-bevestigd) + redirect `/reacties`; daarna **reactie ingetrokken** via de ConfirmButton-dialoog →
> `job-10:WITHDRAWN` (DB). BLOCKER-fix **live geverifieerd**: OVERDUE-factuur → opdrachtgever ziet
> "Markeer als betaald" (knop 0→1) → klik → `OVERDUE→PAID` + `PAYMENT_CONFIRMED`-audit.
>
> **DOEL 1b + 2 (adversarieel, ~53 probes — alle correct):** privilege-escalatie (ZZP/CLIENT/FRANCHISER →
> `/admin/verificaties|gebruikers|statistieken|disputen|audit`; niet-FRANCHISER → `/franchise`) → **redirect
> naar eigen dashboard**; IDOR/cross-partij + cross-tenant (foreign factuur SUBMITTED/PAID/DRAFT + foreign
> samenwerking, 3 rollen) → **soft-404, body-inspectie: geen €-bedrag/e-mail/PII-lek**; document-privacy
> (`/api/documents/<Sanne VOG>`: eigenaar + ADMIN → **200**, CLIENT/FRANCHISER/andere-FREELANCER → **403**,
> junk → **404**); junk-/traversal-/sqli-id (`/facturen|/samenwerkingen|/opdrachten/<junk>`,
> `..%2F..%2Fetc%2Fpasswd`, `1' OR '1'='1`) → soft-404, **nooit 500**; `/api/tasks/run-all|expiry` zonder
> `CRON_SECRET` → **503**; malicieuze opdracht-input (XSS-titel + `rateMin=-50` + `rateMax=1e12`) → Zod-geweigerd,
> op-form gebleven, 0 malicieuze jobs. `/api/health` + `/api/readiness` → 200.
>
> **GEVONDEN + GEFIXT — BLOCKER (functioneel dood spoor, DOEL 1):** OVERDUE cascade-factuur had geen werkende
> "markeer betaald"-knop op `/samenwerkingen/[id]` — de knop rendeerde alleen bij `APPROVED`. Zodra
> `payment-reminders-task.ts` een factuur op `OVERDUE` zette, verdween de knop stil, terwijl de statemachine
> `OVERDUE→PAID` toestaat, `stage.ts` OVERDUE als betaalfase toont en `pending-tasks.ts` er een `paymentConfirmTask`
> voor genereert (#710). De **opdrachtgever** had nergens meer een knop om zijn OVERDUE-factuur als betaald te
> markeren (`/facturen/[id]` verbergt betaalacties voor cascade-facturen → totaal dood spoor); de ZZP'er had
> nog `/acties` maar de dashboard-CTA "Betaling markeren → /samenwerkingen/[id]" leidde naar een scherm zonder
> de actie. **Geschonden regel:** "server-side is de waarheid" + next-action-lat (fasescherm mag `/acties` niet
> tegenspreken). **Fix:** conditie → `APPROVED || OVERDUE` (`samenwerkingen/[id]/page.tsx:942-944`). Live
> geverifieerd (0→1 knop, OVERDUE→PAID + audit).
>
> **GEVONDEN + GEFIXT — should-fix (next-action-correctheid):** (1) `cascade/stage.ts` had geen terminale tak
> voor `CREDITED` → een gecrediteerde factuur viel door naar de betaal-default ("Markeer de betaling"). Fix:
> terminale `credited`-fase. (2) `signals.ts overdueInvoiceCount` telde OVERDUE-facturen van **disputen**
> (bevroren) mee, terwijl de specifieke-taak-lus disputen uitsluit én `confirmPayment` ze server-side weigert
> (`assertNotDisputed`) — de generieke roll-up toonde een taak waarvan de knop faalt en die het
> "Dispuut — bevroren"-scherm tegensprak. Fix: `disputedAt: null`-filter. Bestanden: `stage.ts`+`stage.test.ts`,
> `signals.ts`+`signals.overdue.test.ts`, `pending-tasks.ts` (comment). +4 tests, gate groen (**3866 unit-tests**).
>
> ---
>
> **Datum:** 2026-07-10 (run 21) · **main-commit basis:** `666ff53`
> **Uitkomst:** **1 next-action-defect (DOEL 1b) gevonden én OPGELOST** — de betaal-taak van de ZZP'er
> verdween stil uit `/acties` zodra een factuur naar `OVERDUE` liep, in tegenspraak met `cascade/stage.ts`.
> Verse prod-build (`npm run build`), schema-push + idempotente demo-seed (`SEED_DEMO=true`) op ephemere
> SQLite (`qa.db`), prod-server (`node scripts/start.mjs`, poort 3100, `LOGIN_/REGISTER_RATE_LIMIT=100000`,
> `STORAGE_DRIVER=local`). Vier rollen ingelogd via het echte formulier (`demo1234`); Playwright met de
> vooraf-geïnstalleerde Chromium (`/opt/pw-browsers/chromium-1194`).
>
> **DOEL 1 (echte actie, live):** ADMIN klikte **"Goedkeuren"** op `/admin/verificaties` → Goedkeuren-
> knoppen **6→5** (keten auth→rol→ownership→transitie→audit→revalidate werkt). **Malicieuze forminput**
> (CLIENT `/opdrachten/nieuw`): XSS-titel `<script>` + `rateMin=-50` + `rateMax=999999999999` → **0
> malicieuze jobs gepersisteerd** (server-side Zod-weigering; client-sessie bleef geldig).
>
> **DOEL 1b (next-action-engine):** per rol geverifieerd tegen de DB — ADMIN 6 verificatietaken (= 6
> SUBMITTED-creds) + 12 supporttickets; ZZP'er "verplicht document ontbreekt (Verzekering)" + 1 bericht;
> CLIENT "1 nieuwe reactie" (= exact 1 NEW application op job-1) + "bedrijfsprofiel 90% — logo"; FRANCHISER
> **terecht leeg** (0 verlopende certificaten, 0 overdue leads in tenant). **Gevonden defect:** zie hieronder.
>
> **DOEL 2 (adversarieel, ~40 probes — alle correct geweigerd, 0 stille toegang):** privilege-escalatie
> (ZZP/CLIENT/FRANCHISER → `/admin/verificaties|gebruikers|statistieken|disputen|audit`; niet-FRANCHISER →
> `/franchise`) → **307 redirect naar eigen dashboard**; IDOR/cross-partij + cross-tenant (foreign
> factuur PAID/SUBMITTED/DRAFT + foreign samenwerking, 3 rollen) → **soft-404 "niet gevonden", body-inspectie
> bevestigt géén e-mail/€-bedrag/PII-lek**; document-privacy (`/api/documents/<Sanne VOG>`: eigenaar + ADMIN
> → **200**, CLIENT/FRANCHISER/andere-FREELANCER → **403**, garbage → **404**); onzin-/sqli-/traversal-id's
> (`/facturen|/samenwerkingen|/opdrachten/<junk>`, `..%2F..%2Fetc%2Fpasswd`, `1' OR '1'='1`) → soft-404,
> **nooit 500**; `/api/tasks/*` (expiry/payment-reminders/run-all/monitor/…) → **503 "niet geconfigureerd"**
> zonder `CRON_SECRET`, **401** met verkeerd secret (nooit ongeauthenticeerde taak-uitvoering); CSV-injectie:
> formula-guard (`needsFormulaGuard` + `'`-prefix) dekt élke CSV-export (audit/avg/administratie/platform-
> facturen routen door `escapeCsvField`/`toCsv`). Twee parallelle Opus-subagents (security + correctness):
> de **mutatie-laag toonde geen exploiteerbaar authz-/ownership-/tenant-/transitie-gat** (elke server-actie
> volgt auth→rol→ownership/tenant→Zod→actie→audit; #709/#707/#702/#700 zijn puur lees-features, geen nieuwe
> mutatie-oppervlakken).
>
> **GEVONDEN + GEFIXT — MED (next-action-correctheid, DOEL 1b; via de parallelle Opus-correctness-subagent):**
> `pending-tasks.ts` haalde de factuur-taken van de ZZP'er op met `lifecycleStatus in [DRAFT,REJECTED,
APPROVED]` — **`OVERDUE` ontbrak**. Zodra de live betaal-herinnering (`payment-reminders-task.ts`) een
> `APPROVED`-factuur over de vervaldatum naar `OVERDUE` draait, viel diezelfde factuur uit de filter: de
> specifieke, één-klik **"Markeer de betaling zodra je bent betaald"**-taak **verdween stil** uit `/acties`,
> terwijl `cascade/stage.ts` de ZZP'er voor exact die factuur nog **`youAreUp: true, tone: "attention"`**
> toont (fase 6, "Betaling markeren"). De ZZP'er zag in plaats daarvan alleen de generieke roll-up
> **"factuur over de vervaldatum · Volg op bij de opdrachtgever"** — een materieel andere (en foute)
> instructie (de ZZP'er registreert een ontvángen betaling; hij "volgt niet op"). **Repro:** ACTIVE-
> samenwerking, factuur `APPROVED` → ZZP'er ziet de betaal-taak → `dueAt` verstrijkt → cron zet `OVERDUE`
> → betaal-taak weg uit `/acties`, in tegenspraak met het samenwerkingsscherm. **Geschonden regel:** CLAUDE.md
> "server-side is de waarheid" + de next-action-lat "vraagt het de juiste eerstvolgende stap, voor de juiste
> partij aan zet; spreekt de lijst zichzelf niet tegen met de echte status". **Fix:** filter verbreed naar
> `[DRAFT,REJECTED,APPROVED,OVERDUE]`; `APPROVED`+`OVERDUE` routen beide naar `paymentConfirmTask` (nieuwe
> `overdue`-vlag → `tone:"attention"` + overdue-prioriteitsband, spiegelt `stage.ts`); **residu-aftrek** zodat
> dezelfde overdue-factuur niet dubbel verschijnt (specifieke betaal-taak + generieke rij) maar een bevroren
> disputed-factuur wél nog als generieke rij overblijft. Bestanden: `pending-tasks.ts`, `tasks.ts`,
> `pending-tasks.test.ts` (+3 tests rood→groen). Gate groen (typecheck, lint, **3782 unit-tests**, build,
> prettier).
>
> ---
>
> **Datum:** 2026-07-10 (run 20) · **main-commit basis:** `9b0747a`
> **Uitkomst:** **1 HOOG AVG-gat gevonden én OPGELOST** (dispuutreden overleefde het recht op
> vergetelheid in twee kopieën). Verse prod-build (`npm run build`), schema-push + idempotente demo-seed
> (`SEED_DEMO=true`) op ephemere SQLite (`qa.db`), prod-server (`node scripts/start.mjs`, poort 3100,
> `LOGIN_/REGISTER_RATE_LIMIT=100000`, `STORAGE_DRIVER=local`). Vier rollen ingelogd via het echte
> formulier (`demo1234`); Playwright met de vooraf-geïnstalleerde Chromium (`/opt/pw-browsers/chromium-1194`).
>
> **DOEL 1 (echte actie, live):** ADMIN klikte **"Goedkeuren"** op `/admin/verificaties` → Goedkeuren-
> knoppen **6→5** (keten auth→rol→ownership→transitie→audit→revalidate werkt). **Malicieuze forminput**
> (CLIENT `/opdrachten/nieuw`): XSS-titel `<script>` → job aangemaakt met React-geëscapede titel (geen
> rauwe reflectie); `rateMin=-50` → server-side Zod-weigering "Number must be greater than or equal to 1";
> `rateMax=999999999999` → "Number must be less than or equal to 2000"; **0 malicieuze jobs gepersisteerd**.
>
> **DOEL 1b (next-action-engine):** `/acties` per rol laadt 200 (admin/zzp/client/franchise), geen 500,
> geen tegenstrijdige/dubbele actie.
>
> **DOEL 2 (adversarieel, 60+ probes — alle correct geweigerd, 0 HTTP-500's):** privilege-escalatie
> (ZZP/CLIENT/FRANCHISER → `/admin/verificaties|gebruikers|statistieken|disputen|audit`; niet-FRANCHISER
> → `/franchise`) → **307 redirect naar eigen dashboard**; IDOR/cross-partij + cross-tenant (3 rollen →
> foreign factuur SUBMITTED/DRAFT/PAID + foreign samenwerking) → **"Niet gevonden · geen toegang"-kaart,
> body-inspectie bevestigt géén €-bedrag/naam/PII-lek**; document-privacy (`/api/documents/<Sanne VOG>`:
> eigenaar + ADMIN → **200**, CLIENT/FRANCHISER/andere-FREELANCER → **403**, garbage → **404**); onzin-id's
> (`/facturen|/samenwerkingen|/opdrachten|/kandidaten/nonexistent`) → soft-404/redirect, **nooit 500**;
> path-traversal (`/facturen/..%2F..%2Fetc%2Fpasswd`) + SQL-injectie-id → geen leak/500; XSS `?q=<script>`
> → React-geëscaped, niet rauw gereflecteerd.
>
> **GEVONDEN + GEFIXT — HOOG (AVG art. 17 / recht op vergetelheid; via de parallelle Opus-security-subagent,
> diff `2eec90d..9b0747a`):** `anonymizeUser` wiste de dispuutreden op `Collaboration.disputeReason` én in de
> `DomainEvent.payload` (PR #696 claimde precies dit gat te sluiten), maar **twee verdere verbatim kopieën
> overleefden**: (1) `AuditLog.metadata.reason` van het eigen `DISPUTE_OPENED`-record — `scrubAuditMetadataPii`
> redact alleen velden die exact gelijk zijn aan e-mail/naam, een vrije-tekstreden matcht daar nooit op, dus
> alleen `ipAddress`/`userAgent` werden op die rij genuld; (2) de body van de admin-fanout-notificatie
> (`Dispuut bij "<opdracht>": <reden>`) — notificaties werden nergens in de erasure aangeraakt. **Repro:**
> ZZP'er opent dispuut met reden → later erasure → reden staat nog in `AuditLog.metadata` én bij élke admin
> als notificatie-body. **Geschonden regel:** CLAUDE.md "audit alles" + AVG-vergetelheid moet ÁLLE kopieën
> van door de betrokkene geschreven vrije-tekst-PII wissen. **Fix:** twee extra updateMany's in de
> anonimiseringstransactie — `auditLog.updateMany` (metadata → `{reason:"[verwijderd]"}`, gescopet op
> `actorId==userId, action=DISPUTE_OPENED`) + `notification.updateMany` (body geredact, gescopet op de
> gedeelde admin-titel-constante `DISPUTE_ADMIN_NOTIFICATION_TITLE` + de deep-links van de eigen disputen —
> nooit de reden-loze tegenpartij-notificatie). Bestanden: `admin/gebruikers/actions.ts`,
> `cascade/dispute-commands.ts`, `anonymize-erasure.test.ts` (+2 tests rood→groen, 25 in dat bestand). Gate
> groen (typecheck, lint, **3749 unit-tests**, build, prettier).
>
> ---
>
> **Datum:** 2026-07-09 (run 19) · **main-commit basis:** `2eec90d`
> **Uitkomst:** **1 robuustheidsgat gevonden én OPGELOST** (ADMIN-verificatiequeue → HTTP 500 op
> lege afwijzingsreden). Verse prod-build (`npm run build`), schema-push + idempotente demo-seed
> (`SEED_DEMO=true`) op ephemere SQLite (`qa.db`), prod-server (`node scripts/start.mjs`, poort 3100,
> `LOGIN_/REGISTER_RATE_LIMIT=100000`, `STORAGE_DRIVER=local`). Vier rollen ingelogd via het echte
> formulier (`demo1234`); Playwright met de vooraf-geïnstalleerde Chromium
> (`/opt/pw-browsers/chromium-1194`). Eén parallelle Opus-security-subagent over de nieuwste surfaces
> sinds run 18 (diff `3c35a78..2eec90d`: franchise `dienst-detail`, `freelancer-findability`,
> `profiel/bewerken`) → geen exploiteerbare gaten (tenant-check sluit vóór PII-verrijking; pure,
> server-side functies; onzin-id → `notFound()`).
>
> **DOEL 1 (echte actie, server-side geverifieerd):** ADMIN klikte **"Goedkeuren"** op
> `/admin/verificaties` → tegen de DB bevestigd: `Credential SUBMITTED` **6→5** / `VERIFIED` **24→25**,
> `cred-bram-VOG` op `VERIFIED`, verse `CREDENTIAL_VERIFIED`-audit (`actorId`=admin,
> `entityId=cred-bram-VOG`, timestamp `2026-07-09T13:20:22Z` die exact met de klik samenvalt). Keten
> auth→rol→ownership→transitie→audit→revalidate werkt end-to-end.
>
> **DOEL 1b (next-action-engine):** `/acties` per rol laadt 200 voor alle vier rollen; geen 500,
> geen tegenstrijdige/dubbele actie.
>
> **DOEL 2 (adversarieel):** privilege-escalatie (ZZP/CLIENT/FRANCHISER → `/admin/*`; niet-FRANCHISER
> → `/franchise`) → **redirect naar eigen dashboard**; IDOR/cross-partij + cross-tenant (foreign
> factuur PAID/APPROVED/SUBMITTED/DRAFT + foreign samenwerking, elk voor 3 rollen) → **soft-404
> "niet gevonden", geen €-bedrag/PII-lek**; document-privacy (`/api/documents/<foreign>` → **403**;
> eigen doc → **200**); onzin-id's → soft-404/redirect, **nooit 500**; path-traversal
> (`/facturen/..%2F..%2Fetc%2Fpasswd`) → geen leak. **60+ probes, 0 HTTP-500's op de lees-oppervlakken.**
>
> **GEVONDEN + GEFIXT (robuustheid, MED):** op `/admin/verificaties` waren de queue-forms gebonden aan
> de **rauwe void server-acties** (`verifyCredential.bind` / `rejectCredential.bind`). Een afwijzing
> met een **lege reden** — client-`required` omzeild (adversarieel of niet-JS/scripted POST) — liet
> `statusForDecision` gooien, wat Next.js als **HTTP 500 + error-boundary** ("Er ging iets mis")
> toonde i.p.v. een nette weigering. Dezelfde 500 gold voor de **al-beoordeeld-race** (dubbele
> indiening → `updateMany` count 0 → throw). De data-integriteit was intact (geen foute overgang, DB
> onveranderd), maar het robuustheidscontract ("adversariële/lege input → geweigerd, **nooit
> 500/crash**") werd geschonden. **Fix:** beide forms lopen nu via de bestaande `ResolveState`-wrappers
> (`verifyCredentialState`/`rejectCredentialState`) met `useActionState` — de fout verschijnt **inline**
> ("Een afwijzing vereist een reden.") zonder de error-boundary te triggeren. Live geverifieerd op de
> herbouwde server: POST **500→200**, inline-alert getoond, form blijft open, DB onveranderd. Regressie-
> test `actions-state.test.ts` (4 cases, rood→groen) dekt lege/whitespace-reden + de al-beoordeeld-race.
> Bestanden: `reject-form.tsx` (+`VerifyForm`), `verificaties/page.tsx`, `actions-state.test.ts`.
>
> ---
>
> **Datum:** 2026-07-09 (run 18) · **main-commit basis:** `3c35a78`
> **Uitkomst:** **GEEN nieuwe gaten.** Verse prod-build (`npm run build`), schema-push + idempotente
> demo-seed (`SEED_DEMO=true`, `prisma db seed`) op ephemere SQLite (`qa.db`), prod-server
> (`CI=true node scripts/start.mjs`, poort 3100, `LOGIN_/REGISTER_RATE_LIMIT=100000`,
> `STORAGE_DRIVER=local`). Vier rollen ingelogd via het echte formulier (`demo1234`); Playwright met de
> vooraf-geïnstalleerde Chromium (`/opt/pw-browsers/chromium-1194`). Eén parallelle Opus-security-subagent
> over de nieuwste mutatie-/data-oppervlakken sinds run 17 (diff `bcd40c1..3c35a78`, PR's #680-#690).
>
> **DOEL 1 (echte actie, server-side geverifieerd):** ADMIN klikte **"Goedkeuren"** op
> `/admin/verificaties` → tegen de DB bevestigd: `Credential SUBMITTED` **6→5** / `VERIFIED` **24→25**,
> `cred-bram-VOG` op `VERIFIED`, `CREDENTIAL_VERIFIED`-audit (`actorId`=admin, `entityId=cred-bram-VOG`,
> verse timestamp `2026-07-09T05:18:16Z` die exact met de klik samenvalt) en de Goedkeuren-knop verdween
> uit de queue (verse herlaad: 6→5 knoppen). De volledige keten auth→rol→ownership→transitie→audit→
> revalidate werkt end-to-end.
>
> **DOEL 1b (next-action-engine, gekruist tegen DB-waarheid):** `/acties` per rol laadt 200. ADMIN toont
> de resterende certificaat-taken (5 SUBMITTED na de goedkeuring), FREELANCER (Sanne) + CLIENT niet-leeg,
> FRANCHISER terecht **"Alles is afgehandeld"** (geen due leads/tenant-certs). Geen tegenstrijdige, dubbele
> of niet-verdwijnende actie. Nieuwste ZZP-oppervlakken live geverifieerd: `/profiel/bewerken` toont de
> **Vindbaarheid-kaart (#690)** + **Werkervaring-editor (#683)**; `/facturen/<eigen PAID>` toont de
> **wettelijke-factuureisen-kaart (#685)**; op `/samenwerkingen/collab-1` (COMPLETED) verschijnt de
> **renewal-nudge (#686) terecht NIET** (alleen ACTIVE + einddatum + niet-bevroren) — geen vals signaal.
>
> **DOEL 2 (adversarieel, 44 probes — alle correct geweigerd, 0 HTTP-500's):** privilege-escalatie
> (FREELANCER/CLIENT/FRANCHISER → `/admin/verificaties|gebruikers|statistieken|disputen|audit`;
> niet-FRANCHISER → `/franchise`) → **redirect naar eigen dashboard**; IDOR/cross-partij (ZZP'er/CLIENT →
> andermans SUBMITTED- + DRAFT-factuur + andermans samenwerking; FRANCHISER → cross-tenant factuur +
> samenwerking) → **"Niet gevonden · geen toegang"-kaart, geen €-bedrag/PII-lek**; document-privacy
> (`/api/documents/<Sanne VOG>`: eigenaar + ADMIN → **200**, CLIENT/FRANCHISER → **403**, garbage → **404**);
> onzin-id's (`/facturen|/samenwerkingen|/opdrachten|/kandidaten/nonexistent`) → soft-404/redirect,
> **nooit 500**; path-traversal (`/facturen/..%2F..%2Fetc%2Fpasswd`) → geen leak; XSS `?q=<script>` →
> React-geëscaped, niet rauw gereflecteerd.
>
> **Security-subagent (statische diepte-audit, diff `bcd40c1..3c35a78`):** geen blockers, geen
> exploiteerbare gaten. `#683/#688 WorkExperience` (add/delete keten auth→rol→`assertOwnership`→Zod
> (jaar-grenzen + lengte-caps)→cap→audit; `deleteWorkExperience` IDOR-veilig via
> `existing.freelancerProfileId !== profile.id` + stille no-op zonder bestaans-orakel; anonymisering
> wist `workExperience` per `userId`, AVG art. 17); `#690 findability` + `#685 invoice-legal` +
> `#686 collaboration-renewal` (puur, geen I/O, call-sites gaten op bestaande ownership/participant-checks);
> `#682 system-status` (ADMIN-gated, alleen driver-modi/booleans, **geen secret-waarden**);
> `#689 fetch-timeout` (vaste provider-URL's, geen SSRF-vector; fail-open-venster juist verkort);
> `#681 franchise ownsViaTenant` (existence-oracle gedicht). Geen `dangerouslySetInnerHTML`. Spoort met
> runs 6-17. Deze run is documentatie-only.
>
> **Geparkeerd — LOW (informatief, niet gefixt; robuustheid, niet authz/IDOR):** `addWorkExperience`
> (`profiel/actions.ts:160-167`) doet `count()` en `create()` als twee losse statements — een TOCTOU-race
> tussen twee gelijktijdige requests van **dezelfde** ZZP'er kan de cap `WORK_EXPERIENCE_MAX_PER_PROFILE`
> (30) met 1-2 rijen overschrijden. Alleen eigen data, geen toegang/lek; ergste geval een net-te-lange
> eigen lijst. Een transactie sluit het venster op SQLite maar niet hard op Postgres (READ COMMITTED)
> zonder DB-constraint/lock — een fragiele half-fix die het probleem niet echt oplost; niet in verhouding
> tot de impact. Pak mee met een echte DB-constraint als de WorkExperience-cap ooit hard moet zijn.
>
> ---
>
> **Datum:** 2026-07-08 (run 17) · **main-commit basis:** `bcd40c1`
> **Uitkomst:** **GEEN nieuwe gaten.** Verse prod-build (`npm run build`), schema-push + idempotente
> demo-seed (`SEED_DEMO=true`, `prisma db seed`) op ephemere SQLite (`qa.db`), prod-server
> (`CI=true node scripts/start.mjs`, poort 3100, `LOGIN_/REGISTER_RATE_LIMIT=100000`,
> `STORAGE_DRIVER=local`). Vier rollen ingelogd via het echte formulier (`demo1234`); Playwright met de
> vooraf-geïnstalleerde Chromium (`/opt/pw-browsers/chromium-1194`). Eén parallelle Opus-security-subagent
> over de nieuwste mutatie-/data-oppervlakken sinds run 16 (#673-#679).
>
> **DOEL 1 (echte actie, server-side geverifieerd):** CLIENT (LogiFlow Logistics, `logiflow@`) opende de
> samenwerking met Julia Vermeer (`cmrc3mf5t007t7d6anndfu59b`) en klikte **"Goedkeuren"** op de ingediende
> factuur (`cmrc3mf6p...`, € 1.393,92) → tegen de DB bevestigd: `lifecycleStatus` **SUBMITTED→APPROVED**,
> audit `INVOICE_APPROVED` met een verse timestamp die exact met de klik samenvalt, en de cascade schoof
> door naar de volgende stap (de knop werd **"Markeer als betaald"** — betaling registreren). De volledige
> keten auth→rol→ownership (`loadCascadeInvoice`/counterparty-check)→transitie→audit→revalidate werkt.
>
> **DOEL 1b (next-action-engine, gekruist tegen DB-waarheid):** vóór de actie toonde `logiflow@` `/acties`
> = **3** ("Keur de ingediende factuur" + "Beantwoord Kevin Mol" + "Bedrijfsprofiel is 90% compleet"). Ná
> het goedkeuren: `/acties` = **2** — de factuur-goedkeur-taak **verdween** (de ZZP'er is nu aan zet voor
> de betaling, niet de opdrachtgever), consistent met de nieuwe DB-status (APPROVED). Geen tegenstrijdige,
> dubbele of niet-verdwijnende actie. Geverifieerd dat de "Markeer als betaald"-knop op de opdrachtgever-
> collab-pagina géén defect is: `confirmPayment` (`cascade/payment-commands.ts:21-30`) autoriseert bewust
> ADMIN + issuer (ZZP'er) + counterparty (opdrachtgever); een derde partij wordt door de `CascadeError`-
> guard geweigerd en kan de samenwerking sowieso niet laden.
>
> **DOEL 2 (adversarieel, 64 probes — alle correct geweigerd, 0 HTTP-500's):** privilege-escalatie
> (FREELANCER/CLIENT/FRANCHISER → `/admin/verificaties|gebruikers|statistieken|disputen`; niet-FRANCHISER
> → `/franchise`) → **redirect naar eigen dashboard**; IDOR/cross-partij (ZZP'er/CLIENT → andermans
> factuur `cmrc3mfdi...` van daan@/BouwPartners + andermans samenwerking `cmrc3mf3b...` van iris@/ZorgGroep)
> → **"Niet gevonden · geen toegang"-kaart** (`main`-inhoud geverifieerd: 200 met denial, géén factuur-/
> samenwerkingsdata, geen counterparty-PII gelekt); cross-tenant (FRANCHISER `franchise@` → factuur +
> samenwerking buiten de eigen tenant) → **"Niet gevonden"**; API-IDOR (`/api/documents/<garbage>`) →
> **404**; onzin-id's (`/facturen|/samenwerkingen|/opdrachten|/kandidaten/nonexistent-id-999`) → soft-404/
> `notFound()`/redirect, **nooit 500**; path-traversal (`/facturen/..%2F..%2Fetc%2Fpasswd`) → geen leak;
> XSS `?q=<script>` → niet rauw gereflecteerd. **Malicieuze forminput** (CLIENT `/opdrachten/nieuw`: XSS
> in titel `<script>alert(1)</script>` + `<img onerror>` in beschrijving, `rateMin=-50`, `rateMax=
999999999999`) → **server-side Zod-validatiefouten getoond, formulier niet geaccepteerd, geen redirect,
> geen 500**; DB-check bevestigt **0 malicieuze opdrachten gepersisteerd** (geen negatieve/absurde tarieven,
> geen script-titel). Spoort met runs 6-16.
>
> **Security-subagent (statische diepte-audit, diff `23f34e4..bcd40c1`):** geen gaten in de nieuwe surfaces
> — `#679 defaultMotivation` (Zod `optionalText(2000)`, own-profile-scoped pre-fill, server-side her-
> validatie bij `createApplication`, React `defaultValue` = geen XSS), `#677/#673 account-export` (alle 21
> queries `actorId`-gescoopt, narrow `select` zonder counterparty-PII, `PUBLISHED`-reviews-filter respecteert
> double-blind), `#675 candidate-history` (`company.userId`-scope, alleen COMPLETED, gebatcht, begrensd),
> `#674 billing-webhook rate-limit` (IP-keyed vóór DB-werk), `#673 Lead-PII wis-pad` (auth→rol→
> `assertSameTenant`→delete→audit, cross-tenant + niet-FRANCHISER geweigerd, geen existentie-lek). Deze run
> is documentatie-only.
>
> ---
>
> **Datum:** 2026-07-08 (run 16) · **main-commit basis:** `23f34e4`
> **Uitkomst:** **GEEN nieuwe gaten.** Verse prod-build (`npm run build`), schema-push + idempotente
> demo-seed (`SEED_DEMO=true`, `prisma db seed`) op ephemere SQLite (`qa.db`), prod-server
> (`CI=true node scripts/start.mjs`, poort 3100, `LOGIN_/REGISTER_RATE_LIMIT=100000`, `STORAGE_DRIVER=local`).
> Vier rollen ingelogd via het echte formulier (`demo1234`); Playwright met de vooraf-geïnstalleerde
> Chromium (`/opt/pw-browsers/chromium-1194`). Eén parallelle Opus-security-subagent over álle
> nieuwste mutatie-/data-oppervlakken sinds run 15 (#666-#675).
>
> **DOEL 1 (echte actie, server-side geverifieerd):** CLIENT (Mark Jansen) opende `/kandidaten?job=job-1`,
> klikte op de kaart van Sanne de Vries (reactie `app-1`, status NEW) en drukte **"Shortlist"** → tegen de
> DB bevestigd: `app-1` **NEW→SHORTLIST**, audit `APPLICATION_STATUS_CHANGED` (`entityId=app-1`,
> `metadata.from=NEW,to=SHORTLIST`, verse timestamp). De volledige keten auth→rol→ownership
> (`loadOwnedApplication`)→Zod (`applicationStatusSchema`)→transitie (`assertApplicationTransition`)→
> audit→revalidate werkt.
>
> **DOEL 1b (next-action-engine, gekruist tegen DB-waarheid):** vóór de actie toonde de CLIENT
> `/acties` = 2 ("1 nieuwe reactie" + "Bedrijfsprofiel 90% compleet") en de nav-badge "Reacties 1"
> (= exact 1 NEW-application op de eigen company). Ná het shortlisten: `/acties` = **1** (alleen het
> profiel-item resteert) en de "Reacties"-badge **verdween** (geen NEW meer). De afgehandelde
> next-action verdween dus correct en spoort met de echte status — geen tegenstrijdige, dubbele of
> niet-verdwijnende actie. ZZP `/acties` = 2, FRANCHISER terecht "Alles is afgehandeld", ADMIN 16
> (6 SUBMITTED-certificaten + supporttickets) — consistent met de queues.
>
> **DOEL 2 (adversarieel — alle correct geweigerd):** privilege-escalatie (FREELANCER/CLIENT/FRANCHISER
> → `/admin/*`; niet-FRANCHISER → `/franchise`) → **redirect naar eigen dashboard**; IDOR/cross-partij +
> cross-tenant (ZZP'er/CLIENT/FRANCHISER → andermans `/samenwerkingen/<id>` + `/facturen/<id>`, incl.
> een PAID- en een DRAFT-factuur van een andere partij) → **"Niet gevonden · geen toegang"-kaart, geen
> datalek**; API-IDOR (`/api/documents/<vreemd-id>`) → **403**; onzin-id → soft-404/`notFound()`;
> path-traversal (`/facturen/..%2F..%2Fetc%2Fpasswd`) → geen leak; XSS `?q=<script>` → niet uitgevoerd.
> **POST-oppervlakken** (nieuw dit run): `/api/client-error` (leeg/niet-JSON/XSS/40KB-oversized) → **204**,
> geen 500/log-flood; `/api/csp-report` (junk/array) → **204**; `/api/tasks/run-all` + `/api/tasks/expiry`
> ongeauthenticeerd → **503** (fail-closed, geen CRON_SECRET), GET → **405**; `/api/push/subscribe`
> ongeauthenticeerd → **307** (login-redirect); `/api/billing/webhook` ongeauth. → 200 maar **inert**
> (Noop-provider `resolveWebhookRef=null`; Stripe verifieert handtekening, Mollie haalt de status
> gezaghebbend op — geen forge-pad om een abonnement te activeren). **0 HTTP-500's / crashes.**
>
> **Security-subagent (statische diepte-audit, nieuwste diff `3d3cb9a..23f34e4`):** geen gaten in de
> nieuwe surfaces — `prognose/setMonthlyIncomeGoal` (auth→Zod-begrensd bedrag→`assertOwnership`→audit),
> `uitgaven/createExpense+deleteExpense` (Zod niet-negatief/int4-begrensd, ownership op delete, gebalanceerde
> grootboekboeking + audit), `kandidaten/changeApplicationStatus` (ownership + transitie-map + veilige
> `safeParse` op afwijzingsreden), `candidate-history`/`monthly-income` (per-opdrachtgever/-ZZP'er gescoopt,
> begrensde queries — geen cross-tenant-lek), `account-export` expenses (`userId`-gescoopt), `client-error`/
> `csp-report` (rate-limit vóór body-read, size-cap, PII-normalisatie, altijd 204). Spoort met runs 6-15.
> Deze run is documentatie-only.
>
> ---
>
> **Datum:** 2026-07-07 (run 15) · **main-commit basis:** `3d3cb9a`
> **Uitkomst:** **GEEN nieuwe gaten.** Verse prod-build (`npm run build`), schema-push + idempotente
> demo-seed (`SEED_DEMO=true`) op ephemere SQLite (`qa.db`), prod-server (`CI=true node scripts/start.mjs`,
> poort 3100, `LOGIN_/REGISTER_RATE_LIMIT=100000`, `STORAGE_DRIVER=local`). Vier rollen ingelogd via het
> echte formulier (`demo1234`); Playwright met de vooraf-geïnstalleerde Chromium (`/opt/pw-browsers/chromium-1194`).
> Eén parallelle Opus-security-review over alle `"use server"`-mutatie-acties (auth→rol→ownership→Zod→audit).
>
> **DOEL 1 (echte actie, server-side geverifieerd):** ADMIN klikte "Goedkeuren" op `/admin/verificaties`
> → tegen de DB bevestigd: `cred-bram-VOG` **SUBMITTED→VERIFIED**, audit `CREDENTIAL_VERIFIED`
> (`entityId=cred-bram-VOG`, verse timestamp), SUBMITTED-teller **6→5**, en de knop verdween uit de
> queue (verse herlaad: 6→5 Goedkeuren-knoppen). De volledige authz→transitie→audit→revalidate-keten werkt.
>
> **DOEL 1b (next-action-engine, gekruist tegen DB-waarheid):** ZZP `/acties` = 2 (verplicht document
> Verzekering ontbreekt + beantwoord Mark Jansen); CLIENT = "1 nieuwe reactie" = exact 1 NEW-application
> op de eigen company (DB: 1 NEW, 1 SHORTLIST, 1 ACCEPTED) + profiel 90%; FRANCHISER terecht **"Alles is
> afgehandeld"** — geverifieerd: de enige actieve lead (WARM, Marijke Veenstra) heeft `nextFollowUp=2026-07-10`
> (nog niet due op 07-07), de KOUD-lead heeft geen follow-up, NO_DEAL is inactief → 0 overdue follow-ups;
> ADMIN = 6 certificaat-taken = exact de 6 SUBMITTED-credentials + supporttickets. Geen tegenstrijdige,
> dubbele of niet-verdwijnende actie.
>
> **DOEL 2 (adversarieel, 45+ probes — alle correct geweigerd):** privilege-escalatie (FREELANCER/CLIENT/
> FRANCHISER → `/admin/*`; niet-FRANCHISER → `/franchise/*`) → **redirect naar eigen dashboard**;
> IDOR/cross-partij (ZZP'er → andermans `/samenwerkingen/<id>` → `notFound()`, ZZP'er/CLIENT → andermans
> `/facturen/<id>` → "Niet gevonden · geen toegang"-kaart, **geen datalek**); cross-tenant (FRANCHISER →
> collaboration buiten de eigen tenant → geweigerd); API-IDOR (`/api/documents/<id>`, `/api/samenwerkingen/
<id>/dossier`, `/api/prestaties/<id>/pdf` op vreemde id's) → **403**; `/api/admin/export/invoices` als
> niet-admin → **403**; onzin-id → **404**; path-traversal (`/facturen/../../etc/passwd`) → **404**; XSS
> `?q=<script>` → niet uitgevoerd; **0 HTTP-500's / crashes**. Spoort met runs 6-14.
>
> **Security-subagent (statische diepte-audit):** geen mutatie-keten-gaten — élke `"use server"`-actie
> volgt auth→rol→ownership→Zod→audit via `authz.ts`-helpers, statusovergangen via de expliciete
> transitie-maps (`assertTransition`/`assertInvoiceTransition`/…), tenant-scoping op franchise-acties,
> Zod-grenzen op financiële input (`invoiceCentsWithinInt4`, `MAX_PERFORMANCE_HOURS`), geen raw-SQL-injectie.
> Deze run is documentatie-only.
>
> ---
>
> **Datum:** 2026-07-07 (run 14) · **main-commit basis:** `7ce69ab`
> **Uitkomst:** **1 HOOG gat gevonden + GEFIXT** (AVG art. 17-lek in de auditlog). Verse prod-build
> (`npm run build`), schema-push + idempotente demo-seed (`SEED_DEMO=true`) op ephemere SQLite
> (`qa.db`), prod-server (`CI=true node scripts/start.mjs`, poort 3100, `LOGIN_/REGISTER_RATE_LIMIT=
100000`, `STORAGE_DRIVER=local`). Vier rollen ingelogd via het echte formulier (`demo1234`); Playwright
> met de vooraf-geïnstalleerde Chromium (`/opt/pw-browsers/chromium-1194`). Twee parallelle Opus-reviews
> op de nieuwste oppervlakken (#638-647).
>
> **GEFIXT — HOOG (AVG art. 17 / verificatieflow-privacy):** `anonymizeUser` liet de
> `FRANCHISE_FREELANCER_ADDED`-auditrij (bemiddelaar voegt ZZP'er toe) volledig intact — die rij bewaart
> het e-mailadres als `entityId` én de naam in de metadata, maar de vergetelheid-query selecteerde 'm niet
> (actor = bemiddelaar, `entityType`≠"User", e-mail in `entityId` i.p.v. metadata) en de scrub was
> e-mail-only. Repro: bemiddelaar voegt ZZP'er "Jan/jan@x.nl" toe → later erasure → `SELECT entityId,
metadata FROM AuditLog WHERE action='FRANCHISE_FREELANCER_ADDED'` toont nog `jan@x.nl` + `Jan de Vries`.
> Fix: query matcht nu `entityId = originalEmail`; scrub redact naam + e-mail (incl. `entityId → [verwijderd]`)
> op aantoonbaar-eigen rijen. `account-anonymization.ts` + `admin/gebruikers/actions.ts`; 6 nieuwe tests
> (rood→groen). Zie PROGRESS.md-top.
>
> **DOEL 1 (live):** ADMIN keurde een certificaat goed via `/admin/verificaties` → knoppen 6→5 (keten
> auth→transitie→revalidate werkt). **DOEL 2 (adversarieel, live):** privilege-escalatie → redirect naar
> dashboard; document-privacy 403/200/404; IDOR/garbage → soft-404; `GET /api/tasks/run-all` → 405; FR →
> `/api/admin/export/invoices` → 403; XSS `?q=` → niet uitgevoerd; **0 HTTP-500's**. Spoort met runs 6-13.
>
> ~~**GEPARKEERD — LOW (robustheid, pre-existing, niet door #640/#643 geïntroduceerd):** de gedeelde
> `invoiceLineSchema` staat per regel `quantity(100000) × unitCents(100_000_000) = 1e13` cents toe (en
> `mileage.ts` `MILEAGE_MAX_KM × MILEAGE_MAX_RATE_CENTS` idem), ~3 orden boven de Postgres
> `int4`-kolom (`Invoice.totalCents`/`InvoiceLine.amountCents` = Prisma `Int`, max ~2,15e9).~~
> **OPGELOST (2026-07-07).** `MAX_INVOICE_CENTS` + pure `invoiceCentsWithinInt4` in `invoices.ts`;
> `invoiceLineSchema` klemt het regelbedrag (`.refine`, foutpad `unitCents`), `parseLines` het
> factuurtotaal (som van regels) vóór de DB-write, `buildMileageLine` het reiskostenbedrag — alle op
> het int4-plafond (~€21,4M). Server-side waarheid, geen schemawijziging. +9 tests (rood→groen), gate
> groen. Zie PROGRESS.md-top.
>
> ---
>
> **Datum:** 2026-07-06 (run 13) · **main-commit basis:** `f73a17b`
> **Uitkomst:** **GEEN nieuwe gaten.** 76 geautomatiseerde probes over 4 rollen (login, ~40 kernschermen,
> privilege-escalatie, IDOR/cross-partij, cross-tenant, document-privacy, XSS, robuustheid, cron/export)
>
> - 1 live DOEL-1-actie end-to-end + DOEL-1b next-action-kruischeck tegen de DB-waarheid. Verse prod-build
>   (`npm run build`), schema-push en idempotente demo-seed (`SEED_DEMO=true`) op een ephemere SQLite-DB
>   (`qa.db`), prod-server (`CI=true npx next start`, `LOGIN_/REGISTER_RATE_LIMIT=100000`,
>   `STORAGE_DRIVER=local`). Vier rollen ingelogd via het echte formulier (`demo1234`); Playwright met de
>   vooraf-geïnstalleerde Chromium (`/opt/pw-browsers/chromium-1194`). Deze run is documentatie-only.
>
> **DOEL 1 (echte actie, server-side geverifieerd):** ADMIN klikte "Goedkeuren" op `/admin/verificaties`
> → tegen de DB bevestigd: `cred-bram-VOG` **SUBMITTED→VERIFIED** met `verifiedAt`, audit
> `CREDENTIAL_VERIFIED` (`actorId`=admin), notificatie naar Bram (4→5), SUBMITTED-teller **6→5**, en de
> knop verdween uit de queue. De volledige authz→transitie→audit→notificatie-keten werkt.
>
> **DOEL 1b (next-action-engine):** `/acties` per rol gekruist tegen de DB-waarheid: ADMIN toont exact
> **5** certificaat-taken = de 5 resterende SUBMITTED-credentials (de goedgekeurde verdween); CLIENT
> "Reacties 3" = 3 NEW-applications op de eigen company; FRANCHISER terecht **"Alles is afgehandeld"**
> (0 due leads, 0 (bijna-)verlopende tenant-certs). Geen tegenstrijdige/dubbele/niet-verdwijnende actie.
>
> **DOEL 2 (adversarieel, 76 probes — alle correct geweigerd):** privilege-escalatie (FREELANCER/CLIENT/
> FRANCHISER → `/admin/*`; niet-FRANCHISER → `/franchise/leads`) → **redirect naar eigen dashboard**;
> IDOR/cross-partij (ZZP'er → andermans `/facturen/<SUBMITTED>`, CLIENT → andermans `/samenwerkingen/<id>`)
> → **soft-404 zonder veld-/bedrag-/PII-lek**; cross-tenant (FRANCHISER → default-tenant collab/profiel)
> → soft-404; garbage-id's → soft-404, **0 HTTP-500's over de hele run**; document-privacy
> (`/api/documents/<Sanne VOG>`: eigenaar + ADMIN → **200 `application/pdf`**; CLIENT/FRANCHISER/vreemde
> FREELANCER → **403**; garbage → **404**); `GET /api/tasks/run-all` → **405** (geen uitvoering);
> FRANCHISER → `/api/admin/export/invoices` → **403**; `POST /api/csp-report` → **204**; XSS in `?q=`
> (`<img onerror>`) → **0 scriptuitvoering** (React-escaping). **Nieuwste oppervlakken gereviewd:**
> #634 dienst-suggesties (bemiddelaar) — `getDienstSuggestiesForFreelancer` gate't profiel **én** jobs via
> `tenantScopeWhere(actor)`, page-poort `requireRole("FRANCHISER")` → `getRosterDossier` null-cross-tenant
> → `notFound()`; #636 urencriterium-herinnering (pure planner, geen HTTP-surface, geen geldstroom); #632
> betaalreputatie-spiegel (read-only, geaggregeerd). Geen nieuwe gaten; spoort met runs 6–12.
>
> ---
>
> **Datum:** 2026-07-06 (run 12) · **main-commit basis:** `a7d97bd`
> **Uitkomst:** **GEEN nieuwe gaten.** ~30 adversariële probes + 1 live DOEL-1-actie end-to-end +
> DOEL-1b next-action-kruischeck over 4 rollen. Verse prod-build (`npm run build`), schema-push en
> idempotente demo-seed (`SEED_DEMO=true`) op een ephemere SQLite-DB (`qa.db`), prod-server
> (`CI=true npx next start`, `LOGIN_/REGISTER_RATE_LIMIT=100000`, `STORAGE_DRIVER=local`). Vier rollen
> ingelogd via het echte formulier (`demo1234`); Playwright met de vooraf-geïnstalleerde Chromium
> (`/opt/pw-browsers/chromium-1194`). Deze run is documentatie-only.
>
> **DOEL 1 (echte actie, server-side geverifieerd):** ADMIN klikte "Goedkeuren" op `/admin/verificaties`
> → tegen de DB bevestigd: `cred-peter-VOG` én `cred-bram-VOG` **SUBMITTED→VERIFIED** met `verifiedAt`,
> audit `CREDENTIAL_VERIFIED` (`actorId`=admin), notificatie "Certificaat goedgekeurd" naar de juiste
> ZZP'ers (Peter/Bram), SUBMITTED-teller **6→4**, en de knoppen verdwenen uit de queue (6→5→4). De
> volledige authz→actie→audit→notificatie-keten werkt.
>
> **DOEL 1b (next-action-engine):** `/acties` per rol live gekruist tegen de DB-waarheid: ADMIN toont
> nog certificaat-taken (4 SUBMITTED resteren; de 2 goedgekeurde verdwenen), FREELANCER (Sanne) en
> CLIENT niet-leeg, FRANCHISER terecht **"Alles is afgehandeld"** (0 (bijna-)verlopende tenant-certs,
> 0 openstaande leads). `cascade/stage.ts` + `pending-tasks.ts` gelezen — de multi-cyclus-maskering
> (`performanceNewerThanInvoice`) en de spiegel FREELANCER/CLIENT-fasen sluiten aan op het actiecentrum.
>
> **DOEL 2 (adversarieel, ~30 probes):** privilege-escalatie (FREELANCER/CLIENT/FRANCHISER → `/admin/*`;
> niet-FRANCHISER → `/franchise`) → **307 redirect naar eigen dashboard**; IDOR/cross-partij + cross-tenant
> (andermans `/samenwerkingen/<id>`, `/facturen/<id>`; franchiser → default-tenant collab) → **soft-404**
> zonder veld-/bedrag-/PII-lek (body identiek aan een garbage-id, 0 `€`-bedragen); document-privacy
> (`/api/documents/<id>` van een ander): eigenaar/ADMIN 200, CLIENT/FRANCHISER/vreemde FREELANCER **403**;
> garbage-id's → soft-404/404, **0 HTTP-500's over de hele run**. **Nieuwe publieke oppervlakken getest:**
> CSP-report `POST /api/csp-report` (leeg/malformed/2MB-body → **204**, GET → **405**, geen crash);
> abonneerbare agenda-feed `GET /api/agenda/feed.ics` (geen/vervalst/kort HMAC-token → **404**, timing-safe,
> liveness-gate); cron `POST /api/tasks/run-all|expiry` zonder secret → **503**; betaal-webhook
> `POST /api/billing/webhook` → 200 volgens Mollie's pull-verificatie-patroon (activatie gated door een
> server-side her-fetch van de betaalstatus, geen signature-forgery-vector). Recente features gereviewd:
> directe uitnodiging (`inviteFreelancerToJob`: `requireRole('CLIENT')` → `assertOwnership` →
> tenant-gescoopte discoverable-poort, de #630 cross-tenant-fix aanwezig) en de agenda-feed (HMAC + liveness)
> — beide solide. Geen nieuwe gaten; spoort met runs 6–11.
>
> ---
>
> **Datum:** 2026-07-05 (run 11) · **main-commit basis:** `99a1b7a`
> **Uitkomst:** **GEEN nieuwe gaten.** ~62 geautomatiseerde probes over 4 rollen (login, screens,
> privilege-escalatie, IDOR/cross-partij, cross-tenant, document-privacy, XSS, robuustheid, cron-auth)
>
> - een **DB-brede cascade↔next-action-consistentie-audit (0 mismatches over alle 13 samenwerkingen)**
> - één **live DOEL-1-actie end-to-end** (admin keurt `cred-bram-VOG` goed via de echte knop). Geen
>   reparatie nodig; deze run is documentatie-only.
>
> ## Samenvatting run 11 — CLEAN (spoort met runs 6–10)
>
> **DOEL 1 (echte actie + server-side geverifieerd):** ADMIN klikte "Goedkeuren" op
> `/admin/verificaties` voor Bram's VOG → tegen de DB bevestigd: `cred-bram-VOG` **SUBMITTED→VERIFIED**
> met `verifiedAt`, audit `CREDENTIAL_VERIFIED` met `actorId`=admin, notificatie "Certificaat
> goedgekeurd" naar Bram, en de SUBMITTED-teller **6→5** (de actie verdween uit `/acties`). **~55
> kernschermen** over 4 rollen laadden HTTP 200 met de juiste rol-shell; **nul 500's/crashes**; 4
> logins OK. Malicieuze prestatie-invoer (negatieve/absurde uren, >1000u, negatief bedrag) wordt
> server-side geweigerd door `validatePerformanceForm` (aangeroepen vóór persist in
> `samenwerkingen/[id]/actions.ts`); de resubmit-actie bindt het tarief hard aan de eigen samenwerking
> (expliciete A01/IDOR-verdediging tegen financiële manipulatie).
>
> **DOEL 1b (next-action-engine):** een DB-audit repliceerde `cascade/stage.ts` + de collab-lus van
> `pending-tasks.ts` voor **elke** PROPOSED/ACTIVE/COMPLETED/CANCELLED-samenwerking en vergeleek
> `youAreUp` (fase) met de aanwezigheid van een pending-task, per partij → **0 mismatches** in alle
> cascade-fasen (contract-sign, performance-submit/approve, invoice-submit/approve, payment). `/acties`
> per rol kruis-gecheckt tegen de DB: ADMIN 6 "Beoordeel het certificaat" = 6 SUBMITTED-credentials;
> FREELANCER (Sanne) 2 (ontbrekend Verzekering-doc + "Beantwoord Mark Jansen"); CLIENT 5 (2 berichten,
> 3 nieuwe reacties, bedrijf 90%, 1 concept); FRANCHISER terecht "Alles is afgehandeld".
>
> **DOEL 2 (adversarieel, ~35 probes):** privilege-escalatie (FREELANCER/CLIENT/FRANCHISER →
> `/admin/*`, franchise-only) → **redirect naar eigen dashboard**; IDOR/cross-partij (andermans
> `/samenwerkingen/<id>`, `/facturen/<id>`) → **soft-404 "Niet gevonden · geen toegang"** zonder
> veldlek (inhoud identiek aan een garbage-id); cross-tenant (FRANCHISER → default-tenant profiel) →
> soft-404; document-privacy (`/api/documents/<id>`: eigenaar + ADMIN → 200 `%PDF`; CLIENT/FRANCHISER/
> vreemde FREELANCER → 403 `Geen toegang`; garbage → 404); XSS in `?status=`/`?q=` → **0
> scriptuitvoering** (React-escaping); cron-auth (`/api/tasks/run-all`) → **CRON_SECRET-gated** (503
> zonder secret, 401 bij fout token); robuustheid → soft-404, **0 HTTP-500's over de hele run**. Geen
> nieuwe gaten. De twee 404-vlaggen (`/admin`, `/franchise/rooster`) waren probe-padfouten — beide
> routes bestaan niet en geen enkele nav-link verwijst ernaar.
>
> ---
>
> **Datum:** 2026-07-05 (run 10) · **main-commit basis:** `a86e415`
> **Methode:** verse productie-build (`npm install` → `npm run build`), schema-push (`prisma db push`)
> en idempotente demo-seed (`SEED_DEMO=true`) op een ephemere SQLite-DB (`qa.db`); productie-server
> (`CI=true PORT=3100 npx next start`, `LOGIN_/REGISTER_RATE_LIMIT=100000`, `STORAGE_DRIVER=local`,
> `AUTH_SECRET=ci-dummy-…`). Playwright met de vooraf-geïnstalleerde Chromium (`executablePath=
/opt/pw-browsers/chromium-1194/…`), vier rollen in losse contexts, ingelogd via het echte formulier
> (`demo1234`). Entity-id's uit de seed-DB via Prisma. Doel-1 (acties), 1b (next-actions), 2
> (adversarieel) + twee parallelle Opus-audits (next-action-engine-consistentie, recente commits
> #605–#617). De DB is ephemeer; geen poging raakte productie.
>
> ## Samenvatting — 1 DEFECT LIVE GEREPRODUCEERD & GEFIXT (spiegelbeeld van run 9: APPROVED-factuur maskeert de betaalactie)
>
> **DOEL 1 (echte actie + server-side geverifieerd):** (1) ADMIN keurde via de "Goedkeuren"-knop op
> `/admin/verificaties` een SUBMITTED-credential goed → tegen de DB bevestigd: `SUBMITTED` **6→5**,
> `cred-bram-VOG` op `VERIFIED` met `verifiedAt`, `CREDENTIAL_VERIFIED`-audit (`actorId`=admin),
> notificatie "Certificaat goedgekeurd" naar Bram. (2) FREELANCER (Iris) stuurde via de nieuwe knop
> "Herinner de opdrachtgever" (#609) een handmatige betaalherinnering op een APPROVED-factuur →
> `PAYMENT_REMINDER`-notificatie naar de opdrachtgever + `INVOICE_REMINDER_SENT`-audit; een tweede
> directe poging werd door de afkoelperiode geweigerd (knop verdween server-side). **~55 kernschermen**
> over 4 rollen laadden HTTP 200 met de juiste rol-shell; **nul 500's** (server-log schoon); 4 logins OK.
>
> **DOEL 1b (next-action-engine):** `/acties` per rol kruis-gecheckt tegen de DB. ADMIN: 5 "Beoordeel
> het certificaat"-taken = exact de 5 resterende SUBMITTED-credentials (de goedgekeurde verdween).
> CLIENT: "3 nieuwe reacties" = 3 NEW-applications. FREELANCER (Sanne): ontbrekend Verzekering-document
>
> - "Beantwoord Mark Jansen". FRANCHISER: terecht "Alles is afgehandeld". De next-action-audit bracht
>   het defect hieronder aan het licht.
>
> **DOEL 2 (adversarieel, ~40 probes):** privilege-escalatie (FREELANCER/CLIENT/FRANCHISER →
> `/admin/*`, franchise-only) → **redirect naar eigen dashboard**; IDOR/cross-partij (andermans
> `/samenwerkingen/<id>`, `/facturen/<id>`, DRAFT `job-7`) → **soft-404 zonder veldlek** (h1 null,
> len≈461); cross-tenant (FRANCHISER → default-tenant `collab-1`, `/franchise/zzpers/<Sanne>`) →
> soft-404; CLIENT → `/zzp/<Noord-profiel>` → **echte 404**; document-privacy
> (`/api/documents/<Sanne VOG>`: eigenaar + ADMIN → 200 `application/pdf`; CLIENT/FRANCHISER/vreemde
> FREELANCER → 403; garbage → 404); rol-exports (`/verplichtingen/export`, `/prognose/export`,
> `/api/admin/export/invoices`, foreign `dba-dossier`) → **403**; `/api/tasks/run-all` GET → **405**;
> XSS in `?status=`/`?q=` → **0 scriptuitvoering**. Nul nieuwe gaten (consistent met runs 6–9). De
> recente-commits-audit (#605–#617: creditor/debtor-overzicht, reistijd-signaal, betaalherinnering,
> abonnement-vervalcyclus, PII-redactie) vond **geen** authz-/privacy-/correctheidsdefect.
>
> ### DEFECT (LIVE GEREPRODUCEERD + GEFIXT) — APPROVED vorige-cyclus-factuur wordt gemaskeerd, cascade-fase zegt "niets te doen" terwijl het actiecentrum "markeer de betaling" toont
>
> - **Geschonden regel:** DESIGN/next-action-consistentie — "elke pagina beantwoordt: wat moet ik nu
>   doen?"; de cascade-fase (detail/lijst/dashboard) mag het actiecentrum (`/acties`) niet tegenspreken.
> - **Repro (live bevestigd tegen de draaiende app):** een ACTIVE-samenwerking met een cyclus-1-factuur
>   op `lifecycleStatus=APPROVED` (opdrachtgever heeft goedgekeurd, ZZP'er moet de betaling nog
>   markeren) waarop de ZZP'er nieuwe cyclus-2-uren indient (`Performance SUBMITTED`, nieuwer dan de
>   factuur). Detail-status-regel als ZZP'er: **"Je hoeft nu niets te doen — wacht op goedkeuring van je
>   uren."** (`youAreUp:false`), terwijl hetzelfde scherm ("markeer de ontvangst") én `/acties`
>   ("Markeer de betaling zodra je bent betaald") de openstaande betaaltaak tonen — een zichzelf
>   tegensprekend scherm. Ook op `/samenwerkingen`-lijst en de dashboard-cascadezone.
> - **Oorzaak:** het spiegelbeeld van de run-9-fix. `performanceNewerThanInvoice` (`stage.ts:75`) nulde
>   de factuur **onvoorwaardelijk** zodra er een nieuwere prestatie was — óók een APPROVED/OVERDUE/DRAFT/
>   REJECTED-factuur die nog een openstaande ZZP-actie draagt. Bovendien short-circuit een `SUBMITTED`
>   prestatie (regel 101, "wacht op goedkeuring", ZZP niet aan zet) vóór de factuur-tak, dus de
>   betaalactie viel weg. `pending-tasks.ts:264-266` maskeert niets en toonde de taak wél → contradictie.
> - **Fix:** in de `perf === "SUBMITTED"`-tak van `stage.ts` een ZZP-uitzondering: is er een genulde
>   vorige-cyclus-factuur die nog een ZZP-actie draagt (DRAFT→indienen, REJECTED→corrigeren,
>   APPROVED/OVERDUE→betaling markeren; SUBMITTED/PAID/PROCESSED → geen ZZP-actie), toon dan díe fase
>   voor de ZZP'er (`youAreUp:true`) via de nieuwe pure helper `priorCycleFreelancerPhase`. De
>   opdrachtgever ziet ongewijzigd de keur-fase (diens actie). **Live geverifieerd na rebuild:** de
>   ZZP'er ziet nu "Actie nodig: markeer de betaling zodra je bent betaald.", de opdrachtgever "Actie
>   nodig: keur de ingediende uren of oplevering." — beide consistent met het actiecentrum. Tests: 5
>   nieuwe cases in `stage.test.ts` (rood→groen), gate volledig groen (typecheck, lint, **3107
>   unit-tests**, build, prettier).
>
> ### GEPARKEERD (uit de next-action-audit — lagere prioriteit, niet deze run gefixt)
>
> - ~~**[MEDIUM] FREELANCER `cascadeWork` nav-badge telt de "dien je uren in"-fase niet.**~~
>   **OPGELOST (2026-07-05, PR #619).** `signals.ts` berekende `cascadeWork = cascadeDraft +
cascadeApproved` (alleen factuur-DRAFT + APPROVED), dus de indien-/corrigeer-fase (en PROPOSED
>   contract-teken) viel weg → ondertelling t.o.v. de "aan zet"-lijst. Nu telt de nieuwe pure
>   `countFreelancerCascadeWork` de samenwerkingtaken exact zoals `freelancerTasks` (pending-tasks.ts):
>   PROPOSED → contract, ACTIVE geen/DRAFT/REJECTED-prestatie → indienen/corrigeren, + 1 per openstaande
>   factuur. De FREELANCER-tak laadt daarvoor de PROPOSED/ACTIVE-`disputedAt:null`-samenwerkingen (zelfde
>   scope als het actiecentrum) i.p.v. twee losse invoice-counts. 9 nieuwe tests; geen schemawijziging.
> - **[LOW/latent] Freelancer factuur-taak mist issuer-scoping** (ongewijzigd sinds run 8/9) —
>   `pending-tasks.ts` filtert de freelancer-facturen zonder `issuerUserId`. Nu ongevaarlijk (alle
>   cascade-facturen zijn freelancer-uitgegeven); voeg `issuerUserId: userId` toe zodra platform-fee
>   (Event F) wordt geactiveerd.
>
> Codewijziging deze run: `src/lib/cascade/stage.ts` + `src/lib/cascade/stage.test.ts`. DoD groen.
>
> ---
>
> **Datum:** 2026-07-04 (run 9) · **main-commit basis:** `757772d`
> **Methode:** verse productie-build (`npm install` → `npm run build`), schema-push (`prisma db push`)
> en idempotente demo-seed (`SEED_DEMO=true`) op een ephemere SQLite-DB (`qa.db`); productie-server
> (`CI=true PORT=3100 npx next start`, `LOGIN_/REGISTER_RATE_LIMIT=100000`, `STORAGE_DRIVER=local`,
> `AUTH_SECRET=ci-dummy-…`). Playwright met de vooraf-geïnstalleerde Chromium (`executablePath=
/opt/pw-browsers/chromium-1194/…`), vier rollen in losse contexts, ingelogd via het echte formulier
> (`demo1234`). Entity-id's uit de seed-DB via Prisma. Doel-1 (acties), 1b (next-actions), 2
> (adversarieel). De DB is ephemeer; geen poging raakte productie.
>
> ## Samenvatting — 1 DEFECT LIVE GEREPRODUCEERD & GEFIXT (multi-cyclus: betaalde factuur maskeerde nieuwe uren)
>
> **DOEL 1 (echte actie + server-side geverifieerd):** ADMIN keurde via de "Goedkeuren"-knop op
> `/admin/verificaties` twee SUBMITTED-credentials goed (`cred-bram-VOG`, `cred-peter-VOG`) → tegen de
> DB bevestigd: `SUBMITTED` **6→4**, `VERIFIED` **24→26**, `verifiedAt` gezet, twee
> `CREDENTIAL_VERIFIED`-audits met `actorId`=admin. De volledige schrijfketen auth→rol→ownership→
> transitie→audit→notificatie werkt end-to-end. **~40 kernschermen** over 4 rollen laadden HTTP 200 met
> de juiste rol-shell; **nul 500's** (server-log schoon); alle 4 logins slaagden.
>
> **DOEL 1b (next-action-engine):** `/acties` per rol laadt 200. ADMIN-verificatietaken = de SUBMITTED-
> credentials; CLIENT nieuwe-reacties/concept-opdracht; FREELANCER ontbrekend document; FRANCHISER
> "alles afgehandeld". Kruis-check bracht de multi-cyclus-inconsistentie hieronder aan het licht.
>
> **DOEL 2 (adversarieel, ~40 probes):** privilege-escalatie (FREELANCER/CLIENT/FRANCHISER →
> `/admin/*`, franchise-only) → **redirect naar eigen dashboard**; IDOR/cross-partij (andermans
> `/samenwerkingen/<id>`, `/facturen/<id>`) → **soft-404 zonder veldlek** (bedrag/naam niet in body,
> geverifieerd); garbage-id → 200 soft-404 / 404, **nul 500**; document-privacy
> (`/api/documents/<Sanne VOG>`: eigenaar + ADMIN → 200 `application/pdf`; CLIENT/FRANCHISER → 403;
> garbage → 404); `/api/tasks/run-all` GET → **405**; XSS in query → **niet uitgevoerd**. Nul nieuwe
> gaten in de adversariële matrix (consistent met runs 6–8).
>
> ### DEFECT (LIVE GEREPRODUCEERD + GEFIXT) — betaalde vorige-cyclus-factuur maskeert nieuwe, goed te keuren uren
>
> - **Geschonden regel:** DESIGN/next-action-consistentie — "elke pagina beantwoordt: wat moet ik nu
>   doen?"; de cascade-fase (detail/lijst/dashboard) moet overeenkomen met het actiecentrum.
> - **Repro (live bevestigd tegen de draaiende app):** een ACTIVE-samenwerking met een betaalde
>   cyclus-1-factuur (`lifecycleStatus=PAID`) waarop de ZZP'er nieuwe uren indient (cyclus-2-prestatie
>   `SUBMITTED`, nieuwer dan de factuur). `createPerformance` gate't alleen op `status==="ACTIVE"`, dus
>   dit multi-cyclus-pad is echt bereikbaar. De samenwerking-detailpagina toonde als opdrachtgever
>   **"Je hoeft nu niets te doen — er is nu geen actie van je nodig."** + badge **"Betaald"**, terwijl
>   het "aan zet"-blok eronder tegelijk **"1 ingediende prestatie wacht op je goedkeuring."** toonde —
>   een zichzelf tegensprekend scherm. Ook op `/samenwerkingen`-lijst, dashboard-zone en het
>   bemiddelaar-dossier.
> - **Oorzaak:** `src/lib/cascade/stage.ts` nam de PAID/PROCESSED-terminaaltak vóór de prestatie-
>   evaluatie, op de **globaal-laatste** factuur — ongeacht of er daarna een nieuwe prestatie was
>   ingediend. De cyclus-2-uren vielen zo achter de terminale "Betaald"-tak weg.
> - **Fix:** nieuwe optionele input `performanceNewerThanInvoice` + pure helper
>   `isPerformanceNewerThanInvoice(perfCreatedAt, invCreatedAt)`. Is de meest recente prestatie nieuwer
>   dan de meest recente factuur, dan hoort de factuur bij een vorige cyclus en telt ze niet mee (`inv`
>   → null): de fase valt terug op de prestatie-evaluatie (opdrachtgever moet keuren). Alle vijf callers
>   (`dashboard`, `samenwerkingen`-lijst, `samenwerkingen/[id]`, `roster-dossier`) laden nu ook
>   `createdAt` op de laatste prestatie/factuur en geven de vlag door. **Live geverifieerd na rebuild:**
>   dezelfde samenwerking toont nu "Actie nodig: keur de ingediende uren of oplevering." + badge
>   "Ter goedkeuring", consistent met het actiecentrum. Tests: 4 nieuwe cases in `stage.test.ts`
>   (rood→groen), gate volledig groen (typecheck, lint, **3017 unit-tests**, build, prettier).
>
> ---
>
> **Datum:** 2026-07-04 (run 8) · **main-commit basis:** `bf7395d`
> **Methode:** verse productie-build (`npm install` → `npm run build`), schema-push (`prisma db push`)
> en idempotente demo-seed (`SEED_DEMO=true`) op een ephemere SQLite-DB (`qa.db`); productie-server
> (`CI=true PORT=3100 npx next start`, `LOGIN_/REGISTER_RATE_LIMIT=100000`, `STORAGE_DRIVER=local`,
> `AUTH_SECRET=ci-dummy-…`). Playwright met de vooraf-geïnstalleerde Chromium (`executablePath=
/opt/pw-browsers/chromium-1194/…`), vier rollen in losse contexts, ingelogd via het echte formulier
> (`demo1234`). Entity-id's uit de seed-DB via Prisma. Doel-1 (acties), 1b (next-actions), 2
> (adversarieel) + drie parallelle Opus-audits (next-action-engine, recente commits, franchiser
> tenant-isolatie). De DB is ephemeer; geen poging raakte productie.
>
> ## Samenvatting — 1 DEFECT GEVONDEN & GEFIXT (next-action-contradictie bij contract ondertekenen)
>
> **DOEL 1 (echte actie + server-side geverifieerd):** CLIENT (Mark) accepteert via de echte
> "Accepteren"-knop op `/kandidaten` de reactie van Daan Visser (`app-7`) → status-overgang
> `NEW → ACCEPTED` server-side, `APPLICATION_STATUS_CHANGED`-audit (`actorId`=Mark, from/to correct),
> "Je reactie is geaccepteerd"-notificatie naar Daan, én de next-action "3 nieuwe reacties" daalt
> naar 2. De volledige keten auth→rol→ownership→Zod→transitie(`assertApplicationTransition`)→audit→
> notificatie→next-action-cascade werkt end-to-end. **~90 kernschermen** over 4 rollen laadden HTTP 200
> met de juiste rol-shell; **nul 500's** (server-log schoon), alle 4 logins slaagden.
>
> **DOEL 1b (next-action-engine):** `/acties` per rol kruis-gecheckt tegen de echte DB. ADMIN: 6
> "Beoordeel het certificaat"-taken = exact de 6 SUBMITTED-credentials. CLIENT: "3 nieuwe reacties" =
> 3 NEW-applications, "1 concept-opdracht" = 1 DRAFT-job. FREELANCER (Sanne): ontbrekend
> Verzekering-document + "Beantwoord Mark Jansen". FRANCHISER: terecht "Alles is afgehandeld".
> **DEFECT gevonden (zie hieronder): de cascade-fase sprak het actiecentrum tegen bij een nog niet
> getekend contract.**
>
> **DOEL 2 (adversarieel, ~40 probes):** privilege-escalatie (FREELANCER/CLIENT/FRANCHISER →
> `/admin/*`, franchise-only routes) → redirect naar eigen dashboard; IDOR/cross-partij (andermans
> `/samenwerkingen/<id>`, `/facturen/<id>`) → soft-404 zonder veldlek (geverifieerd: geen foreign
> bedrag/naam in de body); cross-tenant (FRANCHISER → default-tenant `collab-1`, `/franchise/zzpers/
<Sanne>`) → soft-404; garbage-id → 404/soft-404, nul 500; document-privacy (`/api/documents/<Sanne
VOG>`: eigenaar + ADMIN → 200 `application/pdf`; CLIENT/FRANCHISER/vreemde → 403; garbage → 404);
> foreign `dba-dossier`/`dossier` → 403; XSS in query → niet uitgevoerd; `/api/tasks/run-all` GET → 405. Drie Opus-audits (recente commits #592–#601, franchiser tenant-isolatie): **geen nieuwe gaten**.
>
> ### DEFECT (GEFIXT deze run) — cascade-fase verbergt de teken-CTA en spreekt `/acties` tegen
>
> - **Geschonden regel:** DESIGN/next-action-consistentie — "elke pagina beantwoordt: wat moet ik nu
>   doen?"; de cascade-fase (detail/lijst/dashboard) moet overeenkomen met het actiecentrum.
> - **Repro:** open een voorgestelde samenwerking (`PROPOSED`, `contractStatus=DRAFT`) als een van de
>   partijen (bv. `bouwpartners@` → `/samenwerkingen/cmr5wo9iw…`). Het detail/de lijstkaart/de
>   dashboard-cascadezone toonden **"Voorgesteld — in afwachting van het contract · je hoeft nu niets
>   te doen — het contract wordt nog voorbereid"** (`youAreUp:false`), terwijl `/acties` én het
>   dashboard tegelijk **"Contract ondertekenen"** als actieve taak toonden (`contractSignTask`, aan
>   béíde partijen). De teken-knop is direct beschikbaar (`signContract` tekent een DRAFT-contract; de
>   inzetbaarheid-gate is de enige blokkade).
> - **Oorzaak:** `src/lib/cascade/stage.ts` markeerde "aan zet: onderteken" alléén bij
>   `contractStatus==="SENT"`, maar productie zet `SENT` **nergens** — de echte levensloop is
>   `DRAFT → SIGNED` (schema-default `DRAFT`; enige toewijzing `SIGNED` in `handlers.ts`). Elke echte
>   ondertekenbare samenwerking viel dus in de dode passieve DRAFT-tak. De `SENT`-tak was dode code.
> - **Fix:** een niet-getekend contract op een niet-terminale samenwerking is meteen ondertekenbaar
>   door beide partijen → één `contract-sign`-fase (`youAreUp:true`, "Onderteken contract",
>   tone `attention`). Status-zin (`collaboration-status-line.ts`) toont nu "Actie nodig: onderteken
>   het contract om te starten." Tests bijgewerkt (rood→groen) in `stage.test.ts` +
>   `collaboration-status-line.test.ts`. **Live geverifieerd** tegen de verse build: de detailpagina
>   toont nu de actieve teken-CTA i.p.v. "wordt voorbereid".
>
> ### GEPARKEERD (uit de next-action-audit — lagere prioriteit, niet reproduceerbaar in de seed)
>
> - ~~**[MEDIUM] Stale "Betaald" maskeert een nieuwe uren-cyclus.**~~ **OPGELOST (2026-07-04 run 9)** —
>   `stage.ts` zette de PAID/PROCESSED-terminaaltak vóór de prestatie-evaluatie op de globaal-laatste
>   factuur. Bij een tweede cyclus (cyclus 1 `PAID`, freelancer dient cyclus-2-uren `SUBMITTED` in)
>   toonde de cascade-fase "Factuur betaald · niets te doen" terwijl de opdrachtgever de nieuwe uren
>   moet goedkeuren — live gereproduceerd en gefixt via `performanceNewerThanInvoice` +
>   `isPerformanceNewerThanInvoice`; een vorige-cyclus-factuur telt niet meer mee zodra er een nieuwere
>   prestatie is. Zie de run-9-samenvatting bovenaan.
> - **[LOW/latent] Freelancer factuur-taak mist issuer-scoping.** `pending-tasks.ts:234-237` filtert de
>   freelancer-facturen zonder `issuerUserId`, asymmetrisch met de client-kant (`counterpartyUserId`)
>   en `signals.ts`. Nu ongevaarlijk (alle cascade-facturen zijn freelancer-uitgegeven), maar zodra een
>   niet-freelancer-factuur aan de samenwerking hangt (platform-fee, Event F — default UIT) zou de
>   freelancer "factuur indienen/betaling markeren" te zien krijgen voor een factuur die niet van hem
>   is. Voeg `issuerUserId: userId` toe wanneer platform-fee wordt geactiveerd.
> - ~~**[LOW] Geen "dien je uren in"-taak voor de freelancer**~~ **GEDAAN (2026-07-04g, PR #605)** —
>   `pending-tasks.ts freelancerTasks` laadt nu de meest recente prestatie en spiegelt `stage.ts`:
>   geen/DRAFT → nieuwe `performanceSubmitTask` (item-niveau `/acties`), REJECTED → resubmit,
>   SUBMITTED/APPROVED → elders. Sluit de asymmetrie tussen de cascade-fase en het actiecentrum.
> - **[LOW/hardening] `governance-screen.tsx:72`** laadt kandidaat-profielen via `id: { in: … }` zonder
>   tenant-filter. Niet exploiteerbaar (de ids komen uit reeds tenant-gescopete handoffs; toont enkel
>   naam+certificaten), maar een expliciete tenant-filter + comment is future-proof.
>
> Codewijziging deze run: `stage.ts` + `collaboration-status-line.ts` + 2 testbestanden. DoD groen.
>
> ---
>
> **Datum:** 2026-07-03 (run 7) · **main-commit basis:** `edcb354`
> **Methode:** verse productie-build (`npm install` → `npm run build`), schema-push (`prisma db push`)
> en idempotente demo-seed (`SEED_DEMO=true`) op een ephemere SQLite-DB (`qa.db`); productie-server
> (`CI=true PORT=3100 npx next start`, `LOGIN_/REGISTER_RATE_LIMIT=100000`, `STORAGE_DRIVER=local`,
> `AUTH_SECRET=ci-dummy-…`). Playwright met de vooraf-geïnstalleerde Chromium (expliciete
> `executablePath=/opt/pw-browsers/chromium-1194/…`), vier rollen in losse contexts, ingelogd via het
> echte formulier (`demo1234`). Entity-id's uit de seed-DB via Prisma (niet geraden). Doel-1 (acties),
> 1b (next-actions), 2 (adversarieel). De DB is ephemeer; geen poging raakte productie.
>
> ## Samenvatting — GEEN GATEN GEVONDEN
>
> **DOEL 1 (echte actie + server-side geverifieerd):** ADMIN keurt een verificatie goed via de
> "Goedkeuren"-knop op `/admin/verificaties` → knoptelling **6→5**, en tegen de DB bevestigd:
> `Credential SUBMITTED` **6→5** / `VERIFIED` **24→25**, `cred-bram-VOG` op `VERIFIED` met `verifiedAt`
> gezet, `CREDENTIAL_VERIFIED`-audit geschreven (`actorId`=admin, `entityId`=`cred-bram-VOG`) en een
> "Certificaat goedgekeurd"-notificatie naar de ZZP'er. De goedkeur-schrijfketen werkt dus end-to-end.
> **58 kernschermen** over 4 rollen laadden HTTP 200 met de juiste rol-shell en `<h1>`; **nul echte
> 500's** (server-log schoon over de hele run); alle 4 logins slaagden. (Twee meet-artefacten: één
> `crash`-vlag op `/admin/audit` was een transiënte `/500/`-substringmatch op een audit-rijwaarde — bij
> herophalen HTTP 200, `<h1>`="Audit log", nul regex-match; twee `status=null`-metingen op
> `/samenwerkingen/collab-1` en `/admin/import` renderden hun correcte `<h1>` — een Playwright
> `goto`-quirk bij redirect/`networkidle`, geen defect.)
>
> **DOEL 1b (next-action-engine):** `/acties` per rol kruis-gecheckt tegen de echte DB-staat. ADMIN: 6
> "Beoordeel het certificaat van …"-taken = exact de 6 SUBMITTED-credentials (Anna/Bram/Nadia/Peter/
> Sanne/Sofie). FREELANCER (Sanne): "Verplicht document ontbreekt: Verzekering" + "Beantwoord Mark
> Jansen" (samenwerking collab-1) — klopt. CLIENT (Mark): "3 nieuwe reacties" = 3 `Application`-rijen op
> `NEW`, + 2 bericht-antwoorden + 90%-bedrijfsprofiel + 1 concept-opdracht — klopt. FRANCHISER: terecht
> "Alles is afgehandeld" (geen valse setup-nudge). Rol-geïsoleerde prioriteitsbanden; geen
> tegenstrijdige/dubbele/niet-verdwijnende actie (na de goedkeuring verdween de admin-taak).
>
> **DOEL 2 (adversarieel, ~42 probes):** privilege-escalatie (FREELANCER/CLIENT/FRANCHISER →
> `/admin/*`, rol-vreemde + franchise-only routes) → **redirect naar het eigen dashboard**;
> IDOR/cross-partij (andermans `/samenwerkingen/<id>`, `/facturen/<id>`, foreign DRAFT-`job-7`,
> garbage-id's) → **soft-404 "Niet gevonden — geen toegang"** (geen veldlek); cross-tenant (FRANCHISER
> Noord → default-tenant `collab-1` + `/franchise/zzpers/<Sanne>` + `/franchise/opdrachtgevers/<Jansen>`)
> → soft-404; CLIENT → cross-tenant `/zzp/<Lars>` → **echte 404**; document-privacy
> (`/api/documents/<Sanne VOG>`: eigenaar + ADMIN → **200 `application/pdf`**; CLIENT/FRANCHISER/andere
> FREELANCER → **403** `{"error":"Geen toegang."}`; garbage-doc → **404**); rol-exports
> (`/verplichtingen/export`, `/prognose/export`, `/api/admin/export/invoices`, foreign
> `/api/samenwerkingen/<x>/dba-dossier`) → **403**; XSS in query-params (`?status=`/`?q=`/`?match=` met
> `<script>`/`<img onerror>`/`' OR 1=1--`) → **0 scriptuitvoering**, 0 levende `<img onerror>`,
> URL-encoded reflectie; `/api/tasks/run-all` via GET → **405** (geen uitvoering). **Nul 500's, nul
> leaks, nul gaten.**
>
> Geen codewijziging nodig; deze run is een backlog-/PROGRESS-update.
>
> ---
>
> **Datum:** 2026-07-03 (run 6) · **main-commit basis:** `5ee4d74`
> **Methode:** verse productie-build (`npm install` → `npm run build`), schema-push (`prisma db push`)
> en idempotente demo-seed (`SEED_DEMO=true`) op een ephemere SQLite-DB (`qa.db`); productie-server
> (`CI=true PORT=3100 npm run start`, `LOGIN_/REGISTER_RATE_LIMIT=100000`, `STORAGE_DRIVER=local`,
> `AUTH_SECRET=ci-dummy-…`). Playwright met de vooraf-geïnstalleerde Chromium (expliciete
> `executablePath`), vier rollen in losse contexts, ingelogd via het echte formulier (`demo1234`).
> Doel-1 (acties), 1b (next-actions), 2 (adversarieel). De DB is ephemeer; geen poging raakte productie.
>
> ## Samenvatting — GEEN GATEN GEVONDEN
>
> **DOEL 1 (acties uitvoeren):** een echte end-to-end mutatie gedreven en server-side geverifieerd —
> FREELANCER (Sanne) reageert op `job-8` (Wijkverpleegkundige) → `Application` aangemaakt met status
> `NEW` + correcte motivatie in de DB, zichtbaar op `/reacties`; daarna **reactie intrekken** via de
> bevestig-dialoog → status-overgang naar `WITHDRAWN` (server-side, geauditeerd, display "ingetrokken").
> Alle ~40 kernschermen over 4 rollen laadden HTTP 200 met de juiste rol-shell, **nul 500's**; alle 4
> logins slaagden.
>
> **DOEL 1b (next-action-engine):** `/acties` per rol kruis-gecheckt tegen `next-actions.ts` en de
> echte DB-staat. FREELANCER: "Verplicht document ontbreekt: Verzekering" + "Beantwoord Mark Jansen" —
> klopt. CLIENT: 3 nieuwe reacties + 2 berichten + concept-opdracht + 90%-bedrijfsprofiel — klopt.
> ADMIN: 6 certificaten in de verificatie-wachtrij — klopt tegen de queue. FRANCHISER: tenant is
> volledig opgezet (opdrachtgever + gepubliceerde dienst + roster) → terecht "Alles is afgehandeld"
> (geen valse setup-nudge). Rol-geïsoleerde prioriteitsbanden; geen tegenstrijdige/dubbele/niet-
> verdwijnende actie.
>
> **DOEL 2 (adversarieel, ~60 probes):** privilege-escalatie (FREELANCER/CLIENT/FRANCHISER →
> `/admin/*` en franchise-only routes) → **307-redirect naar het eigen dashboard**; IDOR/cross-partij
> (andermans `/samenwerkingen/<id>`, `/facturen/<id>`) → **soft-404 "Niet gevonden — geen toegang"**
> (geen data-leak: body toont enkel de deny-tekst, geverifieerd tegen de echte foreign-velden);
> cross-tenant (FRANCHISER Noord → default-tenant `collab-1` + `/franchise/zzpers/<Sanne>`) → soft-404;
> document-privacy (`/api/documents/<foreign VOG>`: eigenaar + ADMIN → 200 `application/pdf`;
> niet-eigenaar FREELANCER/CLIENT/FRANCHISER → **403**); dossier-/pdf-/modelovereenkomst-endpoints van
> een vreemde samenwerking → **403**; garbage-id's → **404** (API) / soft-404 (pagina's), **nul 500's**;
> XSS in query-params (`?q=<script>`) → **niet uitgevoerd, niet onge-escaped ge-echood**; malicieuze
> factuur-input server-side afgevangen (`invoiceLineSchema`: quantity min 1/max 100000, unitCents
> 0..100M — negatief/absurd geweigerd). **Geen enkel gat.**
>
> ---
>
> **Datum:** 2026-06-25 (run 5) · **main-commit basis:** `d738b77`
> **Methode:** verse productie-build + schema-push + idempotente demo-seed (`SEED_DEMO=true`) op een
> ephemere SQLite-DB (`qa.db`); productie-server (`CI=true PORT=3100 npm run start`,
> `LOGIN_RATE_LIMIT/REGISTER_RATE_LIMIT=100000`, `STORAGE_DRIVER=local`, `AUTH_SECRET=ci-dummy-…`).
> Playwright met de vooraf-geïnstalleerde Chromium (expliciete `executablePath`), vier rollen in losse
> contexts, ingelogd via het echte formulier (`demo1234`). Doel-1 (acties), 1b (next-actions), 2
> (adversarieel). De DB is ephemeer; geen poging raakte productie.
>
> ## Samenvatting — 1 DEFECT GEVONDEN & GEFIXT (betaal-webhook achter de inlogmuur)
>
> **DOEL 1 + 1b:** 43 kernschermen over 4 rollen laadden HTTP 200, juiste shell, **nul 500's**. Alle 4
> logins slaagden. De next-action-zone (`/acties` per rol) + dashboard kruis-gecheckt tegen
> `next-actions.ts`/`pending-tasks.ts`/`cascade/stage.ts`: rol-geïsoleerde prioriteitsbanden,
> ownership-/tenant-gescopete queries, handoff-correcte fasering. Geen tegenstrijdige/dubbele/niet-
> verdwijnende actie.
>
> **DOEL 2 (adversarieel, ~60 probes):** privilege-escalatie (FREELANCER/CLIENT/FRANCHISER → `/admin/*`,
> rol-vreemde routes) → **opaque redirect** naar het eigen dashboard; IDOR/cross-partij (andermans
> `/samenwerkingen/<id>`, `/facturen/<SUBMITTED>`, onzin-id) → **soft-404 "Niet gevonden — geen
> toegang"** (bodyLen ~400, nul leak-markers — geverifieerd tegen de echte foreign-collab-velden);
> cross-tenant (FRANCHISER Noord → default-tenant `collab-1` + `/franchise/zzpers/<Sanne>`) → soft-404;
> document-privacy (eigenaar → 200 `application/pdf`; niet-eigenaar CLIENT/FRANCHISER → **403**);
> rol-exports (`/verplichtingen/export`, `/prognose/export`, `/api/admin/export/invoices`,
> `/api/samenwerkingen/<vreemd>/dba-dossier`) → **403**; XSS in query-params → **0 scriptuitvoering**;
> onbekende routes → echte 404. **Mutatie-laag:** `/api/tasks/*` zonder/met-fout-Bearer → **503/401**
> (geen uitvoering, timing-safe `authorizeCron`); `/api/push/subscribe` zonder sessie → 307→login.
>
> ### DEFECT (functioneel, GEFIXT deze run) — betaal-webhook geredirect naar /login
>
> - **Repro:** `POST /api/billing/webhook` zónder sessie-cookie (zoals een echte Mollie-ping) →
>   **HTTP 307 → `/login`**. De webhook-handler draaide nooit.
> - **Geschonden regel:** correctheid van de betaal-cascade. `isPublicPath` allowlist bevatte
>   `/api/tasks/` en `/api/auth` (eigen guard, geen sessie) maar **niet** `/api/billing/webhook`,
>   terwijl een provider-webhook per definitie geen sessie meedraagt.
> - **Impact (latent):** zodra Mollie/billing live gaat, zou een `paid`-ping naar `/login` worden
>   geredirect → `SUBSCRIPTION_ACTIVATED` zou nooit vuren (betaalde abonnementen activeren niet) en een
>   `failed`-ping zou `PAST_DUE` nooit zetten. Nu inert (billing default-uit), dus geen productie-impact
>   vandaag, maar een gegarandeerde breuk bij go-live.
> - **Fix:** exact-match `pathname === "/api/billing/webhook"` toegevoegd aan `isPublicPath`
>   (`src/lib/route-guards.ts`). Veilig om publiek te zijn: de handler vertrouwt de request-body nooit
>   blind — hij haalt de betaalstatus opnieuw op bij de provider (bron van waarheid), muteert alleen op
>   provider-bevestigd `paid`/`failed`, en antwoordt altijd 200 zonder data te lekken (zelfde patroon
>   als `/api/tasks/`). Exact-match houdt `/api/billing` en `/api/billing/webhook/extra` beschermd.
> - **Bewijs:** na de fix + herbouw geeft `POST /api/billing/webhook` (geen sessie) **200 "ok"**, terwijl
>   `/api/account/export`, `/api/billing/webhook/extra` en `/dashboard` 307→login blijven. +1 unit-test in
>   `route-guards.test.ts` (rood→groen). Gate: typecheck + lint + test (2766) + build + prettier groen.
>
> ---
>
> **Datum:** 2026-06-25 (run 4) · **main-commit basis:** `e457d25`
> **Methode:** verse productie-build (`npm install` → `npm run build`) + schema-push (`prisma db push`) +
> idempotente demo-seed (`SEED_DEMO=true`) op een ephemere SQLite-DB (`qa.db`); productie-server
> (`CI=true PORT=3100 npm run start`, `LOGIN_RATE_LIMIT/REGISTER_RATE_LIMIT=100000`,
> `STORAGE_DRIVER=local`, `AUTH_SECRET=ci-dummy-…`). Playwright met de vooraf-geïnstalleerde Chromium
> (`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, expliciete `executablePath`), de **vier rollen
> parallel** in losse browser-contexts. Per rol ingelogd via het echte login-formulier (`demo1234`).
> Doel-1 (acties), 1b (next-actions) en 2 (adversarieel). De DB is ephemeer; geen poging raakte productie.
>
> ## Samenvatting — GEEN GATEN GEVONDEN (4e opeenvolgende schone run)
>
> **Alle vier rollen + de cascade-, authz- en tenant-poorten houden stand op `e457d25`.** Geen nieuwe
> regressies sinds run 3 (de toen-bevestigde poorten — int-overflow-guard `MAX_PERFORMANCE_HOURS`,
> soft-404 ADR-0009, document-privacy — staan nog).
>
> **DOEL 1 (werkt + échte actie uitgevoerd):** 56 kernschermen over 4 rollen laadden HTTP 200, correcte
> `<h1>`, nul 500's/crashes. Alle 4 logins (Sanne / Mark Jansen / Femke Franchise / Admin Beheerder)
> slaagden via het echte formulier. **Echte mutatie tegen de DB geverifieerd:** ADMIN keurt een
> verificatie goed via de "Goedkeuren"-knop op `/admin/verificaties` → wachtrij **6→5**
> (knoptelling én `Credential.status=SUBMITTED`-count), `CREDENTIAL_VERIFIED`-audit geschreven (0→1,
> `actorId`=admin, `entityId`=`cred-bram-VOG`), `verifiedAt` gezet, en de UI revalideerde (de tegel
> verdween direct). De goedkeur-schrijfketen werkt dus end-to-end op de actuele `main`.
>
> **DOEL 1b (next-action-engine):** `/acties` per rol geladen (200) + de engine kruis-gecheckt tegen
> `next-actions.ts` / `actions/pending-tasks.ts` / `cascade/stage.ts`: pure, deterministische logica met
> rol-geïsoleerde prioriteitsbanden, ownership-/tenant-gescopete queries (geen N+1, `take`-begrensd) en
> handoff-correcte fasering (contract → uren → goedkeuring → factuur → goedkeuring → betaald). De
> credential-goedkeuring hierboven liet de handoff in de praktijk zien: na de actie verdween de
> admin-taak uit de wachtrij (revalidatie). Geen tegenstrijdige, dubbele of niet-verdwijnende actie
> aangetroffen.
>
> **DOEL 2 (adversarieel — 101 probes, alle correct geweigerd):**
>
> - **Privilege-escalatie:** FREELANCER/CLIENT/FRANCHISER → rol-vreemde routes (`/admin/*`,
>   `/kandidaten`, `/certificaten`, `/franchise/*`) → redirect naar het eigen rol-dashboard. De
>   boekhouding-aliassen FREELANCER→`/verplichtingen` (CLIENT-route) en CLIENT→`/prognose`
>   (FREELANCER-route) **redirecten beide naar het rol-eigen `/administratie` ("Boekhouding")** —
>   geverifieerd met een settle-wait + raw-fetch; géén cross-rol-data. (Een eerdere meting toonde door
>   een te-vroeg afgelezen `finalPath` schijnbaar "geen redirect"; settle-verificatie bevestigt de
>   redirect — meetartefact, geen platformregressie.)
> - **IDOR/cross-partij:** FREELANCER/CLIENT/FRANCHISER → andermans `/samenwerkingen/<vreemd>`,
>   `/facturen/<vreemd, SUBMITTED>`, onzin-id's → **"Niet gevonden — geen toegang"** (soft-404,
>   `len≈137`), geen veldlek. Een legitieme partij ziet zijn eigen factuur wél (collab-1 factuur
>   `2026-0001`: zowel uitschrijver Sanne als tegenpartij Mark — correct, geen IDOR; tegen de DB
>   geverifieerd dat beide partij zijn).
> - **Cross-tenant:** FRANCHISER (Noord) → default-tenant `/samenwerkingen/<x>` + `/franchise/zzpers/<Sanne>`
>   → "Niet gevonden"; CLIENT → `/zzp/onzin` → **echte 404**.
> - **Document-privacy (geauth. in-page fetch):** eigenaar (Sanne) → `GET /api/documents/<eigen>` →
>   **200 `application/pdf`** (`%PDF-1.7…`); niet-eigenaar (CLIENT, FRANCHISER, andere FREELANCER) →
>   **403** `{"error":"Geen toegang."}`.
> - **Authz-keten / rol-export:** FREELANCER → `/verplichtingen/export` **403**, `/prognose/export`
>   (CLIENT) **403**, `/api/admin/export/invoices` **403** ("vereist rol ADMIN"),
>   `/api/samenwerkingen/<vreemd>/dba-dossier` **403**.
> - **Malicieuze input:** `<script>`/`<img onerror>`/`' OR 1=1--` in query-params (`/facturen`,
>   `/reacties`, `/rooster`, `/opdrachten`, `/admin/*?q=`) → **0 scriptuitvoering** (`window.__x`
>   ongezet), ongeldige filters genegeerd (Prisma geparametriseerd, enums gevalideerd).
> - **Robuustheid:** volledig onbekende routes (`/this-route-does-not-exist`,
>   `/admin/this-admin-route-nope`) → **echte 404**; **0 HTTP-500's, 0 crash-/Prisma-markers** over alle
>   101 probes.
>
> Code-niveau bevestigd (naast de live-probes): de cascade-mutaties (`performance-commands.ts` e.a.)
> dragen de ownership-keten (`actor.id` vs. `freelancer.userId`/`clientUserId`, ADMIN-uitzondering);
> de document-route auditeert zowel toegestane als geweigerde toegang met sandbox-CSP. Geen
> codewijziging nodig; deze run is een backlog-/PROGRESS-update.
>
> ---
>
> **Datum:** 2026-06-24 (run 3) · **main-commit basis:** `c6736b8`
> **Methode:** verse productie-build (`npm install` → `npm run build`) + schema-push + idempotente
> demo-seed (`SEED_DEMO=true`) op een ephemere SQLite-DB (`qa.db`); productie-server
> (`CI=true PORT=3100 npm run start`, `LOGIN_RATE_LIMIT/REGISTER_RATE_LIMIT=100000`,
> `STORAGE_DRIVER=local`, `AUTH_SECRET=ci-dummy-…`). Playwright met de vooraf-geïnstalleerde Chromium
> (`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, expliciete `executablePath`). Per rol
> ingelogd via het echte login-formulier (wachtwoord `demo1234`). DOEL 1 (acties uitvoeren), 1b
> (next-action-engine) en 2 (adversarieel). De DB is ephemeer; geen poging raakte productie.
>
> ## Samenvatting — GEEN GATEN GEVONDEN
>
> **Alle vier rollen + de cascade- en authz-poorten houden stand op `c6736b8`.** Geen nieuwe
> regressies sinds run 2; de toen-opgeloste int-overflow-guard staat nog (`MAX_PERFORMANCE_HOURS`).
>
> **DOEL 1 (werkt + echte acties):** 54 kernschermen over 4 rollen laadden HTTP 200, juiste `<h1>`,
> nul 500's/crashes/redirect-weg-van-toegestaan. Échte mutaties uitgevoerd en tegen de DB
> geverifieerd:
>
> - **ADMIN keurt verificatie goed** → wachtrij 6→5, `CREDENTIAL_VERIFIED`-audit, notificatie
>   "Certificaat goedgekeurd" naar de ZZP'er; de `/acties`-tegel verdween.
> - **CLIENT keurt ingediende prestatie goed** (cascade B2) → `Performance` SUBMITTED→APPROVED,
>   `PERFORMANCE_APPROVED`-audit, **automatisch een concept-factuur** (DRAFT, €1703,68) +
>   `INVOICE_DRAFT_READY`-notificatie. Bedrag/BTW kloppen.
>
> **DOEL 1b (next-action-engine):** `/acties` per rol kruis-gecheckt tegen
> `pending-tasks.ts`/`cascade/stage.ts`. De acties klopten met de echte status; na de
> prestatie-goedkeuring verdween de CLIENT-goedkeurtaak en kwam de FREELANCER "aan zet" voor de
> factuur (correcte handoff). De **lege FRANCHISER-actielijst is correct** — tegen de DB bevestigd:
> 0 due leads (de enige WARM-lead heeft een follow-up in de toekomst) en 0 (bijna-)verlopende
> tenant-certificaten.
>
> **DOEL 2 (adversarieel):** alle pogingen correct geweigerd, nul 500's/leaks/scriptuitvoering.
>
> - **Privilege-escalatie:** FREELANCER/CLIENT/FRANCHISER → rol-vreemde routes (`/admin/*`,
>   `/kandidaten`, `/certificaten`, `/franchise/*`) → redirect naar `/dashboard`.
> - **IDOR/cross-partij:** FREELANCER → andermans `/samenwerkingen/<id>` + `/facturen/<id>` →
>   "Niet gevonden — geen toegang" (soft-404, ADR-0009), geen veldlek.
> - **Cross-tenant:** FRANCHISER (Noord) → default-tenant `/franchise/zzpers/<Sanne>` +
>   `/franchise/opdrachtgevers/<Mark>` → "Niet gevonden"; CLIENT → cross-tenant `/zzp/<Lars>` →
>   **echte 404**.
> - **Document-privacy:** niet-eigenaar (CLIENT + FRANCHISER) → `GET /api/documents/<Sanne>` →
>   **403** `{"error":"Geen toegang."}`; eigenaar → **200 `application/pdf`**.
> - **Authz-keten/rol-export:** FREELANCER → `/verplichtingen/export` **403**,
>   `/api/admin/export/invoices` **403**, `/api/samenwerkingen/<vreemd>/dba-dossier` **403**;
>   CLIENT → `/prognose/export` **403**.
> - **Malicieuze input:** `/facturen?status=<script>…` genegeerd, geen scriptuitvoering
>   (`window.__x` ongezet); `'OR 1=1--`-filter genegeerd (Prisma geparametriseerd).
>
> Bewijs: `docs/persona-sweep-2026-06-24/` (run-2 artefacts blijven leidend) + de live verificatie
> hierboven tegen de seed-DB. Geen codewijziging nodig; deze run is een docs-/backlog-update.
>
> ---
>
> **Datum:** 2026-06-24 (run 2) · **main-commit basis:** `70cf3b6`
> **Methode:** verse productie-build + schema-push + idempotente demo-seed (`SEED_DEMO=true`) op een
> ephemere SQLite-DB (`qa.db`); productie-server (`CI=true npm run start`, poort 3100). Echte
> doorklik-/actie-flows met Playwright/Chromium per rol (wachtwoord `demo1234`), plus DB-verificatie
> van elke statusovergang. DOEL 1 (acties uitvoeren), 1b (next-action-engine) en 2 (adversarieel).
>
> ## OPGELOST in deze run — int-overflow bij prestatie-goedkeuring (HOOG: 500-crash)
>
> **Gat (gevonden + gefixt):** een ZZP'er kon een prestatie met absurd veel uren indienen (browser-
> `max` omzeild via geknutselde POST); het uren-/bedragveld had geen **server-side** bovengrens. Bij
> goedkeuring overschreed het afgeleide `Invoice.totalCents` (int4) de kolomgrens → `prisma.invoice
.create()` faalde → **HTTP 500-crashpagina** op de goedkeuractie van de opdrachtgever
> (reproduceerbaar: 999.999 u × €88 + BTW = 10.647.989.352 cent). Schending CLAUDE.md regel 1 +
> DOEL-2 (absurde input → weigeren, nooit 500).
> **Fix:** `MAX_PERFORMANCE_HOURS=1000` + `MAX_MILESTONE_CENTS=€1 mln` in `validatePerformanceForm`
> (form-UX) én een harde `assertPerformanceWithinLimits`-guard in `createPerformance`/
> `updatePerformance` (dekt óók de CSV-diensten-import die het formulier omzeilt). +4 unit-tests.
> **Overige doelen groen:** verificatie-goedkeuring (queue 6→5 + audit), prestatie-goedkeuring →
> concept-factuur, next-action-handoff klopt (ZZP'er krijgt "factuur indienen", opdrachtgever-actie
> verdwijnt), IDOR/cross-collab → "Niet gevonden", priv-esc → redirect, doc-API → 404 JSON, negatieve
> uren → server-side geweigerd. Geen verdere gaten.

---

> **Datum:** 2026-06-24 · **main-commit:** `37357e6` (37357e67ba45cd7304486acf8030b1469b394888)
> **Methode:** verse `npm install` (de container miste opnieuw een runtime-module bij de eerste build) →
> productie-build (`npm run build`) + schema-push + idempotente demo-seed (`SEED_DEMO=true`) op een
> ephemere SQLite-DB (`qa.db`); productie-server (`CI=true npm run start`, poort 3100) met
> `LOGIN_RATE_LIMIT/REGISTER_RATE_LIMIT=100000`, `STORAGE_DRIVER=local`,
> `AUTH_SECRET=ci-dummy-secret-…`. Playwright met de vooraf-geïnstalleerde Chromium
> (`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, expliciete `executablePath`) — per rol
> ingelogd (wachtwoord `demo1234`) via het echte login-formulier. Per pad vastgelegd: **HTTP-status**,
> **eind-URL** (detecteert redirects), **`<h1>`** en de gerenderde `main`-tekst (detecteert leak vs.
> weigering) + crash-markers over de `main`-tekst. De adversariële API-paden zijn met een
> **geauthenticeerde in-page `fetch(..., {redirect:"manual"})`** uitgelezen (echte status, content-type
> en body-magic), niet via een ongeauthenticeerde request-context. De XSS-payloads zijn náást
> statuscontrole ook op **scriptuitvoering** (`window.__x`), **levende `<img onerror>`-elementen** én
> **rauwe reflectie in de HTML** gecontroleerd. Cross-party/-tenant-eigendom is tegen de seed-DB
> geverifieerd (IDs uitgelezen via Prisma, niet uit de UI geraden — zie `ids.json`). DOEL 1 is naast
> page-load óók op **actie-affordances** getoetst (knoppen/next-actions echt aanwezig + juiste aantallen).
> De DB is ephemeer; geen enkele poging raakte productie.
> Bewijs: `docs/persona-sweep-2026-06-24/` (4 rol-dashboard-screenshots + `results.json` met de
> volledige padmatrix: **52 functionele** + **29 adversariële UI** probes, `api-results.json` met de
> **9 geauthenticeerde adversariële API**-probes, en `ids.json`).
> Accounts: FREELANCER `zzp@` (Sanne de Vries), CLIENT `opdrachtgever@` (Mark Jansen / Zorgcentrum
> Jansen), ADMIN `admin@zzp-platform.local` (Admin Beheerder), FRANCHISER `franchise@zzp-platform.local`
> (Femke / tenant "Zorgbemiddeling Noord").

Twee doelen per run: **(1) werkt het** per rol, en **(2) stress/adversarieel** — bewust proberen
wat NIET mag (privilege-escalatie, IDOR/cross-tenant, authz-keten omzeilen, verboden
statusovergangen, malicieuze input, robuustheid). Verwacht bij doel 2: altijd geweigerd
(404/403/redirect/Zod-fout/notFound), nooit een 500/crashpagina of stille toegang.

## Opgelost / gewijzigd sinds de vorige sweep (2026-06-23)

- **Geen nieuwe regressies; alle eerder bevestigde poorten houden stand.** De vorige sweep (23-6,
  commit `0f0dba0`) vond geen gaten. Deze run draaide tegen `37357e6` (na o.a. de berichten-/i18n-merges
  t/m #508) en herbevestigt de isolatie-, authz- en robuustheidspoorten op de actuele `main`.
- **Nieuwe/uitgebreide oppervlakken sinds de vorige sweep mee-geprobed:** het berichten-/inbox-scherm
  (`/berichten`) is voor FREELANCER én CLIENT meegenomen in de functionele matrix, plus de
  CLIENT-`/freelancers`-browse. Alle laadden met echte inhoud (HTTP 200, correcte `<h1>`).
- **Methodische verbetering t.o.v. eerdere runs:** de adversariële API-poorten zijn nu met een
  **geauthenticeerde** in-page `fetch` (met `redirect:"manual"`) gemeten. Een eerdere meting met een
  request-context die de sessiecookie niet meestuurde, las verwarrend "200 HTML" (de gevolgde
  login-redirect) terug; met de cookie-dragende fetch tonen alle poorten hun échte status — **403
  JSON** voor elke verboden toegang en **200 `application/pdf`** alleen voor de eigenaar. Dit is een
  meetfout in een vorige harness, geen platformregressie.
- **Operationele noot (geen platformdefect):** de eerste productie-build faalde op een ontbrekende
  runtime-module; opgelost met `npm install` vóór de build (omgevings-/container-artefact, raakt de
  code niet). Identiek aan de noten van 21-6 t/m 23-6.

## Samenvatting

**Geen gaten gevonden in deze run.** Alle vier rollen laden hun kernschermen met echte inhoud (alle
HTTP 200, geen 500's, geen crashpagina's, geen Prisma-/stacktrace-markers). Alle pogingen tot
**privilege-escalatie**, **IDOR/cross-partij**, **cross-tenant**-toegang, **authz-keten omzeilen**,
**malicieuze input** en **robuustheid** werden correct geweigerd; geen enkel privé-document, vreemde
factuur, samenwerking, profiel of dossier werd zichtbaar.

- **Sectie A — functionele defecten:** **geen** blokkerende of niet-blokkerende defecten. 52
  kernschermen + filter-/detailroutes over 4 rollen: alle 200, inhoud rendert (steekproef-`<h1>` +
  `main`-tekst bevestigen de doelpagina) én de kern-actie-affordances zijn aanwezig met juiste
  aantallen (zie A). Eén lage observatie (protected soft-404 → HTTP 200) blijft GEACCEPTEERD via
  ADR-0009, geen actie.
- **Sectie B — beveiligings-/robuustheidsgaten:** **geen gaten.** Adversariële paden (UI + API): alle
  geweigerd (redirect/403/404/notFound), nul 500's, nul leaks, nul crashpagina's, **nul
  scriptuitvoering**. De twee `rawScript`-vlaggen uit het UI-detectiescript zijn **vals-positieven** —
  bevestigd geëscapet (zie sectie B, "Malicieuze input").

---

## A. Werkt niet zoals het hoort (functionele defecten — doel 1)

Per rol de kernschermen én -detailroutes doorlopen; alle gaven HTTP 200 met echte inhoud, geen 500's,
geen crashpagina's, geen redirect-away van een toegestane pagina.

| Rol        | Geteste schermen (allemaal 200, inhoud rendert)                                                                                                                                                                                                                                                   | Resultaat |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| FREELANCER | dashboard, certificaten, opdrachten, opdracht-detail (`job-1`), samenwerkingen, samenwerking-detail (`collab-1`), prestaties, facturen, diensten, rooster, inzicht, prognose, profiel/bewerken, documenten, notificaties, reacties, opgeslagen, berichten, verplichtingen→redirect, administratie | 20/20 OK  |
| CLIENT     | dashboard, opdrachten, opdrachten/nieuw, opdracht-detail (`job-1`), kandidaten, prestaties, facturen, verplichtingen, samenwerkingen, bedrijf, inzicht, administratie, freelancers, berichten                                                                                                     | 14/14 OK  |
| ADMIN      | verificaties, disputen, statistieken, no-shows, dba, gebruikers, facturatie, samenwerkingen, support, audit, configuratie, import                                                                                                                                                                 | 12/12 OK  |
| FRANCHISER | opdrachtgevers, zzpers, diensten, samenwerkingen, leads, facturatie                                                                                                                                                                                                                               | 6/6 OK    |

Steekproef-`<h1>` per scherm bevestigt dat de echte doelpagina rendert: FREELANCER-dashboard
`h1="Sanne de Vries"`, opdracht-detail `h1="Verpleegkundige (somatiek)"`, samenwerking-detail
`h1="Verpleegkundige (detachering)"`, inkomstenprognose `h1="Inkomstenprognose"`; CLIENT-kandidaten
`h1="Kandidaten"`, verplichtingen `h1="Betaalverplichtingen"`, bedrijf `h1="Zorgcentrum Jansen"`;
ADMIN `h1="Platform statistieken"` / `h1="DBA-monitor"` / `h1="Audit log"`; FRANCHISER
`h1="Opdrachtgevers"` / `h1="ZZP'ers"`.

**Actie-affordances (geen dode knoppen, juiste aantallen):** FREELANCER `/certificaten` → "Nieuw
certificaat" (1), `/documenten` → "Document uploaden" (1); CLIENT `/opdrachten` → "Nieuwe opdracht"
(1), `/kandidaten` → "Shortlist" (10) + "Afwijzen" (5); ADMIN `/admin/verificaties` → "Goedkeuren"
(6) + "Afwijzen" (6) — exact gelijk aan de 6 items in de wachtrij; FRANCHISER `/franchise/zzpers` →
"Nieuwe ZZP'er toevoegen" (1). De next-actions zijn aanwezig en passen bij de status van het scherm.
Bewijs: `freelancer-dashboard.png`, `client-dashboard.png`, `admin-dashboard.png`,
`franchiser-dashboard.png` + de volledige padmatrix in `results.json`.

**Geen functionele defecten gevonden.** Eén lage observatie (geen actie):

- **A1 — protected soft-404 geeft HTTP 200 i.p.v. 404 (GEACCEPTEERD, ADR-0009).** Detailroutes met
  een onbekend/vreemd/cross-partij/cross-tenant id (`/samenwerkingen/<x>`, `/facturen/<x>`,
  `/opdrachten/<x>`, `/franchise/.../<x>`) renderen een nette **"Niet gevonden — Dit item bestaat
  niet (meer) of je hebt er geen toegang toe"**-staat binnen de app-layout, met **HTTP 200**. De
  root-`not-found` (volledig onbekende route, bv. `/this-route-does-not-exist` of
  `/admin/this-admin-route-nope`) geeft wél een **echte 404**, net als cross-tenant tenant-gebonden
  profielen via `/zzp/[id]` (404). Semantisch zou 404 zuiverder zijn voor de detail-soft-404's, maar
  er lekt geen data en de toegang wordt geweigerd — bewust geaccepteerd (zie
  `docs/decisions/0009-soft-404-auth-routes.md`).

---

## B. Beveiligings-/robuustheidsgaten (doel 2)

**Geen gaten gevonden in deze run.** Onderstaand wat is geprobeerd en het (correcte) resultaat.

### Privilege-escalatie — alle geweigerd (redirect → `/dashboard`)

10 van 10 priv-esc-pogingen redirecten naar het eigen rol-dashboard; geen rol-vreemde pagina rendert.

| Poging                                                             | Resultaat                                           |
| ------------------------------------------------------------------ | --------------------------------------------------- |
| FREELANCER → `/admin/verificaties`, `/admin/gebruikers`            | redirect → `/dashboard` (200, h1 "Sanne de Vries")  |
| FREELANCER → `/kandidaten` (CLIENT), `/franchise/opdrachtgevers`   | redirect → `/dashboard` (200)                       |
| CLIENT → `/admin/no-shows`, `/certificaten`, `/franchise/zzpers`   | redirect → `/dashboard` (200, h1 "Mark Jansen")     |
| FRANCHISER → `/admin/verificaties`, `/certificaten`, `/kandidaten` | redirect → `/dashboard` (200, h1 "Femke Franchise") |

Geen enkele rol-vreemde pagina rendert; geen `AuthorizationError`/markers in de output. De
FREELANCER → `/verplichtingen` (een CLIENT-route) redirect correct naar `/administratie` (rol-gepaste
boekhouding) — geen rol-vreemde render.

### IDOR / cross-partij — alle geweigerd, geen leak

- FREELANCER (Sanne) → `/samenwerkingen/<Emma's collab>` en `/facturen/<vreemde factuur, PAID>` →
  **"Niet gevonden — geen toegang"** (alleen de not-found-tekst in `main`, geen enkel veld van de
  andere partij).
- CLIENT (Mark) → dezelfde vreemde collab/factuur → idem geweigerd, geen leak.
- FREELANCER → `/opdrachten/job-7` (een **DRAFT**-opdracht van Zorgcentrum Jansen) → "Niet gevonden"
  (concepten zijn niet zichtbaar voor anderen).
- Onzin-id's op detailroutes (`/samenwerkingen/onzin-id-xyz`, `/facturen/does-not-exist-123`,
  `/opdrachten/nope-9999`) → "Niet gevonden", geen 500.

### Cross-tenant — alle geweigerd, geen leak

- FRANCHISER (Noord) → `/franchise/opdrachtgevers/<default-tenant companyId Zorgcentrum Jansen>` en
  `/franchise/zzpers/<default-tenant profileId Sanne>` → **"Niet gevonden — geen toegang"**, terwijl de
  eigen-tenant-overzichten (Opdrachtgevers / ZZP'ers) wél volledig renderen. Het verschil is de
  `tenantScopeWhere(actor)`-poort, niet een mismatchend id (de detailroutes nemen een _company-id_
  resp. _profile-id_, uitgelezen uit de echte seed-DB — zie `ids.json`).
- CLIENT (default-tenant) → `/zzp/<Noord-gebonden profileId Lars Bakker>` → **echte 404**
  (`tenantEntityVisibleTo` weigert cross-tenant tenant-gebonden profielen).

### Document-privacy — correct (geauthenticeerde API-route)

- Niet-eigenaar (CLIENT én FRANCHISER) → `GET /api/documents/<Sanne's doc>` → **403**
  `{"error":"Geen toegang."}`; andere FREELANCER → `GET /api/documents/<Emma's doc>` → **403**.
- Eigenaar (Sanne) → `GET /api/documents/<eigen doc>` → **200** `application/pdf` (`%PDF-1.7…`).

### Authz-keten omzeilen / verboden mutatie (API-route)

- De cross-partij/cross-tenant detailpagina's weigeren al op leesniveau ("Niet gevonden"), zodat de
  mutatie-knoppen (uren/factuur goedkeuren/afkeuren, betaling markeren) nooit worden gerenderd voor een
  niet-eigenaar.
- **DBA-dossier-export van een vreemde samenwerking:** FREELANCER én CLIENT → `GET
/api/samenwerkingen/<Emma's collab>/dba-dossier` → **403** `{"error":"Geen toegang."}` (de
  ownership-poort zit óók op de API-route).
- **Rolvreemde CSV-export:** FREELANCER → `GET /verplichtingen/export` (CLIENT-route) → **403**
  `{"error":"Niet toegestaan"}`; CLIENT → `GET /prognose/export` (FREELANCER-route) → **403**;
  FREELANCER → `GET /api/admin/export/invoices` (ADMIN-route) → **403** "Geen toegang: vereist rol
  ADMIN." De rol-poort zit op de exportroutes zelf, niet alleen op de UI-knop.

### Malicieuze / ongeldige input — server-side geweigerd, geen XSS

Tegen de query-parameter-oppervlakken (statusfilters, admin-zoek, rooster-matchfilter):

- `/facturen?status=<script>window.__x=1</script>` (FREELANCER) → **200**, de ongeldige status wordt
  genegeerd; **geen scriptuitvoering** (`window.__x === false`), geen rauwe `<script>` in de HTML.
- `/reacties?status=' OR 1=1--` (FREELANCER) → **200**, pagina rendert normaal (Prisma is
  geparametriseerd; de string is geen geldige enum → genegeerd).
- `/opdrachten?status=<script>…` (CLIENT) → **200**, ongeldige filter genegeerd, geen uitvoering.
- `/rooster?match=<img src=x onerror=window.__x=1>` (FREELANCER) → **200**, geen scriptuitvoering,
  **0 levende `<img onerror>`-elementen**. Het detectiescript markeerde "raw" omdat de substring in de
  HTML voorkwam, maar bij inspectie staat de payload uitsluitend in de **RSC-payload** als
  URL-encoded string (`rooster?match=%3Cimg+src%3Dx+onerror%3Dwindow.__x%3D1%3E`) — geen levend tag,
  dus vals-positief.
- `/admin/samenwerkingen?q=<script>…` en `/admin/gebruikers?q='><img … onerror=…>` (ADMIN) → **200**,
  geen uitvoering, **0 levende `<img onerror>`-elementen**. De `/admin/gebruikers`-reflectie staat in
  de waarde van het zoek-`input` correct geëscapet: `value="'&gt;&lt;img src=x onerror=window.__x=1&gt;"`
  — de `<`/`>` zijn `&lt;`/`&gt;`, dus de payload kan niet uit het attribuut breken. React escapet de
  reflectie; ook hier vals-positief op de substring.

(De diepere `/profiel/bewerken`-input-injectie — negatief tarief, lange XSS-`headline` — werd in een
eerdere sweep tegen de DB geverifieerd als **niet gepersisteerd**; ongewijzigd op `main`.)

### Robuustheid — geen 500's

- Onzin-id's op detailroutes → "Niet gevonden" soft-404 (200, zie A1); volledig onbekende routes
  (`/this-route-does-not-exist`, `/admin/this-admin-route-nope`) → **echte 404**.
- **Over de hele run: 0 HTTP-500's en 0 crash-/Prisma-markers** (90 probes: 52 functioneel + 29
  adversarieel UI + 9 adversarieel API). De `serverErrors`-teller in `results.json` staat op `2`,
  uitsluitend door twee vals-positieve substring-vlaggen: de crash-regex matchte het woord **"stack"**
  binnen de functietitel **"Fullstack Developer"** op `/freelancers` en `/admin/samenwerkingen` —
  beide pagina's renderden volledig (2968 resp. 1765 tekens, correcte `<h1>`), er was geen 500 en geen
  scriptuitvoering.
