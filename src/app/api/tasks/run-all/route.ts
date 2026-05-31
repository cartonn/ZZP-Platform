// Enkelvoudig cron-eindpunt dat alle geplande taken achtereenvolgens uitvoert.
// De host hoeft maar één cron te configureren: POST /api/tasks/run-all met de CRON_SECRET.
// Individuele fouten breken de overige taken niet af; het resultaat bevat per taak de uitkomst.
// POST met Authorization: Bearer <CRON_SECRET> of ?token=<CRON_SECRET>. Zonder CRON_SECRET: 503.

import { NextResponse } from "next/server";
import { runExpiryTask } from "@/lib/expiry-task";
import { runPaymentReminderTask } from "@/lib/payment-reminders-task";
import { runDbaMonitorTask } from "@/lib/dba-monitor-task";
import { runConceptInvoiceReminderTask } from "@/lib/concept-invoice-reminders-task";
import { runVatReminderTask } from "@/lib/vat-reminder-task";

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

  const tasks: Array<{ name: string; fn: () => Promise<unknown> }> = [
    { name: "expiry", fn: () => runExpiryTask({ actorId: null }) },
    { name: "payment-reminders", fn: () => runPaymentReminderTask({ actorId: null }) },
    { name: "dba-monitor", fn: () => runDbaMonitorTask({ actorId: null }) },
    {
      name: "concept-invoice-reminders",
      fn: () => runConceptInvoiceReminderTask({ actorId: null }),
    },
    { name: "vat-reminders", fn: () => runVatReminderTask({ actorId: null }) },
  ];

  const results: Record<string, unknown> = {};
  const errors: Record<string, string> = {};

  for (const { name, fn } of tasks) {
    try {
      results[name] = await fn();
    } catch (e) {
      errors[name] = e instanceof Error ? e.message : String(e);
    }
  }

  const hasErrors = Object.keys(errors).length > 0;
  return NextResponse.json({ ok: !hasErrors, results, ...(hasErrors ? { errors } : {}) });
}
