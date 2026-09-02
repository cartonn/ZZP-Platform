# ARCHITECTURE.md — ZZP Platform

> Status: levend document. **§0 Modulekaart** is de kaart voor wie nu instapt: waar staat wat.
> §1–§5 beschrijven de historische uitgangssituatie en de doelarchitectuur uit
> `prompts/PLATFORM_OVERHAUL.md` (event-driven, cascade) — die verbouwing is inmiddels gebouwd
> (§5). Werk dit bij aan het eind van elke fase.

---

## 0. Modulekaart (huidig, 2-9-2026)

`src/lib` is de domeinlaag: **375 platte modules** naast 382 co-locatie-testbestanden, plus 25
submappen. Pure logica en I/O zijn gescheiden — een module zonder `prisma`-import is een pure kern
met unit-tests ernaast; de laders staan in `src/lib/data/` en de submappen. Hieronder per domein
wat het doet en waar je begint.

| Domein                         | Wat het doet                                                                                                                                                          | Kernbestanden                                                                                                                 |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Authz & tenancy**            | De mutatieketen auth → rol → ownership (pure predicaten + async wrappers) en de franchise-isolatie: één `tenantId` per bemiddelaar, ADMIN ziet alles.                 | `authz.ts`, `tenancy.ts`, `entitlements.ts` / `entitlement-guard.ts`                                                          |
| **Opdrachten & matching**      | Marktplaats-filters, opgeslagen zoekopdrachten, en de **uitlegbare** matchscore (troeven/minpunten als `reasons`) inclusief beschikbaarheid en compliance.            | `matching.ts`, `jobs.ts`, `jobs/marketplace-where.ts`, `jobs/saved-search.ts`, `semantic.ts`                                  |
| **Reacties (applications)**    | Reageren, intrekken, filteren, wachttijd-/concurrentie-signalen en de retentie-sweep op afgewezen reacties.                                                           | `applications.ts`, `applications-create.ts`, `application-wait.ts`, `application-retention.ts`                                |
| **Certificaten & verificatie** | `CREDENTIAL_TRANSITIONS` + `assertTransition`, verval (alleen VERIFIED kan verlopen), de admin-wachtrij en de externe verifiers achter een servicegrens.              | `credentials.ts`, `expiry.ts` / `expiry-task.ts`, `verification-queue.ts`, `services/{diploma,big,identity}-verifier.ts`      |
| **Cascade & administratie**    | De hoofdcascade als pure planners (contract → urenstaat → goedkeuring → factuur → betaling) + atomaire applier; daarna BTW, nummering per partij en dubbel grootboek. | `cascade/{handlers,apply,commands}.ts`, `administration/{ledger,vat,numbering,overview}.ts`, `event-bus.ts`, `lifecycles.ts`  |
| **ORT (zorg)**                 | Onregelmatigheidstoeslagen per tijdcategorie in integer-centen, configureerbaar per CAO/sector, met automatische segmentatie uit diensttijden.                        | `ort.ts`, `ort-breakdown.ts`, `shift.ts`, `config.ts` (`ORT_SECTOR_PROFILES`)                                                 |
| **Next actions & signalen**    | Eén deterministische "wat moet ik nu?"-rangschikking, de nav-badges per rol, en het actiecentrum dat de concrete items ophaalt met dezelfde drempels.                 | `next-actions.ts`, `signals.ts`, `actions/pending-tasks.ts`, `actions/tasks.ts`                                               |
| **Notificaties & reminders**   | Presentatie (type → categorie/toon), voorkeuren per categorie, digest, en de plan/apply-reminderrunners achter `/api/tasks/*`.                                        | `notifications.ts`, `notification-preferences.ts`, `payment-reminders-task.ts`, `performance-approval-reminders-task.ts`      |
| **Franchise (bemiddelaar)**    | De tenant-cockpit: roster-capaciteit/-tijdlijn, voordracht en opvolging, diensten, leads, klantgezondheid en tenant-facturatie.                                       | `franchise/{roster-capacity,roster-timeline,dienst-voordracht,leads,client-health}.ts`, `tenant-billing/*`                    |
| **Billing (inert)**            | Abonnementen + platformfacturatie achter een providerinterface; default `noop`, niets wordt geïncasseerd, facturen blijven DRAFT.                                     | `billing/provider.ts`, `billing/webhook-idempotency.ts`, `platform-billing/billing-run.ts`, `tenant-billing/tenant-plan.ts`   |
| **Fiscaal / ontzorgd**         | Indicatieve BTW-stand, reservering, urencriterium en IB-schatting voor de ZZP'er; de aangifte-partner is een inerte seam (het platform is geen gemachtigde).          | `tax/ontzorg-overview.ts`, `tax/{hours-criterion,reservation,income-tax}.ts`, `tax-filing/partner.ts`                         |
| **DBA & compliance**           | Doorlopende, configureerbare risicosignalering over de contractlooptijd — signaleert en documenteert, geeft nooit juridisch advies; plus het audit-dossier.           | `dba-monitor.ts`, `dba-audit.ts` / `dba-audit-pdf.ts`, `compliance/{dossier,processing-register}.ts`                          |
| **Observability & ops**        | Health/readiness, gestructureerde logging met PII-redactie, metrics, en per extern kanaal een zelftest + aflever-heartbeat (dead-man's-switch).                       | `observability/{health,readiness,logger,metrics}.ts`, `observability/*-delivery-heartbeat.ts`, `ops/{preflight,db-backup}.ts` |
| **Storage & documenten**       | Documenten zijn standaard privé: één storage-abstractie (lokaal → S3), validatie op type/grootte, malware-scan-seam, toegang altijd geaudit.                          | `services/storage.ts`, `services/upload-scanner.ts`, `documents.ts`, `security/access-audit.ts`                               |

**Waar de rest staat:** `src/lib/data/` = Prisma-laders per scherm (bulk-queries, N+1-veilig) ·
`src/lib/services/` = externe koppelingen achter een interface met veilige default · `src/app/` =
Next.js App Router (route groups per rol) · `prisma/schema.prisma` = het volledige datamodel.

### Bekende structurele schuld

- **Vlakke lib zonder importgrenzen.** 375 modules op één niveau in `src/lib`; niets belet een
  UI-component om rechtstreeks een cascade-interne te importeren. Er is geen laag-/mapgrens die
  dit afdwingt (geen lint-regel op importpaden).
- **`Invoice` heeft twee statusvelden.** `status` (`DRAFT|SENT|PAID|OVERDUE|CANCELLED`, legacy) én
  `lifecycleStatus` (cascade: concept → ingediend → goedgekeurd → betaald → verwerkt). Beide zijn
  in gebruik; queries moeten weten welke de waarheid is voor hun geval.
- **Twaalf losse heartbeat-modellen.** `CronHeartbeat`, `BackupHeartbeat` en tien
  `*DeliveryHeartbeat`-modellen (mail, push, storage, billing, verificatie, rate-limit,
  password-breach, error-monitoring, upload-scan, routing) met vrijwel identieke vorm — een
  gedeeld model met een `channel`-discriminator zou tien modellen + tien freshness-modules schelen.
- **i18n-laag met minimale dekking.** `src/lib/i18n/` bestaat (NL default, EN optioneel), maar
  slechts ±39 van de ruim 1.000 componenten/pagina's raken die laag. Het spoor is per instructie
  afgesloten; de laag blijft als dode-kapitaal-schuld staan.

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
  1. _Publicatie-dedup:_ optionele `dedupeKey` (uniek) — hetzelfde logische event tweemaal
     publiceren (dubbele "markeer betaald") levert één event op.
  2. _Handler-dedup:_ een `EventHandlerRun(eventId, handler)`-marker — een handler draait per
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

---

## 5. Bouwstatus (gerealiseerd — Fases 0–4 + koppeling 5/6/7)

Wat hierboven als "doel" staat is grotendeels **gebouwd en getest** (311 unit-tests):

- **Event-laag:** `state-machine.ts`, `lifecycles.ts`, `events.ts`, `event-bus.ts`, `event-store.ts`
  (`DomainEvent` + `EventHandlerRun`).
- **Administratiemotor:** `administration/{vat,numbering,ledger,persist,overview,csv}.ts` — BTW,
  nummering per partij, dubbel grootboek, kwartaaloverzichten, CSV-export.
- **Cascade A–E + zijpaden:** `cascade/{types,handlers,apply,commands,next-actions}.ts`, gewired via
  serveracties + werkproces-UI (`/samenwerkingen/[id]`); cascade zichtbaar op `/facturen`,
  `/administratie` en het dashboard ("aan zet").
- **Reminder-/monitortaken (plan/apply):** `expiry-task`, `payment-reminders-task`, `dba-monitor-task`
  met beveiligde `/api/tasks/*`-routes (CRON_SECRET), idempotent via DomainEvent dedupeKey.
- **DBA-monitoring:** `dba-monitor.ts` (duur, omzetconcentratie, Job-indicatoren) — altijd disclaimer.
- **Live `Invoice`/`Collaboration`-flow** bleef additief intact; cutover van de oude factuur-UI volgt
  na browser-verificatie (interactieve sessie).
- **Open:** e-mailkanaal, PDF-export, Playwright-e2e, en de dark-first-thema-keuze (DESIGN.md).
  </invoke>
