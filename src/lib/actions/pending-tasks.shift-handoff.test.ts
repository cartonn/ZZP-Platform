// Regressietest voor de next-action-engine (DOEL 1b — cross-surface-consistentie): een OPEN
// dienst-overname (ShiftHandoff) telde wél in de nav-badge (`openHandoffs` voor de bemiddelaar,
// `openAdminHandoffs` voor de admin — signals.ts), maar ontbrak volledig in het actiecentrum: /acties,
// de dashboard-"Volgende acties"-rail én de badge-telling (allemaal gevoed door de item-engine
// `pendingTasks`). De nav-badge riep "aandacht gevraagd" terwijl het actiecentrum zweeg over dezelfde
// governance-beslissing. Deze test borgt dat de item-engine de beslis-taak nu wél emitteert voor de
// bemiddelaar (tenant-gescoped, via collaboration.job.tenantId) én de admin (platform-breed), met de
// juiste deep-link, dat een bemiddelaar van een ándere tenant hem niet ziet (tenant-isolatie), en dat
// de taak verdwijnt zodra de aanvraag niet meer OPEN is (bv. APPROVED).

import { describe, it, expect, vi, beforeEach } from "vitest";

const state = vi.hoisted(() => ({
  // Open/afgehandelde dienst-overnames. Elk record kent zijn tenant (via de opdracht van de
  // samenwerking) zodat de mock exact de tenant-scoping van de nav-badge kan nabootsen.
  handoffs: [] as {
    id: string;
    tenantId: string;
    status: string;
    jobTitle: string;
    freelancerName: string | null;
    // Status + dispuut-vlag van de bijbehorende samenwerking: alleen een ACTIEVE, niet-bevroren
    // inzet levert een openstaande governance-beslissing op. Default ACTIVE/niet-in-dispuut zodat
    // bestaande cases zich als voorheen gedragen.
    collaborationStatus?: string;
    collaborationDisputed?: boolean;
  }[],
}));

// Eén db-mock die zowel de bemiddelaar- als de admin-tak bedient. Alle niet-relevante queries geven
// leeg terug zodat uitsluitend de dienst-overname-tak wordt getoetst; de shiftHandoff.findMany-mock
// past het echte where-filter toe (status + optionele tenant via collaboration.job.tenantId).
vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      // Bemiddelaar-tenant-lookup: leidt de tenant af uit het actor-id (franchiser-1 → tenant-1).
      findUnique: vi.fn(async (args: { where?: { id?: string } }) => ({
        tenantId: args?.where?.id === "user-franchiser-2" ? "tenant-2" : "tenant-1",
        // fallback voor eventuele identity-selects (ongebruikt in deze test)
        identityVerifiedAt: null,
      })),
      findMany: vi.fn(async () => []),
    },
    credential: { findMany: vi.fn(async () => []) },
    lead: { count: vi.fn(async () => 0) },
    // Volledig opgezette franchise (companies/roster/diensten ≥ 1, geen opdrachtgever-zonder-dienst)
    // → geen geleide-opzet-taken, zodat de test geïsoleerd blijft.
    company: {
      count: vi.fn(async (args: { where?: { jobs?: unknown } }) => (args?.where?.jobs ? 0 : 1)),
      findMany: vi.fn(async () => []),
    },
    freelancerProfile: {
      findMany: vi.fn(async () => []),
      count: vi.fn(async () => 1),
    },
    job: {
      findMany: vi.fn(async () => []),
      count: vi.fn(async () => 1),
      groupBy: vi.fn(async () => []),
    },
    // Admin-tak: disputen (collaboration), no-shows, supporttickets — allemaal leeg.
    collaboration: { findMany: vi.fn(async () => []), groupBy: vi.fn(async () => []) },
    noShowReport: { findMany: vi.fn(async () => []), groupBy: vi.fn(async () => []) },
    supportTicket: { findMany: vi.fn(async () => []) },
    shiftHandoff: {
      findMany: vi.fn(
        async (args: {
          where?: {
            status?: string;
            collaboration?: {
              status?: string;
              disputedAt?: null | { not: null };
              job?: { tenantId?: string };
            };
          };
        }) => {
          const where = args?.where ?? {};
          const tenantFilter = where.collaboration?.job?.tenantId;
          const collabStatusFilter = where.collaboration?.status;
          // `disputedAt: null` in het filter betekent: alleen niet-bevroren samenwerkingen.
          const requireNotDisputed = where.collaboration?.disputedAt === null;
          return state.handoffs
            .filter((h) => (where.status ? h.status === where.status : true))
            .filter((h) => (tenantFilter ? h.tenantId === tenantFilter : true))
            .filter((h) =>
              collabStatusFilter
                ? (h.collaborationStatus ?? "ACTIVE") === collabStatusFilter
                : true,
            )
            .filter((h) => (requireNotDisputed ? !(h.collaborationDisputed ?? false) : true))
            .map((h) => ({
              id: h.id,
              collaboration: {
                job: { title: h.jobTitle },
                freelancer: { user: { name: h.freelancerName } },
              },
            }));
        },
      ),
    },
  },
}));

// Geen open diensten → geen fill-signals nodig; toch stubben zodat er geen prisma-pad opengaat.
vi.mock("@/lib/franchise/dienst-fill-signal", () => ({
  getRosterFillSignalsForTenant: vi.fn(async () => new Map()),
}));

import { pendingTasks } from "@/lib/actions/pending-tasks";

