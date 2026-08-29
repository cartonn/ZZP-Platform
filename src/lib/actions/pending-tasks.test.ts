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
  // Cascade-overdue-facturen voor het opdrachtgever-pad (clientTasks) — geserveerd op de
  // `lifecycleStatus === "OVERDUE"`-tak van de gedeelde invoice-mock.
  cascadeOverdue: [] as unknown[],
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn(async () => ({ identityVerifiedAt: new Date() })) },
    // De review-nudge-query (status COMPLETED) is een aparte findMany met eigen state; de
    // lopende (ACTIVE/PROPOSED) tak leest state.collabs. Zo isoleert elke test wat hij toetst.
    // De lopende tak haalt de prestatie-relatie `desc, take: 5` op (alleen de fase, via performances[0]);
    // we spiegelen dat venster hier met een slice(0, 5) zodat een test met >5 prestaties de échte
    // Prisma-windowing voelt (de mock gaf voorheen ongewindowd álle rijen terug).
    collaboration: {
      findMany: vi.fn(async (args?: { where?: { status?: unknown } }) => {
        if (args?.where?.status === "COMPLETED") return state.completedCollabs;
        return (state.collabs as ReturnType<typeof collab>[]).map((c) => ({
          ...c,
          performances: c.performances.slice(0, 5),
        }));
      }),
    },
    // Aparte, ONgewindowde query voor afgekeurde prestaties (herindien-taken) — losgekoppeld van de
    // `take: 5`-vensterrelatie hierboven zodat een afgekeurde vorige-cyclus-prestatie nooit uit het
    // actiecentrum valt. Afgeleid uit state.collabs: alle REJECTED-prestaties op ACTIVE-samenwerkingen.
    performance: {
      findMany: vi.fn(async () =>
        (state.collabs as ReturnType<typeof collab>[])
          .filter((c) => c.status === "ACTIVE")
          .flatMap((c) =>
            c.performances
              .filter((p) => p.status === "REJECTED")
              .map((p) => ({
                id: p.id,
                collaborationId: c.id,
                collaboration: { job: { title: c.job.title } },
              })),
          ),
      ),
    },
    // Aparte, ONgewindowde query voor de betaal-/concept-factuur-taken (openInvoices) — losgekoppeld van
    // de collabs-vensterrelatie zodat een factuur op een ouder-getekende (uit het updatedAt-venster
    // gevallen) samenwerking nooit stil uit het actiecentrum valt. Afgeleid uit state.collabs: alle
    // openstaande facturen (DRAFT/REJECTED/APPROVED/OVERDUE) op ACTIVE-samenwerkingen, oudste-eerst.
    invoice: {
      findMany: vi.fn(async (args?: { where?: { lifecycleStatus?: unknown } }) => {
        // Opdrachtgever-paden gebruiken een scalar `lifecycleStatus`-string: de cascade-overdue-nudge
        // ("OVERDUE") en de keur-query ("SUBMITTED"). Het freelancer-openInvoices-pad gebruikt een
        // `{ in: [...] }`-object en valt door naar de bestaande afleiding uit state.collabs.
        const ls = args?.where?.lifecycleStatus;
        if (ls === "OVERDUE") return state.cascadeOverdue;
        if (ls === "SUBMITTED") return [];
        return (state.collabs as ReturnType<typeof collab>[])
          .filter((c) => c.status === "ACTIVE")
          .flatMap((c) =>
            c.invoices
              .filter((i) =>
                ["DRAFT", "REJECTED", "APPROVED", "OVERDUE"].includes(i.lifecycleStatus),
              )
              .map((i) => ({
                id: i.id,
                lifecycleStatus: i.lifecycleStatus,
                createdAt: i.createdAt,
                collaborationId: c.id,
                collaboration: { job: { title: c.job.title } },
              })),
          )
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      }),
    },
    // Opdrachtgever-pad (clientTasks) — inert voor de freelancer-tests, maar nodig zodat de client-run
    // de cascade-overdue-query bereikt zonder te crashen.
    company: { findUnique: vi.fn(async () => null) },
    application: { count: vi.fn(async () => 0), findMany: vi.fn(async () => []) },
    job: { count: vi.fn(async () => 0), findMany: vi.fn(async () => []) },
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
vi.mock("@/lib/data/income-tax-deadline", () => ({
  getIncomeTaxDeadlineForActor: vi.fn(async () => null),
}));
vi.mock("@/lib/data/vat-deadline", () => ({
  getVatDeadlinesForActor: vi.fn(async () => []),
}));
vi.mock("@/lib/tax/hours-criterion-summary", () => ({
  getHoursCriterionSummary: vi.fn(async () => null),
  hoursCriterionNeedsAction: vi.fn(() => false),
}));

