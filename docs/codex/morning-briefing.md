# Codex-werkprompt — Handslag ochtendbriefing

Bewijsdatum: 2026-09-11. Rechtstreeks gelezen Claude-schema: dagelijks **08:00
Europe/Amsterdam** (interface toont nu CEST); model Sonnet 4.6. De laatste geslaagde
gelezen briefing is van 10 september. Cleanup #1472 in de vervolghistorie verandert
de uitsluitend lezende routineprompt niet; de aanleiding van die vervolgopdracht is
niet vastgesteld. De sessie van 15 augustus, 08:06, is nu gelezen en gestopt: een
briefingbestand van 317 regels wachtte uitsluitend op artifactpublicatie; geen reporesultaat.

De Codex-coördinator plant deze vijfde werkstroom via zijn geconfigureerde twintigminutendispatch
met een duurzaam runregister. Gebruik een lokale kalenderdag in Europe/Amsterdam voor het
tijdslot, ook na de zomertijdwissel. De oude afzonderlijke Codex-cron blijft PAUSED.
Dit bestand activeert geen scheduler; een eerste geslaagde Codex-briefing is nog niet bewezen.

Maak een beknopte ochtendupdate voor de eigenaar in de bestaande taak. Lees uitsluitend
de actuele repository, GitHub-status en beschikbare uitvoeringsbewijzen:

1. Lees `docs/CODEX-ROUTINE-TAKEOVER.md`, `CURRENT_TASK.md`, de bovenste 100 regels van
   `PROGRESS.md`, recente persona-/securitybevindingen en relevante `MENSENWERK.md`-punten.
   Lees grote archieven alleen gericht. Nieuwere code, PR's en backlogs gaan vóór oude
   succesvolle websessies.
2. Controleer wat de afgelopen 24 uur is gebouwd en daadwerkelijk gemerged, welke PR's
   openstaan en hun actuele CI-/reviewstatus. Koppel uitkomsten aan PR/commit en vermijd
   dubbel tellen van dezelfde wijziging. Een push of aangevraagde auto-merge is geen merge.
3. Vat audits samen met hun werkelijke dekking, aangetoonde problemen en beperkingen.
   Meld mislukte, niet gestarte of op goedkeuring wachtende runs afzonderlijk; neem
   daarvan geen cleanclaim over. Controleer de dispatchuitkomsten in het runregister.
4. Benoem alleen concrete resterende acties voor de eigenaar, met reden en vindbaar
   bewijs. Onderscheid codewerk, externe configuratie en juridische/productbesluiten.
   Vermeld deploy/readiness uitsluitend wanneer die afzonderlijk zijn geverifieerd.
   Meld het verval van de review-API-sleutel vanaf zeven dagen vooraf: de huidige
   sleutel vervalt op **11 oktober 2026**, dus opnemen vanaf **4 oktober 2026** zolang
   vernieuwing niet bevestigd is. Meld geen sleutel- of accountgegevens. Het huidige
   ontbrekende API-tegoed is bewezen in reviewrun 34575468042; herhaal geen quotatest
   zonder bevestigde tegoedwijziging. De eigenaar vult betaalmethode/tegoed rechtstreeks
   bij OpenAI aan; betaalgegevens horen niet in de briefing of taak.
5. Lever een korte Nederlandse briefing: afgerond in 24 uur, open PR's en poorten,
   auditbevindingen, menselijke acties en eerstvolgende prioriteit. Bij geen nieuwe
   resultaten zeg je dat feitelijk. Neem geen secrets, persoonsgegevens of private
   routine-/sessielinks op.

Deze briefing opent geen PR, wijzigt geen repo, scheduler, GitHub-status of productie,
en verstuurt geen externe berichten. De coördinator registreert alleen de eigen
uitvoering en uitkomst in zijn runregister. Eventueel vervolgwerk vereist een passende
afzonderlijke opdracht of een toegestane bouwrun; begin het niet vanuit deze briefing.
