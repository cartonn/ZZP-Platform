// Regressietest voor de next-action-engine (DOEL 1b — cross-surface-consistentie): de operationele
// bemiddelaar-attentiepunten "roster-ZZP'er niet inzetbaar" en "dienst staat te lang open zonder
// plaatsing" hoorden alléén op de dashboard-rail thuis, maar ontbraken op /acties en in de zijbalk-
// badge (beide gevoed door de item-engine `pendingTasks` → `franchiserTasks`). Een bemiddelaar die
// aantoonbaar "aan zet" was, zag daardoor op /acties/badge minder (of niets). Deze test borgt dat de
// item-engine die twee taken nu wél emitteert, met de juiste id/tone/prioriteit/deep-link, en dat ze
// verdwijnen zodra de onderliggende conditie is opgelost (inzetbaar / gevulde dienst).

import { describe, it, expect, vi, beforeEach } from "vitest";

const state = vi.hoisted(() => ({
  roster: [] as {
    id: string;
    completeness: number;
    availability: string;
    user: { name: string | null; identityVerifiedAt: Date | null; lastLoginAt: Date | null };
    credentials: { type: string; status: string; expiresAt: Date | null }[];
  }[],
  stale: [] as { id: string; title: string; createdAt: Date }[],
  // Open (gepubliceerde) diensten voor de acute-aggregaattaak: id + startdatum + actieve-collab-telling.
  open: [] as { id: string; startDate: Date | null; _count: { collaborations: number } }[],
  // Fixture-leads (KOUD/WARM) met een geplande opvolgdatum; de lead.count-mock past het echte
  // `where.nextFollowUp`-filter erop toe zodat de dagniveau-grens getest kan worden.
  leads: [] as { nextFollowUp: Date }[],
  // Geverifieerde tenant-certificaten voor de roster-verloop-aggregaattaak (superseded-check).
  creds: [] as {
    id: string;
    type: string;
    expiresAt: Date | null;
    freelancerProfileId: string;
    freelancerProfile: { user: { name: string | null } };
  }[],
  // Geleide-opzet-tellingen — default een volledig opgezette franchise, zodat de opzet-taken
  // standaard NIET verschijnen en de operationele-taak-tests geïsoleerd blijven.
  counts: { companies: 1, freelancers: 1, publishedDiensten: 1, companiesWithoutDiensten: 0 },
  // Vastgelegde args van de roster-`freelancerProfile.findMany` — voor de deterministische-
  // truncatie-invariant (orderBy identiek aan de nav-badge, zodat badge en /acties niet driften).
  rosterQuery: null as { orderBy?: unknown; take?: number } | null,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn(async () => ({ tenantId: "tenant-1" })) },
    // Twee aanroepen: (1) de kandidaat-query (window-filter `expiresAt in (now, soon]`, nulls vallen
    // erbuiten) en (2) de dekkings-query (alle VERIFIED-certs van de kandidaat-profielen, `in`-filter).
    // De mock past beide echte filters toe zodat een teruggedraaide fix meteen rood wordt.
    credential: {
      findMany: vi.fn(
        async (args: {
          where?: {
            expiresAt?: { gte: Date; lte: Date };
            freelancerProfileId?: { in: string[] };
          };
        }) => {
          const w = args?.where ?? {};
          if (w.expiresAt) {
            const { gte, lte } = w.expiresAt;
            return state.creds.filter(
              (c) => c.expiresAt != null && c.expiresAt >= gte && c.expiresAt <= lte,
            );
          }
          if (w.freelancerProfileId?.in) {
            const ids = new Set(w.freelancerProfileId.in);
            return state.creds.filter((c) => ids.has(c.freelancerProfileId));
          }
          return state.creds;
        },
      ),
    },
    // Past het echte nextFollowUp-filter toe op de fixture-leads. De productiecode gebruikt de
    // dagniveau-grens `lt: startOfUtcDay(now)` (gelijk aan de nav-badge en de leadpagina); de mock
    // ondersteunt ook `lte` zodat een teruggedraaide fix meteen rood wordt.
    lead: {
      count: vi.fn(async (args: { where?: { nextFollowUp?: { lt?: Date; lte?: Date } } }) => {
        const f = args?.where?.nextFollowUp;
        if (!f) return state.leads.length;
        return state.leads.filter((l) => {
          if (f.lt) return l.nextFollowUp.getTime() < f.lt.getTime();
          if (f.lte) return l.nextFollowUp.getTime() <= f.lte.getTime();
          return true;
        }).length;
      }),
    },
    // company.count wordt twee keer aangeroepen: alle opdrachtgevers (`{tenantId}`) en
    // opdrachtgevers-zonder-gepubliceerde-dienst (`jobs: { none: … }`). De tweede is te herkennen
    // aan het jobs-filter.
    company: {
      count: vi.fn(async (args: { where?: { jobs?: unknown } }) =>
        args?.where?.jobs ? state.counts.companiesWithoutDiensten : state.counts.companies,
      ),
    },
    freelancerProfile: {
      findMany: vi.fn(async (args: { orderBy?: unknown; take?: number }) => {
        state.rosterQuery = { orderBy: args?.orderBy, take: args?.take };
        return state.roster;
      }),
      count: vi.fn(async () => state.counts.freelancers),
    },
    // job.findMany wordt twee keer aangeroepen: open-diensten (voor de acute-taak) en de stale-lijst.
    // BEIDE queries dragen nu een `collaborations: { none: { status: "ACTIVE" } }`-filter, dus de
    // stale-query onderscheiden we aan zijn `createdAt`-drempel (uniek). De open-query mock is faithful:
    // hij past de collaborations-none-filter (de fix), de acuut-eerst orderBy (startDate nulls-first) én
    // de `take: MAX`-slice toe — zodat een revert van de fix (filter weg → gevulde diensten verdringen een
    // acute dienst uit de slice) meteen rood wordt. job.count telt de gepubliceerde diensten.
    job: {
      findMany: vi.fn(
        async (args: {
          where?: { collaborations?: { none?: unknown }; createdAt?: unknown };
          take?: number;
        }) => {
          if (args?.where?.createdAt) return state.stale;
          let rows = state.open;
          if (args?.where?.collaborations?.none) {
            rows = rows.filter((r) => (r._count?.collaborations ?? 0) === 0);
          }
          rows = [...rows].sort((a, b) => {
            const av = a.startDate ? a.startDate.getTime() : -Infinity;
            const bv = b.startDate ? b.startDate.getTime() : -Infinity;
            return av - bv;
          });
          return typeof args?.take === "number" ? rows.slice(0, args.take) : rows;
        },
      ),
      count: vi.fn(async () => state.counts.publishedDiensten),
    },
    // Open dienst-overnames (aparte tak) — hier leeg, zodat deze tests op de andere tenant-taken
    // gefocust blijven. De dedicated regressietest staat in pending-tasks.shift-handoff.test.ts.
    shiftHandoff: { findMany: vi.fn(async () => []) },
  },
}));

