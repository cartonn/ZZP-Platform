# LOOP — zelf-test-lus met kritische persona's

Doel: het systeem verbetert zichzelf zónder dat iemand per taak hoeft aan te sturen. Per ronde lopen
**persona-agents** hun echte werk door het draaiende systeem, een **kritische rechter** beoordeelt of
het systeem doet wat het moet (en logisch is), de bevindingen gaan in `GAPS.md`, **fix-agents** lossen
ze op via PR's, en de lus herhaalt **tot 2 rondes niets nieuws** opleveren ("schoon").

## Het recept (één iteratie)

1. **Seed** de demo-data: `SEED_DEMO=true npx prisma db seed` (maakt o.a. `admin@` / `zzp@` /
   `opdrachtgever@` / `franchise@`, wachtwoord `demo1234`).
2. **Productie-build** (cruciaal — dev-mode toont de Next.js dev-indicator als vals 'N'-element):
   `npm run build`.
3. **Persona-reizen** (echte browser, productie-server, screenshots per stap):
   `npx playwright test -c playwright.personas.config.ts`
   → schrijft `e2e/personas/shots/<persona>/NN-*.png` + `_log.json` (gitignored).
4. **Kritiek + rechter**: draai de workflow `persona-sweep`
   (`.claude/workflows/persona-sweep.js`): vier vision-critici lezen de screenshots, de rechter
   ontdubbelt, gooit vals-positieven eruit en scheidt **bug** van **productkeuze**.
5. **Backlog** bijwerken in `GAPS.md` (nieuwe items toevoegen; gefixte afvinken).
6. **Fix-pipeline**: per bevestigd gat een fix-agent → DoD-gate (`typecheck`+`lint`+`test`+`build`+
   `prettier`) → feature-branch → PR → **admin-merge bij groene CI**. Verwante gaten bundelen.
7. **Verify + herhaal**: opnieuw vanaf stap 1. Stopt na **2 opeenvolgende rondes zonder nieuwe**
   bevestigde gaten.

## Persona's en missies

| Persona       | Account          | Missie (echte werk)                                                                                               |
| ------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| ZZP'er        | `zzp@`           | profiel, certificaten, opdracht zoeken + reageren, samenwerking + modelovereenkomst, facturen, inzicht/abonnement |
| Opdrachtgever | `opdrachtgever@` | opdracht plaatsen + publiceren, kandidaten, samenwerking, prestaties, facturen, inzicht                           |
| Franchiser    | `franchise@`     | opdrachtgevers + roster onboarden, diensten, samenwerkingen, BI, leads, facturatie                                |
| Admin         | `admin@`         | verificaties, DBA-monitor, helpdesk, franchises, facturatie genereren, statistieken, audit                        |

De reizen staan in `e2e/personas/journeys.spec.ts` (veerkrachtig: een mislukte stap stopt de reis niet
maar wordt gelogd = mogelijk een gat).

## Guardrails (niet-onderhandelbaar)

- Altijd feature-branch → PR → CI → **admin-merge op groen**; nooit `main` breken.
- Persona's zijn **read-only** verkenners; alleen fix-agents schrijven.
- **Productkeuze ≠ bug.** Bewuste keuzes worden geparkeerd in `GAPS.md` (sectie "Productkeuzes"),
  niet gefixt — die vragen een eigenaar-besluit. Zie ook `docs/decisions/` en `MENSENWERK.md`.
- Geld blijft **PENDING** (geen echte incasso); geen externe verzending; auth nooit uit; het woord
  "AI" nergens in UI/teksten/comments; NL-UI + `DESIGN.md`.
- **Stop na 2 mislukte fix-pogingen** op een item → parkeren als "needs human".

## Gekalibreerd in iteratie 0 (leerpunten)

- Draai de sweep tegen een **productie-build**, niet `npm run dev` — anders flagt de rechter de
  Next.js **dev-indicator** ('N'-bolletje over de nav) als vals HOOG-bug. Daarom de aparte
  `playwright.personas.config.ts` + `testIgnore` van `personas/` in de gating-config.
- De rechter moet **bug vs. productkeuze** hard scheiden en **vals-positieven adversarieel**
  wegfilteren (in iteratie 0 ving hij o.a. dat opdrachtgever-rijen wél klikbaar zijn).
