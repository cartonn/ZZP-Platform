// Pure kern van de liveness-probe (/api/health), los van Next.js/Prisma zodat hij deterministisch
// te testen is. De route levert alleen DB-ping + klok + commit aan; deze helper bepaalt de vorm
// van het antwoord en de HTTP-status. Geen PII, geen secrets — alleen een korte commit-hash.

export interface HealthPayload {
  status: "ok" | "degraded";
  db: boolean;
  commit: string;
  time: string;
}

/** Kort de commit-SHA in tot 7 tekens (val terug op "dev" bij een lege waarde). */
export function shortCommit(sha: string | undefined | null): string {
  const trimmed = (sha ?? "").trim();
  return trimmed ? trimmed.slice(0, 7) : "dev";
}

/** Bouwt het health-antwoord. `db` = kon de DB-ping slagen; `now` = huidige tijd (injecteerbaar). */
export function buildHealthPayload(input: {
  db: boolean;
  commit: string | undefined | null;
  now: Date;
}): HealthPayload {
  return {
    status: input.db ? "ok" : "degraded",
    db: input.db,
    commit: shortCommit(input.commit),
    time: input.now.toISOString(),
  };
}

/** HTTP-status voor een health-antwoord: 200 wanneer gezond, 503 wanneer de DB niet bereikbaar is. */
export function healthHttpStatus(payload: HealthPayload): number {
  return payload.db ? 200 : 503;
}
