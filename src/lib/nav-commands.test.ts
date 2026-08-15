import { describe, expect, it } from "vitest";
import { buildNavCommands, DEFAULT_NAV_COMMAND_LIMIT } from "./nav-commands";
import { navForRole } from "./nav";

const ITEMS = [
  { label: "Dashboard", href: "/dashboard", section: "Werk", enabled: true },
  { label: "Facturen", href: "/facturen", section: "Zakelijk", enabled: true },
  { label: "Financiën", href: "/financien", section: "Zakelijk", enabled: true },
  { label: "Nog niet af", href: "/wip", section: "Zakelijk", enabled: false },
];

describe("buildNavCommands", () => {
  it("geeft geen commando's voor een lege of te korte zoekterm", () => {
    expect(buildNavCommands(ITEMS, "")).toEqual([]);
    expect(buildNavCommands(ITEMS, "   ")).toEqual([]);
  });

  it("matcht op label (hoofdletterongevoelig)", () => {
    const out = buildNavCommands(ITEMS, "fac");
    expect(out.map((c) => c.href)).toEqual(["/facturen"]);
    const upper = buildNavCommands(ITEMS, "FAC");
    expect(upper.map((c) => c.href)).toEqual(["/facturen"]);
  });

  it("negeert uitgeschakelde items (geen dode links)", () => {
    const out = buildNavCommands(ITEMS, "nog niet");
    expect(out).toEqual([]);
  });

  it("matcht ook op de sectiekop, maar een labelmatch weegt zwaarder", () => {
    const out = buildNavCommands(ITEMS, "zakelijk");
    // Beide zakelijke pagina's komen terug via de sectiematch...
    expect(out.map((c) => c.href).sort()).toEqual(["/facturen", "/financien"]);
    // ...maar de score is de lichte sectiescore (1), nooit een valse hoge labelscore.
    expect(out.every((c) => c.score === 1)).toBe(true);
  });

  it("laat een directe labelmatch boven een sectiematch uitkomen", () => {
    const items = [
      { label: "Zakelijk nieuws", href: "/nieuws", section: "Overig", enabled: true },
      { label: "Facturen", href: "/facturen", section: "Zakelijk", enabled: true },
    ];
    const out = buildNavCommands(items, "zakelijk");
    // /nieuws matcht het label ("Zakelijk …" → begint met de term, score 3),
    // /facturen alleen de sectie (score 1) → label wint.
    expect(out[0].href).toBe("/nieuws");
    expect(out[0].score).toBeGreaterThan(out[1].score);
  });

  it("rankt exacte match boven begint-met boven bevat", () => {
    const items = [
      { label: "Opdrachten overzicht", href: "/lijst", enabled: true },
      { label: "Opdrachten", href: "/exact", enabled: true },
      { label: "Mijn opdrachten", href: "/bevat", enabled: true },
    ];
    const out = buildNavCommands(items, "opdrachten");
    expect(out.map((c) => c.href)).toEqual(["/exact", "/lijst", "/bevat"]);
  });

  it("respecteert de bronvolgorde bij gelijke score", () => {
    const items = [
      { label: "Aaa pagina", href: "/eerst", enabled: true },
      { label: "Aaa dossier", href: "/tweede", enabled: true },
    ];
    // Beide 'begint met "aaa"' → gelijke score → bronvolgorde behouden.
    const out = buildNavCommands(items, "aaa");
    expect(out.map((c) => c.href)).toEqual(["/eerst", "/tweede"]);
  });

  it("begrenst het aantal resultaten", () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      label: `Pagina ${i}`,
      href: `/p${i}`,
      enabled: true,
    }));
    expect(buildNavCommands(many, "pagina").length).toBe(DEFAULT_NAV_COMMAND_LIMIT);
    expect(buildNavCommands(many, "pagina", 3).length).toBe(3);
  });

  it("is deterministisch (zelfde invoer → zelfde uitvoer)", () => {
    const a = buildNavCommands(ITEMS, "fin");
    const b = buildNavCommands(ITEMS, "fin");
    expect(a).toEqual(b);
  });

  it("werkt op de echte rol-nav (FREELANCER 'inzicht')", () => {
    const items = navForRole("FREELANCER");
    const out = buildNavCommands(items, "inzicht");
    expect(out.some((c) => c.href === "/inzicht")).toBe(true);
    // Alleen ingeschakelde items komen terug.
    expect(out.every((c) => items.find((i) => i.href === c.href)?.enabled)).toBe(true);
  });
});
