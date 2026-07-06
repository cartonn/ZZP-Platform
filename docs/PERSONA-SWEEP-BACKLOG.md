# Persona-sweep — gaten-backlog

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
