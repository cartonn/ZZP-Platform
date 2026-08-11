// Error-reporting-grens (zelfde service-patroon als StorageDriver/MailSender): een interface +
// een veilige standaard-implementatie (console → gestructureerde logger) + een optionele externe
// implementatie (Sentry) die alleen wordt gekozen als SENTRY_DSN gezet is. Het Sentry-pakket wordt
// lazy geladen, zodat een ontbrekende of defecte runtime nooit een request kan laten falen.
// Reporting mag een request NOOIT laten falen: alles wordt geslikt, niets wordt naar buiten gegooid.

import { logger } from "@/lib/observability/logger";
import { buildSentryInitOptions } from "@/lib/observability/sentry-options";

export interface ReportContext {
  /** Herkomst van de fout, bv. "onRequestError", "task:expiry". */
  source?: string;
  /** Verzoekpad zonder querystring/PII. */
  requestPath?: string;
  /** Correlatie-ID (`x-request-id`) van de request, koppelt de fout aan de server-logs/response. */
  requestId?: string;
  /** Vrije, niet-gevoelige extra context (de logger redacteert PII/secrets). */
  extra?: Record<string, unknown>;
}

export interface ErrorReporter {
  readonly name: string;
  capture(error: unknown, context?: ReportContext): Promise<void>;
}

/** Haalt naam/message/stack veilig uit een onbekende waarde (kan een niet-Error zijn). */
export function describeError(error: unknown): { name: string; message: string; stack?: string } {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  if (typeof error === "string") {
    return { name: "NonError", message: error };
  }
  if (error && typeof error === "object") {
    const obj = error as { name?: unknown; message?: unknown };
    return {
      name: typeof obj.name === "string" ? obj.name : "NonError",
      message: typeof obj.message === "string" ? obj.message : safeStringify(error),
    };
  }
  return { name: "NonError", message: safeStringify(error) };
}

/** Serialiseert een waarde defensief; valt terug op String() bij circulaire structuren. */
function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

/**
 * Standaard-reporter: logt de fout gestructureerd via de logger. De logger redacteert PII/secrets
 * zelf, dus de context wordt onbewerkt doorgegeven (niet zelf redacten).
 */
class ConsoleErrorReporter implements ErrorReporter {
  readonly name = "console";

  async capture(error: unknown, context?: ReportContext): Promise<void> {
    const { name, message, stack } = describeError(error);
    logger.error("unhandled-error", { name, message, stack, ...context });
  }
}

// Module-vlaggen voor de Sentry-tak: één keer initialiseren, en bij een mislukte import niet
// elke call opnieuw proberen (val permanent terug op console tot een reset).
let sentryInitDone = false;
let sentryUnavailable = false;
let sentryWarned = false;

type SentrySdk = {
  init: (options: ReturnType<typeof buildSentryInitOptions>) => void;
  captureException: (
    error: unknown,
    hint?: { extra?: Record<string, unknown>; tags?: Record<string, string> },
  ) => void;
  captureMessage: (message: string, level?: string) => void;
  flush: (timeout?: number) => Promise<boolean>;
};

type SentryLoader = () => Promise<SentrySdk | null>;

const defaultSentryLoader: SentryLoader = async () => {
  const moduleId = "@sentry/nextjs";
  return (await import(/* webpackIgnore: true */ moduleId).catch(() => null)) as SentrySdk | null;
};

let loadSentry: SentryLoader = defaultSentryLoader;

/** Injecteerbare loader uitsluitend voor tests; voorkomt echte netwerkrequests naar Sentry. */
export function __setSentryLoaderForTests(loader?: SentryLoader): void {
  loadSentry = loader ?? defaultSentryLoader;
  __resetReporterForTests();
}

/**
 * Externe reporter via @sentry/nextjs. Mislukt de lazy import → éénmalig een waarschuwing en
 * daarna stille fallback op de console-capture. Nooit throwen.
 */
class SentryErrorReporter implements ErrorReporter {
  readonly name = "sentry";
  private readonly fallback = new ConsoleErrorReporter();

  async capture(error: unknown, context?: ReportContext): Promise<void> {
    if (sentryUnavailable) {
      await this.fallback.capture(error, context);
      return;
    }

    const sentry = await loadSentry();

    if (!sentry) {
      sentryUnavailable = true;
      if (!sentryWarned) {
        sentryWarned = true;
        logger.warn("sentry-unavailable", {
          reason:
            "Pakket @sentry/nextjs is niet geïnstalleerd; fouten worden gestructureerd gelogd.",
        });
      }
      await this.fallback.capture(error, context);
      return;
    }

    if (!sentryInitDone) {
      sentryInitDone = true;
      // Gehardende opties (environment/release + PII-scrubbing + sendDefaultPii:false), zodat een
      // AVG-platform met gevoelige documenten geen request-headers/cookies/IP/gebruikersdata naar
      // de externe verwerker lekt. Zie sentry-options.ts.
      sentry.init(buildSentryInitOptions());
    }
    // request-id als tag zodat je in Sentry direct op de correlatie-ID kunt filteren/zoeken.
    const tags = context?.requestId ? { request_id: context.requestId } : undefined;
    sentry.captureException(error, { extra: { ...context }, tags });
  }
}

let cached: ErrorReporter | null = null;

/** Geeft de geconfigureerde reporter terug (singleton). Sentry alleen als SENTRY_DSN gezet is. */
export function getErrorReporter(): ErrorReporter {
  if (cached) return cached;
  cached = process.env.SENTRY_DSN ? new SentryErrorReporter() : new ConsoleErrorReporter();
  return cached;
}

