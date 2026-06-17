# Plan — ZZP Platform naar het hoogste niveau

> Status: fase 1 in uitvoering (Vakwerk-fundament). Dit document is de routekaart
> voor alle volgende sessies/agents; werk per fase, vink af in `CURRENT_TASK.md`.
> Ontwerpreferentie: `docs/ontwerpen/vakwerk.html` + `docs/ontwerpen/VAKWERK.md`.

## Doel

Het platform moet op elk vlak — backend, frontend, UX, UI, design — boven de
benchmark (Pidz, Maqqie, Jellow, Bendy) uitkomen: één onverwisselbare identiteit,
complexiteit die naar de achtergrond verdwijnt, en features die concurrenten
afzonderlijk missen.

---

## Fase 1 — Vakwerk-fundament (design & identiteit) ✦ NU

1. **Tokens**: Vakwerk wordt het standaardpalet — pastelblauw "papier" als canvas,
   witte vellen (kaarten), klein-blauw als merkkleur, zegelgroen voor geverifieerd.
   Licht én donker uit dezelfde semantische tokenset; bestaande paletten blijven
   werken als keuze.
2. **Typografie**: Schibsted Grotesk (koppen), Inter (UI), JetBrains Mono (alle
   cijfers) via `next/font` — zelfgehost, geen runtime-afhankelijkheid.
3. **Nieuwe primitives** (`src/components/ui/`): `Seal`, `MatchMeter`, `Sparkline`,
   `CascadeStepper`, `TurnBanner`, `Table` — elk met unit-tests op de pure logica.
4. **Toepassen**: app-shell (witte zijbalk/topbalk op pastel canvas), dashboard
   (display-kop, mono-cijfers, omzet-sparkline, matchmeter bij matches),
   samenwerkingsdetail (stepper + aan-zet-banier).
5. **Backend-slice**: maandelijkse omzetreeks (`src/lib/revenue.ts`, puur + getest)
   voor de dashboard-sparkline.

## Fase 2 — UX: schermen herordenen rond "wat nu?"

- Dashboard per rol opnieuw ordenen: actie-wachtrij als held (eerste actie groot,
  rest als rij), daarna lopend werk, dan cijfers. De next-actions-engine bestaat;
  dit is presentatie.
- Weekrooster als kalenderstrip (ma–zo met dienstblokken) op het ZZP-dashboard;
  doorklik naar `/beschikbaarheid` en `/diensten`.
- Matchredenen zichtbaar maken op kandidaten-/opdrachtkaarten (de `reasons` uit
  `matching.ts` tonen, ook de minpunten — uitlegbaarheid als feature).
- Terminologie gladstrijken: Diensten/Prestaties/Opdrachten/Reacties/Acties →
  één begrippenkader, IA-besluit vastleggen als ADR.
- Lege-/laad-/fouttoestanden naar Vakwerk-stijl (zegel-iconografie).

## Fase 3 — Features die concurrenten samen niet hebben

- **Beoordelingen**: `Review`-model (na afgeronde samenwerking, twee richtingen,
  modereerbaar) — het ontbrekende vertrouwensorgaan. Server-side: alleen partijen
  van een COMPLETED samenwerking; audit; één review per samenwerking per richting.
- **Flexpool/favorieten**: opdrachtgever bouwt een poule van bewezen ZZP'ers;
  nieuwe diensten eerst naar de pool ("eerst eigen mensen").
- **Tariefinzicht**: "jouw tarief vs. de markt" uit bestaande Performance/Invoice-
  data (geanonimiseerd, mediaan + spreiding per functie/regio).
- **Portable vertrouwensdossier**: exporteerbaar/deelbaar geverifieerd dossier
  (PDF + verifieerbare link) — verificatie wordt een asset voor de ZZP'er.
- **Rooster-marktplaats**: diensten per kalender publiceren/claimen naast
  vacature-achtige opdrachten. _Discovery (open diensten gescoord per dag) + agenda (eigen geboekte
  diensten naast open kansen, `buildAgenda`) staan; de publiceer-/claim-mutatie blijft open._

## Fase 4 — Backend-hardening (vóór livegang)

- Rate-limiting op auth + mutaties (middleware, in-memory → Redis-ready).
- CSP met nonces i.p.v. `unsafe-inline`.
- Kortere JWT-TTL + sessie-invalidatie bij rol-/statuswijziging.
- `@@unique([jobId, freelancerId, companyId])` op Conversation.
- Denormalisatie ongelezen-teller per conversatie.
- pgvector + embeddings voor semantische matching (zodra Postgres live).

## Fase 5 — Mobiel & meldingen

- PWA-polish: offline-shell, installeerbaar, web-push (VAPID = mensenwerk).
- Mobiele kernflows eerst: weekrooster, uren indienen, certificaat-status,
  aan-zet-meldingen.

## Mensenwerk (niet door agents)

Postgres/S3/mail/domein/secrets/backups · Stripe of Mollie · DUO/BIG/iDIN-sleutels ·
pentest + DPIA vóór echte documenten. Zie `MENSENWERK.md`.