// Geen open diensten → geen fill-signals nodig; toch stubben zodat er geen prisma-pad opengaat.
vi.mock("@/lib/franchise/dienst-fill-signal", () => ({
  getRosterFillSignalsForTenant: vi.fn(async () => new Map()),
}));

import { pendingTasks } from "@/lib/actions/pending-tasks";

const ACTOR = { id: "user-franchiser", role: "FRANCHISER", status: "ACTIVE" } as const;

const now = new Date();
const engaged = {
  id: "prof-actief",
  completeness: 100,
  availability: "AVAILABLE",
  user: { name: "Actieve ZZP'er", identityVerifiedAt: now, lastLoginAt: now },
  credentials: [
    { type: "VOG", status: "VERIFIED", expiresAt: null },
    { type: "INSURANCE", status: "VERIFIED", expiresAt: null },
  ],
};
const notEngaged = {
  id: "prof-inactief",
  completeness: 40,
  availability: "AVAILABLE",
  // Geen VOG/verzekering → verplichte documenten ontbreken → computeEngageability = INACTIEF.
  user: { name: "Niet-inzetbare ZZP'er", identityVerifiedAt: null, lastLoginAt: now },
  credentials: [] as { type: string; status: string; expiresAt: Date | null }[],
};

beforeEach(() => {
  state.roster = [];
  state.stale = [];
  state.open = [];
  state.leads = [];
  state.creds = [];
  state.rosterQuery = null;
  state.counts = {
    companies: 1,
    freelancers: 1,
    publishedDiensten: 1,
    companiesWithoutDiensten: 0,
  };
});

