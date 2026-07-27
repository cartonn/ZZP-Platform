# MENSENWERK — wat een mens moet doen vóór livegang

> Dit platform is grotendeels geautomatiseerd gebouwd én getest. **Alles wat softwarematig kan,
> is gedaan.** Dit bestand bevat **alleen** wat een mens écht moet doen: dingen waarvoor een
> handtekening, een account, een betaalmethode, een geheim (wachtwoord/sleutel), een juridisch
> oordeel of een afspraak met een externe partij nodig is. Een agent mag/kan dat niet voor je doen.
>
> Geschreven voor een **niet-technisch** persoon. Je hoeft niets te programmeren. Per onderdeel:
> **Wat**, **Waarom**, **Stappen**, en **Wat lever je op** (en aan wie). Waar "geef door aan je
> ontwikkelaar/agent" staat, bedoelen we: zet het in de beveiligde instellingen (zie §7), daarna
> regelt de software de rest.

## Gouden regels (lees dit eerst)

1. **Zet geheimen NOOIT in een chat, e-mail, document of in de broncode.** Sleutels/wachtwoorden
   horen alleen in de beveiligde "secrets"-kluis van je hostingplatform (zie §1 en §7).
2. **Eén ding tegelijk, in de volgorde hieronder.** §0 is de snelste route naar een veilige pilot.
3. **Niets met echte, gevoelige documenten (VOG, diploma's, ID) live zetten** vóór de
   securitycheck en privacycheck in §5 zijn afgerond. Dat is een AVG-risico en je
   verantwoordelijkheid.
4. Twijfel je? Laat het bij §5 (juridisch/privacy) en §4 (externe koppelingen) door een
   specialist bevestigen. De rest is vooral "accounts aanmaken en sleutels doorgeven".

---

## §0. Snelste route naar een veilige pilot (volgorde)

Doe het in deze volgorde; elk blok verwijst naar het detail eronder.

1. **Bedrijf op orde** (§6): KvK-inschrijving + zakelijke bankrekening (heb je nodig voor
   betalingen en contracten).
2. **Hosting + database + opslag + domein** (§1): hier draait het platform.
3. **E-mail** (§2): zodat gebruikers meldingen/bevestigingen krijgen.
4. **Juridisch & privacy** (§5): privacyverklaring, verwerkersovereenkomsten, bewaartermijnen,
   security-/privacycheck. **Dit blokkeert livegang met echte gegevens.**
5. **Externe verificatie** (§4): DUO, BIG-register, iDIN — alleen nodig zodra je échte
   diploma-/identiteitscontrole wilt. De pilot kan starten met de ingebouwde demo-verifier.
6. **Betalingen** (§3): pas nodig als je echt geld gaat innen voor abonnementen.
7. **Eerste beheerder + demo-data uit** (§6).

> Een **besloten pilot zonder echte gevoelige documenten** kan na 1–3 + 5. Volledige livegang
> vraagt ook 4 en (bij betaald gebruik) 6.

---

## §0b. Security-review 12-6-2026 — twee punten voor de mens

- **SHARE_TOKEN_SECRET zetten in productie** (H-1): zonder eigen sleutel vallen deelbare
  dossier-links terug op AUTH_SECRET — rotatie van het één breekt dan het ander. Genereer met
  `openssl rand -base64 32` en zet hem in de Railway-secrets vóór de eerste echte deel-link.
  **Code-kant GEDAAN (24-6-2026):** de env-validatie (`src/lib/env.ts`) dwingt dit nu **af in
  productie** — bij `NODE_ENV=production` faalt de boot duidelijk zonder `SHARE_TOKEN_SECRET`
  (idem voor `AUTH_URL` en een AUTH_SECRET ≥ 32 tekens). Resterend mensenwerk: alleen de secret
  genereren + plakken in de Railway-secrets.
- **Gedeelde rate-limit-store vóór horizontale schaling** (H-2, **code-kant GEDAAN 25-6-2026**):
  de limiters zijn per-proces in-memory; bij meerdere Railway-instances zijn de limieten per
  instance. De `RateLimitStore`-interface is nu echt pluggbaar: naast de in-memory default zit er
  een **Upstash Redis REST**-adapter achter (`src/lib/rate-limit.ts`, `UpstashRateLimitStore`,
  fixed-window via atomaire pipeline INCR/PEXPIRE NX/PTTL, fail-open bij Redis-storing zodat een
  blip login/registratie niet platlegt). Activeer met `RATE_LIMIT_STORE=upstash` +
  `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`; de env-validatie eist die twee secrets af
  zodra de driver op upstash staat en waarschuwt in productie zolang hij op memory staat. Geen extra
  SDK-dependency (praat via fetch met de REST-API). Resterend mensenwerk: alleen een (gratis)
  Upstash-Redis-database in een EU-regio aanmaken, de REST-URL + token in de Railway-secrets zetten
  en `RATE_LIMIT_STORE=upstash` zetten — daarna gelden de limieten over alle instances samen.
  **Code-kant GEDAAN (2026-07-15) — connectiviteitszelftest:** omdat de Upstash-store bewust
  **fail-open** is (een Redis-storing mag login/registratie niet platleggen), zou een verkeerd
  geplakte REST-URL/token **stil** falen — de limieten gelden dan in werkelijkheid niet gedeeld,
  terwijl niets dat toont. Op `/admin/systeemstatus` (admin-only) kun je nu de **Rate-limit-zelftest**
  draaien: die doet een echte round-trip tegen de geconfigureerde store (INCR → PEXPIRE/PTTL → DEL →
  EXISTS) onder een eigen `rl:selftest:`-key en **surfacet fouten** (geen fail-open) zodat een kapotte
  configuratie meteen zichtbaar is (`src/lib/services/ratelimit-selftest.ts`, actie in
  `.../systeemstatus/actions.ts`). Staat de store nog op `memory`, dan meldt het scherm eerlijk "geen
  gedeelde store actief — er is niets getest" (geen vals groen). De uitvoer bevat nooit secrets (alleen
  stap-uitkomsten + store-modus), loopt door de authz-keten (rol → rate-limit → audit) en laat nooit
  een probe-key achter. Resterend mensenwerk: **niets extra** — de knop is er zodra
  `RATE_LIMIT_STORE=upstash` staat.
- **Externe error-monitoring (Sentry) aanzetten** (laag, code-kant GEDAAN 24-6-2026): server-fouten
  worden nu gestructureerd en PII-veilig gelogd (`src/lib/observability/`), met een readiness-endpoint
  (`/api/readiness`, los van `/api/health`) en een error-reporting-grens die Next.js-server-fouten
  opvangt (`onRequestError`). **Ook onbewaakte cron-/achtergrondtaakfouten bereiken deze grens
  (code-kant GEDAAN 5-7-2026):** `/api/tasks/run-all` én de losse taak-routes routeren een gefaalde
  taak via `reportBackgroundFailure` (`src/lib/observability/report.ts`) — altijd lokaal
  gestructureerd + naar Sentry als `SENTRY_DSN` gezet is. Voorheen verdween zo'n fout op de
  dagelijkse 05:00-cron stil in de logs (of werd volledig geslikt in de per-taak-routes). De grens is
  **Sentry-ready achter een vlag**: zet `SENTRY_DSN` in de secrets én installeer `@sentry/nextjs`
  (`npm i @sentry/nextjs`) en externe monitoring activeert vanzelf. Zolang dat ontbreekt draait alles
  veilig door op gestructureerd loggen — niets te doen voor de pilot. Optioneel: `LOG_LEVEL`
  (debug/info/warn/error, default info). **Ook browser-fouten bereiken deze grens nu (code-kant GEDAAN
  7-7-2026):** een gevangen client-side fout (React-render-crash in de error-boundaries
  `error.tsx`/`global-error.tsx`/`(protected)/error.tsx`) wordt PII-arm naar `/api/client-error`
  gestuurd en via `reportError` gestructureerd gelogd + (bij `SENTRY_DSN`) naar Sentry geëscaleerd.
  Voorheen bleef zo'n crash onzichtbaar in de browser-console van de gebruiker. Rate-limited per IP
  (`CLIENT_ERROR_RATE_LIMIT`, default 20/min). **Sentry-init gehard (code-kant GEDAAN 14-7-2026):** de
  init geeft niet langer een kaal `{ dsn }` mee maar gehardende opties
  (`src/lib/observability/sentry-options.ts`): `sendDefaultPii: false` + een `beforeSend` die
  cookies, request-body, query-string, niet-veilige headers (Authorization/Cookie/X-Forwarded-For) en
  gebruikersidentiteit (e-mail/IP) uit elk event scrubt vóór verzending naar de externe verwerker —
  nodig omdat Sentry (mogelijk buiten de EER) anders die PII by default meestuurt (AVG,
  dataminimalisatie). Daarnaast `environment` (valt terug op `NODE_ENV`) en `release` (de commit-SHA)
  voor deploy-correlatie, en `tracesSampleRate: 0` (errors-only). Optioneel bij te stellen via
  `SENTRY_ENVIRONMENT`/`SENTRY_RELEASE`/`SENTRY_TRACES_SAMPLE_RATE`. Resterend mensenwerk: **niets voor
  de pilot**.
  **Code-kant GEDAAN (2026-07-20) — error-monitoring-connectiviteitszelftest:** omdat de reporter bij
  een **niet-geïnstalleerd** `@sentry/nextjs` **stil** terugvalt op console-loggen, zou een gezette
  `SENTRY_DSN` de illusie van externe monitoring wekken terwijl productie-fouten onzichtbaar blijven —
  precies de stille faalmodus die de andere zelftests ook afvangen. Op `/admin/systeemstatus`
  (admin-only) kun je nu de **Error-monitoring-zelftest** draaien: die stuurt één **synthetische**
  testgebeurtenis via de gehardende Sentry-init (PII-scrubbing) en wacht op `flush()` als bewijs dat
  het transport de gebeurtenis accepteerde. Ontbreekt het pakket bij een gezette DSN, dan meldt het
  scherm dat expliciet als **aandacht** ("installeer `@sentry/nextjs`"); staat er geen DSN, dan meldt
  het eerlijk "geen monitoring geconfigureerd — er is niets getest" (geen vals groen). De uitvoer bevat
  nooit de DSN of secrets (alleen pakket-geïnstalleerd/afgeleverd + een veilige toelichting), loopt door
  de authz-keten (rol → rate-limit → audit) en escaleert geen echte fout
  (`src/lib/services/error-monitoring-selftest.ts` + `probeErrorMonitoring` in
  `src/lib/observability/report.ts`, actie in `.../systeemstatus/actions.ts`, zelfde patroon als de
  Opslag-/E-mail-/Rate-limit-/Verificatie-/Betaalprovider-/Upload-scanner-zelftest). Resterend
  mensenwerk: **niets extra** — de knop is er zodra `SENTRY_DSN` gezet is (en `@sentry/nextjs`
  geïnstalleerd).
