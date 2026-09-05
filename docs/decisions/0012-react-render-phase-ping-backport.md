# ADR 0012 — Backport van de React-fix voor verloren render-fase-pings (issue #329)

- **Status:** geaccepteerd (5-9-2026)
- **Context:** issue #329 — server-action-responses "hangen" in een productiebuild

## Probleem

In een productiebuild (`next start`) bleef na een server action de knop permanent op "Bezig…"
staan terwijl de mutatie server-side allang was geland en `revalidatePath` was aangeroepen. Dit
raakte meerdere formulieren (bureau-activatie op `/admin/franchises`, statuswissels, contract-
ondertekening). Het project werkte er omheen met herlaad-vangnetten in `e2e/_robust.ts`
(`freshen`, `clickUntil`, `clickUntilGone`, `clickForUrl` met `waitUntil: "commit"`) en een
watchdog in `PendingSubmitButton` die na 5 s hard herlaadt.

## Diagnose (gemeten, niet vermoed)

1. De action-POST geeft binnen ~50 ms status 200 en de **volledige** RSC-body komt binnen; React's
   flight-client leest de stream in ~10 ms helemaal uit. Playwright's "No data found for resource"
   is een artefact van gestreamde bodies, geen bewijs van een hang.
2. Na het uitlezen staat de React-root in `pendingLanes = suspendedLanes = warmLanes = 2048,
pingedLanes = 0, callbackNode = null`: de transitie is als "suspended" gemarkeerd, er staat
   geen ping-listener meer in `root.pingCache`, en er is géén render gepland. Elke willekeurige
   andere update op de root (bv. een klik elders) laat de UI binnen 30 ms alsnog doorkomen.
3. Met breakpoints in de gebundelde React (`19.2.0-canary-0bdb9206-20250818`, meegeleverd door
   Next 15.5.24 én 15.5.25) is de volgorde vastgelegd:
   - React zit `SuspendedOnData` op een flight-chunk; de `then`-callback vuurt terwijl de chunk nog
     `resolved_model` is (nog niet geïnitialiseerd). `isThenableResolved` kent alleen
     `fulfilled`/`rejected`, dus React unwindt en roept `attachPingListener` aan.
   - `chunk.then(ping, ping)` initialiseert de chunk **synchroon** en roept `ping` direct aan —
     midden in de render-fase, met `workInProgressRootExitStatus === RootSuspendedWithDelay`.
   - In `pingSuspendedRoot` doet dat pad `(executionContext & RenderContext) === NoContext &&
prepareFreshStack(root, 0)`: in de render-fase gebeurt er dus **niets** — de ping wordt niet
     in `workInProgressRootPingedLanes` gezet en `root.pingedLanes` blijft leeg omdat de lane nog
     niet als suspended geregistreerd is.
   - De render eindigt met `markRootSuspended(lane, didAttemptEntireTree = true)`: suspended +
     warm, zonder listener. `getNextLanes` vindt dan niets meer te doen (niet pinged, al warm).
     Deadlock. Alleen als React de siblings had overgeslagen (`warm = false`) volgde nog een
     prerender die de inmiddels geïnitialiseerde chunk las — vandaar dat het "soms" wel werkte.

Upstream is dit gerepareerd in een latere React-canary (`19.3.0-canary-cbb046ab-20260731`,
meegebundeld met Next 16.3): het render-fase-pad zet de lane nu wél in
`workInProgressRootPingedLanes`. Next 15.5.25 bundelt nog de oude canary.

## Besluit

De eenregelige upstream-fix is teruggezet op de door Next 15.5.24 gebundelde React
(`node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.{production,development}.js`)
via **patch-package** (`patches/next+15.5.24.patch`, toegepast in `postinstall` vóór
`prisma generate`). De regressie is geborgd op twee niveaus:

- `src/lib/system/react-render-phase-ping.test.ts` controleert dat de geïnstalleerde React-bundel
  het fix-pad bevat en het buggy pad niet (faalt luid als de patch niet is toegepast of als een
  Next-upgrade de bundel verandert zonder dat de fix aantoonbaar aanwezig is).
- `e2e/bureau-registratie.spec.ts` activeert een bureau met één gewone klik, zonder herlaad-
  vangnet, in de productiebuild die CI draait.

Afgewogen alternatieven:

- **Upgrade naar Next 16.x** — bevat de fix, maar is een framework-major (proxy i.p.v. middleware,
  Turbopack-default, gewijzigde `experimental`-config) en valt buiten een klein increment. De
  patch is zo geschreven dat hij bij die upgrade overbodig wordt; de unit-test bewaakt dat de fix
  dan native aanwezig is.
- **Meer watchdogs/herlaad-vangnetten in de app** — symptoombestrijding; de 5 s-watchdog kan
  bovendien legitiem trage acties afbreken en formulierstaat vernietigen.
- **Server-side "fixes" in de actions** — de action en de response waren correct; daar zat het
  niet.

## Gevolgen

- Bij een Next-upgrade: `patch-package` faalt hard als de patch niet meer past. Controleer dan of
  de gebundelde React (`grep -o '"19\.[0-9.]*[a-z0-9-]*"' …/react-dom-client.production.js`) de
  fix al bevat; zo ja, verwijder `patches/next+*.patch` en laat de unit-test dat bevestigen.
- De e2e-vangnetten in `e2e/_robust.ts` zijn voor #329 niet meer nodig. Ze blijven voorlopig
  staan omdat ze ook de (echte, losstaande) pre-hydratatie-klikrace afdekken; het
  herlaad-gedrag (`freshen`) kan in een vervolg-PR worden teruggebracht tot "herklik na
  hydratatie". De `PendingSubmitButton`-watchdog kan in datzelfde vervolg vervallen.