describe("bemiddelaar next-actions — roster-query truncateert deterministisch (DOEL 1b)", () => {
  it("de roster-freelancerProfile-query heeft orderBy { id: asc } + take 50 (gelijk aan de nav-badge)", async () => {
    state.roster = [engaged];
    await pendingTasks(ACTOR);
    // De roster-query (`freelancerProfile.findMany({ where: { tenantId } })`) voedt de niet-inzetbaar-
    // taak. Op de nav-badge (signals.ts) draait exact dezelfde query met dezelfde `take: 50`. Zonder
    // een identieke `orderBy` pakken de twee onafhankelijke queries bij >50 roster-leden een ánder
    // subset → de badge divergeert van /acties. Deze assert is rood zodra de `orderBy` verdwijnt.
    expect(state.rosterQuery?.orderBy).toEqual({ id: "asc" });
    expect(state.rosterQuery?.take).toBe(50);
  });
});

describe("bemiddelaar next-actions — niet-inzetbare ZZP'er telt op /acties + badge", () => {
  it("emitteert franchise-not-engageable voor een INACTIEF roster-lid, niet voor een inzetbare", async () => {
    state.roster = [engaged, notEngaged];
    const tasks = await pendingTasks(ACTOR);
    const notEng = tasks.filter((t) => t.kind === "franchise-not-engageable");
    expect(notEng).toHaveLength(1);
    const task = notEng[0];
    expect(task).toBeDefined();
    expect(task?.id).toBe("franchise-not-engageable:prof-inactief");
    expect(task?.tone).toBe("attention");
    expect(task?.href).toBe("/franchise/zzpers/prof-inactief");
    expect(task?.title).toContain("Niet-inzetbare ZZP'er");
    expect(task?.title).toContain("nog niet inzetbaar");
  });

  it("verdwijnt zodra het roster volledig inzetbaar is", async () => {
    state.roster = [engaged];
    const tasks = await pendingTasks(ACTOR);
    expect(tasks.some((t) => t.kind === "franchise-not-engageable")).toBe(false);
  });
});

describe("bemiddelaar next-actions — te lang open dienst telt op /acties + badge", () => {
  it("emitteert franchise-stale-service met de juiste deep-link en dagentelling", async () => {
    const created = new Date(now.getTime() - 10 * 86_400_000);
    state.stale = [{ id: "dienst-1", title: "Nachtdienst IC", createdAt: created }];
    const tasks = await pendingTasks(ACTOR);
    const stale = tasks.filter((t) => t.kind === "franchise-stale-service");
    expect(stale).toHaveLength(1);
    const task = stale[0];
    expect(task).toBeDefined();
    expect(task?.id).toBe("franchise-stale-service:dienst-1");
    expect(task?.href).toBe("/franchise/diensten/dienst-1");
    expect(task?.tone).toBe("attention");
    expect(task?.title).toContain("Nachtdienst IC");
    expect(task?.title).toMatch(/10 dagen/);
  });

  it("toont geen stale-taak wanneer er geen te lang open dienst is", async () => {
    state.stale = [];
    const tasks = await pendingTasks(ACTOR);
    expect(tasks.some((t) => t.kind === "franchise-stale-service")).toBe(false);
  });

  // Residu-rollup (persona-sweep run 50, geparkeerde SHOULD-FIX): voorbij de per-dienst-slice van 3
  // moeten #4+ diensten niet stil van /acties + de badge (`pendingTaskCount`) + de rail vallen. Ze
  // worden gebundeld in één rollup-taak met de restant-telling (spiegelt franchiseAcuteDienstTask).
  it("bundelt het residu voorbij de eerste 3 in één rollup-taak met de juiste telling", async () => {
    const created = new Date(now.getTime() - 10 * 86_400_000);
    state.stale = Array.from({ length: 5 }, (_, i) => ({
      id: `dienst-${i}`,
      title: `Dienst ${i}`,
      createdAt: created,
    }));
    const tasks = await pendingTasks(ACTOR);
    // De 3 oudste als aparte rij + één rollup voor de resterende 2.
    expect(tasks.filter((t) => t.kind === "franchise-stale-service")).toHaveLength(3);
    const rollup = tasks.filter((t) => t.kind === "franchise-stale-service-rollup");
    expect(rollup).toHaveLength(1);
    expect(rollup[0]?.id).toBe("franchise-stale-service-rollup");
    expect(rollup[0]?.href).toBe("/franchise/diensten");
    expect(rollup[0]?.tone).toBe("attention");
    expect(rollup[0]?.title).toMatch(/Nog 2 diensten/);
  });

  it("toont geen rollup bij precies 3 of minder lang-open diensten", async () => {
    const created = new Date(now.getTime() - 10 * 86_400_000);
    state.stale = Array.from({ length: 3 }, (_, i) => ({
      id: `dienst-${i}`,
      title: `Dienst ${i}`,
      createdAt: created,
    }));
    const tasks = await pendingTasks(ACTOR);
    expect(tasks.filter((t) => t.kind === "franchise-stale-service")).toHaveLength(3);
    expect(tasks.some((t) => t.kind === "franchise-stale-service-rollup")).toBe(false);
  });

  it("gebruikt enkelvoud in de rollup bij exact één residu-dienst", async () => {
    const created = new Date(now.getTime() - 10 * 86_400_000);
    state.stale = Array.from({ length: 4 }, (_, i) => ({
      id: `dienst-${i}`,
      title: `Dienst ${i}`,
      createdAt: created,
    }));
    const tasks = await pendingTasks(ACTOR);
    const rollup = tasks.find((t) => t.kind === "franchise-stale-service-rollup");
    expect(rollup?.title).toMatch(/Nog 1 dienst staat/);
  });
});

