import { NextResponse } from "next/server";
import { AuthorizationError, requireRole } from "@/lib/authz";
import { getPlatformBillingInvoiceDetail } from "@/lib/platform-billing/billing-data";
import { buildPlatformBillingPdf } from "@/lib/platform-billing/billing-pdf";
import { audit } from "@/lib/audit";
import { requestMeta } from "@/lib/request-meta";
import { documentPdfRateLimiter } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-guard";

export const runtime = "nodejs";

// Platformfactuur-PDF, on-demand. Alleen een admin (de platform-eigenaar voert de incasso).
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  let actor;
  try {
    actor = await requireRole("ADMIN");
  } catch (e) {
    if (e instanceof AuthorizationError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }

  // On-demand PDF-generatie is CPU-belastend; rem een scripted loop (authz blijft de bron van toegang).
  const limited = await enforceRateLimit(documentPdfRateLimiter, actor.id);
  if (limited) return limited;

  const { id } = await ctx.params;
  const detail = await getPlatformBillingInvoiceDetail(id);
  if (!detail) return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });

  // AVG/compliance (CLAUDE.md regel 5): inzage van een gevoelig financieel document met PII
  // (bedrijfsnaam, bedragen) vastleggen — wie-zag-welke-platformfactuur-wanneer. Spiegelt de
  // factuur-/dossier-routes en /api/documents/[id], die documenttoegang ook auditen.
  const meta = await requestMeta();
  await audit({
    actorId: actor.id,
    action: "PLATFORM_BILLING_PDF_ACCESSED",
    entityType: "PlatformInvoice",
    entityId: id,
    metadata: { viewerRole: actor.role },
    ...meta,
  });

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
