# AGENTS.md — Briefing for AI coding agents (bug-hunt & review)

This file orients an automated coding agent to the **ZZP-Platform** codebase so it can
review logic and find bugs effectively. It is written for a fresh agent with no prior
context. (Claude Code also reads `CLAUDE.md`; the design system lives in `DESIGN.md`.)

> **TL;DR for a reviewer:** read §3 (rules/invariants) and §8 (where bugs hide) first,
> then dive into whichever subsystem in §6 you're auditing. Verify every claim against the
> real code — do not trust this doc's line numbers blindly; treat it as a map, not a spec.

---

## 1. What this is

A production SaaS for the Dutch freelance market. Three sides meet here: **freelancers**
(ZZP'ers), **clients** (opdrachtgevers), and **admins**, plus a **franchiser** tenant-admin
role. Core value: **match jobs + verify credentials/diplomas + manage sensitive documents
securely**. It is a real product with paying customers and sensitive files (VOG, diplomas,
insurance proofs) — the quality bar is high; treat security/compliance bugs as first-class.

**Roles:** `FREELANCER` · `CLIENT` · `ADMIN` · `FRANCHISER` (regional tenant operator).

**Value chain (one line):** freelancer uploads credentials → admin verifies → client sees a
compliance signal and an explainable match → hire (contract) → track hours/milestones →
invoice → registered payment + automated administration (DBA-check, tax delegation).

**Differentiators:** explainable matching (`matching.ts` reasons), a next-action engine
(`next-actions.ts`), credential verification + trust level, and Wet-DBA/AVG (GDPR) compliance.

### Tech stack (fixed)

- **Next.js 15 (App Router) + React 19 + TypeScript (strict).** Server Components by default.
- **Prisma ORM** — **SQLite locally, PostgreSQL in production** (one provider-agnostic schema).
- **Auth.js (NextAuth v5)** — credentials + JWT session, role-based access.
- **Zod** — server-side validation, single source of truth.
- **Tailwind CSS** + Radix primitives + Lucide icons.
- **Vitest** (unit, `src/**/*.test.ts`) + **Playwright** (e2e, `e2e/`, CI project `ci` uses bundled Chromium).

---

## 2. Quick start: run, test, verify

```bash
npm run dev            # next dev (SQLite at DATABASE_URL=file:./prisma/dev.db)
npx prisma db push     # apply schema to the local SQLite db
npx prisma generate    # regenerate the Prisma client (run after ANY schema change)
SEED_DEMO=true npx prisma db seed   # populate rich demo data (users/jobs/credentials/franchise/academy)
```

**Definition of Done (the gate every change must pass — run all of these):**

```bash
npm run typecheck      # tsc --noEmit  (strict)
npm run lint           # next lint
npm run test           # vitest run    (≈1180 unit tests)
npm run build          # prisma generate && next build
npx prettier --check . # formatting
# e2e (Playwright) runs in CI automatically; locally: npm run e2e
npm run check          # shortcut: lint + typecheck + test + build
```

CI is the source of truth — local e2e can be flaky. Demo logins use password `demo1234`
(e.g. `zzp@zzp-platform.local`, `opdrachtgever@zzp-platform.local`, `admin@zzp-platform.local`,
`franchise@zzp-platform.local`).

> **Schema-change footgun:** after editing `prisma/schema.prisma` (or rebasing onto a branch
> that did), you MUST run `npx prisma generate` **and** `npx prisma db push`, or the generated
> client goes stale and you get phantom typecheck/seed errors.

---

## 3. Non-negotiable rules / invariants (check these first)

A bug is very often a violation of one of these:

1. **Server-side is the truth.** No critical status (verification, expiry, access,
   feature-limit, tenant scope) is decided client-side. The client renders snapshots; it
   never decides. A page that gates on a client-derived value is a bug.
2. **Every mutation follows the chain:** `auth → role → ownership → Zod validation → action →
audit`. Helpers in `src/lib/authz.ts`: `requireActor()` / `requireRole(...roles)` (load +
   authorize), `owns()` / `assertOwnership()` (ownership), plus `currentActor()`. A server
   action that skips role or ownership, or mutates without Zod-validating its input, is a bug.
3. **Status transitions go through an explicit map + guard.** Credentials, support tickets,
   ideas, courses, tax filings, subscriptions, the invoice/performance lifecycle — each has a
   `*_TRANSITIONS` map in `src/lib/enums.ts` (or `lifecycles.ts`) and is checked with
   `assertTransition` / `can*Transition`. A direct status write that bypasses the map is a bug
   (e.g. creating a `VERIFIED` credential directly, or jumping `DRAFT → ARCHIVED`).
4. **Documents are private by default.** Files are served ONLY via `src/lib/documents.ts`
   `canAccessDocument` (owner or ADMIN) through `src/app/api/documents/[id]/route.ts`. A client
   never downloads another user's private file. Storage goes through `src/lib/services/storage.ts`.
5. **Audit everything that matters.** Verification decisions, role/status changes, document
   access, sensitive mutations → `src/lib/audit.ts` `audit({ actorId, action, entityType,
entityId, metadata })`, ideally inside the same `prisma.$transaction` as the mutation.
6. **Enums are strings + Zod, never native DB enums.** One schema runs on SQLite and Postgres.
   Don't add `enum` to Prisma; add a `const X = [...] as const` + `z.enum` in `enums.ts`.
7. **Money is integer cents — EXCEPT two fields that are EUROS:**
   `FreelancerProfile.hourlyRate` and `Collaboration.rate`. Everything else
   (`Invoice.totalCents/subtotalCents/vatCents`, `Performance.rateCents/amountCents`,
   `AdministrationEntry.debitCents/creditCents`, fee cents) is integer **cents**.
   `formatEuro(cents)` expects cents. Mixing the two is a 100× bug — a top thing to grep for.
8. **Tenant isolation.** Every tenant-scoped query must carry a tenant filter via
   `src/lib/tenancy.ts` (`tenantScopeWhere`, `assertSameTenant`, `ownsViaTenant`,
   `visibleJobsWhere`, `visibleFreelancersWhere`). A scoped list/detail query without the
   filter is a cross-tenant leak (this exact class of bug was found & fixed in `roster-dossier.ts`).
9. **`signContract` is the ONLY path to `Collaboration.status = ACTIVE`.** Any other code path
   that sets ACTIVE is a bug.
10. **A dispute freezes the cascade.** While `Collaboration.disputedAt` is set, every cascade
    side-path command must call `assertNotDisputed(collaborationId)` before mutating.
11. **UI language is Dutch; code/identifiers/comments are English.** Use the `plural()` helper
    (`src/lib/plural.ts`) — never literal placeholder forms like `"1 reactie(s)"` or `"factuur(en)"`.
12. **The word "AI" must NOT appear anywhere** in UI text, notifications, emails, comments,
    seed data, or docs. The automated helpers are called "Support-assistent" etc. This is a
    hard brand rule; flag any occurrence (watch false positives inside `email`, `detail`,
    `maintain`, `campaign`).
13. **Every view has loading / error / empty states.** A data route without a `loading.tsx`,
    or a list without an `EmptyState`, is a defect.

---

## 4. Repo map

```
prisma/schema.prisma        # data model (~1060 lines, 60+ models). Enums-as-strings.
prisma/seed.ts + seed-*.ts  # idempotent demo seed (SEED_DEMO-gated extras: franchise, academy)
src/auth.ts, auth.config.ts # Auth.js v5 (JWT). events.signIn writes audit + lastLoginAt.
src/middleware.ts           # edge auth gate; isPublicPath() allow-list; matcher excludes dotted paths
src/lib/enums.ts            # ALL status strings, Zod schemas, transition maps
src/lib/authz.ts            # requireActor/requireRole/owns/assertOwnership/currentActor + Actor type
src/lib/tenancy.ts          # tenant scoping helpers (multi-tenant isolation)
src/lib/cascade/*           # the workflow engine: commands, handlers, planners, stage, idempotency
src/lib/lifecycles.ts       # performance/invoice/contract state machines
src/lib/event-store.ts, event-bus.ts, events.ts   # DomainEvent + dedup + handler-once
src/lib/matching.ts         # computeMatchScore, WEIGHTS, computeCompliance, locationFit
src/lib/administration/*    # ledger, vat, overview, aging  (the double-entry bookkeeping)
src/lib/invoices.ts, shift.ts, ort.ts             # invoicing + ORT (irregular-hours surcharges)
src/lib/*-task.ts + src/app/api/tasks/*           # cron-triggered background jobs (CRON_SECRET)
src/lib/services/storage.ts # document storage abstraction (local dir / S3)
src/lib/config.ts           # tunable business rules: DBA thresholds, fee config (mostly OFF)
src/app/(protected)/**      # role-gated routes (page.tsx / actions.ts / loading.tsx per route)
src/app/api/**              # documents, media, pdf, exports, billing webhook, task runners
src/components/ui/*         # design-system primitives (Button/Card/Badge/PageHeader/EmptyState/…)
src/lib/nav.ts              # role-aware navigation
```

---

## 5. Domain model (orientation)

Key entities and how they connect:

- **User** (role, status, `tenantId?`, `lastLoginAt`, `identityVerifiedAt`, AVG fields
  `deletionRequestedAt`/`anonymizedAt`) → has one `FreelancerProfile` **or** one `Company`.
- **FreelancerProfile** (skills, industries, `availability`, `hourlyRate` €, `maxTravelMinutes`,
  `completeness`, `visibility`) ← credentials, applications, collaborations, availabilityWindows.
- **Company** (opdrachtgever) → Departments, Jobs.
- **Job** (status DRAFT/PUBLISHED/CLOSED, `tenantId?`, skill + credential requirements) →
  Applications → **Collaboration** (PROPOSED/ACTIVE/COMPLETED/CANCELLED; `rate` €, `ortProfile`,
  `disputedAt`) → Performances (HOURS/MILESTONE) → Invoices (lifecycleStatus) → registered payment.
- **Credential** (type VOG/DIPLOMA/CERTIFICATE/INSURANCE/LICENSE/OTHER; status
  DRAFT/SUBMITTED/VERIFIED/REJECTED/EXPIRED; `visibility` PUBLIC/PRIVATE; `sharedWithClient`) ↔
  `CredentialVerification` (immutable decision log) ↔ `Document` (private, storage-keyed).
- **Tenant** (franchise) ↔ TenantSubscription, CollaborationFee, Lead/LeadContact (CRM).
- **AdministrationEntry** = the double-entry ledger (per `ownerUserId`, `account`, debit/credit cents).
- **DomainEvent** (append-only, `dedupeKey`) + **EventHandlerRun** (handler-once per event).
- **AuditLog** (action, entityType, entityId, metadata, ip/ua). **Notification**, **Course/Lesson/
  LessonCompletion** (academy), **Idea/IdeaVote/IdeaComment**, **SupportTicket**, **TaxFilingRequest**.

---

## 6. Subsystems (what + key files + where bugs hide)

### 6.1 Cascade engine & lifecycles — the core

**Files:** `src/lib/cascade/{commands,handlers,planners,stage,idempotency,platform-fee}.ts`,
`src/lib/lifecycles.ts`, `src/lib/event-store.ts`, `src/lib/collaborations.ts`.
The work chain: **Job → Application → Collaboration → Contract (sign) → Performance (hours/
milestone) → Invoice (concept → submitted → approved → paid → processed)**. Pure planners
compute effects; `applyCascadeEffects`/`persistEventAndEffects` write them transactionally.
Idempotency: `DomainEvent.dedupeKey` + conditional `updateMany` (optimistic-concurrency guard)

- `EventHandlerRun` (each handler runs once per event, even on replay).
  **Check:** invalid transitions accepted; a path to ACTIVE other than `signContract`; a command
  that skips `assertNotDisputed` during a dispute (this was the `creditInvoice` bug); non-atomic
  multi-write handlers; double-apply on retry; a `dedupeKey` that isn't actually unique per logical event.

### 6.2 Matching / compliance / verification / trust

**Files:** `matching.ts`, `recommendations.ts`, `suggestions.ts`, `mandatory-documents.ts`,
`trust.ts`, `credentials.ts`, `engageability.ts`, `services/travel-distance.ts`, `compliance/*`.
`computeMatchScore` returns a 0–100 integer whose `breakdown` components sum **exactly** to the
score (WEIGHTS: requiredSkills 35, optionalSkills 15, compliance 25, rate 15, workMode 5,
location 5). `computeCompliance` → COMPLIANT / WARNING (only in-review) / NON_COMPLIANT (missing
OR expired). `computeEngageability` combines mandatory docs + completeness + identity + recency
→ ACTIEF/AANDACHT/INACTIEF (a visible signal, NOT a second hard placement gate).
**Check:** a breakdown component exceeding its max or the sum drifting from the score; a
compliance bucket misclassifying expired vs in-review; expiry boundary (exactly "now"); trust
counting expired credentials; `locationFit` travel branch when one side is REMOTE.

### 6.3 Money / administration / invoicing / billing

**Files:** `invoices.ts`, `administration/{ledger,vat,overview,aging}.ts`, `shift.ts`, `ort.ts`,
`cascade/platform-fee.ts`, `billing/*`, `tenant-billing/*`, `aanmaning.ts`.
All amounts are **integer cents** (except the two euro fields, §3.7). `computeVat` handles BTW
regimes. The ledger (`AdministrationEntry`) is double-entry. **Platform fee and tenant-billing
are config-driven and ship DISABLED with zero amounts** — no real money flows through the
platform; it registers/computes only (payments are owner responsibility / mensenwerk).
**Check:** euro↔cents mix-ups (grep for `* 100`, `formatEuro(`, `rate`); VAT rounding; a sum
that doesn't reconcile; division by zero in stats/overviews; ORT segment derivation (`shift.ts`
interprets times in the runtime TZ — prod must be `Europe/Amsterdam`).

