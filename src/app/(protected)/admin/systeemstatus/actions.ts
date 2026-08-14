"use server";

import { randomUUID } from "node:crypto";
import { requireRole } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { parsePoolConfig } from "@/lib/db-connection";
import { requestMeta } from "@/lib/request-meta";
import {
  billingSelfTestRateLimiter,
  createRateLimitStore,
  dbSelfTestRateLimiter,
  errorMonitoringSelfTestRateLimiter,
  mailSelfTestRateLimiter,
  passwordBreachSelfTestRateLimiter,
  rateLimitSelfTestRateLimiter,
  routingSelfTestRateLimiter,
  selfTestSweepRateLimiter,
  storageSelfTestRateLimiter,
  uploadScannerSelfTestRateLimiter,
  UpstashRateLimitStore,
  verifierSelfTestRateLimiter,
} from "@/lib/rate-limit";
import {
  runSelfTestSweep,
  type SweepReport,
  type SweepRunResult,
} from "@/lib/services/selftest-sweep";
import { detectDbProvider, runDbSelfTest, type DbSelfTestReport } from "@/lib/services/db-selftest";
import { probeErrorMonitoring } from "@/lib/observability/report";
import {
  runErrorMonitoringSelfTest,
  type ErrorMonitoringSelfTestReport,
} from "@/lib/services/error-monitoring-selftest";
import { getPaymentProvider } from "@/lib/billing/provider";
import {
  runBillingSelfTest,
  type BillingDriverMode,
  type BillingSelfTestReport,
} from "@/lib/services/billing-selftest";
import { bigEndpointConfig } from "@/lib/services/big-verifier";
import { duoEndpointConfig } from "@/lib/services/diploma-verifier";
import { idinEndpointConfig } from "@/lib/services/identity-verifier";
import { verifyViaHttp } from "@/lib/services/http-verify";
import {
  runVerifierSelfTest,
  type VerifierProbeSpec,
  type VerifierSelfTestReport,
} from "@/lib/services/verify-selftest";
import { getMailSender } from "@/lib/services/mail-sender";
import { runMailSelfTest, type MailSelfTestReport } from "@/lib/services/mail-selftest";
import {
  runMailConnectivitySelfTest,
  type MailDriverMode,
} from "@/lib/services/mail-connectivity-selftest";
import {
  inactiveRateLimitReport,
  runRateLimitSelfTest,
  type RateLimitSelfTestReport,
} from "@/lib/services/ratelimit-selftest";
import { getStorage, resolveExpectedSse } from "@/lib/services/storage";
import {
  runStorageSelfTest,
  SELFTEST_PREFIX,
  type StorageSelfTestReport,
} from "@/lib/services/storage-selftest";
import { checkRoutingConnectivity, configuredRoutingProvider } from "@/lib/services/routing";
import {
  runRoutingSelfTest,
  type RoutingDriverMode,
  type RoutingSelfTestReport,
} from "@/lib/services/routing-selftest";
import { getUploadScanner, uploadScanFailOpen } from "@/lib/services/upload-scanner";
import {
  eicarProbeBuffer,
  runUploadScannerSelfTest,
  type UploadScannerDriverMode,
  type UploadScannerSelfTestReport,
} from "@/lib/services/upload-scanner-selftest";
import { getPasswordBreachChecker } from "@/lib/services/password-breach";
import {
  BREACH_PROBE_PASSWORD,
  runPasswordBreachSelfTest,
  type PasswordBreachDriverMode,
  type PasswordBreachSelfTestReport,
} from "@/lib/services/password-breach-selftest";

export type StorageSelfTestState =
  | { ok: true; report: StorageSelfTestReport }
  | { ok: false; error: string };

/**
 * Draait een connectiviteitszelftest tegen de geconfigureerde documentopslag (admin-only). Volgt
 * de mutatieketen (auth → rol → rate-limit → actie → audit): een echte round-trip (put → exists →
 * get → delete) onder een `.selftest/`-prefix bewijst dat de opslag bereikbaar én beschrijfbaar is.
 * De uitvoer bevat nooit secrets — alleen stap-uitkomsten en een driver-modus.
 */
