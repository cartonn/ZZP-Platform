// Dataminimalisatie-contract van ProfileScreen (AVG art. 5(1)(c) + defense-in-depth): de
// freelancerProfile-query op de deels-publieke /zzp/[id]-route mag GEEN privé-financiële velden
// (monthlyIncomeGoalCents, defaultMotivation, btwNumber) in servergeheugen laden. Rood→groen: vóór de
// fix gebruikte de query een kale `include` (laadt álle scalars, incl. de drie privé-velden); een
// toekomstige render-regel had er stil één kunnen blootstellen. Deze test dwingt een expliciete
// `select` af en verbiedt de terugval naar `include`.
//
// Techniek: we mocken alleen prisma + de translator en onderscheppen het eerste query-argument; de
// findUnique gooit daarna een sentinel zodat de rest van het (zware) server-component niet hoeft te
// renderen. We toetsen puur de query-vorm — het gevoeligste, meest regressiegevoelige deel.

import { describe, it, expect, vi } from "vitest";

const captured = vi.hoisted(() => ({ arg: null as Record<string, unknown> | null }));
const SENTINEL = "STOP_NA_QUERY_CAPTURE";

vi.mock("@/lib/db", () => ({
  prisma: {
    freelancerProfile: {
      findUnique: vi.fn((arg: Record<string, unknown>) => {
        captured.arg = arg;
        throw new Error(SENTINEL);
      }),
    },
  },
}));

vi.mock("@/lib/i18n/server", () => ({
  getTranslator: vi.fn(async () => ({ t: (s: string) => s })),
}));

import { ProfileScreen } from "./profile-screen";

const FORBIDDEN = ["monthlyIncomeGoalCents", "defaultMotivation", "btwNumber"];

describe("ProfileScreen — dataminimalisatie op de freelancerProfile-query", () => {
  it("gebruikt een expliciete select zonder privé-financiële velden (geen kale include)", async () => {
    await expect(ProfileScreen({ profileId: "p-1", basePath: "/zzp" })).rejects.toThrow(SENTINEL);

    const arg = captured.arg;
    expect(arg).not.toBeNull();
    // Geen terugval naar een brede include (die álle scalars laadt).
    expect(arg).not.toHaveProperty("include");
    const select = arg?.select as Record<string, unknown> | undefined;
    expect(select).toBeTruthy();
    for (const field of FORBIDDEN) {
      expect(select).not.toHaveProperty(field);
    }
    // Sanity: de velden die het scherm wél nodig heeft, worden geselecteerd.
    for (const field of ["userId", "visibility", "headline", "kvkNumber"]) {
      expect(select).toHaveProperty(field, true);
    }
  });
});
