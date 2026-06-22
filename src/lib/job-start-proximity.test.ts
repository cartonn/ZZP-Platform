import { describe, expect, it } from "vitest";
import { JOB_START_SOON_DAYS, jobStartProximity } from "./job-start-proximity";

const now = new Date("2026-07-01T09:30:00Z");
const inDays = (n: number) => new Date(Date.UTC(2026, 6, 1 + n));

describe("jobStartProximity", () => {
  it("geeft null zonder startdatum", () => {
    expect(jobStartProximity(null, now)).toBeNull();
    expect(jobStartProximity(undefined, now)).toBeNull();
  });

  it("toont 'begint vandaag' bij dezelfde UTC-dag, ongeacht het tijdstip", () => {
    expect(jobStartProximity(inDays(0), now)?.label).toBe("begint vandaag");
    expect(jobStartProximity(inDays(0), now)?.days).toBe(0);
  });

  it("toont 'begint morgen' bij +1 dag", () => {
    expect(jobStartProximity(inDays(1), now)?.label).toBe("begint morgen");
  });

  it("toont 'begint over N dagen' binnen de horizon", () => {
    expect(jobStartProximity(inDays(3), now)?.label).toBe("begint over 3 dagen");
    expect(jobStartProximity(inDays(JOB_START_SOON_DAYS), now)?.label).toBe(
      `begint over ${JOB_START_SOON_DAYS} dagen`,
    );
  });

  it("geeft null voorbij de horizon", () => {
    expect(jobStartProximity(inDays(JOB_START_SOON_DAYS + 1), now)).toBeNull();
  });

  it("geeft null voor een al begonnen opdracht", () => {
    expect(jobStartProximity(inDays(-1), now)).toBeNull();
  });

  it("respecteert een aangepaste horizon", () => {
    expect(jobStartProximity(inDays(10), now, 7)).toBeNull();
    expect(jobStartProximity(inDays(5), now, 7)?.days).toBe(5);
  });
});
