import { requireRole } from "@/lib/authz";
import { importTemplateCsv } from "@/lib/onboarding/import";

// Voorbeeld-CSV om te downloaden. Admin-only; de kopregel toont alle herkende kolommen.
export async function GET() {
  await requireRole("ADMIN");
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
