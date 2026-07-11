// Onderhoudsmodus (maintenance mode): een operationele noodrem waarmee de beheerder het platform
// tijdens een geplande migratie, een database-herstel of een incident gecontroleerd offline haalt.
// In plaats van halfwerkende schermen of 500-fouten krijgt de bezoeker dan een rustige 503-pagina
// ("we zijn zo terug") met een `Retry-After`-hint, terwijl de gezondheids-endpoints blijven
// antwoorden zodat de host-healthcheck de container niet neerhaalt.
//
// Inert by default: zonder MAINTENANCE_MODE verandert er niets. Puur en testbaar (geen I/O, geen
// klok, geen Next-afhankelijkheden) zodat de middleware alleen de beslissing overneemt.

/** Truthy-conventie, consistent met de rest van de env-vlaggen ("true"/"1"/"on"/"yes"). */
const TRUTHY = new Set(["true", "1", "on", "yes"]);

function isTruthy(value: string | undefined): boolean {
  return value !== undefined && TRUTHY.has(value.trim().toLowerCase());
}

/** Staat de onderhoudsmodus aan? */
export function isMaintenanceEnabled(value: string | undefined): boolean {
  return isTruthy(value);
}

/**
 * Mogen ingelogde ADMINs er tijdens onderhoud toch door (om de deploy te verifiëren)? Default JA —
 * de beheerder mag zichzelf niet buitensluiten. Zet MAINTENANCE_ALLOW_ADMIN=false voor een volledige
 * afsluiting (bv. tijdens een database-herstel waarbij ook admin-verkeer schade kan doen). Dit
 * verzwakt geen enkele controle: het is een extra blokkade die admins optioneel overslaan, nooit een
 * versoepeling van de bestaande auth/rol/ownership-keten.
 */
export function maintenanceAllowsAdmin(value: string | undefined): boolean {
  if (value === undefined) return true;
  return !new Set(["false", "0", "off", "no"]).has(value.trim().toLowerCase());
}

const DEFAULT_RETRY_AFTER_SECONDS = 300;
const MIN_RETRY_AFTER_SECONDS = 30;
const MAX_RETRY_AFTER_SECONDS = 86_400; // 24 uur

/** `Retry-After`-waarde in seconden. Ongeldig/ontbrekend → veilige default; geklemd op [30, 86400]. */
export function maintenanceRetryAfterSeconds(value: string | undefined): number {
  const parsed = Number.parseInt((value ?? "").trim(), 10);
  if (!Number.isFinite(parsed)) return DEFAULT_RETRY_AFTER_SECONDS;
  return Math.min(MAX_RETRY_AFTER_SECONDS, Math.max(MIN_RETRY_AFTER_SECONDS, parsed));
}

const DEFAULT_MAINTENANCE_MESSAGE =
  "We voeren gepland onderhoud uit. Het platform is zo weer beschikbaar — probeer het over enkele minuten opnieuw.";
const MAX_MESSAGE_LENGTH = 300;

/**
 * Leest de optionele eigen onderhoudstekst uit env. Wordt gestript van control-tekens en afgekapt;
 * de HTML-escaping gebeurt bij het renderen (buildMaintenancePage), zodat de waarde nooit als markup
 * kan lekken. Leeg/ontbrekend → een nette standaardtekst.
 */
export function maintenanceMessage(value: string | undefined): string {
  const cleaned = (value ?? "")
    // Control-tekens (incl. nieuwe regels) weg zodat de tekst één rustige regel blijft.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length === 0) return DEFAULT_MAINTENANCE_MESSAGE;
  return cleaned.slice(0, MAX_MESSAGE_LENGTH);
}

/**
 * Paden die óók tijdens onderhoud blijven werken. Bewust alleen de gezondheids-probes: zou
 * /api/health tijdens onderhoud een 503 geven, dan zou de host-healthcheck (Railway) de container
 * herstarten — precies wat je tijdens een migratie/herstel niet wilt. Uptime-monitors blijven zo ook
 * groen. Alle overige routes vallen onder de onderhoudspagina.
 */
export const MAINTENANCE_EXEMPT_PATHS = ["/api/health", "/api/readiness"] as const;

export function isMaintenanceExemptPath(pathname: string): boolean {
  return (MAINTENANCE_EXEMPT_PATHS as readonly string[]).includes(pathname);
}

export interface MaintenanceDecisionInput {
  enabled: boolean;
  pathname: string;
  /** Is de huidige bezoeker een ingelogde ADMIN? */
  isAdmin: boolean;
  /** Mogen admins er tijdens onderhoud door? (maintenanceAllowsAdmin) */
  allowAdmin: boolean;
}

/**
 * Kernbeslissing: moet deze request de onderhoudspagina (503) krijgen? True wanneer onderhoud aan
 * staat, het pad niet is vrijgesteld, en de bezoeker geen doorgelaten admin is.
 */
export function shouldServeMaintenance({
  enabled,
  pathname,
  isAdmin,
  allowAdmin,
}: MaintenanceDecisionInput): boolean {
  if (!enabled) return false;
  if (isMaintenanceExemptPath(pathname)) return false;
  if (isAdmin && allowAdmin) return false;
  return true;
}

/** Minimale HTML-escaping voor de door de beheerder aangeleverde tekst. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Bouwt een zelfstandige, thema-bewuste 503-onderhoudspagina (geen scripts, alleen inline CSS zodat
 * de pagina zonder de app-shell/CSP-nonce werkt). UI-taal Nederlands, conform de designfilosofie:
 * rustig, compact, één duidelijke boodschap.
 */
export function buildMaintenancePage({ message }: { message: string }): string {
  const safe = escapeHtml(message);
  return `<!doctype html>
<html lang="nl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>Onderhoud — we zijn zo terug</title>
    <style>
      :root { color-scheme: light dark; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
        font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        background: #f8fafc;
        color: #0f172a;
      }
      main {
        max-width: 30rem;
        width: 100%;
        text-align: center;
      }
      .badge {
        display: inline-block;
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #475569;
        border: 1px solid #cbd5e1;
        border-radius: 999px;
        padding: 0.25rem 0.75rem;
        margin-bottom: 1.25rem;
      }
      h1 { font-size: 1.5rem; line-height: 1.25; margin: 0 0 0.75rem; font-weight: 650; }
      p { font-size: 1rem; line-height: 1.6; margin: 0; color: #475569; }
      @media (prefers-color-scheme: dark) {
        body { background: #0b1120; color: #e2e8f0; }
        .badge { color: #94a3b8; border-color: #334155; }
        p { color: #94a3b8; }
      }
    </style>
  </head>
  <body>
    <main>
      <span class="badge">Onderhoud</span>
      <h1>We zijn zo terug</h1>
      <p>${safe}</p>
    </main>
  </body>
</html>`;
}
