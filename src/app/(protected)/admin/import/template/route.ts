import { AuthorizationError, requireRole } from "@/lib/authz";
import { importTemplateCsv } from "@/lib/onboarding/import";

// Voorbeeld-CSV om te downloaden. Admin-only; de kopregel toont alle herkende kolommen.
export async function GET() {
  try {
    await requireRole("ADMIN");
  } catch (e) {
    // Een mid-sessie geschorst/gedegradeerd account houdt een geldige JWT; requireRole() leest vers uit
    // de DB en werpt 401/403. Vang dat af tot een nette response i.p.v. een rauwe 500 — parity met de
    // andere admin-export/PDF-routes.
    if (e instanceof AuthorizationError) return new Response(e.message, { status: e.status });
    throw e;
  }
  // BOM zodat Excel UTF-8 (é, ') correct toont.
  const body = "﻿" + importTemplateCsv();
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="onboarding-voorbeeld.csv"',
      "Cache-Control": "no-store",
    },
  });
}
