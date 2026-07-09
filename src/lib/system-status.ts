// Systeemstatus: een PURE, testbare momentopname van de productie-configuratie-posture, afgeleid
// uit de al-gevalideerde omgeving (src/lib/env.ts). Beantwoordt de operationele go-live-vraag
// "is productie correct bekabeld?" op één scherm (admin-only): welke drivers/integraties staan
// actief, welke draaien nog op een veilige fallback, en welke vragen aandacht vóór livegang.
//
// GEEN geheimen: deze module leest alleen driver-MODI en booleans (aan/uit), nooit sleutelwaarden.
// De boot-waarschuwingen (envWarnings) noemen env-VARIABELENAMEN, geen waarden.

import { envWarnings, type Env } from "@/lib/env";
import { isIndexingAllowed } from "@/lib/indexing";

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
 * Bouwt de volledige systeemstatus uit de omgeving. Puur en deterministisch — geen I/O, geen klok.
 * De live databank-bereikbaarheid komt los binnen (readiness) en wordt in de UI ernaast getoond.
 */
export function collectSystemStatus(env: Env): SystemStatus {
  const production = env.NODE_ENV === "production";
  const fb = fallbackLevel(production);

  const dbKind = databaseKind(env.DATABASE_URL);
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
              ? "Geen e-mailaflevering (alleen in-app meldingen). Zet EMAIL_DRIVER=resend (Railway) of smtp."
              : env.EMAIL_DRIVER === "resend"
                ? "Resend HTTP-API — werkt op hosts die uitgaande SMTP blokkeren."
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
      ],
    },
    {
      title: "Schaalbaarheid",
      items: [
        {
          key: "rate-limit-store",
          label: "Rate-limit-store",
          mode: env.RATE_LIMIT_STORE,
          level: env.RATE_LIMIT_STORE === "upstash" ? "ok" : "fallback",
          detail:
            env.RATE_LIMIT_STORE === "upstash"
              ? "Gedeeld via Upstash Redis — limieten gelden over alle instances."
              : "Per-proces in-memory. Zet RATE_LIMIT_STORE=upstash vóór horizontale schaling.",
        },
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