### 6.4 Multi-tenancy / franchise

**Files:** `tenancy.ts`, `franchise/*`, and **every** call site of `tenantScopeWhere` /
`assertSameTenant` / `visibleJobsWhere` / `visibleFreelancersWhere`. The tenant layer is
additive (`tenantId?` on User/Company/FreelancerProfile/Job; null = direct platform user).
Model = "closed per tenant" with an `openOverflow` escape hatch (a franchise's unfilled jobs can
fall back to the whole platform). Franchiser features: Leads CRM, opdrachtgevers + departments,
read-only roster dossier, tenant-billing overview.
**Check:** ANY tenant-scoped list/detail/aggregate query missing the tenant filter (cross-tenant
leak — the highest-impact class here). A roster ZZP'er can legitimately have done overflow work
for _another_ tenant, so sub-queries (collaborations/performances/invoices) must filter on the
**job's** tenant, not just `freelancerId`.

### 6.5 Auth / access control / documents / AVG

**Files:** `src/auth.ts`, `auth.config.ts`, `middleware.ts`, `authz.ts`, `entitlements.ts`,
`entitlement-guard.ts`, `documents.ts`, `api/documents/[id]/route.ts`, `api/media/[...key]/route.ts`,
`account-anonymization.ts`, `api/account/export`, `api/tasks/*`.
JWT sessions. `middleware.ts` `isPublicPath()` is an allow-list and the matcher excludes
dotted paths (so `/foo.png`, `/sw.js`, `/manifest.webmanifest` are public). Cron routes require
`CRON_SECRET` (Bearer or `?token=`). AVG: anonymization redacts PII, account export, deletion
requests.
**Check:** an `id` taken from the URL and used without an ownership check (IDOR); a new route
that should be public but isn't added to `isPublicPath` (or vice-versa); a private file reachable
by a non-owner; a cron route missing the token guard; rate-limit ordering (limit before the DB
lookup to avoid enumeration); PII leaking into logs.

