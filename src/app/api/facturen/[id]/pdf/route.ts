import { NextResponse } from "next/server";
import { AuthorizationError, requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { buildInvoicePdf } from "@/lib/invoice-pdf";
import { audit } from "@/lib/audit";
import { requestMeta } from "@/lib/request-meta";
import { documentPdfRateLimiter } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-guard";

export const runtime = "nodejs";

const ymd = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

// Actuele factuur-PDF, on-demand gegenereerd. Alleen de betrokken partijen (uitschrijver,
// opdrachtgever) of een admin mogen 'm inzien (server-side waarheid, CLAUDE.md regel 1+2).
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  let actor;
  try {
    actor = await requireActor();
  } catch (e) {
    if (e instanceof AuthorizationError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }

  // On-demand PDF-generatie is CPU-belastend; rem een scripted loop (authz blijft de bron van toegang).
  const limited = await enforceRateLimit(documentPdfRateLimiter, actor.id);
  if (limited) return limited;

  const { id } = await ctx.params;
  const inv = await prisma.invoice.findUnique({
    where: { id },
    select: {
      number: true,
      partyInvoiceNumber: true,
      issuedAt: true,
      dueAt: true,
      subtotalCents: true,
      vatCents: true,
      totalCents: true,
      vatRegime: true,
      issuerUserId: true,
      counterpartyUserId: true,
      lines: { select: { description: true, quantity: true, unitCents: true, amountCents: true } },
      collaboration: {
        select: {
          job: { select: { title: true } },
          company: { select: { name: true, userId: true } },
          freelancer: {
            select: {
              userId: true,
              kvkNumber: true,
              btwNumber: true,
              user: { select: { name: true } },
            },
          },
        },
      },
    },
  });
  if (!inv) return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });

  const allowed =
    actor.role === "ADMIN" ||
    actor.id === inv.issuerUserId ||
    actor.id === inv.counterpartyUserId ||
    actor.id === inv.collaboration?.company.userId ||
    actor.id === inv.collaboration?.freelancer.userId;
  if (!allowed) {
    // Geweigerde inzage ook vastleggen — parity met de dossier-/modelovereenkomst-routes
    // (CLAUDE.md regel 5). Maakt IDOR-enumeratie op factuur-id's zichtbaar in het auditspoor.
    const meta = await requestMeta();
    await audit({
      actorId: actor.id,
      action: "INVOICE_PDF_ACCESS_DENIED",
      entityType: "Invoice",
      entityId: id,
      metadata: { viewerRole: actor.role },
      ...meta,
    });
    return NextResponse.json({ error: "Geen toegang." }, { status: 403 });
  }

  // AVG/compliance (CLAUDE.md regel 5): inzage van een gevoelig financieel document met PII
  // (naam, KvK, btw-nummer, bedragen) vastleggen — wie-zag-welke-factuur-wanneer. Spiegelt de
  // dossier-routes en /api/documents/[id], die documenttoegang ook auditen.
  const meta = await requestMeta();
  await audit({
    actorId: actor.id,
    action: "INVOICE_PDF_ACCESSED",
    entityType: "Invoice",
    entityId: id,
    metadata: { viewerRole: actor.role },
    ...meta,
  });

  const bytes = await buildInvoicePdf({
    number: inv.partyInvoiceNumber ?? inv.number,
    issuedAt: ymd(inv.issuedAt),
    dueAt: ymd(inv.dueAt),
    fromName: inv.collaboration?.freelancer.user.name ?? "ZZP'er",
    fromKvk: inv.collaboration?.freelancer.kvkNumber ?? null,
    fromBtw: inv.collaboration?.freelancer.btwNumber ?? null,
    toName: inv.collaboration?.company.name ?? "Opdrachtgever",
    jobTitle: inv.collaboration?.job.title ?? "",
    vatRegime: inv.vatRegime ?? "STANDARD_HIGH",
    subtotalCents: inv.subtotalCents ?? 0,
    vatCents: inv.vatCents ?? 0,
    totalCents: inv.totalCents ?? 0,
    lines: inv.lines,
  });

  const safeNumber = (inv.partyInvoiceNumber ?? inv.number).replace(/[^\w.\-]+/g, "_");
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="factuur-${safeNumber}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
