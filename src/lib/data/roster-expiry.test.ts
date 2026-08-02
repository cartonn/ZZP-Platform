// summarizeRosterExpiringSoon telt (bijna-)verlopende VERIFIED-certificaten per tenant MÉT
// supersede-uitsluiting — zelfde bron als de /franchise/zzpers-badge en /acties, zodat het
// dashboard-zegel niet over-rapporteert. Stap 1 = kandidaat-certs in het venster; stap 2 = het
// volledige VERIFIED-dossier per kandidaat-profiel voor de supersede-check.

import { describe, it, expect, vi, beforeEach } from "vitest";

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));

vi.mock("@/lib/db", () => ({
  prisma: { credential: { findMany } },
}));

import { summarizeRosterExpiringSoon, ROSTER_EXPIRY_SCAN_LIMIT } from "./roster-expiry";

const now = new Date("2026-07-30T00:00:00Z");
const soon = new Date("2026-08-29T00:00:00Z"); // +30 dagen
const inWindow = new Date("2026-08-09T00:00:00Z"); // binnen het venster
const farFuture = new Date("2027-09-01T00:00:00Z"); // ruim buiten het venster (dekker)

describe("summarizeRosterExpiringSoon", () => {
  beforeEach(() => findMany.mockReset());

  it("is 0/0 zonder kandidaat-certificaten (geen tweede query)", async () => {
    findMany.mockResolvedValueOnce([]); // stap 1: geen verlopende certs
    const result = await summarizeRosterExpiringSoon("tenant-1", now, soon);
    expect(result).toEqual({ profiles: 0, certs: 0 });
    expect(findMany).toHaveBeenCalledTimes(1); // stap 2 wordt overgeslagen
  });

  it("telt echte verlopende certs, één per profiel", async () => {
    findMany
      .mockResolvedValueOnce([{ freelancerProfileId: "p1" }, { freelancerProfileId: "p2" }])
      .mockResolvedValueOnce([
        { id: "c1", type: "LICENSE", expiresAt: inWindow, freelancerProfileId: "p1" },
        { id: "c2", type: "VOG", expiresAt: inWindow, freelancerProfileId: "p2" },
      ]);
    const result = await summarizeRosterExpiringSoon("tenant-1", now, soon);
    expect(result).toEqual({ profiles: 2, certs: 2 });
  });

  it("sluit een superseded exemplaar uit (nieuwer cert van hetzelfde type dekt de compliance al)", async () => {
    // Kandidaat p1 heeft een bijna-verlopend LICENSE, maar ook een ruim geldig LICENSE → superseded.
    findMany.mockResolvedValueOnce([{ freelancerProfileId: "p1" }]).mockResolvedValueOnce([
      { id: "oud", type: "LICENSE", expiresAt: inWindow, freelancerProfileId: "p1" },
      { id: "nieuw", type: "LICENSE", expiresAt: farFuture, freelancerProfileId: "p1" },
    ]);
    const result = await summarizeRosterExpiringSoon("tenant-1", now, soon);
    expect(result).toEqual({ profiles: 0, certs: 0 }); // geen valse "verloopt binnenkort"
  });

  it("somt meerdere niet-superseded certs van hetzelfde profiel op in `certs`", async () => {
    findMany.mockResolvedValueOnce([{ freelancerProfileId: "p1" }]).mockResolvedValueOnce([
      { id: "a", type: "LICENSE", expiresAt: inWindow, freelancerProfileId: "p1" },
      { id: "b", type: "VOG", expiresAt: inWindow, freelancerProfileId: "p1" },
    ]);
    const result = await summarizeRosterExpiringSoon("tenant-1", now, soon);
    expect(result).toEqual({ profiles: 1, certs: 2 });
  });

  it("scoopt op de tenant, VERIFIED + venster, geordend en gecapt zoals /acties", async () => {
    findMany.mockResolvedValueOnce([]);
    await summarizeRosterExpiringSoon("tenant-9", now, soon);
    const arg = findMany.mock.calls[0]![0];
    expect(arg.where.freelancerProfile.tenantId).toBe("tenant-9");
    expect(arg.where.status).toBe("VERIFIED");
    expect(arg.where.expiresAt).toEqual({ gte: now, lte: soon });
    expect(arg.orderBy).toEqual({ expiresAt: "asc" });
    expect(arg.take).toBe(ROSTER_EXPIRY_SCAN_LIMIT);
  });
});
