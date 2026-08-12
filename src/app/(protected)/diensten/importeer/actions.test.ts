// Contract van importDienstenAction: auth → rol FREELANCER → ownership → import.
// Anti-oracle (CWE-203): een onbekend collaborationId én andermans samenwerking geven exact
// dezelfde melding, zodat een ZZP'er niet via een gegokt id het bestaan van andermans
// samenwerking kan aftasten.

import { describe, it, expect, vi, beforeEach } from "vitest";

const roleState = vi.hoisted(() => ({ role: "FREELANCER" as string }));
const colState = vi.hoisted(() => ({
  found: null as {
    status: string;
    rate: number | null;
    ortProfile: unknown;
    ortCustomRates: unknown;
    freelancer: { userId: string };
    company: { userId: string };
  } | null,
}));

// Vangt de invoer van elke createPerformance-aanroep op zodat we de afgeleide periode kunnen
// controleren; submitPerformance is een no-op. `perfCalls` wordt per test geleegd.
const perfCalls = vi.hoisted(
  () => [] as Array<{ periodStart: Date | null; periodEnd: Date | null; hours: number }>,
);

vi.mock("@/lib/authz", () => ({
  requireActor: vi.fn(async () => ({ id: "user-1", role: roleState.role, status: "ACTIVE" })),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    collaboration: {
      findUnique: vi.fn(async () => colState.found),
    },
  },
}));
vi.mock("@/lib/cascade/commands", () => ({
  createPerformance: vi.fn(async (_actor: unknown, input: (typeof perfCalls)[number]) => {
    perfCalls.push({
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      hours: input.hours,
    });
    return `perf-${perfCalls.length}`;
  }),
  submitPerformance: vi.fn(async () => {}),
}));

import { importDienstenAction } from "./actions";

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const validForm = () => form({ collaborationId: "col-x", csv: "start;eind\n" });

describe("importDienstenAction — anti-oracle ownership", () => {
  beforeEach(() => {
    roleState.role = "FREELANCER";
    colState.found = null;
    perfCalls.length = 0;
  });

  it("onbekend id → 'Samenwerking niet gevonden.'", async () => {
    colState.found = null;
    const res = await importDienstenAction(null, validForm());
    expect(res.errors).toContain("Samenwerking niet gevonden.");
    expect(res.imported).toBe(0);
  });

  it("andermans samenwerking → identieke melding (geen existence-oracle)", async () => {
    colState.found = {
      status: "ACTIVE",
      rate: 80,
      ortProfile: null,
      ortCustomRates: null,
      freelancer: { userId: "someone-else" },
      company: { userId: "client-9" },
    };
    const res = await importDienstenAction(null, validForm());
    // Exact dezelfde melding als het onbekende id — geen "geen toegang"-divergentie.
    expect(res.errors).toContain("Samenwerking niet gevonden.");
    expect(res.errors).not.toContain("Je hebt geen toegang tot deze samenwerking.");
    expect(res.imported).toBe(0);
  });

  it("gebruikt de exacte diensttijden als periode (niet de hele kalenderdag)", async () => {
    colState.found = {
      status: "ACTIVE",
      rate: 80,
      ortProfile: null,
      ortCustomRates: null,
      freelancer: { userId: "user-1" },
      company: { userId: "client-9" },
    };
    const res = await importDienstenAction(
      null,
      form({ collaborationId: "col-x", csv: "2024-03-04T08:00;2024-03-04T16:00\n" }),
    );
    expect(res.imported).toBe(1);
    expect(perfCalls).toHaveLength(1);
    // Periode = exact 08:00–16:00, niet 00:00:00–23:59:59 van de kalenderdag.
    expect(perfCalls[0]!.periodStart).toEqual(new Date("2024-03-04T08:00"));
    expect(perfCalls[0]!.periodEnd).toEqual(new Date("2024-03-04T16:00"));
  });

  it("dag- én nachtdienst op dezelfde datum krijgen niet-overlappende periodes (zorg-scenario)", async () => {
    colState.found = {
      status: "ACTIVE",
      rate: 80,
      ortProfile: null,
      ortCustomRates: null,
      freelancer: { userId: "user-1" },
      company: { userId: "client-9" },
    };
    // Dagdienst 08:00–16:00 + nachtdienst 23:00 → 07:00 de dag erna, beide op/vanaf 2024-03-04.
    const res = await importDienstenAction(
      null,
      form({
        collaborationId: "col-x",
        csv: "2024-03-04T08:00;2024-03-04T16:00\n2024-03-04T23:00;2024-03-05T07:00\n",
      }),
    );
    expect(res.imported).toBe(2);
    expect(perfCalls).toHaveLength(2);
    const [dag, nacht] = perfCalls;
    // De twee periodes overlappen niet (dag.eind ≤ nacht.begin) → de dubbel-factuur-rem laat beide door.
    expect(dag!.periodEnd!.getTime()).toBeLessThanOrEqual(nacht!.periodStart!.getTime());
  });

  it("niet-FREELANCER wordt geweigerd", async () => {
    roleState.role = "CLIENT";
    const res = await importDienstenAction(null, validForm());
    expect(res.errors[0]).toContain("Alleen ZZP'ers");
    expect(res.imported).toBe(0);
  });

  it("samenwerking zonder uurtarief → geweigerd vóór de rij-loop (geen onafhandelbare SUBMITTED-prestatie)", async () => {
    // `Collaboration.rate` is optioneel (Int?); een ACTIEVE samenwerking zonder tarief is bereikbaar.
    // Zonder deze poort zou de import HOURS-prestaties met rateCents=null aanmaken die niet goed te
    // keuren én niet te corrigeren zijn — de handmatige urenstaat weigert dit ook (validatePerformanceForm).
    colState.found = {
      status: "ACTIVE",
      rate: null,
      ortProfile: null,
      ortCustomRates: null,
      freelancer: { userId: "user-1" },
      company: { userId: "client-9" },
    };
    const res = await importDienstenAction(
      null,
      form({ collaborationId: "col-x", csv: "2024-01-15T22:00;2024-01-16T06:00\n" }),
    );
    expect(res.imported).toBe(0);
    expect(res.errors.some((e) => e.includes("geen uurtarief"))).toBe(true);
  });
});
