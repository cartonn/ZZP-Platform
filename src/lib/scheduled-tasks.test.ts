import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_TASK_TIMEOUT_MS,
  MAX_TASK_TIMEOUT_MS,
  MIN_TASK_TIMEOUT_MS,
  resolveTaskTimeoutMs,
  runScheduledTasks,
  SCHEDULED_TASK_ERROR_MESSAGE,
  TaskTimeoutError,
  withTaskTimeout,
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

  describe("per-taak-timeout", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("timet een hangende taak uit en draait de overige taken gewoon door", async () => {
      const logError = vi.fn();
      const tasks: ScheduledTask[] = [
        // Deze taak lost nooit vanzelf op → moet door de deadline worden afgekapt.
        { name: "hang", fn: () => new Promise<never>(() => {}) },
        { name: "daarna", fn: async () => "ok" },
      ];

      const promise = runScheduledTasks(tasks, logError, { timeoutMs: 1_000 });
      // Duw de klok voorbij de deadline zodat de timeout van de eerste taak vuurt.
      await vi.advanceTimersByTimeAsync(1_000);
      const out = await promise;

      expect(out.ok).toBe(false);
      // De statische boodschap lekt geen detail; de overige taak draaide gewoon door.
      expect(out.errors).toEqual({ hang: SCHEDULED_TASK_ERROR_MESSAGE });
      expect(out.results).toEqual({ daarna: "ok" });
      // logError krijgt het echte, onderscheidbare timeout-type (server-side).
      expect(logError).toHaveBeenCalledTimes(1);
      const call = logError.mock.calls[0]!;
      const name = call[0];
      const err = call[1];
      expect(name).toBe("hang");
      expect(err).toBeInstanceOf(TaskTimeoutError);
      expect((err as TaskTimeoutError).taskName).toBe("hang");
      expect((err as TaskTimeoutError).timeoutMs).toBe(1_000);
    });

    it("laat een taak die binnen de deadline afrondt ongemoeid (geen valse timeout)", async () => {
      const tasks: ScheduledTask[] = [
        {
          name: "snel",
          fn: () =>
            new Promise((resolve) => {
              setTimeout(() => resolve("klaar"), 10);
            }),
        },
      ];

      const promise = runScheduledTasks(tasks, undefined, { timeoutMs: 5_000 });
      await vi.advanceTimersByTimeAsync(10);
      const out = await promise;

      expect(out.ok).toBe(true);
      expect(out.results).toEqual({ snel: "klaar" });
      expect(out.errors).toEqual({});
    });

    it("timeoutMs=0 schakelt de deadline uit (oud gedrag, geen afkap)", async () => {
      const tasks: ScheduledTask[] = [{ name: "a", fn: async () => 1 }];
      const out = await runScheduledTasks(tasks, undefined, { timeoutMs: 0 });
      expect(out.ok).toBe(true);
      expect(out.results).toEqual({ a: 1 });
    });
  });
});

describe("withTaskTimeout", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("draait zonder deadline (0) de functie ongewijzigd door", async () => {
    await expect(withTaskTimeout("x", 0, async () => 42)).resolves.toBe(42);
  });

  it("verwerpt met TaskTimeoutError bij overschrijding", async () => {
    vi.useFakeTimers();
    const promise = withTaskTimeout("traag", 500, () => new Promise<never>(() => {}));
    const assertion = expect(promise).rejects.toBeInstanceOf(TaskTimeoutError);
    await vi.advanceTimersByTimeAsync(500);
    await assertion;
  });
});

describe("resolveTaskTimeoutMs", () => {
  it("valt zonder waarde terug op de default", () => {
    expect(resolveTaskTimeoutMs(undefined)).toBe(DEFAULT_TASK_TIMEOUT_MS);
  });

  it("klemt te lage/te hoge waarden binnen het veilige bereik", () => {
    expect(resolveTaskTimeoutMs("1")).toBe(MIN_TASK_TIMEOUT_MS);
    expect(resolveTaskTimeoutMs("99999999")).toBe(MAX_TASK_TIMEOUT_MS);
  });

  it("neemt een geldige waarde over", () => {
    expect(resolveTaskTimeoutMs("30000")).toBe(30_000);
  });

  it("schakelt bewust uit bij 0/off/none/false", () => {
    expect(resolveTaskTimeoutMs("0")).toBe(0);
    expect(resolveTaskTimeoutMs("off")).toBe(0);
    expect(resolveTaskTimeoutMs("none")).toBe(0);
    expect(resolveTaskTimeoutMs("false")).toBe(0);
  });

  it("valt bij onzin terug op de (geklemde) fallback", () => {
    expect(resolveTaskTimeoutMs("abc")).toBe(DEFAULT_TASK_TIMEOUT_MS);
    expect(resolveTaskTimeoutMs("-5")).toBe(DEFAULT_TASK_TIMEOUT_MS);
  });
});
