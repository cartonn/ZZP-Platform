import { beforeEach, expect, it, vi } from "vitest";
import { LegacySigningEvidenceError } from "@/lib/signing-contract";

const state = vi.hoisted(() => ({
  actor: vi.fn(),
  findUnique: vi.fn(),
  previewPdf: vi.fn(),
  view: vi.fn(),
  evidencePdf: vi.fn(),
  audit: vi.fn(),
  denied: vi.fn(),
}));
vi.mock("@/lib/authz", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/authz")>()),
  requireActor: state.actor,
}));
vi.mock("@/lib/db", () => ({ prisma: { collaboration: { findUnique: state.findUnique } } }));
vi.mock("@/lib/audit", () => ({ audit: state.audit }));
vi.mock("@/lib/security/access-audit", () => ({ auditDeniedAccess: state.denied }));
vi.mock("@/lib/request-meta", () => ({ requestMeta: async () => ({}) }));
vi.mock("@/lib/rate-limit-guard", () => ({ enforceRateLimit: async () => null }));
vi.mock("@/lib/contract-pdf", () => ({ buildModelAgreementPdf: state.previewPdf }));
vi.mock("@/lib/signing-service", () => ({ loadSigningView: state.view }));
vi.mock("@/lib/signing-evidence-pdf", () => ({ buildSigningEvidencePdf: state.evidencePdf }));
import { GET } from "./modelovereenkomst/route";

function collaboration() {
  return {
    status: "PROPOSED",
    contractStatus: "DRAFT",
    signing: null,
    signingEvidenceErasedAt: null,
    rate: 80,
    startDate: null,
    endDate: null,
    agreementType: null,
    agreementFreelancerSignedAt: new Date("2025-01-01"),
    agreementClientSignedAt: new Date("2025-01-02"),
    company: { userId: "client", name: "Synthetic company" },
    freelancer: { userId: "freelancer", user: { name: "Synthetic freelancer" } },
    job: {
      title: "Mutable current title",
      description: "Mutable current scope",
      modelAgreementType: null,
      dbaDirectSupervision: false,
      dbaEmbedded: false,
      dbaFixedSchedule: false,
      dbaNoSubstitution: false,
      dbaExclusive: false,
      dbaWeakEntrepreneurship: false,
      dbaDurationMonths: null,
    },
  };
}
const get = () =>
  GET(new Request("https://handslag.test/api/samenwerkingen/col/modelovereenkomst"), {
    params: Promise.resolve({ id: "col" }),
  });

beforeEach(() => {
  vi.resetAllMocks();
  state.actor.mockResolvedValue({ id: "client", role: "CLIENT", status: "ACTIVE" });
  state.findUnique.mockResolvedValue(collaboration());
  state.previewPdf.mockResolvedValue(Buffer.from("%PDF-synthetic-preview"));
  state.evidencePdf.mockResolvedValue(Buffer.from("%PDF-preserved-evidence"));
});

it.each([
  ["ACTIVE", "SIGNED"],
  ["COMPLETED", "SIGNED"],
  ["CANCELLED", "SIGNED"],
  ["PROPOSED", "SIGNED"],
] as const)(
  "does not reconstruct a %s/%s agreement from mutable current fields",
  async (status, contractStatus) => {
    state.findUnique.mockResolvedValue({ ...collaboration(), status, contractStatus });
    const response = await get();
    expect(response.status).toBe(409);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ error: new LegacySigningEvidenceError().message });
    expect(state.previewPdf).not.toHaveBeenCalled();
    expect(state.evidencePdf).not.toHaveBeenCalled();
    expect(state.view).not.toHaveBeenCalled();
  },
);

it("an unsigned proposal remains previewable without turning legacy timestamps into signature claims", async () => {
  const response = await get();
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("application/pdf");
  const args = state.previewPdf.mock.calls[0]![0];
  expect(args.content).toBeDefined();
  expect(args.signatories).toHaveLength(2);
  for (const signatory of args.signatories) {
    expect(signatory.status).toContain("geen ondertekenbewijs");
    expect(signatory.status).not.toContain("Digitaal akkoord");
    expect(signatory.status).not.toContain("2025");
  }
});

it("a genuine retained signing uses its evidence path and never rebuilds mutable terms", async () => {
  state.findUnique.mockResolvedValue({
    ...collaboration(),
    status: "ACTIVE",
    contractStatus: "SIGNED",
    signing: { collaborationId: "col" },
  });
  const retainedView = {
    document: { jobTitle: "Original title" },
    col: { signing: { documentHash: "original" } },
  };
  state.view.mockResolvedValue(retainedView);
  const response = await get();
  expect(response.status).toBe(200);
  expect(Buffer.from(await response.arrayBuffer()).toString()).toBe("%PDF-preserved-evidence");
  expect(state.evidencePdf).toHaveBeenCalledWith(retainedView);
  expect(state.previewPdf).not.toHaveBeenCalled();
});

it("loss of the retained record between reads returns conflict instead of a replacement PDF", async () => {
  state.findUnique.mockResolvedValue({
    ...collaboration(),
    status: "ACTIVE",
    contractStatus: "SIGNED",
    signing: { collaborationId: "col" },
  });
  state.view.mockRejectedValue(new LegacySigningEvidenceError());
  const response = await get();
  expect(response.status).toBe(409);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(state.evidencePdf).not.toHaveBeenCalled();
  expect(state.previewPdf).not.toHaveBeenCalled();
});

it("a foreign viewer cannot learn that a legacy original is absent", async () => {
  state.actor.mockResolvedValue({ id: "outsider", role: "CLIENT", status: "ACTIVE" });
  state.findUnique.mockResolvedValue({
    ...collaboration(),
    status: "ACTIVE",
    contractStatus: "SIGNED",
  });
  const response = await get();
  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({ error: "Niet gevonden." });
  expect(state.previewPdf).not.toHaveBeenCalled();
});
