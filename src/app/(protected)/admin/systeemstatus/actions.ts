"use server";

import { randomUUID } from "node:crypto";
import { requireRole } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { requestMeta } from "@/lib/request-meta";
import { storageSelfTestRateLimiter } from "@/lib/rate-limit";
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
