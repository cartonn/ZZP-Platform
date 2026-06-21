import { describe, expect, it } from "vitest";
import { hasExportableSchedule, type ExportableScheduleInput } from "./exportable";

const c = (over: Partial<ExportableScheduleInput>): ExportableScheduleInput => ({
  status: "ACTIVE",
  startDate: new Date("2026-07-01"),
  weekdays: '["MON","TUE"]',
  ...over,
});

describe("hasExportableSchedule", () => {
  it("true bij een actieve samenwerking met startdatum én weekdagen", () => {
    expect(hasExportableSchedule([c({})])).toBe(true);
  });

  it("false bij een lege lijst", () => {
    expect(hasExportableSchedule([])).toBe(false);
  });

  it("negeert niet-actieve samenwerkingen (PROPOSED telt niet)", () => {
    expect(hasExportableSchedule([c({ status: "PROPOSED" })])).toBe(false);
  });

  it("vereist een startdatum", () => {
    expect(hasExportableSchedule([c({ startDate: null })])).toBe(false);
  });

  it("vereist ten minste één weekdag (anders geen events)", () => {
    expect(hasExportableSchedule([c({ weekdays: "" })])).toBe(false);
    expect(hasExportableSchedule([c({ weekdays: null })])).toBe(false);
  });

  it("true zodra één samenwerking voldoet, ook tussen niet-exporteerbare", () => {
    expect(
      hasExportableSchedule([
        c({ status: "PROPOSED" }),
        c({ startDate: null }),
        c({ weekdays: '["WED"]' }),
      ]),
    ).toBe(true);
  });
});
