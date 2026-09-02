// Systeemstatus: een PURE, testbare momentopname van de productie-configuratie-posture, afgeleid
// uit de al-gevalideerde omgeving (src/lib/env.ts). Beantwoordt de operationele go-live-vraag
// "is productie correct bekabeld?" op één scherm (admin-only): welke drivers/integraties staan
// actief, welke draaien nog op een veilige fallback, en welke vragen aandacht vóór livegang.
//
// GEEN geheimen: deze module leest alleen driver-MODI en booleans (aan/uit), nooit sleutelwaarden.
// De boot-waarschuwingen (envWarnings) noemen env-VARIABELENAMEN, geen waarden.

import { envWarnings, rateLimitStoreDiagnostics, type Env } from "@/lib/env";
import { isIndexingAllowed } from "@/lib/indexing";
import { parseAuditRetentionDays } from "@/lib/config";
import { isMaintenanceEnabled, maintenanceAllowsAdmin } from "@/lib/maintenance";
import { isSecurityContactConfigured } from "@/lib/security-txt";
import { resolveWebPushConfigState } from "@/lib/push/config";

/** ok = productie-klaar; fallback = veilige, bewuste tussenstand; attention = actie vóór livegang. */
export type StatusLevel = "ok" | "fallback" | "attention";

export interface StatusItem {
  /** Stabiele sleutel (voor keys/tests). */
  key: string;
  /** Nederlandse omschrijving van het onderdeel. */
  label: string;
  /** Actieve modus/driver (bv. "s3", "local", "resend", "noop", "PostgreSQL"). */
  mode: string;
  level: StatusLevel;
  /** Korte, niet-gevoelige toelichting. */
  detail: string;
}

export interface StatusGroup {
  title: string;
  items: StatusItem[];
}

export interface SystemStatus {
  /** Draait de app in NODE_ENV=production? Bepaalt of een fallback "aandacht" of enkel info is. */
  production: boolean;
  groups: StatusGroup[];
  /** De boot-waarschuwingen (envWarnings) — leeg buiten productie. */
  warnings: string[];
  /** Tellingen per niveau over alle items (voor de kopregel). */
  counts: Record<StatusLevel, number>;
}

/** Leidt een leesbare databank-soort af uit de DATABASE_URL-scheme (nooit de URL zelf tonen). */
export function databaseKind(databaseUrl: string): "PostgreSQL" | "SQLite" | "onbekend" {
  if (/^postgres(ql)?:/i.test(databaseUrl)) return "PostgreSQL";
  if (/^(file:|sqlite:)/i.test(databaseUrl)) return "SQLite";
  return "onbekend";
}

/**
 * Kiest het niveau voor een integratie die op een veilige fallback kan draaien: in productie is
 * een fallback "aandacht" (je wilt 'm waarschijnlijk activeren), daarbuiten louter informatief.
 */
function fallbackLevel(production: boolean): StatusLevel {
  return production ? "attention" : "fallback";
}

/**
 * Bouwt de volledige systeemstatus uit de omgeving. Puur en deterministisch — geen I/O, geen klok
 * — mits `rateLimitStore` wordt meegegeven; zonder tweede argument valt de functie voor het gemak
 * terug op een live `rateLimitStoreDiagnostics()`-lezing (env.ts) zodat de echte call-sites
 * (preflight, /admin/systeemstatus) niets extra hoeven door te geven. Tests geven expliciet mee
 * voor determinisme. De live databank-bereikbaarheid komt los binnen (readiness) en wordt in de UI
 * ernaast getoond.
 */
