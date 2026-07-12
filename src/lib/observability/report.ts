// Error-reporting-grens (zelfde service-patroon als StorageDriver/MailSender): een interface +
// een veilige standaard-implementatie (console → gestructureerde logger) + een optionele externe
// implementatie (Sentry) die alleen wordt gekozen als SENTRY_DSN gezet is. Het Sentry-pakket is
// NIET geïnstalleerd; het wordt lazy en via een variabele module-specifier geladen zodat de
// bundler het niet statisch probeert te resolven. Faalt de import → graceful fallback op console.
// Reporting mag een request NOOIT laten falen: alles wordt geslikt, niets wordt naar buiten gegooid.

import { logger } from "@/lib/observability/logger";

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

/**
 * Externe reporter via @sentry/nextjs. Het pakket is niet geïnstalleerd; daarom lazy import via een
 * VARIABELE specifier (de bundler resolvet het dan niet statisch). Mislukt de import → éénmalig een
 * waarschuwing en daarna stille fallback op de console-capture. Nooit throwen.
 */
class SentryErrorReporter implements ErrorReporter {
  readonly name = "sentry";
  private readonly fallback = new ConsoleErrorReporter();

  async capture(error: unknown, context?: ReportContext): Promise<void> {
    if (sentryUnavailable) {
      await this.fallback.capture(error, context);
      return;
    }

    const moduleId = "@sentry/nextjs";
    const Sentry = await import(/* webpackIgnore: true */ moduleId).catch(() => null);

    if (!Sentry) {
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

    const sentry = Sentry as {
      init: (options: { dsn?: string }) => void;
      captureException: (
        error: unknown,
        hint?: { extra?: Record<string, unknown>; tags?: Record<string, string> },
      ) => void;
    };

    if (!sentryInitDone) {
      sentryInitDone = true;
      sentry.init({ dsn: process.env.SENTRY_DSN });
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
