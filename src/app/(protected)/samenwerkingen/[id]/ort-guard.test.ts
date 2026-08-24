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

const collaborationFindUnique = vi.fn();
const collaborationUpdateMany = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: {
    collaboration: {
      findUnique: (...args: unknown[]) => collaborationFindUnique(...args),
      updateMany: (...args: unknown[]) => collaborationUpdateMany(...args),
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
  // De atomische conditionele UPDATE: default → 1 rij geraakt (geen SUBMITTED-urenstaat, wijziging mag).
  collaborationUpdateMany.mockResolvedValue({ count: 1 });
  auditMock.mockResolvedValue(undefined);
});

// De relationele guard die de check-en-schrijf atomisch maakt: de UPDATE mag alleen slagen als er
// geen SUBMITTED-urenstaat is. Deze conditie MOET in de `where` van de updateMany staan (niet als losse
// count ervoor) — anders is de TOCTOU-race terug. Dit is de red→green-invariant.
const ATOMIC_GUARD = { performances: { none: { status: "SUBMITTED" } } };

async function msg(p: Promise<unknown>): Promise<string> {
  try {
    await p;
    return "__no-throw__";
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

describe("setOrtProfileAction — ORT-toeslagen bevroren tijdens openstaande ingediende urenstaat", () => {
  it("schrijft de wijziging via één atomische conditionele UPDATE met de SUBMITTED-guard in de WHERE", async () => {
    requireActorMock.mockResolvedValue(CLIENT);
    const { setOrtProfileAction } = await import("./actions");

    await setOrtProfileAction("col-1", ortForm());
    // TOCTOU-invariant: guard + write in dezelfde statement — de `none`-conditie staat in de where.
    expect(collaborationUpdateMany).toHaveBeenCalledTimes(1);
    expect(collaborationUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "col-1", ...ATOMIC_GUARD }),
      }),
    );
  });

  it("blokkeert de wijziging als de atomische UPDATE 0 rijen raakt (SUBMITTED-urenstaat wacht)", async () => {
    requireActorMock.mockResolvedValue(CLIENT);
    // De DB evalueert de guard: er is een SUBMITTED-urenstaat → 0 rijen geraakt.
    collaborationUpdateMany.mockResolvedValue({ count: 0 });
    const { setOrtProfileAction } = await import("./actions");

    const message = await msg(setOrtProfileAction("col-1", ortForm()));
    expect(message).toMatch(/urensta/i);
    // Geen audit bij een geblokkeerde (0-rijen) wijziging.
    expect(auditMock).not.toHaveBeenCalled();
  });

  it("staat de wijziging toe als er geen ingediende urenstaat openstaat (audit WEL geschreven)", async () => {
    requireActorMock.mockResolvedValue(CLIENT);
    collaborationUpdateMany.mockResolvedValue({ count: 1 });
    const { setOrtProfileAction } = await import("./actions");

    await setOrtProfileAction("col-1", ortForm());
    expect(collaborationUpdateMany).toHaveBeenCalledTimes(1);
    expect(auditMock).toHaveBeenCalledTimes(1);
  });

  it("blokkeert ook een admin zolang er een SUBMITTED-urenstaat openstaat", async () => {
    requireActorMock.mockResolvedValue(ADMIN);
    collaborationUpdateMany.mockResolvedValue({ count: 0 });
    const { setOrtProfileAction } = await import("./actions");

    const message = await msg(setOrtProfileAction("col-1", ortForm()));
    expect(message).toMatch(/urensta/i);
    expect(auditMock).not.toHaveBeenCalled();
  });
});