const FRANCHISER = { id: "user-franchiser-1", role: "FRANCHISER", status: "ACTIVE" } as const;
const OTHER_FRANCHISER = { id: "user-franchiser-2", role: "FRANCHISER", status: "ACTIVE" } as const;
const ADMIN = { id: "user-admin", role: "ADMIN", status: "ACTIVE" } as const;

beforeEach(() => {
  state.handoffs = [];
});

describe("dienst-overname — cross-surface-consistentie met de nav-badge (DOEL 1b)", () => {
  it("emitteert precies één beslis-taak voor de bemiddelaar van de eigenaar-tenant, met de juiste deep-link", async () => {
    state.handoffs = [
      {
        id: "handoff-1",
        tenantId: "tenant-1",
        status: "OPEN",
        jobTitle: "Nachtdienst IC",
        freelancerName: "Sanne de Vries",
      },
    ];
    const tasks = await pendingTasks(FRANCHISER);
    const handoff = tasks.filter((t) => t.kind === "shift-handoff-decide");
    expect(handoff).toHaveLength(1);
    const task = handoff[0];
    expect(task?.id).toBe("shift-handoff-decide:handoff-1");
    expect(task?.href).toBe("/franchise/shift-overnames");
    expect(task?.tone).toBe("attention");
    expect(task?.title).toContain("dienst-overname");
    expect(task?.subtitle).toContain("Nachtdienst IC");
    expect(task?.subtitle).toContain("Sanne de Vries");
  });

  it("emitteert de beslis-taak platform-breed voor de admin, met de admin-deep-link", async () => {
    state.handoffs = [
      {
        id: "handoff-1",
        tenantId: "tenant-1",
        status: "OPEN",
        jobTitle: "Nachtdienst IC",
        freelancerName: "Sanne de Vries",
      },
    ];
    const tasks = await pendingTasks(ADMIN);
    const handoff = tasks.filter((t) => t.kind === "shift-handoff-decide");
    expect(handoff).toHaveLength(1);
    expect(handoff[0]?.id).toBe("shift-handoff-decide:handoff-1");
    expect(handoff[0]?.href).toBe("/admin/shift-overnames");
  });

  it("toont de aanvraag NIET aan een bemiddelaar van een andere tenant (tenant-isolatie)", async () => {
    state.handoffs = [
      {
        id: "handoff-1",
        tenantId: "tenant-1",
        status: "OPEN",
        jobTitle: "Nachtdienst IC",
        freelancerName: "Sanne de Vries",
      },
    ];
    const tasks = await pendingTasks(OTHER_FRANCHISER);
    expect(tasks.some((t) => t.kind === "shift-handoff-decide")).toBe(false);
  });

  it("laat de taak verdwijnen zodra de aanvraag niet meer OPEN is (bv. APPROVED) — bemiddelaar én admin", async () => {
    state.handoffs = [
      {
        id: "handoff-1",
        tenantId: "tenant-1",
        status: "APPROVED",
        jobTitle: "Nachtdienst IC",
        freelancerName: "Sanne de Vries",
      },
    ];
    const franchiserTasks = await pendingTasks(FRANCHISER);
    const adminTasks = await pendingTasks(ADMIN);
    expect(franchiserTasks.some((t) => t.kind === "shift-handoff-decide")).toBe(false);
    expect(adminTasks.some((t) => t.kind === "shift-handoff-decide")).toBe(false);
  });

  // DOEL 1b — de kernbug: een OPEN-aanvraag wordt door niets gesloten als de samenwerking daarna
  // terminaal wordt (annuleren/afronden). `canRequestHandoff` staat openen alleen op ACTIVE toe,
  // maar de collab kan zonder de handoff aan te raken naar CANCELLED/COMPLETED transitioneren →
  // zonder collab-status-scope bleef de beslis-taak eeuwig hangen op een dode inzet.
  for (const terminal of ["CANCELLED", "COMPLETED"] as const) {
    it(`laat de OPEN beslis-taak verdwijnen zodra de samenwerking ${terminal} is — bemiddelaar én admin`, async () => {
      state.handoffs = [
        {
          id: "handoff-1",
          tenantId: "tenant-1",
          status: "OPEN",
          jobTitle: "Nachtdienst IC",
          freelancerName: "Sanne de Vries",
          collaborationStatus: terminal,
        },
      ];
      const franchiserTasks = await pendingTasks(FRANCHISER);
      const adminTasks = await pendingTasks(ADMIN);
      expect(franchiserTasks.some((t) => t.kind === "shift-handoff-decide")).toBe(false);
      expect(adminTasks.some((t) => t.kind === "shift-handoff-decide")).toBe(false);
    });
  }

  it("laat de OPEN beslis-taak verdwijnen zodra de samenwerking in dispuut staat (werkproces bevroren) — bemiddelaar én admin", async () => {
    state.handoffs = [
      {
        id: "handoff-1",
        tenantId: "tenant-1",
        status: "OPEN",
        jobTitle: "Nachtdienst IC",
        freelancerName: "Sanne de Vries",
        collaborationStatus: "ACTIVE",
        collaborationDisputed: true,
      },
    ];
    const franchiserTasks = await pendingTasks(FRANCHISER);
    const adminTasks = await pendingTasks(ADMIN);
    expect(franchiserTasks.some((t) => t.kind === "shift-handoff-decide")).toBe(false);
    expect(adminTasks.some((t) => t.kind === "shift-handoff-decide")).toBe(false);
  });
});
