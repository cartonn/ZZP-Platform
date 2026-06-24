import { describe, expect, it, vi } from "vitest";
import {
  runScheduledTasks,
  SCHEDULED_TASK_ERROR_MESSAGE,
  type ScheduledTask,
} from "./scheduled-tasks";

describe("runScheduledTasks", () => {
  it("levert ok=true met gevulde results en lege errors wanneer alle taken slagen", async () => {
    const tasks: ScheduledTask[] = [
      { name: "a", fn: async () => ({ count: 1 }) },
      { name: "b", fn: async () => "klaar" },
    ];

    const out = await runScheduledTasks(tasks);

    expect(out.ok).toBe(true);
    expect(out.results).toEqual({ a: { count: 1 }, b: "klaar" });
    expect(out.errors).toEqual({});
  });

  it("maskeert een falende taak met een statische boodschap en lekt geen ruw foutdetail", async () => {
    const rawMessage = "Prisma schema error: column users.secret does not exist";
    const tasks: ScheduledTask[] = [
      {
        name: "kapot",
        fn: async () => {
          throw new Error(rawMessage);
        },
      },
    ];

    const out = await runScheduledTasks(tasks);

    expect(out.ok).toBe(false);
    expect(out.errors.kapot).toBe(SCHEDULED_TASK_ERROR_MESSAGE);
    expect(out.errors.kapot).not.toContain(rawMessage);
    expect(JSON.stringify(out.errors)).not.toContain("Prisma");
    expect(out.results).toEqual({});
  });

  it("roept logError aan met (name, het echte error-object) zodat het detail server-side beschikbaar blijft", async () => {
    const realError = new Error("interne details die alleen in de log mogen");
    const tasks: ScheduledTask[] = [
      {
        name: "kapot",
        fn: async () => {
          throw realError;
        },
      },
    ];
    const logError = vi.fn();

    await runScheduledTasks(tasks, logError);

    expect(logError).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledWith("kapot", realError);
  });

  it("draait de overige taken gewoon door ondanks één fout", async () => {
    const after = vi.fn(async () => "na-de-fout");
    const tasks: ScheduledTask[] = [
      { name: "eerst", fn: async () => "ok" },
      {
        name: "kapot",
        fn: async () => {
          throw new Error("boem");
        },
      },
      { name: "laatst", fn: after },
    ];

    const out = await runScheduledTasks(tasks);

    expect(after).toHaveBeenCalledTimes(1);
    expect(out.ok).toBe(false);
    expect(out.results).toEqual({ eerst: "ok", laatst: "na-de-fout" });
    expect(out.errors).toEqual({ kapot: SCHEDULED_TASK_ERROR_MESSAGE });
  });
});
