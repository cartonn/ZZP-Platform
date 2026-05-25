# BUILD_ORDER.md — Bouwvolgorde in sessies

Logische, afhankelijkheids-gedreven volgorde. **Eén sessie ≈ één blok.** Grote blokken
mogen over twee sessies. Loop niet vooruit: elk blok bouwt op het vorige.

Aan het eind van elk blok: typecheck + lint + test groen, flow doorgeklikt, commit,
PROGRESS.md bij, CURRENT_TASK.md naar het volgende blok.

---

## Sessie 0 — Inventarisatie & fundament (KORT, doe dit eerst)

- Check of er al een repo/codebase is. Onze vorige sessie leverde een fundering
  (`zzp-platform`: schema, auth, authz, credentials-logica, matching, verificatiequeue,
  unit-tests). **Als die er is:** inspecteer, draai `npm install`, `npx prisma db push`,
  `npm run db:seed`, `npm run dev`, `npm run test`. Bevestig dat de fundering draait.
- **Als er niets is:** scaffold vanaf nul volgens CLAUDE.md (Next.js 15 + TS + Prisma +
  Auth.js + Tailwind), neem het Prisma-schema en de `src/lib/*` kern over (zie bijlage
  in dit pakket of herbouw volgens de regels).
- Resultaat: `npm run dev` draait, login werkt, 3 demo-accounts seeden. Commit.

## Sessie 1 — Onboarding & profielen (FREELANCER + CLIENT)

- Registratie met rolkeuze (FREELANCER/CLIENT), e-mailverificatie voorbereid.
- Progressieve onboarding + profiel-compleetheidsindicator.
- FreelancerProfile bewerken: headline, bio, skills, branches, tarief, beschikbaarheid,
  locatie, werkmodus, talen, KvK/BTW optioneel.
- Company-profiel bewerken: naam, logo, branche, omschrijving, website, locatie.
- Publiek ZZP-profiel (read-only, respecteert zichtbaarheid).
- Tests: profiel-validatie, compleetheidsberekening, zichtbaarheidsregels.

## Sessie 2 — Opdrachten CRUD + zoeken/filteren

- Job aanmaken/bewerken: concept opslaan, publiceren, sluiten. Alle velden uit het model.
- Vereiste/gewenste skills + vereiste/gewenste credentials koppelen.
- Opdrachtenoverzicht (ZZP-kant): zoeken, filters (branche, skills, tarief, locatie,
  werkmodus, startdatum, vereiste certificaten), sorteren, paginatie, debounced search.
- Opdracht-detailpagina. Beheeroverzicht (CLIENT-kant).
- Tests: job-validatie, statusovergangen, filterlogica.

## Sessie 3 — Reacties & kandidatenflow

- ZZP'er reageert: motivatie, tariefvoorstel, beschikbaarheid, optionele bijlage.
- Matchscore + compliance-snapshot server-berekend bij aanmaken reactie
  (gebruik `src/lib/matching.ts`).
- CLIENT: kandidatenoverzicht per opdracht, statussen (NEW/VIEWED/SHORTLIST/REJECTED/
  ACCEPTED), notities, compliance-overzicht per kandidaat.
- Feature-gating: max reacties per plan (server-side).
- Tests: applicatie-validatie, statusovergangen, gating, matchscore-snapshot.

## Sessie 4 — Documenten + credentials (ZZP-kant)

- Documenten-upload-UI op de bestaande storage-abstractie. Type/grootte-validatie,
  ownership, signed-URL download-route.
- Credentials: uploaden, metadata, verificatie aanvragen, status volgen, zichtbaarheid
  beheren, document vervangen, verificatiehistorie.
- Tests: upload-validatie, ownership-checks, document-toegangsregels.

## Sessie 5 — Verificatie (ADMIN) + afronden compliance

- Verificatiequeue (bestaat al in fundering) uitbreiden: filters (nieuw, bijna verlopen,
  verlopen, afgewezen, duplicaten), documentviewer, verificatienotities, audit trail.
- Bevestig server-side transitievalidatie + verplichte afwijzingsreden + notificaties.
- CLIENT ziet geverifieerd/in beoordeling/verlopen/niet-geverifieerd + filtert hierop.
- Expiry-job: server-side markeren van verlopen credentials + herinneringen.
- Tests: queue-filters, expiry-markering, end-to-end transitie.

## Sessie 6 — Berichten, notificaties, samenwerkingen

- Conversaties per opdracht, ongelezen-status, basis notificaties (architectuur laat
  realtime later toe). In-app notificatiecentrum.
- Samenwerking aanmaken bij geaccepteerde reactie: koppel opdracht/zzp/opdrachtgever,
  statussen, start/eind, tarief, contractstatus, tijdlijn.
- Tests: bericht-toegang (alleen deelnemers), notificatie-trigger, collab-aanmaak.

## Sessie 7 — Facturatie + billing-scaffolding

- Invoice/InvoiceLine UI, statussen, totaalberekening, PDF-generatie voorbereid.
- Plannen (FREE/PRO/BUSINESS), subscription-status, feature-gating overal toegepast.
- Stripe via service-abstractie (mock lokaal, echte koppeling later).
- Tests: factuurberekening, gating-grenzen.

## Sessie 8 — Admin-paneel afronden

- Gebruikers zoeken/filteren/bekijken, rol/status aanpassen (met audit).
- Opdrachten modereren. Platformstatistieken. Audit-trail-viewer.
- Tests: admin-only toegang op alle admin-routes, rol-mutatie + audit.

## Sessie 9 — Polish, performance, a11y, e2e

- Loading skeletons, error boundaries, lege staten overal consistent.
- Server components waar logisch, paginatie, indexes, query-optimalisatie.
- Toegankelijkheid: semantische HTML, labels, focus, contrast, dialog-a11y.
- Playwright e2e-suite: registreren/login → opdracht → reactie → certificaat upload →
  admin keurt goed → opdrachtgever ziet geverifieerd → verlopen wordt gemarkeerd.
- Volledige kwaliteitscontrole (zie QUALITY_CHECKLIST in CURRENT_TASK.md).

## Sessie 10 — Productie-voorbereiding (code-kant)

- Provider-switch naar Postgres, `prisma migrate deploy`-pad, env-documentatie.
- S3-storage-implementatie achter de abstractie. Mailprovider achter de abstractie.
- Rate-limiting, CSRF-hardening, security headers. README + roadmap compleet.
- **Daarna jouw werk (mens):** infra opzetten, secrets, domein, en een security-review
  vóór echte klanten met gevoelige documenten.
