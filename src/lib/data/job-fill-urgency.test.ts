// Regressie: de "Mijn opdrachten"-lijst bepaalde "vervuld" met een eigen samenwerking-only-query en
// miste daardoor de ACCEPTED-reactie-in-propose-limbo die de canonieke `lockedInJobIds`-poort (en de
// opdrachtdetail-staffing-card) wél als vastgelegd tellen. Gevolg: een opdracht met een geaccepteerde
// kandidaat maar nog zonder samenwerking kreeg een valse "nog niet vervuld"-chip terwijl detail en
// next-actions zwegen (cross-surface next-action-drift, DOEL 1b). `getJobFillUrgency` leidt de chips nu
// af via diezelfde poort; deze test pint dat vast en bewaakt de kandidaat-selectie van de poort-query.

import { describe, it, expect, vi, beforeEach } from "vitest";

const lockedIn = vi.hoisted(() => vi.fn(async (_ids: string[]) => new Set<string>()));
vi.mock("@/lib/data/job-locked-in", () => ({ lockedInJobIds: lockedIn }));

import { getJobFillUrgency } from "./job-fill-urgency";

// Vast "nu": 2026-04-15 (UTC). Een startdatum 3 dagen later valt binnen het acute venster (≤7 dagen).
const now = new Date(Date.UTC(2026, 3, 15));
const inThreeDays = new Date(Date.UTC(2026, 3, 18));

beforeEach(() => {
  lockedIn.mockReset();
  lockedIn.mockResolvedValue(new Set<string>());
});

describe("getJobFillUrgency — vervuld = locked-in (zelfde poort als detail/next-actions)", () => {
  it("onderdrukt de chip wanneer de rol al is vastgelegd (ACCEPTED-kandidaat, nog geen samenwerking)", async () => {
    lockedIn.mockResolvedValue(new Set(["job-1"]));
    const chips = await getJobFillUrgency(
      [{ id: "job-1", status: "PUBLISHED", startDate: inThreeDays }],
      now,
    );
    expect(chips.has("job-1")).toBe(false);
    // De poort is bevraagd met exact de zichtbare kandidaat-id (geen drift naar een eigen query).
    expect(lockedIn).toHaveBeenCalledExactlyOnceWith(["job-1"]);
  });

  it("toont de acute chip voor een niet-vastgelegde, bijna startende opdracht", async () => {
    const chips = await getJobFillUrgency(
      [{ id: "job-1", status: "PUBLISHED", startDate: inThreeDays }],
      now,
    );
    expect(chips.get("job-1")).toMatchObject({ tone: "acute", days: 3 });
  });

  it("vraagt de poort alleen voor gepubliceerde opdrachten met startdatum (concept/geen datum uitgesloten)", async () => {
    const chips = await getJobFillUrgency(
      [
        { id: "draft", status: "DRAFT", startDate: inThreeDays },
        { id: "no-date", status: "PUBLISHED", startDate: null },
        { id: "live", status: "PUBLISHED", startDate: inThreeDays },
      ],
      now,
    );
    expect([...chips.keys()]).toEqual(["live"]);
    expect(lockedIn).toHaveBeenCalledExactlyOnceWith(["live"]);
  });

  it("slaat de poort-query over wanneer er geen kandidaten zijn", async () => {
    const chips = await getJobFillUrgency(
      [{ id: "draft", status: "DRAFT", startDate: inThreeDays }],
      now,
    );
    expect(chips.size).toBe(0);
    expect(lockedIn).not.toHaveBeenCalled();
  });

  it("lege invoer → lege map, geen query", async () => {
    const chips = await getJobFillUrgency([], now);
    expect(chips.size).toBe(0);
    expect(lockedIn).not.toHaveBeenCalled();
  });
});
