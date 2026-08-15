import { describe, expect, it } from "vitest";
import { buildWorkedHoursTrend, type WorkedHoursRow } from "./worked-hours-trend";

// Vast referentiemoment (Europe/Amsterdam ≈ UTC+2 in augustus). Anker ligt op de 15e.
const NOW = new Date("2026-08-15T12:00:00Z");

function row(iso: string, hours: number): WorkedHoursRow {
  return { occurredAt: new Date(iso), hours };
}

describe("buildWorkedHoursTrend", () => {
  it("bouwt een venster van `months` maanden, oud → nieuw, eindigend op de maand van now", () => {
    const t = buildWorkedHoursTrend([], NOW, 6);
    expect(t.series).toHaveLength(6);
    expect(t.series.at(-1)?.key).toBe("2026-08");
    expect(t.series[0]?.key).toBe("2026-03");
    expect(t.months).toBe(6);
    expect(t.hasData).toBe(false);
  });

  it("sommeert uren per kalendermaand (Europe/Amsterdam)", () => {
    const t = buildWorkedHoursTrend(
      [
        row("2026-08-03T09:00:00Z", 8),
        row("2026-08-20T09:00:00Z", 6),
        row("2026-07-10T09:00:00Z", 4),
      ],
      NOW,
      6,
    );
    const aug = t.series.find((m) => m.key === "2026-08");
    const jul = t.series.find((m) => m.key === "2026-07");
    expect(aug?.hours).toBe(14);
    expect(jul?.hours).toBe(4);
    expect(t.totalHours).toBe(18);
    expect(t.currentHours).toBe(14);
    expect(t.hasData).toBe(true);
  });

  it("bewaart kwartier-precisie exact (geen float-drift)", () => {
    const t = buildWorkedHoursTrend(
      [row("2026-08-01T09:00:00Z", 7.25), row("2026-08-02T09:00:00Z", 0.1)],
      NOW,
      6,
    );
    expect(t.series.find((m) => m.key === "2026-08")?.hours).toBe(7.35);
  });

  it("laat uren buiten het venster vallen", () => {
    const t = buildWorkedHoursTrend([row("2025-12-31T12:00:00Z", 40)], NOW, 6);
    expect(t.totalHours).toBe(0);
    expect(t.hasData).toBe(false);
  });

  it("berekent de maand-op-maand-delta alleen bij een vergelijkbare basis", () => {
    // Vorige maand (juli) 10 u, lopende maand (augustus) 15 u → +50%.
    const up = buildWorkedHoursTrend(
      [row("2026-07-05T09:00:00Z", 10), row("2026-08-05T09:00:00Z", 15)],
      NOW,
      6,
    );
    expect(up.deltaPct).toBe(50);

    // Lopende maand nog leeg → null i.p.v. een misleidende -100%.
    const empty = buildWorkedHoursTrend([row("2026-07-05T09:00:00Z", 10)], NOW, 6);
    expect(empty.deltaPct).toBeNull();
  });

  it("respecteert een niet-standaard venstergrootte", () => {
    const t = buildWorkedHoursTrend([], NOW, 3);
    expect(t.series).toHaveLength(3);
    expect(t.series[0]?.key).toBe("2026-06");
    expect(t.series.at(-1)?.key).toBe("2026-08");
  });
});
