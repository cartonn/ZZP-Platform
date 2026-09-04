// Query-budget — de eerste echte database-integratietest van dit project.
//
// Waarom: élke beschermde pagina rendert eerst de app-shell, en die haalt vier dingen op
// (`navBadges` + `pendingTaskCount` + de ongelezen-meldingenteller + de tenant-branding) vóórdat de
// pagina zelf ook maar één query doet. Op SQLite met een handvol gebruikers valt dat niet op; op
// PostgreSQL met honderden gebruikers is elke query een round-trip én een connectie uit een begrensde
// pool. Unit-tests met een gemockte client kunnen dit per definitie niet zien: die tellen geen
// queries. Daarom draait deze test tegen een echte (wegwerp-)SQLite-database, telt hij de queries via
// het Prisma-`query`-event en legt hij per rol een HARD BUDGET vast. Boven het budget faalt de build
// — een regressierem op de stilste vorm van technische schuld die er is.
//
// Het budget telt query-VORMEN, niet rijen; méér data verandert het aantal queries niet, een extra
// losse query wél. De fixtures liggen vast en de vergelijking is `<=`, dus de test kan alleen falen
// op een écht extra query.
//
// DETERMINISME (belangrijk — hier zat een echte bug). Prisma levert `query`-events ASYNCHROON af: ze
// komen van de query-engine over een kanaal, niet in de promise-keten van de operatie zelf. Direct
// na `await shell(...)` de teller lezen betekent dus dat nog-onderweg zijnde events gemist worden —
// een ondertelling die per run verschilt (gemeten: 35/39/44 voor dezelfde bemiddelaar-shell). Zo'n
// meter is erger dan geen meter: hij maskeert echte regressies én kan een ongerelateerde PR spurious
// laten falen op de verplichte `check`-poort. Oplossing: `drainQueryEvents()` hieronder. Events komen
// in volgorde binnen, dus we voeren ná de meting één herkenbare sentinel-query uit en wachten tot
// diens event binnen is; dan zijn alle eerdere events per definitie ook afgeleverd.
//
// LET OP — dit is een BOVENGRENS. De meter draait buiten een React-request-scope, en dáárbuiten is
// `cache()` (React) een gewone doorgeefluik-aanroep. De gedeelde loaders in user-context.ts
// dedupliceren dus wél in de echte shell (één render = één request-scope), maar niet hier. Wat deze
// test meet is daarmee het aantal queries ZONDER request-dedup: conservatief, en precies wat je van
// een budget wilt. Een reductie die je hier ziet, is per definitie een echte, structurele reductie.

