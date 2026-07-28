// Regressie-net voor de ENIGE toegangscontrole van `resolveDispute`: alleen een ADMIN mag een dispuut
// opheffen. Anders dan de overige cascade-commando's (approve/reject/submit/credit/confirm/sign/open —
// alle in anti-oracle-party.test.ts gedekt met een niet-partij-weigering) is `resolveDispute` géén
// partij-actie maar een platform-privilege: het ontdooit de bevroren cascade en zet de geld-/statusloop
// weer in gang, buiten de mediatie om. Tot nu toe borgde geen enkele test die `actor.role !== "ADMIN"`-
// grendel — de twee bestanden die `resolveDispute` noemen gebruiken hem alleen in een happy-path/noop-mock.
// Een toekomstige refactor die de rolcheck laat vallen zou elke partij (of willekeurige gebruiker) zijn
// eigen dispuut laten opheffen en de cascade laten hervatten — een privilege-escalatie (BOLA/BFLA,
// OWASP A01) die nu niets zou vangen. Deze test dicht dat gat: hij is groen zolang de grendel staat en
// wordt rood zodra 'ie wordt verzwakt of verwijderd.
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Actor } from "@/lib/authz";

const findUnique = vi.fn();
const $transaction = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    collaboration: { findUnique: (...a: unknown[]) => findUnique(...a) },
    $transaction: (...a: unknown[]) => $transaction(...a),
  },
}));

const CLIENT: Actor = { id: "c1", role: "CLIENT", status: "ACTIVE" };
const FREELANCER: Actor = { id: "f1", role: "FREELANCER", status: "ACTIVE" };
const STRANGER: Actor = { id: "x-stranger", role: "FREELANCER", status: "ACTIVE" };
const ADMIN: Actor = { id: "admin-1", role: "ADMIN", status: "ACTIVE" };

const ROLE_MESSAGE = "Alleen het platform kan een dispuut oplossen.";

async function msg(p: Promise<unknown>): Promise<string> {
  try {
    await p;
    return "__no-throw__";
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  findUnique.mockResolvedValue(null);
});

describe("resolveDispute — alleen ADMIN mag een dispuut opheffen (BFLA-regressie-net)", () => {
  it("weigert een CLIENT (partij) met de platform-rolmelding", async () => {
    const { resolveDispute } = await import("@/lib/cascade/dispute-commands");
    expect(await msg(resolveDispute(CLIENT, "col-1"))).toBe(ROLE_MESSAGE);
  });

  it("weigert een FREELANCER (partij) met de platform-rolmelding", async () => {
    const { resolveDispute } = await import("@/lib/cascade/dispute-commands");
    expect(await msg(resolveDispute(FREELANCER, "col-1"))).toBe(ROLE_MESSAGE);
  });

  it("weigert een willekeurige (niet-partij) gebruiker met de platform-rolmelding", async () => {
    const { resolveDispute } = await import("@/lib/cascade/dispute-commands");
    expect(await msg(resolveDispute(STRANGER, "col-1"))).toBe(ROLE_MESSAGE);
  });

  it("kortsluit vóór elke DB-lees én -mutatie voor een niet-ADMIN (geen existentie-oracle, geen effect)", async () => {
    const { resolveDispute } = await import("@/lib/cascade/dispute-commands");
    await msg(resolveDispute(CLIENT, "col-1"));
    // De rolgrendel staat vóór `findUnique`: een niet-ADMIN mag het bestaan van een samenwerking niet
    // kunnen aftasten en mag nooit een transactie starten.
    expect(findUnique).not.toHaveBeenCalled();
    expect($transaction).not.toHaveBeenCalled();
  });

  it("laat een ADMIN de rolgrendel passeren (grendel is rol-, niet partij-gebaseerd)", async () => {
    const { resolveDispute } = await import("@/lib/cascade/dispute-commands");
    // Onbekende samenwerking → ADMIN komt voorbij de rolcheck en valt op de bestaans-check.
    expect(await msg(resolveDispute(ADMIN, "onbekend"))).toBe("Samenwerking niet gevonden.");
    expect(findUnique).toHaveBeenCalledTimes(1);
  });

  it("weigert een ADMIN wanneer er geen open dispuut is (geen no-op mutatie)", async () => {
    findUnique.mockResolvedValue({
      id: "col-1",
      disputedAt: null,
      company: { userId: "c1" },
      freelancer: { userId: "f1" },
    });
    const { resolveDispute } = await import("@/lib/cascade/dispute-commands");
    expect(await msg(resolveDispute(ADMIN, "col-1"))).toBe("Er is geen open dispuut.");
    expect($transaction).not.toHaveBeenCalled();
  });
});
