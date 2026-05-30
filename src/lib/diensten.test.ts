import { describe, it, expect } from "vitest";
import { parseCsvShifts } from "./diensten";

describe("parseCsvShifts", () => {
  it("parses a single valid row (ISO-8601)", () => {
    const { shifts, errors } = parseCsvShifts("2024-01-15T22:00;2024-01-16T06:00;Nachtdienst");
    expect(errors).toHaveLength(0);
    expect(shifts).toHaveLength(1);
    expect(shifts[0]!.start).toEqual(new Date("2024-01-15T22:00"));
    expect(shifts[0]!.end).toEqual(new Date("2024-01-16T06:00"));
    expect(shifts[0]!.description).toBe("Nachtdienst");
  });

  it("parses a row with space instead of T", () => {
    const { shifts, errors } = parseCsvShifts("2024-01-15 08:00;2024-01-15 16:00;Dagdienst");
    expect(errors).toHaveLength(0);
    expect(shifts).toHaveLength(1);
    expect(shifts[0]!.description).toBe("Dagdienst");
  });

  it("skips a recognised header row", () => {
    const csv = "start;eind;omschrijving\n2024-01-15T08:00;2024-01-15T16:00;Dag";
    const { shifts, errors } = parseCsvShifts(csv);
    expect(errors).toHaveLength(0);
    expect(shifts).toHaveLength(1);
  });

  it("skips header 'datum_start'", () => {
    const csv = "datum_start;eind;omschrijving\n2024-01-15T08:00;2024-01-15T16:00;Dag";
    const { shifts, errors } = parseCsvShifts(csv);
    expect(errors).toHaveLength(0);
    expect(shifts).toHaveLength(1);
  });

  it("handles empty text", () => {
    const { shifts, errors } = parseCsvShifts("   ");
    expect(errors).toHaveLength(0);
    expect(shifts).toHaveLength(0);
  });

  it("handles optional description column", () => {
    const { shifts, errors } = parseCsvShifts("2024-01-15T08:00;2024-01-15T16:00");
    expect(errors).toHaveLength(0);
    expect(shifts[0]!.description).toBe("");
  });

  it("reports error for invalid start date", () => {
    const { shifts, errors } = parseCsvShifts("geen-datum;2024-01-15T16:00;Dag");
    expect(shifts).toHaveLength(0);
    expect(errors[0]!.line).toBe(1);
    expect(errors[0]!.message).toContain("begintijd");
  });

  it("reports error for invalid end date", () => {
    const { shifts, errors } = parseCsvShifts("2024-01-15T08:00;geen-datum;Dag");
    expect(shifts).toHaveLength(0);
    expect(errors[0]!.message).toContain("eindtijd");
  });

  it("reports error when end is before start", () => {
    const { shifts, errors } = parseCsvShifts("2024-01-15T16:00;2024-01-15T08:00;Omgekeerd");
    expect(shifts).toHaveLength(0);
    expect(errors[0]!.message).toContain("na begintijd");
  });

  it("reports error for row with only one column", () => {
    const { shifts, errors } = parseCsvShifts("2024-01-15T08:00");
    expect(shifts).toHaveLength(0);
    expect(errors[0]!.message).toContain("kolommen");
  });

  it("parses multiple rows and collects errors per row", () => {
    const csv = [
      "2024-01-15T08:00;2024-01-15T16:00;Goed",
      "geen-datum;2024-01-16T16:00;Fout",
      "2024-01-17T08:00;2024-01-17T16:00;Goed 2",
    ].join("\n");
    const { shifts, errors } = parseCsvShifts(csv);
    expect(shifts).toHaveLength(2);
    expect(errors).toHaveLength(1);
    expect(errors[0]!.line).toBe(2);
  });

  it("handles Windows line endings", () => {
    const { shifts, errors } = parseCsvShifts(
      "2024-01-15T08:00;2024-01-15T16:00;A\r\n2024-01-16T08:00;2024-01-16T16:00;B",
    );
    expect(errors).toHaveLength(0);
    expect(shifts).toHaveLength(2);
  });

  it("truncates long description to 500 chars", () => {
    const longDesc = "x".repeat(600);
    const { shifts } = parseCsvShifts(`2024-01-15T08:00;2024-01-15T16:00;${longDesc}`);
    expect(shifts[0]!.description.length).toBe(500);
  });
});
