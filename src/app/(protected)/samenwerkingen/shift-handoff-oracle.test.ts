// Anti-oracle-contract voor de shift-overname-acties (CWE-203 / OWASP A01 Broken Access Control).
//
// requestShiftHandoff: het `candidateFreelancerId`-veld (een FreelancerProfile.id) is direct via de
// server-action aanroepbaar (staat niet in het formulier). Vóór de fix gaf een ONBEKENDE kandidaat
// ("Voorgestelde overnemer niet gevonden.") en een BESTAANDE kandidaat buiten de tenant ("De
// voorgestelde overnemer valt buiten deze bemiddeling.") onderscheidbare meldingen — waarmee een
// ZZP'er het bestaan + tenant-lidmaatschap van een willekeurig profiel kon aftasten. Na de fix geven
// beide exact dezelfde melding ("Ongeldige voorgestelde overnemer."); zelf-voorstellen houdt een eigen
// melding (dat lekt niets).
//
// cancelShiftHandoff: vóór de fix onderscheidde een onbekend id ("Overname-aanvraag niet gevonden.")
// van andermans aanvraag ("Alleen de aanvrager kan..."). Na de fix identiek; de IDOR-poging op een
// bestaand-maar-vreemd id wordt geaudit (SHIFT_HANDOFF_CANCEL_DENIED).

import { describe, it, expect, vi, beforeEach } from "vitest";
import { type Actor } from "@/lib/authz";

const dbState = vi.hoisted(() => ({
  candidate: null as { id: string; userId: string; tenantId: string | null } | null,
  handoff: null as {
    id: string;
    status: string;
    requestedByUserId: string;
    collaborationId: string;
  } | null,
}));

const db = vi.hoisted(() => ({
  collabFind: vi.fn(async () => ({
    id: "c-1",
    status: "ACTIVE",
    disputedAt: null,
    freelancer: { userId: "zzp-1" },
    job: { title: "Nachtdienst VVT", tenantId: "tenant-A" },
  })),
  profileFind: vi.fn(async () => dbState.candidate),
  handoffFindFirst: vi.fn(async () => null),
  handoffCreate: vi.fn(async () => ({ id: "h-new" })),
  handoffFindUnique: vi.fn(async () => dbState.handoff),
  handoffUpdateMany: vi.fn(async () => ({ count: 1 })),
  userFindMany: vi.fn(async () => []),
  auditCreate: vi.fn(async (_a: { data: Record<string, unknown> }) => ({})),
  tx: vi.fn(async (arg: unknown) =>
    typeof arg === "function"
      ? (arg as (t: unknown) => unknown)({
          shiftHandoff: { findFirst: db.handoffFindFirst, create: db.handoffCreate },
        })
      : [],
  ),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    collaboration: { findUnique: db.collabFind },
    freelancerProfile: { findUnique: db.profileFind },
    shiftHandoff: { findUnique: db.handoffFindUnique, updateMany: db.handoffUpdateMany },
    user: { findMany: db.userFindMany },
    tenant: { findUnique: vi.fn(async () => null) },
    notification: { create: vi.fn(async () => ({})) },
    auditLog: { create: db.auditCreate },
    $transaction: db.tx,
  },
}));