- **CSP-violatie-rapportage aanzetten/monitoren** (laag, code-kant GEDAAN 5-7-2026): de
  Content-Security-Policy stuurt nu violatie-rapporten naar een eigen endpoint (`/api/csp-report`)
  via `report-to` (moderne Reporting API + `Reporting-Endpoints`-header) én `report-uri` (fallback,
  `src/lib/csp.ts` + `src/middleware.ts`). Rapporten worden PII-arm genormaliseerd
  (`src/lib/observability/csp-report.ts`: document-URL → alleen pad, geblokkeerde/bron-URL → alleen
  origin, referrer/user-agent/original-policy weggegooid, sample afgekapt) en gestructureerd gelogd
  (`csp-violation`, rate-limited per IP). **Waarde:** je ziet nu in productie wat de policy blokkeert
  → nodig om (a) injectiepogingen te detecteren en (b) de policy later veilig te verstrakken (de
  `'unsafe-inline'`-scriptfallback laten vallen zodra de logs bevestigen dat legitieme code niet
  meer geraakt wordt). Resterend mensenwerk: **niets voor de pilot** — de rapporten landen automatisch
  in de hostlogs (Railway/Datadog). Optioneel: hang na een paar dagen productie een monitor op de
  `csp-violation`-logregels en verstrak de policy op basis daarvan (of stuur `SENTRY_DSN` mee zodat
  ze ook extern zichtbaar worden).
