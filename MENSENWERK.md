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

   **Code-kant GEDAAN (3-7-2026): twee productie-drivers, kies er één via `EMAIL_DRIVER`.**
   - `EMAIL_DRIVER=smtp` — eigen SMTP-relay (`EMAIL_SMTP_HOST/PORT/USER/PASS` + `EMAIL_FROM`).
   - `EMAIL_DRIVER=resend` — **Resend HTTP-API** (`RESEND_API_KEY` + `EMAIL_FROM`), praat via HTTPS
     met `api.resend.com` (geen extra SDK-dependency). **Kies dit op Railway** (en andere PaaS-hosts):
     die **blokkeren uitgaande SMTP-poorten** (25/465/587), waardoor `smtp` daar niets aflevert — een
     HTTP-API is dan de enige werkende route. Zonder `EMAIL_DRIVER` blijft het kanaal `noop` (alleen
     in-app meldingen; niets te doen voor de pilot). Resterend mensenwerk: account aanmaken, domein
     verifiëren (DNS), en `RESEND_API_KEY` + `EMAIL_FROM` in de Railway-secrets zetten.

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
   - de beveiligingsheaders staan aan, maar een strenger script-beleid (nonce) kan overwogen worden;
   - rate-limiting op inloggen/acties is nog niet ingebouwd.
     **Opleveren:** rapport + akkoord om live te gaan ("GO"), of een lijst met te fixen punten (die de
     agent dan oppakt).

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

### 6d. Inhoud & huisstijl (optioneel)

Echte teksten, logo en eventuele huisstijl kun je aanleveren; de agent verwerkt ze.

---

## §7. Overzicht van geheimen/instellingen (geef deze door via de secrets-kluis)

Zet deze in de omgevingsvariabelen van je host — **nooit** in code of chat. (Zie ook `.env.example`.)

| Instelling                                                                   | Wat het is                                           | Waar haal je het     | Wanneer nodig                                    |
| ---------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------- | ------------------------------------------------ |
| `DATABASE_URL`                                                               | Verbindings-URL productie-database                   | Databasedienst (§1b) | Altijd (productie)                               |
| `AUTH_SECRET`                                                                | Geheim voor veilige inlogsessies (≥32 tekens)        | Zelf genereren (§1e) | Altijd                                           |
| `AUTH_URL`                                                                   | Je productie-webadres                                | Je domein (§1d)      | Altijd                                           |
| `STORAGE_DRIVER=s3`                                                          | Schakelt productie-opslag in                         | —                    | Bij echte uploads                                |
| `STORAGE_S3_BUCKET` / `STORAGE_S3_REGION`                                    | Bucketnaam + regio                                   | Opslagdienst (§1c)   | Bij echte uploads                                |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`                                | Opslag-toegangssleutels                              | Opslagdienst (§1c)   | Bij echte uploads                                |
| `STORAGE_S3_SSE` (+ `STORAGE_S3_SSE_KMS_KEY_ID`)                             | Encryptie-at-rest (default AES256; optioneel)        | — (§1c)              | Optioneel (default aan bij s3)                   |
| `EMAIL_DRIVER=resend` + `RESEND_API_KEY` + `EMAIL_FROM`                      | E-mail via Resend HTTP-API (Railway-proof)           | Resend (§2)          | Voor e-mail                                      |
| `EMAIL_DRIVER=smtp` + `EMAIL_SMTP_*` + `EMAIL_FROM`                          | E-mail via eigen SMTP-relay                          | Mailprovider (§2)    | Voor e-mail (niet op Railway)                    |
| `BILLING_PROVIDER=mollie` + `MOLLIE_API_KEY`                                 | Betalingen via Mollie                                | Mollie (§3)          | Voor betalingen (kies één provider)              |
| `BILLING_PROVIDER=stripe` + `STRIPE_API_KEY`/`STRIPE_WEBHOOK_SECRET`         | Betalingen via Stripe (Checkout + webhook)           | Stripe (§3)          | Voor betalingen (kies één provider)              |
| `DIPLOMA_VERIFIER=duo` + `DUO_API_BASE`/`DUO_API_KEY`                        | Echte DUO-controle                                   | DUO (§4a)            | Voor echte diplomacontrole                       |
| `BIG_VERIFIER=bigregister` + `BIG_API_BASE`/`BIG_API_KEY`                    | Echte BIG-controle                                   | CIBG (§4b)           | Voor echte zorgcontrole                          |
| `IDENTITY_VERIFIER=idin` + `IDENTITY_API_BASE`/`IDENTITY_API_KEY`            | Echte identiteitscontrole                            | PSP/iDIN (§4c)       | Voor echte identiteitscontrole                   |
| `SENTRY_DSN` (+ `npm i @sentry/nextjs`)                                      | Externe error-monitoring (anders alleen logs)        | Sentry (§0b)         | Optioneel (aanbevolen prod)                      |
| `LOG_LEVEL`                                                                  | Logdrempel (debug/info/warn/error)                   | —                    | Optioneel (default info)                         |
| `RATE_LIMIT_STORE=upstash` + `UPSTASH_REDIS_REST_URL`/`_TOKEN`               | Gedeelde rate-limits over instances                  | Upstash (§0b H-2)    | Bij horizontale schaling                         |
| `DATABASE_CONNECTION_LIMIT` (+ `DATABASE_POOL_TIMEOUT`/`DATABASE_PGBOUNCER`) | Begrenst de Prisma-pool per instance                 | — (§0b, §1b)         | Bij horizontale schaling                         |
| `UPLOAD_SCANNER=clamav` + `CLAMAV_HOST`/`CLAMAV_PORT`                        | Malware-scan van uploads                             | Eigen clamd-daemon   | Optioneel (aanbevolen prod met echte documenten) |
| `ALLOW_INDEXING=true`                                                        | Zoekmachine-indexering aanzetten (default uit)       | — (§0b)              | Optioneel bij go-live (pilot blijft privé)       |
| `SECURITY_CONTACT`                                                           | Meldpunt in /.well-known/security.txt (RFC 9116)     | — (§0b)              | Optioneel (aanbevolen vóór pentest)              |
| `AUDIT_LOG_RETENTION_DAYS`                                                   | Bewaartermijn auditlog in dagen (default: onbeperkt) | — (§5a)              | Optioneel (aanbevolen prod; bv. 365)             |

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

**Resterend mensenwerk (eenmalig):**

1. Zet **automatische dagelijkse database-back-ups** aan bij je databasedienst (EU-regio; §1b) en
   doe éénmaal een **herstel-oefening** naar een wegwerp-database vóór go-live (zie RUNBOOK §5; de
   `npm run db:backup`/`db:restore`-helper maakt de oefening reproduceerbaar).
2. Hang een **uptime-monitor** op `https://<host>/api/health` (naast de Railway-healthcheck).
3. Optioneel: zet `SENTRY_DSN` (+ `npm i @sentry/nextjs`) zodat DB-storingen en onverwachte fouten
   ook extern zichtbaar worden (§0b) i.p.v. alleen in de logs.
