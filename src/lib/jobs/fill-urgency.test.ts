import { describe, expect, it } from "vitest";
import { JOB_FILL_ACUTE_DAYS, JOB_FILL_SOON_DAYS, jobFillUrgency } from "@/lib/jobs/fill-urgency";

const NOW = new Date("2026-07-27T12:00:00Z");
const inDays = (n: number) => new Date(Date.UTC(2026, 6, 27 + n));

describe("jobFillUrgency", () => {
  it("zwijgt voor een niet-gepubliceerde opdracht (concept)", () => {
    expect(
      jobFillUrgency({ status: "DRAFT", startDate: inDays(1), filled: false }, NOW),
    ).toBeNull();
  });

  it("zwijgt voor een gesloten opdracht", () => {
    expect(
      jobFillUrgency({ status: "CLOSED", startDate: inDays(1), filled: false }, NOW),
    ).toBeNull();
  });

  it("zwijgt zodra de opdracht vervuld is", () => {
    expect(
      jobFillUrgency({ status: "PUBLISHED", startDate: inDays(1), filled: true }, NOW),
    ).toBeNull();
  });

  it("zwijgt zonder startdatum (geen planning-deadline)", () => {
    expect(jobFillUrgency({ status: "PUBLISHED", startDate: null, filled: false }, NOW)).toBeNull();
  });

  it("markeert een verstreken startdatum als acuut", () => {
    const chip = jobFillUrgency({ status: "PUBLISHED", startDate: inDays(-3), filled: false }, NOW);
    expect(chip).toEqual({
      tone: "acute",
      label: "Startdatum verstreken · nog niet vervuld",
      days: -3,
    });
  });

  it("markeert vandaag/morgen als acuut met de juiste tekst", () => {
    expect(
      jobFillUrgency({ status: "PUBLISHED", startDate: inDays(0), filled: false }, NOW)?.label,
    ).toBe("Start vandaag · nog niet vervuld");
    expect(
      jobFillUrgency({ status: "PUBLISHED", startDate: inDays(1), filled: false }, NOW)?.label,
    ).toBe("Start morgen · nog niet vervuld");
  });

  it("is acuut op de acute-grens en soon net daarboven", () => {
    const atAcute = jobFillUrgency(
      { status: "PUBLISHED", startDate: inDays(JOB_FILL_ACUTE_DAYS), filled: false },
      NOW,
    );
    expect(atAcute?.tone).toBe("acute");
    expect(atAcute?.label).toBe(`Start over ${JOB_FILL_ACUTE_DAYS} dagen · nog niet vervuld`);

    const justAbove = jobFillUrgency(
      { status: "PUBLISHED", startDate: inDays(JOB_FILL_ACUTE_DAYS + 1), filled: false },
      NOW,
    );
    expect(justAbove?.tone).toBe("soon");
  });

  it("is soon op de soon-grens en zwijgt daarboven", () => {
    expect(
      jobFillUrgency(
        { status: "PUBLISHED", startDate: inDays(JOB_FILL_SOON_DAYS), filled: false },
        NOW,
      )?.tone,
    ).toBe("soon");
    expect(
      jobFillUrgency(
        { status: "PUBLISHED", startDate: inDays(JOB_FILL_SOON_DAYS + 1), filled: false },
        NOW,
      ),
    ).toBeNull();
  });
});