### 6.6 Background tasks / events

**Files:** `src/lib/*-task.ts`, `src/app/api/tasks/*` (incl. `run-all`), `event-bus.ts`,
`monitoring/*`, `expiry.ts`, `dba-monitor.ts`, `payment-reminders.ts`.
Cron endpoints (token-guarded) run plan/apply tasks: credential expiry, payment reminders,
DBA-risk monitor (Wet-DBA, always with a mandatory disclaimer, informational only), job-match
alerts, concept-invoice reminders, VAT reminders, subscription past-due, security monitor. Each
task is idempotent via `DomainEvent.dedupeKey`; side-effects (status + notification + audit) go
in one transaction. `run-all` runs them sequentially and keeps going on per-task errors.
**Check:** a task that double-sends/double-books on re-run (dedup hole); a hard-fail that aborts
the whole run instead of per-item continue; the DBA disclaimer omitted; date/TZ edge cases.

### 6.7 Frontend / design system

**Files:** `DESIGN.md`, `src/components/ui/*`, `nav.ts`, `sidebar-nav.tsx`, `app-shell.tsx`,
`plural.ts`. Refined-minimalism design system; semantic HSL tokens only (never hardcoded hex);
ONE status-badge language (muted=concept, warning=pending, success=active/verified/paid,
danger=rejected/late, muted-foreground=archived); match score is always `Badge variant="accent"`.
Tabs are done as **searchParams Link-pills**, not a Tabs primitive. Container widths: dashboard
`max-w-5xl`, collections `max-w-4xl`, forms/detail `max-w-2xl`.
**Check:** dead `<Link href>`s to non-existent routes; missing `loading.tsx` (note: a `loading.tsx`
inside an `(index)` route group does NOT cover the sibling `[id]` segment — needs a parent-level
one); plural placeholders; the word "AI"; a button with no working action.

