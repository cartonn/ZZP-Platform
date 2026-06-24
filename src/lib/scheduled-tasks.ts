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

// Statische foutboodschap die naar de client mag (geen schema-/Prisma-detail).
export const SCHEDULED_TASK_ERROR_MESSAGE = "Taak mislukt.";

export async function runScheduledTasks(
  tasks: ScheduledTask[],
  logError?: (name: string, error: unknown) => void,
): Promise<RunScheduledTasksResult> {
  const results: Record<string, unknown> = {};
  const errors: Record<string, string> = {};

  for (const { name, fn } of tasks) {
    try {
      results[name] = await fn();
    } catch (e) {
      // Statische boodschap naar buiten; het echte detail alleen server-side via logError.
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
