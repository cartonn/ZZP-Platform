# Codex-werkprompt — Handslag productierijpheid

Bewijsdatum: 2026-09-11. Rechtstreeks gelezen Claude-schema: 03:00 en 15:00 UTC;
model Opus 4.8. Laatste geslaagde gelezen webuitvoering: 9 september, #1453
(Dependabot). Nieuwere repo-/PR-informatie, waaronder #1469, blijft leidend.

De Codex-coördinator plant deze werkstroom via zijn geconfigureerde twintigminutendispatch en
duurzaam register per gepland tijdslot. De oude afzonderlijke Codex-cron blijft PAUSED.
Een eerste geslaagde Codex-run en exacte starttijden zijn niet bewezen; dit bestand
activeert geen scheduler. Controleer de actuele overgangsstatus in de overdracht.

Verbeter de aantoonbare betrouwbaarheid en operationele onderhoudbaarheid van Handslag.
Werk aan één concrete ontbrekende schakel, gebaseerd op actuele code, checks of
operationeel bewijs. Demo-beschikbaarheid betekent niet dat echte productie gereed is.

1. Lees overdracht, `CURRENT_TASK.md`, bovenste voortgang, relevante `RUNBOOK.md`- en
   `MENSENWERK.md`-secties, architectuur en recente PR's. Controleer oudere claims
   tegen merges en huidige configuratie. Zoek gericht; grote dossiers niet integraal lezen.
2. Fetch en maak een unieke schone `codex/production-<tijd>-<uniek>`-worktree/branch
   vanaf `origin/main`. Behoud bestaand werk. Dedup open/gesloten/gemergde PR's,
   backlog en code; claim één klein increment met draft-PR vóór implementatie.
3. Prioriteer bewezen problemen met deploy/readiness, database/migraties, private
   opslag, back-up/herstel, taakaflevering/heartbeat, rate-limits, monitoring en
   dependencyonderhoud. Gebruik eerst read-only controles. Geen nieuwe productmodules
   of observabilityvarianten zonder aantoonbaar ontbrekend signaal.
4. Houd de bewijsketen expliciet: een geslaagde build is geen deploy; een 200 is geen
   readinessbewijs; een object-roundtrip is geen databaseherstel; een heartbeat bewijst
   uitvoering maar niet automatisch inhoudelijke taakverwerking. Controleer exacte
   commit, omgeving en uitkomst. Hersteltests gebruiken een geïsoleerde scratchdatabase.
5. Geen destructieve productietest, backup-retentie-snoei, nieuwe accounts/betalingen,
   publicatie van secrets of activering van een slapende integratie zonder daarvoor
   aanwezige concrete autorisatie. Behoud veilige defaults; ontbrekende optionele
   integraties blijven inert. Juridische/AVG-go-livekeuzes blijven eigenaar/jurist.
6. Implementeer de testbare kern, gerichte regressie en operationele instructie. Draai
   lint/typecheck/unit/build/formatting; neem migratie-/herstelchecks mee als ze relevant
   zijn. Werk voortgang/runbook/backlog met werkelijk bewijs bij, geen vink op intentie.
7. Laat onafhankelijk reviewen en volg het overdrachtscontract: fetch/rebase, PR,
   alle zes vereiste checks op actuele head, daarna `gh pr merge <nr> --squash --auto`.
   Controleer uiteindelijke merge en geautoriseerde Railway-release afzonderlijk.
   Bypass nooit een poort; na twee mislukte pogingen dezelfde blocker vastleggen.
8. Rapporteer wat aantoonbaar is verbeterd, wat werkelijk is getest en welke menselijke
   of externe stap overblijft. Geen geschikt niet-overlappend werk: feitelijke no-op.

Overdrachtswaarschuwing: de oude backuptekst zegt nog “te publiceren”, terwijl #1419
is gemerged. Verifieer huidige job/object-readback/heartbeat én scratch-herstel vóór
je hierover opnieuw een implementatie start of “backups bewezen” schrijft.
