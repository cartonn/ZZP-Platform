# Codex-werkprompt — Handslag auto-build

Bewijsdatum: 2026-09-11. Rechtstreeks gelezen Claude-schema: 00:22, 04:22, 08:22,
12:22, 16:22 en 20:22 UTC; model Opus 4.8. Laatste geslaagde gelezen webuitvoering:
10 september, #1473 gemerged. Nieuwere repo-/PR-informatie blijft leidend.

De actieve Codex-heartbeat coördineert deze werkstroom samen met de andere vier.
De geconfigureerde twintigminutendispatch gebruikt een duurzaam register per gepland tijdslot;
exacte starttijden en een eerste geslaagde Codex-run zijn nog niet bewezen. Dit bestand
activeert geen scheduler. Controleer de actuele overgangsstatus in de overdracht.

Je onderhoudt Handslag / `cartonn/ZZP-Platform` als orchestrator. Lever één klein,
aantoonbaar nuttig increment binnen kern of robuustheid. Ga zelfstandig door binnen
de autorisatie van de eigenaar en de grenzen hieronder.

1. Lees `docs/CODEX-ROUTINE-TAKEOVER.md`, `AGENTS.md`, `CLAUDE.md`, `CURRENT_TASK.md`,
   de bovenste 100 regels van `PROGRESS.md`, `ARCHITECTURE.md` §0 en relevante nieuwe
   persona-/securitybevindingen. Lees `DESIGN.md` vóór UI-werk. Zoek eerdere uitvoering
   gericht in `docs/progress/`; lees grote archieven niet integraal.
2. Controleer gitstatus, fetch `origin` en begin in een nieuwe schone worktree op een
   unieke `codex/auto-<tijd>-<uniek>`-branch vanaf `origin/main`. Behoud bestaand werk;
   geen destructieve reset, geen force-push, geen hergebruik van een oude sessiebranch.
3. Controleer `gh pr list --state all --limit 40`, laatste circa 30 remote commits,
   backlogmarkeringen en echte code. Prioriteit: bewezen hoog risico, dan bovenste
   geldige open kern-/robuustheidstaak. Sla geclaimd, af of geparkeerd werk over.
4. Noteer de concrete klant/bron voor productfunctionaliteit. Zonder bron alleen
   bugs/robuustheid. Geen fiscale uitbreiding, academie, ideeën, designlab, nieuwe
   rollen/prijslijnen of vertaalwerk. Claim de gekozen taak vóór implementatie met
   een draft-PR, bron, scope en bestandsgrenzen. Bij geen geschikt werk: feitelijke no-op.
5. Bouw één increment, richtlijn 100–300 regels. Gebruik onafhankelijke subagents als
   dat nuttig is; wijs bestandsbezit toe. Integreer en verifieer als lead. Behoud auth,
   tenantisolatie, serverstatus, audit, geldintegriteit, idempotentie en privé-documenten.
6. Draai `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` en
   `npx prettier --check .`; herstel gerichte formatting. Lees testtotalen en failures.
   Schrijf noodzakelijke regressietests die het probleem bewijzen. E2e blijft CI-poort.
7. Werk voortgang en backlog bij met werkelijke status. Fetch/rebase vóór commit en
   push; combineer geldige docs-inhoud bij conflicten. Maak de draft gereed. Verifieer
   alle zes vereiste checks op de actuele SHA en laat de onafhankelijke reviewer zijn
   eigen oordeel leveren. Zelf geen `agent-review`-goedkeuring plaatsen.
8. Pas na groen `gh pr merge <nr> --squash --auto`. Controleer echte merge en de bedoelde
   deploy afzonderlijk. Maximaal twee gerichte herstelpogingen per blocker; daarna
   PR open met bewijs. Bypass nooit de poort. Rapporteer beknopt probleem, wijziging,
   checks, PR/merge/deploystatus en volgende stap.

Eerste overdrachtskandidaat is admin-next-action voor geëscaleerde prestatiegoedkeuring
(CURRENT_TASK techniek 6a), inclusief badgepariteit. Dedup opnieuw; factuurvariant 6b
is al in #1473 gerealiseerd. #1474 blijft apart werk in review, geen reden het te herbouwen.
