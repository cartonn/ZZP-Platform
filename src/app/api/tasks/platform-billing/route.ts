// Beveiligd HTTP-eindpunt voor de platform-facturatie-run (bundelt PENDING-bijdragen tot DRAFT-
// facturen). POST met Authorization: Bearer <CRON_SECRET> Zonder CRON_SECRET:
// 503. Bewust géén onderdeel van run-all: facturen aanmaken is een bewuste stap, geen automatiek.

import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron-auth";
import { generatePlatformBilling } from "@/lib/platform-billing/billing-run";

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
    const result = await generatePlatformBilling({});
    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het uitvoeren van de taak." },
      { status: 500 },
    );
  }
}