const actor: Actor = { id: "zzp-1", role: "FREELANCER", status: "ACTIVE", tenantId: "tenant-A" };
vi.mock("@/lib/authz", async (orig) => ({
  ...(await orig<typeof import("@/lib/authz")>()),
  requireRole: vi.fn(async () => actor),
}));
vi.mock("@/lib/audit", () => ({ auditData: (d: unknown) => d }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { requestShiftHandoff, cancelShiftHandoff } from "./shift-handoff-actions";

const INVALID_CANDIDATE = "Ongeldige voorgestelde overnemer.";
const NOT_FOUND = "Overname-aanvraag niet gevonden.";

function requestForm(candidateId: string): FormData {
  const fd = new FormData();
  fd.set("reason", "Ik kan deze inzet door ziekte niet voortzetten.");
  fd.set("candidateFreelancerId", candidateId);
  return fd;
}

describe("requestShiftHandoff — kandidaat existence-oracle (CWE-203)", () => {
  beforeEach(() => {
    dbState.candidate = null;
    db.handoffCreate.mockClear();
    db.auditCreate.mockClear();
  });

  it("onbekende kandidaat → generieke 'ongeldig', geen aanmaak", async () => {
    dbState.candidate = null;
    const res = await requestShiftHandoff("c-1", undefined, requestForm("does-not-exist"));
    expect(res).toEqual({ error: INVALID_CANDIDATE });
    expect(db.handoffCreate).not.toHaveBeenCalled();
  });

  it("bestaande kandidaat buiten de tenant → IDENTIEKE 'ongeldig' (geen oracle), geen aanmaak", async () => {
    dbState.candidate = { id: "cand-x", userId: "zzp-9", tenantId: "tenant-B" };
    const res = await requestShiftHandoff("c-1", undefined, requestForm("cand-x"));
    // Cross-tenant mag NIET onderscheidbaar zijn van onbekend.
    expect(res).toEqual({ error: INVALID_CANDIDATE });
    expect(db.handoffCreate).not.toHaveBeenCalled();
  });

  it("zichzelf voorstellen → eigen melding (lekt niets)", async () => {
    dbState.candidate = { id: "cand-self", userId: "zzp-1", tenantId: "tenant-A" };
    const res = await requestShiftHandoff("c-1", undefined, requestForm("cand-self"));
    expect(res).toEqual({ error: "Je kunt jezelf niet als overnemer voorstellen." });
    expect(db.handoffCreate).not.toHaveBeenCalled();
  });

  it("geldige eigen-tenant kandidaat passeert de poort (geen vals positief)", async () => {
    dbState.candidate = { id: "cand-ok", userId: "zzp-7", tenantId: "tenant-A" };
    const res = await requestShiftHandoff("c-1", undefined, requestForm("cand-ok"));
    expect(res).toEqual({ ok: true });
    expect(db.handoffCreate).toHaveBeenCalledOnce();
  });
});

describe("cancelShiftHandoff — existence-oracle (CWE-203)", () => {
  beforeEach(() => {
    dbState.handoff = null;
    db.handoffUpdateMany.mockClear();
    db.auditCreate.mockClear();
  });

  it("onbekend id → generieke 'niet gevonden', geen mutatie/audit", async () => {
    dbState.handoff = null;
    const res = await cancelShiftHandoff("nope", undefined);
    expect(res).toEqual({ error: NOT_FOUND });
    expect(db.handoffUpdateMany).not.toHaveBeenCalled();
    expect(db.auditCreate).not.toHaveBeenCalled();
  });

  it("bestaande aanvraag van iemand anders → IDENTIEKE 'niet gevonden' + geaudite geweigerde poging", async () => {
    dbState.handoff = {
      id: "h-x",
      status: "OPEN",
      requestedByUserId: "zzp-9",
      collaborationId: "c-9",
    };
    const res = await cancelShiftHandoff("h-x", undefined);
    expect(res).toEqual({ error: NOT_FOUND });
    expect(db.handoffUpdateMany).not.toHaveBeenCalled();
    // De IDOR-poging op een bestaand-maar-vreemd id verdwijnt niet stil.
    expect(db.auditCreate).toHaveBeenCalledOnce();
    expect(db.auditCreate.mock.calls[0]![0]).toMatchObject({
      data: { action: "SHIFT_HANDOFF_CANCEL_DENIED", entityId: "h-x" },
    });
  });

  it("eigen OPEN aanvraag wordt ingetrokken (geen vals positief)", async () => {
    dbState.handoff = {
      id: "h-own",
      status: "OPEN",
      requestedByUserId: "zzp-1",
      collaborationId: "c-1",
    };
    const res = await cancelShiftHandoff("h-own", undefined);
    expect(res).toEqual({ ok: true });
    expect(db.handoffUpdateMany).toHaveBeenCalledOnce();
  });
});