import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import { type PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/** Wegwerp-database, los van dev.db/ci.db zodat de test niets van de ontwikkelaar aanraakt. */
const DB_FILE = "prisma/.query-budget.db";
const DB_URL = "file:./.query-budget.db";

type Role = "FREELANCER" | "CLIENT" | "ADMIN" | "FRANCHISER";
const ROLES: readonly Role[] = ["FREELANCER", "CLIENT", "ADMIN", "FRANCHISER"];

/**
 * Gemeten queries per rol voor de KOUDE app-shell — de volledige berekening (navBadges +
 * pendingTaskCount + meldingenteller + tenant-branding) zoals hij draait wanneer er geen bruikbare
 * signaal-snapshot is. Puur documentatie — de assertion gebruikt `BUDGET`. Reproduceerbaar over runs;
 * zie het determinisme-blok bovenaan.
 */
const BASELINE: Record<Role, number> = {
  FREELANCER: 44,
  CLIENT: 41,
  ADMIN: 18,
  FRANCHISER: 46,
};

/**
 * Hard plafond per rol; boven dit aantal faalt de build. Staat bewust krap boven de baseline (marge
 * voor één onvermijdelijke extra query), zodat een nieuwe losse query in de shell direct opvalt.
 * Zakt de baseline door een reductie, dan gaat het budget mee omlaag — het budget mag nooit stijgen
 * zonder expliciete onderbouwing in de PR.
 */
const BUDGET: Record<Role, number> = {
  FREELANCER: 47,
  CLIENT: 44,
  ADMIN: 21,
  FRANCHISER: 49,
};

/**
 * Hard plafond voor de WARME app-shell: de shell leest zijn signalen uit de gebruikers-snapshot
 * (`readSignalSnapshot`) in plaats van ze opnieuw te berekenen. Dat is het pad dat een gebruiker in
 * de praktijk vrijwel altijd raakt — de koude berekening draait alleen bij de eerste render na een
 * mutatie of na het verlopen van de snapshot-TTL.
 *
 * Wat er dan nog gebeurt (gemeten, exact deze vier query-vormen):
 *   1. `UserSignalSnapshot` — de rij zelf (badges-tellers + /acties- en bel-teller),
 *   2. `UserSignalBadge`    — de badge-rijen van diezelfde snapshot (Prisma's relatie-lezing),
 *   3. `User`               — tenantId opzoeken voor de white-label-merknaam,
 *   4. `Tenant`             — de merknaam/kleur zelf.
 * Nummer 3 en 4 zijn de tenant-branding, niet de signalen; een gebruiker zonder tenant (ADMIN) komt
 * daarom op 3 uit. Boven dit getal is er een losse query bijgekomen — precies wat dit budget bewaakt.
 */
const WARM_BUDGET = 4;

/** De client is via een dynamische import geladen; `$on("query")` bestaat alleen met PRISMA_QUERY_LOG=1. */
type QueryLoggingClient = PrismaClient & {
  $on: (event: "query", cb: (e: { query: string; params: string }) => void) => void;
};

/** Hoe lang we maximaal op het sentinel-event wachten voordat we de meting onbetrouwbaar noemen. */
const DRAIN_TIMEOUT_MS = 10_000;

describe("query-budget: de app-shell per rol", () => {
  let prisma: QueryLoggingClient;
  let queries: string[] = [];
  const fixtures = new Map<Role, string>();
  let shell: (role: Role, userId: string) => Promise<void>;
  let warmShell: (role: Role, userId: string) => Promise<void>;
  let primeSnapshot: (role: Role, userId: string) => Promise<void>;
  let drainQueryEvents: () => Promise<void>;
  const previousUrl = process.env.DATABASE_URL;
  const previousLog = process.env.PRISMA_QUERY_LOG;

  beforeAll(async () => {
    process.env.DATABASE_URL = DB_URL;
    process.env.PRISMA_QUERY_LOG = "1";
    // Geen `--force-reset` nodig (en die vlag is bewust niet-agent-vriendelijk): het bestand is hier
    // verwijderd, dus `db push` bouwt een volledig verse database uit het schema.
    rmSync(DB_FILE, { force: true });
    execSync("npx prisma db push --skip-generate", {
      env: { ...process.env, DATABASE_URL: DB_URL },
      stdio: "ignore",
    });

    // Dynamisch importeren: `@/lib/db` bouwt de Prisma-client op import-moment, dus de env hierboven
    // moet er eerst staan. Statische imports worden gehoist en zouden de dev-database openen.
    const db = await import("@/lib/db");
    prisma = db.prisma as QueryLoggingClient;
    const signals = await import("@/lib/signals");
    const pending = await import("@/lib/actions/pending-tasks");
    const branding = await import("@/lib/franchise/branding");
    const snapshot = await import("@/lib/signals/snapshot");

    // Sentinel-afhandeling: het event van de drain-query telt zelf niet mee en lost de wachtende
    // belofte op. Alle overige events landen in `queries`.
    let awaitingMarker: { marker: string; resolve: () => void } | null = null;
    prisma.$on("query", (event) => {
      if (awaitingMarker && event.params.includes(awaitingMarker.marker)) {
        const done = awaitingMarker.resolve;
        awaitingMarker = null;
        done();
        return;
      }
      queries.push(event.query);
    });

    let drainSeq = 0;
    drainQueryEvents = async () => {
      const marker = `qb-drain-${++drainSeq}`;
      const seen = new Promise<void>((resolve) => {
        awaitingMarker = { marker, resolve };
      });
      // Geparametriseerd (geen string-interpolatie in SQL): de marker komt terug in `event.params`.
      await prisma.$queryRaw`SELECT ${marker} AS qb_marker`;
      let timer: NodeJS.Timeout | undefined;
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                `query-budget: sentinel-event bleef ${DRAIN_TIMEOUT_MS}ms uit — meting onbetrouwbaar`,
              ),
            ),
          DRAIN_TIMEOUT_MS,
        );
      });
      try {
        await Promise.race([seen, timeout]);
      } finally {
        clearTimeout(timer);
      }
    };

    await seed(prisma, fixtures);

    shell = async (role, userId) => {
      await Promise.all([
        signals.navBadges(role, userId),
        pending.pendingTaskCount(userId, role),
        // De bel-teller (ongelezen meldingen) staat inline in de shell — hier exact dezelfde query.
        prisma.notification.count({ where: { userId, readAt: null } }),
        // De shell rendert ook de white-label-merknaam; die kost een eigen query.
        branding.getTenantBranding(userId),
      ]);
      // Alle vier zijn klaar, maar hun query-events kunnen nog onderweg zijn — wachten tot de
      // stream leeg is, anders telt de meter er willekeurig een paar te weinig.
      await drainQueryEvents();
    };

    primeSnapshot = async (role, userId) => {
      await snapshot.recomputeSignalSnapshot(userId, role);
      await drainQueryEvents();
    };

    // De WARME shell: exact wat `AppShell` doet sinds de signalen uit de snapshot komen — één
    // `readSignalSnapshot` (die de badges, de /acties-teller én de bel-teller draagt) plus de
    // tenant-branding.
    warmShell = async (role, userId) => {
      await Promise.all([
        snapshot.readSignalSnapshot(userId, role),
        branding.getTenantBranding(userId),
      ]);
      await drainQueryEvents();
    };
  }, 120_000);

  afterAll(async () => {
    await prisma?.$disconnect();
    // `@/lib/db` bewaart de client buiten productie op globalThis; die global overleeft de
    // module-isolatie van vitest. Opruimen, zodat een volgend testbestand in dezelfde worker geen
    // client erft die naar de zojuist verwijderde wegwerp-database wijst.
    delete (globalThis as { prisma?: unknown }).prisma;
    rmSync(DB_FILE, { force: true });
    rmSync(`${DB_FILE}-journal`, { force: true });
    if (previousUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousUrl;
    if (previousLog === undefined) delete process.env.PRISMA_QUERY_LOG;
    else process.env.PRISMA_QUERY_LOG = previousLog;
  });

  it("telt daadwerkelijk queries (het meetinstrument zelf werkt)", async () => {
    queries = [];
    await prisma.user.count();
    await drainQueryEvents();
    expect(queries.length).toBe(1);
  });

  it("meet reproduceerbaar: dezelfde shell levert twee keer hetzelfde aantal", async () => {
    // Regressietest voor de niet-deterministische meting: zonder het legen van de event-stream
    // verschilde het aantal per run (asynchrone `query`-events), waardoor het budget zowel echte
    // regressies kon maskeren als een ongerelateerde PR spurious kon laten falen.
    const userId = fixtures.get("FRANCHISER")!;
    const counts: number[] = [];
    for (let i = 0; i < 3; i++) {
      queries = [];
      await shell("FRANCHISER", userId);
      counts.push(queries.length);
    }
    expect(counts[1]).toBe(counts[0]);
    expect(counts[2]).toBe(counts[0]);
  }, 60_000);

  for (const role of ROLES) {
    it(`houdt de WARME app-shell (via de snapshot) voor ${role} binnen ${WARM_BUDGET} queries`, async () => {
      const userId = fixtures.get(role);
      expect(userId, `fixture voor ${role} ontbreekt`).toBeDefined();
      // Eerst de snapshot vullen. Bewust via `recomputeSignalSnapshot` (die WÉL op de write wacht)
      // en niet via een koude render: de renderkant schrijft op de achtergrond, dus die geeft geen
      // garantie dat de rij er al staat op het moment dat we meten.
      await primeSnapshot(role, userId!);
      queries = [];
      await warmShell(role, userId!);
      const count = queries.length;
      console.info(`[query-budget] ${role} (warm): ${count} queries`);
      expect(count).toBeLessThanOrEqual(WARM_BUDGET);
    }, 60_000);

    it(`houdt de KOUDE app-shell voor ${role} binnen ${BUDGET[role]} queries`, async () => {
      const userId = fixtures.get(role);
      expect(userId, `fixture voor ${role} ontbreekt`).toBeDefined();
      queries = [];
      await shell(role, userId!);
      const count = queries.length;
      // Log het echte aantal zodat een aanscherping meetbaar is zonder de test te debuggen.
      console.info(`[query-budget] ${role}: ${count} queries (baseline ${BASELINE[role]})`);
      expect(count).toBeLessThanOrEqual(BUDGET[role]);
    }, 60_000);
  }
});

