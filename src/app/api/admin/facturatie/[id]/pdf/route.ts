import { NextResponse } from "next/server";
import { AuthorizationError, requireRole } from "@/lib/authz";
import { getPlatformBillingInvoiceDetail } from "@/lib/platform-billing/billing-data";
import { buildPlatformBillingPdf } from "@/lib/platform-billing/billing-pdf";

export const runtime = "nodejs";

// Platformfactuur-PDF, on-demand. Alleen een admin (de platform-eigenaar voert de incasso).
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("ADMIN");
  } catch (e) {
    if (e instanceof AuthorizationError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }

  const { id } = await ctx.params;
  const detail = await getPlatformBillingInvoiceDetail(id);
  if (!detail) return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });

  const bytes = await buildPlatformBillingPdf(detail);
  const safe = detail.number.replace(/[^\w.\-]+/g, "_");
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${safe}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
