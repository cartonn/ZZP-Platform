import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  actor: vi.fn(),
  invoice: vi.fn(),
  paidInvoices: vi.fn(),
  reminder: vi.fn(),
}));
vi.mock("@/lib/authz", () => ({ requireActor: state.actor }));
vi.mock("@/lib/db", () => ({
  prisma: {
    invoice: { findUnique: state.invoice, findMany: state.paidInvoices },
    auditLog: { findFirst: state.reminder },
  },
}));
vi.mock("../actions", () => ({
  sendInvoice: vi.fn(),
  cancelInvoice: vi.fn(),
  markInvoicePaid: vi.fn(),
  sendPaymentReminder: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("not-found");
  },
}));
// The unrelated translated async badge is outside this synchronous page render probe.
vi.mock("@/components/invoices/invoice-status-badge", () => ({
  InvoiceStatusBadge: ({ status }: { status: string }) => <span>{status}</span>,
}));
import FactuurDetailPage from "./page";

type Status = "DRAFT" | "SENT" | "OVERDUE";
type Party = "FREELANCER" | "CLIENT";
const mutationLabels = ["Versturen", "Annuleren", "Markeer als betaald"];
function invoice(status: Status, disputed: boolean, lifecycleStatus: string | null = null) {
  return {
    id: "invoice",
    number: "INV-SYNTHETIC",
    partyInvoiceNumber: null,
    status,
    lifecycleStatus,
    totalCents: 12500,
    subtotalCents: null,
    vatCents: null,
    vatRegime: null,
    issuedAt: new Date("2026-01-01"),
    dueAt: null,
    createdAt: new Date("2026-01-01"),
    lines: [],
    performance: null,
    collaboration: {
      id: "collaboration",
      disputedAt: disputed ? new Date("2026-09-17") : null,
      ortProfile: null,
      ortCustomRates: null,
      job: { title: "Synthetic assignment" },
      company: { id: "company", userId: "client", name: "Synthetic client" },
      freelancer: {
        userId: "freelancer",
        kvkNumber: null,
        btwNumber: null,
        iban: null,
        user: { name: "Synthetic freelancer" },
      },
    },
  };
}
async function render(
  party: Party,
  status: Status,
  disputed: boolean,
  lifecycle: string | null = null,
) {
  state.actor.mockResolvedValue({ id: party.toLowerCase(), role: party, status: "ACTIVE" });
  state.invoice.mockResolvedValue(invoice(status, disputed, lifecycle));
  const html = renderToStaticMarkup(
    await FactuurDetailPage({ params: Promise.resolve({ id: "invoice" }) }),
  );
  const buttons = Array.from(html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g), (match) =>
    match[1]!.replace(/<[^>]+>/g, "").trim(),
  );
  return { html, mutations: buttons.filter((text) => mutationLabels.includes(text)) };
}
beforeEach(() => {
  vi.resetAllMocks();
  state.paidInvoices.mockResolvedValue([]);
  state.reminder.mockResolvedValue(null);
});

const scenarios: Array<[Party, Status, string[]]> = [
  ["FREELANCER", "DRAFT", ["Versturen", "Annuleren"]],
  ["FREELANCER", "SENT", ["Annuleren"]],
  ["FREELANCER", "OVERDUE", ["Annuleren"]],
  ["CLIENT", "DRAFT", []],
  ["CLIENT", "SENT", ["Markeer als betaald"]],
  ["CLIENT", "OVERDUE", ["Markeer als betaald"]],
];
it.each(scenarios)("%s sees no status actions on disputed legacy %s", async (party, status) => {
  const { html, mutations } = await render(party, status, true);
  expect(html).toContain("In dispuut");
  expect(mutations).toEqual([]);
  expect(html).toContain('href="/api/facturen/invoice/pdf"');
  expect(html).toContain("INV-SYNTHETIC");
  expect(html).not.toContain('data-approval="approved"');
});
it.each(scenarios)(
  "%s retains the allowed actions on undisputed legacy %s",
  async (party, status, allowed) => {
    const { html, mutations } = await render(party, status, false);
    expect(mutations).toEqual(allowed);
    expect(html).not.toContain("In dispuut");
  },
);
it.each(["FREELANCER", "CLIENT"] as const)(
  "%s never receives legacy controls on cascade invoices",
  async (party) => {
    expect((await render(party, "SENT", false, "APPROVED")).mutations).toEqual([]);
  },
);
it("denies an unrelated user before rendering invoice controls", async () => {
  state.actor.mockResolvedValue({ id: "outsider", role: "CLIENT", status: "ACTIVE" });
  state.invoice.mockResolvedValue(invoice("SENT", true));
  await expect(FactuurDetailPage({ params: Promise.resolve({ id: "invoice" }) })).rejects.toThrow(
    "not-found",
  );
  expect(state.reminder).not.toHaveBeenCalled();
  expect(state.paidInvoices).not.toHaveBeenCalled();
});
