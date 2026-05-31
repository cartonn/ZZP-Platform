// Beveiligd HTTP-eindpunt voor de geplande verlooptaak.
// Aanroepen via POST met Authorization: Bearer <CRON_SECRET> of ?token=<CRON_SECRET>.
// Zonder geconfigureerde CRON_SECRET is het eindpunt uitgeschakeld (503).

import { NextResponse } from "next/server";
import { runExpiryTask } from "@/lib/expiry-task";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  // Eindpunt is alleen actief als CRON_SECRET is geconfigureerd.
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Taak-endpoint niet geconfigureerd." }, { status: 503 });
  }

  // Lees het token uit de Authorization-header of de query-parameter.
  const authHeader = request.headers.get("authorization") ?? "";
  const urlToken = new URL(request.url).searchParams.get("token") ?? "";
  const provided = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : urlToken;

  // Geen details lekken over wat er precies niet klopt.
  if (provided !== secret) {
    return NextResponse.json({ error: "Niet geautoriseerd." }, { status: 401 });
  }

  try {
    // actorId null = systeemactie (audit ondersteunt null).
    const result = await runExpiryTask({ actorId: null });
    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het uitvoeren van de taak." },
      { status: 500 },
    );
  }
}
