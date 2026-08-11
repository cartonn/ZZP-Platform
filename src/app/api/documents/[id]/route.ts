import { NextResponse } from "next/server";
import { AuthorizationError, requireActor } from "@/lib/authz";
import { canAccessDocument } from "@/lib/documents";
import { prisma } from "@/lib/db";
import { getStorage } from "@/lib/services/storage";
import { sandboxedDocumentHeaders } from "@/lib/security/resource-headers";
import { audit } from "@/lib/audit";
import { requestMeta } from "@/lib/request-meta";
import { auditDeniedAccess } from "@/lib/security/access-audit";
import { documentDownloadRateLimiter } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-guard";

// Privé document-download (CLAUDE.md regel 4): alleen eigenaar of admin. Nooit publiek pad.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  let actor;
  try {
    actor = await requireActor();
  } catch (e) {
    if (e instanceof AuthorizationError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }

  // Rem een scripted enumeratie-loop over `Document.id` vóór de DB-lookup/storage-read (parity met
  // de dossier-/PDF-routes). De ownership-check hieronder blijft leidend; dit is defense-in-depth
  // tegen resource-uitputting en ongebreidelde auditgroei op de gevoeligste route (OWASP A04).
  const limited = await enforceRateLimit(documentDownloadRateLimiter, actor.id);
  if (limited) return limited;

  const { id } = await ctx.params;
  const doc = await prisma.document.findUnique({
    where: { id },
    select: { ownerId: true, storageKey: true, mimeType: true, filename: true },
  });
  if (!doc) {
    // Niet-gevonden krijgt hetzelfde werk (audit-write) als de geweigerde-tak hieronder, zodat de
    // responstijd de twee niet onderscheidt (timing-zijkanaal, CWE-208) en de 404-maskering echt
    // dicht is. `outcome: "not-found"` maakt een recon-probe op een niet-bestaand id intern zichtbaar.
    await auditDeniedAccess({
      actorId: actor.id,
      action: "DOCUMENT_ACCESS_DENIED",
      entityType: "Document",
      entityId: id,
      outcome: "not-found",
      metadata: { viewerRole: actor.role },
    });
    return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
  }

  if (!canAccessDocument(actor, doc.ownerId)) {
    // Een poging om andermans gevoelige document (VOG, diploma) te openen is een
    // beveiligingsrelevante gebeurtenis — leg 'm vast naast de geslaagde toegang hieronder
    // (CLAUDE.md regel 5: document-toegang auditen, ook de geweigerde).
    await auditDeniedAccess({
      actorId: actor.id,
      action: "DOCUMENT_ACCESS_DENIED",
      entityType: "Document",
      entityId: id,
      outcome: "forbidden",
      metadata: { viewerRole: actor.role, ownerId: doc.ownerId },
    });
    // Geef exact dezelfde respons als een onbekend id (CWE-203, existence-oracle): een 403 op een
    // geldig-maar-vreemd id verraadt dat er een gevoelig document (VOG/diploma/BIG) bestaat. Parity
    // met het anti-oracle-standpunt elders in de codebase (assertSameTenant/ownsViaTenant). De DENIED-
    // audit hierboven blijft — alleen de externe respons wordt ononderscheidbaar gemaakt.
    return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
  }

  const storage = getStorage();
  if (!(await storage.exists(doc.storageKey))) {
    return NextResponse.json({ error: "Bestand ontbreekt." }, { status: 404 });
  }
  const data = await storage.get(doc.storageKey);

  // AVG/compliance (CLAUDE.md regel 5): wie-zag-welk-gevoelig-document-wanneer vastleggen.
  const meta = await requestMeta();
  await audit({
    actorId: actor.id,
    action: "DOCUMENT_ACCESSED",
    entityType: "Document",
    entityId: id,
    metadata: { viewerRole: actor.role, owner: actor.id === doc.ownerId },
    ...meta,
  });

  // Gedeelde bron van waarheid (src/lib/security/resource-headers.ts): privé-bestand-headers +
  // sandbox-CSP (geen scriptuitvoering bij inline openen) + Cross-Origin-Resource-Policy same-origin
  // (geen cross-origin embedding van dit gevoelige document, ook niet via een gelekte URL).
  return new NextResponse(new Uint8Array(data), {
    headers: sandboxedDocumentHeaders(doc.mimeType, doc.filename),
  });
}