export function collectSystemStatus(
  env: Env,
  rateLimitStore: { invalidValue: string | null } = rateLimitStoreDiagnostics(),
): SystemStatus {
  const production = env.NODE_ENV === "production";
  const fb = fallbackLevel(production);

  const dbKind = databaseKind(env.DATABASE_URL);
  const auditRetentionDays = parseAuditRetentionDays(env.AUDIT_LOG_RETENTION_DAYS);
  const webPushState = resolveWebPushConfigState(env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
  const groups: StatusGroup[] = [
    {
      title: "Opslag & data",
      items: [
        {
          key: "database",
          label: "Database",
          mode: dbKind,
          level: dbKind === "PostgreSQL" ? "ok" : production ? "attention" : "fallback",
          detail:
            dbKind === "PostgreSQL"
              ? "Managed PostgreSQL — geschikt voor productie."
              : dbKind === "SQLite"
                ? "SQLite — vluchtig bij redeploy; gebruik managed PostgreSQL (EU-regio) in productie."
                : "Onbekende databank-URL — controleer DATABASE_URL.",
        },
        {
          key: "storage",
          label: "Documentopslag",
          mode: env.STORAGE_DRIVER,
          level: env.STORAGE_DRIVER === "s3" ? "ok" : fb,
          detail:
            env.STORAGE_DRIVER === "s3"
              ? "S3 / S3-compatibel — private objectopslag met presigned downloads."
              : "Lokale schijf — vluchtig bij redeploy. Zet STORAGE_DRIVER=s3 voor echte uploads.",
        },
        {
          key: "storage-encryption",
          label: "Encryptie-at-rest (S3)",
          mode: env.STORAGE_DRIVER === "s3" ? (env.STORAGE_S3_SSE ?? "AES256") : "n.v.t.",
          level:
            env.STORAGE_DRIVER !== "s3"
              ? "fallback"
              : env.STORAGE_S3_SSE === "none"
                ? production
                  ? "attention"
                  : "fallback"
                : "ok",
          detail:
            env.STORAGE_DRIVER !== "s3"
              ? "Alleen van toepassing bij S3-opslag."
              : env.STORAGE_S3_SSE === "none"
                ? "Geen expliciete SSE-header — leunt op de bucket-default. Zet STORAGE_S3_SSE=AES256 (of aws:kms)."
                : "Server-side-encryptie expliciet gezet bij elke upload.",
        },
      ],
    },
    {
      title: "Communicatie & betalingen",
      items: [
        {
          key: "email",
          label: "E-mailkanaal",
          mode: env.EMAIL_DRIVER,
          level: env.EMAIL_DRIVER === "noop" ? fb : "ok",
          detail:
            env.EMAIL_DRIVER === "noop"
              ? "Geen e-mailaflevering (alleen in-app meldingen). Zet EMAIL_DRIVER=resend, postmark of ses (Railway) of smtp."
              : env.EMAIL_DRIVER === "resend"
                ? "Resend HTTP-API — werkt op hosts die uitgaande SMTP blokkeren."
                : env.EMAIL_DRIVER === "postmark"
                  ? "Postmark HTTP-API — werkt op hosts die uitgaande SMTP blokkeren."
                  : env.EMAIL_DRIVER === "ses"
                    ? "Amazon SES v2 HTTP-API — EU-regio (AVG-vriendelijk), werkt op hosts die uitgaande SMTP blokkeren."
                    : "Eigen SMTP-relay.",
        },
        {
          key: "billing",
          label: "Betaalprovider",
          mode: env.BILLING_PROVIDER,
          level: env.BILLING_PROVIDER === "noop" ? "fallback" : "ok",
          detail:
            env.BILLING_PROVIDER === "noop"
              ? "Demo-abonnementsflow (geen incasso). Zet BILLING_PROVIDER=mollie of stripe voor echte betalingen."
              : `Actieve provider: ${env.BILLING_PROVIDER}. Er wordt geïncasseerd zodra de sleutels gezet zijn.`,
        },
        {
          key: "web-push",
          label: "Push-notificaties",
          // "partial" kan een geslaagde boot niet bereiken (env-validatie blokkeert 'm); defensief
          // tonen we 'm dan als "uit". Push is een optionele extra (net als de gelekt-wachtwoord-
          // controle), dus een uit-stand is fallback — nooit "aandacht", ook niet in productie.
          mode: webPushState === "configured" ? "aan" : "uit",
          level: webPushState === "configured" ? "ok" : "fallback",
          detail:
            webPushState === "configured"
              ? "VAPID-sleutels gezet — PWA-pushmeldingen worden afgeleverd (in-app meldingen blijven ook werken)."
              : "Geen pushmeldingen (in-app meldingen blijven werken). Zet VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY (genereer met `npx web-push generate-vapid-keys`) om PWA-push aan te zetten.",
        },
        mailIntakeItem(env),
      ],
    },
    {
      title: "Verificatie",
      items: [
        verifierItem(
          "diploma",
          "Diploma (DUO)",
          env.DIPLOMA_VERIFIER === "duo",
          production,
          env.SEED_DEMO === "true",
        ),
        verifierItem(
          "big",
          "Zorgregistratie (BIG)",
          env.BIG_VERIFIER === "bigregister",
          production,
          env.SEED_DEMO === "true",
        ),
        verifierItem(
          "identity",
          "Identiteit (iDIN)",
          env.IDENTITY_VERIFIER === "idin",
          production,
          env.SEED_DEMO === "true",
        ),
        {
          key: "upload-scanner",
          label: "Malware-scan uploads",
          mode: env.UPLOAD_SCANNER,
          level: env.UPLOAD_SCANNER === "clamav" ? "ok" : fb,
          detail:
            env.UPLOAD_SCANNER === "clamav"
              ? "ClamAV-daemon scant elke upload vóór opslag (fail-closed)."
              : "Geen upload-scan. Zet UPLOAD_SCANNER=clamav (met CLAMAV_HOST) vóór echte gevoelige documenten.",
        },
      ],
    },
    {
      title: "Beveiliging & observability",
      items: [
        {
          key: "deployment-stage",
          label: "Deploymentfase",
          mode: env.DEPLOYMENT_STAGE,
          level: production && env.DEPLOYMENT_STAGE === "demo" ? "attention" : "ok",
          detail:
            env.DEPLOYMENT_STAGE === "demo"
              ? "Expliciete demo-omgeving: de boot-preflight rapporteert aandachtspunten maar blokkeert niet. Alleen fictieve data gebruiken."
              : "Productiefase: een onvolledige strict preflight blokkeert de boot vóór database- of serverstart.",
        },
        {
          key: "demo-data",
          label: "Demo-dataset (SEED_DEMO)",
          mode: env.SEED_DEMO === "true" ? "aan" : "uit",
          // In productie is een actieve demo-dataset kritiek: het plant vaste accounts (waaronder
          // admin@zzp-platform.local met het bekende wachtwoord demo1234) en onderdrukt de
          // verificatie-waarschuwingen. Buiten productie (of uit) is er niets aan de hand.
          level: production && env.SEED_DEMO === "true" ? "attention" : "ok",
          detail:
            env.SEED_DEMO === "true"
              ? "SEED_DEMO=true — vaste demo-accounts (waaronder admin@zzp-platform.local met het bekende wachtwoord demo1234) worden geseed en de verificatie-waarschuwingen zijn onderdrukt. Alleen voor een demo-/test-URL; zet SEED_DEMO uit + maak de database schoon en zet de eerste beheerder via BOOTSTRAP_ADMIN_* vóór livegang met echte gegevens."
              : "Geen demo-dataset — alleen referentiedata wordt geseed. De eerste beheerder komt via BOOTSTRAP_ADMIN_EMAIL/PASSWORD.",
        },
        {
          key: "share-token-secret",
          label: "Deel-token-sleutel",
          mode: env.SHARE_TOKEN_SECRET ? "eigen sleutel" : "fallback (AUTH_SECRET)",
          level: env.SHARE_TOKEN_SECRET ? "ok" : fb,
          detail: env.SHARE_TOKEN_SECRET
            ? "Eigen SHARE_TOKEN_SECRET — losgekoppeld van AUTH_SECRET-rotatie."
            : "Valt terug op AUTH_SECRET; rotatie daarvan breekt bestaande deel-links. Zet SHARE_TOKEN_SECRET.",
        },
        {
          key: "auth-url",
          label: "Productie-webadres",
          mode: (env.AUTH_URL ?? env.NEXTAUTH_URL) ? "gezet" : "ontbreekt",
          level: (env.AUTH_URL ?? env.NEXTAUTH_URL) ? "ok" : fb,
          detail:
            (env.AUTH_URL ?? env.NEXTAUTH_URL)
              ? "AUTH_URL gezet — betrouwbare login-callbacks en deel-links."
              : "AUTH_URL/NEXTAUTH_URL ontbreekt — zet je productie-webadres.",
        },
        {
          key: "error-monitoring",
          label: "Externe error-monitoring",
          mode: env.SENTRY_DSN ? "sentry" : "alleen logs",
          level: env.SENTRY_DSN ? "ok" : "fallback",
          detail: env.SENTRY_DSN
            ? "Sentry actief (mits @sentry/nextjs geïnstalleerd) — fouten ook extern zichtbaar."
            : "Server-fouten worden alleen gestructureerd gelogd. Zet SENTRY_DSN voor externe monitoring.",
        },
        {
          key: "task-cron",
          label: "Taak-endpoints (cron)",
          mode: env.CRON_SECRET ? "beveiligd" : "uitgeschakeld",
          level: env.CRON_SECRET ? "ok" : fb,
          detail: env.CRON_SECRET
            ? "CRON_SECRET gezet — /api/tasks/* draaien de geplande runners."
            : "CRON_SECRET ontbreekt — de taak-endpoints zijn uitgeschakeld (geplande runners draaien niet).",
        },
        {
          key: "audit-retention",
          label: "Auditlog-retentie",
          mode: auditRetentionDays > 0 ? `${auditRetentionDays} dagen` : "onbeperkt bewaren",
          // Default is het gedocumenteerde 12-maandenvenster (fail-safe naar wissen); een operator kan
          // via een expliciete 0 uitzetten. "ok" wanneer een venster wordt afgedwongen; "attention"
          // wanneer retentie expliciet uit staat, want dan wordt de in het register beloofde
          // AVG-bewaartermijn niet gehandhaafd (onbeperkt bewaren = potentiële art. 5(1)(e)-overtreding).
          level: auditRetentionDays > 0 ? "ok" : "attention",
          detail:
            auditRetentionDays > 0
              ? `Auditregels ouder dan ${auditRetentionDays} dagen worden gesnoeid (AVG dataminimalisatie).`
              : "Auditlog-retentie is expliciet uitgezet (AUDIT_LOG_RETENTION_DAYS=0) — de auditlog wordt onbeperkt bewaard. Verwijder de override of zet een venster (bv. 365) om de gedocumenteerde bewaartermijn af te dwingen.",
        },
        {
          key: "search-indexing",
          label: "Zoekmachine-indexering",
          mode: isIndexingAllowed(env.ALLOW_INDEXING) ? "geïndexeerd" : "afgeschermd",
          // Beide toestanden zijn veilig: afgeschermd is de bewuste privé-default (besloten pilot),
          // geïndexeerd de bewuste go-live-keuze. Geen "aandacht" — niets is misgeconfigureerd.
          level: "ok",
          detail: isIndexingAllowed(env.ALLOW_INDEXING)
            ? "ALLOW_INDEXING=true — robots.txt staat crawlen toe, geen noindex-header (openbaar)."
            : "robots.txt disallowt alles + X-Robots-Tag noindex (besloten). Zet ALLOW_INDEXING=true bij go-live.",
        },
        maintenanceItem(env),
        {
          key: "security-contact",
          label: "Beveiligingscontact (security.txt)",
          mode: isSecurityContactConfigured(env.SECURITY_CONTACT) ? "gezet" : "afgeleid",
          // Afgeleid mailto:security@<host> is een veilige eindtoestand (security.txt serveert altijd
          // een plausibel meldpunt), geen misconfiguratie → fallback, geen "aandacht", ook in prod.
          level: isSecurityContactConfigured(env.SECURITY_CONTACT) ? "ok" : "fallback",
          detail: isSecurityContactConfigured(env.SECURITY_CONTACT)
            ? "SECURITY_CONTACT gezet — /.well-known/security.txt (RFC 9116) wijst naar een eigen meldpunt."
            : "security.txt valt terug op mailto:security@<host>. Zet SECURITY_CONTACT naar een bewaakte mailbox vóór de pentest.",
        },
        {
          key: "change-password-url",
          label: "Wachtwoord-wijzigen-vindpunt (well-known)",
          // Altijd actief, geen config: /.well-known/change-password verwijst een wachtwoordmanager
          // door naar /account/wachtwoord (W3C-standaard). Geen misconfiguratie mogelijk → altijd ok.
          mode: "actief",
          level: "ok",
          detail:
            "/.well-known/change-password verwijst wachtwoordmanagers door naar de wachtwoord-wijzigen-pagina (complementair aan de gelekt-wachtwoord-controle).",
        },
        {
          key: "password-breach",
          label: "Gelekt-wachtwoord-controle",
          mode: env.PASSWORD_BREACH_CHECK,
          // Aanbevolen extra (NIST 800-63B), geen misconfiguratie: "noop" is een geldige, veilige
          // eindtoestand → fallback (nooit "aandacht", ook niet in productie).
          level: env.PASSWORD_BREACH_CHECK === "hibp" ? "ok" : "fallback",
          detail:
            env.PASSWORD_BREACH_CHECK === "hibp"
              ? "Nieuwe wachtwoorden worden k-anoniem tegen Have I Been Pwned gecontroleerd (sleutelloos, fail-open)."
              : "Geen gelekt-wachtwoord-controle. Zet PASSWORD_BREACH_CHECK=hibp om nieuwe wachtwoorden tegen bekende datalekken (NIST 800-63B) te controleren.",
        },
      ],
    },
    {
      title: "Schaalbaarheid",
      items: [
        {
          key: "rate-limit-store",
          label: "Rate-limit-store",
          // Een ONBEKENDE ruwe waarde (rateLimitStoreDiagnostics) is altijd "attention": de boot viel
          // veilig terug op memory, maar dat is een misconfiguratie die actie vraagt (incident
          // 2-9-2026) — anders dan een bewuste, geldige memory-keuze (die blijft "fallback").
          mode: rateLimitStore.invalidValue
            ? `${env.RATE_LIMIT_STORE} (onbekend: "${rateLimitStore.invalidValue}")`
            : env.RATE_LIMIT_STORE,
          level: rateLimitStore.invalidValue
            ? "attention"
            : env.RATE_LIMIT_STORE === "memory"
              ? "fallback"
              : "ok",
          detail: rateLimitStore.invalidValue
            ? `RATE_LIMIT_STORE="${rateLimitStore.invalidValue}" is geen geldige driver (memory/upstash/redis) — teruggevallen op memory. Zet een geldige waarde.`
            : env.RATE_LIMIT_STORE === "redis"
              ? "Gedeeld via Redis — limieten gelden over alle instances."
              : env.RATE_LIMIT_STORE === "upstash"
                ? "Gedeeld via Upstash Redis — limieten gelden over alle instances."
                : "Per-proces in-memory. Zet RATE_LIMIT_STORE=upstash of redis vóór horizontale schaling.",
        },
        {
          key: "semantic-matcher",
          label: "Semantische matching",
          mode: env.SEMANTIC_MATCHER,
          // "local" is een geldige, productie-geschikte default (deterministische in-memory matcher) →
          // ok, geen "aandacht" bij elke deploy. "pgvector" is momenteel geselecteerd-maar-niet-
          // operationeel: matching valt graceful terug op lokaal, wat een operator wil zien (hij denkt
          // mogelijk dat pgvector actief is). In productie is dat "aandacht" (voltooi de provisioning of
          // zet 'm terug op local); daarbuiten louter informatief. Bevestig met de zelftest.
          level:
            env.SEMANTIC_MATCHER === "pgvector" ? (production ? "attention" : "fallback") : "ok",
          detail:
            env.SEMANTIC_MATCHER === "pgvector"
              ? "pgvector geselecteerd maar nog niet operationeel (DB-provisioning = mensenwerk) — matching draait op de lokale fallback. Voltooi de provisioning of zet SEMANTIC_MATCHER=local. Bevestig met de semantische-matching-zelftest."
              : "Lokale in-memory matcher — deterministisch en productie-geschikt. Zet SEMANTIC_MATCHER=pgvector pas nadat de pgvector-provisioning bevestigd is.",
        },
        dbPoolItem(env, dbKind, production),
      ],
    },
  ];

  const counts: Record<StatusLevel, number> = { ok: 0, fallback: 0, attention: 0 };
  for (const group of groups) {
    for (const item of group.items) counts[item.level] += 1;
  }

  return { production, groups, warnings: envWarnings(env), counts };
}

/**
 * Status-item voor de connection-pool per proces (productie-Postgres). Zonder een expliciete
 * DATABASE_CONNECTION_LIMIT opent Prisma per instance zijn eigen pool (default num_cpus*2+1);
 * bij horizontale schaling kan dat het connectie-plafond van de managed DB uitputten. Alleen
 * relevant op Postgres — op SQLite is er geen gedeeld connectie-plafond.
 */
function dbPoolItem(
  env: Env,
  dbKind: ReturnType<typeof databaseKind>,
  production: boolean,
): StatusItem {
  if (dbKind !== "PostgreSQL") {
    return {
      key: "db-connection-pool",
      label: "DB-connectiepool",
      mode: "n.v.t.",
      level: "fallback",
      detail: "Alleen van toepassing op productie-PostgreSQL.",
    };
  }
  const limit = env.DATABASE_CONNECTION_LIMIT?.trim();
  if (limit) {
    const extras = [
      env.DATABASE_POOL_TIMEOUT?.trim() ? `pool_timeout=${env.DATABASE_POOL_TIMEOUT.trim()}` : null,
      env.DATABASE_PGBOUNCER?.trim().toLowerCase() === "true" ? "pgbouncer" : null,
    ].filter(Boolean);
    return {
      key: "db-connection-pool",
      label: "DB-connectiepool",
      mode: `limit ${limit}${extras.length ? ` (${extras.join(", ")})` : ""}`,
      level: "ok",
      detail: "Pool per instance begrensd — veilig voor horizontale schaling.",
    };
  }
  return {
    key: "db-connection-pool",
    label: "DB-connectiepool",
    mode: "Prisma-default",
    level: production ? "attention" : "fallback",
    detail:
      "Geen DATABASE_CONNECTION_LIMIT — Prisma opent per instance num_cpus*2+1 connecties; bij meerdere instances kan dat het DB-plafond uitputten. Zet DATABASE_CONNECTION_LIMIT vóór horizontale schaling.",
  };
}

/**
 * Status-item voor de inbound mail-intake-webhook (/api/mail-intake/webhook). Anders dan de
 * betaal-webhook (die ondertekent en dus een handtekening-heartbeat krijgt) is dit een
 * shared-secret-kanaal: het endpoint is default UIT (404) en activeert pas zodra
 * MAIL_INTAKE_WEBHOOK_SECRET gezet is (CLAUDE.md regel 8, geen halve activering). Zonder een
 * config-item op de systeemstatus kon een operator die de inbound-mailprovider (bv. Postmark
 * Inbound) bekabelt niet bevestigen dát mail-intake aanstaat zonder eerst een echte mail te sturen —
 * dit maakt die go-live-posture zichtbaar. Toont alleen booleans/modus, nooit het secret zelf.
 *
 * "uit" (geen secret) is een geldige, veilige eindtoestand (de feature staat bewust default uit,
 * net als push/gelekt-wachtwoord/security.txt) → fallback, nooit "aandacht", ook niet in productie.
 */
function mailIntakeItem(env: Env): StatusItem {
  const enabled = !!env.MAIL_INTAKE_WEBHOOK_SECRET?.trim();
  if (!enabled) {
    return {
      key: "mail-intake",
      label: "Mail-intake (inbound webhook)",
      mode: "uit",
      level: "fallback",
      detail:
        "Geen MAIL_INTAKE_WEBHOOK_SECRET — de inbound-webhook (/api/mail-intake/webhook) is uitgeschakeld (404) en mail-intake staat uit. Zet MAIL_INTAKE_WEBHOOK_SECRET en koppel je inbound-mailprovider (bv. Postmark Inbound) om dienstaanvragen per e-mail in de reviewqueue te ontvangen.",
    };
  }
  const hasAddress = !!env.MAIL_INTAKE_ADDRESS?.trim();
  return {
    key: "mail-intake",
    label: "Mail-intake (inbound webhook)",
    mode: "aan",
    level: "ok",
    detail: hasAddress
      ? "MAIL_INTAKE_WEBHOOK_SECRET gezet — de inbound-webhook accepteert geauthenticeerde dienstaanvraag-mails en zet ze in de reviewqueue. MAIL_INTAKE_ADDRESS gezet: de reviewqueue toont het volledige per-bedrijf plus-adres."
      : "MAIL_INTAKE_WEBHOOK_SECRET gezet — de inbound-webhook accepteert geauthenticeerde dienstaanvraag-mails en zet ze in de reviewqueue. Zet ook MAIL_INTAKE_ADDRESS (het basisadres van de inbound-mailbox) zodat de reviewqueue het volledige per-bedrijf plus-adres toont i.p.v. het kale alias-token.",
  };
}

/**
 * Status-item voor de onderhoudsmodus. Aan = het platform toont bezoekers een 503 (vraagt aandacht,
 * ook al is het bewust), uit = normaal bereikbaar (ok). Toont of admins er tijdens onderhoud door
 * mogen, zonder ooit de vlagwaarde zelf als geheim te behandelen (het is geen secret).
 */
function maintenanceItem(env: Env): StatusItem {
  const enabled = isMaintenanceEnabled(env.MAINTENANCE_MODE);
  if (!enabled) {
    return {
      key: "maintenance-mode",
      label: "Onderhoudsmodus",
      mode: "uit",
      level: "ok",
      detail:
        "Normaal bereikbaar. Zet MAINTENANCE_MODE=true om het platform tijdelijk offline te halen.",
    };
  }
  const adminBypass = maintenanceAllowsAdmin(env.MAINTENANCE_ALLOW_ADMIN);
  return {
    key: "maintenance-mode",
    label: "Onderhoudsmodus",
    mode: adminBypass ? "aan (admins erdoor)" : "aan (volledig)",
    level: "attention",
    detail: adminBypass
      ? "Bezoekers krijgen een 503-onderhoudspagina; ingelogde admins mogen erdoor. Zet MAINTENANCE_MODE uit na het onderhoud."
      : "Bezoekers én admins krijgen een 503-onderhoudspagina (MAINTENANCE_ALLOW_ADMIN=false). Zet MAINTENANCE_MODE uit na het onderhoud.",
  };
}

/**
 * Bouwt een status-item voor een externe verificatie-adapter. Draait de adapter niet op zijn echte
 * register, dan valt hij terug op de demo-verifier; in productie is zelf-verificatie dan fail-closed
 * geblokkeerd (behalve met demo-dataset), dus dat vraagt aandacht vóór livegang met echte data.
 */
function verifierItem(
  key: string,
  label: string,
  real: boolean,
  production: boolean,
  seedDemo: boolean,
): StatusItem {
  if (real) {
    return {
      key: `verifier-${key}`,
      label,
      mode: "echte koppeling",
      level: "ok",
      detail: "Echte registerkoppeling actief.",
    };
  }
  return {
    key: `verifier-${key}`,
    label,
    mode: "demo-verifier",
    level: production && !seedDemo ? "attention" : "fallback",
    detail:
      production && !seedDemo
        ? "Demo-verifier — zelf-verificatie is in productie fail-closed geblokkeerd tot de echte koppeling is gezet."
        : "Demo-verifier (pilot/demo). Zet de echte koppeling vóór livegang met echte data.",
  };
}
