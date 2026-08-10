import { describe, expect, it } from "vitest";
import {
  MAX_FAILED_TASK_NAMES,
  MAX_FAILED_TASK_NAME_LENGTH,
  normalizeFailedTasks,
  parseFailedTasks,
  serializeFailedTasks,
} from "./cron-failed-tasks";

describe("normalizeFailedTasks", () => {
  it("trimt, dedupliceert en sorteert deterministisch", () => {
    expect(normalizeFailedTasks(["  expiry ", "expiry", "audit-retention"])).toEqual([
      "audit-retention",
      "expiry",
    ]);
  });

  it("dropt lege en rommel-namen", () => {
    expect(normalizeFailedTasks(["", "   ", "!!!", "expiry"])).toEqual(["expiry"]);
  });

  it("saneert onveilige tekens (log-/UI-injectie) weg", () => {
    // Alleen [a-zA-Z0-9_-] blijft staan; de rest wordt gestript.
    expect(normalizeFailedTasks(["expiry\n; rm -rf", "a b c"])).toEqual(["abc", "expiryrm-rf"]);
  });

  it("kapt een gek lange naam af op de maxlengte", () => {
    const long = "x".repeat(MAX_FAILED_TASK_NAME_LENGTH + 50);
    const [only] = normalizeFailedTasks([long]);
    expect(only).toHaveLength(MAX_FAILED_TASK_NAME_LENGTH);
  });

  it("begrenst het aantal namen", () => {
    const many = Array.from({ length: MAX_FAILED_TASK_NAMES + 20 }, (_, i) => `task-${i}`);
    expect(normalizeFailedTasks(many)).toHaveLength(MAX_FAILED_TASK_NAMES);
  });
});

describe("serializeFailedTasks / parseFailedTasks", () => {
  it("round-trip: namen → string → namen", () => {
    const names = ["expiry", "message-retention", "dba-monitor"];
    const serialized = serializeFailedTasks(names);
    expect(serialized).toBe("dba-monitor,expiry,message-retention"); // gesorteerd
    expect(parseFailedTasks(serialized)).toEqual(["dba-monitor", "expiry", "message-retention"]);
  });

  it("een lege lijst serialiseert naar null (niet naar een lege string)", () => {
    expect(serializeFailedTasks([])).toBeNull();
    expect(serializeFailedTasks(["", "  "])).toBeNull();
  });

  it("parseFailedTasks is robuust tegen null/undefined/lege string", () => {
    expect(parseFailedTasks(null)).toEqual([]);
    expect(parseFailedTasks(undefined)).toEqual([]);
    expect(parseFailedTasks("")).toEqual([]);
  });

  it("parseFailedTasks normaliseert legacy-rommel (dubbele komma's, spaties)", () => {
    expect(parseFailedTasks("expiry,, message-retention ,expiry")).toEqual([
      "expiry",
      "message-retention",
    ]);
  });
});
