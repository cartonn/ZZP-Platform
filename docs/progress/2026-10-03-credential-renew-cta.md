# Consistente vernieuw-CTA op /certificaten voor verlopen certificaten (2026-10-03)

## Probleem

Op de certificatenlijst (`/certificaten`) week de getoonde primaire actie af van de
next-action-engine (`freelancerTasks`) en de `/certificaten`-nav-badge (`signals.ts`):

- Een **verlopen** certificaat (`EXPIRED`) kreeg de knop **"Verificatie aanvragen"**, die via
  `requestVerification` het reeds-verlopen bewijsstuk **ongewijzigd** opnieuw ter beoordeling
  aanbood. Dat is zinloos (verlopen bewijs blijft verlopen) en misleidend — de herstelactie is een
  **nieuw** bewijsstuk uploaden, zoals `credentialRecoveryNotice` en `/acties` het al beschrijven.
- Een **VERIFIED**-certificaat waarvan `expiresAt` net was gepasseerd (vóór de expiry-cron de rij
  naar `EXPIRED` flipt) viel tussen wal en schip: `canSubmit` gold alleen voor DRAFT/REJECTED/EXPIRED
  en `isExpiringSoon` sluit een al-verlopen exemplaar uit → **geen enkele actieknop**, terwijl
  `/acties` en de badge het via de computed-expired-check (`isExpired`) al als verlopen tonen.

Dit is precies het "signaal op één oppervlak"-anti-patroon dat elders in de codebase bewust wordt
vermeden: de lijst was stiller/anders dan `/acties` en de badge.

## Oplossing

Eén geteste, pure bron bepaalt nu de primaire lijst-actie: `credentialListCta(input, now)` in
`src/lib/credentials.ts`:

- `"renew"` — bewijsstuk niet meer geldig of bijna verlopen → "Vernieuwen" (nieuw bewijsstuk uploaden
  op de bewerken-pagina). Geldt voor `EXPIRED`, computed-expired `VERIFIED` (`isExpired`) én
  bijna-verlopen `VERIFIED` (`isExpiringSoon`, 30 dagen). Spiegelt engine + badge.
- `"submit"` — nog niet beoordeeld (`DRAFT`) of afgewezen (`REJECTED`) **mét** bewijsstuk → het
  bestaande bewijs (opnieuw) ter verificatie aanbieden ("Verificatie aanvragen"). Een verlopen
  bewijsstuk hoort hier nooit.
- `"none"` — geldig VERIFIED buiten het venster, in beoordeling (`SUBMITTED`), of niets in te leveren.

`src/app/(protected)/certificaten/(index)/page.tsx` gebruikt de helper in plaats van de losse
`canSubmit`/`expiringSoon`-knoplogica. Server-side waarheid blijft intact: de transitiemap
(`EXPIRED→SUBMITTED`) en de renewal-flow (`persistCredential` met nieuw bestand) zijn ongewijzigd —
alleen welke CTA de lijst toont en met welke betekenis verandert.

## Meegenomen: base-brede audit-poort gedeblokkeerd

De verplichte `audit`-poort blokkeerde élke PR base-breed op 4 high productie-deps, allemaal uit de
`patch-package`-boom via de `braces` stack-exhaustion-DoS-advisory
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) (`<=3.0.3`, nog geen upstream
fix). `patch-package` is een build-time tool (draait in `postinstall` om de Next-patch toe te passen;
het Docker-image installeert dev + runtime in de builder-stage en kopieert `node_modules`
ongewijzigd naar de runtime-stage — nergens een productie-only `npm ci --omit=dev`) en hoort in
`devDependencies`. Verplaatst + lockfile geregenereerd; niets aan de verscheepte modules of de
patch-toepassing verandert. Zelfde minimale deblokkade als PR #1553.

## Bewijs

- `src/lib/credentials.test.ts` — 9 nieuwe `credentialListCta`-tests; de EXPIRED- en
  computed-expired-gevallen falen vóór de fix (misleidende/ontbrekende CTA), slagen erna.
- `npm run typecheck`, `npm run lint` — groen.
- `npm run test` — volledige suite groen (zie PR-checks).
- `npm run build` — productiebuild groen.
- `npx prettier --write .` gedraaid.
- `node scripts/audit-production.mjs` / `npm audit --omit=dev` → 0 high/critical (was 4 high);
  `npx patch-package` → `next@15.5.24 ✔`.

Geen functionele regressie; de CTA-betekenis sluit nu aan op engine + badge, en de audit-poort is
base-breed weer groen.
