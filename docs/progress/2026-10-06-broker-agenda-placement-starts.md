# 6 oktober 2026 — aankomende plaatsing-starts in de bemiddelaar-agenda (#1571)

## Waarom

De operationele bemiddelaar-agenda (`/franchise/agenda`, `.ics`) toonde alleen het
**einde** van een plaatsing en het verval van rostercertificaten. Een bemiddelaar plant
echter óók op het **begin** van een plaatsing: intake afronden, documenten compleet
krijgen, de eerste dienst inplannen en de opdrachtgever briefen. Die startdatum stond
nergens in de agenda die de bemiddelaar in Google/Apple Agenda kan openen.

Dit is de bemiddelaar-kant van dezelfde parity die op de persoonlijke agenda is
toegevoegd (#1559, start-event naast einde-event). Volledig gescheiden bestanden —
geen overlap met #1559.

## Wat

- **`src/lib/franchise/agenda.ts`** — nieuwe `BrokerCollaborationStart`-projectie en een
  `starts`-veld vooraan in `BrokerAgenda`. `brokerAgendaEvents` emitteert de start-events
  als eerste categorie (daarna eindes, dan certificaten), als all-day event
  `Start plaatsing: <ZZP'er> bij <opdrachtgever>` met stabiele UID
  `broker-collab-start-<id>@zzp-platform` en twee alarmen (7 dagen en 1 dag vooraf).
- **`src/lib/data/franchise-agenda.ts`** — derde tenant-gescoopte, take-begrensde query:
  `ACTIVE`, niet-betwiste samenwerkingen binnen de tenant (via `job.tenantId`) met een
  gezette `startDate >= now`. Een samenwerking wordt `ACTIVE` zodra beide partijen
  tekenen — dat kan vóór de startdatum liggen, dus dit surfacet precies de nog te
  starten plaatsingen. Dezelfde fail-closed (geen tenant → lege agenda) en null-guard
  narrowing als de bestaande categorieën.
- **`src/app/(protected)/franchise/agenda/route.ts`** — `starts`-telling toegevoegd aan
  de bestaande AVG-audit-metadata (geen PII).

Geen bedragen of gevoelige data in de events — alleen namen die de bemiddelaar in zijn
cockpit al beheert, plus wat er speelt en wanneer (parity met de einde-/certificaat-events).

## Bewijs

- `npm run typecheck` schoon.
- `npx vitest run src/lib/franchise/agenda.test.ts` → **Test Files 1 passed (1), Tests 8
  passed (8)** (twee nieuwe cases: de start-mapping met de 7/1-dag-alarmen én de
  emit-volgorde starts → eindes → certificaten).
- `npm run lint` schoon; `npx prettier --write` schoon.
- Volledige `npm run test` en `npm run build` groen vóór de PR (zie PR-body).

Onafhankelijke review en de CI-poort volgen.
