// Integratietest tegen een ECHTE database. Draait alleen wanneer DATABASE_URL naar PostgreSQL
// wijst (de `e2e-postgres`-job in CI, of lokaal met een Docker-Postgres); op SQLite slaat hij
// zichzelf over, zodat `npm run test` onveranderd blijft.
//
// Lokaal draaien:
//   docker run --rm -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
//   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres" \
//     node scripts/use-db-provider.mjs postgresql && npx prisma db push
//   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres" \
//     npx vitest run src/lib/db/text-search.integration.test.ts

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ciContains, isPostgresUrl } from "./text-search";

const onPostgres = isPostgresUrl(process.env.DATABASE_URL);

// Uniek per run: de seed-data en parallelle runs mogen deze rij nooit raken.
const SLUG = `ci-text-search-${process.pid}-${Date.now()}`;
const NAME = `Verpleegkundige ${SLUG}`;

describe.skipIf(!onPostgres)("ciContains op een echte PostgreSQL", () => {
  // Dynamisch geïmporteerd zodat een overgeslagen run geen PrismaClient aanmaakt.
  let prisma: (typeof import("@/lib/db"))["prisma"];

  beforeAll(async () => {
    ({ prisma } = await import("@/lib/db"));
    await prisma.skill.create({ data: { name: NAME, slug: SLUG } });
  });

  afterAll(async () => {
    await prisma?.skill.deleteMany({ where: { slug: SLUG } });
    await prisma?.$disconnect();
  });

  it("vindt 'Verpleegkundige' bij een zoekterm in kleine letters", async () => {
    const found = await prisma.skill.findMany({
      where: { slug: SLUG, name: ciContains("verpleegkundige") },
      select: { name: true },
    });
    expect(found.map((s) => s.name)).toEqual([NAME]);
  });

  it("bewijst de divergentie: een kaal contains-filter vindt hem juist NIET", async () => {
    // Dit is precies de bug die deze helper voorkomt — op SQLite zou deze query wél raak zijn.
    const found = await prisma.skill.findMany({
      where: { slug: SLUG, name: { contains: "verpleegkundige" } },
      select: { name: true },
    });
    expect(found).toEqual([]);
  });
});