export async function runStorageSelfTestAction(): Promise<StorageSelfTestState> {
  const actor = await requireRole("ADMIN");

  if (!(await storageSelfTestRateLimiter.check(actor.id)).allowed) {
    return { ok: false, error: "Te veel zelftests achter elkaar. Wacht even en probeer opnieuw." };
  }

  const driverMode = process.env.STORAGE_DRIVER ?? "local";
  const probeKey = `${SELFTEST_PREFIX}${randomUUID()}.txt`;

  const report = await runStorageSelfTest({
    driver: getStorage(),
    driverMode,
    probeKey,
    expectedSse: resolveExpectedSse(),
  });

  const meta = await requestMeta();
  await audit({
    actorId: actor.id,
    action: "STORAGE_SELFTEST_RUN",
    entityType: "Storage",
    entityId: driverMode,
    metadata: {
      ok: report.ok,
      steps: report.steps.map((s) => ({ key: s.key, ok: s.ok })),
    },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  return { ok: true, report };
}

export type MailSelfTestState =
  | { ok: true; report: MailSelfTestReport }
  | { ok: false; error: string };

/**
 * Stuurt een echte testmail via het geconfigureerde e-mailkanaal (admin-only) om te bevestigen dat
 * de provider daadwerkelijk aflevert ná het instellen van de sleutels (MENSENWERK §2). Volgt de
 * mutatieketen (auth → rol → rate-limit → actie → audit). Het ontvangeradres is **niet** vrij te
 * kiezen buiten wat de beheerder invult; het wordt gevalideerd in de pure kern. De audit- en
 * loguitvoer bevat **nooit** het adres (persoonsgegeven — parity met de mail-sender) of secrets,
 * alleen de uitkomst en de driver-modus.
 */
export async function runMailSelfTestAction(recipient: string): Promise<MailSelfTestState> {
  const actor = await requireRole("ADMIN");

  if (!(await mailSelfTestRateLimiter.check(actor.id)).allowed) {
    return { ok: false, error: "Te veel zelftests achter elkaar. Wacht even en probeer opnieuw." };
  }

  const driverMode = process.env.EMAIL_DRIVER ?? "noop";
  const report = await runMailSelfTest({
    sender: getMailSender(),
    driverMode,
    recipient: typeof recipient === "string" ? recipient : "",
    token: randomUUID().slice(0, 8),
  });

  const meta = await requestMeta();
  await audit({
    actorId: actor.id,
    action: "MAIL_SELFTEST_RUN",
    entityType: "Mail",
    entityId: driverMode,
    // Geen ontvangeradres: e-mailadressen zijn persoonsgegevens en horen niet in het auditlog.
    metadata: { ok: report.ok, delivered: report.delivered },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  return { ok: true, report };
}

export type VerifierSelfTestState =
  | { ok: true; report: VerifierSelfTestReport }
  | { ok: false; error: string };

// Synthetische probe-invoer per adapter: goed-geformatteerd maar duidelijk niet-echt. Bereikt het
// endpoint en levert normaal een `verified:false` op (onbekende code/nummer) — een gezonde
// contract-uitkomst die bereikbaarheid + auth bewijst zonder een echt "geverifieerd"-signaal.
const PROBE_HOLDER = "Zelftest Connectiviteit";

/**
 * Bouwt de verificatie-probe-specs uit de omgeving (DUO/BIG/iDIN). Gedeeld door de losse
 * verificatie-zelftest én de go-live-sweep, zodat de synthetische probe-invoer en de actief-detectie
 * op één plek staan. Adapters op de demo-verifier (`mock`) krijgen geen `run` — die worden als
 * "niets getest" gerapporteerd.
 */
function buildVerifierProbeSpecs(): VerifierProbeSpec[] {
  const diplomaActive = process.env.DIPLOMA_VERIFIER === "duo";
  const bigActive = process.env.BIG_VERIFIER === "bigregister";
  const identityActive = process.env.IDENTITY_VERIFIER === "idin";

  return [
    {
      key: "diploma",
      label: "DUO — diploma's",
      active: diplomaActive,
      driverMode: diplomaActive ? "duo" : "mock",
      run: diplomaActive
        ? () =>
            verifyViaHttp(duoEndpointConfig(), {
              verificationCode: "DUO-0000-0000",
              holderName: PROBE_HOLDER,
            })
        : undefined,
    },
    {
      key: "big",
      label: "BIG-register — zorgberoepen",
      active: bigActive,
      driverMode: bigActive ? "bigregister" : "mock",
      run: bigActive
        ? () =>
            verifyViaHttp(bigEndpointConfig(), {
              bigNumber: "00000000000",
              holderName: PROBE_HOLDER,
            })
        : undefined,
    },
    {
      key: "identity",
      label: "iDIN — identiteit",
      active: identityActive,
      driverMode: identityActive ? "idin" : "mock",
      run: identityActive
        ? () =>
            verifyViaHttp(idinEndpointConfig(), {
              accountName: PROBE_HOLDER,
              providedName: PROBE_HOLDER,
            })
        : undefined,
    },
  ];
}

/**
 * Draait een connectiviteitszelftest tegen de geconfigureerde externe verificatie-adapters
 * (DUO/BIG/iDIN) (admin-only). Volgt de mutatieketen (auth → rol → rate-limit → actie → audit).
 * Per adapter die op de echte waarde staat (`DIPLOMA_VERIFIER=duo` enz.) doet hij een echte
 * round-trip met een synthetische probe; adapters op de demo-verifier (`mock`) worden eerlijk als
 * "niets getest" gemeld (geen vals groen). De zelftest toetst alleen bereikbaarheid + auth +
 * contract-vorm, nooit of de probe "geverifieerd" is. De uitvoer bevat nooit secrets — alleen
 * stap-uitkomsten, veilige verifier-berichten en de driver-modus.
 */
export async function runVerifierSelfTestAction(): Promise<VerifierSelfTestState> {
  const actor = await requireRole("ADMIN");

  if (!(await verifierSelfTestRateLimiter.check(actor.id)).allowed) {
    return { ok: false, error: "Te veel zelftests achter elkaar. Wacht even en probeer opnieuw." };
  }

  const specs = buildVerifierProbeSpecs();

  const report = await runVerifierSelfTest(specs);

  const meta = await requestMeta();
  await audit({
    actorId: actor.id,
    action: "VERIFIER_SELFTEST_RUN",
    entityType: "Verifier",
    entityId: [
      specs.find((s) => s.key === "diploma")?.driverMode,
      specs.find((s) => s.key === "big")?.driverMode,
      specs.find((s) => s.key === "identity")?.driverMode,
    ].join(","),
    metadata: {
      ok: report.ok,
      anyActive: report.anyActive,
      results: report.results.map((r) => ({ key: r.key, active: r.active, ok: r.ok })),
    },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  return { ok: true, report };
}

export type RateLimitSelfTestState =
  | { ok: true; report: RateLimitSelfTestReport }
  | { ok: false; error: string };

/**
 * Draait een connectiviteitszelftest tegen de gedeelde rate-limit-store (admin-only). Volgt de
 * mutatieketen (auth → rol → rate-limit → actie → audit). Draait de store op de veilige in-memory
 * default (RATE_LIMIT_STORE=memory), dan is er niets gedeelds om te testen en meldt de zelftest dat
 * eerlijk (geen vals groen). Op Upstash doet hij een echte round-trip (INCR → PEXPIRE/PTTL → DEL →
 * EXISTS) die fouten juist zichtbaar maakt — nodig omdat de store fail-open is (MENSENWERK §0b H-2).
 * De uitvoer bevat nooit secrets — alleen stap-uitkomsten en een store-modus.
 */
export async function runRateLimitSelfTestAction(): Promise<RateLimitSelfTestState> {
  const actor = await requireRole("ADMIN");

  if (!(await rateLimitSelfTestRateLimiter.check(actor.id)).allowed) {
    return { ok: false, error: "Te veel zelftests achter elkaar. Wacht even en probeer opnieuw." };
  }

  const storeMode = process.env.RATE_LIMIT_STORE ?? "memory";
  const store = createRateLimitStore();

  let report: RateLimitSelfTestReport;
  if (store instanceof UpstashRateLimitStore) {
    // Eigen, duidelijk gemarkeerde probe-key onder het `rl:`-namespace; raakt geen echte tellers.
    const probeKey = `rl:selftest:${randomUUID()}`;
    report = await runRateLimitSelfTest({
      exec: (commands) => store.runProbeCommands(commands),
      storeMode,
      probeKey,
    });
  } else {
    // Geen gedeelde store actief (memory, of upstash zonder secrets → defensieve fallback).
    report = inactiveRateLimitReport(storeMode);
  }

  const meta = await requestMeta();
  await audit({
    actorId: actor.id,
    action: "RATELIMIT_SELFTEST_RUN",
    entityType: "RateLimitStore",
    entityId: storeMode,
    metadata: {
      ok: report.ok,
      active: report.active,
      steps: report.steps.map((s) => ({ key: s.key, ok: s.ok })),
    },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  return { ok: true, report };
}

export type BillingSelfTestState =
  | { ok: true; report: BillingSelfTestReport }
  | { ok: false; error: string };

/**
 * Draait een connectiviteitszelftest tegen de geconfigureerde betaalprovider (admin-only). Volgt de
 * mutatieketen (auth → rol → rate-limit → actie → audit). Staat de betaalflow op de demo
 * (BILLING_PROVIDER=noop), dan is er niets externs om te testen en meldt de zelftest dat eerlijk
 * (geen vals groen). Op Stripe/Mollie doet hij een READ-ONLY round-trip (Stripe /balance, Mollie
 * /methods) die bereikbaarheid + geldige sleutel bevestigt ZONDER een betaling/checkout aan te
 * maken (MENSENWERK §3). De uitvoer bevat nooit secrets — alleen de uitkomst en de driver-modus.
 */
export async function runBillingSelfTestAction(): Promise<BillingSelfTestState> {
  const actor = await requireRole("ADMIN");

  if (!(await billingSelfTestRateLimiter.check(actor.id)).allowed) {
    return { ok: false, error: "Te veel zelftests achter elkaar. Wacht even en probeer opnieuw." };
  }

  const providerMode = process.env.BILLING_PROVIDER;
  const active = providerMode === "stripe" || providerMode === "mollie";
  const driverMode: BillingDriverMode = active ? providerMode : "noop";

  const report = await runBillingSelfTest({
    active,
    driverMode,
    run: active ? () => getPaymentProvider().checkConnectivity() : undefined,
  });

  const meta = await requestMeta();
  await audit({
    actorId: actor.id,
    action: "BILLING_SELFTEST_RUN",
    entityType: "Billing",
    entityId: driverMode,
    metadata: { ok: report.ok, active: report.active },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  return { ok: true, report };
}

export type RoutingSelfTestState =
  | { ok: true; report: RoutingSelfTestReport }
  | { ok: false; error: string };

/**
 * Draait een connectiviteitszelftest tegen de geconfigureerde routing-provider (admin-only). Volgt de
 * mutatieketen (auth → rol → rate-limit → actie → audit). Staat routing op de offline schatter
 * (ROUTING_PROVIDER=offline), dan is er niets externs om te testen en meldt de zelftest dat eerlijk
 * (geen vals groen). Op Geoapify doet hij een READ-ONLY geocode-round-trip die bereikbaarheid +
 * geldige sleutel bevestigt ZONDER de cache te muteren of een route te berekenen (MENSENWERK §1c-
 * achtig patroon voor de reistijd-koppeling). De uitvoer bevat nooit secrets — alleen de uitkomst en
 * de driver-modus.
 */
export async function runRoutingSelfTestAction(): Promise<RoutingSelfTestState> {
  const actor = await requireRole("ADMIN");

  if (!(await routingSelfTestRateLimiter.check(actor.id)).allowed) {
    return { ok: false, error: "Te veel zelftests achter elkaar. Wacht even en probeer opnieuw." };
  }

  const provider = configuredRoutingProvider();
  const active = provider === "geoapify";
  const driverMode: RoutingDriverMode = provider;

  const report = await runRoutingSelfTest({
    active,
    driverMode,
    run: active ? () => checkRoutingConnectivity() : undefined,
  });

  const meta = await requestMeta();
  await audit({
    actorId: actor.id,
    action: "ROUTING_SELFTEST_RUN",
    entityType: "Routing",
    entityId: driverMode,
    metadata: { ok: report.ok, active: report.active },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  return { ok: true, report };
}

export type UploadScannerSelfTestState =
  | { ok: true; report: UploadScannerSelfTestReport }
  | { ok: false; error: string };

/**
 * Draait een connectiviteitszelftest tegen de geconfigureerde upload-scanner (admin-only). Volgt de
 * mutatieketen (auth → rol → rate-limit → actie → audit): één round-trip tegen de ClamAV-daemon met
 * de EICAR-testprobe bewijst dat de scanner bereikbaar is én daadwerkelijk detecteert — zonder een
 * echt bestand op te slaan. Draait de scan op de default (`noop`), dan is er niets externs om te
 * testen en wordt dat eerlijk gemeld (geen vals groen). De uitvoer bevat nooit secrets — alleen
 * stap-uitkomsten en de driver-modus.
 */
export async function runUploadScannerSelfTestAction(): Promise<UploadScannerSelfTestState> {
  const actor = await requireRole("ADMIN");

  if (!(await uploadScannerSelfTestRateLimiter.check(actor.id)).allowed) {
    return { ok: false, error: "Te veel zelftests achter elkaar. Wacht even en probeer opnieuw." };
  }

  const active = process.env.UPLOAD_SCANNER === "clamav";
  const driverMode: UploadScannerDriverMode = active ? "clamav" : "noop";

  const report = await runUploadScannerSelfTest({
    active,
    driverMode,
    failOpen: uploadScanFailOpen(),
    run: active ? () => getUploadScanner().scan(eicarProbeBuffer()) : undefined,
  });

  const meta = await requestMeta();
  await audit({
    actorId: actor.id,
    action: "UPLOAD_SCANNER_SELFTEST_RUN",
    entityType: "UploadScanner",
    entityId: driverMode,
    metadata: { ok: report.ok, active: report.active },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  return { ok: true, report };
}

export type PasswordBreachSelfTestState =
  | { ok: true; report: PasswordBreachSelfTestReport }
  | { ok: false; error: string };

/**
 * Bouwt de probe-spec voor de gelekt-wachtwoord-controle uit de omgeving. Gedeeld door de losse
 * zelftest én de go-live-sweep, zodat de actief-detectie (`PASSWORD_BREACH_CHECK=hibp`) en het
 * bekend-gelekte probe-wachtwoord op één plek staan. Staat de controle op de demo (`noop`), dan
 * krijgt de spec geen `run` — die wordt eerlijk als "niets getest" gerapporteerd.
 */
function buildPasswordBreachProbeSpec() {
  const active = process.env.PASSWORD_BREACH_CHECK === "hibp";
  const driverMode: PasswordBreachDriverMode = active ? "hibp" : "noop";
  return {
    active,
    driverMode,
    run: active ? () => getPasswordBreachChecker().check(BREACH_PROBE_PASSWORD) : undefined,
  };
}

/**
 * Draait een connectiviteitszelftest tegen de geconfigureerde gelekt-wachtwoord-controle (admin-only).
 * Volgt de mutatieketen (auth → rol → rate-limit → actie → audit). Staat de controle op de demo
 * (PASSWORD_BREACH_CHECK ontbreekt/noop), dan is er niets externs om te testen en meldt de zelftest
 * dat eerlijk (geen vals groen). Op HIBP haalt hij één bekend-gelekt test-wachtwoord (k-anoniem, alleen
 * een SHA-1-prefix verlaat de server) door de controle en bevestigt zo dat de koppeling bereikbaar is
 * ÉN daadwerkelijk detecteert — nodig omdat de controle fail-open is (MENSENWERK §5d): een stille
 * HIBP-storing laat anders elk wachtwoord door zonder dat iets dat toont. De uitvoer bevat nooit
 * secrets of PII — alleen de uitkomst en de driver-modus.
 */
export async function runPasswordBreachSelfTestAction(): Promise<PasswordBreachSelfTestState> {
  const actor = await requireRole("ADMIN");

  if (!(await passwordBreachSelfTestRateLimiter.check(actor.id)).allowed) {
    return { ok: false, error: "Te veel zelftests achter elkaar. Wacht even en probeer opnieuw." };
  }

  const spec = buildPasswordBreachProbeSpec();
  const report = await runPasswordBreachSelfTest(spec);

  const meta = await requestMeta();
  await audit({
    actorId: actor.id,
    action: "PASSWORD_BREACH_SELFTEST_RUN",
    entityType: "PasswordBreach",
    entityId: spec.driverMode,
    metadata: { ok: report.ok, active: report.active },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  return { ok: true, report };
}

export type ErrorMonitoringSelfTestState =
  | { ok: true; report: ErrorMonitoringSelfTestReport }
  | { ok: false; error: string };

/**
 * Draait een connectiviteitszelftest tegen de externe error-monitoring (admin-only). Volgt de
 * mutatieketen (auth → rol → rate-limit → actie → audit). Is er geen monitoring geconfigureerd
 * (SENTRY_DSN ontbreekt), dan is er niets externs te testen en meldt de zelftest dat eerlijk (geen
 * vals groen). Anders stuurt hij één synthetische testgebeurtenis en wacht op flush — dat maakt de
 * grootste stille faalmodus zichtbaar: een gezette DSN terwijl @sentry/nextjs niet geïnstalleerd is
 * (reporter valt dan geruisloos terug op console-loggen). De uitvoer bevat nooit de DSN of secrets —
 * alleen de uitkomst (pakket geïnstalleerd / afgeleverd) en een korte, veilige toelichting.
 */
export async function runErrorMonitoringSelfTestAction(): Promise<ErrorMonitoringSelfTestState> {
  const actor = await requireRole("ADMIN");

  if (!(await errorMonitoringSelfTestRateLimiter.check(actor.id)).allowed) {
    return { ok: false, error: "Te veel zelftests achter elkaar. Wacht even en probeer opnieuw." };
  }

  const active = Boolean(process.env.SENTRY_DSN);
  const report = await runErrorMonitoringSelfTest({
    active,
    run: active ? () => probeErrorMonitoring(randomUUID().slice(0, 8)) : undefined,
  });

  const meta = await requestMeta();
  await audit({
    actorId: actor.id,
    action: "ERROR_MONITORING_SELFTEST_RUN",
    entityType: "ErrorMonitoring",
    entityId: active ? "sentry" : "console",
    metadata: {
      ok: report.ok,
      active: report.active,
      packageInstalled: report.packageInstalled,
      delivered: report.delivered,
    },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  return { ok: true, report };
}

export type DbSelfTestState = { ok: true; report: DbSelfTestReport } | { ok: false; error: string };

/**
 * Draait een connectiviteits-/schema-zelftest tegen de databank (admin-only). Volgt de mutatieketen
 * (auth → rol → rate-limit → actie → audit). De probes zijn **read-only** (SELECT 1 + bestaanscheck
 * op kern-tabellen) — geen mutatie, niets op te ruimen — en bewijzen dat de databank bereikbaar is,
 * op de verwachte provider draait en dat het schema/de migratie daadwerkelijk is toegepast (een
 * half-mislukte `prisma db push` op boot zou anders stil een verouderd schema achterlaten). De
 * uitvoer bevat nooit de DATABASE_URL of secrets — alleen de afgeleide provider, latency, een
 * samenvatting van de pool-config en per-stap-uitkomsten.
 */
export async function runDbSelfTestAction(): Promise<DbSelfTestState> {
  const actor = await requireRole("ADMIN");

  if (!(await dbSelfTestRateLimiter.check(actor.id)).allowed) {
    return { ok: false, error: "Te veel zelftests achter elkaar. Wacht even en probeer opnieuw." };
  }

  const provider = detectDbProvider(process.env.DATABASE_URL);
  const report = await runDbSelfTest({
    provider,
    pool: parsePoolConfig({
      DATABASE_CONNECTION_LIMIT: process.env.DATABASE_CONNECTION_LIMIT,
      DATABASE_POOL_TIMEOUT: process.env.DATABASE_POOL_TIMEOUT,
      DATABASE_PGBOUNCER: process.env.DATABASE_PGBOUNCER,
    }),
    now: () => Date.now(),
    probe: {
      ping: () => prisma.$queryRaw`SELECT 1`,
      // Read-only bestaanscheck op enkele kern-tabellen (LIMIT 1); werpt wanneer het schema
      // ontbreekt (bv. "relation does not exist" / "no such table").
      checkSchema: () =>
        Promise.all([
          prisma.user.findFirst({ select: { id: true } }),
          prisma.auditLog.findFirst({ select: { id: true } }),
          prisma.credential.findFirst({ select: { id: true } }),
        ]),
    },
  });

  const meta = await requestMeta();
  await audit({
    actorId: actor.id,
    action: "DB_SELFTEST_RUN",
    entityType: "Database",
    entityId: provider,
    metadata: {
      ok: report.ok,
      provider: report.provider,
      steps: report.steps.map((s) => ({ key: s.key, ok: s.ok })),
    },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  return { ok: true, report };
}

export type SelfTestSweepState = { ok: true; report: SweepReport } | { ok: false; error: string };

/**
 * Go-live-sweep: draait álle actieve, bijwerkingsveilige connectiviteitszelftests (opslag, database,
 * rate-limit, verificatie, betaalprovider, routing, upload-scanner, gelekt-wachtwoord-controle,
 * error-monitoring, e-mail) in één klik en
 * geeft een geconsolideerd GO/NO-GO terug (admin-only). Volgt de mutatieketen (auth → rol →
 * rate-limit → actie → audit). Elke deelzelftest hergebruikt zijn eigen pure kern; een integratie die
 * op een veilige fallback/demo draait wordt eerlijk als "overgeslagen" gerapporteerd (geen vals groen).
 *
 * Mail draait mee via de READ-ONLY connectiviteitscheck (`checkConnectivity` — Resend GET /domains,
 * SMTP verify()), die géén mail verstuurt en dus bulk-veilig is. De losse mail-zelftest die een
 * ECHTE testmail naar een ontvanger stuurt (deliverability-bevestiging) blijft bewust buiten de sweep
 * — dat hoort een aparte, bewuste handeling te zijn. De uitvoer bevat nooit secrets — alleen
 * pass/fail/skipped per integratie, een driver-modus en een korte, veilige toelichting.
 */
export async function runSelfTestSweepAction(): Promise<SelfTestSweepState> {
  const actor = await requireRole("ADMIN");

  if (!(await selfTestSweepRateLimiter.check(actor.id)).allowed) {
    return { ok: false, error: "Te veel zelftests achter elkaar. Wacht even en probeer opnieuw." };
  }

  const report = await runSelfTestSweep([
    {
      key: "storage",
      label: "Documentopslag",
      run: async (): Promise<SweepRunResult> => {
        const driverMode = process.env.STORAGE_DRIVER ?? "local";
        const result = await runStorageSelfTest({
          driver: getStorage(),
          driverMode,
          probeKey: `${SELFTEST_PREFIX}${randomUUID()}.txt`,
          expectedSse: resolveExpectedSse(),
        });
        return {
          status: result.ok ? "pass" : "fail",
          mode: driverMode,
          detail: result.ok
            ? "Bereikbaar en beschrijfbaar."
            : (result.steps.find((s) => !s.ok)?.detail ?? "Round-trip faalde."),
        };
      },
    },
    {
      key: "database",
      label: "Database",
      run: async (): Promise<SweepRunResult> => {
        const provider = detectDbProvider(process.env.DATABASE_URL);
        const result = await runDbSelfTest({
          provider,
          pool: parsePoolConfig({
            DATABASE_CONNECTION_LIMIT: process.env.DATABASE_CONNECTION_LIMIT,
            DATABASE_POOL_TIMEOUT: process.env.DATABASE_POOL_TIMEOUT,
            DATABASE_PGBOUNCER: process.env.DATABASE_PGBOUNCER,
          }),
          now: () => Date.now(),
          probe: {
            ping: () => prisma.$queryRaw`SELECT 1`,
            checkSchema: () =>
              Promise.all([
                prisma.user.findFirst({ select: { id: true } }),
                prisma.auditLog.findFirst({ select: { id: true } }),
                prisma.credential.findFirst({ select: { id: true } }),
              ]),
          },
        });
        return {
          status: result.ok ? "pass" : "fail",
          mode: result.provider,
          detail: result.ok
            ? `Bereikbaar (${result.latencyMs ?? "?"} ms), schema toegepast.`
            : (result.steps.find((s) => !s.ok)?.detail ?? "Round-trip faalde."),
        };
      },
    },
    {
      key: "ratelimit",
      label: "Rate-limit-store",
      run: async (): Promise<SweepRunResult> => {
        const storeMode = process.env.RATE_LIMIT_STORE ?? "memory";
        const store = createRateLimitStore();
        const result =
          store instanceof UpstashRateLimitStore
            ? await runRateLimitSelfTest({
                exec: (commands) => store.runProbeCommands(commands),
                storeMode,
                probeKey: `rl:selftest:${randomUUID()}`,
              })
            : inactiveRateLimitReport(storeMode);
        return {
          status: !result.active ? "skipped" : result.ok ? "pass" : "fail",
          mode: storeMode,
          detail: !result.active
            ? "Geen gedeelde store actief — niets getest."
            : result.ok
              ? "Gedeelde store bereikbaar."
              : (result.steps.find((s) => !s.ok)?.detail ?? "Round-trip faalde."),
        };
      },
    },
    {
      key: "verifier",
      label: "Verificatie-adapters",
      run: async (): Promise<SweepRunResult> => {
        const specs = buildVerifierProbeSpecs();
        const result = await runVerifierSelfTest(specs);
        const mode =
          specs
            .filter((s) => s.active)
            .map((s) => s.driverMode)
            .join(", ") || "mock";
        return {
          status: !result.anyActive ? "skipped" : result.ok ? "pass" : "fail",
          mode,
          detail: !result.anyActive
            ? "Alle adapters op de demo-verifier — niets getest."
            : result.ok
              ? "Actieve adapters bereikbaar."
              : (result.results.find((r) => r.active && !r.ok)?.detail ?? "Round-trip faalde."),
        };
      },
    },
    {
      key: "billing",
      label: "Betaalprovider",
      run: async (): Promise<SweepRunResult> => {
        const providerMode = process.env.BILLING_PROVIDER;
        const active = providerMode === "stripe" || providerMode === "mollie";
        const driverMode: BillingDriverMode = active ? providerMode : "noop";
        const result = await runBillingSelfTest({
          active,
          driverMode,
          run: active ? () => getPaymentProvider().checkConnectivity() : undefined,
        });
        return {
          status: !result.active ? "skipped" : result.ok ? "pass" : "fail",
          mode: driverMode,
          detail: result.detail ?? (result.ok ? "Bereikbaar." : "Koppeling faalt."),
        };
      },
    },
    {
      key: "routing",
      label: "Routing-provider",
      run: async (): Promise<SweepRunResult> => {
        const provider = configuredRoutingProvider();
        const active = provider === "geoapify";
        const driverMode: RoutingDriverMode = provider;
        const result = await runRoutingSelfTest({
          active,
          driverMode,
          run: active ? () => checkRoutingConnectivity() : undefined,
        });
        return {
          status: !result.active ? "skipped" : result.ok ? "pass" : "fail",
          mode: driverMode,
          detail:
            result.detail ??
            (!result.active
              ? "Offline schatting — niets getest."
              : result.ok
                ? "Bereikbaar."
                : "Koppeling faalt."),
        };
      },
    },
    {
      key: "upload-scanner",
      label: "Upload-scanner",
      run: async (): Promise<SweepRunResult> => {
        const active = process.env.UPLOAD_SCANNER === "clamav";
        const driverMode: UploadScannerDriverMode = active ? "clamav" : "noop";
        const result = await runUploadScannerSelfTest({
          active,
          driverMode,
          failOpen: uploadScanFailOpen(),
          run: active ? () => getUploadScanner().scan(eicarProbeBuffer()) : undefined,
        });
        return {
          status: !result.active ? "skipped" : result.ok ? "pass" : "fail",
          mode: driverMode,
          detail: result.detail ?? (result.ok ? "Bereikbaar en detecteert." : "Scanner faalt."),
        };
      },
    },
    {
      key: "password-breach",
      label: "Gelekt-wachtwoord-controle",
      run: async (): Promise<SweepRunResult> => {
        const spec = buildPasswordBreachProbeSpec();
        const result = await runPasswordBreachSelfTest(spec);
        return {
          status: !result.active ? "skipped" : result.ok ? "pass" : "fail",
          mode: spec.driverMode,
          detail:
            result.detail ??
            (!result.active
              ? "Geen controle actief — niets getest."
              : result.ok
                ? "Bereikbaar en detecteert."
                : "Controle faalt."),
        };
      },
    },
    {
      key: "error-monitoring",
      label: "Error-monitoring",
      run: async (): Promise<SweepRunResult> => {
        const active = Boolean(process.env.SENTRY_DSN);
        const result = await runErrorMonitoringSelfTest({
          active,
          run: active ? () => probeErrorMonitoring(randomUUID().slice(0, 8)) : undefined,
        });
        return {
          status: !result.active ? "skipped" : result.ok ? "pass" : "fail",
          mode: active ? "sentry" : "console",
          detail:
            result.detail ?? (result.ok ? "Testgebeurtenis afgeleverd." : "Aflevering faalt."),
        };
      },
    },
    {
      key: "mail",
      label: "E-mail",
      run: async (): Promise<SweepRunResult> => {
        // READ-ONLY connectiviteitscheck (checkConnectivity) — verstuurt géén mail, dus bulk-veilig.
        // De losse deliverability-zelftest (echte testmail) blijft buiten de sweep.
        const rawDriver = process.env.EMAIL_DRIVER ?? "noop";
        const active =
          rawDriver === "smtp" ||
          rawDriver === "resend" ||
          rawDriver === "postmark" ||
          rawDriver === "ses";
        const driverMode: MailDriverMode = active ? rawDriver : "noop";
        const result = await runMailConnectivitySelfTest({
          active,
          driverMode,
          run: active ? () => getMailSender().checkConnectivity() : undefined,
        });
        return {
          status: !result.active ? "skipped" : result.ok ? "pass" : "fail",
          mode: driverMode,
          detail: result.detail ?? (result.ok ? "Bereikbaar." : "Kanaal faalt."),
        };
      },
    },
  ]);

  const meta = await requestMeta();
  await audit({
    actorId: actor.id,
    action: "SELFTEST_SWEEP_RUN",
    entityType: "SystemStatus",
    entityId: report.verdict,
    metadata: {
      verdict: report.verdict,
      counts: report.counts,
      testedCount: report.testedCount,
      entries: report.entries.map((e) => ({ key: e.key, status: e.status })),
    },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  return { ok: true, report };
}
