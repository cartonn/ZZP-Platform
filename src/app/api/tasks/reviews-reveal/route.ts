// Beveiligd HTTP-eindpunt voor de double-blind reveal van beoordelingen (simultane onthulling).
// POST met Authorization: Bearer <CRON_SECRET> Zonder CRON_SECRET: 503.

import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron-auth";
import { runReviewsRevealTask } from "@/lib/reviews-reveal-task";
import { reportBackgroundFailure } from "@/lib/observability/report";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Taak-endpoint niet geconfigureerd." }, { status: 503 });
  }

  if (!authorizeCron(request, secret)) {
    return NextResponse.json({ error: "Niet geautoriseerd." }, { status: 401 });
  }

  try {
    const result = await runReviewsRevealTask({ actorId: null });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    void reportBackgroundFailure("cron:reviews-reveal", e);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het uitvoeren van de taak." },
      { status: 500 },
    );
  }
}
