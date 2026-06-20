import { describe, expect, it } from "vitest";
import {
  conversationFilterParams,
  countConversations,
  filterConversations,
  parseConversationFilter,
  type FilterableConversation,
} from "@/lib/conversation-filter";
import type { ConversationTurn } from "@/lib/conversation-turn";

function conv(turn: ConversationTurn, otherName: string, jobTitle: string | null = null) {
  return { turn, otherName, jobTitle };
}

const sample: FilterableConversation[] = [
  conv("yours", "Sanne de Vries", "Verpleegkundige (detachering)"),
  conv("theirs", "Mark Jansen", "Wijkverpleging avonddienst"),
  conv("none", "Emma Bakker", null),
  conv("yours", "Lars Bakker", "Begeleider GGZ"),
];

describe("parseConversationFilter", () => {
  it("valt terug op all + lege zoekterm zonder params", () => {
    expect(parseConversationFilter({})).toEqual({ status: "all", query: "" });
  });

  it("leest een geldige status", () => {
    expect(parseConversationFilter({ status: "awaiting-you" }).status).toBe("awaiting-you");
    expect(parseConversationFilter({ status: "awaiting-them" }).status).toBe("awaiting-them");
  });

  it("valt terug op all bij een onbekende status", () => {
    expect(parseConversationFilter({ status: "onzin" }).status).toBe("all");
  });

  it("normaliseert de zoekterm (trim + lowercase)", () => {
    expect(parseConversationFilter({ q: "  SaNNe  " }).query).toBe("sanne");
  });

  it("neemt het eerste element bij een herhaalde param", () => {
    expect(parseConversationFilter({ status: ["awaiting-them", "all"] }).status).toBe(
      "awaiting-them",
    );
    expect(parseConversationFilter({ q: ["mark", "jan"] }).query).toBe("mark");
  });
});

describe("filterConversations", () => {
  it("geeft alles terug bij all zonder zoekterm", () => {
    const out = filterConversations(sample, { status: "all", query: "" });
    expect(out).toHaveLength(4);
  });

  it("filtert op aan-zet (yours)", () => {
    const out = filterConversations(sample, { status: "awaiting-you", query: "" });
    expect(out.map((c) => c.otherName)).toEqual(["Sanne de Vries", "Lars Bakker"]);
  });

  it("filtert op wacht-op-antwoord (theirs)", () => {
    const out = filterConversations(sample, { status: "awaiting-them", query: "" });
    expect(out.map((c) => c.otherName)).toEqual(["Mark Jansen"]);
  });

  it("zoekt op naam van de tegenpartij", () => {
    const out = filterConversations(sample, { status: "all", query: "bakker" });
    expect(out.map((c) => c.otherName)).toEqual(["Emma Bakker", "Lars Bakker"]);
  });

  it("zoekt op opdrachttitel", () => {
    const out = filterConversations(sample, { status: "all", query: "ggz" });
    expect(out.map((c) => c.otherName)).toEqual(["Lars Bakker"]);
  });

  it("combineert status en zoekterm", () => {
    const out = filterConversations(sample, { status: "awaiting-you", query: "bakker" });
    expect(out.map((c) => c.otherName)).toEqual(["Lars Bakker"]);
  });

  it("behoudt de invoervolgorde en muteert niet", () => {
    const copy = [...sample];
    const out = filterConversations(sample, { status: "all", query: "" });
    expect(out).not.toBe(sample);
    expect(sample).toEqual(copy);
    expect(out.map((c) => c.otherName)).toEqual(sample.map((c) => c.otherName));
  });

  it("verdraagt een gesprek zonder opdrachttitel bij het zoeken", () => {
    const out = filterConversations(sample, { status: "all", query: "emma" });
    expect(out.map((c) => c.otherName)).toEqual(["Emma Bakker"]);
  });
});

describe("countConversations", () => {
  it("telt per status over de hele lijst zonder zoekterm", () => {
    expect(countConversations(sample, "")).toEqual({ all: 4, awaitingYou: 2, awaitingThem: 1 });
  });

  it("telt binnen de zoekscope", () => {
    expect(countConversations(sample, "bakker")).toEqual({
      all: 2,
      awaitingYou: 1,
      awaitingThem: 0,
    });
  });

  it("geeft nul-tellingen bij geen treffer", () => {
    expect(countConversations(sample, "geen-match")).toEqual({
      all: 0,
      awaitingYou: 0,
      awaitingThem: 0,
    });
  });
});

describe("conversationFilterParams", () => {
  it("laat de default weg", () => {
    expect(conversationFilterParams({ status: "all", query: "" })).toBe("");
  });

  it("schrijft enkel de status", () => {
    expect(conversationFilterParams({ status: "awaiting-you", query: "" })).toBe(
      "?status=awaiting-you",
    );
  });

  it("schrijft status én zoekterm", () => {
    expect(conversationFilterParams({ status: "awaiting-them", query: "mark" })).toBe(
      "?status=awaiting-them&q=mark",
    );
  });

  it("schrijft enkel de zoekterm", () => {
    expect(conversationFilterParams({ status: "all", query: "ggz" })).toBe("?q=ggz");
  });
});
