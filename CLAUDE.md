# CLAUDE.md — ZZP Platform

Dit bestand is de **persistente context** voor Claude Code. Lees dit aan het begin
van elke sessie. Het beschrijft wat we bouwen, hoe, en welke regels niet-onderhandelbaar zijn.

> Werkwijze: lees ook altijd `CURRENT_TASK.md` (wat we NU doen) en `PROGRESS.md`
> (wat al af is). Update beide aan het einde van elke sessie. Dit voorkomt
> context-overflow en drift over grote sessies.

---

## Wat we bouwen

**ZZP Platform** — een productiegericht SaaS-platform voor de Nederlandse markt waar
zelfstandigen (ZZP'ers), opdrachtgevers en admins samenkomen. Kernwaarde:
opdrachten matchen + **certificaten/diploma's verifiëren** + documenten veilig beheren.

Dit wordt een echt product met betalende klanten en **gevoelige documenten**
(VOG, diploma's, verzekeringsbewijzen). Kwaliteitslat: snel, strak, betrouwbaar,
veilig, onderhoudbaar. Geen demo, geen slop.

Drie rollen: **FREELANCER** (ZZP'er), **CLIENT** (opdrachtgever), **ADMIN**.

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

Leer van Linear/Vercel/Stripe. Refined minimalism, geen drukte.

- Rustig, compact, premium. Hoge informatiedichtheid zonder rommel.
- Dashboard-first. **Geen marketinghomepage als hoofdscherm.**
- Strakke tabellen, lijsten, detailpanelen, drawers.
- Consistente statuschips, badges, tabs, focus states, keyboard nav.
- Geen decoratieve gradients. Geen kaart-in-kaart. Geen templategevoel.
- Elke pagina beantwoordt direct: *Wat is de status? Wat moet ik nu doen?
  Wat is de volgende beste actie? Kan ik dit vertrouwen?*
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
- De flow is in de browser doorgeklikt (Claude Code: start dev, controleer)
- Loading/error/empty-states aanwezig
- `PROGRESS.md` bijgewerkt, `CURRENT_TASK.md` doorgeschoven naar de volgende taak

**Nooit** een taak afvinken op basis van "ziet er goed uit". Draai de checks.

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
