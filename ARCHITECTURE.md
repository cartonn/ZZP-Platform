# ARCHITECTURE.md — ZZP Platform

> Status: levend document. Beschrijft de **huidige** situatie (wat er staat) en de
> **doel**-architectuur uit `prompts/PLATFORM_OVERHAUL.md` (event-driven, cascade).
> Werk dit bij aan het eind van elke fase.

---

## 1. Huidige situatie (vóór overhaul)

### Stack
- Next.js 15 (App Router) + React 19 + TypeScript (strict)
- Prisma ORM — SQLite lokaal, PostgreSQL in productie (provider-switch)
- Auth.js (NextAuth v5) — credentials + JWT, role-based access
- Zod (server-side validatie), Tailwind + Radix + Lucide
- Vitest (unit) + Playwright (e2e)

### Codepatronen (bestaand — hergebruiken)
- **Enums als strings + Zod** in `src/lib/enums.ts`. Geen native db-enums.
- **Statusovergangen via expliciete map** per entiteit, met `assert*Transition`:
  - `CREDENTIAL_TRANSITIONS` + `assertTransition` (`credentials.ts`)
  - `INVOICE_TRANSITIONS` + `assertInvoiceTransition` (`invoices.ts`)
  - `COLLABORATION_TRANSITIONS` + `assertCollaborationTransition` (`collaborations.ts`)
- **Plan/Apply-splitsing:** pure beslis-functie (`planExpiryRun`, getest zonder DB) +
  dunne I/O-runner (`runExpiryTask`) die alles in één `prisma.$transaction` schrijft.
- **Audit één schrijfpunt:** `audit()` / `auditData()` (`audit.ts`), meeschrijfbaar in een transactie.
- **Authz-keten:** `src/lib/authz.ts` → auth → rol → ownership → Zod → actie → audit.
- **Server-side waarheid:** matching/score, compliance, completeness, DBA-risico worden
  server-berekend en als snapshot opgeslagen (`matchScore`, `complianceSnapshot`, `dbaRisk`).
- **Next-action-engine** (`next-actions.ts`) voedt het "Vraagt aandacht"-dashboard.

### Datamodel (kern, `prisma/schema.prisma`)
User · FreelancerProfile · Company · Skill/Industry (+ join) · Job (+ DBA-velden) ·
Application · Conversation/Message · Document · Credential/CredentialVerification/
VerificationRequest · Collaboration · Invoice/InvoiceLine · Notification · Plan/Subscription ·
AuditLog · AvailabilityWindow.

### Wat ontbreekt voor de overhaul
- **Geen centrale event-laag.** Statuswijzigingen gebeuren ad hoc per route/actie; er is geen
  domain-event die vervolgacties bij andere rollen triggert.
- **Geen urenstaat/oplevering** (Timesheet/Deliverable) als entiteit; dus ook geen verplichte
  goedkeuringsstap (Besluit 3) vóór facturatie.
- **Factuur is los**, niet afgeleid uit een goedgekeurde prestatie; geen factuurnummer-reeks
  **per uitschrijvende partij**; geen BTW-laag; geen concept→ingediend→goedgekeurd→betaald-flow.
- **Geen administratie-items** (debiteur/crediteur) en geen betaalstatus-registratie.
- **DBA** zit nu op de `Job` (statische check bij plaatsing), niet als doorlopende, tijd-/
  patroongedreven monitoring over de contractlooptijd.
- **Geen reminder-engine** voor de facturatie-cascade (wel een expiry-task voor certificaten).

---

## 2. Doelarchitectuur (event-driven)

### 2.1 Domain-event laag
Elke betekenisvolle handeling publiceert een **DomainEvent** met vaste vorm:

```
{ id, type, actorRole, actorId, subjectType, subjectId, payload, correlationId, occurredAt }
```

- **Append-only event store** (`DomainEvent`-tabel) — onveranderlijk, naast de bestaande
  `AuditLog` (audit = mens-leesbaar gevolg; event = machine-trigger). Eén `correlationId`
  bindt een hele cascade (contract → urenstaat → factuur → betaling) aaneen.
- **In-process event-bus** (`src/lib/event-bus.ts`): handlers registreren zich op een event-type;
  `publish()` persisteert het event en draait de handlers.
