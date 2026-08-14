import { describe, expect, it } from "vitest";
import { isParticipant, lastReadOutgoingMessageId, unreadCount } from "@/lib/messaging";

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

describe("lastReadOutgoingMessageId", () => {
  const t = (s: string) => new Date(s);
  const thread = [
    { id: "m1", senderId: "me", createdAt: t("2026-01-01T10:00:00Z") },
    { id: "m2", senderId: "other", createdAt: t("2026-01-01T10:30:00Z") },
    { id: "m3", senderId: "me", createdAt: t("2026-01-01T11:00:00Z") },
    { id: "m4", senderId: "me", createdAt: t("2026-01-01T12:00:00Z") },
  ];

  it("markeert het nieuwste eigen bericht dat de ander gelezen heeft", () => {
    // Ander las tot 11:30 → m3 gelezen, m4 nog niet.
    expect(lastReadOutgoingMessageId(thread, t("2026-01-01T11:30:00Z"), "me")).toBe("m3");
  });

  it("markeert het laatste bericht als de ander alles gelezen heeft", () => {
    expect(lastReadOutgoingMessageId(thread, t("2026-01-01T13:00:00Z"), "me")).toBe("m4");
  });

  it("geeft null als de ander nog niets gelezen heeft", () => {
    expect(lastReadOutgoingMessageId(thread, null, "me")).toBe(null);
    expect(lastReadOutgoingMessageId(thread, t("2026-01-01T09:00:00Z"), "me")).toBe(null);
  });

  it("negeert berichten van de ander (alleen eigen uitgaande tellen)", () => {
    // Vanuit 'other' bezien is m2 het enige uitgaande; 'me' las tot 10:45 → m2.
    expect(lastReadOutgoingMessageId(thread, t("2026-01-01T10:45:00Z"), "other")).toBe("m2");
  });

  it("neemt de leestijd inclusief de exacte tijdstempel mee", () => {
    // lastReadAt exact gelijk aan m3.createdAt → m3 telt als gelezen.
    expect(lastReadOutgoingMessageId(thread, t("2026-01-01T11:00:00Z"), "me")).toBe("m3");
  });

  it("is volgordonafhankelijk (neemt het nieuwste gelezen bericht, niet het laatste in de array)", () => {
    const reversed = [...thread].reverse(); // m4 staat nu vooraan i.p.v. achteraan
    expect(lastReadOutgoingMessageId(reversed, t("2026-01-01T13:00:00Z"), "me")).toBe("m4");
  });
});
