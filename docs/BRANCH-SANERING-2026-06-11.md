# Branch-sanering 11-6-2026

Aanleiding: de nachtroutine werkte wekenlang op sessie-branches zonder PR (zie CLAUDE.md 3a,
toegevoegd in #317). Resultaat: 113 stale `claude/*`-branches. Alle thema's zijn functioneel
tegen main geverifieerd (drie parallelle zoekagenten, 11-6-2026).

## Uitkomst

- **63 branches verwijderd** — inhoud aantoonbaar op main of duplicaat van gemergd werk
  (o.a. 12× weekrooster-varianten, 5× e-mailvoorkeuren-varianten waarvan de beste is geborgen
  in PR #318, modelovereenkomst, /search, heffingskortingen, loading-skeletons, file-input,
  platformfacturatie, audit-QW/T-branches). Sha's hieronder voor herstel.
- **50 branches bewaard** — uniek, nooit geland werk (bergingskandidaten hieronder).

## Bergings-backlog (geverifieerd NIET of DEELS op main)

Hoogste prioriteit eerst (correctheid/geld/compliance → UX → nice-to-have):

1. [x] **Afronden-rem** — samenwerking kan COMPLETED worden met open facturen/geld. **Geborgen 11-6
       (ZZP2-160, branch `claude/dazzling-carson-v9Qwk`):** pure `cascade/completion.ts`
       (`hasOpenCollaborationWork`) + guard in de cascade-handler; rondt alleen af als deze betaling het
       laatste openstaande werk afsluit. **Afgemaakt (ZZP2-163):** ook het HANDMATIGE pad
       (`changeCollaborationStatus → COMPLETED`) weigert nu afronden bij open geld/onbeoordeeld werk, en
       `/samenwerkingen` toont de reden i.p.v. een dode "Markeer als afgerond"-knop
       (`completionBlockReason`). _(geld-correctheid — volledig gedicht)_
2. [x] **CSV formule-injectie-hardening** — `escapeCsvField` escapet geen `=+-@`-prefixen.
       **Geborgen 11-6 (ZZP2-161, branch `claude/dazzling-carson-v9Qwk`):** voorloopse apostrof voor
       gevaarlijke starttekens in `src/lib/csv.ts` (gewone negatieve getallen uitgezonderd), +12 tests;
       beschermt alle exports via de centrale module. _(security, klein)_
3. [x] **Rol-fallback boekhouding** — `/administratie` viel voor ADMIN/FRANCHISER stil terug op
       FREELANCER → misleidend leeg ZZP-grootboek. **Gedaan (ZZP2-162, branch
       `claude/dazzling-carson-v9Qwk`):** pure `administrationPartyForRole` (ADMIN/FRANCHISER→null)
   - nette empty-state met doorverwijzing. (Was `epic-lovelace-szz2a3`.)
4. **AVG-verwerkingsregister + bewaartermijnen** (`/admin/avg`) — pre-launch-compliance.
   Branches: `epic-lovelace-J4fj9`, `-PKJLj`.
5. **KvK-/BTW-formaatvalidatie** — velden bestaan, geen format-/regexcheck. Branch: `-0jOnC`.
6. **Beschikbaarheidsconflicten** (dubbele boeking) — branch `-wtK4l`.
7. **CLIENT-dashboard "Wat kan ik oppakken"** (WORKSPACE_OVERHAUL Fase 3-rest) — suggesties
   voor de opdrachtgever; `suggestions.ts` bestaat al. Branches: `-q8l8W`, `-Laagg`, `-nrzrs0`.
8. **Tweezijdige beoordelingen** na samenwerking — branches `-h9Dfw`, `-hLFwd`, `-Ym6ng`.
9. **Agenda-export iCal (.ics)** — branches `-6me9m`, `-Vv26O`, `-UV5P7`, `-zg2s6n`.
10. **Dispuut-triage-prioriteit** op /admin/disputen — branch `-SJmv0`.
11. **Financiële inkomstenprognose** (EUR; urenprognose bestaat) — branch `-7wDjk`.
12. **Factuur-CSV-export per gebruiker** — branch `-MLp7A`.
13. **Mailkanaal dispuut-/samenwerking-events** — branch `-cp9sl`.
14. **Ideeënbox duplicaatpreventie + admin-triage** — branches `-H3Sf4`, `-bwYao`.
15. **Academie ↔ vertrouwensniveau-koppeling** — branch `-DsBvj`.
16. **Lead-CSV-import franchise** — branch `-DdPcB`.
17. **Herplaatsing-bij-uitval** — branch `-ehh6vy`. **Helpdesk-loop** — `-NBs0D`.
    **Iter-6 correctheid-sweep** — `-8bgwcz`. **Warmte-paletten (ontwerpdocs)** —
    `gifted-ramanujan-4u3uk7`.
18. **Franchise-rest** (omzet-overzicht, roster-matching, samenwerking-/dienst-detail,
    statistieken, pijplijn, tenant-signalen, filters/exports) — branches `-wqFHF`, `-creEd`,
    `-z9RBc`, `-dB4UI`, `-nW7RF`, `-I3Gvj`, `-Bdq78`, `-8Qdyf`, `-Gdrji`, `-snivze`, `-U4nJm`,
    `-zE27a`, `-6pVih`, `-5yaa5i`, `-St0dP`, `-4iqM6`.
19. **Admin health-zone-consolidatie** (bewaking + statistieken zijn nu twee losse pagina's) —
    branches `-khY5v`, `-aDZkD`, `-tsaQY`, `-tgl3E`.

> Bergen = cherry-pick op verse branch vanaf actuele main + gates + PR (zoals #318); branches
> zijn 1–10 dagen oud, reken op conflicten met de huidige runners/pagina's.

# Branch-sanering 11-6-2026 — verwijderde branches + sha's

Herstel: `git fetch origin <sha>` + `git branch <naam> <sha>` (sha's blijven ~2 maanden op GitHub).

## Verwijderd (inhoud aantoonbaar op main of duplicaat van gemergd werk)

- `claude/audit-qw1-next-bump` → `f6f6d4563d0293fe8152733a8f9dcc282a440a30` — build(deps): next 15.5.19 + postcss-override — npm audit naar 0 (audit QW1)
- `claude/audit-qw3-lijst-cap` → `3a1171dd2ffba11e03d5ea1f85932614056d4679` — perf(lijsten): interim-cap take:100 op onbegrensde lijstqueries (audit QW3)
- `claude/audit-t2-apply-test` → `773b509a0d87cde6a5a1ad54f1c1e3b6293ab7ce` — test(cascade): transactietest voor applyCascadeEffects (audit T2)
- `claude/epic-lovelace-0ONia` → `b35e11afe063c1c5d7ca7794be1108857a111bc8` — docs: PROGRESS + backlog na weekoverzicht-rooster (Fase 6)
- `claude/epic-lovelace-0irXR` → `87b99ab5debc466141b1372b2b33b6b82eabb299` — docs: werk PROGRESS/CURRENT_TASK bij — workspace-overhaul Fase 6 geblokkeerd o
- `claude/epic-lovelace-1f55vb` → `7970cf60a0f6ff959dd4a1f90d370fa47f536680` — docs(loop): record iter-7 (cascade credit geld-bug + sweep backlog)
- `claude/epic-lovelace-2XzKv` → `22743da86da07fe390ff01b23ddbefcfbff9fdab` — docs: PROGRESS + backlog na notificatievoorkeuren (ZZP2-51)
- `claude/epic-lovelace-2fRim` → `55ac85373f7f91c602df7fb5df94d1af6467423b` — feat(notificaties): e-mailvoorkeuren per categorie (opt-out)
- `claude/epic-lovelace-2irdzt` → `87fc3754890d0056a7a9b5bba34e91dc0c8ca3f3` — docs: record iter-7 code-flow-hunt (ZZP2-146 samenwerking-afronden rem)
- `claude/epic-lovelace-6f6f0y` → `5718ecd6b40d91b7db3dc33448c0147e0325c829` — feat(ui): Nederlandse file-knop "Bestand kiezen" op alle uploadvelden
- `claude/epic-lovelace-6h3x69` → `52c74ab3ea5cf0c4dcb03f8def30c731136cdc35` — docs: log loading-skeletons-increment (ZZP2-130) in PROGRESS + backlog
- `claude/epic-lovelace-8gkmw4` → `877dc5c86645910f5e6b04b1572656891eeb71e3` — docs: PROGRESS + backlog — platform-omzet/btw-export (ZZP2-131) + vervolgkandi
- `claude/epic-lovelace-9701f8` → `ffa57d007051a753705cf68d6abff471610f6cd7` — docs: log platformfacturen-vervaldatum/herinnering (ZZP2-134)
- `claude/epic-lovelace-AaUhL` → `841735e038ac42769a32f57a06ef419dea3f2c65` — docs: log denied-access audit increment (ZZP2-71); drop stray conflict marker
- `claude/epic-lovelace-Bq3nA` → `aea8b4f09c98d729784cb838e2fb54d3fbbc37fa` — feat(week): navigeerbare weekoverzicht-pagina /week voor de ZZP'er
- `claude/epic-lovelace-Ci8ys` → `65969a84ea90986bf5c7e053e2650a63938336eb` — feat(samenwerking): per-dag weekrooster + dashboard-weekoverzicht (Fase 6)
- `claude/epic-lovelace-DXNe3` → `b8d55d4016f4ef731ba743c2f2d9df7d26d0e1e9` — docs: log hoofdletterongevoelig zoeken (ZZP2-110) + schoon merge-markers op
- `claude/epic-lovelace-DzF9l` → `27abccbf559dba1bfc80708aa6b962e3830b27c6` — feat(notificaties): e-mail opt-out per categorie (notificatie-instellingen)
- `claude/epic-lovelace-GkGyQ` → `5adc0503659290fba921ce3341309064e68172b8` — docs: WORKSPACE_OVERHAUL Fase 6 afgerond — weekrooster + memory bijgewerkt (ZZ
- `claude/epic-lovelace-I5ahe` → `54fa593a705e6a670609424a80384079389ce536` — feat(samenwerking): per-dag-weekrooster (ADR-0004)
- `claude/epic-lovelace-INXaS` → `59878fe531ba420aa08796611fbe9b253bfd07a0` — docs: PROGRESS + backlog na weekrooster (WORKSPACE_OVERHAUL fase 6)
- `claude/epic-lovelace-JLwQy` → `2c611558a79a35fb09f12ef15dbbeb3b4abdd72e` — docs: log ZZP2-117 (hoofdletterongevoelig zoeken) in PROGRESS + backlog
- `claude/epic-lovelace-JkJjD` → `f650f9d00040659e6696f451803452be9e82ef6f` — feat(dashboard): per-dag weekrooster op samenwerkingen (WORKSPACE_OVERHAUL Fase
- `claude/epic-lovelace-M5UkX` → `e6b9781efaabccb7d6207733ed2e4c619bfd873b` — docs: log DBA-export increment; clean leftover merge markers in PROGRESS
- `claude/epic-lovelace-Mmb8d` → `d10d26a4d5dcc73ac9d86b2948bb61fe0c54ca15` — docs: inzetbaarheid-status afgevinkt in PROGRESS + backlog (ZZP2-120)
- `claude/epic-lovelace-Mxv55` → `cdf0a637bf7eec8b7b4fe196e1c7feb67eceff7d` — docs: log voltooide-opleidingen-increment + ruim conflictmarkers in PROGRESS op
- `claude/epic-lovelace-NbiIg` → `5c03f1e18f6f57b566b4894cd5097bff1d24eb80` — docs: log heffingskortingen-increment + verwijder oude merge-markers in PROGRESS
- `claude/epic-lovelace-Qg567` → `49c3b1abe477d365cb6fcc9f65b355a216eee528` — feat(samenwerking): weekrooster per samenwerking (ma bij A, wo bij B)
- `claude/epic-lovelace-TzXy6` → `83a6bdf00c7853bb952246bb50c01c79715928a9` — docs: PROGRESS + backlog na /search-resultatenpagina; ruim merge-conflictmarkers
- `claude/epic-lovelace-U3y2q` → `52fccd8a298a275b3571b5ef2a61b56b62195a3d` — feat(ontzorgd): indirecte uren-registratie voor het urencriterium (1.225 uur)
- `claude/epic-lovelace-UYnrW` → `2f273e2b7c8484e331f18b36fe32b075d6ac4b09` — docs: log NL-pluralisatie-increment (ZZP2-87) in PROGRESS + backlog
- `claude/epic-lovelace-UjOBx` → `49a3239e0f2fe186e151c0838c444627e2febcf1` — feat(workspace): weekrooster per samenwerking — per-dag-planning (ADR-0004)
- `claude/epic-lovelace-V4Al7` → `08d40748d1cfabe831f213ade57b59a25c8d6e02` — docs: PROGRESS + backlog na hardening administratie/aangifte/support-tests
- `claude/epic-lovelace-Vmw2V` → `2144caddb9a22808410f08066160f410ec3b275b` — docs: log weekrooster-increment (ADR-0004) in PROGRESS + CURRENT_TASK
- `claude/epic-lovelace-Wzw2D` → `b96f424ab1960897b644fd5075a25490e3a3b4a7` — feat(dashboard): weekoverzicht-UI met groepering per opdrachtgever
- `claude/epic-lovelace-ZHAev` → `4052f403429a6a122e7baa9cc22bf69770a5eb83` — docs: PROGRESS + backlog bijgewerkt (ZZP2-57 samenwerkingen-CSV-export); stale c
- `claude/epic-lovelace-a0hrQ` → `e2bb81ab47a4fb4e9cbddec629a6013bcacf5c70` — feat(account): e-mailvoorkeuren — opt-out herinneringsmails per gebruiker
- `claude/epic-lovelace-aPMU6` → `5840296c4043a8ede41ebe49993a0bdaf15784dd` — docs: weekrooster (ADR-0004) — PROGRESS + backlog bijgewerkt (ZZP2-67)
- `claude/epic-lovelace-az8pkg` → `a2103b1edc0866df4e8f583379d06698981ee197` — fix(cascade): reversible administratie + atomic nummering + bewaking/escalatie (
- `claude/epic-lovelace-bJJ3w` → `2b0ddbddf4199cb8365dd427d7406924dcbf44bf` — docs: PROGRESS + backlog — Pidz-pariteit blok C (ZZP2-118)
- `claude/epic-lovelace-casPv` → `e26476d810bb634bbb5c87edb30ed18307d3ebaf` — test(config): regressie-anker BTW-regimetabel + opschoning PROGRESS-conflictmark
- `claude/epic-lovelace-cejXO` → `ee7aa51bdec32f66257ebe3240076f64459f3500` — docs: log heffingskortingen-increment (ZZP2-77)
- `claude/epic-lovelace-eUQWQ` → `9c44aa5e1d58a17cf2cd0b466b5db71ba1ef78f0` — docs: DBA-export increment in PROGRESS + backlog; ruim verweesde conflictmarkers
- `claude/epic-lovelace-f8m4S` → `3ec960d0dc2670673b6d3d340d8d674a31d7c075` — docs: PROGRESS + backlog — modelovereenkomst per samenwerking (ZZP2-44); ruim
- `claude/epic-lovelace-fs5rH` → `5ca6cf59de6e6b198e437f979ded5b8d7eac2c2a` — docs: PROGRESS + backlog na weekoverzicht-pagina (WORKSPACE_OVERHAUL Fase 6)
- `claude/epic-lovelace-gx1Y9` → `cab30c02c663c2f74cbc699e92eea28be9f6c115` — feat(samenwerking): echt dag-voor-dag weekrooster per samenwerking
- `claude/epic-lovelace-iHA6g` → `7992e33324e4092fed898048c05281baf49ac3ef` — docs: log admin samenwerkingen filter/sort increment (ZZP2-114)
- `claude/epic-lovelace-iItNj` → `de2fd2d856cd0d7f61c380511e032a530a3477c7` — docs: PROGRESS + CURRENT_TASK — weekrooster/per-dag-weekoverzicht (fase 6, ZZP
- `claude/epic-lovelace-iU133` → `ac8d7ce3707791e238f162e419c58bbaa59d808b` — docs: voortgang + backlog bijwerken (ZZP2-108 geld-/PDF-test-hardening)
- `claude/epic-lovelace-j84qo` → `2f4e7476e4af4612b114c5d86c60df4aa2d95e6b` — feat(notificaties): notificatievoorkeuren per categorie (in-app)
- `claude/epic-lovelace-leRW9` → `46bcb795e1e5b7fa07d2420b470092f2ff695727` — docs: weekrooster-increment in PROGRESS + backlog; fix stray conflict marker
- `claude/epic-lovelace-oAzot` → `353185d11cf1d732e3d962f8f046c50258492bc9` — feat(dashboard): weekrooster per dag ("ma bij A, wo bij B")
- `claude/epic-lovelace-pbzof7` → `798aedee14f85b8a9e11f1d240ef3b857b4686bf` — fix(geld): credit-van-betaald draait betaal-tegenboekingen terug + PAST_DUE-ladd
- `claude/epic-lovelace-pnartb` → `964a8ea5721ec561be1ac1d7e4f12819f042f9d2` — feat(dashboard): dag-voor-dag weekrooster ("ma bij A, wo bij B")
- `claude/epic-lovelace-q0n3u6` → `872a8c1d0346b45d80dcad1de442da64cad54546` — docs: keurmerk-rij afgerond (ZZP2-137) — PROGRESS + COMPETITORS bijgewerkt
- `claude/epic-lovelace-qpwMo` → `719906ff97c01ed521911388e1b4634b153fd74e` — feat(samenwerking): weekrooster per samenwerking + per-dag weekoverzicht
- `claude/epic-lovelace-uuw1go` → `b6f1084825927cbc6d9cf9f0dbcbf5dcb9828fa0` — docs: log platformfacturen-ontvangerzijde (ZZP2-133) in PROGRESS + backlog
- `claude/epic-lovelace-w8j6eu` → `ed8be8a834799ae873aee40140f2baf0a5e189b3` — docs: vertrouwens-strip login/registratie afgevinkt (ZZP2-138)
- `claude/epic-lovelace-wbZyI` → `7f3204af5f0b22f2245d9a7536b21c46a4c696d1` — docs: log week-overview grouping (ZZP2-76); sync WORKSPACE OVERHAUL fase-status
- `claude/epic-lovelace-wjBrX` → `3af28d535601b30186cdcf5283f2ac3fb7fdd719` — docs: WORKSPACE_OVERHAUL Fase 6 (weekoverzicht-UI /planning) afgerond + backlog
- `claude/epic-lovelace-xijqet` → `859754553128f4117425b947a448a7c1dd57b72d` — docs(backlog): record ZZP2-145 money-cascade fix in CURRENT_TASK
- `claude/epic-lovelace-zIsbd` → `51b20bd56f9bca0df8026148039e6d14cdb09257` — docs(progress): log franchise opdrachtgever/afdeling-bewerken (ZZP2-103)
- `claude/modest-babbage-08jYa` → `3fdc0ea803fe7d11fb224c8942431755c1a2ccbe` — docs(qa): target the live deployment instead of localhost

# Branch-sanering 14-6-2026 — bergingskandidaten verwijderd (berging voltooid)

De 50 "bewaard"-branches uit de sanering van 11-6 zijn op 12-6 volledig geborgen (zie
CURRENT_TASK.md backlog-item 0: AVG-register #334, KvK/BTW #335, beschikbaarheidsconflicten #336,
CLIENT-dashboard #337, iCal #338, dispuut-triage #339, inkomstenprognose, afronden-rem, CSV-hardening,
rol-fallback). De resterende `claude/epic-lovelace-*`-branches zijn daarom verwijderd; SHA's hieronder
voor herstel (`git fetch origin <sha>:refs/heads/<naam>`).

> **Uitzondering — geparkeerd, niet geborgen:** "Tweezijdige beoordelingen" (productbesluit eigenaar)
> leeft alleen op `-h9Dfw`, `-hLFwd`, `-Ym6ng`. SHA's bewaard; bij doorgang opnieuw bouwen op actuele main.

## Verwijderde branches + sha's

- `claude/epic-lovelace-0jOnC` → `b114332494c4d9e13e4c74a5c674f33b804c853e` — docs: log KvK-/BTW-validatie increment (ZZP2-127)
- `claude/epic-lovelace-4iqM6` → `773fbfed94d2474444386d7211fc123bd5bf9fea` — feat(franchise): samenvattingsstrip + statusfilter + CSV-exp
- `claude/epic-lovelace-5yaa5i` → `52b4b459e443e76c24f2c226b0b594348eb74f6d` — feat(franchise): CSV-export voor leads-pijplijn en ZZP'er-ro
- `claude/epic-lovelace-6me9m` → `535c8d96e68bc497274d07c2ae3aafe6114716f3` — docs: agenda-feed (iCal) in PROGRESS + backlog (ZZP2-70)
- `claude/epic-lovelace-6pVih` → `6c6a73645286950fc6b4c8ff106bb5bfd8480192` — docs: franchise-overzicht increment (ZZP2-119) in PROGRESS +
- `claude/epic-lovelace-7iIIb` → `db71be2649f4f459df6cde8741b4aec88b18f001` — feat(leveranciers): geconsolideerd ZZP-/leveranciersoverzich
- `claude/epic-lovelace-7wDjk` → `e0ab1825689ec9547347d09df7b178bdfd715dc9` — feat(prognose): inkomstenprognose voor de ZZP'er — verwachte
- `claude/epic-lovelace-8Qdyf` → `b5296a3c7a97b523282379f12dcc1bb936cb30ab` — docs: franchise-statistieken in PROGRESS + backlog; ruim con
- `claude/epic-lovelace-8bgwcz` → `64b1ce3f57e6e18428d2285f2116bb19584b2474` — fix(correctheid): iteratie-6 sweep — numeriek, tijd/tijdzone
- `claude/epic-lovelace-Bdq78` → `ae6c3c1ea7ba4ef2ee9d4454296859d9dbf528c6` — docs: franchise dienst-detail increment + franchise-backlog;
- `claude/epic-lovelace-DdPcB` → `9494e5812fa611fa85bb140568bb439d25fd31ae` — docs: lead-CSV-import (ZZP2-121) in PROGRESS + CURRENT_TASK
- `claude/epic-lovelace-DsBvj` → `c853a2dfa5dc942ac4d8f0bf9c9193f1b9da8b70` — feat(academie): behaalde cursussen als zichtbaar trust-signa
- `claude/epic-lovelace-Gdrji` → `77077203b669cb6b71b834193bc5d66109d905d4` — docs: log franchise-statistieken + verwijs actief epic ADR-0
- `claude/epic-lovelace-H3Sf4` → `dccb16f4adbcb9c41d2414e20ec4c79e4419251c` — docs: noteer ideeënbox-duplicaatpreventie (ZZP2-105)
- `claude/epic-lovelace-I3Gvj` → `5ee774e37306da77a1f54cfcc5bdde72b9b5b342` — docs: log franchise dienst-detailpagina (ZZP2-99)
- `claude/epic-lovelace-J4fj9` → `2da9f0c1606e72e2c97b93bfa7544e535c945f68` — feat(avg): verwerkingsregister + bewaartermijnen-overzicht (
- `claude/epic-lovelace-Laagg` → `e6a821a957153d44c5595e2eda8a894654beb5a4` — feat(dashboard): opdrachtgever-zone 'wat kan ik oppakken' —
- `claude/epic-lovelace-MLp7A` → `399e0d195c7b39de2fe6f8e460a95c8e4a6e1689` — docs: factuurexport CSV per gebruiker bijgewerkt in PROGRESS
- `claude/epic-lovelace-NBs0D` → `f7e327c1bf0aaa45299b78b08d793a947c49e2db` — docs: helpdesk-loop-increment + opruiming merge-markers (ZZP
- `claude/epic-lovelace-PKJLj` → `e1142fbbb84e2042c93b62a37543f4ed2d502020` — docs: PROGRESS + backlog bijgewerkt (AVG-register /admin/avg
- `claude/epic-lovelace-SJmv0` → `8b4cb8df1b182eb2ccdace62574084bc70d28fc1` — feat(admin): dispuut-triage op /admin/disputen (leeftijd + u
- `claude/epic-lovelace-St0dP` → `958dd3bff106d1872470cac04b07ed99b30e8237` — docs: log franchise-samenwerkingen filter/export increment (
- `claude/epic-lovelace-U4nJm` → `c8dddb537b51bb5a230f269396ee6f1be4494a59` — feat(franchise): Inc 6 — tenant-signalen (actie-items + nav-
- `claude/epic-lovelace-UV5P7` → `5f6da91f4ce48182c58eb93f0ad0fefc8304222f` — feat(calendar): exporteer samenwerkingen naar agenda (.ics)
- `claude/epic-lovelace-Vv26O` → `6f2ab2c80274b3381e250fd222ae9ab839868da5` — feat(agenda): iCal (.ics) export of collaborations + availab
- `claude/epic-lovelace-Ym6ng` → `fcc5ddfa90bbdfbf5a9b993d7660c746e4f052b5` — docs: log tweezijdige beoordelingen (ZZP2-106) + ruim confli
- `claude/epic-lovelace-aDZkD` → `ed3784e41e388902c080821e61b6fbaf5a3bb83a` — docs: log admin operationele-gezondheidsstrip (ZZP2-78)
- `claude/epic-lovelace-bwYao` → `597c3b866b42d890bd5d70d9de1439927df7d183` — docs: log ideeënbox admin-triage-signaal (ZZP2-104)
- `claude/epic-lovelace-cp9sl` → `c92c82451b3d5c6f386e50aaf9e425f09001968d` — feat(mail): e-mailkanaal voor dispuut- en samenwerking-event
- `claude/epic-lovelace-creEd` → `9f53ee3524540bf99b55c2daa08739148049c021` — docs: franchise roster-matching increment (ZZP2-97) in PROGR
- `claude/epic-lovelace-dB4UI` → `4c964cba55f2556fb029b4dba3853364f8ea8341` — docs: log franchise samenwerking-detail (ZZP2-111) + ruim st
- `claude/epic-lovelace-ehh6vy` → `c54760ed0df48b4364a9747b7678897e47c5ca05` — docs: record herplaatsing-bij-uitval increment + mark COMPET
- `claude/epic-lovelace-gCZVD` → `d651479e6fc7a2d7ab21a0114da4eea324ec4c9f` — docs: PROGRESS + backlog na CSV formule-injectie hardening (
- `claude/epic-lovelace-h9Dfw` → `5272a110ee6101a833db94bfb723cb5ae6d3ec9b` — docs: werk PROGRESS + backlog bij (tweezijdige beoordelingen
- `claude/epic-lovelace-hLFwd` → `4a11cf83b90baa1b341891a6db671e6e6b1c72cc` — docs: log two-sided reviews increment; clean stray conflict
- `claude/epic-lovelace-khY5v` → `b17039f4d01df50b59a25c6c8e57f98b414ea98b` — feat(dashboard): admin Platform-gezondheid-zone (kerncijfers
- `claude/epic-lovelace-nW7RF` → `05cdbef1251252af210d54b8ba9b2af422b78f43` — docs: noteer franchise samenwerking-detail in backlog (ZZP2-
- `claude/epic-lovelace-nrzrs0` → `c5fa05ddd89daf602dabdce9774f0568242d7d6a` — docs: WORKSPACE_OVERHAUL Fase 3 (CLIENT-dashboard) afgerond
- `claude/epic-lovelace-q8l8W` → `84f8ef745b046c7523c9567473e48e6cc9571ce6` — feat(dashboard): opdrachtgever-zone "Wat kan ik oppakken" (m
- `claude/epic-lovelace-snivze` → `6f01fb7b1f8d5595cef122e0b88fe71722106109` — docs: log franchise pijplijn-overzicht + actualiseer workspa
- `claude/epic-lovelace-szz2a3` → `b704fb0cfb74facebda53555909d5ad0e1d1d6f8` — fix(boekhouding): rol-fallback voor ADMIN/FRANCHISER i.p.v.
- `claude/epic-lovelace-t3oe7h` → `09e01d0d1e58aeb23533c736f39e08554397bd5d` — feat(samenwerkingen): afronden-rem — geen COMPLETED met open
- `claude/epic-lovelace-tgl3E` → `d74fe372ac6045c6517971a3bb0d79d0dd855998` — docs: WORKSPACE_OVERHAUL Fase 4 afgerond (admin-health-zone)
- `claude/epic-lovelace-tsaQY` → `d0982cbde33ea7fb55bb33302338dadb0001abde` — docs: WORKSPACE_OVERHAUL Fase 4 (admin health-zone) + opruim
- `claude/epic-lovelace-wqFHF` → `9e3a8ef598ca1d5b0cdd9f41e6e91f2e39f9109b` — docs: verslag franchise omzet-overzicht (ZZP2-98) + backlog
- `claude/epic-lovelace-wtK4l` → `74fa6d335956c7e1051334218b963712464a29e5` — docs: log beschikbaarheidsconflicten (ZZP2-109) + verwijder
- `claude/epic-lovelace-z9RBc` → `7bb647bebfc468c8e79b848785d5ebdfec0394d5` — feat(franchise): detailpagina per samenwerking met cascade-f
- `claude/epic-lovelace-zE27a` → `98af98ed56acd7e041709e60a3781a4dd1c93682` — docs: track franchise-werkstroom + roster-compliance in CURR
- `claude/epic-lovelace-zg2s6n` → `c94351f8d1dc9f920b854878c501d9c1c7e39abf` — docs: agenda-export (.ics) in PROGRESS + CURRENT_TASK; ruim

# Branch-opruiming 15-6-2026

Na verificatie op 'goed maar ongemerged werk' verwijderd (inhoud op main of achterhaald);
SHA's voor herstel (`git fetch origin <sha>:refs/heads/<naam>`):

- `claude/dazzling-carson-v9Qwk` → `31b58ffb340240e2a2a342bb002e7e21c9a0fcaf` — feat: 3 routine-features geborgen — indirecte uren, roo
- `feat/ideeen-categorieen` → `fe8f10a361b9e4c30484de830fddbfbada39aa49` — feat(ideeen): categoriseer ideeën op doelgroep + thema
- `feat/ideeenbox-best` → `50e4e4c4bd3598e3437e432af6745c76cbebc842` — feat(ideeen): best-in-class ideeënbox — optimistic voti
- `claude/gifted-ramanujan-4u3uk7` → `80a27e52c3ba13824a778b09e198edd5b7728184` — docs(ontwerpen): Warmte — drie eigen lichte paletten op
- `feat/zorg-seed` → `a257713afce050daa2216c4c6bf6b32870949241` — feat(seed): primaire demo-accounts naar zorg (positione

> **BEWAARD (niet verwijderd):** `feat/tweezijdige-beoordelingen` — bevat een complete, geteste
> tweezijdige-beoordelingen-feature (Review-model, server-action, UI, 264 testregels) die NIET op
> main staat (geparkeerd productbesluit eigenaar). Enige kopie; wacht op besluit wel/niet bouwen.
