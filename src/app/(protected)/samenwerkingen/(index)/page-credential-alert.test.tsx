import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const state = vi.hoisted(() => ({
  role: "FREELANCER",
  rows: [] as ReturnType<typeof collaboration>[],
}));
vi.mock("@/lib/authz", () => ({
  requireActor: async () => ({
    id: state.role === "CLIENT" ? "client" : "worker",
    role: state.role,
  }),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    platformConfig: { findUnique: async () => null },
    collaboration: {
      groupBy: async () => [{ status: "ACTIVE", _count: { _all: 1 } }],
      findMany: async (args: { include?: unknown }) => (args.include ? state.rows : []),
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
import { assessCollaborationCredentials } from "@/lib/collaboration-alerts";
const now = new Date("2026-09-26T12:00:00Z");
const expiry = new Date("2026-11-10T12:00:00Z");
const end = new Date("2026-12-25T12:00:00Z");
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  state.rows = [collaboration()];
});
function collaboration() {
  return {
    id: "synthetic-collaboration",
    status: "ACTIVE",
    contractStatus: "SIGNED",
    disputedAt: null as Date | null,
    rate: 45,
    createdAt: now,
    updatedAt: now,
    startDate: now,
    endDate: end as Date | null,
    weekDays: null,
    job: {
      id: "synthetic-job",
      title: "Synthetische opdracht",
      dbaDirectSupervision: false,
      dbaEmbedded: false,
      dbaFixedSchedule: false,
      credentialRequirements: [{ credentialType: "VOG" }],
    },
    company: { userId: "client", name: "Testbedrijf" },
    freelancer: {
      userId: "worker",
      user: { name: "Testwerker" },
      credentials: [{ type: "VOG", status: "VERIFIED", expiresAt: expiry }],
    },
    performances: [],
    invoices: [],
  };
}
afterEach(() => vi.useRealTimers());
for (const role of ["FREELANCER", "CLIENT"]) {
  it(`${role}: a verified credential that expires mid-placement renders an expiry warning, not in-review`, async () => {
    state.role = role;
    const alert = assessCollaborationCredentials(
      ["VOG"],
      [{ type: "VOG", status: "VERIFIED", expiresAt: expiry }],
      now,
      undefined,
      end,
    );
    expect(alert).toEqual({
      status: "WARNING",
      missing: [],
      expired: [],
      expiringSoon: [],
      expiringDuringPlacement: ["VOG"],
      inReview: [],
    });
    const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({}) }));
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    expect(text).toContain(
      role === "CLIENT"
        ? "Certificaat van Testwerker verloopt tijdens de opdracht: VOG."
        : "Je VOG verloopt tijdens de opdracht.",
    );
    if (role === "FREELANCER") expect(html).toContain('href="/certificaten"');
    expect(text).not.toContain("in beoordeling");
  });
}
for (const role of ["FREELANCER", "CLIENT"]) {
  it(`${role}: control — expiry inside 30-day window is rendered with type`, async () => {
    state.role = role;
    state.rows[0]!.freelancer.credentials[0]!.expiresAt = new Date("2026-10-10T12:00:00Z");
    const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("VOG");
    expect(html).toContain("verloopt binnenkort");
    expect(html).not.toContain("in beoordeling");
  });
  it(`${role}: control — no placement end means no mid-placement warning`, async () => {
    state.role = role;
    state.rows[0]!.endDate = null;
    const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({}) }));
    expect(html).not.toContain("in beoordeling");
    expect(html).not.toContain("verloopt");
  });
  it(`${role}: control — a dispute suppresses the compliance warning`, async () => {
    state.role = role;
    state.rows[0]!.disputedAt = now;
    const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({}) }));
    expect(html).not.toContain("in beoordeling");
    expect(html).not.toContain("verloopt");
  });
}

for (const role of ["FREELANCER", "CLIENT"]) {
  it(`${role}: a submitted credential still renders the in-review warning`, async () => {
    state.role = role;
    state.rows[0]!.freelancer.credentials[0]!.status = "SUBMITTED";
    const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("in beoordeling");
    expect(html).toContain("VOG");
    expect(html).not.toContain("verloopt tijdens de opdracht");
  });
  it(`${role}: an expired requirement takes priority over mid-placement expiry`, async () => {
    state.role = role;
    state.rows[0]!.job.credentialRequirements.push({ credentialType: "DIPLOMA" });
    state.rows[0]!.freelancer.credentials.push({
      type: "DIPLOMA",
      status: "VERIFIED",
      expiresAt: new Date("2026-09-25T12:00:00Z"),
    });
    const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("is verlopen");
    expect(html).toContain("Diploma");
    expect(html).not.toContain("verloopt tijdens de opdracht");
  });
}
