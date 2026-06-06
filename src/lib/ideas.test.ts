import { describe, expect, it } from "vitest";
import {
  rankIdeas,
  sortIdeas,
  parseIdeaSort,
  ideaStatusRequiresReason,
  IDEA_STATUS_LABEL,
  canIdeaTransition,
  type RankableIdea,
} from "@/lib/ideas";

const idea = (o: Partial<RankableIdea> & { id: string }): RankableIdea => ({
  voteCount: 0,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  status: "OPEN",
  ...o,
});

describe("rankIdeas", () => {
  it("sorteert lopende ideeën op stemmen, aflopend", () => {
    const out = rankIdeas([
      idea({ id: "a", voteCount: 2 }),
      idea({ id: "b", voteCount: 9 }),
      idea({ id: "c", voteCount: 5 }),
    ]);
    expect(out.map((i) => i.id)).toEqual(["b", "c", "a"]);
  });

  it("laat afgehandelde ideeën (DONE/DECLINED) onder de lopende zakken, ondanks meer stemmen", () => {
    const out = rankIdeas([
      idea({ id: "done", voteCount: 50, status: "DONE" }),
      idea({ id: "open", voteCount: 1, status: "OPEN" }),
      idea({ id: "planned", voteCount: 0, status: "PLANNED" }),
    ]);
    expect(out.map((i) => i.id)).toEqual(["open", "planned", "done"]);
  });

  it("breekt gelijke stemmen op nieuwste eerst, dan id (stabiel)", () => {
    const out = rankIdeas([
      idea({ id: "oud", voteCount: 3, createdAt: new Date("2026-01-01T00:00:00Z") }),
      idea({ id: "nieuw", voteCount: 3, createdAt: new Date("2026-02-01T00:00:00Z") }),
    ]);
    expect(out.map((i) => i.id)).toEqual(["nieuw", "oud"]);
  });

  it("muteert de invoer niet", () => {
    const input = [idea({ id: "a", voteCount: 1 }), idea({ id: "b", voteCount: 2 })];
    const copy = [...input];
    rankIdeas(input);
    expect(input).toEqual(copy);
  });

  it("heeft een Nederlands label voor elke status", () => {
    expect(IDEA_STATUS_LABEL.OPEN).toBe("Open");
    expect(IDEA_STATUS_LABEL.DONE).toBe("Uitgevoerd");
  });
});

describe("sortIdeas", () => {
  it("'new' sorteert puur op recency binnen de lopende groep, niet op stemmen", () => {
    const out = sortIdeas(
      [
        idea({ id: "veel-oud", voteCount: 99, createdAt: new Date("2026-01-01T00:00:00Z") }),
        idea({ id: "weinig-nieuw", voteCount: 1, createdAt: new Date("2026-03-01T00:00:00Z") }),
      ],
      "new",
    );
    expect(out.map((i) => i.id)).toEqual(["weinig-nieuw", "veel-oud"]);
  });

  it("houdt afgehandelde ideeën onder de lopende, ook bij 'new'", () => {
    const out = sortIdeas(
      [
        idea({ id: "done-nieuw", status: "DONE", createdAt: new Date("2026-05-01T00:00:00Z") }),
        idea({ id: "open-oud", status: "OPEN", createdAt: new Date("2026-01-01T00:00:00Z") }),
      ],
      "new",
    );
    expect(out.map((i) => i.id)).toEqual(["open-oud", "done-nieuw"]);
  });

  it("rankIdeas is gelijk aan sortIdeas(_, 'top')", () => {
    const input = [idea({ id: "a", voteCount: 2 }), idea({ id: "b", voteCount: 9 })];
    expect(rankIdeas(input)).toEqual(sortIdeas(input, "top"));
  });
});

describe("parseIdeaSort", () => {
  it("accepteert geldige waarden en valt anders terug op 'top'", () => {
    expect(parseIdeaSort("new")).toBe("new");
    expect(parseIdeaSort("top")).toBe("top");
    expect(parseIdeaSort(undefined)).toBe("top");
    expect(parseIdeaSort("onzin")).toBe("top");
  });
});

describe("ideaStatusRequiresReason", () => {
  it("vereist alleen een reden bij afwijzen", () => {
    expect(ideaStatusRequiresReason("DECLINED")).toBe(true);
    expect(ideaStatusRequiresReason("DONE")).toBe(false);
    expect(ideaStatusRequiresReason("PLANNED")).toBe(false);
    expect(ideaStatusRequiresReason("OPEN")).toBe(false);
  });
});

describe("canIdeaTransition", () => {
  it("staat triage van een open idee toe", () => {
    expect(canIdeaTransition("OPEN", "PLANNED")).toBe(true);
    expect(canIdeaTransition("OPEN", "DONE")).toBe(true);
    expect(canIdeaTransition("OPEN", "DECLINED")).toBe(true);
  });
  it("laat een afgehandeld idee alleen heropenen, niet direct herklasseren", () => {
    expect(canIdeaTransition("DONE", "OPEN")).toBe(true);
    expect(canIdeaTransition("DONE", "DECLINED")).toBe(false);
    expect(canIdeaTransition("DECLINED", "OPEN")).toBe(true);
    expect(canIdeaTransition("DECLINED", "DONE")).toBe(false);
  });
});