// Opdrachtgever-tak isoleren: de externe compliance-/koud-lopende-opdracht-loaders neutraliseren zodat
// de client-run uitsluitend de cascade-overdue-query raakt.
vi.mock("@/lib/collaboration-alerts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/collaboration-alerts")>();
  return { ...actual, clientCredentialAlerts: vi.fn(async () => []) };
});
vi.mock("@/lib/data/client-overdue-jobs", () => ({ getClientOverdueJobs: vi.fn(async () => []) }));
vi.mock("@/lib/data/client-cold-jobs", () => ({ getClientColdJobs: vi.fn(async () => []) }));

import { pendingTasks } from "@/lib/actions/pending-tasks";
import { prisma } from "@/lib/db";
import { P } from "@/lib/next-actions";
import { UNBILLED_AGING_DAYS } from "@/lib/unbilled-invoices";

const ACTOR = { id: "user-zzp", role: "FREELANCER", status: "ACTIVE" } as const;

function collab(
  id: string,
  invoices: { id: string; lifecycleStatus: string; createdAt?: Date }[],
  // Prestaties nieuwste-eerst (spiegelt de `orderBy: { createdAt: "desc" }` van de enumerator).
  // Default = één APPROVED-prestatie zodat de prestatie-tak stil blijft en de test de factuurtak isoleert.
  performances: { id: string; status: string }[] = [{ id: "perf-1", status: "APPROVED" }],
) {
  return {
    id,
    status: "ACTIVE",
    job: { title: "Verpleegkundige", credentialRequirements: [] },
    company: { name: "Zorgcentrum" },
    performances,
    // De enumerator leest `createdAt` voor de leeftijd van een concept-factuur; default = nu (vers).
    invoices: invoices.map((i) => ({ createdAt: new Date(), ...i })),
  };
}

