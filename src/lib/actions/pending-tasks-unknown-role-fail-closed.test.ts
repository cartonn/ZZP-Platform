// Security-regressietest (OWASP A01 — Broken Access Control, fail-open default): de rol-dispatch in
// `computeTasks` (pending-tasks.ts) mag NOOIT via een fallthrough-default de platform-brede admin-taken
// prijsgeven aan een onbekende rol. `adminTasks()` is bewust ongescoopt en geeft gevoelige PII terug
// (AVG-verwijderverzoeken, disputen, no-show-meldingen, verificatie-inzenders, supporttickets). Rollen
// zijn strings (enums-als-strings, architectuurregel 6), dus een bad migration / directe DB-write / een
// toekomstige 5e rol die de switch niet bijwerkt zou met een fail-open default stil admin-PII lekken.
//
// Rood vóór de fix: een onbekende rol viel door naar `adminTasks()` → de admin-queries werden gedraaid
// en de (gemockte) SUBMITTED-verificatie kwam als taak terug. Groen ná de fix: onbekend → geen query,
// lege takenlijst (fail-closed).

import { describe, it, expect, vi, beforeEach } from "vitest";

const credentialFindMany = vi.hoisted(() =>
  vi.fn(async () => [
    // Eén SUBMITTED-verificatie: als adminTasks() zou draaien, wordt dit een zichtbare admin-taak
    // (bevat de naam van de inzender — precies de PII die niet mag lekken).
    { id: "cred-1", title: "VOG", freelancerProfile: { user: { name: "Gevoelige Naam" } } },
  ]),
);
const userFindMany = vi.hoisted(() => vi.fn(async () => []));
const collaborationFindMany = vi.hoisted(() => vi.fn(async () => []));
const noShowFindMany = vi.hoisted(() => vi.fn(async () => []));
const noShowGroupBy = vi.hoisted(() => vi.fn(async () => []));
const supportFindMany = vi.hoisted(() => vi.fn(async () => []));
const shiftHandoffFindMany = vi.hoisted(() => vi.fn(async () => []));

vi.mock("@/lib/db", () => ({
  prisma: {
    credential: { findMany: credentialFindMany },
    user: { findMany: userFindMany },
    collaboration: { findMany: collaborationFindMany },
    noShowReport: { findMany: noShowFindMany, groupBy: noShowGroupBy },
    supportTicket: { findMany: supportFindMany },
    shiftHandoff: { findMany: shiftHandoffFindMany },
  },
}));

import { pendingTasks, pendingTaskCount } from "./pending-tasks";

beforeEach(() => {
  credentialFindMany.mockClear();
  userFindMany.mockClear();
  collaborationFindMany.mockClear();
  noShowFindMany.mockClear();
  noShowGroupBy.mockClear();
  supportFindMany.mockClear();
  shiftHandoffFindMany.mockClear();
});

describe("computeTasks — fail-closed op een onbekende rol (geen admin-PII-lek)", () => {
  it("een onbekende rol krijgt een lege takenlijst en raakt geen admin-query aan", async () => {
    // Unieke id → omzeilt de React.cache-memoisatie tussen tests.
    const tasks = await pendingTasks({
      id: "unknown-role-fail-closed-1",
      role: "SUPPORT_AGENT" as never,
      status: "ACTIVE",
    } as never);

    expect(tasks).toEqual([]);
    // De admin-only queries mogen niet zijn aangeroepen — anders is adminTasks() gedraaid (fail-open).
    expect(credentialFindMany).not.toHaveBeenCalled();
    expect(userFindMany).not.toHaveBeenCalled();
    expect(collaborationFindMany).not.toHaveBeenCalled();
    expect(noShowFindMany).not.toHaveBeenCalled();
    expect(supportFindMany).not.toHaveBeenCalled();
    expect(shiftHandoffFindMany).not.toHaveBeenCalled();
  });

  it("pendingTaskCount(userId, <onbekende rol>) telt 0 (de sidebar-badge lekt geen admin-wachtrij)", async () => {
    const count = await pendingTaskCount("unknown-role-fail-closed-2", "DEMO");
    expect(count).toBe(0);
    expect(credentialFindMany).not.toHaveBeenCalled();
  });

  it("controle: een expliciete ADMIN raakt de admin-queries wél (fix beperkt zich tot onbekende rollen)", async () => {
    const tasks = await pendingTasks({
      id: "unknown-role-fail-closed-admin-control",
      role: "ADMIN",
      status: "ACTIVE",
    } as never);

    // ADMIN blijft ongewijzigd: adminTasks() draait, de SUBMITTED-verificatie wordt een taak.
    expect(credentialFindMany).toHaveBeenCalledTimes(1);
    expect(tasks.length).toBeGreaterThan(0);
  });
});
