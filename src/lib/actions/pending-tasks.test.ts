// Regressietest voor de next-action-engine: een OVERDUE-factuur op een lopende samenwerking moet
// de ZZP'er nog steeds zijn specifieke, één-klik "betaling markeren"-taak tonen (toon "attention",
// spiegelt cascade/stage.ts). De oude filter [DRAFT,REJECTED,APPROVED] liet een factuur die de
// betaal-herinnering naar OVERDUE draaide stil uit /acties verdwijnen — een zichzelf tegensprekend
// scherm (stage.ts hield de ZZP'er "aan zet"). Tegelijk mag dezelfde factuur niet dubbel verschijnen
// als generieke "factuur over de vervaldatum"-rij.

import { describe, it, expect, vi, beforeEach } from "vitest";

const state = vi.hoisted(() => ({
  collabs: [] as unknown[],
  completedCollabs: [] as unknown[],
  overdueCount: 0,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn(async () => ({ identityVerifiedAt: new Date() })) },
    // De review-nudge-query (status COMPLETED) is een aparte findMany met eigen state; de
    // lopende (ACTIVE/PROPOSED) tak leest state.collabs. Zo isoleert elke test wat hij toetst.
    collaboration: {
      findMany: vi.fn(async (args?: { where?: { status?: unknown } }) =>
        args?.where?.status === "COMPLETED" ? state.completedCollabs : state.collabs,
      ),
    },
    conversationParticipant: { findMany: vi.fn(async () => []) },
    message: { groupBy: vi.fn(async () => []) },
    conversation: { findMany: vi.fn(async () => []) },
    noShowReport: { findFirst: vi.fn(async () => null), count: vi.fn(async () => 0) },
  },
}));

// Profielblok uitschakelen: met een null-profiel slaat freelancerTasks alle profiel-/certificaat-/
// no-show-taken over, zodat de test uitsluitend de samenwerkings-/factuurtak isoleert.
vi.mock("@/lib/data/freelancer-profile", () => ({
  getCompletenessProfile: vi.fn(async () => null),
}));

vi.mock("@/lib/signals", () => ({
  overdueInvoiceCount: vi.fn(async () => state.overdueCount),
}));

// BTW-deadline-tak buiten deze test houden: isoleert de samenwerkings-/factuurtak.
vi.mock("@/lib/data/vat-deadline", () => ({
  getVatDeadlineForActor: vi.fn(async () => null),
}));

import { pendingTasks } from "@/lib/actions/pending-tasks";

const ACTOR = { id: "user-zzp", role: "FREELANCER", status: "ACTIVE" } as const;

function collab(id: string, invoices: { id: string; lifecycleStatus: string }[]) {
  return {
    id,
    status: "ACTIVE",
    job: { title: "Verpleegkundige", credentialRequirements: [] },
    company: { name: "Zorgcentrum" },
    performances: [{ id: "perf-1", status: "APPROVED" }],
    invoices,
  };
}

beforeEach(() => {
  state.collabs = [];
  state.completedCollabs = [];
  state.overdueCount = 0;
});

// Afgeronde samenwerking zoals de review-nudge-query (status COMPLETED) hem oplevert.
function completedCollab(id: string, opts: { completedAt: Date | null; reviewedByActor: boolean }) {
  return {
    id,
    completedAt: opts.completedAt,
    createdAt: opts.completedAt ?? new Date(),
    job: { title: "Verpleegkundige" },
    company: { name: "Zorgcentrum Noord" },
    freelancer: { user: { name: "Sanne de Vries" } },
    reviews: opts.reviewedByActor ? [{ id: "rev-1" }] : [],
  };
}

describe("freelancerTasks — betaal-/overdue-tak", () => {
  it("toont een specifieke betaal-taak (attention) voor een OVERDUE-factuur — verdwijnt niet meer", async () => {
    state.collabs = [collab("c1", [{ id: "inv-overdue", lifecycleStatus: "OVERDUE" }])];
    state.overdueCount = 1; // dezelfde factuur telt mee in de generieke overdue-teller

    const tasks = await pendingTasks(ACTOR);
    const pay = tasks.find((t) => t.id === "payment-confirm:inv-overdue");
    expect(pay).toBeDefined();
    expect(pay?.tone).toBe("attention");
    expect(pay?.kind).toBe("payment-confirm");

    // Geen dubbele weergave: de generieke "factuur over de vervaldatum"-rij mag niet óók verschijnen
    // voor een factuur die al een eigen betaal-taak heeft (residu = 1 - 1 = 0).
    expect(tasks.some((t) => t.kind === "overdue-invoice")).toBe(false);
  });

  it("houdt de toon 'info' voor een APPROVED-factuur (nog niet verlopen)", async () => {
    state.collabs = [collab("c2", [{ id: "inv-approved", lifecycleStatus: "APPROVED" }])];
    state.overdueCount = 0;

    const tasks = await pendingTasks(ACTOR);
    const pay = tasks.find((t) => t.id === "payment-confirm:inv-approved");
    expect(pay).toBeDefined();
    expect(pay?.tone).toBe("info");
  });

  it("toont de generieke overdue-rij alleen voor het residu (bv. een bevroren disputed-factuur)", async () => {
    // Eén overdue-factuur op een lopende samenwerking (krijgt een eigen taak) + een tweede overdue-
    // factuur die buiten de collabs-query valt (disputed): overdueCount=2, surfaced=1 → residu 1.
    state.collabs = [collab("c3", [{ id: "inv-overdue-active", lifecycleStatus: "OVERDUE" }])];
    state.overdueCount = 2;

    const tasks = await pendingTasks(ACTOR);
    expect(tasks.some((t) => t.id === "payment-confirm:inv-overdue-active")).toBe(true);
    const generic = tasks.find((t) => t.kind === "overdue-invoice");
    expect(generic).toBeDefined();
    expect(generic?.title).toContain("1");
  });
});

describe("freelancerTasks — beoordelings-nudge na afronding", () => {
  it("toont een review-taak voor een afgeronde, nog-niet-beoordeelde samenwerking (venster open)", async () => {
    state.completedCollabs = [
      completedCollab("done-1", { completedAt: new Date(), reviewedByActor: false }),
    ];

    const tasks = await pendingTasks(ACTOR);
    const review = tasks.find((t) => t.id === "review-leave:done-1");
    expect(review).toBeDefined();
    expect(review?.kind).toBe("review-leave");
    expect(review?.href).toBe("/samenwerkingen/done-1");
    // De ZZP'er beoordeelt de opdrachtgever (tegenpartij = company).
    expect(review?.title).toContain("Zorgcentrum Noord");
  });

  it("geen review-taak zodra de actor al beoordeeld heeft", async () => {
    state.completedCollabs = [
      completedCollab("done-2", { completedAt: new Date(), reviewedByActor: true }),
    ];

    const tasks = await pendingTasks(ACTOR);
    expect(tasks.some((t) => t.id === "review-leave:done-2")).toBe(false);
  });
});
