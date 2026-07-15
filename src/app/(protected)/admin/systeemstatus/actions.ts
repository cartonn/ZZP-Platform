"use server";

import { randomUUID } from "node:crypto";
import { requireRole } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { requestMeta } from "@/lib/request-meta";
import { mailSelfTestRateLimiter, storageSelfTestRateLimiter } from "@/lib/rate-limit";
import { getMailSender } from "@/lib/services/mail-sender";
import { runMailSelfTest, type MailSelfTestReport } from "@/lib/services/mail-selftest";
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
