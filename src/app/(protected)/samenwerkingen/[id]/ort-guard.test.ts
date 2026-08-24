// Geld-integriteit: de opdrachtgever (betalende partij) mag de ORT-toeslagen van een samenwerking
// NIET wijzigen zolang er nog een INGEDIENDE (SUBMITTED) urenstaat op goedkeuring wacht. Het
// factuurbedrag wordt bij goedkeuren uit de actuele toeslagen afgeleid (niet gesnapshot bij
// indienen), dus een wijziging op dat moment zou het reeds ingediende bedrag eenzijdig kunnen
// verlagen/verhogen (CLAUDE.md regel 1 & 2 — server-side waarheid). De guard in setOrtProfileAction
// borgt dit; deze test is het red→green-bewijs.
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks moeten vóór de import van de server-actie staan (vi.mock wordt gehoist).
const requireActorMock = vi.fn();
vi.mock("@/lib/authz", () => ({ requireActor: () => requireActorMock() }));

const performanceCount = vi.fn();
const collaborationFindUnique = vi.fn();
const collaborationUpdate = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: {
    performance: { count: (...args: unknown[]) => performanceCount(...args) },
    collaboration: {
      findUnique: (...args: unknown[]) => collaborationFindUnique(...args),
      update: (...args: unknown[]) => collaborationUpdate(...args),
    },
  },
}));

const auditMock = vi.fn();
vi.mock("@/lib/audit", () => ({ audit: (...args: unknown[]) => auditMock(...args) }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// setOrtProfileAction staat in "use server"-actions.ts; die pullt de hele cascade binnen. Mock de
// modules met neveneffecten (dezelfde als anti-oracle-party.test.ts) zodat de import in de node-omgeving
// slaagt zonder DB/mail te raken.
vi.mock("@/lib/cascade/apply", () => ({ applyCascadeEffects: vi.fn().mockResolvedValue({}) }));
vi.mock("@/lib/services/mail-sender", () => ({
  getMailSender: () => ({ send: vi.fn().mockResolvedValue(undefined) }),
}));

const CLIENT = { id: "c1", role: "CLIENT" as const, status: "ACTIVE" };
const ADMIN = { id: "admin1", role: "ADMIN" as const, status: "ACTIVE" };

function ortForm(profile = "VVT"): FormData {
  const fd = new FormData();
  fd.set("ortProfile", profile);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  // Standaard: opdrachtgever-eigenaar van de samenwerking.
  collaborationFindUnique.mockResolvedValue({ company: { userId: "c1" } });
  collaborationUpdate.mockResolvedValue({});
  auditMock.mockResolvedValue(undefined);
});

async function msg(p: Promise<unknown>): Promise<string> {
  try {
    await p;
    return "__no-throw__";
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

describe("setOrtProfileAction — ORT-toeslagen bevroren tijdens openstaande ingediende urenstaat", () => {
  it("blokkeert de wijziging als er een SUBMITTED-urenstaat op goedkeuring wacht (update NIET aangeroepen)", async () => {
    requireActorMock.mockResolvedValue(CLIENT);
    performanceCount.mockResolvedValue(1);
    const { setOrtProfileAction } = await import("./actions");

    const message = await msg(setOrtProfileAction("col-1", ortForm()));
    expect(message).toMatch(/urensta/i);
    expect(collaborationUpdate).not.toHaveBeenCalled();
    expect(auditMock).not.toHaveBeenCalled();
    // De guard telt exact de ingediende prestaties van déze samenwerking.
    expect(performanceCount).toHaveBeenCalledWith({
      where: { collaborationId: "col-1", status: "SUBMITTED" },
    });
  });

  it("staat de wijziging toe als er geen ingediende urenstaat openstaat (update WEL aangeroepen)", async () => {
    requireActorMock.mockResolvedValue(CLIENT);
    performanceCount.mockResolvedValue(0);
    const { setOrtProfileAction } = await import("./actions");

    await setOrtProfileAction("col-1", ortForm());
    expect(collaborationUpdate).toHaveBeenCalledTimes(1);
    expect(auditMock).toHaveBeenCalledTimes(1);
  });

  it("blokkeert ook een admin zolang er een SUBMITTED-urenstaat openstaat", async () => {
    requireActorMock.mockResolvedValue(ADMIN);
    performanceCount.mockResolvedValue(2);
    const { setOrtProfileAction } = await import("./actions");

    const message = await msg(setOrtProfileAction("col-1", ortForm()));
    expect(message).toMatch(/urensta/i);
    expect(collaborationUpdate).not.toHaveBeenCalled();
  });
});