// Dedup-invariant (persona-sweep, geparkeerd LOW → DOEL 1b): een ongevulde PUBLISHED-dienst die zowel
// acuut (start deze week/verleden) als te-lang-open (≥7 dagen) is, telde twee keer op /acties + in de
// badge — één keer in de acute-aggregaattaak én één keer als specifieke stale-taak. De acute-tak is het
// urgentere, gebundelde signaal en wint; de stale-lijst toont alleen de resterende, niet-acute diensten.
describe("bemiddelaar next-actions — acute + stale dienst telt niet dubbel", () => {
  it("laat een acuut-én-stale dienst alleen in het acute-aggregaat, niet ook als stale-taak", async () => {
    const created = new Date(now.getTime() - 12 * 86_400_000);
    // Zelfde dienst is ongevuld en start vandaag (acuut) én staat 12 dagen open (stale).
    state.open = [{ id: "dienst-overlap", startDate: now, _count: { collaborations: 0 } }];
    state.stale = [{ id: "dienst-overlap", title: "Weekenddienst", createdAt: created }];
    const tasks = await pendingTasks(ACTOR);
    // Acute-aggregaat telt 'm mee (één dreigt onbezet), maar geen aparte stale-rij → geen dubbeltelling.
    expect(tasks.some((t) => t.kind === "franchise-open-dienst-acute")).toBe(true);
    expect(tasks.some((t) => t.kind === "franchise-stale-service")).toBe(false);
  });

  it("verbergt een acute ongevulde dienst niet achter ≥MAX gevulde start-loze diensten (MAX-slice-undercount)", async () => {
    // Persona-sweep-regressie (voorheen geparkeerd, nu bevestigd bereikbaar): de open-diensten-query
    // haalde óók GEVULDE diensten op. Een tenant met ≥MAX gevulde, start-loze diensten (open-eind zorg-
    // plaatsingen) vulde — door `nulls: "first"` — de hele `take: MAX`-slice, waardoor één écht acute,
    // ONGEVULDE dienst (start morgen) buiten de slice viel en nooit als acute next-action verscheen.
    // De fix scopet de query op `collaborations: { none: { status: "ACTIVE" } }`.
    const filledNullStart = Array.from({ length: 50 }, (_v, i) => ({
      id: `gevuld-${i}`,
      startDate: null,
      _count: { collaborations: 1 }, // actieve samenwerking → gevuld
    }));
    state.open = [
      ...filledNullStart,
      { id: "acuut-ongevuld", startDate: now, _count: { collaborations: 0 } },
    ];
    const tasks = await pendingTasks(ACTOR);
    // De acute-aggregaattaak moet de ongevulde dienst meenemen (niet verdrongen door de gevulde berg).
    expect(tasks.some((t) => t.kind === "franchise-open-dienst-acute")).toBe(true);
  });

  it("behoudt de stale-taak voor een lang-open dienst die (nog) niet acuut is (start later)", async () => {
    const created = new Date(now.getTime() - 12 * 86_400_000);
    const laterStart = new Date(now.getTime() + 60 * 86_400_000);
    // Ongevuld en 12 dagen open, maar de start ligt ver in de toekomst → niet acuut → stale blijft.
    state.open = [{ id: "dienst-later", startDate: laterStart, _count: { collaborations: 0 } }];
    state.stale = [{ id: "dienst-later", title: "Zomerdienst", createdAt: created }];
    const tasks = await pendingTasks(ACTOR);
    expect(tasks.some((t) => t.kind === "franchise-open-dienst-acute")).toBe(false);
    const stale = tasks.filter((t) => t.kind === "franchise-stale-service");
    expect(stale).toHaveLength(1);
    expect(stale[0]?.id).toBe("franchise-stale-service:dienst-later");
  });
});