- **Idempotentie op twee niveaus:**
  1. *Publicatie-dedup:* optionele `dedupeKey` (uniek) — hetzelfde logische event tweemaal
     publiceren (dubbele "markeer betaald") levert één event op.
  2. *Handler-dedup:* een `EventHandlerRun(eventId, handler)`-marker — een handler draait per
     event hooguit één keer, ook bij replay/herstart. Geen dubbele facturen/administratie-items.
- **Plan/Apply blijft leidend:** handlers berekenen pure gevolgen en schrijven ze in één
  `prisma.$transaction` (event-markering + statuswijziging + administratie-item + notificatie +
  auditregel samen, atomair).

### 2.2 State machines (expliciete overgangsmaps)
Generieke helper `src/lib/state-machine.ts` (`defineStateMachine(transitions)` → `{ can, assert }`),
waarmee de bestaande en nieuwe overgangsmaps uniform worden uitgedrukt. Doel-lifecycles (§3 overhaul):

- **Opdracht (Job):** `concept → gepubliceerd → gematcht → gecontracteerd → in_uitvoering →
  opgeleverd → afgerond → gearchiveerd`
- **Contract:** `concept → ter_ondertekening → getekend → actief → beëindigd`
- **Urenstaat/Oplevering:** `concept → ingediend_ter_goedkeuring → goedgekeurd` (+ `afgekeurd`)
- **Factuur:** `concept → ingediend → goedgekeurd → betaald → verwerkt` (+ `afgekeurd`,
  `gecrediteerd`, `te_laat`)
- **Betaling (registratie):** `verwacht → gemarkeerd_betaald → bevestigd` (+ `te_laat`).
  **Alleen statusregistratie — geen geldverwerking (Besluit 1).**

> De bestaande korte enums (Job DRAFT/PUBLISHED/CLOSED, Invoice DRAFT/SENT/PAID/…) worden in
> Fase 2/3 gemigreerd naar deze rijkere lifecycles. In Fase 1 voegen we de nieuwe state machines
> en de event-laag **additief** toe zonder de werkende flows te breken.

### 2.3 Administratiemotor (Fase 2)
Events met financieel gevolg genereren **administratie-items** bij de juiste partij:
ZZP'er = debiteur, opdrachtgever = crediteur, platform = alleen eigen fee-factuur (Besluit 4).
BTW: af te dragen bij uitschrijver, voorbelasting bij ontvanger. Factuurnummer doorlopend
**per uitschrijvende partij**. Onveranderlijk na indienen (alleen crediteren).

### 2.4 Notificaties, taken, reminders (Fase 6)
Events → in-app notificatie + taak-item voor de juiste rol + tijdgestuurde reminders
(reminder-engine, zelfde plan/apply-patroon als `runExpiryTask`).

### 2.5 DBA-monitoring (Fase 4)
Doorlopende, configureerbare tijd-/patroonsignalen over de contractlooptijd (6/12 mnd, 80%-omzet,
zelfde functie, vast rooster, leiding/toezicht) — altijd met disclaimer, nooit juridisch advies
(Besluit 2). Drempels in een config-bestand, niet hardcoded.

---

## 3. Mappenstructuur (doel-toevoegingen)
```
src/lib/
  state-machine.ts      # generieke defineStateMachine (Fase 1)
  events.ts             # DomainEvent-types + Zod-shape (Fase 1)
  event-bus.ts          # in-process bus + prisma event store (Fase 1)
  lifecycles.ts         # overgangsmaps voor Opdracht/Contract/Urenstaat/Factuur/Betaling (Fase 1)
  administration/       # administratiemotor + BTW + nummering (Fase 2)
  cascade/              # event-handlers A–F (Fase 3)
  reminders/            # reminder-engine (Fase 6)
```

---

## 4. Niet-onderhandelbaar (uit CLAUDE.md + Besluiten §0A)
- Server-side is de waarheid; elke mutatie: auth → rol → ownership → Zod → actie → audit.
- Geen geld via het platform (Besluit 1). DBA signaleert, adviseert niet (Besluit 2).
- Geen factuur zonder goedgekeurde prestatie (Besluit 3). Fee = configureerbaar, default UIT (Besluit 4).
- Eén schema op SQLite én Postgres. Geen statuswijziging buiten de state machine/event-laag om.
</invoke>
