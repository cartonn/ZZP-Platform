# CLAUDE.md — ZZP Platform

Dit bestand is de **persistente context** voor Claude Code. Lees dit aan het begin
van elke sessie. Het beschrijft wat we bouwen, hoe, en welke regels niet-onderhandelbaar zijn.

> Werkwijze: lees ook altijd `CURRENT_TASK.md` (wat we NU doen) en `PROGRESS.md`
> (wat al af is). Update beide aan het einde van elke sessie. Dit voorkomt
> context-overflow en drift over grote sessies.

---

## AUTO-MODE — continu doorbouwen (niet-onderhandelbaar)

De eigenaar wil dat agents **continu doorbouwen zonder te vragen**. Elke sessie/agent
werkt volgens dit contract:

1. **Doorgaan zonder te vragen.** Pak de volgende taak uit de backlog in `CURRENT_TASK.md`.
   Stop niet voor goedkeuring; lever af, commit, pak de volgende. Vraag alleen bij
   échte tweesprongen (data-verlies, risicovolle git-acties, juridische keuzes).
2. **Eén bron, automatische deploy.** Ontwikkel en push naar branch
   **`main`**. Railway bouwt **deze** branch automatisch
   (Dockerfile → PostgreSQL) en zet hem live op `zzp-platform-production-*.up.railway.app`.
   Push nooit naar een andere branch zonder expliciete toestemming.
3. **Meerdere agents tegelijk.** Er pushen mogelijk meerdere agents naar dezelfde branch.
   **Altijd `git fetch` + rebase/pull vóór elke commit én vóór elke push.** Bij
   non-fast-forward: rebasen, niet force-pushen. Gebruik subagents (Explore/parallel)
   voor research en onafhankelijk werk; integreer en commit zelf.
4. **Definition of Done per increment (geen uitzonderingen):** testbare kern + unit-tests →
   UI → `npm run typecheck` + `npm run lint` + `npm run test` + `npm run build` +
   `npx prettier --write .` groen → commit → push → **PR + CI-poort geverifieerd groen
   (`gh pr checks <nr>`)**. **E2e draait automatisch in CI** (Playwright met bundled
   Chromium, project `ci`). Screenshots worden als artifacts geüpload. Nooit afvinken op
   "ziet er goed uit" of "git status is schoon" — een PR is pas af als de CI-poort groen is.
5. **Productiekwaliteit, geen slop.** Deterministisch, server-side waarheid. Geen dode
   knoppen. **Het woord "AI" komt nergens in de UI, teksten, comments of docs voor.**
6. **Houd het geheugen actueel.** Werk `PROGRESS.md` (wat af is) en `CURRENT_TASK.md`
   (huidige taak + backlog) bij na elke increment, zodat de volgende sessie/agent
   naadloos verderkan.

> Echt 24/7 draaien gebeurt via de scheduler/automation van de eigenaar (bv. de
> "Swarm Coordinator" of `/loop`); een enkele sessie is eindig. Dit contract zorgt dat
> elke sessie/agent hetzelfde, autonoom, in dezelfde richting doorbouwt.

---

## Rolverdeling, veiligheid & geheugen (zwerm)

- **Gespecialiseerde subagents** staan in `.claude/agents/` (planner, builder, tester,
  reviewer, security, devops, docs). De lopende sessie is de **orchestrator**: splitst werk,
  delegeert naar 2–4 workers op niet-overlappende bestanden, integreert en draait de checks.
  Zie `SWARM.md` voor het volledige contract en `docs/decisions/0002-agent-architecture.md`.
- **Pijplijn:** Taak → Plan → Build → Test → Review → (Draft) PR → menselijke goedkeuring → Deploy.
  CI (`ci.yml`) + `pr-review.yml` (reviewer + security) vormen de poort; **agents mergen nooit zelf**.
- **Veiligheidsregels (hard):** nooit naar `main` pushen zonder toestemming; geen secrets in
  git/log/code; auth nooit uitschakelen; **geen automatische productie-deploy** (zie
  `docs/decisions/0001-deploy-gating.md`); **stop na 2 mislukte herstelpogingen** en meld de blocker.
