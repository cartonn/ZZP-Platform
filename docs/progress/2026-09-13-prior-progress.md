# Eerdere voortgang — verplaatst op 13 september 2026

## 2026-09-09 — robuustheid: doorlopend cert onderdrukt valse collab-verval-nudge (ZZP'er) + badge↔lijst-pariteit

**Wat:** `collaborationCredentialExpiryConcerns` (`src/lib/collaboration-credential-expiry.ts`) — de bron
achter zowel de ZZP'er-taak `credentialCollabExpiryTask` (`pending-tasks.ts`) als de /certificaten-nav-badge
(`signals.ts` `collabDuringPlacementAlerts`) — bouwde `latestByType` uit uitsluitend gedáteerde VERIFIED-certs
(`if (c.status !== "VERIFIED" || !c.expiresAt) continue`) en sloeg een **doorlopend** (nooit vervallend,
`expiresAt == null`) VERIFIED-cert stil over. Had een ZZP'er voor een vereist type twéé geldige certs — één dat
binnenkort verloopt én één doorlopend exemplaar — dan bleef de binnenkort-vervallende de "vernieuw je certificaat
voor samenwerking X"-taak/badge voeden, terwijl het doorlopende cert de vereiste al permanent dekt. Een valse,
onoplosbare verval-nudge die nooit op nul komt — precies het "signaal dat nooit nuttig verdwijnt"-anti-patroon.

**Aanpak (hergebruik, geen duplicatie):** de fix spiegelt de al bestaande regel in
`supersededVerifiedCredentialIds` (`credentials.ts`) — dat een gedateerd cert als _superseded_ markeert zodra
een doorlopend (of later-vervallend) exemplaar bestaat, en dáár al de generíeke verval-nudge onderdrukt (de
collab-anker-helper deed dat als enige niet, terwijl de superseded-doc-comment 'm expliciet noemt). `latestByType`
ving de later-vervallende-gedateerde variant al impliciet (het kiest het laatst-vervallende); nu wordt een type met
een doorlopend geldig VERIFIED-cert opgenomen in `permanentlyCoveredTypes` en overgeslagen bij het afleiden van
zorgen. Zowel de taak als de badge lezen uit dezelfde pure helper → geen badge↔lijst-drift. Andere types (het
doorlopende cert is een ánder type) en niet-geverifieerde doorlopende certs blijven de zorg terecht staan.
**Bestanden:** `src/lib/collaboration-credential-expiry.ts` (+ `.test.ts`: 4 tests — doorlopend cert onderdrukt
binnen-venster- én mid-plaatsing-zorg, ander type onderdrukt niet, niet-geverifieerd doorlopend cert dekt niet).
**Checks:** typecheck ✓ · lint ✓ · unit (helper+signals+credentials 82/82) ✓ · prettier ✓ · full unit + build +
CI-poort verifiëren (PR volgt).

## 2026-09-09 — geld/robuustheid: uren-invoer op de cent-grid afgedwongen (getoonde uren == gefactureerde uren)

**Wat:** de open MED-kandidaat uit de 8-9-notitie hieronder gedicht. De factuurmotor
`hoursTimesRateCents` (`src/lib/administration/hourly-cents.ts`) kwantiseert uren stil naar honderdsten
(`Math.round(hours * 100)`). Uren met méér dan twee decimalen passeerden de validatie (`validatePerformanceForm`/
`assertPerformanceWithinLimits` checkten alleen finite/positief/max, geen 2-decimaal-stap) en werden bij
factuurafleiding geherkwantiseerd — bv. een geknutselde POST of CSV-import met `4,149` uur factureert als
`4,15` uur, terwijl de urenstaat/PDF/CSV `4,149` blijft tonen. Getoonde ≠ gefactureerde hoeveelheid, precies op
het administratie-vertrouwensvlak. **Geld ongemoeid** — de beschermde motor (`hourly-cents.ts`, #1440) is niet
aangeraakt; de fix zit puur op de invoer-grens zodat de kwantisatie een no-op wordt.

**Aanpak (hergebruik, geen duplicatie):** één float-veilig predikaat `isCentAccurateHours(hours)` in
`hourly-cents.ts` (co-locatie met de kwantisatie die het spiegelt): `|hours·100 − round(hours·100)| ≤ 1e-6`
accepteert geldige 2-decimalen inclusief IEEE-754-ruis (1,67 → 166,999…997; 4,15 → 415,000…006) en weigert elke
3e+ decimaal (afstand ≥ 0,1 in geschaalde ruimte). `assertPerformanceWithinLimits` — het choke point voor
formulier, CSV-import (`diensten/importeer`) én admin — weigert nu `hours` en elk ORT-`seg.hours` buiten de grid
(`"Vul de uren in met maximaal twee decimalen."`); `validatePerformanceForm` geeft dezelfde vriendelijke
formulierfout op `hours`/`ortTotal`. Shift-/CSV-afgeleide uren (al op honderdsten via `segmentsFromMinutes`)
blijven geldig; een malformede CSV-rij degradeert tot een per-rij-skip (bestaande `toSafeActionError`-catch).
**Bestanden:** `src/lib/administration/hourly-cents.ts` (+ `.test.ts`: 3 tests — grid-acceptatie incl. float-ruis,
weigering >2 decimalen, consistentie met de kwantisatie), `src/lib/cascade/performance-commands.ts` (+ `.test.ts`:
4 tests — `hours` en `seg.hours` grid-guards), `src/lib/validation.ts` (+ `.test.ts`: 3 tests — `hours`/`ortTotal`
grid + float-noisy 1,67 blijft geldig). **Checks:** typecheck ✓ · lint ✓ · unit (affected 115/115) ✓ · prettier ✓ ·
full unit + build + CI-poort verifiëren (PR #1447).

Oudere entries van 8 en 9 september staan ongewijzigd in
[het voortgangsarchief](2026-09-12-prior-progress.md).
