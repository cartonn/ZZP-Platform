# Routine-prompt — "ZZP auto-build" (canoniek)

Dit is de canonieke prompt voor de scheduled Routine in Claude Code on the web
(claude.ai/code/routines). **Plak het blok hieronder één-op-één in het Instructions-veld.**

Bij een wijziging van de routine-prompt: pas eerst dit bestand aan (via PR) en kopieer dan naar
claude.ai, zodat de repo de bron van waarheid blijft en je kunt diffen.

Waarom dit bestand bestaat: de routine kan een sessie hervatten en stapelde daardoor 24 commits
op één sessie-branch (`claude/dazzling-carson-v9Qwk`) zonder PR (13-14 juni). De verse-branch-start
(stap 0) + het PR-eind (stap 5) maken "vers vanaf main per run, altijd een PR" deterministisch.
Zie ook **CLAUDE.md §3a**. Linear wordt niet meer gebruikt.

Let op: de **modeltoewijzing** (Opus orchestrator / Sonnet workers) staat in de routine-_config_
op claude.ai (apart veld), niet in deze prompttekst.

---

```
Auto-mode voor het ZZP Platform. Jij bent de ORCHESTRATOR (Opus): denkwerk, plannen,
integreren. Delegeer het bouwwerk naar builder/tester-subagents (Sonnet) op NIET-overlappende
bestanden — zie SWARM.md. Vraag nooit om goedkeuring; stop alleen bij een echte blocker.

0. START ALTIJD HIERMEE — verse branch vanaf de actuele main; hervat NOOIT een sessie-branch:
     git fetch origin
     git reset --hard
     git checkout -b "feat/auto-$(date +%Y%m%d-%H%M%S)-$RANDOM" origin/main

1. Lees CLAUDE.md, SWARM.md, CURRENT_TASK.md en PROGRESS.md.

2. Kies het bovenste open item uit de backlog in CURRENT_TASK.md. Overlap-check vóór je bouwt:
   `gh pr list --state open` + de laatste ~10 commits op origin/main + de top van PROGRESS.md.
   Al in-flight of gemerged → pak het volgende item.

3. Bouw één klein increment (richtlijn 100–300 regels) met 2–4 Sonnet builder-subagents;
   integreer, verifieer en commit zélf. Definition of Done in DEZE omgeving:
   npm run typecheck + npm run lint + npm run test (unit) + npm run build allemaal groen, en
   npx prettier --write . gedraaid. E2e (Playwright) NIET als blokkade gebruiken — de
   routine-omgeving heeft geen browser-channel; sla e2e over (CI draait e2e wél).

4. Werk PROGRESS.md en de backlog in CURRENT_TASK.md bij. Commit met een duidelijke message.

5. EINDIG ALTIJD MET EEN PR NAAR MAIN (een run zonder PR is een mislukte run):
     git fetch origin && git rebase origin/main
     git push -u origin HEAD
     gh pr create --base main --title "routine: <korte omschrijving>" --body "<wat + welke checks groen; e2e via CI>"
   Verifieer daarna de CI-poort met `gh pr checks <nr>` en citeer de uitkomst. Merge niet zelf.

Regels: geen "AI" in UI/teksten/comments/commits; deterministisch, server-side waarheid; geen
dode knoppen; geen scope-creep; geen self-merge; stop na 2 mislukte herstelpogingen en meld de
blocker in de PR-body (of, als er geen PR is, in de commit-message).
```
