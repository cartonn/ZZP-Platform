# 2026-10-04 — Verval-tijdens-opdracht in de kandidaten-vergelijking

## Rol & waarde

Opdrachtgever (CLIENT). De vergelijkpagina `/kandidaten/vergelijk` is het beslismoment: shortlist-
kandidaten staan naast elkaar met match, compliance, vertrouwen en meer. De compliance-rij toonde
alleen de live status (`computeCompliance` op `now`): een kandidaat met een nu-geldig vereist
certificaat dat vóór of kort na de **startdatum** verloopt kreeg daar een groene "Compliant"-badge —
valse gerustheid precies waar de opdrachtgever kiest. De kandidaten-lijst (`/kandidaten`) waarschuwt
daar al voor via `summarizeCandidateCredentialExpiry`; de vergelijking (en de CSV-export) niet.

## Wijziging (correctheid/UX, geen productie-incident geclaimd)

- `CompareCandidate` krijgt een optioneel `credentialExpiry?: CandidateExpirySummary | null`.
- `candidate-compare-data.ts` vult het met `summarizeCandidateCredentialExpiry` — **zonder extra
  query**: `requiredTypes`, de kandidaat-`credentials` (type/status/expiresAt) en `job.startDate`
  waren al geladen; dezelfde `now` als de compliance/trust-afleiding ernaast.
- De vergelijkpagina toont onder de compliance-badge dezelfde waarschuwing als de lijst
  (danger bij `before-start`, warning bij `soon-after-start`), met exact dezelfde NL-teksten — géén
  nieuwe woordenboek-sleutels. Alleen wanneer compliance niet al blokkeert (`NON_COMPLIANT` draagt al
  een sterker "Mist/Verlopen"-signaal), identiek aan de lijstregel.
- CSV-export: nieuwe kolom "Verval tijdens opdracht" via `formatCredentialExpiryForCsv` (zwaarste
  concern, rauwe ISO-datum zoals de machine-output hoort, extra concerns als `+N`). Parity scherm↔CSV.

Server-side waarheid: de afleiding gebeurt in de ownership-gepoorte data-loader, niet client-side.
Geen nieuwe query, geen nieuw auth-oppervlak, geen mutatie, geen geldstroom.

## Bewijs

- `candidate-compare.test.ts`: kopregel 13→14 kolommen; lege cel bij geen signaal; gevulde cel met
  het zwaarste concern; drie gerichte `formatCredentialExpiryForCsv`-gevallen (leeg/vóór-start/
  kort-na-start + `+N`). 36 tests in het bestand groen.
- `summarizeCandidateCredentialExpiry` zelf is al los getest (`candidate-credential-expiry.test.ts`).
- `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` en `npx prettier --check .`
  groen (zie PR-poort). E2e draait in CI.

Scope: certificaat-dossier/verificatie/verloop + opdrachtgever-UX — binnen de routine-scope.
