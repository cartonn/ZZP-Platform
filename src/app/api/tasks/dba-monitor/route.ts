// Beveiligd HTTP-eindpunt voor de geplande DBA-monitorrun (§6).
// Aanroepen via POST met Authorization: Bearer <CRON_SECRET> of ?token=<CRON_SECRET>.
// Zonder geconfigureerde CRON_SECRET is het eindpunt uitgeschakeld (503).

import { NextResponse } from "next/server";
import { runDbaMonitorTask } from "@/lib/dba-monitor-task";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Taak-endpoint niet geconfigureerd." }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const urlToken = new URL(request.url).searchParams.get("token") ?? "";
  const provided = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : urlToken;

  if (provided !== secret) {
    return NextResponse.json({ error: "Niet geautoriseerd." }, { status: 401 });
  }

  try {
    const result = await runDbaMonitorTask({ actorId: null });
    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json({ error: "Er is een fout opgetreden bij het uitvoeren van de taak." }, { status: 500 });
  }
}
