// Playwright global teardown — ruimt e2e-fixtureaccounts op. De abuse/IDOR-suite
// (e2e/qa/critical-personas.spec.ts) registreert via /register accounts als idor-a/idor-b-…@test.local.
// Zonder opruimen stapelen die zich op in een gedeelde dev-DB en vervuilen ze de admin-gebruikerslijst
// + statistiektellingen. Cascade ruimt hun company/jobs mee op; AuditLog.actor is SetNull, dus de
// delete wordt niet geblokkeerd. Niet-fataal: een mislukte teardown mag de suite nooit laten falen.
import { PrismaClient } from "@prisma/client";

export default async function globalTeardown() {
  const prisma = new PrismaClient();
  try {
    const { count } = await prisma.user.deleteMany({
      where: { email: { endsWith: "@test.local" } },
    });
    if (count > 0) {
      console.log(`[e2e teardown] ${count} fixture-account(s) (@test.local) opgeruimd.`);
    }
  } catch (err) {
    console.warn("[e2e teardown] kon fixtureaccounts niet opruimen:", (err as Error).message);
  } finally {
    await prisma.$disconnect();
  }
}