beforeEach(() => {
  state.collabs = [];
  state.completedCollabs = [];
  state.overdueLegacy = 0;
  state.overdueCascade = 0;
  state.cascadeOverdue = [];
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

describe("freelancerTasks — prestatie-tak (afgekeurde prestatie zichtbaar, óók vorige cyclus)", () => {
  it("toont een herindien-taak voor de nieuwste afgekeurde prestatie", async () => {
    state.collabs = [collab("c-rej", [], [{ id: "perf-rej", status: "REJECTED" }])];

    const tasks = await pendingTasks(ACTOR);
    const resubmit = tasks.find((t) => t.id === "performance-resubmit:perf-rej");
    expect(resubmit).toBeDefined();
    expect(resubmit?.kind).toBe("performance-resubmit");
    expect(resubmit?.tone).toBe("attention");
  });

  it("toont de herindien-taak voor een AFGEKEURDE vorige-cyclus-prestatie die door een nieuwere is weggedrukt", async () => {
    // Multi-cyclus op één ACTIVE-samenwerking: cyclus-1-uren afgekeurd (perf-1, REJECTED), daarna
    // cyclus-2-uren ingediend + goedgekeurd (perf-2, APPROVED, nieuwer → performances[0]). De oude
    // enumerator keek alleen naar performances[0] (APPROVED) → géén taak, terwijl het geld voor de
    // afgekeurde cyclus-1-uren muurvast zit. Nu moet de herindien-taak voor perf-1 tóch verschijnen.
    state.collabs = [
      collab(
        "c-multi",
        [],
        [
          { id: "perf-2", status: "APPROVED" },
          { id: "perf-1", status: "REJECTED" },
        ],
      ),
    ];

    const tasks = await pendingTasks(ACTOR);
    const resubmit = tasks.find((t) => t.id === "performance-resubmit:perf-1");
    expect(resubmit).toBeDefined();
    expect(resubmit?.kind).toBe("performance-resubmit");
    // De goedgekeurde nieuwere prestatie levert géén prestatie-taak op (geen dubbele/valse rij).
    expect(tasks.some((t) => t.id === "performance-resubmit:perf-2")).toBe(false);
    expect(tasks.some((t) => t.kind === "performance-submit")).toBe(false);
  });

  it("emit één herindien-taak per afgekeurde prestatie (dedupe-veilig op prestatie-id)", async () => {
    state.collabs = [
      collab(
        "c-two-rej",
        [],
        [
          { id: "perf-b", status: "REJECTED" },
          { id: "perf-a", status: "REJECTED" },
        ],
      ),
    ];

    const tasks = await pendingTasks(ACTOR);
    const resubmits = tasks.filter((t) => t.kind === "performance-resubmit");
    expect(resubmits).toHaveLength(2);
    expect(new Set(resubmits.map((t) => t.id))).toEqual(
      new Set(["performance-resubmit:perf-a", "performance-resubmit:perf-b"]),
    );
  });

  it("een DRAFT-prestatie naast een afgekeurde vorige cyclus geeft zowel de indien- als de herindien-taak", async () => {
    state.collabs = [
      collab(
        "c-draft-plus-rej",
        [],
        [
          { id: "perf-draft", status: "DRAFT" },
          { id: "perf-old-rej", status: "REJECTED" },
        ],
      ),
    ];

    const tasks = await pendingTasks(ACTOR);
    expect(tasks.some((t) => t.id === "performance-submit:c-draft-plus-rej")).toBe(true);
    expect(tasks.some((t) => t.id === "performance-resubmit:perf-old-rej")).toBe(true);
  });

  it("toont de herindien-taak voor een afgekeurde prestatie die ACHTER >5 nieuwere prestaties wegviel (venster-blindheid)", async () => {
    // Multi-cyclus met veel cycli: cyclus-1-uren afgekeurd (perf-old-rej), daarna 6 nieuwere cycli
    // (perf-n6..perf-n1, allemaal APPROVED). De prestatie-relatie wordt `desc, take: 5` opgehaald, dus
    // de afgekeurde cyclus-1-prestatie valt volledig uit dat venster van 5 nieuwste rijen — de fase
    // (performances[0]) blijft correct APPROVED, maar de herindien-taak mocht daardoor niet stil
    // verdwijnen terwijl het geld voor die afgekeurde uren muurvast zit. De ongewindowde, status-
    // gefilterde query moet 'm tóch opleveren. Persona-sweep run 77 (venster-blindheid, sibling van 76).
    state.collabs = [
      collab(
        "c-window",
        [],
        [
          { id: "perf-n6", status: "APPROVED" },
          { id: "perf-n5", status: "APPROVED" },
          { id: "perf-n4", status: "APPROVED" },
          { id: "perf-n3", status: "APPROVED" },
          { id: "perf-n2", status: "APPROVED" },
          { id: "perf-n1", status: "APPROVED" },
          { id: "perf-old-rej", status: "REJECTED" },
        ],
      ),
    ];

    const tasks = await pendingTasks(ACTOR);
    expect(tasks.some((t) => t.id === "performance-resubmit:perf-old-rej")).toBe(true);
    // Geen valse taak voor de goedgekeurde nieuwere cycli, en geen indien-taak (fase = APPROVED).
    expect(tasks.filter((t) => t.kind === "performance-resubmit")).toHaveLength(1);
    expect(tasks.some((t) => t.kind === "performance-submit")).toBe(false);
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

// Determinisme-regressie: gewindowde queries (`take: MAX`) zonder `orderBy` geven Prisma geen
// gegarandeerde rijvolgorde, waardoor wélke rijen in het venster landen per request wisselt — een
// nog-openstaande next-action flikkert dan (verschijnt op de ene render, verdwijnt op de volgende).
// Deze tests borgen dat de twee eerder ongeorderde queries nu een deterministische `orderBy` meegeven.
const CLIENT_ACTOR = { id: "user-client", role: "CLIENT", status: "ACTIVE" } as const;

type FindManyArg = { where?: { lifecycleStatus?: unknown }; orderBy?: unknown };

function findManyCalls(fn: unknown): FindManyArg[] {
  return (fn as { mock: { calls: Array<[FindManyArg?]> } }).mock.calls
    .map((c) => c[0])
    .filter((a): a is FindManyArg => a !== undefined);
}

describe("next-action-engine — deterministische windowing (flicker-regressie)", () => {
  it("conversationParticipant.findMany ordent deterministisch vóór de MAX-slice", async () => {
    await pendingTasks(ACTOR);
    const calls = findManyCalls(prisma.conversationParticipant.findMany);
    expect(calls.length).toBeGreaterThan(0);
    // Elke aanroep moet een stabiele orderBy dragen; anders wisselt bij >MAX ongelezen gesprekken
    // welke MAX de berichttaken vullen → messageReplyTask flikkert.
    expect(calls.every((c) => c.orderBy !== undefined)).toBe(true);
    expect(calls[0]?.orderBy).toEqual({ conversationId: "asc" });
  });

  it("de cascade-overdue invoice.findMany (opdrachtgever) ordent deterministisch bij de MAX-limiet", async () => {
    state.cascadeOverdue = [
      {
        id: "inv-1",
        collaboration: {
          id: "collab-1",
          job: { title: "Nachtdienst" },
          freelancer: { user: { name: "Sanne" } },
        },
      },
    ];
    await pendingTasks(CLIENT_ACTOR);
    const overdueCall = findManyCalls(prisma.invoice.findMany).find(
      (c) => c.where?.lifecycleStatus === "OVERDUE",
    );
    expect(overdueCall).toBeDefined();
    // Oudste blijft staan → self-healing venster (zelfde conventie als openInvoices/credentialCollabs).
    expect(overdueCall?.orderBy).toEqual({ createdAt: "asc" });
  });
});
