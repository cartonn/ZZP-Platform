import { describe, expect, it } from "vitest";
import { USER_ROLES, type UserRole } from "@/lib/enums";
import { QUICK_REPLY_MAX, quickReplies } from "@/lib/quick-replies";

describe("quickReplies", () => {
  it("levert nooit meer dan het maximum aantal chips", () => {
    for (const role of USER_ROLES) {
      for (const isOpener of [true, false]) {
        for (const hasJob of [true, false]) {
          const replies = quickReplies({ role, hasJob, isOpener });
          expect(replies.length).toBeLessThanOrEqual(QUICK_REPLY_MAX);
        }
      }
    }
  });

  it("levert voor elke rol/context minstens één suggestie", () => {
    for (const role of USER_ROLES) {
      for (const isOpener of [true, false]) {
        expect(quickReplies({ role, hasJob: false, isOpener }).length).toBeGreaterThan(0);
      }
    }
  });

  it("heeft binnen één set uniek id, label en tekst (geen duplicaten)", () => {
    for (const role of USER_ROLES) {
      for (const isOpener of [true, false]) {
        for (const hasJob of [true, false]) {
          const replies = quickReplies({ role, hasJob, isOpener });
          expect(new Set(replies.map((r) => r.id)).size).toBe(replies.length);
          expect(new Set(replies.map((r) => r.text)).size).toBe(replies.length);
        }
      }
    }
  });

  it("is deterministisch: dezelfde context → dezelfde volgorde", () => {
    const ctx = { role: "CLIENT" as UserRole, hasJob: true, isOpener: true };
    expect(quickReplies(ctx)).toEqual(quickReplies(ctx));
  });

  it("voegt bij een aan een opdracht gekoppelde opener een opdracht-refererende zin vooraan toe", () => {
    const withJob = quickReplies({ role: "FREELANCER", hasJob: true, isOpener: true });
    const withoutJob = quickReplies({ role: "FREELANCER", hasJob: false, isOpener: true });
    expect(withJob[0]?.id).toBe("fl-open-job");
    expect(withJob[0]?.text).toContain("deze opdracht");
    expect(withoutJob.some((r) => r.id === "fl-open-job")).toBe(false);
  });

  it("gebruikt de opdracht-opener niet bij een vervolgantwoord", () => {
    const followup = quickReplies({ role: "FREELANCER", hasJob: true, isOpener: false });
    expect(followup.some((r) => r.id === "fl-open-job")).toBe(false);
  });

  it("ADMIN heeft geen opdracht-opener (support is niet opdracht-gebonden)", () => {
    const opener = quickReplies({ role: "ADMIN", hasJob: true, isOpener: true });
    expect(opener.every((r) => !r.id.endsWith("-job"))).toBe(true);
  });

  it("kiest andere zinnen voor opener dan voor vervolg", () => {
    const opener = quickReplies({ role: "CLIENT", hasJob: false, isOpener: true });
    const followup = quickReplies({ role: "CLIENT", hasJob: false, isOpener: false });
    const openerIds = new Set(opener.map((r) => r.id));
    expect(followup.every((r) => !openerIds.has(r.id))).toBe(true);
  });

  it("levert per rol een herkenbaar rol-prefix op de ids", () => {
    const prefix: Record<UserRole, string> = {
      FREELANCER: "fl-",
      CLIENT: "cl-",
      FRANCHISER: "fr-",
      ADMIN: "ad-",
    };
    for (const role of USER_ROLES) {
      for (const r of quickReplies({ role, hasJob: false, isOpener: true })) {
        expect(r.id.startsWith(prefix[role])).toBe(true);
      }
    }
  });
});
