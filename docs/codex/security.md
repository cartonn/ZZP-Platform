# Codex-werkprompt — Handslag security en privacy

Bewijsdatum: 2026-09-11. Rechtstreeks gelezen Claude-schema: 02:00 en 14:00 UTC;
model Opus 4.8. Laatste geslaagde gelezen webuitvoering: 10 september, #1468,
cleanronde. Actuele code en repo-backlogs blijven leidend; dit is geen algemene garantie.

De Codex-coördinator plant deze werkstroom via zijn geconfigureerde twintigminutendispatch en
duurzaam register per gepland tijdslot. De oude afzonderlijke Codex-cron blijft PAUSED.
Een eerste geslaagde Codex-run en exacte starttijden zijn niet bewezen; dit bestand
activeert geen scheduler. Controleer de actuele overgangsstatus in de overdracht.

Voer een onafhankelijke, adversariële audit van Handslag uit. Zoek aantoonbaar
bereikbare problemen; herhaal geen oude cleanclaims zonder de huidige code te controleren.
De audit vervangt geen jurist/FG-review of aparte onafhankelijke PR-review van eigen fixes.

1. Lees overdracht, `AGENTS.md` invarianten/hotspots, `CLAUDE.md`, actuele taak/voortgang,
   laatste security- en personarondes. Fetch `origin`, inspecteer delta en recente PR's,
   maak een unieke schone worktree/branch vanaf `origin/main`. Bewaar ander werk.
2. Verdeel nuttige onafhankelijke audits over niet-overlappende oppervlakken:
   autorisatie/IDOR/tenant/documenttoegang; mutaties/transities/races/geldintegriteit;
   privacy/erasure/dataminimalisatie/logging en injectie. De lead verifieert elk resultaat.
   Gebruik geen productiegegevens of productie-misbruikprobes.
3. Controleer de echte keten auth → rol → ownership/tenant → Zod → mutatie → audit,
   serverafgeleide status, transacties, optimistic guards, idempotentie en dispute freeze.
   Bekijk relevante CSV/ICS/HTML/upload/export-, secret- en dependencyoppervlakken.
   Maak onderscheid tussen bereikbare exploit, robuustheidsrisico en hypothetische variant.
4. Bewijs bevindingen met file:line, voorwaarden, minimale lokale repro, impact en
   regressietest waar zinvol. Test cleanclaims gericht. Geheimen of persoonsgegevens
   horen niet in prompts, logs, testsnapshots, commits of PR's.
5. Pak na dedup/draftclaim hoogstens één samenhangende kleine fix op. Behoud publieke
   API's en veiligheidsinvarianten. Verlaag geen authenticatie, limiet of reviewpoort
   om een check groen te krijgen. Juridische keuzes blijven geparkeerd; de bestaande
   publieke-reviewprivacybevinding moet als open eigenaar-/juristbesluit zichtbaar blijven.
6. Werk `docs/SECURITY-PRIVACY-BACKLOG.md` en voortgang bij met basiscommit, bewijs,
   onderzochte oppervlakken, opgelost/geparkeerd en beperkingen. Bewaar oude rondes.
   Een onbereikbare hypothese of ontbrekend testkanaal is geen bevestigd defect.
7. Draai de passende tests én de volledige vereiste lint/typecheck/unit/build/formatting-
   checks voor een fix. Verifieer dependencybevindingen; combineer geen incompatibele
   majorupdates blind. Laat iedere eigen codewijziging onafhankelijk reviewen.
8. Volg het overdrachtscontract voor rebase/PR, zes groene checks op actuele SHA en
   `gh pr merge <nr> --squash --auto`. Geen admin-bypass of eigen reviewgoedkeuring.
   Na twee mislukte herstelpogingen dezelfde blocker met bewijs openlaten. Meld een
   clean/no-op-run met daadwerkelijke dekking, zonder algemene productiegarantie.
