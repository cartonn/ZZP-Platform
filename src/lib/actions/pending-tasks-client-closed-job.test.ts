// Regressietest voor de next-action-engine (opdrachtgever): kandidaat-BEOORDEELtaken — "nieuwe
// reacties · beoordeel de kandidaten" (`applications-review`), de eerste-reactie-SLA
// (`first-look-overdue`) en de reeds-bekeken-wachtende kandidaat (`stale-applications`) — mogen NIET
// blijven staan zodra de opdrachtgever de opdracht heeft GESLOTEN (PUBLISHED→CLOSED) of teruggezet
// naar concept (PUBLISHED→DRAFT).
//
// Bug (gevonden run 103): het sluiten van een opdracht laat de open reacties (NEW/VIEWED/SHORTLIST) in
// de DB staan — `changeJobStatus` stuurt ze alleen een "de opdracht is weg"-notificatie, het
// transitioneert de reacties niet. De drie beoordeel-queries in `clientTasks` filterden op
// `job.company.userId` + reactiestatus, maar NIET op `job.status`. Gevolg: "beoordeel de kandidaten"
// bleef eeuwig hangen op een gesloten/concept-opdracht — in tegenspraak met de server-side status en
// met de melding die die kandidaten juist al kregen. De opdracht-nudges (cold/overdue) scopen wél op
// `status: "PUBLISHED"`; alleen de kandidaat-queries deden dat niet.
//
// Deze test modelleert een wereld waarin álle open reacties op een NIET-PUBLISHED opdracht staan: een
// correcte, `job.status: "PUBLISHED"`-gescoopte query levert ze niet op (0/[]), een ongefilterde
// (buggy) query telt ze wél mee. Vóór de fix verschenen de beoordeeltaken → rood; ná de fix niet →
// groen. De ACCEPTED→samenwerkingsvoorstel-taak blijft bewust wél staan (een hire-toezegging die het
// sluiten overleeft) en wordt hier apart geverifieerd.

import { describe, it, expect, vi } from "vitest";

const NOW = Date.now();
const daysAgo = (d: number) => new Date(NOW - d * 86_400_000);

type WhereArg = {
  where?: {
    job?: { status?: unknown };
    status?: unknown;
    createdAt?: unknown;
  };
};

const isPublishedScoped = (args?: WhereArg) => args?.where?.job?.status === "PUBLISHED";

vi.mock("@/lib/db", () => ({
  prisma: {
    company: { findUnique: vi.fn(async () => null) },
    application: {
      // Wereld: NEW/VIEWED/SHORTLIST-reacties bestaan, maar allemaal op een GESLOTEN opdracht.
      // Een PUBLISHED-gescoopte query ziet ze dus niet; een ongefilterde query telt ze mee.
      count: vi.fn(async (args: WhereArg) => {
        if (isPublishedScoped(args)) return 0; // correcte, LIVE-gescoopte query
        // Bug-pad (ongefilterd op job.status): de generieke NEW-telling (geen createdAt) ziet 4
        // closed-job-reacties; de aging-telling (mét createdAt) ziet er 2 die de ghosting-drempel
        // haalden. Beide zouden zonder de fix een beoordeeltaak opleveren op een gesloten opdracht.
        return args?.where?.createdAt != null ? 2 : 4;
      }),
      findMany: vi.fn(async (args: WhereArg) => {
        if (isPublishedScoped(args)) return []; // correcte, LIVE-gescoopte query
        const status = args?.where?.status;
        // staleCandidates: status ∈ {VIEWED, SHORTLIST} → één wachtende kandidaat op de gesloten opdracht.
        if (status && typeof status === "object" && "in" in status) {
          return [{ status: "VIEWED", createdAt: daysAgo(40), collaboration: null }];
        }
        // first-look aging (status "NEW"): twee echt-oude, onbekeken reacties op de gesloten opdracht.
        if (status === "NEW") {
          return [{ createdAt: daysAgo(20) }, { createdAt: daysAgo(15) }];
        }
        // acceptedCandidates (status "ACCEPTED") en overige: leeg.
        return [];
      }),
    },
    job: { count: vi.fn(async () => 0), findMany: vi.fn(async () => []) },
    collaboration: { findMany: vi.fn(async () => []) },
    performance: { findMany: vi.fn(async () => []) },
    invoice: { findMany: vi.fn(async () => []) },
    conversationParticipant: { findMany: vi.fn(async () => []) },
    message: { groupBy: vi.fn(async () => []) },
    conversation: { findMany: vi.fn(async () => []) },
  },
}));

// Overige opdrachtgever-signalen uitgeschakeld zodat alleen de reactie-tak overblijft.
vi.mock("@/lib/signals", () => ({
  overdueInvoiceCount: vi.fn(async () => 0),
  overdueInvoiceBreakdown: vi.fn(async () => ({ legacy: 0, cascade: 0 })),
  paymentDueSoonCount: vi.fn(async () => 0),
}));
vi.mock("@/lib/data/income-tax-deadline", () => ({
  getIncomeTaxDeadlineForActor: vi.fn(async () => null),
}));
vi.mock("@/lib/data/vat-deadline", () => ({ getVatDeadlinesForActor: vi.fn(async () => []) }));
vi.mock("@/lib/collaboration-alerts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/collaboration-alerts")>();
  return { ...actual, clientCredentialAlerts: vi.fn(async () => []) };
});
vi.mock("@/lib/data/client-overdue-jobs", () => ({ getClientOverdueJobs: vi.fn(async () => []) }));
vi.mock("@/lib/data/client-cold-jobs", () => ({ getClientColdJobs: vi.fn(async () => []) }));
vi.mock("@/lib/data/client-draft-jobs", () => ({ getClientDraftJobs: vi.fn(async () => []) }));

import { pendingTasks } from "@/lib/actions/pending-tasks";

const ACTOR = { id: "user-client", role: "CLIENT", status: "ACTIVE" } as const;

describe("clientTasks — kandidaat-beoordeeltaken verdwijnen op een gesloten/concept-opdracht", () => {
  it("geen 'beoordeel de kandidaten' voor reacties op een NIET-PUBLISHED opdracht", async () => {
    const tasks = await pendingTasks(ACTOR);
    expect(tasks.find((t) => t.kind === "applications-review")).toBeUndefined();
  });

  it("geen eerste-reactie-taak voor reacties op een NIET-PUBLISHED opdracht", async () => {
    const tasks = await pendingTasks(ACTOR);
    expect(tasks.find((t) => t.kind === "first-look-overdue")).toBeUndefined();
  });

  it("geen 'wachtende kandidaat'-taak voor een reactie op een NIET-PUBLISHED opdracht", async () => {
    const tasks = await pendingTasks(ACTOR);
    expect(tasks.find((t) => t.kind === "stale-applications")).toBeUndefined();
  });
});
