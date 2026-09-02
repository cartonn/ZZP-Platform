// Pure kern van de liveness-probe (/api/health), los van Next.js/Prisma zodat hij deterministisch
// te testen is. De route levert alleen DB-ping + klok + commit aan; deze helper bepaalt de vorm
// van het antwoord en de HTTP-status. Geen PII, geen secrets — alleen een korte commit-hash.

export interface HealthPayload {
  status: "ok" | "degraded";
  db: boolean;
  commit: string;
  /** Build-tijdstip (ISO), of "onbekend" zonder Docker-build (lokaal/dev). Zie scripts/start.mjs. */
  builtAt: string;
  time: string;
}

/** Kort de commit-SHA in tot 7 tekens (val terug op "dev" bij een lege waarde). */
export function shortCommit(sha: string | undefined | null): string {
  const trimmed = (sha ?? "").trim();
  return trimmed ? trimmed.slice(0, 7) : "dev";
}

/**
 * Normaliseert de build-tijd: alleen een geldige ISO-tijdstempel wordt overgenomen, anders
 * "onbekend" — nooit een rauwe/onvertrouwde string in het health-antwoord (defense-in-depth, ook al
 * komt de waarde uit het eigen Docker-image, niet van buitenaf).
 */
export function normalizeBuiltAt(raw: string | undefined | null): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "onbekend";
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? "onbekend" : parsed.toISOString();
}

/** Bouwt het health-antwoord. `db` = kon de DB-ping slagen; `now` = huidige tijd (injecteerbaar). */
export function buildHealthPayload(input: {
  db: boolean;
  commit: string | undefined | null;
  builtAt?: string | undefined | null;
  now: Date;
}): HealthPayload {
  return {
    status: input.db ? "ok" : "degraded",
    db: input.db,
    commit: shortCommit(input.commit),
    builtAt: normalizeBuiltAt(input.builtAt),
    time: input.now.toISOString(),
  };
}

/** HTTP-status voor een health-antwoord: 200 wanneer gezond, 503 wanneer de DB niet bereikbaar is. */
export function healthHttpStatus(payload: HealthPayload): number {
  return payload.db ? 200 : 503;
}
