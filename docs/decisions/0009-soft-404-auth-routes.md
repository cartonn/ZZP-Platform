# ADR-0009: Soft-404 op geauthenticeerde detailroutes bewust geaccepteerd

- **Status:** aanvaard
- **Datum:** 2026-06-15

## Context

De persona-sweep (15-6) en de QA-robuustheidstests merkten op dat de `(protected)` detailroutes
(`/samenwerkingen/[id]`, `/facturen/[id]`, `/opdrachten/[id]`) bij een onbestaand of niet-toegankelijk
id de nette "Niet gevonden / je hebt er geen toegang toe"-pagina tonen, maar met **HTTP-status 200**
in plaats van 404 ("soft-404"). De publieke route `/zzp/[id]` geeft daarentegen wél een echte 404.

Met een productie-build (`CI=true`, `npm run start`) gemeten: alle drie protected detailroutes geven
200, `/zzp/[id]` geeft 404. (Eerdere aanname in `e2e/qa/critical-personas.spec.ts` dat dit alleen
lokaal gebeurt en in CI een echte 404 oplevert, is dus onjuist — het is óók 200 in productie.)

**Oorzaak.** De geneste **async** `(protected)/layout.tsx` (`await auth()` → rendert de app-schil)
laat Next.js de schil met status 200 flushen vóórdat de onderliggende pagina `notFound()` bereikt.
De statuscode is dan al verstuurd. `/zzp/[id]` zit niet onder die extra async-layer, dus daar zet
`notFound()` wél een echte 404. Dit is fundamenteel App-Router-streaming-gedrag, geen losse bug.

## Besluit

**De soft-404 op geauthenticeerde detailroutes wordt geaccepteerd.** Reden:

- **Geen echte schade.** Deze routes zitten achter login → geen SEO-indexering van niet-gevonden
  pagina's. De niet-gevonden-pagina rendert correct (goede UX). Er is **geen datalek**: de
  ownership-/tenant-checks (`notFound()` ná de query) voorkomen dat data van een ander lekt — door
  de persona-sweep adversarieel bevestigd (geen IDOR/cross-tenant-toegang).
- **De echte-404-fix kost te veel.** Een harde 404 kan alleen door de protected-schil **niet te
  laten streamen** (de schil moet wachten op de pagina). Dat is een perceived-perf-regressie op
  **élke** protected pagina (zijbalk verschijnt later) — niet de moeite waard voor een cosmetische
  statuscode zonder echte schade.

## Gevolgen

- Persona-sweep/QA flaggen dit niet meer als gat (deze ADR is de verwijzing).
- De QA-robuustheidstest (`expectDenied`) toetst **de zichtbare niet-gevonden-marker** (die de soft-404
  rendert) i.p.v. de brosse statuscode, en **wacht** erop (de marker streamt na) — zo geen flaky reds.
- Heroverwegen als deze routes ooit publiek (zonder login) bereikbaar worden: dan telt SEO wél en is
  een echte 404 gewenst.

## Alternatieven

- **Echte 404 forceren** (schil niet laten streamen): afgewezen — globale perf-regressie voor een
  cosmetisch puntje. Zie de afweging hierboven.
