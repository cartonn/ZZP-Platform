import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const state = vi.hoisted(() => ({
  role: "FREELANCER",
  rows: [] as ReturnType<typeof collaboration>[],
  denied: false,
  config: null as null | {
    dbaMinDurationMonths: number;
    dbaStrongDurationMonths: number;
    dbaRevenueConcentrationPct: number;
  },
  configRead: vi.fn(),
  listRead: vi.fn(),
}));
vi.mock("@/lib/authz", () => ({
  requireActor: async () => {
    if (state.denied) throw new Error("UNAUTHORIZED");
    return {
      id: state.role === "CLIENT" ? "client" : "worker",
      role: state.role,
    };
  },
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    platformConfig: {
      findUnique: (...args: unknown[]) => {
        state.configRead(...args);
        return state.config;
      },
    },
    collaboration: {
      groupBy: async () => [{ status: "ACTIVE", _count: { _all: 1 } }],
      findMany: async (args: { include?: unknown }) => {
        state.listRead(args);
        return args.include ? state.rows : [];
      },
    },
    invoice: { findMany: async () => [] },
    performance: { groupBy: async () => [] },
  },
}));
vi.mock("@/lib/invoices", () => ({ invoiceableCollaborationsWhere: () => ({}) }));
vi.mock("@/lib/data/client-reliability", () => ({ getOwnReliabilityForClient: async () => null }));
vi.mock("@/app/(protected)/samenwerkingen/actions", () => ({
  changeCollaborationStatus: async () => {},
  signContractFromList: async () => {},
}));
vi.mock("@/components/collaborations/cancel-form", () => ({ CancelCollaborationForm: () => null }));
vi.mock("@/components/collaborations/credential-reminder-button", () => ({
  CredentialReminderButton: () => null,
}));
vi.mock("@/components/agenda/agenda-subscribe", () => ({ AgendaSubscribe: () => null }));
vi.mock("@/components/ui/page-header", () => ({
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));
import Page from "@/app/(protected)/samenwerkingen/(index)/page";
function collaboration() {
  return {
    id: "synthetic-collaboration",
    status: "ACTIVE",
    contractStatus: "SIGNED",
    disputedAt: null as Date | null,
    rate: 45,
    createdAt: new Date(2026, 0, 15),
    updatedAt: new Date(2026, 0, 15),
    startDate: new Date(2026, 0, 15) as Date | null,
    endDate: null as Date | null,
    weekDays: null,
    job: {
      id: "synthetic-job",
      title: "Synthetische opdracht",
      dbaDirectSupervision: false,
      dbaEmbedded: false,
      dbaFixedSchedule: false,
      credentialRequirements: [],
    },
    company: { userId: "client", name: "Testbedrijf" },
    freelancer: {
      userId: "worker",
      user: { name: "Testwerker" },
      credentials: [],
    },
    performances: [],
    invoices: [],
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 3, 15));
  state.role = "FREELANCER";
  state.denied = false;
  state.config = {
    dbaMinDurationMonths: 3,
    dbaStrongDurationMonths: 9,
    dbaRevenueConcentrationPct: 80,
  };
  state.rows = [collaboration()];
  vi.clearAllMocks();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});
const render = async (sp = {}) =>
  renderToStaticMarkup(await Page({ searchParams: Promise.resolve(sp) }));
const badges = (html: string) =>
  [...html.matchAll(/title="DBA-aandachtspunt — geen juridisch oordeel"[^>]*>([^<]+)</g)].map(
    (m) => m[1],
  );
for (const role of ["FREELANCER", "CLIENT"]) {
  it.each([
    [3, 14, 3, 9, []],
    [3, 15, 3, 9, ["Verhoogd risico"]],
    [9, 14, 3, 9, ["Verhoogd risico"]],
    [9, 15, 3, 9, ["Hoog risico"]],
    [7, 15, 9, 15, []],
  ])(
    `${role}: configured boundary month %i day %i (%i/%i)`,
    async (month, day, minimum, strong, expected) => {
      state.role = role;
      vi.setSystemTime(new Date(2026, month as number, day as number));
      state.config!.dbaMinDurationMonths = minimum as number;
      state.config!.dbaStrongDurationMonths = strong as number;
      expect(badges(await render())).toEqual(expected);
      expect(state.configRead).toHaveBeenCalledExactlyOnceWith({ where: { id: "singleton" } });
    },
  );
  it.each([
    [5, []],
    [6, ["Verhoogd risico"]],
    [12, ["Hoog risico"]],
  ])(`${role}: missing configuration keeps default at %i months`, async (months, expected) => {
    state.role = role;
    state.config = null;
    vi.setSystemTime(new Date(2026, months as number, 15));
    expect(badges(await render())).toEqual(expected);
  });
}
it.each(["PROPOSED", "COMPLETED", "CANCELLED"])("suppresses DBA for %s", async (status) => {
  state.rows[0]!.status = status;
  expect(badges(await render())).toEqual([]);
});
it("retains the informational DBA badge during a dispute", async () => {
  state.rows[0]!.disputedAt = new Date();
  const html = await render();
  expect(badges(html)).toEqual(["Verhoogd risico"]);
  expect(html).toContain("werkproces bevroren");
});
it("preserves job indicators without a start date", async () => {
  state.rows[0]!.startDate = null;
  state.rows[0]!.job.dbaDirectSupervision = true;
  expect(badges(await render())).toEqual(["Hoog risico"]);
});
it("does not invent duration risk without a start date", async () => {
  state.rows[0]!.startDate = null;
  expect(badges(await render())).toEqual([]);
});
it("reads configuration once across rows and preserves ownership, filter and cursor", async () => {
  state.role = "CLIENT";
  vi.stubEnv("LIST_PAGE_SIZE", "2");
  state.rows = [
    collaboration(),
    { ...collaboration(), id: "second" },
    { ...collaboration(), id: "sentinel" },
  ];
  const html = await render({ status: "ACTIVE", cursor: "previous" });
  expect(badges(html)).toEqual(["Verhoogd risico", "Verhoogd risico"]);
  expect(state.configRead).toHaveBeenCalledTimes(1);
  expect(state.listRead.mock.calls[0]![0]).toMatchObject({
    where: {
      OR: [{ company: { userId: "client" } }, { freelancer: { userId: "client" } }],
      status: "ACTIVE",
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: 3,
    cursor: { id: "previous" },
    skip: 1,
  });
  expect(html).toContain("cursor=second");
  expect(html).not.toContain("/samenwerkingen/sentinel");
});
it("rejects unauthenticated access before configuration and collaboration reads", async () => {
  state.denied = true;
  await expect(render()).rejects.toThrow("UNAUTHORIZED");
  expect(state.configRead).not.toHaveBeenCalled();
  expect(state.listRead).not.toHaveBeenCalled();
});
