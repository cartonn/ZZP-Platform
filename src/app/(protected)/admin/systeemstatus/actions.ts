"use server";

import { randomUUID } from "node:crypto";
import { requireRole } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { requestMeta } from "@/lib/request-meta";
import {
  createRateLimitStore,
  mailSelfTestRateLimiter,
  rateLimitSelfTestRateLimiter,
  storageSelfTestRateLimiter,
  UpstashRateLimitStore,
  verifierSelfTestRateLimiter,
} from "@/lib/rate-limit";
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
  inactiveRateLimitReport,
  runRateLimitSelfTest,
  type RateLimitSelfTestReport,
} from "@/lib/services/ratelimit-selftest";
import { getStorage } from "@/lib/services/storage";
import {
  runStorageSelfTest,
  SELFTEST_PREFIX,
  type StorageSelfTestReport,
} from "@/lib/services/storage-selftest";

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

  const diplomaActive = process.env.DIPLOMA_VERIFIER === "duo";
  const bigActive = process.env.BIG_VERIFIER === "bigregister";
  const identityActive = process.env.IDENTITY_VERIFIER === "idin";

  const specs: VerifierProbeSpec[] = [
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
