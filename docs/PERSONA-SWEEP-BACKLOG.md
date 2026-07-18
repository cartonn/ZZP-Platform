# Persona-sweep — gaten-backlog

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
> **GEPARKEERD — LAAG (UX, geen beveiligingsgat — `frozen` dekt CANCELLED niet):** de
> samenwerking-detailpagina (`samenwerkingen/[id]/page.tsx`) leidt `frozen` alleen af uit `disputedAt`,
> niet uit `status === "CANCELLED"`. Server-side is de waarheid nu dichtgezet (mutaties op een
> geannuleerde deal worden geweigerd), dus dit is puur cosmetisch — knoppen zonder actionabele lading.
> Netter: `frozen` ook op CANCELLED/COMPLETED zetten zodat de UI de bevroren staat toont. **LAAG.**
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
