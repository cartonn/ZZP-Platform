import { describe, expect, it } from "vitest";
import { isParticipant, unreadCount } from "@/lib/messaging";

describe("isParticipant", () => {
  it("herkent deelnemers en weigert anderen", () => {
    expect(isParticipant(["a", "b"], "a")).toBe(true);
    expect(isParticipant(["a", "b"], "c")).toBe(false);
    expect(isParticipant([], "a")).toBe(false);
  });
});

describe("unreadCount", () => {
  const t = (s: string) => new Date(s);
  const messages = [
    { senderId: "other", createdAt: t("2026-01-01T10:00:00Z") },
    { senderId: "me", createdAt: t("2026-01-01T11:00:00Z") },
    { senderId: "other", createdAt: t("2026-01-01T12:00:00Z") },
  ];

  it("telt alleen berichten van de ander ná lastReadAt", () => {
    expect(unreadCount(messages, t("2026-01-01T10:30:00Z"), "me")).toBe(1); // alleen die van 12:00
  });

  it("telt alles van de ander als nog niets gelezen is", () => {
    expect(unreadCount(messages, null, "me")).toBe(2);
  });

  it("telt nul als alles gelezen is", () => {
    expect(unreadCount(messages, t("2026-01-01T13:00:00Z"), "me")).toBe(0);
  });

  it("negeert eigen berichten", () => {
    expect(unreadCount(messages, null, "other")).toBe(1); // alleen die van 'me'
  });
});
