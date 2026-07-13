import { describe, it, expect, beforeEach } from "vitest";
import {
  beginDraining,
  isDraining,
  drainingSinceAt,
  registerShutdownSignals,
  resetShutdownStateForTest,
} from "./shutdown";

describe("shutdown-state", () => {
  beforeEach(() => {
    resetShutdownStateForTest();
  });

  it("start niet-afsluitend", () => {
    expect(isDraining()).toBe(false);
    expect(drainingSinceAt()).toBeNull();
  });

  it("markeert draining met het meegegeven tijdstip", () => {
    const now = new Date("2026-07-13T10:00:00.000Z");
    beginDraining(now);
    expect(isDraining()).toBe(true);
    expect(drainingSinceAt()).toEqual(now);
  });

  it("is idempotent: een tweede signaal reset de drain-klok niet", () => {
    const first = new Date("2026-07-13T10:00:00.000Z");
    const second = new Date("2026-07-13T10:00:05.000Z");
    beginDraining(first);
    beginDraining(second);
    expect(drainingSinceAt()).toEqual(first);
  });
});

describe("registerShutdownSignals", () => {
  beforeEach(() => {
    resetShutdownStateForTest();
  });

  it("registreert SIGTERM en SIGINT en zet draining bij een signaal", () => {
    const handlers = new Map<string, () => void>();
    const registered = registerShutdownSignals((signal, handler) => {
      handlers.set(signal, handler);
    });

    expect(registered).toBe(true);
    expect(handlers.has("SIGTERM")).toBe(true);
    expect(handlers.has("SIGINT")).toBe(true);

    expect(isDraining()).toBe(false);
    handlers.get("SIGTERM")!();
    expect(isDraining()).toBe(true);
  });

  it("registreert maar één keer (idempotent, geen dubbele handlers)", () => {
    let count = 0;
    const first = registerShutdownSignals(() => {
      count += 1;
    });
    const second = registerShutdownSignals(() => {
      count += 1;
    });

    expect(first).toBe(true);
    expect(second).toBe(false);
    // Alleen de eerste registratie plaatste handlers (2 signalen).
    expect(count).toBe(2);
  });

  it("werkt ook via SIGINT", () => {
    const handlers = new Map<string, () => void>();
    registerShutdownSignals((signal, handler) => {
      handlers.set(signal, handler);
    });
    handlers.get("SIGINT")!();
    expect(isDraining()).toBe(true);
  });
});
