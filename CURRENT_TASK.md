# CURRENT_TASK.md — Huidige taak

> Eén taak tegelijk. Lees CLAUDE.md en PROGRESS.md voordat je begint.
> Werk dit bestand bij wanneer je naar de volgende taak gaat.

## STATUS: alle 10 sessies afgerond (code-kant compleet)

Het ZZP-platform is functioneel compleet en getest. Er is geen volgende **code**taak in de
bouwvolgorde. Zie PROGRESS.md ("PROJECT COMPLEET — handover") voor wat nog **mensenwerk** is
(productie-infra, betaalprovider, security-/AVG-review, e-mail).

Bij hervatten: kies een verbeterpunt uit de "Bekende, bewust uitgestelde code-punten" in
PROGRESS.md, of een nieuwe wens van de eigenaar. Werk dan opnieuw één taak tegelijk:
testbare kern eerst → UI → checks (typecheck/lint/test/build) → e2e + screenshots →
reviewzwerm + bug-loop → commit.

---

## QUALITY_CHECKLIST (gebruik elke sessie vóór commit)
```
npm install            # indien dependencies gewijzigd
npm run lint
npm run typecheck
npm run test
npm run build
npx prisma db push     # of migrate, indien schema gewijzigd
npm run db:seed        # indien seed gewijzigd
# Start dev, klik de gebouwde flow door, check browserconsole op errors
```
Faalt iets → oorzaak onderzoeken, fixen, checks opnieuw. Pas daarna afvinken.
