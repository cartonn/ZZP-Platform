// Pure helper voor het achtereenvolgens uitvoeren van geplande taken.
// Lekt nooit ruwe foutdetails terug: bij een fout krijgt de aanroeper een statische
// boodschap, terwijl het echte error-object via de optionele logError-callback
// server-side gelogd kan worden. Bewust puur gehouden: geen import van taakmodules,
// geen NextResponse, geen console.* hierin.

export type ScheduledTask = {
  name: string;
  fn: () => Promise<unknown>;
};

export type RunScheduledTasksResult = {
  ok: boolean;
  results: Record<string, unknown>;
  errors: Record<string, string>;
};

export type RunScheduledTasksOptions = {
  // Harde deadline per taak in ms. `undefined`/`0` = geen deadline (onbeperkt, oud gedrag).
  // Wordt niet zelf geklemd; de aanroeper klemt via resolveTaskTimeoutMs.
  timeoutMs?: number;
};

// Statische foutboodschap die naar de client mag (geen schema-/Prisma-detail).
export const SCHEDULED_TASK_ERROR_MESSAGE = "Taak mislukt.";

/**
 * Fout bij een verlopen per-taak-deadline. Apart type zodat een timeout te onderscheiden is van een
 * gewone taakfout in de log/reporter (server-side), terwijl de client altijd de statische boodschap
 * krijgt.
 */
export class TaskTimeoutError extends Error {
  constructor(
    public readonly taskName: string,
    public readonly timeoutMs: number,
  ) {
    super(`Taak "${taskName}": time-out na ${timeoutMs} ms.`);
    this.name = "TaskTimeoutError";
  }
}

// Veilige grenzen voor de per-taak-deadline. Ondergrens ruim boven de looptijd van een gezonde
// DB-taak; bovengrens zodat één taak nooit de hele dagelijkse run kan monopoliseren.
export const MIN_TASK_TIMEOUT_MS = 1_000;
export const MAX_TASK_TIMEOUT_MS = 600_000; // 10 min
// Standaard AAN met een royale plafond: de cron-taken zijn normaal DB-operaties van (sub)seconden;
// 2 minuten is ruim, maar begrenst een hangende taak zodat de rest van de pijplijn + de heartbeat
// doorlopen. Consistent met de andere timeout-defaults in de codebase (fetch-timeout/shutdown).
export const DEFAULT_TASK_TIMEOUT_MS = 120_000; // 2 min

/**
 * Leest de per-taak-timeout uit een env-variabele en klemt hem in het veilige bereik. Een expliciete
 * `0` (of `off`/`none`) schakelt de deadline **bewust uit** (onbeperkt, oud gedrag). Ongeldige of
 * ontbrekende waarden vallen terug op `fallback` (die zelf ook geklemd wordt). Retourneert `0` als de
 * deadline uit staat.
 */
export function resolveTaskTimeoutMs(
  raw: string | undefined,
  fallback: number = DEFAULT_TASK_TIMEOUT_MS,
): number {
  const clamp = (n: number) => Math.min(MAX_TASK_TIMEOUT_MS, Math.max(MIN_TASK_TIMEOUT_MS, n));
  if (raw !== undefined) {
    const trimmed = raw.trim().toLowerCase();
    if (trimmed === "0" || trimmed === "off" || trimmed === "none" || trimmed === "false") {
      return 0; // bewust uitgeschakeld
    }
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) return clamp(Math.round(parsed));
  }
  const parsedFallback =
    Number.isFinite(fallback) && fallback > 0 ? fallback : DEFAULT_TASK_TIMEOUT_MS;
  return clamp(Math.round(parsedFallback));
}

/**
 * Wikkelt een taak met een harde deadline via `Promise.race`. Overschrijdt de taak de deadline, dan
 * verwerpt de race met een `TaskTimeoutError`.
 *
 * NB (bewust): JavaScript kent geen echte cancellation — een getimede-out taak blijft in de
 * achtergrond doorlopen tot hij zelf afrondt of het proces recyclet. Dat is acceptabel: het doel is
 * dat de *pijplijn doorloopt* en de *heartbeat registreert*, niet dat de onderliggende operatie
 * daadwerkelijk gestopt wordt. De timer wordt altijd opgeruimd zodra de race beslecht is.
 */
export async function withTaskTimeout<T>(
  name: string,
  timeoutMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  if (!(timeoutMs > 0)) {
    return fn();
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TaskTimeoutError(name, timeoutMs)), timeoutMs);
  });
  try {
    return await Promise.race([fn(), timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

export async function runScheduledTasks(
  tasks: ScheduledTask[],
  logError?: (name: string, error: unknown) => void,
  options: RunScheduledTasksOptions = {},
): Promise<RunScheduledTasksResult> {
  const results: Record<string, unknown> = {};
  const errors: Record<string, string> = {};
  const timeoutMs = options.timeoutMs ?? 0;

  for (const { name, fn } of tasks) {
    try {
      results[name] = await withTaskTimeout(name, timeoutMs, fn);
    } catch (e) {
      // Statische boodschap naar buiten; het echte detail (incl. een TaskTimeoutError) alleen
      // server-side via logError. Een timeout telt als een taakfout: `ok` wordt false, de overige
      // taken draaien door en de heartbeat registreert ok=false zodat de dead-man's-switch afgaat.
      errors[name] = SCHEDULED_TASK_ERROR_MESSAGE;
      logError?.(name, e);
    }
  }

  return {
    ok: Object.keys(errors).length === 0,
    results,
    errors,
  };
}
