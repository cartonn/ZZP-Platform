import { describe, expect, it } from "vitest";
import { JOB_STARTED_RECENT_DAYS, jobStartedSignal } from "@/lib/job-started-signal";

const now = new Date("2026-08-30T09:00:00Z");

describe("jobStartedSignal", () => {
  it("geeft null zonder startdatum", () => {
    expect(jobStartedSignal(null, now)).toBeNull();
    expect(jobStartedSignal(undefined, now)).toBeNull();
  });

  it("geeft null wanneer de start vandaag is (domein van jobStartProximity)", () => {
    expect(jobStartedSignal(new Date("2026-08-30T23:00:00Z"), now)).toBeNull();
  });

  it("geeft null voor een toekomstige start", () => {
    expect(jobStartedSignal(new Date("2026-09-05T00:00:00Z"), now)).toBeNull();
  });

  it("markeert een start van gisteren als 'Direct te starten'", () => {
    const signal = jobStartedSignal(new Date("2026-08-29T00:00:00Z"), now);
    expect(signal).not.toBeNull();
    expect(signal!.days).toBe(1);
    expect(signal!.label).toBe("Direct te starten");
    expect(signal!.detail).toBe("De startdatum was gisteren — je kunt direct beginnen.");
  });

  it("telt hele UTC-dagen sinds de start, ongeacht het tijdstip", () => {
    const signal = jobStartedSignal(new Date("2026-08-20T22:30:00Z"), now);
    expect(signal!.days).toBe(10);
    expect(signal!.detail).toBe("De startdatum was 10 dagen geleden — je kunt direct beginnen.");
  });

  it("toont het signaal tot en met de horizon", () => {
    const atHorizon = new Date(Date.UTC(2026, 7, 30) - JOB_STARTED_RECENT_DAYS * 86_400_000);
    const signal = jobStartedSignal(atHorizon, now);
    expect(signal!.days).toBe(JOB_STARTED_RECENT_DAYS);
  });

  it("geeft null voorbij de horizon (verouderde plaatsing)", () => {
    const beyond = new Date(Date.UTC(2026, 7, 30) - (JOB_STARTED_RECENT_DAYS + 1) * 86_400_000);
    expect(jobStartedSignal(beyond, now)).toBeNull();
  });

  it("respecteert een aangepaste horizon", () => {
    const start = new Date("2026-08-25T00:00:00Z"); // 5 dagen geleden
    expect(jobStartedSignal(start, now, 3)).toBeNull();
    expect(jobStartedSignal(start, now, 7)!.days).toBe(5);
  });
});
