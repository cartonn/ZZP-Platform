import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { PerformanceForm } from "./performance-form";
import { performanceFormDefaults } from "@/lib/performance-form";
import { MAX_SHIFT_HOURS } from "@/lib/shift";

vi.mock("./actions", () => ({ logAndSubmitPerformanceAction: vi.fn() }));

const start = "2026-01-12T09:00";
const normal = { start, end: "2026-01-12T17:00" };
const tooLong = { start, end: "2026-03-12T17:00" };
const warning = `Een dienst mag niet langer dan ${MAX_SHIFT_HOURS} uur duren.`;

function endAfter(minutes: number): string {
  const date = new Date(new Date(start).getTime() + minutes * 60_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function render(shifts: { start: string; end: string }[], manualHours = "") {
  const defaults = performanceFormDefaults({
    type: "HOURS",
    hours: null,
    amountCents: null,
    milestoneTitle: null,
    periodStart: null,
    periodEnd: null,
    description: "Testdienst",
    ortSegments: null,
    shifts: JSON.stringify(shifts),
  });
  defaults.manualOrt.ort_normal = manualHours;
  return renderToString(
    <PerformanceForm
      collaborationId="synthetic"
      rateCents={5000}
      ortProfile={null}
      ortCustomRates={null}
      defaults={defaults}
    />,
  );
}

describe("PerformanceForm shift preview duration", () => {
  it("renders the ordinary shift total", () => {
    const html = render([normal]);
    expect(html).toContain("Berekende ORT");
    expect(html).toContain("400,00");
    expect(html).not.toContain(warning);
  });
  it("retains mistyped dates with a recoverable accessible warning", () => {
    const html = render([tooLong]);
    expect(html).toContain('role="alert"');
    expect(html).toContain(warning);
    expect(html).toContain(`value="${tooLong.start}"`);
    expect(html).toContain(`value="${tooLong.end}"`);
    expect(html).not.toContain("Berekende ORT");
  });
  it.each([
    [normal, tooLong],
    [tooLong, normal],
  ])(
    "shows no partial shift or manual total when either row exceeds the limit: %j",
    (first, second) => {
      const html = render([first, second], "8");
      expect(html).toContain(warning);
      expect(html).not.toContain("Berekende ORT");
      expect(html).not.toContain("400,00");
      expect(html).toContain('name="ort_normal"');
      expect(html).toContain('value="8"');
    },
  );
  it("preserves the exact engine duration boundary", () => {
    const html = render([{ start, end: endAfter(MAX_SHIFT_HOURS * 60) }]);
    expect(html).toContain("Berekende ORT");
    expect(html).not.toContain(warning);
  });
  it("handles one minute beyond the duration boundary without throwing", () => {
    const html = render([{ start, end: endAfter(MAX_SHIFT_HOURS * 60 + 1) }]);
    expect(html).toContain(warning);
    expect(html).not.toContain("Berekende ORT");
  });
  it("keeps manual preview available without shifts", () => {
    const html = render([], "8");
    expect(html).toContain("Berekende ORT");
    expect(html).toContain("400,00");
    expect(html).not.toContain(warning);
  });
});