- **Kleine PR's** (richtlijn 100–300 regels), één taak per branch/worker.
- **Geheugen:** leg betekenisvolle keuzes vast als ADR in `docs/decisions/` (`0000-template.md`).
  Naast CLAUDE.md / SWARM.md / CURRENT_TASK.md / PROGRESS.md / MENSENWERK.md.

---

## Wat we bouwen

**ZZP Platform** — een productiegericht SaaS-platform voor de Nederlandse markt waar
zelfstandigen (ZZP'ers), opdrachtgevers en admins samenkomen. Kernwaarde:
opdrachten matchen + **certificaten/diploma's verifiëren** + documenten veilig beheren.

Dit wordt een echt product met betalende klanten en **gevoelige documenten**
(VOG, diploma's, verzekeringsbewijzen). Kwaliteitslat: snel, strak, betrouwbaar,
veilig, onderhoudbaar. Geen demo, geen slop.

Drie rollen: **FREELANCER** (ZZP'er), **CLIENT** (opdrachtgever), **ADMIN**.

**Noord-ster (kwaliteitslat).** Benchmark: platforms als **Pidz** (zorg-ZZP) — maar op elk vlak
beter: UX/UI, matching, design, architectuur. Uber/SaaS-niveau: **alle complexiteit verdwijnt
naar de achtergrond**, het systeem toont alleen wat telt en wat actie vraagt, ziet er clean/strak
uit en werkt foutloos. Differentiatie = verklaarbare matching (`matching.ts` reasons), de
next-action-engine (`next-actions.ts`), verificatie + vertrouwensniveau, en Wet-DBA/AVG-compliance.
Elke increment brengt ons dichter bij die lat; nooit eronder zakken.

---

## Tech stack (vast — niet wijzigen zonder reden)

- Next.js 15 (App Router) + React 19 + TypeScript (strict)
- Prisma ORM — **SQLite lokaal, PostgreSQL in productie** (provider-switch)
- Auth.js (NextAuth v5) — credentials + JWT, role-based access control
- Zod — server-side validatie, één bron van waarheid
- Tailwind CSS + Radix primitives + Lucide icons
- Vitest (unit) + Playwright (e2e)

---

## Designfilosofie (hard)

> **Canoniek designsysteem: [`DESIGN.md`](./DESIGN.md)** — tokens, primitives, layout-/breedte-schema,
> status-badge-taal en Do's/Don'ts. Lees + volg dat vóór elke UI-wijziging; drift = bug.

Leer van Linear/Vercel/Stripe. Refined minimalism, geen drukte.

- Rustig, compact, premium. Hoge informatiedichtheid zonder rommel.
- Dashboard-first. **Geen marketinghomepage als hoofdscherm.**
- Strakke tabellen, lijsten, detailpanelen, drawers.
- Consistente statuschips, badges, tabs, focus states, keyboard nav.
- Geen decoratieve gradients. Geen kaart-in-kaart. Geen templategevoel.
- Elke pagina beantwoordt direct: _Wat is de status? Wat moet ik nu doen?
  Wat is de volgende beste actie? Kan ik dit vertrouwen?_
- **UI-taal = Nederlands.** Code = Engels.
- Elke view heeft loading-, error- én empty-states. Tekst valt nooit buiten knoppen/cards.

---

## Architectuurregels (niet-onderhandelbaar)

1. **Server-side is de waarheid.** Geen enkele kritieke status (verificatie, expiry,
   toegang, feature-limiet) wordt client-side bepaald. Client mag tonen, nooit beslissen.
2. **Elke mutatie checkt:** auth → rol → ownership → Zod-validatie → actie → audit log.
   Gebruik de helpers in `src/lib/authz.ts`. Nooit een mutatie zonder deze keten.
3. **Statusovergangen via expliciete map.** Credentials volgen `CREDENTIAL_TRANSITIONS`
   in `src/lib/enums.ts`. Ongeldige overgang (bv. DRAFT→VERIFIED) moet worden geweigerd
   door `assertTransition`. Geen losse status-updates.
4. **Documenten zijn standaard privé.** Storage via de abstractie in
   `src/lib/services/storage.ts` (lokaal → .gitignore'de map, prod → S3). Nooit een
   geüpload document in git of op een publiek pad. Upload altijd valideren (type, grootte).
5. **Audit alles wat telt.** Verificatiebeslissingen, rol-/statuswijzigingen,
   document-toegang → `src/lib/audit.ts`.
6. **Enums als strings + Zod.** Eén schema draait op SQLite én Postgres. Geen native db-enums.
7. **Geen scope-creep.** Bouw wat in `CURRENT_TASK.md` staat. Niets erbij verzinnen.

---

## Datamodel (kern — zie prisma/schema.prisma voor het volledige)

User, Account, Session · FreelancerProfile, Company · Skill, Industry (+ koppeltabellen)
· Job, JobSkill, JobCredentialRequirement · Application · Conversation, Message
· Document · Credential, CredentialVerification, VerificationRequest · Collaboration
· Invoice, InvoiceLine · Notification · Plan, Subscription · AuditLog

---

## Verificatieflow (de kerndifferentiatie — bouw dit zorgvuldig)

1. ZZP'er uploadt bewijsstuk → validatie (type/grootte) → status `SUBMITTED`.
2. Admin opent verificatiequeue (`/admin/verificaties`).
3. Goedkeuren → `VERIFIED`, `verifiedAt` gezet, audit log, notificatie naar ZZP'er.
4. Afwijzen → `REJECTED`, **reden verplicht** (server-side afgedwongen), notificatie + herstelactie.
5. Verlopen → server-side `EXPIRED` (alleen een VERIFIED-credential kan verlopen).
6. Opdrachtgever ziet compliance-status; ontbrekend/verlopen vereist certificaat = waarschuwing.

---

## Definition of Done (per taak)

Een taak is pas af als:

- `npm run typecheck` slaagt (geen TS-fouten)
- `npm run lint` slaagt
- `npm run test` groen (relevante unit-tests geschreven én slagend)
- `npx prettier --check .` slaagt (formatting)
- E2e draait automatisch in CI (Playwright `--project=ci`). Screenshots als artifacts.
- Loading/error/empty-states aanwezig
- `PROGRESS.md` bijgewerkt, `CURRENT_TASK.md` doorgeschoven naar de volgende taak
- **CI-poort geverifieerd groen.** Bij een PR is "af" pas waar als de daadwerkelijke
  CI-uitkomst groen is — controleer met `gh pr checks <nr>` en citeer die uitkomst.
  Een schone werkboom (`git status` clean) of groene lokale checks zijn **niet** voldoende
  bewijs; CI draait extra poorten (o.a. `check:env`, `prettier --check .` over de hele repo,
  e2e) die lokaal makkelijk gemist worden. Meld nooit een PR als klaar zonder de groene poort.

**Nooit** een taak afvinken op basis van "ziet er goed uit" of "git status is schoon".
Draai de checks én verifieer de CI-poort.

---

## Sessie-discipline (voorkomt context-overflow)

- Begin elke sessie: lees CLAUDE.md + CURRENT_TASK.md + PROGRESS.md.
- Werk aan één taak uit de bouwvolgorde. Niet vooruitlopen.
- Schrijf tests naast de code, niet achteraf.
- Eind van de sessie: update PROGRESS.md en CURRENT_TASK.md, commit met duidelijke message.
- Houd diffs behapbaar. Grote refactors: aparte sessie, expliciet benoemd.

---

## Wat NIET door Claude Code wordt gedaan (jouw verantwoordelijkheid)

- Productie-infra opzetten (Postgres, S3, mailprovider, domein, HTTPS, secrets, backups).
- Accounts aanmaken / betaalmethoden / productie-secrets invullen.
- Security-review vóór livegang met echte gevoelige documenten. Dit laat je niet
  over aan een agent — het is een AVG-risico. Plan hiervoor een mens in.
