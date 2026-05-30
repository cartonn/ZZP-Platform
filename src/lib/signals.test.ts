import { describe, expect, it } from "vitest";
import { buildBadges, countUnreadConversations } from "./signals";

describe("buildBadges", () => {
  it("laat items met telling 0 of ontbrekend weg", () => {
    expect(buildBadges({})).toEqual({});
    expect(buildBadges({ newApplications: 0, draftJobs: 0 })).toEqual({});
  });

  it("mapt freelancer-alerts naar /certificaten met attention-toon", () => {
    expect(buildBadges({ credentialAlerts: 2 })).toEqual({
      "/certificaten": { count: 2, tone: "attention" },
    });
  });

  it("geeft client nieuwe reacties (attention) en concepten (info) op aparte hrefs", () => {
    expect(buildBadges({ newApplications: 3, draftJobs: 1 })).toEqual({
      "/kandidaten": { count: 3, tone: "attention" },
      "/opdrachten": { count: 1, tone: "info" },
    });
  });

  it("mapt admin-wachtrij naar /admin/verificaties met attention-toon", () => {
    expect(buildBadges({ pendingVerifications: 5 })).toEqual({
      "/admin/verificaties": { count: 5, tone: "attention" },
    });
  });

  it("mapt ongelezen berichten naar /berichten met info-toon", () => {
    expect(buildBadges({ unreadMessages: 2 })).toEqual({
      "/berichten": { count: 2, tone: "info" },
    });
  });

  it("mapt verlopen facturen naar /facturen met attention-toon", () => {
    expect(buildBadges({ overdueInvoices: 1 })).toEqual({
      "/facturen": { count: 1, tone: "attention" },
    });
  });

  it("mapt cascade-werkproces-acties naar /samenwerkingen met attention-toon", () => {
    expect(buildBadges({ cascadeWork: 3 })).toEqual({
      "/samenwerkingen": { count: 3, tone: "attention" },
    });
  });

  it("mapt open disputen naar /admin/disputen met attention-toon", () => {
    expect(buildBadges({ openDisputes: 2 })).toEqual({
      "/admin/disputen": { count: 2, tone: "attention" },
    });
  });

  it("combineert cascade-acties en verlopen facturen op aparte hrefs", () => {
    const badges = buildBadges({ cascadeWork: 2, overdueInvoices: 1 });
    expect(badges["/samenwerkingen"]).toEqual({ count: 2, tone: "attention" });
    expect(badges["/facturen"]).toEqual({ count: 1, tone: "attention" });
  });
});

describe("countUnreadConversations", () => {
  const t = (iso: string) => new Date(iso);

  it("telt een gesprek als er een vreemd bericht ná lastReadAt is", () => {
    const participants = [{ conversationId: "a", lastReadAt: t("2026-05-01T10:00:00Z") }];
    const latest = new Map([["a", t("2026-05-01T12:00:00Z")]]);
    expect(countUnreadConversations(participants, latest)).toBe(1);
  });

  it("telt niet als het laatste vreemde bericht al gelezen is", () => {
    const participants = [{ conversationId: "a", lastReadAt: t("2026-05-01T12:00:00Z") }];
    const latest = new Map([["a", t("2026-05-01T10:00:00Z")]]);
    expect(countUnreadConversations(participants, latest)).toBe(0);
  });

  it("telt een nooit-gelezen gesprek met een vreemd bericht", () => {
    const participants = [{ conversationId: "a", lastReadAt: null }];
    const latest = new Map([["a", t("2026-05-01T10:00:00Z")]]);
    expect(countUnreadConversations(participants, latest)).toBe(1);
  });

  it("negeert gesprekken zonder bericht van de andere partij", () => {
    const participants = [
      { conversationId: "a", lastReadAt: null },
      { conversationId: "b", lastReadAt: null },
    ];
    const latest = new Map<string, Date | null>([["a", null]]);
    expect(countUnreadConversations(participants, latest)).toBe(0);
  });
});