/**
 * Minimale, deterministische dataset. Bewust géén lege database: veel shell-queries zijn
 * VOORWAARDELIJK (een tweede query volgt alleen als de eerste rijen oplevert — bv. het laatste
 * vreemde bericht per gesprek, of de dekkings-certificaten per kandidaat-profiel). Met een lege
 * database blijven die paden ongemeten en zou het budget een regressie daarin missen. Eén gebruiker
 * per rol plus de relaties die die takken openzetten volstaat.
 */
async function seed(prisma: PrismaClient, fixtures: Map<Role, string>): Promise<void> {
  const base = { passwordHash: "x", status: "ACTIVE" };
  const soon = new Date(Date.now() + 10 * 86_400_000);

  const franchiser = await prisma.user.create({
    data: {
      ...base,
      email: "qb-franchise@test.local",
      name: "Query Budget Bemiddeling",
      role: "FRANCHISER",
    },
  });
  const tenant = await prisma.tenant.create({
    data: { name: "Query Budget Tenant", slug: "query-budget", ownerUserId: franchiser.id },
  });
  await prisma.user.update({ where: { id: franchiser.id }, data: { tenantId: tenant.id } });

  const freelancer = await prisma.user.create({
    data: {
      ...base,
      email: "qb-zzp@test.local",
      name: "Query Budget ZZP",
      role: "FREELANCER",
      tenantId: tenant.id,
    },
  });
  const profile = await prisma.freelancerProfile.create({
    data: { userId: freelancer.id, tenantId: tenant.id },
  });
  // Bijna-verlopend geverifieerd certificaat: opent de superseded-/dekkings-vervolgquery (ZZP'er én
  // bemiddelaar-roster).
  await prisma.credential.create({
    data: {
      freelancerProfileId: profile.id,
      type: "DIPLOMA",
      title: "Query Budget diploma",
      status: "VERIFIED",
      verifiedAt: new Date(),
      expiresAt: soon,
    },
  });

  const client = await prisma.user.create({
    data: {
      ...base,
      email: "qb-client@test.local",
      name: "Query Budget BV",
      role: "CLIENT",
      tenantId: tenant.id,
    },
  });
  const company = await prisma.company.create({
    data: { userId: client.id, name: "Query Budget BV", tenantId: tenant.id },
  });
  const job = await prisma.job.create({
    data: {
      companyId: company.id,
      tenantId: tenant.id,
      title: "Query Budget dienst",
      description: "Meetopdracht voor het query-budget.",
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });
  // Openstaande reactie: voedt de kandidaat-takken van de opdrachtgever.
  await prisma.application.create({
    data: { jobId: job.id, freelancerId: profile.id, motivation: "Meetreactie.", status: "NEW" },
  });
  // Gesprek met één onbeantwoord bericht: opent de tweede + derde ongelezen-query (beide partijen).
  const conversation = await prisma.conversation.create({ data: { jobId: job.id } });
  await prisma.conversationParticipant.createMany({
    data: [
      { conversationId: conversation.id, userId: freelancer.id },
      { conversationId: conversation.id, userId: client.id },
    ],
  });
  await prisma.message.create({
    data: { conversationId: conversation.id, senderId: client.id, body: "Meetbericht." },
  });

  const admin = await prisma.user.create({
    data: { ...base, email: "qb-admin@test.local", name: "Query Budget Beheer", role: "ADMIN" },
  });
  // Eén ongelezen melding per rol — de bel-teller in de shell.
  await prisma.notification.createMany({
    data: [freelancer.id, client.id, admin.id, franchiser.id].map((userId) => ({
      userId,
      type: "SYSTEM",
      title: "Meetmelding",
    })),
  });

  fixtures.set("FREELANCER", freelancer.id);
  fixtures.set("CLIENT", client.id);
  fixtures.set("ADMIN", admin.id);
  fixtures.set("FRANCHISER", franchiser.id);
}
