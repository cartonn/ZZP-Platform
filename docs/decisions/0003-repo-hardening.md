# ADR 0003 — Repository Hardening voor Externe Samenwerking

**Status:** Accepted
**Datum:** 2026-05-31

## Context

Het ZZP Platform wordt voorbereid op samenwerking met externe ontwikkelaars. De
codebase is functioneel volwassen (27 e2e tests, 6 workflows, gedetailleerde docs)
maar mist structurele bescherming: geen CODEOWNERS, branch protection, formatting
enforcement, contributierichtlijnen of PR/issue templates.

## Beslissing

1. **CODEOWNERS** — `@cartonn` als default reviewer op alle PRs.
2. **Branch rename** — default branch wordt `main` (was `claude/dazzling-carson-v9Qwk`).
3. **Prettier + husky + lint-staged** — formatting afdwingen bij commit en in CI.
4. **CONTRIBUTING.md** — Engels, met verwijzingen naar de Nederlandse projectdocs.
5. **SECURITY.md** — responsible disclosure policy.
6. **PR template** — checklist gebaseerd op Definition of Done uit CLAUDE.md.
7. **Issue templates** — bug report en feature request in het Nederlands.
8. **E2e in CI** — Playwright met bundled Chromium (project `ci`), als aparte job.
9. **Branch protection** — PR reviews verplicht, status checks verplicht, geen direct push.
10. **OAuth voor alle workflows** — geen API-key kosten.

## Gevolgen

- Externe devs kunnen onboarden via CONTRIBUTING.md.
- Formatting-conflicten worden voorkomen door Prettier.
- Code kan niet meer direct naar `main` gepusht worden zonder review.
- E2e draait automatisch als regressiecheck in CI en auto-build.
- De branch rename vereist een Railway config update (handmatig).
