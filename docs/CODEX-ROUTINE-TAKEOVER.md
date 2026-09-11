# Overdracht van de Handslag-routines aan Codex

Begonnen op **10 september 2026**; bewijs bijgewerkt op **11 september 2026**.
Status: **vijf schema's overgenomen, oude uitvoerders gepauzeerd, één Codex-coördinator
actief; eerste geslaagde runs en vervangende reviewintegratie nog niet volledig bewezen**.

De eigenaar heeft op 10 september gevraagd alle actieve routines van Handslag / ZZP Platform
over te nemen, omdat het Claude-abonnement stopt. Deze opdracht autoriseert de overname;
het document bewijst op zichzelf niet dat een scheduler is ingesteld of een run is geslaagd.

## Wat is vastgesteld

De repo, canonieke prompts, actuele backlog, gerichte juni–septemberhistorie en recente
GitHub-PR's zijn gelezen. Op 10 september verhinderde een vergrendelde Mac nog directe
inspectie. **Op 11 september zijn alle vijf actieve Claude-routineconfiguraties, volledige
prompts en laatste runs rechtstreeks in de Claude-interface gelezen.** Onderstaande
schema's vervangen de eerdere schattingen uit branchmetadata.

| Werkstroom        | Rechtstreeks gelezen schema                                  | Laatste geslaagde run in de gelezen webhistorie                 |
| ----------------- | ------------------------------------------------------------ | --------------------------------------------------------------- |
| ZZP auto-build    | 00:22, 04:22, 08:22, 12:22, 16:22 en 20:22 UTC               | 10 september: #1473, merge bevestigd                            |
| ZZP persona-sweep | 05:00 en 13:00 UTC                                           | 9 september: #1451, badgevolgorde                               |
| Security/privacy  | 02:00 en 14:00 UTC                                           | 10 september: #1468, cleanronde                                 |
| Productierijpheid | 03:00 en 15:00 UTC                                           | 9 september: #1453, Dependabot                                  |
| Ochtend-update    | 08:00 Europe/Amsterdam; interface toont momenteel 08:00 CEST | 10 september: briefing; vervolghistorie bevat ook cleanup #1472 |

De eerste vier Claude-configuraties gebruiken Opus 4.8, de ochtend-update Sonnet 4.6.
Alle vijf stonden bij de eerste inspectie **Active**, maar hun laatste runs waren mislukt
omdat het abonnement is uitgeschakeld. Na overname zijn ze elk via Enabled → Off gezet
en is de status **Paused** per routine geverifieerd. Active was dus geen bewijs van
werkende uitvoering. De ochtendprompt is uitsluitend lezen en rapporteren; uit de
latere cleanup #1472 volgt geen mutatiebeleid, omdat de aanleiding in de vervolgopdracht
niet is vastgesteld. Privéroutine- en sessielinks worden niet in deze publieke repo opgenomen.

De repo-backlogs van 10 september zijn nieuwer dan delen van deze succesvolle webhistorie
en blijven leidend voor open werk; bijvoorbeeld persona #1471 en productiewerk #1469
mogen niet opnieuw worden gebouwd. UTC-schema's blijven UTC, ook na de zomertijdwissel.
Alleen de ochtend-update volgt 08:00 lokale tijd in Europe/Amsterdam.

## Schedulerovergang: bewezen en nog open

Van de vijf oudere Codex-automations is de bouwcoördinator daadwerkelijk gewijzigd naar
een **ACTIVE heartbeat in de huidige thread**, genaamd **Handslag · vijf overgenomen
routines**. De overige vier oude cron-automations blijven **PAUSED**. Eén actieve
heartbeat per thread betekent hier dat de coördinator alle
vijf werkstromen moet aansturen; vijf actieve afzonderlijke schedulers zijn niet aangetoond.

De geverifieerde coördinatorconfiguratie gebruikt een interval van twintig minuten en
bevat alle vijf bovenstaande schema's, inclusief de uitsluitend lezende ochtendbriefing.
De dispatchprompt schrijft voor dat de coördinator een duurzaam runregister controleert en
alleen vervallen, nog niet geclaimde werkstromen start. Leg per werkstroom en gepland
tijdslot de claim, start, afloop, uitkomst en bewijsreferentie vast.
Een hervatting mag hetzelfde slot niet dubbel uitvoeren. Twintigminutendispatch benadert
de geplande tijden binnen die interval; het biedt geen garantie op exacte starttijden.
De dispatchprompt is bijgewerkt en de actieve configuratie is teruggelezen. De werking
van dispatch en runregister en een geslaagde eerste uitvoering per werkstroom moeten
nog afzonderlijk worden bewezen; de configuratie alleen bewijst dat niet.

