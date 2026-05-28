# SWARM.md — hoe we dit project met een agent-zwerm bouwen

Doel: meerdere agents tegelijk laten doorbouwen **zonder conflicten of slop**, in de
orchestrator-worker-vorm. Dit is de werkafspraak; zie ook `CLAUDE.md` → AUTO-MODE.

## Onderzoek → kernregels (waarom niet "zoveel mogelijk agents")
- **Orchestrator-worker**: één lead-agent houdt de volledige context, splitst werk in
  onafhankelijke taken, en stuurt korte, zelfstandige opdrachten naar worker-subagents.
  De lead **integreert, verifieert en commit zelf**.
- **Aantal (voor code): 2–4 workers is het optimum.** Veel subagents (10+) lonen alleen bij
  *breedte-onderzoek*, niet bij code. Code is sterk onderling afhankelijk; boven ~4 worktrees
  kost coördinatie/merge meer dan het oplevert. Tokenkosten ~15× t.o.v. één agent — zet de
  zwerm dus in waar de opbrengst dat waard is.
- **Heldere taakgrenzen**: elke worker krijgt een zelfstandige opdracht, een verwacht
  resultaat, en **expliciet bestands-eigendom**. Map vóóraf welke bestanden elke taak raakt;
  **overlappende bestanden worden gesequenced, niet geparallelliseerd**.
- **Isolatie**: voor grotere fan-out elke worker in een **git worktree** (`isolation: worktree`)
  op een eigen branch → dunne PR's → de lead merget. Voor 2–3 onafhankelijke bestanden kan ook
  in dezelfde werkboom, mits niet-overlappend en de workers geen git/build draaien.
- **Verificatiepoort (niet-onderhandelbaar)**: de lead draait `typecheck`+`lint`+`test`+`build`
  (+ e2e waar relevant) ná integratie en **gooit zwakke output weg**. Nooit mergen op
  "ziet er goed uit".

## Werkwijze van de lead (per ronde)
1. `git fetch` + rebase op `claude/dazzling-carson-v9Qwk`.
2. Kies 2–4 onafhankelijke taken uit de backlog (`CURRENT_TASK.md`). Maak een bestands-eigendomskaart.
3. Spawn de workers parallel met zelfstandige prompts (taak, conventies, alleen-deze-bestanden,
   geen git, draai typecheck).
4. Integreer, draai de volledige checks, fix integratie, commit per feature, push.
5. Werk `PROGRESS.md` + de backlog bij.

## 24/7 continu draaien (GitHub Actions)
Een sessie is eindig; continuïteit komt van CI-cron:
- **`.github/workflows/auto-build.yml`** — op een schema (cron) + handmatig: één agent pakt het
  bovenste backlog-item, levert af volgens de Definition of Done, en pusht naar de branch.
- **`.github/workflows/swarm.yml`** — handmatige fan-out (matrix): meerdere agents tegelijk, elk
  op een eigen `swarm/*`-branch met een eigen PR (branch-per-agent voorkomt push-conflicten).

**Mensenwerk (eenmalig):** voeg repo-secret **`ANTHROPIC_API_KEY`** toe (Settings → Secrets →
Actions). Draai daarna elke workflow één keer handmatig ("Run workflow") om te valideren, en houd
de eerste runs in de gaten (kosten, rate limits). Zonder dit secret draaien de workflows niet.

## Bronnen
- Anthropic — Building a multi-agent research system (orchestrator-worker, sizing, ~15× tokens).
- Claude Code docs — Run parallel sessions with worktrees (`isolation: worktree`, branch-per-agent).