---

## 7. Deliberate choices — do NOT report these as bugs

These are intentional (often "mensenwerk" — owner/legal responsibility), already decided:

- **Tenant-billing & platform-fee are OFF** with zero amounts in `config.ts`; the fee-cascade
  wiring is intentionally not connected. (Pricing/VAT classification + payment provider = owner.)
- **No real payment processing.** Stripe/Mollie is a seam; the workflow never moves money — it
  registers/computes status only.
- **Travel time is an offline heuristic** (`travel-distance.ts`: haversine over a small NL-city
  table × a flat factor), not real routing. Unknown cities fall back to a city-name comparison.
- **Client cannot download a freelancer's private file.** `sharedWithClient` shares credential
  **metadata** (type/title/issuer/verified date) within an active collaboration, not the file.
  Serving the actual file to third parties is deliberately deferred (AVG review = human).
- **Case-insensitive search is not used** (`mode: "insensitive"` doesn't typecheck against the
  local SQLite client). Known codebase-wide; a separate Postgres-search hardening, not a regression.
- **Some cron queries are unbounded `findMany`** — a known latent scalability item (codebase
  convention), guarded by prior filters; not a functional bug at current scale.
- **"Semantic" matching is feature-hashing**, not embeddings; it only affects a tiebreaker, not
  the score.