// Cross-surface-consistentie (persona-sweep run 42, DOEL 1b): de lead-opvolgtaak op /acties gebruikte
// een timestamp-grens (`lte: now`), terwijl de nav-badge (`overdueLeads`, signals.ts) én de
// "— te laat"-markering op /franchise/leads een dagniveau-grens (`< startOfUtcDay`) hanteren. Een lead
// die eerder vandaag verviel dook zo op in /acties zonder overeenkomstige badge/markering (~24u lang).
// Deze test borgt dat de item-engine dezelfde dagniveau-grens gebruikt.
describe("bemiddelaar next-actions — lead-opvolging deelt de dagniveau-grens met badge + leadpagina", () => {
  it("telt een lead die eerder VANDAAG verviel NIET als opvolgtaak (net als de badge)", async () => {
    const now = new Date();
    const startOfToday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    // Opvolgdatum vandaag om 00:00 UTC → vóór "nu" maar niet vóór start-van-vandaag.
    state.leads = [{ nextFollowUp: startOfToday }];
    const tasks = await pendingTasks(ACTOR);
    expect(tasks.some((t) => t.kind === "franchise-lead-followup")).toBe(false);
  });

  it("telt een lead die GISTEREN verviel wél als opvolgtaak", async () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 26 * 3_600_000);
    state.leads = [{ nextFollowUp: yesterday }];
    const tasks = await pendingTasks(ACTOR);
    const lead = tasks.filter((t) => t.kind === "franchise-lead-followup");
    expect(lead).toHaveLength(1);
    expect(lead[0]?.id).toBe("franchise-lead-followup");
  });
});

// Single-source-invariant (persona-sweep run 40): de geleide-opzet-stappen leefden alléén op de
// dashboard-rail, niet op /acties + de zijbalk-badge (item-engine). Deze test borgt dat de item-engine
// ze nu wél emitteert, met de canonieke id/tone/href/prioriteit uit franchiserNextActions.
describe("bemiddelaar next-actions — geleide opzet telt op /acties + badge", () => {
  it("emitteert de opzet-stappen als item-taken voor een lege tenant", async () => {
    state.counts = {
      companies: 0,
      freelancers: 0,
      publishedDiensten: 0,
      companiesWithoutDiensten: 0,
    };
    const tasks = await pendingTasks(ACTOR);
    const guided = tasks.filter((t) => t.kind === "franchise-guided-setup");
    // Lege tenant: eerste-opdrachtgever (90) + roster (70) — geen zinloze dienst-stap.
    expect(guided.map((t) => t.id)).toEqual([
      "franchise-guided-setup:franchiser-first-client",
      "franchise-guided-setup:franchiser-roster-empty",
    ]);
    const first = guided[0];
    expect(first?.tone).toBe("info");
    expect(first?.href).toBe("/franchise/opdrachtgevers/nieuw");
    expect(first?.resolver).toBe("link");
    // Ranking (badge/lijst-volgorde): first-client (90) staat boven roster (70).
    expect((guided[0]?.priority ?? 0) > (guided[1]?.priority ?? 0)).toBe(true);
  });

  it("nudget opdrachtgevers-zonder-diensten zodra de franchise draait", async () => {
    state.counts = {
      companies: 2,
      freelancers: 1,
      publishedDiensten: 1,
      companiesWithoutDiensten: 1,
    };
    const tasks = await pendingTasks(ACTOR);
    const guided = tasks.filter((t) => t.kind === "franchise-guided-setup");
    expect(guided.map((t) => t.id)).toEqual([
      "franchise-guided-setup:franchiser-clients-without-service",
    ]);
    expect(guided[0]?.title).toContain("1 opdrachtgever");
    expect(guided[0]?.href).toBe("/franchise/opdrachtgevers");
  });

  it("toont geen opzet-taak zodra de franchise volledig staat", async () => {
    state.counts = {
      companies: 3,
      freelancers: 4,
      publishedDiensten: 5,
      companiesWithoutDiensten: 0,
    };
    const tasks = await pendingTasks(ACTOR);
    expect(tasks.some((t) => t.kind === "franchise-guided-setup")).toBe(false);
  });
});

