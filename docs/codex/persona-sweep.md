# Codex-werkprompt — Handslag persona-sweep

Bewijsdatum: 2026-09-11. Rechtstreeks gelezen Claude-schema: 05:00 en 13:00 UTC;
model Opus 4.8. Laatste geslaagde gelezen webuitvoering: 9 september, #1451
(badgevolgorde). De nieuwere repo-backlog van 10 september en #1471 blijven leidend.
De sessie van 8 september, 15:10 lokale tijd, met QA-fontshim en drie audits in
afwachting van Bash-goedkeuring, is gelezen en gestopt; het is geen afgeronde sweep.

De Codex-coördinator plant deze werkstroom via zijn geconfigureerde twintigminutendispatch en
duurzaam register per gepland tijdslot. De oude afzonderlijke Codex-cron blijft PAUSED.
Een eerste geslaagde Codex-run en exacte starttijden zijn niet bewezen; dit bestand
activeert geen scheduler. Controleer de actuele overgangsstatus in de overdracht.

Onderzoek Handslag kritisch vanuit FREELANCER, CLIENT, ADMIN en FRANCHISER. Controleer
functionele flows, consistentie van acties/badges/lijsten en verboden handelingen.
Bewijs bevindingen; verwar broncode-inspectie niet met een uitgevoerde browsertest.

1. Lees de overdracht, `AGENTS.md`, `CLAUDE.md`, `DESIGN.md`, `CURRENT_TASK.md`, de
   bovenste voortgang en de laatste persona-/securitybevindingen. Controleer recente
   PR's en `origin/main` op opgeloste of geclaimde issues. Bewaar geschiedenis.
2. Fetch en maak een nieuwe schone worktree vanaf `origin/main`, unieke
   `codex/persona-<tijd>-<uniek>`-branch. Geen destructieve reset van bestaand werk.
   Gebruik uitsluitend een verse lokale testdatabase en opslagmap. Bouw en seed met
   de repo-testconfiguratie; gebruik de demoaccounts uit de seed. Raak productie niet
   met misbruikprobes of testmutaties. Houd tijdelijke configuratie buiten git.
3. DOEL 1: doorloop certificaten, opdracht/reactie, samenwerking/contract,
   uren/ORT/prestatie, factuur en betalingregistratie voor de passende rollen.
   Controleer adminverificatie/dispuut en franchiseoverzichten. Kloppen status,
   bedragen, volgende acties, knoppen en loading/empty/error? Controleer smalle
   mobiele en brede schermen, toetsenbord/focus en overlays bij relevante wijzigingen.
4. DOEL 1b: vergelijk nav-badges, actiecentrum, dashboard en detailpagina op dezelfde
   serverdata: gelijke filters, volgorde, scanvensters, verval/dispuutstatus en tellingen.
   Een badge mag geen afgehandelde taak blijven tonen of een uitvoerbare taak verbergen.
5. DOEL 2: probeer rol-/tenant-/ownershipoverschrijding, vreemde resource-id's,
   toegang tot privébestanden, verboden statusovergangen, races en ongeldige invoer.
   Verwacht gecontroleerde weigering/404/validatiefout, geen 500 of verboden mutatie.
   Controleer geldgrenzen, cent-grid, extreme strings, uploadgrenzen en injectie waar
   de onderzochte delta er aanleiding toe geeft. Beperk alles tot testdata.
6. Noteer basiscommit, omgeving, werkelijk uitgevoerde flows/probes en beperkingen.
   Per bevinding: rol, ernst, exacte repro, verwacht/werkelijk resultaat, geschonden
   invariant en codebewijs. Bewaar relevante screenshots zonder persoonsgegevens.
   Een niet-uitgevoerde browserflow staat als onbevestigd, niet als geslaagd.
7. Werk `docs/PERSONA-SWEEP-BACKLOG.md` bij met behoud van historie. Reconcile oude
   bevindingen met code/PR's; leg ook clean onderzochte oppervlakken vast. Eén kleine
   bewezen fix mag mee na draftclaim en dedup; overige fixes krijgen gerichte backlogitems.
   Neem geen geparkeerde juridische/productkeuzes over.
8. Volg het uitvoercontract voor checks, voortgang, rebase, PR en onafhankelijke review.
   Alleen na alle zes groene checks op actuele head mag `gh pr merge <nr> --squash --auto`.
   Geen self-review of bypass. Na twee mislukte pogingen dezelfde blocker vastleggen.
   Als niets is gewijzigd, rapporteer een echte no-op zonder een lege inhoudelijke PR.
