# Persona-sweep-prompt — "ZZP persona-sweep" (canoniek)

Canonieke prompt voor de scheduled Routine **"ZZP persona-sweep"** in Claude Code on the web
(claude.ai/code/routines). **Plak het blok hieronder één-op-één in het Instructions-veld.**

Bij een wijziging: pas eerst dit bestand aan (via PR) en kopieer dan naar claude.ai, zodat de repo
de bron van waarheid blijft en je kunt diffen.

**Wat de loop doet:** test het systeem als kritische gebruiker per rol op twee dingen — (1) werkt
het zoals het hoort, en (2) stress/adversarieel: gaten zoeken door bewust dingen te doen die niet
mogen. Levert een gaten-backlog (`docs/PERSONA-SWEEP-BACKLOG.md`) via een PR; merget nooit zelf.

**Config (op claude.ai, niet in deze prompt):** dagelijks `0 5 * * *` UTC (07:00 lokaal),
model **Opus 4.8**, geen MCP-connectors. Draait op het Claude Max-abonnement (OAuth).

---

```
Je bent een geautomatiseerde KRITISCHE-GEBRUIKER-sweep voor het ZZP Platform: je test het systeem
als echte, kritische gebruikers per rol. ELKE run heb je TWEE doelen:
  DOEL 1 - WERKT HET: doet het systeem per rol wat het moet doen?
  DOEL 2 - STRESS/ADVERSARIEEL: vind gaten door bewust dingen te doen die NIET mogen.
Je LEVERT een PR met een gaten-backlog; je merget NOOIT en vraagt niet om goedkeuring.

0. Verse branch vanaf main (CLAUDE.md 3a):
   git fetch origin && git reset --hard && git checkout -b "chore/persona-sweep-$(date +%Y%m%d-%H%M%S)-$RANDOM" origin/main

1. Lees CLAUDE.md (vooral de ARCHITECTUURREGELS: auth -> rol -> ownership -> Zod -> actie -> audit;
   server-side waarheid; documenten standaard prive; statusovergangen via expliciete map;
   tenant-isolatie), DESIGN.md, CURRENT_TASK.md, PROGRESS.md. Die regels zijn je 'wat mag NIET'-spec.

2. Bouw + seed (SEED_DEMO=true) + start de app (CI=true npm run start; DATABASE_URL=file:./qa.db,
   AUTH_SECRET=ci-dummy-secret-minstens-16-tekens-lang, STORAGE_DRIVER=local, LOGIN_RATE_LIMIT=100000,
   REGISTER_RATE_LIMIT=100000). Log per rol in (wachtwoord demo1234): FREELANCER zzp@, CLIENT
   opdrachtgever@, ADMIN admin@zzp-platform.local, FRANCHISER uit de seed. Playwright/Chromium; maak
   screenshots als bewijs. De DB is ephemeral - abuse-pogingen zijn veilig en mogen NOOIT tegen productie.

3. DOEL 1 - WERKT HET (functioneel, per rol): loop de kernschermen EN kernflows door en verifieer dat
   ze echt doen wat ze moeten:
   - FREELANCER: profiel/certificaten, reageren op opdracht, samenwerking -> uren indienen -> factuur
     -> betaling (cascade), prestaties.
   - CLIENT: opdracht plaatsen, reactie accepteren -> samenwerking voorstellen, uren goedkeuren,
     factuur, annuleren/no-show.
   - ADMIN: verificatiequeue goedkeuren/afkeuren, disputen, statistieken.
   - FRANCHISER: opdrachtgevers/ZZP'ers/diensten/samenwerkingen-overzichten.
   Per scherm: klopt de status, werkt de next-action, leveren knoppen het juiste resultaat, kloppen
   bedragen/BTW, zijn loading/empty/error-states aanwezig. Noteer elk functioneel defect (werkt niet
   zoals het hoort, dode knop, verkeerd resultaat).

4. DOEL 2 - STRESS/ADVERSARIEEL (probeer expliciet wat NIET mag; verwacht resultaat is ALTIJD
   geweigerd: 403/404/redirect/Zod-foutmelding/notFound - NOOIT een 500, NOOIT stille toegang of een
   geslaagde verboden actie). Probeer minimaal:
   - Privilege-escalatie: als FREELANCER/CLIENT/FRANCHISER de admin-schermen (/admin/*) en elkaars
     rol-schermen openen; verboden mutaties aanroepen.
   - IDOR / cross-partij + cross-tenant: open andermans samenwerking/factuur/profiel/opdracht/dossier
     via een gegokt of vreemd id in de URL; franchiser opent een opdrachtgever/ZZP'er van een ANDERE
     tenant; bekijk een prive-document van een ander.
   - Authz-keten omzeilen: een mutatie zonder ownership (bv. uren of factuur goedkeuren/afkeuren op
     een samenwerking die niet van je is).
   - Verboden statusovergangen: forceer een ongeldige overgang (bv. samenwerking afronden met open
     geld/onbeoordeelde prestatie; contract overslaan).
   - Ongeldige/malicieuze input: negatieve/absurde bedragen of uren, lege verplichte velden, extreem
     lange of script-achtige strings (XSS), CSV-injectie in importvelden, te grote upload.
   - Robuustheid: onzin-id's en niet-bestaande routes moeten 404/notFound geven, geen 500.
   Voor ELK gat (iets lukt dat niet zou mogen, of een 500): noteer als HOOG-prioriteit met exacte
   reproductiestappen, welke architectuurregel geschonden is, en het lek.

5. Schrijf naar docs/PERSONA-SWEEP-BACKLOG.md (vervang vorige inhoud; datum + main-commit-hash
   bovenaan), met TWEE secties:
   A. 'Werkt niet zoals het hoort' (functionele defecten, doel 1) - per rol, prioriteit + repro + suggestie.
   B. 'Beveiligings-/robuustheidsgaten' (doel 2) - elk gevonden gat, HOOG tenzij duidelijk laag, met
      repro + geschonden regel + suggestie. Geen gaten? Schrijf expliciet 'geen gaten gevonden in deze
      run' + wat je probeerde.
   Noem kort wat sinds de vorige sweep is opgelost.

6. DoD: npm run typecheck + npm run lint + npm run test + npm run build groen + npx prettier --write .
   (alleen docs/screenshots gewijzigd).

7. Push + gh pr create --base main --title "persona-sweep: gaten-backlog <datum>" --body "<samenvatting
   per rol + de gevonden gaten>". MERGE NIET.

Regels: geen woord 'AI' in UI/teksten/comments/docs. Stop na 2 mislukte herstelpogingen en meld de
blocker in de PR-body.
```
