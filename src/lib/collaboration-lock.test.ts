import { describe, expect, it } from "vitest";

import {
  collaborationActionsLocked,
  collaborationLockReason,
  terminalLockNotice,
} from "@/lib/collaboration-lock";

describe("collaborationLockReason", () => {
  it("staat acties toe op een lopende, niet-betwiste samenwerking", () => {
    expect(collaborationLockReason({ status: "ACTIVE", disputedAt: null })).toBeNull();
    expect(collaborationLockReason({ status: "PROPOSED", disputedAt: null })).toBeNull();
    expect(collaborationActionsLocked({ status: "ACTIVE", disputedAt: null })).toBe(false);
  });

  it("bevriest bij een open dispuut, ongeacht status", () => {
    const at = new Date("2026-07-19T00:00:00Z");
    expect(collaborationLockReason({ status: "ACTIVE", disputedAt: at })).toBe("dispute");
    expect(collaborationActionsLocked({ status: "ACTIVE", disputedAt: at })).toBe(true);
  });

  it("bevriest bij een geannuleerde samenwerking", () => {
    expect(collaborationLockReason({ status: "CANCELLED", disputedAt: null })).toBe("cancelled");
    expect(collaborationActionsLocked({ status: "CANCELLED", disputedAt: null })).toBe(true);
  });

  it("bevriest bij een afgeronde samenwerking", () => {
    expect(collaborationLockReason({ status: "COMPLETED", disputedAt: null })).toBe("completed");
    expect(collaborationActionsLocked({ status: "COMPLETED", disputedAt: null })).toBe(true);
  });

  it("geeft dispuut voorrang op de terminale status", () => {
    const at = new Date("2026-07-19T00:00:00Z");
    expect(collaborationLockReason({ status: "CANCELLED", disputedAt: at })).toBe("dispute");
    expect(collaborationLockReason({ status: "COMPLETED", disputedAt: at })).toBe("dispute");
  });
});

describe("terminalLockNotice", () => {
  it("geeft alleen een melding bij een terminale (niet-dispuut) reden", () => {
    expect(terminalLockNotice("cancelled")).toContain("geannuleerd");
    expect(terminalLockNotice("completed")).toContain("afgerond");
    expect(terminalLockNotice("dispute")).toBeNull();
    expect(terminalLockNotice(null)).toBeNull();
  });
});
