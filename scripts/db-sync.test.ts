import { describe, it, expect, vi } from "vitest";
import {
  classifySchemaSyncFailure,
  isDataLossFailure,
  resolveDbSyncRetry,
  backoffDelayMs,
  syncSchema,
  syncTransitionSchema,
  TRANSITION_ACCEPT_DATA_LOSS_COMMAND,
  SCHEMA_SYNC_COMMAND,
} from "./db-sync.mjs";

describe("classifySchemaSyncFailure", () => {
  it("herkent Prisma-connectie-codes als transiënt", () => {
    for (const code of ["P1001", "P1002", "P1008", "P1017"]) {
      expect(classifySchemaSyncFailure(`Error: ${code} Can't reach database server`)).toBe(
        "transient",
      );
    }
  });

  it("herkent rauwe socket-/DNS-fouten als transiënt", () => {
    for (const sig of ["ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "EAI_AGAIN"]) {
      expect(classifySchemaSyncFailure(`connect ${sig} 10.0.0.1:5432`)).toBe("transient");
    }
  });

  it("markeert een destructieve-wijziging-weigering als fataal (nooit retryen)", () => {
    const output =
      "⚠️ We found changes that cannot be executed:\n  - Changed column may result in data loss\nUse the --accept-data-loss flag to ignore.";
    expect(classifySchemaSyncFailure(output)).toBe("fatal");
  });

  it("laat een fataal signaal winnen van een transiënt-ogend woord in dezelfde uitvoer", () => {
    // 'timed out' is transiënt, maar 'data loss' is fataal → mag nooit als transiënt tellen.
    const output = "operation timed out ... changes may result in data loss";
    expect(classifySchemaSyncFailure(output)).toBe("fatal");
  });

  it("behandelt authenticatie/ontbrekende-database als fataal", () => {
    expect(classifySchemaSyncFailure("P1000 Authentication failed against database server")).toBe(
      "fatal",
    );
    expect(classifySchemaSyncFailure("P1003 Database `zzp` does not exist")).toBe("fatal");
  });

  it("behandelt een onbekende fout fail-fast als fataal", () => {
    expect(classifySchemaSyncFailure("iets onverwachts ging mis")).toBe("fatal");
    expect(classifySchemaSyncFailure("")).toBe("fatal");
  });
});

describe("isDataLossFailure", () => {
  it("herkent Prisma's dataverlies-weigering", () => {
    expect(
      isDataLossFailure(
        "⚠️ There might be data loss when applying the changes:\n\n  • A unique constraint covering the columns [kvkNumber] on the table Tenant will be added. If there are existing duplicate values, this will fail.\n\nUse the --accept-data-loss flag to ignore the data loss warnings like this:",
      ),
    ).toBe(true);
  });

  it("herkent geen andere fatale fout als dataverlies", () => {
    expect(isDataLossFailure("P1000 Authentication failed against database server")).toBe(false);
    expect(isDataLossFailure("P1003 Database `zzp` does not exist")).toBe(false);
    expect(isDataLossFailure("")).toBe(false);
    expect(isDataLossFailure(undefined)).toBe(false);
  });
});

describe("resolveDbSyncRetry", () => {
  it("gebruikt veilige defaults zonder env", () => {
    expect(resolveDbSyncRetry({})).toEqual({
      maxRetries: 5,
      baseDelayMs: 1000,
      maxDelayMs: 16000,
    });
  });

  it("klemt buiten-bereik-waarden", () => {
    const r = resolveDbSyncRetry({
      DB_SYNC_MAX_RETRIES: "999",
      DB_SYNC_RETRY_BASE_MS: "1",
      DB_SYNC_RETRY_MAX_MS: "999999",
    });
    expect(r.maxRetries).toBe(10);
    expect(r.baseDelayMs).toBe(100);
    expect(r.maxDelayMs).toBe(120000);
  });

  it("laat maxRetries op 0 zetten (fail-fast, geen retry)", () => {
    expect(resolveDbSyncRetry({ DB_SYNC_MAX_RETRIES: "0" }).maxRetries).toBe(0);
  });

  it("houdt maxDelay minstens gelijk aan base", () => {
    const r = resolveDbSyncRetry({ DB_SYNC_RETRY_BASE_MS: "5000", DB_SYNC_RETRY_MAX_MS: "1000" });
    expect(r.maxDelayMs).toBe(5000);
  });
});

describe("backoffDelayMs", () => {
  it("groeit exponentieel en klemt op max", () => {
    expect(backoffDelayMs(1, 1000, 16000)).toBe(1000);
    expect(backoffDelayMs(2, 1000, 16000)).toBe(2000);
    expect(backoffDelayMs(3, 1000, 16000)).toBe(4000);
    expect(backoffDelayMs(5, 1000, 16000)).toBe(16000);
    expect(backoffDelayMs(6, 1000, 16000)).toBe(16000); // geklemd
  });
});

describe("syncSchema", () => {
  const silentLog = { log: () => {}, warn: () => {}, error: () => {} };

  it("keert stil terug bij succes op de eerste poging (geen sleep)", async () => {
    const runCapture = vi.fn().mockReturnValue({ code: 0, output: "" });
    const sleep = vi.fn();
    await expect(
      syncSchema({ runCapture, sleep, env: {}, log: silentLog }),
    ).resolves.toBeUndefined();
    expect(runCapture).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("retryt een transiënte fout en slaagt daarna", async () => {
    const runCapture = vi
      .fn()
      .mockReturnValueOnce({ code: 1, output: "P1001 Can't reach database server" })
      .mockReturnValueOnce({ code: 1, output: "ECONNREFUSED" })
      .mockReturnValueOnce({ code: 0, output: "" });
    const sleep = vi.fn().mockResolvedValue(undefined);
    await syncSchema({ runCapture, sleep, env: {}, log: silentLog });
    expect(runCapture).toHaveBeenCalledTimes(3);
    // twee backoff-vertragingen: 1000ms, 2000ms
    expect(sleep.mock.calls.map((c) => c[0])).toEqual([1000, 2000]);
  });

  it("faalt METEEN op een fatale fout, zonder retry", async () => {
    const runCapture = vi
      .fn()
      .mockReturnValue({ code: 1, output: "changes may result in data loss" });
    const sleep = vi.fn();
    await expect(syncSchema({ runCapture, sleep, env: {}, log: silentLog })).rejects.toThrow(
      /niet-transiënte fout/,
    );
    expect(runCapture).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("gooit na uitputting van de retries op een aanhoudende transiënte fout", async () => {
    const runCapture = vi.fn().mockReturnValue({ code: 1, output: "P1001 unreachable" });
    const sleep = vi.fn().mockResolvedValue(undefined);
    await expect(
      syncSchema({ runCapture, sleep, env: { DB_SYNC_MAX_RETRIES: "2" }, log: silentLog }),
    ).rejects.toThrow(/bleef transiënt falen na 2 retries/);
    // eerste poging + 2 retries = 3 aanroepen
    expect(runCapture).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it("retryt niet wanneer maxRetries op 0 staat (fail-fast, ook transiënt)", async () => {
    const runCapture = vi.fn().mockReturnValue({ code: 1, output: "P1002 timed out" });
    const sleep = vi.fn();
    await expect(
      syncSchema({ runCapture, sleep, env: { DB_SYNC_MAX_RETRIES: "0" }, log: silentLog }),
    ).rejects.toThrow(/na 0 retries/);
    expect(runCapture).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("hangt de rauwe Prisma-uitvoer aan de fout bij een fatale fout (voor syncTransitionSchema)", async () => {
    const output = "possible data loss: unique constraint on kvkNumber";
    const runCapture = vi.fn().mockReturnValue({ code: 1, output });
    const sleep = vi.fn();
    await expect(syncSchema({ runCapture, sleep, env: {}, log: silentLog })).rejects.toMatchObject({
      rawOutput: output,
    });
  });
});

describe("syncTransitionSchema", () => {
  const silentLog = { log: () => {}, warn: () => {}, error: () => {} };
  const dataLossOutput =
    "⚠️ There might be data loss when applying the changes:\n\n  • A unique constraint covering the columns [kvkNumber] on the table Tenant will be added. If there are existing duplicate values, this will fail.\n\nUse the --accept-data-loss flag to ignore the data loss warnings like this:";

  it("gedraagt zich als syncSchema bij succes op de eerste (veilige) poging", async () => {
    const runCapture = vi.fn().mockReturnValue({ code: 0, output: "" });
    const sleep = vi.fn();
    await expect(
      syncTransitionSchema({ runCapture, sleep, env: {}, log: silentLog }),
    ).resolves.toBeUndefined();
    expect(runCapture).toHaveBeenCalledTimes(1);
    expect(runCapture).toHaveBeenCalledWith(SCHEMA_SYNC_COMMAND);
  });

  it("gooit meteen door bij een dataverlies-weigering ZONDER de vlag (geen bypass)", async () => {
    const runCapture = vi.fn().mockReturnValue({ code: 1, output: dataLossOutput });
    const sleep = vi.fn();
    await expect(
      syncTransitionSchema({ runCapture, sleep, env: {}, log: silentLog }),
    ).rejects.toThrow(/niet-transiënte fout/);
    // Geen tweede poging (geen --accept-data-loss-commando aangeroepen).
    expect(runCapture).toHaveBeenCalledTimes(1);
  });

  it("gooit meteen door bij een ANDERE fatale fout, ook mét de vlag aan (geen generieke bypass)", async () => {
    const runCapture = vi
      .fn()
      .mockReturnValue({ code: 1, output: "P1000 Authentication failed against database server" });
    const sleep = vi.fn();
    await expect(
      syncTransitionSchema({
        runCapture,
        sleep,
        env: { DB_TRANSITION_ACCEPT_DATA_LOSS: "true" },
        log: silentLog,
      }),
    ).rejects.toThrow(/niet-transiënte fout/);
    expect(runCapture).toHaveBeenCalledTimes(1);
    expect(runCapture).toHaveBeenCalledWith(SCHEMA_SYNC_COMMAND);
  });

  it("logt de Prisma-waarschuwingen en herprobeert MET --accept-data-loss wanneer de vlag aan staat", async () => {
    const runCapture = vi
      .fn()
      .mockReturnValueOnce({ code: 1, output: dataLossOutput })
      .mockReturnValueOnce({ code: 0, output: "" });
    const sleep = vi.fn();
    const warn = vi.fn();
    await expect(
      syncTransitionSchema({
        runCapture,
        sleep,
        env: { DB_TRANSITION_ACCEPT_DATA_LOSS: "true" },
        log: { ...silentLog, warn },
      }),
    ).resolves.toBeUndefined();

    expect(runCapture).toHaveBeenCalledTimes(2);
    expect(runCapture).toHaveBeenNthCalledWith(1, SCHEMA_SYNC_COMMAND);
    expect(runCapture).toHaveBeenNthCalledWith(2, TRANSITION_ACCEPT_DATA_LOSS_COMMAND);
    // De waarschuwingen worden vóór de herpoging luid gelogd — inclusief de exacte Prisma-tekst.
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]![0]).toContain("kvkNumber");
    expect(warn.mock.calls[0]![0]).toContain("DB_TRANSITION_ACCEPT_DATA_LOSS=true");
  });

  it("laat de herpoging alsnog falen als --accept-data-loss zelf ook fataal faalt", async () => {
    const runCapture = vi
      .fn()
      .mockReturnValueOnce({ code: 1, output: dataLossOutput })
      .mockReturnValueOnce({ code: 1, output: "P1003 Database `zzp` does not exist" });
    const sleep = vi.fn();
    await expect(
      syncTransitionSchema({
        runCapture,
        sleep,
        env: { DB_TRANSITION_ACCEPT_DATA_LOSS: "true" },
        log: silentLog,
      }),
    ).rejects.toThrow(/niet-transiënte fout/);
    expect(runCapture).toHaveBeenCalledTimes(2);
  });

  it("gebruikt custom command/acceptDataLossCommand-parameters wanneer meegegeven", async () => {
    const runCapture = vi
      .fn()
      .mockReturnValueOnce({ code: 1, output: dataLossOutput })
      .mockReturnValueOnce({ code: 0, output: "" });
    const sleep = vi.fn();
    await syncTransitionSchema({
      runCapture,
      sleep,
      env: { DB_TRANSITION_ACCEPT_DATA_LOSS: "true" },
      log: silentLog,
      command: "npx prisma db push --skip-generate --custom",
      acceptDataLossCommand: "npx prisma db push --skip-generate --custom --accept-data-loss",
    });
    expect(runCapture).toHaveBeenNthCalledWith(1, "npx prisma db push --skip-generate --custom");
    expect(runCapture).toHaveBeenNthCalledWith(
      2,
      "npx prisma db push --skip-generate --custom --accept-data-loss",
    );
  });
});
