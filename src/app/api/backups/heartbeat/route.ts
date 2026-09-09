// Back-up-heartbeat-eindpunt: de operator laat z'n externe back-up-job (pg_dump / databasedienst)
// na een geslaagde dump POST /api/backups/heartbeat pingen, zodat /admin/systeemstatus kan tonen of
// de database-back-ups nog draaien (dead-man's-switch). Beveiligd met dezelfde Bearer CRON_SECRET
// als de taak-endpoints. Zonder CRON_SECRET: 503 (fail-closed).
//
// Body (optioneel): { "ok": boolean } — laat een back-up-job die zelf faalde een mislukte run
// registreren (ok=false). Ontbreekt de body of is 'ie geen geldige JSON, dan geldt de ping als een
// geslaagde back-up (ok=true) — het pingen zelf is het succes-signaal.

import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron-auth";
import { readLimitedJson } from "@/lib/http/read-limited-text";
import { recordBackupHeartbeat } from "@/lib/observability/backup-heartbeat";

export const dynamic = "force-dynamic";

// Body-grens: de body is hooguit `{ "ok": boolean }`. Een grotere payload wijzen we af vóór parsen
// en valt (als een ontbrekende body) terug op een geslaagde ping — geen onbegrensd bufferen (CWE-400).
const MAX_BODY_BYTES = 1024;

/** Leest een optionele `{ ok }` uit de body; valt bij ontbreken/ongeldig terug op true (geslaagd). */
async function readOk(request: Request): Promise<boolean> {
  const body = await readLimitedJson(request, MAX_BODY_BYTES);
  if (body && typeof body === "object" && "ok" in body) {
    const value = (body as { ok: unknown }).ok;
    if (typeof value === "boolean") return value;
  }
  // Geen/ongeldige/te grote body → een kale ping betekent een geslaagde back-up.
  return true;
}

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Back-up-heartbeat niet geconfigureerd." }, { status: 503 });
  }

  if (!authorizeCron(request, secret)) {
    return NextResponse.json({ error: "Niet geautoriseerd." }, { status: 401 });
  }

  const ok = await readOk(request);
  await recordBackupHeartbeat(ok);

  return NextResponse.json({ recorded: true, ok });
}