---

## 8. Bug-hunt hotspots (consolidated checklist)

When reviewing, prioritise these — this is where real bugs have lived:

- **Cross-tenant leaks:** any `prisma.*.findMany/findUnique` in a tenant context without a
  tenant filter on the scoped relation. Especially nested sub-queries (filter the _job's_
  `tenantId`, not just `freelancerId`).
- **Euro vs cents:** any arithmetic mixing `hourlyRate`/`rate` (euros) with `*Cents` fields, or
  passing euros to `formatEuro` (which wants cents).
- **Missing dispute freeze:** a cascade command that mutates an invoice/performance/collaboration
  without `assertNotDisputed`.
- **Transition bypass:** a direct status write without the `*_TRANSITIONS` map / `assertTransition`.
- **Check-then-create races:** `findUnique`-precheck + `create` on a `@unique` field without a
  P2002 try/catch (gives a 500 under concurrency). The codebase's convention is to catch
  `Prisma.PrismaClientKnownRequestError` `code === "P2002"`.
- **Idempotency holes:** a `dedupeKey` that isn't stable/unique per logical event; a handler that
  isn't claim-guarded; a `||` where `??` is meant (falsy `0`/`""` coalescing).
- **IDOR / ownership:** an id from `params`/`formData` used to read/mutate without an ownership
  or `assertSameTenant` check.
- **Missing `revalidatePath`** after a mutation that feeds a list on the same route (stale UI in
  `useActionState` forms).
- **State coverage:** routes lacking `loading.tsx`/`EmptyState`; the `(index)`-group loading trap.
- **Copy:** literal `(en)`/`(s)` placeholders instead of `plural()`; any occurrence of "AI".
- **Server-side truth:** a gate computed on the client; an entitlement/role decided in a component.

### Already found & fixed (don't re-report as new)

Two repo-wide adversarial hunts already ran. Fixed: a cross-tenant leak in
`franchise/roster-dossier.ts` (sub-queries now filter on job tenant); `creditInvoice` missing
`assertNotDisputed`; P2002 races in `createCourse` & `createOpdrachtgever`; `createLesson` `||`→`??`
for explicit order 0; `createFranchise` missing `revalidatePath`; several `(en)` placeholders →
`plural()`; missing parent-level `loading.tsx` for `opdrachten/[id]` & `facturen/[id]`; a
service-worker offline-fallback hardening. If you find these, they're already done — look deeper.

---

## 9. Conventions

- **Branch/PR workflow:** never commit to `main`; new work on a feature branch → PR → merge on
  green CI (`check` + `e2e`). Keep diffs small and focused.
- **Tests live next to code** (`*.test.ts`); pure logic is unit-tested, DB/action flows via e2e.
- **Write Dutch UI, English code.** Match the surrounding file's idiom and comment density.
- **When in doubt, read the real code.** This document is a guide; the code is the truth.
