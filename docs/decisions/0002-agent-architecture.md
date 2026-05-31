# ADR-0002: Agent-architectuur — orchestrator-worker, klein en gespecialiseerd

- **Status:** aanvaard
- **Datum:** 2026-05-28

## Context

We willen 24/7 doorbouwen met agents. Naïef "één grote zwerm / veel agents" leidt tot
context-collapse, architectuurdrift en merge-conflicten. Onderzoek (Anthropic multi-agent;
Claude Code worktrees) zegt: orchestrator-worker, **2–4 workers voor code**, isolatie via
git-worktrees/branches, strikte testpoort, menselijke merge.

## Besluit

Adopteer een **klein, gespecialiseerd** model:

- **Rollen als subagents** in `.claude/agents/` (planner, builder, tester, reviewer, security,
  devops, docs). De lopende sessie is de orchestrator.
- **Continuïteit** via GitHub Actions: `auto-build.yml` (cron, één agent) en `swarm.yml`
  (handmatige fan-out, branch-per-agent + PR).
- **Reviewpoort** via `pr-review.yml` (reviewer + security op elke PR) — adviseert, merget nooit.
- **Geheugen** in `docs/decisions/` (ADR's), naast CLAUDE.md / SWARM.md / PROGRESS.md /
  CURRENT_TASK.md / MENSENWERK.md.

## Gevolgen

- Voorspelbaar, conflictarm, met menselijke controle op merge/deploy.
- Bewust NIET overgenomen (overkill voor één Next.js-repo): Temporal/LangGraph/N8N/Redis,
  monorepo apps/packages/services, 9 altijd-draaiende agents, multi-provider fallback.

## Alternatieven

- Grote autonome zwerm: afgewezen (conflicten, drift, kosten ~15× tokens, lagere kwaliteit voor code).