- **Malware-scan van uploads** (laag, code-kant GEDAAN 6-7-2026): geüploade bewijsstukken (VOG,
  diploma's, verzekering) worden vóór opslag nu gecontroleerd via een pluggbare scan-abstractie
  (`src/lib/services/upload-scanner.ts`, zelfde patroon als de opslag-/mail-/rate-limit-seams):
  standaard `NoopUploadScanner` (scan overgeslagen, pilot ongewijzigd) of, achter
  `UPLOAD_SCANNER=clamav`, een `ClamAvUploadScanner` die met een eigen ClamAV-daemon praat (rauw
  clamd INSTREAM-protocol, geen extra dependency). Gewired vóór opslag in zowel de documenten- als
  de certificaten-upload. **Fail-closed:** is de scanner niet bereikbaar, dan wordt de upload
  geweigerd (met foutmelding); `UPLOAD_SCAN_FAIL_OPEN=true` schakelt bewust door naar doorlaten
  tijdens een storing. Resterend mensenwerk: een ClamAV clamd-daemon draaien (bijv. als sidecar/
  losse service in een EU-regio), en `CLAMAV_HOST` (+ evt. `CLAMAV_PORT`) + `UPLOAD_SCANNER=clamav`
  in de Railway-secrets zetten. Zolang dat ontbreekt draait alles veilig door zonder scan.
  **Code-kant GEDAAN (2026-07-19) — connectiviteitszelftest:** omdat de scanner **fail-closed** is,
  zou een verkeerd geplakte `CLAMAV_HOST`/`CLAMAV_PORT` stil **álle** uploads blokkeren tot een admin
  een echt document probeert te uploaden. Op `/admin/systeemstatus` (admin-only) kun je nu de
  **Upload-scanner-zelftest** draaien: die stuurt de standaard **EICAR-testprobe** naar de
  geconfigureerde clamd-daemon en bevestigt dat de scanner **bereikbaar** is én het testvirus
  **daadwerkelijk detecteert** (een clamd met lege/kapotte virusdefinities geeft anders stil "clean"
  terug — die stille storing vangt de zelftest expliciet af). Er wordt géén echt bestand opgeslagen.
  Staat de scan nog op `noop`, dan meldt het scherm eerlijk "Geen scanner actief — er is niets getest"
  (geen vals groen). De uitvoer bevat nooit secrets (alleen stap-uitkomst + driver-modus), loopt door
  de authz-keten (rol → rate-limit → audit) en toont alleen bereikbaarheid/detectie
  (`src/lib/services/upload-scanner-selftest.ts`, actie in `.../systeemstatus/actions.ts`, zelfde
  patroon als de Opslag-/E-mail-/Rate-limit-/Verificatie-/Betaalprovider-zelftest). Resterend
  mensenwerk: **niets extra** — de knop is er zodra `UPLOAD_SCANNER=clamav` staat.
- **Dependency graph + Dependabot aanzetten** (laag, web-toggle): de `dependency-review`-poort
  vereist GitHub's Dependency graph. Zet die (en Dependabot security updates) aan op
  github.com/cartonn/ZZP-Platform/settings/security_analysis. De supply-chain-CVE-check draait
  nu al via `npm audit` (de `audit`-poort); dependency-review is een extra laag (licenties +
  PR-diff) die je daarna kunt terugzetten als vereiste check.

- **Uitgaande HTTP-timeouts voor externe koppelingen** (laag, code-kant GEDAAN 9-7-2026): elke
  uitgaande call naar een externe dienst (Mollie/Stripe voor betalingen, Resend voor e-mail, Upstash
  voor de gedeelde rate-limit) heeft nu een **harde time-out** (`src/lib/services/fetch-timeout.ts`),
  net als de verificatie-koppelingen al hadden. Een trage of hangende externe endpoint blokkeert de
  server-request dus niet meer onbeperkt (beschikbaarheid onder last). Defaults zijn veilig (10 s;
  rate-limit 2,5 s en **fail-open** zodat login/registratie niet blokkeert bij een Redis-storing).
  Resterend mensenwerk: **niets** — optioneel bij te stellen via `BILLING_HTTP_TIMEOUT_MS`,
  `EMAIL_HTTP_TIMEOUT_MS`, `RATE_LIMIT_HTTP_TIMEOUT_MS` (ms, geklemd op 1000–60000).

- **Zoekmachine-indexering afgeschermd** (laag, code-kant GEDAAN 9-7-2026): dit platform is
  login-gated en verwerkt gevoelige documenten — een besloten pilot hoort niet in Google. Indexering
  staat nu **standaard uit**: `/robots.txt` (`src/app/robots.ts`) disallowt alles en elke response
  draagt `X-Robots-Tag: noindex, nofollow` (`next.config.mjs`, defense-in-depth). Bron van waarheid:
  `src/lib/indexing.ts`. Zichtbaar op `/admin/systeemstatus`. Resterend mensenwerk: **niets voor de
  pilot**; zet bij go-live desgewenst `ALLOW_INDEXING=true` in de Railway-secrets om zoekmachines te
  laten indexeren (dan vervallen robots-disallow én de noindex-header).

- **Beveiligingscontact / security.txt** (laag, code-kant GEDAAN 10-7-2026): dit platform verwerkt
  gevoelige documenten (VOG, diploma's, ID) en gaat vóór livegang door een securityreview/pentest
  (§5d). Er is nu een machine-leesbaar meldpunt voor **gecoördineerde kwetsbaarheidsmelding** volgens
  **RFC 9116** op `/.well-known/security.txt` (`src/app/.well-known/security.txt/route.ts`, bron van
  waarheid `src/lib/security-txt.ts`): een welwillende onderzoeker vindt zo direct waar hij een
  kwetsbaarheid verantwoord kan melden i.p.v. publiek te dumpen. Het bestand wordt **altijd** geserveerd
  (nooit gecachet, `Expires` per request in de toekomst zodat het niet verloopt) en valt zonder config
  veilig terug op `mailto:security@<host>`. Zichtbaar op `/admin/systeemstatus`. Resterend mensenwerk:
  **niets voor de pilot**; zet `SECURITY_CONTACT` (komma-gescheiden mailto:/https: toegestaan) naar een
  **bewaakte mailbox** vóór de pentest zodat meldingen bij een echt persoon landen.
- **Connection-pool-configuratie voor productie-Postgres** (laag, code-kant GEDAAN 11-7-2026):
  Prisma opent per proces een eigen pool (default num_cpus\*2+1 connecties); bij horizontale
  schaling (meerdere Railway-instances) kan dat het connectie-plafond van de managed Postgres
  uitputten. Er is nu een pluggbare, inert-by-default seam (`src/lib/db-connection.ts`, gewired
  in `src/lib/db.ts`) die de pool per instance begrenst via env, zónder `DATABASE_URL` aan te
  passen. Zichtbaar op `/admin/systeemstatus` ("DB-connectiepool"). Resterend mensenwerk:
  **niets voor de pilot** (single instance draait op Prisma-defaults). Bij horizontale schaling:
  zet `DATABASE_CONNECTION_LIMIT` (bijv. 5–10 per instance) in de Railway-secrets; gebruik je een
  PgBouncer/Supabase-pooler, zet dan ook `DATABASE_PGBOUNCER=true`.
- **Request-correlatie-ID voor log-/foutkoppeling** (laag, code-kant GEDAAN 12-7-2026): elke
  HTTP-request draagt nu een `x-request-id`-correlatie-ID (`src/lib/observability/request-id.ts`,
  gewired in `src/middleware.ts`) — overgenomen van een upstream proxy/load-balancer (Railway/CDN
  zetten die vaak al) of anders server-side gegenereerd, gesaneerd tegen header-/log-injectie en
  begrensd (64 tekens). De ID wordt **op de response geëchood** (zichtbaar in de Network-tab) én
  meegenomen in álle error-rapporten: Next's `onRequestError`-grens, de client-fout-ontvanger
  (`/api/client-error`) en achtergrondtaken — als logveld en, met `SENTRY_DSN`, als Sentry-**tag**
  (`request_id`). **Waarde:** support kan een gebruiker-zichtbare fout ("het brak, referentie X")
  koppelen aan de exacte server-log-/Sentry-regels van díe request. Resterend mensenwerk: **niets
  voor de pilot** — werkt out-of-the-box; zet een upstream proxy desgewenst een eigen `x-request-id`
  dan loopt de correlatie over de hops door.

- **Graceful shutdown / connection draining** (laag, code-kant GEDAAN 13-7-2026): bij een deploy of
  container-stop (SIGTERM/SIGINT) zet de server nu `/api/readiness` op `503` (`"draining": true`) terwijl
  `/api/health` bewust `200` blijft — de load balancer stopt zo met nieuw verkeer naar de afsluitende
  instance, terwijl Next de lopende requests (uploads, cascade-mutaties, webhooks) netjes laat afronden.
  Sluit Next niet binnen `SHUTDOWN_FORCE_KILL_MS` af (default 25000 ms, geklemd [1000,120000]), dan
  forceert `scripts/start.mjs` een `SIGKILL` zodat een deploy nooit blijft hangen (bron:
  `src/lib/observability/shutdown.ts`, gewired in `src/instrumentation.ts` + `src/app/api/readiness/route.ts`).
  Resterend mensenwerk: **niets voor de pilot** — werkt out-of-the-box; optioneel `SHUTDOWN_FORCE_KILL_MS`
  bijstellen. Zie RUNBOOK §2.

## §1. Hosting, database, opslag, domein, geheimen

**Wat:** de plek waar de website draait, waar gegevens worden bewaard en waar documenten veilig
worden opgeslagen.
**Waarom:** lokaal draait het op een testdatabase; voor echt gebruik heb je een productie-omgeving
nodig met back-ups en beveiligde opslag.

### 1a. Hostingaccount

**Stappen:**

1. Maak een account bij een hostingplatform dat Next.js draait (bijv. **Vercel**) of laat je
   ontwikkelaar/agent een keuze voorstellen.
2. Voeg een betaalmethode toe (zakelijke kaart).
3. Koppel de GitHub-repository `cartonn/zzp-platform` (lees-toegang volstaat).
   **Opleveren:** toegang tot het project op het hostingplatform (nodig om secrets te zetten).

### 1b. Database (PostgreSQL)

**Stappen:**

1. Maak een **managed PostgreSQL**-database aan (bijv. Neon, Supabase, of de databasedienst van je
   host). Kies een EU-regio (AVG).
2. Zet **automatische back-ups** aan.
3. Kopieer de **verbindings-URL** (begint met `postgresql://...`). Dit is een geheim.
   **Opleveren:** de verbindings-URL → in de secrets als `DATABASE_URL` (§7). Geef je ontwikkela/agent
   het seintje "Postgres staat klaar"; die zet de databaseprovider om naar PostgreSQL en draait de
   eenmalige migratie.
   **Code-kant GEDAAN (11-7-2026) — connection-pool-configuratie:** de Prisma-client kan de
   connectie-pool nu per instance begrenzen (`DATABASE_CONNECTION_LIMIT`, optioneel
   `DATABASE_POOL_TIMEOUT`/`DATABASE_PGBOUNCER=true`), nodig zodra je op meerdere instances draait
   (zie §0b). Voor de pilot (één instance) hoef je niets te zetten.
   **Code-kant GEDAAN (2026-07-20) — connectiviteits-/schema-zelftest:** na het omzetten naar
   productie-Postgres kun je op `/admin/systeemstatus` (admin-only) de **Database-zelftest** draaien
   — zelfde patroon als de Opslag-/E-mail-/Rate-limit-/Verificatie-/Betaalprovider-/Upload-scanner-/
   Error-monitoring-zelftest. Die doet een **read-only** round-trip tegen de databank (SELECT 1 +
   bestaanscheck op kern-tabellen) en bevestigt drie dingen: (a) de verbinding werkt en hoe snel de
   round-trip is (latency), (b) je draait op de **verwachte provider** (PostgreSQL i.p.v. de lokale
   SQLite) mét de actieve pool-samenvatting, en (c) het **schema/de migratie is écht toegepast** —
   `scripts/start.mjs` doet bij elke boot een `prisma db push`, maar een half-mislukte push zou stil
   een verouderd schema achterlaten; die stille faalmodus vangt de zelftest expliciet af. Er wordt
   niets geschreven (geen mutatie, niets op te ruimen). De uitvoer bevat **nooit** de `DATABASE_URL`
   of secrets (alleen de afgeleide provider, latency, pool-samenvatting + per-stap-uitkomst), loopt
   door de authz-keten (rol → rate-limit → audit) en toont alleen bereikbaarheid/schema
   (`src/lib/services/db-selftest.ts`, actie in `.../systeemstatus/actions.ts`). Resterend
   mensenwerk: **niets extra** — de knop is er standaard (en meldt eerlijk de lokale SQLite-provider
   tot `DATABASE_URL` op Postgres staat).

### 1c. Documentopslag (S3 of S3-compatibel)

**Wat:** veilige, niet-openbare opslag voor geüploade bewijsstukken (VOG, diploma's, verzekering).
**Stappen:**

1. Maak een **opslag-bucket** aan (AWS S3 of een S3-compatibele dienst), in een EU-regio.
2. Zet de bucket op **privé** (niet publiek toegankelijk).
3. Maak een toegangssleutel/IAM-gebruiker met **alleen** lees-/schrijfrechten op die ene bucket.
   **Opleveren:** bucketnaam, regio en de sleutels → secrets `STORAGE_DRIVER=s3`,
   `STORAGE_S3_BUCKET`, `STORAGE_S3_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (§7).
   **Code-kant GEDAAN (25-6-2026):** de S3-driver levert nu **presigned download-URLs**
   (`getSignedDownloadUrl`, kortlevend, default 300 s — instelbaar via `STORAGE_S3_URL_TTL`), zodat
   logo's/documenten rechtstreeks bij de opslag worden opgehaald i.p.v. door de app-server gestreamd
   (bandbreedte/geheugen). Gewired in de logo-route; de gevoelige document-route blijft bewust
   server-streamen (sandbox-CSP) tot een security-review presigned daar vrijgeeft. Resterend
   mensenwerk: alleen de bucket + sleutels aanmaken en `STORAGE_DRIVER=s3` zetten — de rest is
   automatisch.
   **Code-kant GEDAAN (6-7-2026) — encryptie-at-rest:** elke upload naar S3 zet nu **expliciet**
   server-side-encryptie (`resolveSseParams` in `src/lib/services/storage.ts`), zodat gevoelige
   documenten (VOG, diploma's, verzekering) versleuteld op schijf staan **zonder** te leunen op de
   bucket-default (een verkeerd geconfigureerde bucket zou anders stilzwijgend onversleuteld
   opslaan — AVG-risico). Default `STORAGE_S3_SSE=AES256` (SSE-S3, door S3 beheerde sleutels);
   `aws:kms` schakelt SSE-KMS in (optioneel `STORAGE_S3_SSE_KMS_KEY_ID` voor een eigen KMS-sleutel,
   leeg = AWS-beheerde `aws/s3`-sleutel); `none` schakelt de header bewust uit voor S3-compatibele
   opslag die 'm niet accepteert (met een productie-waarschuwing in de env-validatie). Resterend
   mensenwerk: **niets extra** — versleuteling staat standaard aan zodra `STORAGE_DRIVER=s3`.
   Aanrader voor de bucket: zet óók **default-encryptie + "Block Public Access"** aan als tweede laag.
   **Code-kant GEDAAN (12-7-2026) — connectiviteitszelftest:** na het plakken van de bucket/sleutels
   kun je op `/admin/systeemstatus` (admin-only) de **Opslag-zelftest** draaien: die doet een echte
   round-trip tegen de geconfigureerde driver (schrijven → bestaan → lezen + byte-vergelijk →
   verwijderen → opruim-check) onder een eigen `.selftest/`-prefix en meldt per stap OK/fout
   (`src/lib/services/storage-selftest.ts`, actie in `.../systeemstatus/actions.ts`). Zo bevestig je
   dat de opslag écht bereikbaar en beschrijfbaar is vóór er echte documenten in gaan — i.p.v. alleen
   de driver-modus te zien. De uitvoer bevat nooit secrets (alleen stap-uitkomsten + error-naam),
   loopt door de authz-keten (rol → rate-limit → audit) en laat nooit een testobject achter.
   Resterend mensenwerk: **niets** — de knop is er zodra `STORAGE_DRIVER=s3` staat.
   **Code-kant GEDAAN (2026-07-22) — encryptie-at-rest-verificatie in de zelftest:** de driver zet
   SSE al expliciet op elke upload (hierboven), maar een S3-compatibele store (MinIO/andere provider)
   of een verkeerd geconfigureerde bucket kan die instelling **stil negeren** en gevoelige documenten
   (VOG, diploma's, ID) **onversleuteld op schijf** zetten — precies de stille faalmodus die de andere
   zelftests ook afvangen. De opslag-zelftest doet nu na het schrijven een `HeadObject` en bevestigt dat
   het object daadwerkelijk versleuteld terugkomt (`ServerSideEncryption` aanwezig); komt het
   onversleuteld terug, dan **faalt** de zelftest expliciet (AVG-risico), i.p.v. vals groen. Deze stap
   loopt óók mee in de go-live-sweep (§11). Bij `STORAGE_S3_SSE=none` (bewust uit) of lokale opslag
   wordt de stap eerlijk overgeslagen (`describeEncryption` in `src/lib/services/storage.ts`,
   `resolveExpectedSse` + de `encrypt`-stap in `src/lib/services/storage-selftest.ts`). Resterend
   mensenwerk: **niets extra**.
   **Code-kant GEDAAN (2026-07-24) — server-action body-limiet gelijkgetrokken met de upload-ceiling:**
   uploads (documenten/certificaten/bedrijfslogo) lopen via Next.js server actions, die de request-body
   **standaard op 1 MB** afkappen — kleiner dan onze 10 MB-ceiling (`MAX_UPLOAD_BYTES`). Een reëel
   gescande VOG-/diploma-PDF (2–5 MB) werd daardoor **stil geweigerd vóór** de validatie draaide
   (generieke "Body exceeded 1 MB"-fout i.p.v. een nette melding). Opgelost met
   `experimental.serverActions.bodySizeLimit` in `next.config.mjs` (10 MB + headroom voor
   multipart-boundaries), met een drift-poort-test tegen `MAX_UPLOAD_BYTES`
   (`src/lib/services/upload-body-limit.test.ts`). Resterend mensenwerk: **niets** — echte documenten
   tot 10 MB komen nu binnen.

### 1d. Domein + HTTPS

**Stappen:**

1. Koop een domeinnaam (bijv. via je registrar).
2. Wijs het domein naar je host (DNS-instellingen; je host geeft aan wat in te vullen).
3. HTTPS (slotje) regelt de host meestal automatisch.
   **Opleveren:** het domein → secret `AUTH_URL=https://jouwdomein.nl`.

### 1e. Geheimen (secrets)

**Stappen:**

1. Genereer een sterk **AUTH_SECRET** (laat je ontwikkelaar/agent dit doen, of gebruik een
   wachtwoordgenerator van minstens 32 tekens).
2. Zet ALLE geheimen in de **secrets/omgevingsvariabelen** van je host (niet in code).
   **Opleveren:** zie het volledige overzicht in §7.

---

## §2. E-mail (meldingen en bevestigingen)

**Wat:** het platform verstuurt nu **in-app** meldingen. Voor e-mail (bijv. "je certificaat is
goedgekeurd", wachtwoord/uitnodiging) heb je een mailprovider nodig.
**Waarom:** zonder geverifieerd e-maildomein komen mails in spam of worden ze geweigerd.
**Stappen:**

1. Maak een account bij een transactionele mailprovider (bijv. **Resend**, **Postmark**, **SendGrid**, **Amazon SES**).
2. **Verifieer je domein**: de provider geeft een paar DNS-regels (SPF, DKIM, DMARC). Zet die bij
   je domeinregistrar (§1d). Dit voorkomt dat mail als spam wordt gezien.
3. Maak een **API-sleutel** aan.
   **Opleveren:** API-sleutel + afzendadres (bijv. `geen-antwoord@jouwdomein.nl`) → zet in de secrets;
   de mailverzending (in-app meldingen bestaan al) koppelt vanzelf.
   **Let op:** gebruik **geen** privé-e-mailadres in code/instellingen; gebruik een zakelijk adres.

   **Code-kant GEDAAN (3-7-2026, uitgebreid 25-7-2026): vier productie-drivers, kies er één via `EMAIL_DRIVER`.**
   - `EMAIL_DRIVER=smtp` — eigen SMTP-relay (`EMAIL_SMTP_HOST/PORT/USER/PASS` + `EMAIL_FROM`).
   - `EMAIL_DRIVER=resend` — **Resend HTTP-API** (`RESEND_API_KEY` + `EMAIL_FROM`), praat via HTTPS
     met `api.resend.com` (geen extra SDK-dependency). **Kies dit op Railway** (en andere PaaS-hosts):
     die **blokkeren uitgaande SMTP-poorten** (25/465/587), waardoor `smtp` daar niets aflevert — een
     HTTP-API is dan de enige werkende route.
   - `EMAIL_DRIVER=postmark` — **Postmark HTTP-API** (`POSTMARK_SERVER_TOKEN` + `EMAIL_FROM`,
     optioneel `POSTMARK_MESSAGE_STREAM`, default `outbound`), praat via HTTPS met
     `api.postmarkapp.com` (geen extra SDK-dependency, zelfde seam als Resend). **Tweede
     Railway-proof HTTP-keuze** naast Resend — kies wat het beste past bij je domein/DPA/
     deliverability. Authenticatie via de `X-Postmark-Server-Token`-header (het **server**-token,
     niet de account-token).
   - `EMAIL_DRIVER=ses` — **Amazon SES v2 HTTP-API** (`SES_REGION` + credentials + `EMAIL_FROM`),
     praat via HTTPS met `email.<regio>.amazonaws.com` en ondertekent zelf met **SigV4**
     (`src/lib/services/aws-sigv4.ts`, geverifieerd tegen AWS' officiële testvector) — géén extra
     `@aws-sdk`-dependency. **Derde Railway-proof HTTP-keuze**, en voor een Nederlands platform met
     gevoelige gegevens **AVG-vriendelijker**: kies een **EU-regio** (`eu-west-1`/`eu-central-1`) en de
     e-maildata blijft in de EER — anders dan Resend/Postmark (VS, doorgifte-afweging §5a). Credentials:
     bij voorkeur een eigen **least-privilege** IAM-gebruiker (`ses:SendEmail` + `ses:GetAccount`) via
     `SES_ACCESS_KEY_ID`/`SES_SECRET_ACCESS_KEY`; valt terug op de generieke
     `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` (dezelfde die S3 gebruikt) als je één AWS-account hebt.
     Optioneel `AWS_SESSION_TOKEN` voor tijdelijke STS-credentials.

     Alle vier de drivers draaien mee in de mail-zelftest, de read-only connectiviteitscheck én de
     go-live-sweep (§11). Zonder `EMAIL_DRIVER` blijft het kanaal `noop` (alleen in-app meldingen; niets
     te doen voor de pilot). Resterend mensenwerk: account aanmaken, domein/afzender verifiëren (DNS), en
     de sleutel (`RESEND_API_KEY` / `POSTMARK_SERVER_TOKEN` / SES-credentials + `SES_REGION`) +
     `EMAIL_FROM` in de Railway-secrets zetten.

   **Code-kant GEDAAN (2026-07-15) — e-mailconnectiviteitszelftest:** zodra je de sleutels hierboven
   hebt geplakt, kun je op `/admin/systeemstatus` (admin-only) de nieuwe **E-mail-zelftest** draaien:
   vul een ontvangeradres in, klik "Testmail versturen" en er gaat één echte testmail uit via het
   geconfigureerde kanaal (`getMailSender()` — `noop`/`smtp`/`resend`) — zelfde patroon als de
   Opslag-zelftest in §1c. Staat het kanaal nog op `noop`, dan meldt het scherm eerlijk "Geen kanaal
   actief — er is niets verzonden" (geen vals groen vinkje). Zo bevestig je vóór go-live dat de
   provider écht aflevert, i.p.v. alleen dat de sleutel geldig geformatteerd is. Loopt door dezelfde
   authz-keten (rol → rate-limit, standaard 4 per 5 minuten, instelbaar via
   `MAIL_SELFTEST_RATE_LIMIT` → audit); de audit-/loguitvoer bevat **nooit** het ontvangeradres of
   secrets — alleen de uitkomst + driver-modus. Resterend mensenwerk: **niets extra** — de knop is er
   zodra `EMAIL_DRIVER` op `smtp`/`resend` staat (en werkt ook op `noop`, om dat eerlijk te melden).

   **Code-kant GEDAAN (2026-07-23) — read-only connectiviteitscheck (mail draait mee in de go-live-sweep):**
   naast die deliverability-zelftest (verstuurt een echte mail) heeft het kanaal nu ook een **read-only**
   connectiviteitscontrole (`MailSender.checkConnectivity()` — Resend: authenticated `GET /domains`; SMTP:
   `transporter.verify()`) die bereikbaarheid + geldige credentials bewijst **zonder een mail te
   versturen**. Daardoor draait mail nu mee in de één-klik **go-live GO/NO-GO-sweep** (§11) — voorheen was
   mail als enige integratie uitgesloten omdat de deliverability-check een ontvanger + echte mail vereist.
   Beide bestaan naast elkaar: de sweep gebruikt de bulk-veilige read-only variant; de losse "Testmail
   versturen"-knop bevestigt de daadwerkelijke aflevering. Resterend mensenwerk: **niets extra**.

---

## §3. Betalingen / abonnementen

**Wat:** de abonnementspagina (Gratis/Pro/Business) werkt nu als **demo** (wisselen zonder te
betalen). Voor echt geld innen heb je een betaalprovider nodig.
**Waarom:** betalingen verwerken mag je niet zelf bouwen; dat doet een vergunninghoudende partij.
**Stappen:**

1. Open een zakelijk account bij **Stripe** of **Mollie**. **Code-kant zijn nu BEIDE providers
   klaar** (zie hieronder) — je hoeft er maar één te kiezen en te activeren via de instelling
   `BILLING_PROVIDER` (`stripe` of `mollie`).
2. Doorloop de **KYC/verificatie**: bedrijfsgegevens, KvK-nummer, zakelijke bankrekening (§6),
   eventueel ID van de eigenaar. Dit kan enkele dagen duren.
3. Maak de **API-sleutels** aan (test + live) en stel **webhooks** in (je ontwikkelaar/agent geeft
   het webhook-adres).
   **Opleveren:** API-sleutels + webhook-secret → geef door aan je ontwikkelaar/agent; die vervangt de
   demo-abonnementsflow door echte betalingen.
   **Tip:** start de pilot gerust met de demoflow; betalingen kun je later activeren.

   **Code-kant GEDAAN (7-7-2026): Stripe als tweede betaalprovider.** Naast de Mollie-koppeling
   is er nu ook een volwaardige **Stripe**-driver achter dezelfde `PaymentProvider`-koppeling
   (`src/lib/billing/provider.ts`): hosted Checkout Session voor het afrekenen en een gehardende
   webhook met **handtekeningverificatie** (`Stripe-Signature`). Kies je Stripe: zet een
   zakelijk Stripe-account op + KYC, maak in het Stripe-dashboard een webhook-endpoint aan naar
   `https://<jouwdomein>/api/billing/webhook` dat `checkout.session.*`-events stuurt, en zet
   `STRIPE_API_KEY` + `STRIPE_WEBHOOK_SECRET` + `BILLING_PROVIDER=stripe` in de secrets (§7). Net
   als bij Mollie wordt er zonder key niets geïncasseerd.

   **Code-kant GEDAAN (2026-07-18) — webhook-idempotentie (exact-één-keer):** de betaal-webhook
   (`/api/billing/webhook`) verwerkt nu elk provider-event **exact één keer** via een idempotentie-
   ledger (`ProcessedWebhookEvent`, uniek op `(provider, "<paymentRef>:<status>")`), atomair
   geschreven met de statusmutatie + audit in één transactie (`src/lib/billing/webhook-idempotency.ts`).
   Een herspeeld of dubbel-afgeleverd event schendt de unieke constraint → de transactie rolt terug en
   de webhook slaat inert over; een echte (transiënte) DB-fout propageert zodat de provider netjes
   opnieuw aflevert. **Waarde:** de replay-veiligheid hangt niet langer alléén van de overgangsmap af —
   ook zodra een toekomstige recurring-koppeling herhaalde `paid`-events op een ACTIVE-abonnement
   toestaat, kan één event de periode niet twee keer verlengen (standaard Stripe-praktijk). Geen secret,
   geen flag — altijd aan. De ledger bevat geen persoonsgegevens (alleen een opaque provider-referentie
   - genormaliseerde status). Resterend mensenwerk: **niets**.

   **Code-kant GEDAAN (2026-07-18) — retentie-snoei van de webhook-event-ledger:** de idempotentie-
   ledger (`ProcessedWebhookEvent`) groeit monotoon zodra recurring billing het eventvolume opvoert. Er
   is nu een geplande taak **`webhook-event-retention`** (in `/api/tasks/run-all`, pure kern
   `src/lib/webhook-event-retention.ts` + `src/lib/webhook-event-retention-task.ts`) die ledgerrijen
   ouder dan het geconfigureerde venster gebatcht en idempotent snoeit, met één snoei-auditrecord per
   actie (geen PII — aantal + cutoff + venster). Staat standaard **UIT**
   (`WEBHOOK_EVENT_RETENTION_DAYS` leeg/0 = onbeperkt bewaren, huidig gedrag). Een te lage waarde wordt
   veilig geklemd naar **minstens 30 dagen** zodat het venster boven het provider-retry-/resend-venster
   blijft (anders zou de replay-bescherming heropenen). Resterend mensenwerk: **niets** — optioneel
   `WEBHOOK_EVENT_RETENTION_DAYS` (bv. `90`) zetten zodra recurring billing het volume opvoert.

   **Code-kant GEDAAN (2026-07-16) — betaalprovider-connectiviteitszelftest:** zodra je de
   API-sleutels hierboven hebt geplakt, kun je op `/admin/systeemstatus` (admin-only) de nieuwe
   **Betaalprovider-zelftest** draaien — zelfde patroon als de Opslag-/E-mail-/Rate-limit-/
   Verificatie-zelftest. Die doet een **read-only** round-trip tegen de geconfigureerde provider
   (Stripe `GET /v1/balance`, Mollie `GET /v2/methods`) en bevestigt dat de koppeling **bereikbaar**
   is en de **sleutel geldig** — **zonder** een betaling/checkout aan te maken (geen geldverplaatsing).
   Zo weet je vóór go-live dat er straks écht geïncasseerd kan worden, i.p.v. alleen dat de sleutel
   geldig geformatteerd is. Staat de betaalflow nog op de demo (`BILLING_PROVIDER=noop`), dan meldt
   het scherm eerlijk "Geen provider actief — er is niets getest" (geen vals groen). Loopt door de
   authz-keten (rol → rate-limit, standaard 6 per 5 minuten, instelbaar via
   `BILLING_SELFTEST_RATE_LIMIT` → audit); de uitvoer bevat **nooit** secrets — alleen de uitkomst +
   driver-modus (`src/lib/services/billing-selftest.ts`, `checkConnectivity()` op de provider, actie
   in `.../systeemstatus/actions.ts`). Resterend mensenwerk: **niets extra** — de knop is er zodra
   `BILLING_PROVIDER` op `stripe`/`mollie` staat.

   **Code-kant GEDAAN (4-7-2026): volledige abonnementsperiode-levensloop.** De Mollie-koppeling
   (`BILLING_PROVIDER=mollie` + `MOLLIE_API_KEY`) bestond al: checkout-redirect + webhook →
   `currentPeriodEnd = nu + 1 maand`. Nieuw is dat een betaalde periode nu ook echt **verloopt**:
   - **Server-side waarheid:** `getActivePlanKey`/`userHasEntitlement` (`src/lib/entitlement-guard.ts`)
     tellen een betaald abonnement alléén als gerechtigd zolang `currentPeriodEnd` in de toekomst ligt.
     Een verlopen periode valt direct terug op **Gratis**, óók vóór de verval-taak draait — dus geen
     permanente Pro/Business meer na één betaling. Demo/gratis-activaties (`currentPeriodEnd = null`)
     blijven perpetueel gerechtigd.
   - **Geplande taak `subscription-expiry`** (in `/api/tasks/run-all`, `src/lib/subscription-expiry-task.ts`):
     stuurt renewal-herinneringen 7 en 1 dag vóór verval en zet een verlopen betaald abonnement
     idempotent op `CANCELLED` (→ Gratis) met notificatie + audit. Geen geldstroom (registratie/
     signalering).
     Resterend mensenwerk voor betaald gebruik: alleen het Mollie-account + KYC + `MOLLIE_API_KEY`; en
     voor automatische **maandelijkse hernieuwing** (i.p.v. handmatig opnieuw betalen bij verval) een
     Mollie-mandaat/recurring-koppeling — een vervolgstap bovenop deze verval-cyclus.

### §3b. Franchise-facturatie (tenant-billing)

**Wat:** de franchise-monetisatie (3+1 hybride: een maandabonnement per vestiging + een lichte
transactie-fee per gevulde samenwerking) is **AANGEZET**. Datamodel, fee-berekening (incl. btw),
het overzicht op `/franchise/facturatie` én de **fee-registratie in de cascade** werken: bij elke
bevestigde betaling op een tenant-samenwerking wordt de fee idempotent als **PENDING** vastgelegd
(`src/lib/tenant-billing/record-fee.ts`). De staffel staat in `TENANT_BILLING` (`src/lib/config.ts`):
FREE € 0/2,5% · GROEI € 99/1,75% · PRO € 199/1,0% (excl. btw, door jou bij te stellen).
**Belangrijk:** er wordt nog **niets daadwerkelijk gefactureerd of geïncasseerd** — de fees worden
alleen geregistreerd en getoond. De volgende stappen zijn nog mensenwerk:

1. **Btw-classificatie (vóór je écht factureert):** laat de belastingadviseur bevestigen dat we als
   **bemiddelaar** (niet principaal) gelden, zodat 21% btw alleen over de fee loopt — niet over het
   hele uurtarief. Dit is het enige echte juridische risicopunt.
2. **Definitieve prijzen:** stel de staffel in `TENANT_BILLING.plans` bij naar jouw unit-economics.
3. **Incasso + provider:** Stripe/Mollie per tenant + de aanmaningsladder op tenant-niveau
   (`pastDueAt`/`SUSPENDED`), en het omzetten van PENDING-fees naar verzonden fee-facturen
   (`CollaborationFee.invoiceId`).
4. **ZZP-abonnement (€40/actieve maand): GEBOUWD — alleen incasso resteert.** De geplande taak
   `zzp-membership-task` registreert idempotent een maandbijdrage (`ZZP_MEMBERSHIP` in `config.ts`,
   €40 excl. btw) voor elke ZZP'er die die maand werk had; de ZZP'er ziet het op `/inzicht`. Net als
   de tenant-fee wordt er **nog niets geïncasseerd** — resterend mensenwerk: betaalprovider per ZZP'er
   - het omzetten van de PENDING-bijdragen naar verzonden abonnementsfacturen
     (`ZzpMembershipCharge.invoiceId`). Bedrag bij te stellen in de config.

---

## §4. Externe verificatiekoppelingen (DUO, BIG, iDIN/eIDAS)

**Wat:** het platform kan diploma's (DUO), zorg-beroepsregistratie (BIG) en identiteit (iDIN/eIDAS)
controleren. De **software staat klaar** achter een nette "koppelingsgrens" en draait nu met een
ingebouwde **demo-verifier**. Voor échte controle moet je per bron toegang regelen.
**Waarom:** dit zijn officiële registers/diensten; toegang vereist een afspraak/contract en
beveiligde sleutels. Een agent kan dat contact en die afspraken niet namens jou aangaan.

> Algemene werkwijze per bron: (1) jij regelt toegang + krijgt sleutels/endpoint, (2) je zet die in
> de secrets, (3) je ontwikkelaar/agent vult die ene koppeling in en zet de bijbehorende schakelaar
> om (`...=duo` / `...=bigregister` / `...=idin`). De rest van het platform verandert niet.
>
> **Code-kant GEDAAN (2026-07-16) — connectiviteitszelftest:** zodra je een echte adapter aanzet
> (`DIPLOMA_VERIFIER=duo` / `BIG_VERIFIER=bigregister` / `IDENTITY_VERIFIER=idin`) + de endpoints/
> sleutels plakt, kun je op `/admin/systeemstatus` (admin-only) de **Verificatie-zelftest** draaien:
> die doet per aangezette adapter een echte round-trip met een **synthetische** probe-invoer tegen
> het endpoint en bevestigt dat het **bereikbaar** is, de **auth** klopt en het antwoord het
> **contract** volgt — zonder een echt "geverifieerd"-signaal te genereren (een `verified:false` op
> een verzonnen code is juist een gezonde uitkomst). Zo bevestig je vóór echte diploma-/zorg-/
> identiteitscontrole dat de koppeling het écht doet, i.p.v. alleen de driver-modus te zien
> (`src/lib/services/verify-selftest.ts`, actie in `.../systeemstatus/actions.ts`, zelfde patroon als
> de Opslag-/E-mail-/Rate-limit-zelftest). Adapters die nog op de demo-verifier (`mock`) draaien
> worden eerlijk als "niets getest" gemeld (geen vals groen). De uitvoer bevat nooit secrets (alleen
> stap-uitkomsten + driver-modus), loopt door de authz-keten (rol → rate-limit → audit) en toont
> alleen bereikbaarheid. Resterend mensenwerk: **niets extra** — de knop is er zodra een echte adapter
> aanstaat.

### 4a. DUO — diploma's

**Stappen (niet-technisch):**

1. Oriënteer je op het **DUO-diplomaregister** ("Mijn diploma's"). De gangbare, privacy-vriendelijke
   route: de ZZP'er haalt zelf met DigiD een **gewaarmerkt uittreksel met verificatiecode** op en
   deelt die; jij/het platform controleert die code/handtekening.
2. Neem contact op met **DUO** om de juiste verificatieafspraak/voorwaarden voor organisaties te
   bevestigen en (indien beschikbaar) toegang/endpoint te krijgen.
3. Leg vast hoe lang en waarvoor je deze gegevens bewaart (zie §5).
   **Opleveren:** endpoint + eventuele sleutels → secrets `DUO_API_BASE`, `DUO_API_KEY` en zet
   `DIPLOMA_VERIFIER=duo`. Je ontwikkelaar/agent werkt de DUO-controle af.

### 4b. BIG-register — zorgberoepen

**Stappen:**

1. Het **BIG-register** (beheerd door **CIBG**) is publiek doorzoekbaar op BIG-nummer + naam en
   heeft een **webservice** voor organisaties.
2. Vraag bij CIBG toegang tot de BIG-webservice aan en regel de bijbehorende voorwaarden/sleutels
   of certificaat.
3. Bepaal of je periodiek wilt hercontroleren (een registratie kan vervallen of geschorst worden).
   **Opleveren:** endpoint + sleutels/certificaat → secrets `BIG_API_BASE`, `BIG_API_KEY` en zet
   `BIG_VERIFIER=bigregister`.

### 4c. iDIN / eIDAS — identiteit

**Stappen:**

1. **iDIN** (identiteit via je bank) loopt meestal via een **betaaldienstverlener (PSP)** of een
   iDIN-routeringspartij. Sluit daar een contract.
2. Doorloop de onboarding (bedrijfsgegevens, technische afspraken, certificaten/sleutels).
3. (Toekomst) Houd de **EU Digital Identity Wallet (eIDAS 2.0)** in de gaten; die past op dezelfde
   koppelingsgrens.
   **Opleveren:** endpoint + sleutels → secrets `IDENTITY_API_BASE`, `IDENTITY_API_KEY` en zet
   `IDENTITY_VERIFIER=idin`.

---

## §5. Juridisch & privacy (AVG / Wet DBA / Wkkgz / security)

**Dit blok blokkeert livegang met echte persoonsgegevens. Doe dit serieus en met een specialist.**

### 5a. Privacy (AVG)

**Stappen:**

1. Laat een **privacyverklaring** en (indien nodig) **cookiebeleid** opstellen/controleren door een
   privacyjurist.
2. Stel de **rechtsgrondslagen** en **bewaartermijnen** per soort gegeven vast (er ligt een concept
   "privacy data matrix" klaar als startpunt; laat die bevestigen).
3. Houd een **verwerkingsregister** bij.
4. Sluit een **verwerkersovereenkomst (DPA)** met **elke** leverancier die persoonsgegevens
   verwerkt: hosting, database, opslag, mail, betaalprovider, en de verificatiediensten (§4).
   - **`EMAIL_DRIVER=resend` (internationale doorgifte, AVG art. 44/46):** met Resend gaan
     ontvangeradres, naam en notificatie-inhoud via HTTPS naar een verwerker die (deels) buiten de
     EER kan zitten. Bevestig vóór go-live dat de **DPA modelcontractbepalingen (SCC's)** bevat en
     configureer waar mogelijk een **EU-regio**. Zelfde afweging als de Geoapify-reistijddienst (§4).
     Tot dat rond is: houd `EMAIL_DRIVER` op `noop`/`smtp` (eigen EER-relay). De code is inert zonder
     `RESEND_API_KEY`; dit is puur een juridische/DPO-poort, niet een codewijziging.
5. Bepaal of een **DPIA** (gegevensbeschermingseffectbeoordeling) nodig is — bij gevoelige
   documenten/zorgcontext vaak wel.
6. Beslis bewust over **identiteitsdocumenten**: bewaar bij voorkeur alleen status/metadata, geen
   volledige ID-scans (dataminimalisatie).
   **Opleveren:** ondertekende DPA's, vastgestelde bewaartermijnen, gepubliceerde privacyverklaring.

   **Code-kant GEDAAN (14-7-2026) — auditlog-retentie afgedwongen:** het verwerkingsregister
   (`RETENTION_SCHEDULE`) documenteert al bewaartermijnen, maar voor het **auditlog/beveiligingslogboek**
   (regels mét IP-adres + user-agent; gedocumenteerd op **12 maanden**, AVG art. 5 lid 1e
   dataminimalisatie) dwong nog niets die termijn af — auditregels bleven onbeperkt staan. Er is nu een
   geplande taak **`audit-retention`** (in `/api/tasks/run-all`, pure kern `src/lib/audit-retention.ts` +
   `src/lib/audit-retention-task.ts`) die auditregels ouder dan het geconfigureerde venster gebatcht en
   idempotent snoeit, met één verantwoordings-auditrecord per snoei-actie (AVG art. 5 lid 2). **Wissen is
   onomkeerbaar en staat daarom standaard UIT** (`AUDIT_LOG_RETENTION_DAYS` leeg/0 = onbeperkt bewaren,
   huidig gedrag). Een te lage waarde wordt veilig geklemd naar **minstens 30 dagen** (typefout-bescherming).
   Zichtbaar op `/admin/systeemstatus` ("Auditlog-retentie"). Resterend mensenwerk: **de bewaartermijnen
   laten vaststellen door een privacyjurist** (dit blijft jouw juridische keuze) en daarna
   `AUDIT_LOG_RETENTION_DAYS` zetten (bv. `365` voor de gedocumenteerde 12 maanden). Zolang het leeg blijft
   verandert er niets.

### 5b. Wet DBA (schijnzelfstandigheid)

**Stappen:**

1. De ingebouwde **DBA-risicocheck** is een **hulpmiddel, geen juridisch advies**. Laat een
   **arbeidsjurist** de gehanteerde signalen, drempels en teksten valideren.
2. Regel goedgekeurde **modelovereenkomst(en)** voor opdrachten met hoog risico.
   **Opleveren:** akkoord van de jurist + (optioneel) modelovereenkomst-teksten die we kunnen koppelen.

### 5c. Wkkgz (alleen als je de zorgmarkt op gaat)

**Stappen:** bepaal met een specialist of/welke Wkkgz-verplichtingen gelden (kwaliteit, klachten,
VOG-eisen) en leg dat vast.

### 5d. Security review vóór livegang

**Stappen:**

1. Laat een **securityreview / pentest** uitvoeren voordat er echte gevoelige documenten in staan.
2. Bespreek met de tester de bekende, bewust gemaakte keuzes (staan in `PROGRESS.md`), o.a.:
   - het inlogsysteem onthoudt rol/status tot de sessie ververst (schorsing werkt na verversen) —
     beoordeel of directe uitsluiting nodig is;
   - de beveiligingsheaders staan aan; de CSP draait per request met een **nonce** (`'unsafe-inline'`
     voor scripts vervalt in productie, met een gedocumenteerde fallback voor oude browsers) — beoordeel
     of de fallback op basis van de `csp-violation`-logs verder verstrakt kan worden;
   - rate-limiting op inloggen/acties **is** ingebouwd (per-proces in-memory; gedeeld via Upstash bij
     horizontale schaling, zie §0b).
     **Opleveren:** rapport + akkoord om live te gaan ("GO"), of een lijst met te fixen punten (die de
     agent dan oppakt).

**Code-kant GEDAAN (2026-07-22) — cross-origin-isolatie + Permissions-Policy-hardening:** naast de al
sterke statische headers (HSTS+preload, `X-Frame-Options: DENY`, nosniff, `Referrer-Policy`) en de
per-request CSP-nonce staan nu ook **`Cross-Origin-Opener-Policy: same-origin`** (severt de opener-relatie
met cross-origin vensters — cross-window-lek/reverse-tabnabbing), **`Cross-Origin-Resource-Policy:
same-origin`** (geen cross-origin embedding van onze resources — extra laag voor documentprivacy: een
gelekte URL kan een gevoelig bestand niet cross-origin inladen; ook expliciet op elke privé-bestand-route
via de geteste `src/lib/security/resource-headers.ts`) en een **uitgebreide `Permissions-Policy`** die elke
krachtige browserfunctie ontzegt die het platform niet gebruikt (camera/microfoon/geolocatie/betaling/
usb/serial/…) plus FLoC/Topics-opt-out. Resterend mensenwerk: **niets** — de headers staan out-of-the-box
aan; de pentest valideert ze.

---

## §6. Bedrijf & operationeel

### 6a. Bedrijf

**Stappen:** zorg voor **KvK-inschrijving**, een **zakelijke bankrekening** (nodig voor betalingen),
en een **bedrijfsaansprakelijkheids-/beroepsverzekering** voor het platform.

### 6b. Support & incidenten

**Stappen:** richt een **support-mailbox/kanaal** in en benoem wie verantwoordelijk is bij
incidenten (er ligt een incident-logsjabloon klaar als startpunt).

### 6c. Eerste beheerder + demo-data uit

**Stappen:**

1. Na de eerste installatie staan er **demo-accounts** (o.a. een admin). Maak in productie een
   **echte beheerder** aan en **wijzig/verwijder de demo-wachtwoorden**.
2. Zorg dat de productie-database **geen demo-/testgegevens** bevat bij livegang.
   **Opleveren:** geef je ontwikkelaar/agent het seintje "productie schoon + echte admin staat klaar".

   **Code-kant GEDAAN (2026-07-24) — SEED_DEMO-productiewaarschuwing zichtbaar gemaakt:** de demo-dataset
   (vaste accounts, waaronder de beheerder `admin@zzp-platform.local` met het publiek bekende wachtwoord
   `demo1234`) draait al alleen achter `SEED_DEMO=true`, en de eerste échte beheerder komt via
   `BOOTSTRAP_ADMIN_EMAIL`/`BOOTSTRAP_ADMIN_PASSWORD` (afgedwongen wachtwoordwijziging). Nieuw is dat
   `SEED_DEMO=true` **in productie** niet langer stil passeert: het zou anders een beheerder met een
   bekend wachtwoord planten én de verificatie-waarschuwingen onderdrukken. De env-validatie geeft nu bij
   boot een **luide waarschuwing** (`envWarnings`, `src/lib/env.ts`) en `/admin/systeemstatus` toont een
   eigen posture-rij **"Demo-dataset (SEED_DEMO)"** die in productie op **aandacht** springt zolang de
   demo-dataset aanstaat (loopt mee in de go-live GO/NO-GO-sweep en `npm run preflight`). Resterend
   mensenwerk: bij livegang met echte gegevens **`SEED_DEMO` uitzetten**, de productie-database schoonmaken
   en de eerste beheerder via `BOOTSTRAP_ADMIN_*` zetten — de test-/demo-URL mag er bewust op blijven draaien.

### 6d. Inhoud & huisstijl (optioneel)

Echte teksten, logo en eventuele huisstijl kun je aanleveren; de agent verwerkt ze.

---

## §7. Overzicht van geheimen/instellingen (geef deze door via de secrets-kluis)

Zet deze in de omgevingsvariabelen van je host — **nooit** in code of chat. (Zie ook `.env.example`.)

| Instelling                                                                   | Wat het is                                             | Waar haal je het     | Wanneer nodig                                    |
| ---------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------- | ------------------------------------------------ |
| `DATABASE_URL`                                                               | Verbindings-URL productie-database                     | Databasedienst (§1b) | Altijd (productie)                               |
| `AUTH_SECRET`                                                                | Geheim voor veilige inlogsessies (≥32 tekens)          | Zelf genereren (§1e) | Altijd                                           |
| `AUTH_URL`                                                                   | Je productie-webadres                                  | Je domein (§1d)      | Altijd                                           |
| `STORAGE_DRIVER=s3`                                                          | Schakelt productie-opslag in                           | —                    | Bij echte uploads                                |
| `STORAGE_S3_BUCKET` / `STORAGE_S3_REGION`                                    | Bucketnaam + regio                                     | Opslagdienst (§1c)   | Bij echte uploads                                |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`                                | Opslag-toegangssleutels                                | Opslagdienst (§1c)   | Bij echte uploads                                |
| `STORAGE_S3_SSE` (+ `STORAGE_S3_SSE_KMS_KEY_ID`)                             | Encryptie-at-rest (default AES256; optioneel)          | — (§1c)              | Optioneel (default aan bij s3)                   |
| `EMAIL_DRIVER=resend` + `RESEND_API_KEY` + `EMAIL_FROM`                      | E-mail via Resend HTTP-API (Railway-proof)             | Resend (§2)          | Voor e-mail                                      |
| `EMAIL_DRIVER=postmark` + `POSTMARK_SERVER_TOKEN` + `EMAIL_FROM`             | E-mail via Postmark HTTP-API (Railway-proof)           | Postmark (§2)        | Voor e-mail (alternatief voor Resend)            |
| `EMAIL_DRIVER=ses` + `SES_REGION` + `EMAIL_FROM` (+ SES/AWS-sleutels)        | E-mail via Amazon SES v2 (EU-regio, AVG-vriendelijk)   | AWS SES (§2)         | Voor e-mail (Railway-proof; kies EU-regio)       |
| `EMAIL_DRIVER=smtp` + `EMAIL_SMTP_*` + `EMAIL_FROM`                          | E-mail via eigen SMTP-relay                            | Mailprovider (§2)    | Voor e-mail (niet op Railway)                    |
| `BILLING_PROVIDER=mollie` + `MOLLIE_API_KEY`                                 | Betalingen via Mollie                                  | Mollie (§3)          | Voor betalingen (kies één provider)              |
| `BILLING_PROVIDER=stripe` + `STRIPE_API_KEY`/`STRIPE_WEBHOOK_SECRET`         | Betalingen via Stripe (Checkout + webhook)             | Stripe (§3)          | Voor betalingen (kies één provider)              |
| `DIPLOMA_VERIFIER=duo` + `DUO_API_BASE`/`DUO_API_KEY`                        | Echte DUO-controle                                     | DUO (§4a)            | Voor echte diplomacontrole                       |
| `BIG_VERIFIER=bigregister` + `BIG_API_BASE`/`BIG_API_KEY`                    | Echte BIG-controle                                     | CIBG (§4b)           | Voor echte zorgcontrole                          |
| `IDENTITY_VERIFIER=idin` + `IDENTITY_API_BASE`/`IDENTITY_API_KEY`            | Echte identiteitscontrole                              | PSP/iDIN (§4c)       | Voor echte identiteitscontrole                   |
| `SENTRY_DSN` (+ `npm i @sentry/nextjs`)                                      | Externe error-monitoring (anders alleen logs)          | Sentry (§0b)         | Optioneel (aanbevolen prod)                      |
| `LOG_LEVEL`                                                                  | Logdrempel (debug/info/warn/error)                     | —                    | Optioneel (default info)                         |
| `RATE_LIMIT_STORE=upstash` + `UPSTASH_REDIS_REST_URL`/`_TOKEN`               | Gedeelde rate-limits over instances                    | Upstash (§0b H-2)    | Bij horizontale schaling                         |
| `DATABASE_CONNECTION_LIMIT` (+ `DATABASE_POOL_TIMEOUT`/`DATABASE_PGBOUNCER`) | Begrenst de Prisma-pool per instance                   | — (§0b, §1b)         | Bij horizontale schaling                         |
| `UPLOAD_SCANNER=clamav` + `CLAMAV_HOST`/`CLAMAV_PORT`                        | Malware-scan van uploads                               | Eigen clamd-daemon   | Optioneel (aanbevolen prod met echte documenten) |
| `ALLOW_INDEXING=true`                                                        | Zoekmachine-indexering aanzetten (default uit)         | — (§0b)              | Optioneel bij go-live (pilot blijft privé)       |
| `SECURITY_CONTACT`                                                           | Meldpunt in /.well-known/security.txt (RFC 9116)       | — (§0b)              | Optioneel (aanbevolen vóór pentest)              |
| `AUDIT_LOG_RETENTION_DAYS`                                                   | Bewaartermijn auditlog in dagen (default: onbeperkt)   | — (§5a)              | Optioneel (aanbevolen prod; bv. 365)             |
| `WEBHOOK_EVENT_RETENTION_DAYS`                                               | Snoeivenster webhook-ledger in dagen (default: onbep.) | — (§3)               | Optioneel (bij recurring billing; bv. 90)        |
| `BACKUP_MAX_AGE_HOURS`                                                       | Venster back-up-heartbeat in uren (default 48)         | —                    | Optioneel (aanbevolen prod)                      |

> Zolang een verificatie-schakelaar **niet** op de echte waarde staat, draait de bijbehorende
> demo-verifier veilig door (handig voor de pilot).
>
> **Validatie bij boot (code-kant GEDAAN, 24-6-2026):** `src/lib/env.ts` controleert al deze secrets
> coherent. Schakel je een integratie in (`STORAGE_DRIVER=s3`, `EMAIL_DRIVER=smtp`,
> `BILLING_PROVIDER=mollie`, `DIPLOMA_VERIFIER=duo`, `BIG_VERIFIER=bigregister`,
> `IDENTITY_VERIFIER=idin`) maar mist een bijbehorende sleutel/endpoint, dan **faalt de boot meteen
> en duidelijk** (geen halve activering). In productie geeft de boot bovendien een **waarschuwing**
> bij een veilige-maar-tijdelijke fallback (lokale opslag, geen mailkanaal, ontbrekende
> `CRON_SECRET`, SQLite i.p.v. PostgreSQL) zonder te crashen — de pilot blijft draaien.

---

## §8. Wat al automatisch is gebouwd (zodat je dit NIET handmatig hoeft)

- De hele applicatie: profielen, opdrachten, reacties met match + compliance, documenten/
  certificaten, admin-verificatie, berichten/notificaties, samenwerkingen, facturen, admin-paneel,
  beschikbaarheid, dashboard.
- **Wet DBA-risicocheck**, **AVG-gegevensrechten** (eigen data downloaden + verwijderverzoek),
  **DUO-/BIG-/identiteitsverificatie** (achter koppelingsgrenzen, met demo-verifier), en een
  zichtbaar **vertrouwensniveau**.
- Beveiliging: rol- en eigendomscontrole server-side, privé-documenten, audit-logboek (incl.
  inlog-events + IP), security-headers, geheimvalidatie bij opstart, een veilige opslag-abstractie
  met productie-driver (S3) klaar.
- Kwaliteit: ruime test-set (unit + browser-e2e), CI + beveiligingsscripts, mobiel + desktop
  gecontroleerd, per onderdeel een onafhankelijke code-review.

**Kortom:** jij regelt accounts, contracten, geheimen en juridische akkoorden (dit document). De
software en koppelingen zijn klaar om die in te pluggen.

---

## §9. 24/7 autonoom doorbouwen (GitHub Actions `auto-build.yml`)

De duurzame motor die blijft draaien — óók als er geen sessie/container leeft — is de scheduled
workflow `.github/workflows/auto-build.yml`. Die draait op GitHub-infra (overleeft container-reclaims,
anders dan een sessie-heartbeat) en bouwt de overhaul-branch `claude/modest-babbage-08jYa`.

**Eenmalig (repo → Settings → Secrets and variables → Actions):**

1. **`ANTHROPIC_API_KEY`** _(verplicht)_ — zonder dit kan de bouwagent niets. (Volgens eerdere notities
   al gezet; controleer dit.)
2. **`BUILD_PAT`** _(nodig voor de zelf-herstartende loop)_ — een fijnmazige PAT met `Contents: write`
   op deze repo. Een push door de workflow met de standaard `GITHUB_TOKEN` her-triggert bewust géén
   vervolgronde (anti-recursie van GitHub). Met `BUILD_PAT` her-armt de loop zichzelf en stopt dus niet.
3. _(Optioneel — echte cron)_ `schedule` vuurt alleen vanaf de **default branch**. Die is nu
   `claude/dazzling-carson-v9Qwk` (oude code). Wil je de cron óók laten lopen: maak
   `claude/modest-babbage-08jYa` de default (Settings → Branches), of zet de "ZZP auto-build"-Routine
   in claude.ai/code/routines aan.

**Starten/stoppen:** start via Actions → "Run workflow", of bump `.swarm-trigger` en push. Stoppen:
verwijder `BUILD_PAT` of zet de workflow uit (Actions-tabblad). **Validatie:** `npm run validate:ci`.

---

## §10. Productie-cron voor `/api/tasks/run-all` (mensenwerk)

Het platform heeft een eindpunt `/api/tasks/run-all` dat alle geplande taakrunners in één
aanroep uitvoert (expiry, betalingsherinneringen, DBA-monitor, concept-factuur-reminders,
BTW-herinnering, job-alerts, PAST_DUE-ladder, ZZP-lidmaatschapsbijdrage, grace-venster).

**Code-kant GEDAAN (3-7-2026):** `/api/tasks/run-all` heeft nu een geplande GitHub Actions-workflow
(`.github/workflows/run-all-tasks.yml`, elke dag om 05:00 UTC) die het endpoint aanroept met de
`Authorization: Bearer $CRON_SECRET`-header. Die run voert **alle geplande taakrunners** idempotent uit
(verloopdetectie, betaalherinneringen, DBA-monitor, concept-factuur- en BTW-herinneringen, job-alerts,
PAST_DUE-aanmaningsladder, abonnement-periode-verval/renewal, ZZP-lidmaatschapsbijdrage,
prestatie-grace/-goedkeuring-/-indien-reminders, dispuut-reminders, beoordelingen-onthulling,
push-delivery, notificatie-digest, monitor). De workflow
is **inert zonder secrets**: ontbreken `RUN_ALL_TASK_URL`/`CRON_SECRET`, dan slaat de job over zonder
te falen. Dit dekt óók de expiry-check; `expiry-check.yml` blijft draaien maar is hiermee overbodig
(dubbel draaien is dankzij idempotentie onschadelijk).

**Resterend mensenwerk (eenmalig, anders draait de cron niet):**

1. Zet repo-secret **`RUN_ALL_TASK_URL`** = `https://<productie-host>/api/tasks/run-all`
   (Settings → Secrets and variables → Actions).
2. Zet repo-secret **`CRON_SECRET`** = dezelfde waarde als de `CRON_SECRET` van de server (§7).
   _(Al gezet voor `expiry-check.yml`? Dan is dit klaar — dezelfde secret wordt hergebruikt.)_
3. Test éénmaal handmatig via de Actions-tab ("Run workflow") of met
   `curl -X POST -H "Authorization: Bearer <geheim>" https://jouwdomein.nl/api/tasks/run-all`.

Wil je een andere cadans (bv. meerdere keren per dag)? Pas de `cron`-expressie in de workflow aan;
de runners blijven idempotent. Alternatief blijft een Railway Cron Service of externe planner die
hetzelfde endpoint aanroept. Zolang de twee secrets ontbreken, draaien de overige taakrunners
**alleen bij handmatige aanroep**.

**Code-kant GEDAAN (2026-07-17) — cron-heartbeat / dead-man's-switch:** een stil gestopte cron
(workflow uit, secret geroteerd, `RUN_ALL_TASK_URL` fout, host-storing) zou de geplande runners
onopgemerkt stilleggen — verloopdetectie blijft dan uit (een certificaat blijft VERIFIED),
abonnement-verval loopt niet (entitlement blijft hangen), auditlog-retentie snoeit niet (AVG). Nu
registreert elke afronding van `/api/tasks/run-all` een **heartbeat** (`CronHeartbeat`-singleton,
géén persoonsgegevens — alleen tijdstip + of de run zonder taakfouten verliep). Op
`/admin/systeemstatus` toont de kaart **"Geplande-taken-cron"** of de cron recent genoeg draaide:
_actueel_ (binnen het venster, geen fouten), _aandacht_ als 'ie langer dan het venster stilstaat
("stale"), als een taak tijdens de laatste run faalde, of als de cron nog nooit draaide. Het venster
is `CRON_MAX_AGE_HOURS` (default **36 uur** — één gemiste dagelijkse run + speling; geklemd 1–720).
De heartbeat faalt nooit naar buiten (mag de cron-respons niet omverhalen). Resterend mensenwerk:
**niets extra** — de kaart vult zichzelf zodra de cron één keer draait; hang desgewenst een
uptime-monitor op de cron-workflow zelf voor externe alarmering.

---

## §11. Operationeel draaiboek (RUNBOOK)

**Code-kant GEDAAN (4-7-2026):** er is nu een operationeel draaiboek
[`docs/RUNBOOK.md`](docs/RUNBOOK.md) voor wie de dienst beheert — deploy + verificatie, **rollback**
(Railway-redeploy of `git revert`), **back-up/herstel** van de database (`pg_dump`/`pg_restore` +
een herstel-oefening), **incident-respons**, **secrets-rotatie** en monitoring op `/api/health`
(liveness) + `/api/readiness` (readiness). De liveness-probe is gehard (`force-dynamic`, nooit
gecachet) en er is een root-error-boundary (`global-error.tsx`) als laatste vangnet met een rustige
foutpagina.

**Code-kant GEDAAN (8-7-2026) — systeemstatus-scherm voor de beheerder:** naast de RUNBOOK is er
nu een ADMIN-only scherm **Systeemstatus** (`/admin/systeemstatus`) dat de productie-configuratie-
posture op één scherm toont: welke integraties/drivers actief zijn (opslag, database, e-mail,
betalingen, verificatie-adapters, upload-scan, rate-limit-store, error-monitoring, taak-cron,
deel-token-sleutel, productie-webadres), welke nog op een veilige fallback draaien en welke
**aandacht** vragen vóór livegang, plus de live databank-bereikbaarheid en de boot-waarschuwingen
(`envWarnings`). Puur afgeleid uit de al-gevalideerde omgeving (`src/lib/system-status.ts`, geen
sleutelwaarden — alleen driver-modi). Beantwoordt de RUNBOOK-vraag "is productie na de deploy
correct bekabeld?" zonder de boot-logs te hoeven grepen. Resterend mensenwerk: **niets** — het
scherm helpt juist bij het afvinken van de mensenwerk-stappen hieronder.

**Code-kant GEDAAN (10-7-2026) — back-up/herstel-helper:** de handmatige `pg_dump`/`pg_restore`-stap
uit RUNBOOK §5 is nu een veilig, getest hulpmiddel (`npm run db:backup` / `npm run db:restore`, pure
kern `src/lib/ops/db-backup.ts`): custom-format dump met retentie-snoei, weigert een niet-PostgreSQL-
`DATABASE_URL`, redigeert het wachtwoord in logs, en weigert blind over de bron-/productie-database te
herstellen (kies een leeg doel of geef bewust `--force`). Dumps landen in `backups/` (in `.gitignore`).
De **automatische** dagelijkse back-ups blijven verantwoordelijkheid van de databasedienst.

**Code-kant GEDAAN (11-7-2026) — onderhoudsmodus (operationele noodrem):** je kunt het platform nu
tijdens een geplande migratie, een database-herstel (RUNBOOK §5) of een incident (§6) tijdelijk
offline halen met één env-variabele. Zet `MAINTENANCE_MODE=true` in de Railway-secrets → bezoekers
krijgen een rustige **503-onderhoudspagina** ("we zijn zo terug", met `Retry-After`-hint), terwijl de
gezondheids-probes (`/api/health`, `/api/readiness`) bereikbaar blijven zodat de host-healthcheck de
container **niet** herstart en je uptime-monitor groen blijft. Ingelogde **admins** mogen er standaard
door om de deploy te verifiëren (`MAINTENANCE_ALLOW_ADMIN=false` voor een volledige afsluiting).
Optioneel: `MAINTENANCE_MESSAGE` (eigen tekst) + `MAINTENANCE_RETRY_AFTER` (seconden). Draait vóór
auth/rol-guards in de middleware; puur en getest (`src/lib/maintenance.ts`). In productie logt de boot
een waarschuwing zolang hij aan staat en toont `/admin/systeemstatus` "Onderhoudsmodus: aan"
(aandacht). Zie RUNBOOK §9. Resterend mensenwerk: **niets voor de pilot** — zet de variabele alleen
wanneer je bewust onderhoud doet, en vergeet niet 'm daarna weer uit te zetten.

**Code-kant GEDAAN (2026-07-15) — e-mail-zelftest naast de opslag-zelftest:** het systeemstatus-scherm
toont naast de **Opslag-zelftest** (§1c) nu ook een **E-mail-zelftest**: de beheerder vult een
ontvangeradres in en verstuurt één echte testmail via het geconfigureerde kanaal, zodat je ná het
zetten van de e-mailsleutels (§2) meteen bevestigt dat er ook daadwerkelijk mail aankomt — vóór
go-live. Zie §2 voor het volledige verhaal. Resterend mensenwerk: **niets** — de knop is er zodra
`EMAIL_DRIVER` gezet is.

**Code-kant GEDAAN (2026-07-21) — go-live zelftest-sweep (alle zelftests in één klik):** op
`/admin/systeemstatus` staat nu bovenaan de zelftest-lijst één knop **"Alle zelftests draaien"** die
álle actieve, bijwerkingsveilige connectiviteitszelftests (opslag, database, rate-limit, verificatie,
betaalprovider, upload-scanner, error-monitoring, **e-mail**) in één keer draait en een geconsolideerd
**GO/NO-GO** teruggeeft. Zo bevestig je vóór go-live in één handeling dat élke geconfigureerde integratie
écht live-bereikbaar is, i.p.v. de losse knoppen één voor één te klikken. Integraties die nog op een
veilige fallback/demo draaien worden eerlijk als **overgeslagen** getoond (geen vals groen). De uitvoer
bevat nooit secrets (alleen pass/fail/overgeslagen + driver-modus), loopt door de authz-keten (rol →
rate-limit → audit) en heeft geen bijwerkingen die opgeruimd moeten worden.
**Code-kant GEDAAN (2026-07-23) — mail draait mee in de sweep via een read-only connectiviteitscheck:**
de `MailSender`-abstractie heeft nu een `checkConnectivity()` (Resend: authenticated `GET /domains`;
SMTP: `transporter.verify()` — connect + EHLO + AUTH, **géén mail verzonden**), zodat het e-mailkanaal
— net als opslag/database/betaalprovider — mee kan in de één-klik GO/NO-GO. **De losse E-mail-zelftest
die een échte testmail naar een ontvanger stuurt (deliverability-bevestiging, §2) blijft bewust apart**
— dat hoort een bewuste handeling te blijven; de sweep gebruikt de bulk-veilige read-only variant.
De statische `npm run preflight` (config-posture, hieronder) blijft de tegenhanger buiten de app.
Resterend mensenwerk: **niets extra** — de knop is er standaard.

**Code-kant GEDAAN (13-7-2026) — go-live preflight-CLI:** naast het in-app `/admin/systeemstatus`-scherm
kun je de productie-configuratie-posture nu ook **buiten de app** controleren met `npm run preflight`
(tegen de deploy-config: `railway run npm run preflight`) — zonder een draaiende server + admin-login.
Het rapport toont per onderdeel (opslag, database, e-mail, betalingen, verificatie-adapters,
upload-scan, rate-limit-store, error-monitoring, taak-cron, deel-token-sleutel, webadres,
onderhoudsmodus, indexering, beveiligingscontact) of het productie-klaar is, op een veilige fallback
draait of aandacht vraagt vóór livegang, plus de boot-waarschuwingen en een GO/NO-GO-oordeel. Draait de
al-gevalideerde boot-logica (`validateEnv`) + posture (`collectSystemStatus`), toont **nooit**
sleutelwaarden. Exitcodes: `0` ok · `1` aandachtspunt in `--strict` (bruikbaar als CI/go-live-poort) ·
`2` ongeldige/ontbrekende basisconfig. `--json` geeft een machineleesbaar rapport. Zie RUNBOOK §3.
Resterend mensenwerk: **niets** — het is een operator-hulpmiddel bij het afvinken van de stappen hieronder.

**Code-kant GEDAAN (2026-07-19) — back-up-heartbeat / dead-man's-switch:** de automatische
dagelijkse database-back-up (hierboven, §11.1) draait bij de databasedienst, buiten het zicht van
het platform — een stil gestopt back-up-schema (opgezegde snapshot-policy, mislukte dump, verlopen
databasedienst-abonnement) was tot nu toe onzichtbaar, precies zoals de cron vóór 2026-07-17 (zie
hierboven). Zelfde patroon: elke geslaagde externe back-up kan nu een **heartbeat** registreren via
**`POST /api/backups/heartbeat`** (`Authorization: Bearer $CRON_SECRET`, fail-closed: geen
`CRON_SECRET` → 503, verkeerd token → 401; optionele body `{ "ok": boolean }`, default `true` bij een
kale ping). Op `/admin/systeemstatus` toont de nieuwe kaart **"Database-back-up"** de freshness:
_actueel_ (binnen het venster, laatste melding geslaagd), _aandacht_ (laatste melding mislukt of nog
nooit gemeld) of _stale_ (schema lijkt gestopt). Venster `BACKUP_MAX_AGE_HOURS` (default **48 uur**,
geklemd 1–720). Singleton-model `BackupHeartbeat` (géén persoonsgegevens — alleen tijdstip + of de
laatste back-up slaagde); de heartbeat-schrijf/-lees faalt nooit naar buiten. Inert zonder config.
Resterend mensenwerk: **de back-up-job zelf laten pingen** — zie punt 1b hieronder.

**Resterend mensenwerk (eenmalig):**

1. Zet **automatische dagelijkse database-back-ups** aan bij je databasedienst (EU-regio; §1b) en
   doe éénmaal een **herstel-oefening** naar een wegwerp-database vóór go-live (zie RUNBOOK §5; de
   `npm run db:backup`/`db:restore`-helper maakt de oefening reproduceerbaar).
   1b. **Laat de back-up-job zijn succes melden:** voeg aan de back-up-job (pg_dump/databasedienst)
   een stap toe die na een geslaagde dump pingt naar `https://<host>/api/backups/heartbeat` met
   header `Authorization: Bearer $CRON_SECRET` — bijvoorbeeld een `curl -X POST` direct na de
   dump, of een monitoring-hook bij de databasedienst. Zonder deze stap toont
   `/admin/systeemstatus` het back-up-schema eerlijk als "nog nooit gemeld" (geen vals groen),
   maar mist de dead-man's-switch zijn waarde.
2. Hang een **uptime-monitor** op `https://<host>/api/health` (naast de Railway-healthcheck).
3. Optioneel: zet `SENTRY_DSN` (+ `npm i @sentry/nextjs`) zodat DB-storingen en onverwachte fouten
   ook extern zichtbaar worden (§0b) i.p.v. alleen in de logs.

**Code-kant GEDAAN (2026-07-23) — machine-leesbaar metrics-endpoint (`/api/metrics`):** naast de
liveness-probe (`/api/health`) en het admin-UI-scherm (`/admin/systeemstatus`, vereist een mens die
inlogt) is er nu een **operationeel-monitoring-endpoint** dat de dead-man's-switch-signalen
machine-leesbaar uitleest **zonder login**, zodat een externe monitor (Prometheus-scraper of
uptime-dienst met body-check) er zelf op kan **alarmeren**. `GET /api/metrics` geeft de
Prometheus-tekstexpositie (of JSON via `?format=json`) met o.a. `zzp_up`, `zzp_db_reachable`,
`zzp_cron_heartbeat_age_seconds`/`_ok`/`_stale`, `zzp_backup_heartbeat_age_seconds`/`_ok`/`_stale`
en `zzp_verification_queue` (wachtrijdiepte). Beveiligd met **dezelfde Bearer `CRON_SECRET`** als de
taak-/heartbeat-routes (**fail-closed**: geen `CRON_SECRET` → 503, verkeerd token → 401), nooit
gecachet, en de uitvoer bevat **nooit** persoonsgegevens of secrets — alleen geaggregeerde gauges
(`src/lib/observability/metrics.ts` (puur) + `src/app/api/metrics/route.ts`). Resterend mensenwerk:
**niets extra** — richt desgewenst een scraper/monitor op het endpoint met de `CRON_SECRET` als Bearer.
**Code-kant GEDAAN (2026-07-27) — kant-en-klare Prometheus alerting-rules:** de gauges waren er, maar
een operator moest de alarmdrempels zelf verzinnen (de help-teksten zeggen "alarmeer op aanhoudende
groei" zonder concrete regel). Er is nu een **drop-in regelbestand** `docs/observability/alerts.yml`
dat elke alarmeerbare gauge vertaalt naar een alert met drempel + `for:`-duur (beschikbaarheid,
dead-man's-switch, stille-faal-backlogs met een ruime `for:` > één cron-interval, verificatie-SLA,
onderhoud-inhibitie), plus een voorbeeld-`scrape_config` met de bearer-auth in de kop. Een
**drift-gate-test** (`src/lib/observability/alerts-rules.test.ts` + puur
`src/lib/observability/alerts-rules.ts`) klinkt de gebruikte `zzp_*`-namen vast aan de gauges uit
`buildMetrics`: een hernoemde/verwijderde gauge (dode alert) of een nieuwe gauge zonder alert breekt de
CI-poort. Zie RUNBOOK §2a. Resterend mensenwerk: het bestand via `rule_files` in je Prometheus laden
(of de drempels in je uptime-dienst spiegelen) en de `CRON_SECRET` als scrape-bearer zetten.
**Code-kant GEDAAN (2026-07-26) — twee gauges erbij:** `zzp_maintenance_mode` (1 als
`MAINTENANCE_MODE` aanstaat — zodat een monitor niet paget om de bewuste 503's tijdens onderhoud, en
een per ongeluk aan-gelaten onderhoudsmodus extern zichtbaar is) en `zzp_credentials_overdue_expiry`
(aantal VERIFIED-credentials wier vervaldatum voorbij is maar die de expiry-cron nog niet op EXPIRED
zette). Die laatste is een **stille-faal-detector** die de cron-heartbeat niet vangt: de heartbeat
bewijst alleen dát de run afrondde, niet dát 'ie zijn werk deed — blijft dit getal hoog/oplopend
terwijl de heartbeat "vers" is, dan verwerkt de expiry-pijplijn niets meer. Een klein, tijdelijk
aantal (tot één cron-interval lag tussen verval en de 05:00-run) is normaal; alarmeer op aanhoudende
groei (Prometheus `for:`-duur). Beide gauges falen veilig (nooit een 500) en bevatten geen PII.
Resterend mensenwerk: **niets extra**.
**Code-kant GEDAAN (2026-07-26) — derde stille-faal-gauge:** `zzp_subscriptions_overdue_expiry`
(aantal betaalde ACTIVE-abonnementen wier `currentPeriodEnd` voorbij is maar die de
`subscription-expiry`-cron nog niet op CANCELLED → Gratis zette). Exact dezelfde stille-faal-klasse als
de credential-gauge en met dezelfde where-vorm als `runSubscriptionExpiryTask` (`ACTIVE` +
`currentPeriodEnd < nu` + `plan.priceCents > 0`), zodat de gauge de echte cron-backlog telt. De
server-side entitlement-guard behandelt zo'n verlopen periode al als Gratis (geen toegangslek), maar een
oplopende DB-backlog terwijl de cron-heartbeat "vers" is betekent dat de verval-/renewal-cyclus
(notificaties, ledger) stilligt. Een klein, tijdelijk aantal (tot één cron-interval) is normaal; alarmeer
op aanhoudende groei. Faalt veilig (nooit een 500), bevat geen PII. Resterend mensenwerk: **niets extra**.
**Code-kant GEDAAN (2026-07-27) — verificatie-wachtrij-leeftijd gauge:** `zzp_verification_queue_oldest_age_seconds`
(leeftijd in seconden van de langst wachtende SUBMITTED-verificatie-inzending; `-1` = lege wachtrij). De
bestaande `zzp_verification_queue` telt alléén de wachtrijdiepte — een kleine-maar-vastgelopen wachtrij (de
overige inzendingen werden verwerkt, één blijft dagen hangen) is een **SLA-breach op de kern-differentiatie**
die de kale telling mist. De gauge gebruikt exact dezelfde `waitingSince`-semantiek (submittedAt leidend,
updatedAt-fallback voor legacy-records) en ordering als de admin-wachtrij (`/admin/verificaties`) → kan niet
driften t.o.v. wat de admin ziet, en steunt op de bestaande index `@@index([status, submittedAt])`. Alarmeer
op "oudste wachtende verificatie > X uur". Faalt veilig (nooit een 500), bevat geen PII. Resterend mensenwerk:
**niets extra**.