Na het bijwerken van de Codex-prompt zijn alle vijf Claude-routines daadwerkelijk
gepauzeerd en afzonderlijk als **Paused** geverifieerd. De GitHub-bouwworkflow
`auto-build.yml` stond al bevestigd op **disabled_manually** en blijft uit. Ook de
Claude-workflow `swarm.yml` is nu uitgeschakeld en teruggelezen als **disabled_manually**.
Er zijn geen beschermde checks uitgeschakeld.

De onafhankelijke PR-review in `.github/workflows/pr-review.yml` wordt naar Codex
omgezet. **Bij de eerste overnamecontrole ontbrak de API-sleutel. Op 11 september is
dit na expliciete gebruikersbevestiging hersteld:** `OPENAI_API_KEY` is bevestigd als
repositorysecret, met Restricted-rechten voor alleen **List models: Read** en
**Responses: Write**, geldig tot en met **11 oktober 2026**. De sleutelwaarde en
accountgegevens horen nooit in deze publieke documentatie.

**Historie van de eerste proef: ontbrekend API-tegoed.**
[reviewrun 34575468042](https://github.com/cartonn/ZZP-Platform/actions/runs/34575468042)
op PR #1475, head `8be0b39ab270d9e826a90bbf2dce14d90d9a6314`, is afgerond. Voorbereiding,
aanwezigheidscontrole van de sleutel en checkout slagen; de officiële Codex Action
installeert en start. OpenAI antwoordt: **“You have no credits remaining. Add credits
to continue using the API”**. De eindvalidator registreert **INCOMPLETE**, met
`REVIEW_AUTHENTICATED=true`; er is geen inhoudelijke review uitgevoerd. Dit bewijst
de toenmalige tegoedblokkade en de foutafhandeling, niet een geslaagde review.

**Vervolg op 11 september:** de eigenaar heeft API-tegoed toegevoegd; beschikbaarheid
is in de interface geverifieerd. Daarna is
[reviewrun 34576381918](https://github.com/cartonn/ZZP-Platform/actions/runs/34576381918)
gestart op #1475 head `5acadf8790f34570db3575f68eaa067aeaf77f64`. De zichtbare modeluitvoer
geeft BLOCK: bij een dispatch vanaf de PR-head kwamen ook reviewcontroles uit die head.
Na die uitvoer was de Action nog niet afgesloten; dit is geen geslaagde reviewpublicatie.
De integratie wordt hersteld met een vertrouwde workflow en afzonderlijk beoordeeld
PR-bronmateriaal. De actuele herbeoordeling volgt uit de GitHub-run en SHA-gebonden check; geplande runs
uit het duurzame runregister van de coördinator. Leid geen nieuwe quotablokkade af uit
de oude proef. Bij een nieuwe quotafout: niet herhaald testen zonder bevestigde wijziging.
Meld sleutelverval vanaf zeven dagen vooraf in de ochtendbriefing. Behoud de verplichte
`agent-review`-poort zonder gefingeerde PASS; saldo en account-/billinginstellingen
worden niet in deze publieke repo vastgelegd.
De reguliere productietaken, monitor, expiry-check, dependencycontrole en herstel-drill zijn afzonderlijke
operationele workflows; zet deze niet uit uitsluitend omdat Claude stopt.

Twee oude wachtende sessies zijn gelezen en met Cancel run gestopt. Persona-sweep van
8 september, 15:10 lokale tijd, had alleen een QA-fontshim en drie audits in afwachting
van Bash-goedkeuring. Ochtend-update van 15 augustus, 08:06, had een briefingbestand van
317 regels en wachtte uitsluitend op artifactpublicatie; er was geen reporesultaat.
Daarna was geen melding dat een run op de gebruiker wacht meer zichtbaar en stonden
de routines op Paused. Deze sessies tellen niet als afgeronde audit, gepubliceerd artifact
of bouwwerk; voer hun oude opdrachten niet blind opnieuw uit.

## Bronnen en gezag

- Actuele code, de huidige remote PR-/checkstatus en aantoonbare deploygegevens bepalen wat af is.
- `CURRENT_TASK.md` bevat het huidige werk; `PROGRESS.md` bovenste 100 regels en
  `docs/progress/` bewaren de uitvoering. Lees oudere geschiedenis gericht, niet integraal.
- `CLAUDE.md`, `AGENTS.md`, `SWARM.md`, `ARCHITECTURE.md` §0 en `DESIGN.md` geven context en
  invarianten. De naam van een document maakt de inhoud niet actueel.
- Het eigenaarbesluit van 24 juni, vastgelegd in `CLAUDE.md` en `CURRENT_TASK.md`, autoriseert
  zelfstandig samenvoegen **na alle groene poorten**. Oudere “nooit zelf mergen”-regels in
  routineprompts en ADR-0001 beschrijven een eerdere werkafspraak.
- De eigenaar beperkte routines op 2 september tot kern en robuustheid. Oude fiscale en
  overhaul-backlogs verruimen die scope niet. Latere concrete gebruikersopdrachten, zoals
  Handslag V5 en goedkeuringszegels, zijn zelfstandige autorisatie binnen hun eigen scope.

Bewaar oorspronkelijke prompts en geschiedenis. Deze overdracht voegt een expliciete
vertaling naar Codex toe; ze wist geen oude afspraken, bevindingen of bewijsstukken.

## Scope en vaste invarianten

Kern: certificaatdossier, verificatie en verloop; uren → ORT → prestatie → factuur;
next-action-engine; DBA-monitor; tenantcockpit voor bemiddelaars. Verder toegestaan:
bewezen bugs, security/privacy, performance, betrouwbaarheid en toegankelijkheid.

Voor nieuwe productfunctionaliteit is een concrete bron nodig: supportticket, klantnotitie,
persona-bevinding of een backlogitem met klantbron. Noteer wie het probleem heeft en waar
dat blijkt. Zonder bron alleen bugs/robuustheid. Geen fiscale uitbreiding, academie,
ideeënbus, designlab, nieuwe rollen/prijslijnen of vertaalprogramma vanuit een routine.

Behoud server-side waarheid; auth → rol → ownership/tenant → Zod → mutatie → audit;
expliciete statusovergangen en transactiebewaking; privé-documenten; geld in integercenten
met de twee gedocumenteerde eurovelden; geschilbevriezing; idempotente taken. Goedkeuringszegels
volgen effectieve serverstatus: zwart in afwachting, oranje na goedkeuring; geen zegel voor
afgewezen of verlopen bewijsstukken. `DESIGN.md` is de gedeelde vormgevingsbron.

## Uitvoercontract voor iedere bouwrun

1. Lees de actuele context en controleer gitstatus. Bewaar bestaande gebruikerswijzigingen.
   Fetch `origin` en maak een **nieuwe schone worktree en unieke featurebranch vanaf
   `origin/main`**. Gebruik geen `reset --hard`, force-push of hervatte verzamelbranch.
2. Controleer open en recente gesloten/gemergde PR's, circa 30 commits op `origin/main`,
   backlogmarkeringen en de echte code. Sla af, geparkeerd of al geclaimd werk over.
3. Kies één klein increment. Claim het vóór implementatie met een draft-PR die de bron,
   scope en beoogde bestanden noemt. Als een lege claimcommit geen PR-diff oplevert,
   voeg dan een korte, feitelijke claim aan de voortgang toe; verzin geen codewijziging.
4. Delegeer alleen onafhankelijk werk met expliciet bestandsbezit. De lead integreert,
   verifieert en commit; werk aan overlappende bestanden achtereenvolgens.
5. Draai lint, typecheck, unit/integratietests, build en formattingcontrole. Lees de
   volledige samenvatting, inclusief failures/skips. E2e is een echte CI-poort; een lokaal
   browserprobleem heft die eis niet op. Tests met misbruikinput draaien uitsluitend
   tegen geïsoleerde testdata, nooit tegen productie.
6. Werk voortgang en backlog feitelijk bij. “Gebouwd”, “CI groen”, “gemerged” en “live
   geverifieerd” zijn verschillende statussen. Archiveer oudere voortgang met behoud van
   inhoud; richtlijnen: `PROGRESS.md` ≤400 regels, `CURRENT_TASK.md` ≤300 regels.
7. Fetch/rebase voor integratie en push. Behoud beide kanten van geldige docs-conflicten
   met deduplicatie. Maak de draft gereed en verifieer checks op de **actuele PR-head-SHA**.
8. Alle zes verplichte checks moeten slagen: `check`, `e2e`, `audit`, `secret-scan`,
   `CodeQL`, `agent-review`. Aanvullende relevante checks, waaronder migraties, ook oplossen.
   Onafhankelijke review mag niet door de bouwer als groen worden verklaard.
9. Na groen: `gh pr merge <nr> --squash --auto`. Geen admin-bypass, geen uitschakeling van
   branchbescherming. Een push of queued auto-merge is nog geen mergebewijs. Controleer
   de uiteindelijke merge en de bedoelde Railway-release afzonderlijk.
10. Maximaal twee gerichte herstelpogingen voor dezelfde blocker. Daarna PR openlaten
    met oorzaak, bewijs en volgende noodzakelijke stap; ander onafhankelijk werk mag door.
    Een startfout of budgettekort van de reviewer is geen inhoudelijk oordeel over de diff.

Als geen geschikt item bestaat, registreer een feitelijke no-op-uitkomst in de routine.
Maak geen lege inhoudelijke PR en bouw niets om alleen aan een productiequotum te voldoen.

## Onafhankelijke review bij de overdracht

De naam `agent-review` en de beschermde mergepoort blijven bestaan. De vervangende reviewer
moet een aparte, adversariële beoordelaar zijn die de wijziging niet heeft gebouwd; behoud
de bestaande eis van functiescheiding en een afzonderlijk sterk reviewmodel. Beoordeel de
diff tegen de actuele base/head-SHA met controleerbaar bewijs. Nieuwe commits maken een
oude goedkeuring ongeldig. Een conceptprompt verleent geen statusrecht en bewijst niet
dat de vervangende integratie al werkt. Publiceer het oordeel uitsluitend via de daarvoor
ingerichte, vertrouwde integratie; nooit een gefingeerde groene check plaatsen.

De workflow, validator, schema en prompt komen uit de exacte vertrouwde workflow-SHA.
Normale reviews draaien via `pull_request_target`; handmatige retries uitsluitend via
beschermde `main`. Een afzonderlijke bevroren bootstrapbranch maakt de eerste migratie
mogelijk: volledige controls vooraf onafhankelijk beoordelen, SHA buiten de PR vastleggen
in `CODEX_REVIEW_BOOTSTRAP_SHA`, updates/deleties zonder bypass blokkeren en de effectieve
bescherming verifiëren. Deze uitvoeringsbasis is geen PR-goedkeuring. De vertrouwde
voorbereidingsjob maakt vóór de modelrun een echte `agent-review`-check op de actuele
PR-head; de publicatiejob werkt dezelfde check alleen na volledige validatie bij. Controleer run/attempt, control-SHA,
check-ID en modelrapport naast de zes poorten. Verwijder de bootstrapvariabele na de
migratie. De concrete procedure staat in `.github/codex/README.md`.

De modeljob gebruikt rechtstreeks de officiële Responses API met GPT-5.5/high. Alleen
bronlezen via vooraf gecatalogiseerde Git-objecten is beschikbaar; het model heeft geen
shell of schrijfgereedschap. De eerdere officiële CLI/Action bleef na einduitvoer hangen,
ook met de tijdelijke procespatch. Run `34581684896` toonde PASS-tekst maar publiceerde
na annulering terecht INCOMPLETE met een leeg rapport. De directe API vervangt die
uitvoerder; de onafhankelijke review en alle beschermde checks blijven vereist.

## Concrete overdracht: repo-opname 10 september, review aangevuld 11 september

- PR **#1474**, Handslag V5-platform inclusief goedkeuringszegels, staat open op head
  `edd689a0ef313f216daefee4a24ac2119c0a14c4`. Bij de inspectie slaagden `check`, `e2e`
  (alle vier shards), `audit`, `secret-scan`, `CodeQL` en `migrations`. Alleen `agent-review`
  faalde. E2e eindigde om 18:50:21 UTC. Hercontroleer vóór een besluit; dit is een momentopname.
- De onafhankelijke Codex-review van precies die #1474-head gaf **BLOCK**: oranje
  goedkeuringszegels bleven zichtbaar bij een dispuut en de nieuwe elevatieschaduw verborg
  de toetsenbordfocus van het actieve zijbalkitem. Gerichte tests: 44/44 groen; focusprobleem
  bevestigd in Chromium. De reparaties zijn daarna onafhankelijk in de werkboom
  herbeoordeeld: beide blockers hersteld, acht gerichte suites met 88 tests groen en
  zichtbare focus-outline in Chromium bij licht en donker. Die hercontrole is nog geen
  definitief oordeel op een nieuwe PR-head: commit, actuele SHA en CI moeten eerst
  vaststaan. Geen van deze lokale uitkomsten mag als ongefundeerde groene check worden geplaatst.
- De twee V5-reparaties zijn vastgelegd in `fb4938bf3edbf74cccd6224cb4de22f6bcb5d9b1`
  op dezelfde PR #1474. De volledige lokale controle met beide wijzigingenpakketten
  slaagde: lint, typecheck, 8.690 tests (2 bestaande skips), productiebuild en volledige
  Prettier-controle. De negen dependency-vrije reviewvalidatietests slagen ook in de
  afzonderlijke overnameworktree. De onafhankelijke reviewer heeft daarna ook de twaalf
  reparatiebestanden op deze exacte commit beoordeeld: beide blockers hersteld, geen
  nieuwe blocker.
- **GitHub-checks bevestigd op 11 september:** op #1474 head
  `fb4938bf3edbf74cccd6224cb4de22f6bcb5d9b1` en #1475 head
  `8be0b39ab270d9e826a90bbf2dce14d90d9a6314` zijn alle normale CI-checks groen:
  `check`, `e2e` met vier shards, de PostgreSQL-e2e, `audit`, `secret-scan`, `CodeQL`
  en `migrations`. Alleen de verplichte `agent-review` ontbreekt of faalt. De
  hierboven gelinkte proefreview op #1475 eindigde aantoonbaar INCOMPLETE door ontbrekend
  API-tegoed; normale CI-groen is geen vervanging voor deze onafhankelijke poort.
  Dit is een momentopname op de genoemde SHA's, geen checkclaim voor volgende commits.
- #1473 factuurgoedkeuringsherinneringen dag 3/7 + admin-escalatie is gemerged.
  #1471 dormant-bench-badge, #1470 ORT-renderguards, #1469 secretvergelijking,
  #1467 tegenpartijfilter en #1453 Dependabot eveneens. Niet opnieuw bouwen.
- #1472 heeft achtergebleven PR-werk geïntegreerd. De titel noemt zes PR's; de body noemt
  zeven inclusief #1436. Controleer code en mergegeschiedenis, niet alleen titels.
- Er staan elf Dependabot-PR's open: #1454–#1464. Beoordeel samenhang en incompatibele
  majors; een updatevoorstel is geen toestemming om blind versies te combineren.
- Eerstvolgend concreet klein backlogitem: **duurzame, zelfherstellende admin-next-action
  voor geëscaleerde prestatiegoedkeuring**, met badgepariteit (`CURRENT_TASK.md`, techniek 6a).
  De factuurvariant 6b is al gebouwd in #1473. Dedup opnieuw bij aanvang.
- Grotere open onderwerpen: signaalsnapshot per gebruiker, factuurstatus-cutover,
  resterende e2e/server-actionworkarounds, mail-intake-e2e en bewezen performancefan-out.
  Splits ze; haal geen geparkeerde productbesluiten binnen een routine.
- Laatste personasweep 10: één badgecorrectie, geen nieuwe geparkeerde gaten. Laatste
  securityronde 7: geen nieuwe exploiteerbare gaten. De publieke individuele-reviewprivacy
  blijft een eigenaar-/juristafweging vóór echte productie; een oude cleanronde is geen garantie.
- Demo is geen echte productiegeschiktheid. Juridische review, echte integraties en secrets
  behouden hun eigen beslispunten. De backuptekst “nog te publiceren” is achterhaald door
  de merge van #1419; object-readback/heartbeat en daadwerkelijk databaseherstel moeten
  afzonderlijk met operationeel bewijs worden vastgesteld.

## Bekende documentdrift en afronding

`CLAUDE.md` bevat tegelijk oude direct-main- en nieuwe PR-regels; de routineprompts verbieden
nog zelfmerge. De actuele workflow hierboven volgt de latere eigenaarafspraak. De
15-minuten-GitHub-bouwer verwijst naar oude overhaulfasen. Persona werd breder dan de oude
prompt: ook badge/list-pariteit en bewezen fixes horen inmiddels bij de uitvoering.
`PROGRESS.md` telt bij inspectie 584 regels; persona- en securitybacklogs ruim 6.000 en
7.000. Bewaar deze geschiedenis en lees per run alleen relevante delen.

Codex-promptbronnen: [auto-build](codex/auto-build.md), [persona-sweep](codex/persona-sweep.md),
[security](codex/security.md), [productierijpheid](codex/production-readiness.md) en
[ochtendbriefing](codex/morning-briefing.md). [Onafhankelijke review](codex/independent-review.md)
is de afzonderlijke mergepoort. De bestanden zelf activeren geen scheduler.

De oorspronkelijke schedules zijn gelezen, de oude uitvoerders zijn gepauzeerd en één
Codex-coördinator is geverifieerd actief. Het beperkte `OPENAI_API_KEY`-repositorysecret
is toegevoegd en de eigenaar heeft op 11 september tegoed aangevuld. Volledig werkende
uitvoering blijkt vervolgens uit aantoonbare dispatch met runregister, een geslaagde
eerste Codex-run per werkstroom en onafhankelijke review op de actuele PR-head.
Controleer daarvoor GitHub en het runregister; deze opname bevestigt nog geen eerste
volledige uitvoering. Noteer per onderdeel datum, uitkomst en bewijs.
