import { describe, expect, it } from "vitest";
import { assessCancellation } from "@/lib/cancellation";
import { CANCELLATION_FREE_DAYS } from "@/lib/config";

const DAY_MS = 86_400_000;
const now = new Date("2026-06-12T12:00:00Z");
const daysFromNow = (d: number) => new Date(now.getTime() + d * DAY_MS);

describe("assessCancellation", () => {
  it("opdrachtgever annuleert kosteloos zolang de start ≥ 7 dagen weg is", () => {
    const r = assessCancellation({
      byClient: true,
      active: true,
      startDate: daysFromNow(CANCELLATION_FREE_DAYS + 3),
      now,
    });
    expect(r.chargeable).toBe(false);
    expect(r.freeUntil).toEqual(daysFromNow(3));
  });

  it("binnen 7 dagen vóór de start is annuleren betalingsplichtig", () => {
    const r = assessCancellation({
      byClient: true,
      active: true,
      startDate: daysFromNow(2),
      now,
    });
    expect(r.chargeable).toBe(true);
  });

  it("grens: exact op startdatum − 7 dagen is nog kosteloos, één ms later niet", () => {
    const startDate = daysFromNow(CANCELLATION_FREE_DAYS);
    const onBoundary = assessCancellation({ byClient: true, active: true, startDate, now });
    expect(onBoundary.chargeable).toBe(false);
    const justAfter = assessCancellation({
      byClient: true,
      active: true,
      startDate,
      now: new Date(now.getTime() + 1),
    });
    expect(justAfter.chargeable).toBe(true);
  });

  it("na de start is annuleren altijd betalingsplichtig", () => {
    const r = assessCancellation({
      byClient: true,
      active: true,
      startDate: daysFromNow(-1),
      now,
    });
    expect(r.chargeable).toBe(true);
  });

  it("zonder startdatum geen kostenregel", () => {
    const r = assessCancellation({ byClient: true, active: true, startDate: null, now });
    expect(r).toEqual({ chargeable: false, freeUntil: null });
  });

  it("een voorstel zonder ondertekend contract schept geen betalingsverplichting", () => {
    const r = assessCancellation({
      byClient: true,
      active: false,
      startDate: daysFromNow(1),
      now,
    });
    expect(r).toEqual({ chargeable: false, freeUntil: null });
  });

  it("annulering door de ZZP'er is nooit betalingsplichtig via deze regel", () => {
    const r = assessCancellation({
      byClient: false,
      active: true,
      startDate: daysFromNow(1),
      now,
    });
    expect(r).toEqual({ chargeable: false, freeUntil: null });
  });
});
