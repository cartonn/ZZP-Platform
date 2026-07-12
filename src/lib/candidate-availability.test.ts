import { describe, expect, it } from "vitest";
import {
  NEXT_FIT_HORIZON_DAYS,
  START_FIT_LABEL,
  START_FIT_SHORT_LABEL,
  START_FIT_VARIANT,
  classifyStartFit,
  nextFitAfterStart,
  nextFitLabel,
} from "@/lib/candidate-availability";
import { type WindowLike } from "@/lib/availability";

const d = (s: string) => new Date(s);
const start = d("2026-06-15T00:00:00Z");

const shared: WindowLike[] = [
  { startDate: d("2026-06-01"), endDate: d("2026-06-30"), type: "AVAILABLE" },
  { startDate: d("2026-08-01"), endDate: d("2026-09-01"), type: "LIMITED" },
];

describe("classifyStartFit", () => {
  it("unknown zonder startdatum", () => {
    expect(classifyStartFit(shared, null)).toBe("unknown");
    expect(classifyStartFit(shared, undefined)).toBe("unknown");
  });

  it("unknown als de ZZP'er geen agenda heeft gedeeld", () => {
    expect(classifyStartFit([], start)).toBe("unknown");
  });

  it("available als een inzetbaar venster de startdatum dekt", () => {
    expect(classifyStartFit(shared, start)).toBe("available");
  });

  it("limited als alleen een beperkt venster de startdatum dekt", () => {
    expect(classifyStartFit(shared, d("2026-08-15T00:00:00Z"))).toBe("limited");
  });

  it("blocked als een onbeschikbaar venster de startdatum dekt", () => {
    const withBlock: WindowLike[] = [
      ...shared,
      { startDate: d("2026-06-10"), endDate: d("2026-06-20"), type: "UNAVAILABLE" },
    ];
    expect(classifyStartFit(withBlock, start)).toBe("blocked");
  });

  it("none als er wel een agenda is maar geen venster de startdatum dekt", () => {
    expect(classifyStartFit(shared, d("2026-07-15T00:00:00Z"))).toBe("none");
  });

  it("dekt de startdatum inclusief de laatste dag van het venster", () => {
    const upToStart: WindowLike[] = [
      { startDate: d("2026-06-01"), endDate: d("2026-06-15"), type: "AVAILABLE" },
    ];
    expect(classifyStartFit(upToStart, start)).toBe("available");
  });
});

describe("label- en variant-maps", () => {
  it("hebben voor elke niet-unknown status een label en variant", () => {
    for (const fit of ["available", "limited", "blocked", "none"] as const) {
      expect(START_FIT_LABEL[fit]).toBeTruthy();
      expect(START_FIT_SHORT_LABEL[fit]).toBeTruthy();
      expect(START_FIT_VARIANT[fit]).toBeTruthy();
    }
  });

  it("available is groen (success), de rest niet", () => {
    expect(START_FIT_VARIANT.available).toBe("success");
    expect(START_FIT_VARIANT.blocked).toBe("danger");
  });
});

describe("nextFitAfterStart", () => {
  it("null zonder startdatum of agenda", () => {
    expect(nextFitAfterStart(shared, null)).toBeNull();
    expect(nextFitAfterStart(shared, undefined)).toBeNull();
    expect(nextFitAfterStart([], start)).toBeNull();
  });

  it("vindt het eerstvolgende inzetbare venster na een 'none'-startdatum", () => {
    // 15 juli valt in het gat tussen het AVAILABLE-venster (t/m 30 jun) en het LIMITED-venster
    // (vanaf 1 aug). De eerstvolgende inzetbare dag is 1 augustus (beperkt).
    const next = nextFitAfterStart(shared, d("2026-07-15T00:00:00Z"));
    expect(next).not.toBeNull();
    expect(next!.date.toISOString().slice(0, 10)).toBe("2026-08-01");
    expect(next!.fit).toBe("limited");
    expect(next!.daysFromStart).toBe(17);
  });

  it("springt over een blokkerend UNAVAILABLE-venster heen naar de eerste vrije dag", () => {
    const withBlock: WindowLike[] = [
      { startDate: d("2026-06-01"), endDate: d("2026-06-30"), type: "AVAILABLE" },
      { startDate: d("2026-06-10"), endDate: d("2026-06-20"), type: "UNAVAILABLE" },
    ];
    // Startdatum 15 jun is geblokkeerd; het AVAILABLE-venster loopt door t/m 30 jun, dus de eerste
    // vrije dag is 21 juni (de dag ná het einde van het UNAVAILABLE-venster).
    const next = nextFitAfterStart(withBlock, start);
    expect(next).not.toBeNull();
    expect(next!.date.toISOString().slice(0, 10)).toBe("2026-06-21");
    expect(next!.fit).toBe("available");
  });

  it("geeft de startdatum zelf (daysFromStart 0) als die inzetbaar is", () => {
    const next = nextFitAfterStart(shared, start);
    expect(next!.daysFromStart).toBe(0);
    expect(next!.fit).toBe("available");
  });

  it("null wanneer er binnen de horizon geen inzetbare dag is", () => {
    const farOff: WindowLike[] = [
      { startDate: d("2027-01-01"), endDate: d("2027-02-01"), type: "AVAILABLE" },
    ];
    expect(nextFitAfterStart(farOff, start, 30)).toBeNull();
    // Met een ruime horizon wordt het venster wél gevonden.
    expect(nextFitAfterStart(farOff, start, 400)).not.toBeNull();
  });

  it("respecteert een expliciete horizon-grens", () => {
    // Venster start precies op de horizon-grens → inclusief gevonden; één dag ervoor → null.
    const win: WindowLike[] = [
      { startDate: d("2026-06-25"), endDate: d("2026-06-30"), type: "AVAILABLE" },
    ];
    expect(nextFitAfterStart(win, start, 10)).not.toBeNull(); // 15 jun + 10 = 25 jun
    expect(nextFitAfterStart(win, start, 9)).toBeNull();
  });

  it("nextFitLabel toont een leesbaar NL-label per inzetbaarheid", () => {
    const avail = nextFitAfterStart(shared, start)!;
    expect(nextFitLabel(avail)).toMatch(/^Vrij vanaf /);
    const limited = nextFitAfterStart(shared, d("2026-07-15T00:00:00Z"))!;
    expect(nextFitLabel(limited)).toMatch(/^Beperkt vrij vanaf /);
  });

  it("de standaard-horizon is 90 dagen", () => {
    expect(NEXT_FIT_HORIZON_DAYS).toBe(90);
  });
});
