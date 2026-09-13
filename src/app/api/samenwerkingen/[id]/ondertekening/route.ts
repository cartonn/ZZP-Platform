import { NextResponse } from "next/server";
import { AuthorizationError, requireActor } from "@/lib/authz";
import { loadSigningView, buildSigningOriginal } from "@/lib/signing-service";
import { buildSigningEvidencePdf } from "@/lib/signing-evidence-pdf";
import { audit } from "@/lib/audit";
import { auditDeniedAccess } from "@/lib/security/access-audit";
import { documentPdfRateLimiter } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-guard";
import { privateFileHeaders } from "@/lib/security/resource-headers";
import { SigningEvidenceErasedError } from "@/lib/signing-contract";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  let actor;
  try {
    actor = await requireActor();
  } catch (error) {
    if (error instanceof AuthorizationError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    throw error;
  }
  const limited = await enforceRateLimit(documentPdfRateLimiter, actor.id);
  if (limited) return limited;
  const { id } = await context.params;
  let view;
  try {
    view = await loadSigningView(actor, id);
  } catch (error) {
    if (!(error instanceof SigningEvidenceErasedError)) throw error;
    return NextResponse.json(
      { error: error.message },
      { status: 410, headers: { "Cache-Control": "private, no-store" } },
    );
  }
  if (!view) {
    await auditDeniedAccess({
      actorId: actor.id,
      action: "SIGNING_EVIDENCE_ACCESS_DENIED",
      entityType: "Collaboration",
      entityId: id,
      outcome: "not-found",
    });
    return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
  }
  const params = new URL(request.url).searchParams;
  await audit({
    actorId: actor.id,
    action: "SIGNING_EVIDENCE_ACCESSED",
    entityType: "Collaboration",
    entityId: id,
    metadata: { documentHash: view.documentHash, original: params.get("original") === "1" },
  });
  if (params.get("format") === "json") {
    return new NextResponse(
      JSON.stringify(
        {
          document: view.document,
          documentHash: view.documentHash,
          pdfHash: view.col.signing?.pdfHash ?? null,
          recordedAt: view.col.signing?.createdAt ?? null,
          signatures: view.col.signing?.signatures ?? [],
          status: view.col.status,
          disputed: !!view.col.disputedAt,
        },
        null,
        2,
      ),
      { headers: privateFileHeaders("application/json", `ondertekenbewijs-${id}.json`) },
    );
  }
  const bytes =
    params.get("original") === "1"
      ? (view.col.signing?.documentPdf ??
        (await buildSigningOriginal(view.document, view.documentHash)))
      : await buildSigningEvidencePdf(view);
  return new NextResponse(new Uint8Array(bytes), {
    headers: privateFileHeaders("application/pdf", `overeenkomst-${id}.pdf`),
  });
}
