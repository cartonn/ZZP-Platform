import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { isValidElement, type ReactNode } from "react";
const state = vi.hoisted(() => ({
  actorId: "worker",
  config: null as null | {
    dbaMinDurationMonths: number;
    dbaStrongDurationMonths: number;
    dbaRevenueConcentrationPct: number;
  },
  configRead: vi.fn(),
}));
vi.mock("@/lib/authz", () => ({
  requireActor: async () => ({ id: state.actorId, role: "FREELANCER" }),
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    collaboration: {
      findUnique: async () => ({
        id: "synthetic",
        status: "ACTIVE",
        contractStatus: "SIGNED",
        disputedAt: null,
        startDate: new Date(2026, 0, 1),
        endDate: null,
        createdAt: new Date(2026, 0, 1),
        completedAt: null,
        rate: 50,
        weekdays: null,
        signing: null,
        job: {
          id: "job",
          title: "Test",
          credentialRequirements: [],
          dbaDirectSupervision: false,
          dbaEmbedded: false,
          dbaFixedSchedule: false,
        },
        company: { userId: "client", name: "Testbedrijf" },
        freelancer: { userId: "worker", user: { name: "Testwerker" }, credentials: [] },
        performances: [],
        invoices: [],
        reviews: [],
        noShowReports: [],
        shiftHandoffs: [],
      }),
    },
    platformConfig: {
      findUnique: (...args: unknown[]) => {
        state.configRead(...args);
        return state.config;
      },
    },
  },
}));
vi.mock("@/lib/data/payment-behavior", () => ({ getPaymentBehaviorForCompany: async () => null }));
vi.mock("./actions", () => ({
  openDisputeAction: async () => {},
  resolveDisputeAction: async () => {},
}));
vi.mock("./performance-form", () => ({ PerformanceForm: () => null }));
vi.mock("./ort-profile-form", () => ({ OrtProfileForm: () => null }));
vi.mock("./weekdays-form", () => ({ WeekdaysForm: () => null }));
vi.mock("./review-form", () => ({ ReviewForm: () => null }));
vi.mock("./model-agreement-card", () => ({ ModelAgreementCard: () => null }));
vi.mock("@/components/collaborations/no-show-form", () => ({ NoShowReportForm: () => null }));
vi.mock("@/components/collaborations/shift-handoff-form", () => ({ ShiftHandoffForm: () => null }));
vi.mock("@/components/collaborations/shift-handoff-cancel-form", () => ({
  ShiftHandoffCancelForm: () => null,
}));
import Page from "./page";
import { DbaDurationForecastNote } from "@/components/collaborations/dba-duration-forecast-note";
// Inspect server-produced nodes without executing unrelated interactive child components.
function nodes(node: ReactNode): Array<React.ReactElement<Record<string, unknown>>> {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return [node, ...nodes(node.props.children as ReactNode)];
}
function text(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(text).join(" ");
  return isValidElement<{ children?: ReactNode }>(node) ? text(node.props.children) : "";
}
const render = () => Page({ params: Promise.resolve({ id: "synthetic" }) });
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 3, 15));
  state.actorId = "worker";
  state.config = {
    dbaMinDurationMonths: 3,
    dbaStrongDurationMonths: 9,
    dbaRevenueConcentrationPct: 80,
  };
  state.configRead.mockClear();
});
afterEach(() => vi.useRealTimers());
it("uses persisted thresholds for the active collaboration signal", async () => {
  expect(text(await render())).toContain("Deze opdracht loopt inmiddels 3 maanden");
  expect(state.configRead).toHaveBeenCalledWith({ where: { id: "singleton" } });
});
it("uses the same persisted thresholds for the upcoming duration forecast", async () => {
  vi.setSystemTime(new Date(2026, 2, 15));
  const forecast = nodes(await render()).find((node) => node.type === DbaDurationForecastNote);
  expect(forecast?.props.forecast).toMatchObject({ thresholdMonths: 3, level: "VERHOOGD" });
});
it("keeps default duration behavior when no configuration row exists", async () => {
  state.config = null;
  vi.setSystemTime(new Date(2026, 6, 15));
  expect(text(await render())).toContain("Deze opdracht loopt inmiddels 6 maanden");
});
it("rejects a nonparticipant before reading platform configuration", async () => {
  state.actorId = "outsider";
  await expect(render()).rejects.toThrow("NOT_FOUND");
  expect(state.configRead).not.toHaveBeenCalled();
});

it("never forecasts a downgrade after a legacy inverted strong threshold", async () => {
  state.config = {
    dbaMinDurationMonths: 12,
    dbaStrongDurationMonths: 6,
    dbaRevenueConcentrationPct: 80,
  };
  vi.setSystemTime(new Date(2026, 11, 15));
  const page = await render();
  expect(text(page)).toContain("Hoog risico");
  const forecast = nodes(page).find((node) => node.type === DbaDurationForecastNote);
  expect(forecast).toBeUndefined();
});
it("preserves the strong boundary before a legacy inverted crossing", async () => {
  state.config = {
    dbaMinDurationMonths: 12,
    dbaStrongDurationMonths: 6,
    dbaRevenueConcentrationPct: 80,
  };
  vi.setSystemTime(new Date(2026, 5, 15));
  const forecast = nodes(await render()).find((node) => node.type === DbaDurationForecastNote);
  expect(forecast?.props.forecast).toMatchObject({ thresholdMonths: 6, level: "HOOG" });
});
