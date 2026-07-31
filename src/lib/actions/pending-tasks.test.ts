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
  overdueLegacy: 0,
  overdueCascade: 0,
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
  overdueInvoiceCount: vi.fn(async () => state.overdueLegacy + state.overdueCascade),
  overdueInvoiceBreakdown: vi.fn(async () => ({
    legacy: state.overdueLegacy,
    cascade: state.overdueCascade,
  })),
  paymentDueSoonCount: vi.fn(async () => 0),
}));

// BTW-deadline-tak buiten deze test houden: isoleert de samenwerkings-/factuurtak.
vi.mock("@/lib/data/vat-deadline", () => ({
  getVatDeadlinesForActor: vi.fn(async () => []),
}));

import { pendingTasks } from "@/lib/actions/pending-tasks";
import { P } from "@/lib/next-actions";
import { UNBILLED_AGING_DAYS } from "@/lib/unbilled-invoices";

const ACTOR = { id: "user-zzp", role: "FREELANCER", status: "ACTIVE" } as const;

function collab(id: string, invoices: { id: string; lifecycleStatus: string; createdAt?: Date }[]) {
  return {
    id,
    status: "ACTIVE",
    job: { title: "Verpleegkundige", credentialRequirements: [] },
    company: { name: "Zorgcentrum" },
    performances: [{ id: "perf-1", status: "APPROVED" }],
    // De enumerator leest `createdAt` voor de leeftijd van een concept-factuur; default = nu (vers).
    invoices: invoices.map((i) => ({ createdAt: new Date(), ...i })),
  };
}

beforeEach(() => {
  state.collabs = [];
  state.completedCollabs = [];
  state.overdueLegacy = 0;
  state.overdueCascade = 0;
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
    state.overdueCascade = 1; // dezelfde cascade-factuur telt mee in de generieke overdue-teller

    const tasks = await pendingTasks(ACTOR);
    const pay = tasks.find((t) => t.id === "payment-confirm:inv-overdue");
    expect(pay).toBeDefined();
    expect(pay?.tone).toBe("attention");
    expect(pay?.kind).toBe("payment-confirm");

    // Geen dubbele weergave: de generieke "factuur over de vervaldatum"-rij mag niet óók verschijnen
    // voor een factuur die al een eigen betaal-taak heeft (residu = 1 - 1 = 0).
    expect(tasks.some((t) => t.kind === "overdue-invoice")).toBe(false);
  });

  it("een verse concept-factuur krijgt de vlakke indien-taak zonder leeftijdslabel", async () => {
    state.collabs = [
      collab("c-fresh", [{ id: "inv-fresh", lifecycleStatus: "DRAFT", createdAt: new Date() }]),
    ];

    const tasks = await pendingTasks(ACTOR);
    const submit = tasks.find((t) => t.id === "invoice-submit:inv-fresh");
    expect(submit).toBeDefined();
    expect(submit?.priority).toBe(P.messagesAwaiting);
    expect(submit?.subtitle).toBe("Verpleegkundige");
  });

  it("een verouderde concept-factuur escaleert op /acties (leeftijd ≥ drempel)", async () => {
    const old = new Date(Date.now() - (UNBILLED_AGING_DAYS + 5) * 24 * 60 * 60 * 1000);
    state.collabs = [
      collab("c-old", [{ id: "inv-old", lifecycleStatus: "DRAFT", createdAt: old }]),
    ];

    const tasks = await pendingTasks(ACTOR);
    const submit = tasks.find((t) => t.id === "invoice-submit:inv-old");
    expect(submit).toBeDefined();
    expect(submit?.priority).toBe(P.conceptInvoiceAging);
    expect(submit?.priority).toBeGreaterThan(P.messagesAwaiting);
    expect(submit?.subtitle).toContain("dagen klaar");
  });

  it("houdt de toon 'info' voor een APPROVED-factuur (nog niet verlopen)", async () => {
    state.collabs = [collab("c2", [{ id: "inv-approved", lifecycleStatus: "APPROVED" }])];

    const tasks = await pendingTasks(ACTOR);
    const pay = tasks.find((t) => t.id === "payment-confirm:inv-approved");
    expect(pay).toBeDefined();
    expect(pay?.tone).toBe("info");
  });

  it("toont de generieke cascade-overdue-rij alleen voor het residu, met de 'markeer'-instructie", async () => {
    // Eén cascade-overdue-factuur op een lopende samenwerking (krijgt een eigen taak) + een tweede
    // cascade-overdue-factuur buiten de collabs-slice: cascade=2, surfaced=1 → residu 1. De residu-rij
    // is een cascade-factuur waar de ZZP'er zélf de betaling markeert — niet "volg op bij de opdrachtgever".
    state.collabs = [collab("c3", [{ id: "inv-overdue-active", lifecycleStatus: "OVERDUE" }])];
    state.overdueCascade = 2;

    const tasks = await pendingTasks(ACTOR);
    expect(tasks.some((t) => t.id === "payment-confirm:inv-overdue-active")).toBe(true);
    const generic = tasks.find((t) => t.kind === "overdue-invoice");
    expect(generic).toBeDefined();
    expect(generic?.id).toBe("overdue-invoice:FREELANCER:cascade");
    expect(generic?.title).toContain("1");
    expect(generic?.subtitle).toBe("Markeer de betaling zodra je bent betaald");
  });

  it("toont de legacy-overdue-rij met de 'volg op bij de opdrachtgever'-instructie", async () => {
    // Een legacy/handmatige overdue-factuur (geen cascade-lifecycle) komt nooit uit de collabs-loop en
    // valt volledig in het residu: hier is de opdrachtgever aan zet, dus de ZZP'er volgt op.
    state.overdueLegacy = 2;

    const tasks = await pendingTasks(ACTOR);
    const generic = tasks.find((t) => t.kind === "overdue-invoice");
    expect(generic).toBeDefined();
    expect(generic?.id).toBe("overdue-invoice:FREELANCER");
    expect(generic?.subtitle).toBe("Volg op bij de opdrachtgever");
    expect(generic?.title).toContain("2");
  });

  it("splitst legacy en cascade in twee aparte rijen met elk hun eigen instructie", async () => {
    // Een portefeuille met zowel een legacy-overdue-factuur (opdrachtgever aan zet) als een niet-surfaced
    // cascade-overdue-factuur (ZZP'er aan zet) toont beide rollups naast elkaar zonder key-botsing.
    state.overdueLegacy = 1;
    state.overdueCascade = 1;

    const tasks = await pendingTasks(ACTOR);
    const rows = tasks.filter((t) => t.kind === "overdue-invoice");
    expect(rows).toHaveLength(2);
    expect(rows.find((t) => t.id === "overdue-invoice:FREELANCER")?.subtitle).toBe(
      "Volg op bij de opdrachtgever",
    );
    expect(rows.find((t) => t.id === "overdue-invoice:FREELANCER:cascade")?.subtitle).toBe(
      "Markeer de betaling zodra je bent betaald",
    );
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