/** Reset de cache + Sentry-vlaggen — uitsluitend voor tests. */
export function __resetReporterForTests(): void {
  cached = null;
  sentryInitDone = false;
  sentryUnavailable = false;
  sentryWarned = false;
}

/** Maximale tijd (ms) dat de zelftest wacht tot Sentry zijn verzendbuffer heeft geleegd (flush). */
export const ERROR_MONITORING_SELFTEST_FLUSH_TIMEOUT_MS = 5000;

/** Uitkomst van een probe tegen de externe error-monitoring (Sentry). Bevat nooit secrets/DSN. */
export interface ErrorMonitoringProbeResult {
  /** Is @sentry/nextjs daadwerkelijk geïnstalleerd? Zo niet, valt de reporter stil terug op console. */
  packageInstalled: boolean;
  /** Legde Sentry de verzendbuffer tijdig (flush → true)? Bewijst dat het transport de gebeurtenis accepteerde. */
  delivered: boolean;
  /** Korte, niet-gevoelige toelichting (nooit de DSN of een rauw provider-bericht). */
  detail: string;
}

/**
 * Actieve probe tegen de externe error-monitoring, voor de admin-zelftest (/admin/systeemstatus).
 * De reporter valt bij een niet-geïnstalleerd @sentry/nextjs STIL terug op console — een gezette
 * SENTRY_DSN wekt dan de illusie van externe monitoring terwijl productie-fouten onzichtbaar blijven.
 * Deze probe maakt dat expliciet: hij laadt het pakket via dezelfde variabele-module-specifier als de
 * reporter (bundler resolvet het niet statisch), initialiseert met dezelfde gehardende opties
 * (PII-scrubbing), stuurt één synthetische testgebeurtenis en wacht op `flush()` als bewijs dat het
 * transport de gebeurtenis accepteerde en doorstuurde.
 *
 * Zelfstandig van de reporter-singleton (eigen import + init): een zeldzame, admin-getriggerde
 * her-init met dezelfde opties is onschadelijk en vermijdt koppeling met de gecachete reporter-staat.
 * Werpt niet voor een flush-time-out (gevangen → delivered:false); andere fouten laat hij door zodat
 * de aanroeper ze als veilige `detail` (error-NAAM) kan tonen.
 */
export async function probeErrorMonitoring(token: string): Promise<ErrorMonitoringProbeResult> {
  const sentry = await loadSentry();

  if (!sentry) {
    return {
      packageInstalled: false,
      delivered: false,
      detail:
        "Pakket @sentry/nextjs is niet geïnstalleerd — SENTRY_DSN is gezet maar fouten worden alleen gestructureerd gelogd (geen externe monitoring). Installeer het pakket (npm i @sentry/nextjs) en deploy opnieuw.",
    };
  }

  sentry.init(buildSentryInitOptions());
  sentry.captureMessage(`Handslag — error-monitoring zelftest (${token})`, "info");
  const flushed = await sentry.flush(ERROR_MONITORING_SELFTEST_FLUSH_TIMEOUT_MS).catch(() => false);

  return {
    packageInstalled: true,
    delivered: flushed === true,
    detail:
      flushed === true
        ? "Testgebeurtenis verzonden en de verzendbuffer is tijdig geleegd (flush geslaagd) — het transport accepteerde de gebeurtenis."
        : "Testgebeurtenis in de wachtrij gezet, maar de verzendbuffer werd niet tijdig geleegd (flush-time-out). Controleer de DSN en de uitgaande netwerktoegang naar Sentry.",
  };
}

/**
 * Rapporteert een fout via de actieve reporter. Slikt ALLES: reporting mag de request nooit laten
 * falen. Geeft nooit een rejection naar buiten.
 */
export async function reportError(error: unknown, context?: ReportContext): Promise<void> {
  try {
    await getErrorReporter().capture(error, context);
  } catch {
    // Reporting zelf mag nooit doorbreken naar de caller; bewust geslikt.
  }
}

/**
 * Rapporteert een mislukte achtergrond-/cron-taak. Anders dan een request-fout (die via
 * `onRequestError` → `reportError` binnenkomt) worden taakfouten door de taakloper opgevangen en
 * dus NOOIT door Next's grens gezien — zonder deze helper zou een falende taak op de onbewaakte
 * dagelijkse cron alleen in de logs verdwijnen en nooit in externe monitoring (Sentry) opduiken.
 *
 * Gedrag: ALTIJD een lokale, gestructureerde (PII-geredacteerde) regel loggen, en ADDITIONEEL naar
 * de externe reporter sturen wanneer die geconfigureerd is (`SENTRY_DSN`). De externe tak wordt op
 * DSN gepoort zodat de console-fallback niet dubbel logt. Slikt alles: rapportage mag een taak nooit
 * laten falen (de taakloper telt de fout los als mislukt).
 */
export async function reportBackgroundFailure(
  source: string,
  error: unknown,
  extra?: Record<string, unknown>,
): Promise<void> {
  try {
    logger.error("background-failure", { source, ...(extra ?? {}), error: describeError(error) });
  } catch {
    // Loggen mag nooit doorbreken; bewust geslikt.
  }
  // Alleen wanneer Sentry geconfigureerd is escaleren; anders zou de console-reporter de zojuist
  // geschreven regel dupliceren.
  if (process.env.SENTRY_DSN) {
    await reportError(error, { source, extra });
  }
}
