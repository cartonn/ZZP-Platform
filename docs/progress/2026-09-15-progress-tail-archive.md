# Oudere voortgang — volledig behouden sectie

## 2026-09-09 — robuustheid: vervalkalender onderdrukt superseded/gedekte certificaten (geen valse vernieuw-nudge)

**Wat:** de vervalkalender `summarizeExpiry` (`src/lib/credential-expiry-overview.ts`) — getoond aan de
ZZP'er op `/certificaten` (ExpiryOverviewCard) én aan de bemiddelaar op `/franchise/zzpers/[id]` (en via
`summarizeExpiryAlert` op `/franchise/zzpers` + de export) — was het énige verval-oppervlak dat de canonieke
superseded-/gedekte-onderdrukking níét toepaste. Élk ander oppervlak sluit een cert dat door een
nieuwer/onbeperkt exemplaar van hetzelfde type gedekt is al uit (`supersededVerifiedCredentialIds`/
`coveredCredentialTypes`): de ZZP-nav-badge (`signals.ts`), de next-actions (`pending-tasks.ts`), de
verval-cron (`expiry-task.ts`) en de bemiddelaar-roostertelling (`rosterExpiringByProfile`). Had een ZZP'er
voor een type twee VERIFIED-certs — één dat binnenkort verloopt én één doorlopend/later-vervallend exemplaar —
dan bleef de kalender "verloopt binnenkort — vernieuw" tonen, terwijl de vereiste al permanent gedekt was: een
valse nudge die nooit op nul komt, plus drift t.o.v. de roostertelling die de bemiddelaar ziet.

**Aanpak (hergebruik, geen duplicatie):** `summarizeExpiry` krijgt de vólledige certificatenlijst binnen, dus
het berekent nu intern `supersededVerifiedCredentialIds` + `coveredCredentialTypes` en slaat twee gevallen over:
(1) een nu-geldig VERIFIED-cert dat superseded is door een nieuwer/onbeperkt exemplaar van hetzelfde type;
(2) een verlopen exemplaar (EXPIRED of computed-expired VERIFIED) van een type dat een ánder nu-geldig
VERIFIED-cert al dekt — exact het geval dat de `coveredCredentialTypes`-docstring benoemt. Verloopt élk exemplaar
van een type, dan valt het type buiten de dekking en blijft de verlopen-melding terecht staan. Het nu-geldige
cover-cert zelf wordt nooit onderdrukt (dat moet de ZZP'er wél vernieuwen vóór het lapst). Geen caller-wijziging;
`summarizeExpiryAlert` (franchise) erft de fix → agreert nu met `rosterExpiringByProfile`.
**Bestanden:** `src/lib/credential-expiry-overview.ts` (+ `.test.ts`: 6 tests — onbeperkt cover onderdrukt,
eerder-vervallend onderdrukt maar later-cover blijft, verlopen-van-gedekt-type onderdrukt, alles-verlopen blijft
zichtbaar, solo-cover blijft zichtbaar, typegrens onderdrukt niet; 2 bestaande fixtures kregen distincte typen
zodat ze windowing/sortering testen i.p.v. incidenteel superseded te triggeren).
**Checks:** typecheck ✓ · lint ✓ · unit (8514/8514, +6) ✓ · build ✓ · prettier ✓ · CI-poort verifiëren (PR #1450).

Oudere notities blijven behouden in [het voortgangsarchief](2026-09-13-prior-progress.md).
