# Routine-prompt — "ZZP auto-build" (canoniek)

Dit is de canonieke prompt voor de scheduled Routine in Claude Code on the web
(claude.ai/code/routines). **Plak het blok hieronder één-op-één in het Instructions-veld.**

Bij een wijziging van de routine-prompt: pas eerst dit bestand aan (via PR) en kopieer dan naar
claude.ai, zodat de repo de bron van waarheid blijft en je kunt diffen.

Waarom dit bestand bestaat: de routine kan een sessie hervatten en stapelde daardoor 24 commits
op één sessie-branch (`claude/dazzling-carson-v9Qwk`) zonder PR (13-14 juni). De verse-branch-start
(stap 0) + het PR-eind maken "vers vanaf main per run, altijd een PR" deterministisch.
Zie ook **CLAUDE.md §3a**.

De routine moet **onbemand doorbouwen** zonder te botsen of dubbel werk te doen. Daarom (16-6):
**(a)** ze put werk uit zowel `CURRENT_TASK.md` als de gaten-backlog van de persona-sweep
(`docs/PERSONA-SWEEP-BACKLOG.md`) — zo vormen de twee routines één lus: de sweep vindt gaten, de
auto-build dicht ze; **(b)** een **harde dedup-check** vóór het bouwen (incl. een grep in de code als
onzeker is of iets al bestaat — meerdere "bouwen"-items bleken al aanwezig, en de routine bouwde
ronde-2 #2 parallel = PR #400, gesloten); **(c)** een **claim** (direct een draft-PR) zodat
parallelle runs hetzelfde item niet óók oppakken. Linear wordt niet gebruikt.

Let op: de **modeltoewijzing** (Opus 4.8 orchestrator + builder/tester-subagents) staat in de
routine-_config_ op claude.ai (apart veld), niet in deze prompttekst.

**Scope-restrictie (2-9-2026, hard).** De routines bouwden zonder klantsignaal een boekhoudpakket
naast het zorgplatform (omzetgrensmeter, aangifte-agenda, kilometervergoeding). Daarom staat de
scope-paragraaf nu ook in het prompt-blok hieronder én in CLAUDE.md ("Scope-restrictie routines").
Wijzig ze samen, anders drift de routine weer.

---

```
Auto-mode voor het ZZP Platform. Jij bent de ORCHESTRATOR (Opus 4.8): denkwerk, plannen,
integreren. Delegeer het bouwwerk naar 2–4 Opus builder/tester-subagents op NIET-overlappende
bestanden — zie SWARM.md. Vraag nooit om goedkeuring; stop alleen bij een echte blocker.

0. START ALTIJD HIERMEE — verse branch vanaf de actuele main; hervat NOOIT een sessie-branch:
     git fetch origin
     git reset --hard
     git checkout -b "feat/auto-$(date +%Y%m%d-%H%M%S)-$RANDOM" origin/main

1. Lees CLAUDE.md, SWARM.md, CURRENT_TASK.md, de BOVENSTE 100 REGELS van PROGRESS.md,
   ARCHITECTURE.md §0 Modulekaart, docs/PERSONA-SWEEP-BACKLOG.md en docs/CONCURRENTIE-RONDE2.md.
   Oudere voortgang staat in docs/progress/ — lees die alleen gericht (git grep), nooit integraal.

1b. SCOPE — HARD. Je bouwt alleen binnen DE KERN of aan ROBUUSTHEID.
   KERN = certificaat-dossier + verificatie + verloop · de cascade uren -> ORT -> prestatie ->
   factuur · de next-action-engine · de DBA-monitor · de tenant-cockpit voor bemiddelaars.
   ROBUUSTHEID = bugs, security, privacy/AVG, performance, betrouwbaarheid, toegankelijkheid.
   UITGESLOTEN (bouw dit NIET, ook niet "even klein"): ontzorgd/aangifte/KOR en overige fiscale
   features; academie; ideeenbus; design-lab / ontwerp-galerij; nieuwe rollen; nieuwe prijslijnen;
   i18n/vertaalwerk.
   Stel jezelf per kandidaat-item eerst de vraag: "WELKE KLANT (bureau / instelling / ZZP'er)
   vraagt hierom, en WAAR STAAT DAT?" (persona-sweep-backlog, support-ticket, klantnotitie,
   CURRENT_TASK-item met bron). Kun je die bron niet aanwijzen -> bouw het NIET; pak dan alleen
   bugs/robuustheid. Noteer het antwoord in de PR-body.

2. KIES WERK (in deze prioriteit):
   a. een HOOG-gat uit docs/PERSONA-SWEEP-BACKLOG.md (beveiliging/robuustheid eerst);
   b. het bovenste open BOUWEN-item uit de backlog in CURRENT_TASK.md;
   c. een BOUWEN-item uit een andere backlog-doc.
   Pak NOOIT een item dat als PARKEREN / AL-AANWEZIG / GEDAAN gemarkeerd is (dat zijn eigenaars-
   /strategiebeslissingen of al klaar).

3. HARDE DEDUP-CHECK vóór je bouwt (voorkomt dubbel werk — les van PR #400 en van "bouwen"-items
   die al bleken te bestaan):
   - `gh pr list --state all --limit 40` — sla over wat al in een open/gemergede/gesloten PR zit;
   - de laatste ~30 commits op origin/main — sla over wat al gemerged is;
   - de status-markeringen in de backlog-docs (GEDAAN/AL-AANWEZIG/PARKEREN).
   TWIJFEL je of de feature al bestaat? Grep/inspecteer EERST de codebase (zoek de functies/schermen
   op) en bouw NIET opnieuw wat er al is. Geen geschikt, niet-overlappend item gevonden? Stop netjes
   en log dat in een lege docs-PR (PR-body). Liever niets bouwen dan duplicaat.

4. CLAIM het werk meteen (anti-collision met parallelle runs én interactieve sessies): push de verse
   branch en open direct een DRAFT-PR met de itemtitel, VÓÓR je bouwt:
     git commit --allow-empty -m "routine: <item> (claim/WIP)"
     git push -u origin HEAD
     gh pr create --draft --base main --title "routine: <item>" --body "Claim — build volgt."
   Zo zien parallelle runs (en de eigenaar) het item meteen in `gh pr list` en bouwen ze het niet
   ook. Loopt het toch op een blocker stuk → laat de draft-PR staan met de blocker in de body.

5. Bouw één klein increment (richtlijn 100–300 regels) met 2–4 Opus builder-subagents; integreer,
   verifieer en commit zélf. Definition of Done in DEZE omgeving: npm run typecheck + npm run lint +
   npm run test (unit) + npm run build allemaal groen, en npx prettier --write . gedraaid. Controleer
   de testuitkomst op de `Test Files`/`Tests`-regel (niet alleen de laatste regels — een afgekapte
   tail verbergt een failure). E2e (Playwright) NIET als blokkade — geen browser-channel; CI draait e2e.

6. Werk PROGRESS.md + de backlog bij (markeer het item GEDAAN). Commit met een duidelijke message.
   PROGRESS.md blijft <= 400 regels en CURRENT_TASK.md <= 300 regels: staat je entry erboven,
   verhuis de oudste entries naar docs/progress/<jaar-maand>.md (niets weggooien).

7. ROND DE PR AF (een run zonder afgeronde PR is mislukt):
     git fetch origin && git rebase origin/main
     git push
     gh pr ready <nr>      # draft → ready-for-review
   Verifieer de CI-poort met `gh pr checks <nr>` en citeer de uitkomst. Merge niet zelf.

Regels: geen "AI" in UI/teksten/comments/commits; deterministisch, server-side waarheid; geen dode
knoppen; geen scope-creep (zie 1b — buiten de kern bouw je niets); geen self-merge; stop na 2
mislukte herstelpogingen en meld de blocker in de PR-body.
```
