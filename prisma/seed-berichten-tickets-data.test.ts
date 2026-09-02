import { describe, expect, it } from "vitest";
import { SEED_CONVERSATIONS, SEED_TICKETS } from "./seed-berichten-tickets-data";

// De seed koppelt elke thread op sleutel: `ck`/`owner` moeten bestaande opdrachtgever-sleutels zijn
// en `jobId` een bestaande dienst. Een verouderde sleutel (bv. een niet-zorg bedrijf van vroeger)
// levert geen fout op in prisma/seed.ts — de thread wordt dan stilzwijgend overgeslagen. Deze test
// vangt dat af, zodat de demo-berichten en -tickets niet ongemerkt uit de seed verdwijnen.

/** Opdrachtgever-sleutels uit companySpecs in prisma/seed.ts. */
const COMPANY_KEYS = ["jansen", "zorggroep", "ggz", "ghz", "ziekenhuis"];
/** ZZP'er-sleutels uit de freelancers-lijst in prisma/seed.ts. */
const FREELANCER_KEYS = [
  "sanne",
  "youssef",
  "lisa",
  "daan",
  "fatima",
  "peter",
  "anna",
  "kevin",
  "nadia",
  "tom",
  "emma",
  "ahmed",
  "julia",
  "bram",
  "sofie",
  "rik",
  "iris",
];
/** Dienst-ids uit de jobs-lijst in prisma/seed.ts (job-1 t/m job-19). */
const JOB_IDS = Array.from({ length: 19 }, (_, i) => `job-${i + 1}`);

describe("SEED_CONVERSATIONS", () => {
  it("verwijst uitsluitend naar bestaande sleutels en diensten", () => {
    for (const c of SEED_CONVERSATIONS) {
      expect(FREELANCER_KEYS, `${c.id}: onbekende ZZP'er-sleutel ${c.fk}`).toContain(c.fk);
      expect(COMPANY_KEYS, `${c.id}: onbekende opdrachtgever-sleutel ${c.ck}`).toContain(c.ck);
      expect(JOB_IDS, `${c.id}: onbekende dienst ${c.jobId}`).toContain(c.jobId);
    }
  });

  it("heeft unieke ids en minstens twee berichten per gesprek", () => {
    const ids = SEED_CONVERSATIONS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of SEED_CONVERSATIONS) {
      expect(c.messages.length, `${c.id} heeft te weinig berichten`).toBeGreaterThanOrEqual(2);
      for (const m of c.messages) expect(m.body.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("SEED_TICKETS", () => {
  it("verwijst uitsluitend naar bestaande eigenaar-sleutels", () => {
    for (const t of SEED_TICKETS) {
      const known = t.role === "client" ? COMPANY_KEYS : FREELANCER_KEYS;
      expect(known, `${t.id}: onbekende eigenaar ${t.owner} (${t.role})`).toContain(t.owner);
    }
  });

  it("heeft unieke ids en minstens één bericht per ticket", () => {
    const ids = SEED_TICKETS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of SEED_TICKETS) {
      expect(t.messages.length, `${t.id} heeft geen berichten`).toBeGreaterThanOrEqual(1);
    }
  });
});