describe("bemiddelaar next-actions — roster-verloop onderdrukt superseded certificaat", () => {
  const soon = new Date(now.getTime() + 10 * 86_400_000); // binnen het 30-dagen-venster
  const far = new Date(now.getTime() + 400 * 86_400_000); // ruim buiten het venster
  const cred = (
    id: string,
    type: string,
    expiresAt: Date | null,
    profileId = "prof-1",
    name = "Sanne",
  ) => ({
    id,
    type,
    expiresAt,
    freelancerProfileId: profileId,
    freelancerProfile: { user: { name } },
  });

  it("emitteert de verloop-taak voor een solo bijna-vervallend certificaat", async () => {
    state.creds = [cred("c1", "LICENSE", soon)];
    const tasks = await pendingTasks(ACTOR);
    const expiry = tasks.filter((t) => t.kind === "franchise-credential-expiry");
    expect(expiry).toHaveLength(1);
    expect(expiry[0]?.id).toBe("franchise-credential-expiry:prof-1");
    expect(expiry[0]?.title).toContain("Sanne");
  });

  it("onderdrukt de taak als een nieuwer, langer-geldig cert van hetzelfde type de compliance dekt", async () => {
    // Oud verloopt binnenkort, nieuw dekt het type ruim → geen valse verloop-nudge.
    state.creds = [cred("oud", "LICENSE", soon), cred("nieuw", "LICENSE", far)];
    const tasks = await pendingTasks(ACTOR);
    expect(tasks.some((t) => t.kind === "franchise-credential-expiry")).toBe(false);
  });

  it("telt per ZZP'er alleen de niet-gedekte bijna-vervallende certificaten", async () => {
    // p1: LICENSE gedekt (superseded) + losse VOG die telt → count 1.
    state.creds = [
      cred("p1-oud", "LICENSE", soon, "prof-1", "Sanne"),
      cred("p1-nieuw", "LICENSE", far, "prof-1", "Sanne"),
      cred("p1-vog", "VOG", soon, "prof-1", "Sanne"),
    ];
    const tasks = await pendingTasks(ACTOR);
    const expiry = tasks.filter((t) => t.kind === "franchise-credential-expiry");
    expect(expiry).toHaveLength(1);
    expect(expiry[0]?.title).toContain("1 certificaat verloopt");
  });

  it("verbergt een echte verloop-taak niet achter een grote berg onbeperkt-geldige certs (MAX-slice)", async () => {
    // Regressie op de MAX-slice-should-fix: een tenant met ver boven MAX onbeperkt-geldige certs
    // (`expiresAt = null`, bv. BIG-registraties) op ándere roster-leden + één echt in-venster
    // verlopend cert. De kandidaat-query filtert op (now, soon], dus de nulls consumeren geen slot
    // en de verloop-taak blijft zichtbaar.
    const bulk = Array.from({ length: 80 }, (_v, i) =>
      cred(`null-${i}`, "BIG", null, `prof-null-${i}`, "Ander"),
    );
    state.creds = [...bulk, cred("echt", "LICENSE", soon, "prof-1", "Sanne")];
    const tasks = await pendingTasks(ACTOR);
    const expiry = tasks.filter((t) => t.kind === "franchise-credential-expiry");
    expect(expiry).toHaveLength(1);
    expect(expiry[0]?.id).toBe("franchise-credential-expiry:prof-1");
  });
});
