// Security-regressie (A01 — Broken Access Control / financiële manipulatie): bij het corrigeren-en-
// opnieuw-indienen van een prestatie krijgt de server twee onafhankelijke, client-gestuurde id's:
// `performanceId` (waarop ownership wordt gecheckt) en `collaborationId` (waaruit het uurtarief/ORT-
// profiel wordt gesnapshot). Zonder binding kon een ZZP'er zijn eigen (afgekeurde) prestatie
// corrigeren met het tarief van een ÁNDERE samenwerking — en zo zijn eigen, na het grace-venster
// auto-goedgekeurde factuur opblazen + andermans tarief inzien. Deze test bewijst dat de tarief-bron
// hard aan de eigen samenwerking van de prestatie is gebonden; zonder die check faalt hij.

import { describe, it, expect, vi, beforeEach } from "vitest";

const updatePerformance = vi.hoisted(() => vi.fn(async () => {}));
const submitPerformance = vi.hoisted(() => vi.fn(async () => {}));
const performanceFindUnique = vi.hoisted(() => vi.fn());
const collaborationFindUnique = vi.hoisted(() =>
  vi.fn(async () => ({ rate: 50, ortProfile: null, ortCustomRates: null })),
);

vi.mock("@/lib/authz", () => ({
  requireActor: vi.fn(async () => ({ id: "user-1", role: "FREELANCER", status: "ACTIVE" })),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/audit", () => ({ audit: vi.fn(async () => {}) }));
vi.mock("@/lib/db", () => ({
  prisma: {
    performance: { findUnique: performanceFindUnique },
    collaboration: { findUnique: collaborationFindUnique },
  },
}));
vi.mock("@/lib/cascade/commands", () => {
  class CascadeError extends Error {}
  const noop = vi.fn(async () => {});
  return {
    CascadeError,
    signContract: noop,
    createPerformance: vi.fn(async () => "perf-new"),
    updatePerformance,
    submitPerformance,
    approvePerformance: noop,
    rejectPerformance: noop,
    submitInvoice: noop,
    approveInvoice: noop,
    rejectInvoice: noop,
    confirmPayment: noop,
    creditInvoice: noop,
    openDispute: noop,
    resolveDispute: noop,
  };
});

import { editAndResubmitPerformanceAction } from "./actions";

/** Geldige MILESTONE-invoer (heeft geen uurtarief nodig) zodat de parse na de guard slaagt. */
function milestoneForm(): FormData {
  const fd = new FormData();
  fd.set("type", "MILESTONE");
  fd.set("milestoneTitle", "Oplevering fase 1");
  fd.set("amount", "100");
  return fd;
}

beforeEach(() => {
  updatePerformance.mockClear();
  submitPerformance.mockClear();
  performanceFindUnique.mockReset();
});

describe("editAndResubmitPerformanceAction — tarief-bron gebonden aan de eigen samenwerking", () => {
  it("weigert een collaborationId dat niet bij de prestatie hoort (geen tarief-injectie)", async () => {
    performanceFindUnique.mockResolvedValue({
      collaborationId: "col-eigen",
      collaboration: { freelancer: { userId: "user-1" } },
    });

    const result = await editAndResubmitPerformanceAction(
      "perf-1",
      "col-vreemd", // tarief van een ándere samenwerking
      null,
      milestoneForm(),
    );

    expect(result).toMatch(/komt niet overeen/i);
    expect(updatePerformance).not.toHaveBeenCalled();
    expect(submitPerformance).not.toHaveBeenCalled();
  });

  it("weigert andermans prestatie met exact dezelfde melding als een onbekend id (anti-oracle)", async () => {
    // Een prestatie van een andere samenwerking en een onbekend id geven exact dezelfde melding:
    // een afwijkende tekst ("geen toegang" vs "niet gevonden") verried anders of het id bestaat maar
    // bij een andere samenwerking hoort (CWE-203 existence-oracle).
    performanceFindUnique.mockResolvedValue({
      collaborationId: "col-eigen",
      collaboration: { freelancer: { userId: "iemand-anders" } },
    });
    const notOwned = await editAndResubmitPerformanceAction(
      "perf-1",
      "col-eigen",
      null,
      milestoneForm(),
    );

    performanceFindUnique.mockResolvedValue(null);
    const unknown = await editAndResubmitPerformanceAction(
      "perf-1",
      "col-eigen",
      null,
      milestoneForm(),
    );

    expect(notOwned).toBe(unknown);
    expect(notOwned).toBe("Prestatie niet gevonden.");
    expect(updatePerformance).not.toHaveBeenCalled();
  });

  it("laat de eigen prestatie met de eigen samenwerking gewoon door", async () => {
    performanceFindUnique.mockResolvedValue({
      collaborationId: "col-eigen",
      collaboration: { freelancer: { userId: "user-1" } },
    });

    const result = await editAndResubmitPerformanceAction(
      "perf-1",
      "col-eigen",
      null,
      milestoneForm(),
    );

    expect(result).toBeNull();
    expect(updatePerformance).toHaveBeenCalledWith(
      expect.objectContaining({ id: "user-1" }),
      "perf-1",
      expect.objectContaining({ type: "MILESTONE" }),
    );
    expect(submitPerformance).toHaveBeenCalledWith(
      expect.objectContaining({ id: "user-1" }),
      "perf-1",
    );
  });
});
