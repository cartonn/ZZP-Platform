# REVIEW-PROMPT.md — canonieke prompt voor een volledige kwaliteitsronde

> Plak de prompt hieronder 1-op-1 in een interactieve sessie wanneer je een volledige
> review + fix-ronde wilt (code + UX/UI, alle rollen). Dit is de verbeterde versie van
> "doe een review op de hele code en fix wat je vindt" — met de lessen van de rondes
> van 2-7 en 7-7-2026 erin verwerkt. Zusterdocumenten: ROUTINE-PROMPT.md (4-uurs
> auto-build), PERSONA-SWEEP-PROMPT.md (dagelijkse waakhond).

---

**Doe een volledige kwaliteitsronde op het ZZP Platform (code + UX/UI) en fix wat je
vindt.**

**Scope & dedup.** Review de code sinds de vorige kwaliteitsronde (check PROGRESS.md
voor de laatste; alles daarvóór alleen structureel, niet regel-voor-regel). Check
eerst `gh pr list` en de laatste commits op `origin/main` zodat je niets reviewt of
fixt wat al in-flight is.

**Review-vloot (parallel, read-only agents).**

1. **Domein-/lib-code** met focus op wat parallelle bouwers introduceren: duplicatie
   (nóg een dag-diff/euro-format/reminder-patroon), spiegel-implementaties die uit
   elkaar lopen, overlappende features, mutaties buiten de
   auth→rol→ownership→Zod→audit-keten, onbegrensde queries, cron-idempotentie.
2. **Security op de níeuwe oppervlakte**: sessieloze/publieke routes (rate-limiting!
   vergelijk met de bestaande limiter-patronen), webhooks (signature + idempotentie),
   erasure-echtheid (blijft PII achter in notificatie-bodies, dedupe-keys, exports?),
   IDOR/cross-tenant op nieuwe flows.
3. **Structurele tech-debt mét metingen** — geen mening zonder cijfer: build/bundle
   (aantal SSG-pagina's, First Load JS per route), guard-tests die meegroeien
   (hoe vaak herschreven in git log?), i18n-sprawl, dode code, schema-indexes,
   e2e-fragiliteit (hoeveel specs asserteren op letterlijke UI-strings?).
4. **UX per rol**: Playwright-walkthrough van álle rollen (zzp@, opdrachtgever@,
   franchise@, admin@ · demo1234) op de live test-omgeving — elke nav-route +
   detailpagina's, full-page screenshots, console-errors loggen. Daarna één
   persona-review per rol met TWEE opdrachten: (a) **regressie-check op de vorige
   ronde** (meld alleen wat níet meer klopt), (b) nieuwe verwarring, vooral op de
   sinds de vorige ronde gebouwde schermen. Criteria: 3-seconden-begrip, volgende
   actie duidelijk, jargon, tegenstrijdige signalen, dead-ends, kerstboom-effect
   (te veel signalen op één scherm), oordeel-zonder-data-meters.

**Fixen.** Rangschik alles op impact × zekerheid. SAFE-bevindingen fix je direct in
golven van 2-4 builders, elk:

- in een **eigen git-worktree** (`isolation: worktree` — gedeelde working tree wist
  elkaars werk, les 2-7),
- op **niet-overlappende bestanden** (benoem expliciet welke bestanden verboden zijn
  vanwege parallelle agents),
- increment ≤300 regels, unit-tests naast de code, e2e-asserties op geraakte teksten
  bijwerken (grep e2e/ vóór je hernoemt),
- door de volledige poort: typecheck + lint + test + prettier + build → PR →
  `gh pr merge --squash --auto` → `gh pr checks` alle 6 groen; bij agent-review-BLOCK
  max 2 fixpogingen, daarna PR open laten + blocker melden.

RISKY-bevindingen en beleidskwesties (afwijkingen van CLAUDE.md-instructies,
herontwerpen, schema-migraties met backfill) fix je **níet** — die rapporteer je met
een concreet voorstel als eigenaar-beslissing.

**Verifieer vermeende regressies eerst.** Als een persona zegt dat een eerdere fix
weg is: zoek de echte oorzaak in de code vóór je herbouwt (les 7-7: "tickets ontbreken
in acties-centrum" bleek een dode codepad — twee parallelle actie-engines — niet een
verdwenen feature; en "zijbalk-gaten" bleken al gefixt).

**Hygiëne.** Parallelle builders raken PROGRESS.md/CURRENT_TASK.md/docs níet aan; die
werk je zelf bij in één afrondings-PR. Ruim worktrees en stale branches op aan het
eind.

**Klaar =** alle SAFE-fixes gemerged (som PR-nummers + CI-uitkomst op), docs
bijgewerkt (kwaliteitsronde-sectie in PROGRESS.md, geparkeerde beslissingen in
CURRENT_TASK.md), en een eindrapport met: wat gevonden, wat gefixt, wat geparkeerd en
waarom, en welke beslissingen bij de eigenaar liggen.

---

## Waarom deze vorm (t.o.v. de ruwe prompt)

- **Dedup vóór bouwen** voorkomt dubbel werk met de 4-uurs-routines.
- **Meten vóór menen** (punt 3) vond op 7-7 de 833 kB/150-SSG-pagina's ontwerp-lab-bloat.
- **Regressie-check in persona-reviews** borgt dat eerdere fixes blijven staan én
  voorkomt herbouwen van wat er al is.
- **SAFE/RISKY-splitsing** houdt beleidsknopen bij de eigenaar.
- **Worktree-isolatie + verboden-bestanden-lijsten** zijn de twee lessen die
  parallelle builders betrouwbaar maken.
