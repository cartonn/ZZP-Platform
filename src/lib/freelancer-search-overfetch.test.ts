// Dataminimalisatie-contract van getAllPublicFreelancers (AVG art. 5(1)(c) + defense-in-depth): de
// CLIENT-facing, cross-party discovery-browse mag het zelf-getypte AvailabilityWindow.`note`-veld
// (kan een reden of medische details bevatten) NIET in servergeheugen laden. Rood→groen: vóór de fix
// gebruikte `availabilityWindows` geen `select`, waardoor de volledige rij (incl. `note`) werd
// opgehaald. Deze test dwingt een expliciete `select` zonder `note` af.
//
// Techniek: mock alleen prisma; onderschep het eerste findMany-argument en gooi een sentinel zodat de
// rest van de (zware) aggregatie niet hoeft te draaien. We toetsen puur de query-vorm.

import { describe, it, expect, vi } from "vitest";

const captured = vi.hoisted(() => ({ arg: null as Record<string, unknown> | null }));
const SENTINEL = "STOP_NA_QUERY_CAPTURE";

vi.mock("@/lib/db", () => ({
  prisma: {
    freelancerProfile: {
      findMany: vi.fn((arg: Record<string, unknown>) => {
        captured.arg = arg;
        throw new Error(SENTINEL);
      }),
    },
  },
}));

import { getAllPublicFreelancers } from "@/lib/freelancer-search";

describe("getAllPublicFreelancers — dataminimalisatie op availabilityWindows", () => {
  it("selecteert availabilityWindows expliciet zonder het (mogelijk medische) note-veld", async () => {
    await expect(getAllPublicFreelancers()).rejects.toThrow(SENTINEL);

    const include = captured.arg?.include as Record<string, unknown> | undefined;
    expect(include).toBeTruthy();
    const windows = include?.availabilityWindows as
      | { select?: Record<string, unknown> }
      | undefined;
    expect(windows).toBeTruthy();
    // Expliciete select (geen kale relatie die de volledige rij laadt).
    expect(windows?.select).toBeTruthy();
    expect(windows?.select).not.toHaveProperty("note");
    // Sanity: de velden die de samenvatting nodig heeft, worden wél geselecteerd.
    for (const field of ["startDate", "endDate", "type"]) {
      expect(windows?.select).toHaveProperty(field, true);
    }
  });
});
