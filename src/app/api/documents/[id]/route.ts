import { NextResponse } from "next/server";
import { AuthorizationError, requireActor } from "@/lib/authz";
import { canAccessDocument } from "@/lib/documents";
import { prisma } from "@/lib/db";
import { getStorage } from "@/lib/services/storage";
import { audit } from "@/lib/audit";
import { requestMeta } from "@/lib/request-meta";

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

  const { id } = await ctx.params;
  const doc = await prisma.document.findUnique({
    where: { id },
    select: { ownerId: true, storageKey: true, mimeType: true, filename: true },
  });
  if (!doc) return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });

  if (!canAccessDocument(actor, doc.ownerId)) {
    // Een poging om andermans gevoelige document (VOG, diploma) te openen is een
    // beveiligingsrelevante gebeurtenis — leg 'm vast naast de geslaagde toegang hieronder
    // (CLAUDE.md regel 5: document-toegang auditen, ook de geweigerde).
    const meta = await requestMeta();
    await audit({
      actorId: actor.id,
      action: "DOCUMENT_ACCESS_DENIED",
      entityType: "Document",
      entityId: id,
      metadata: { viewerRole: actor.role, ownerId: doc.ownerId },
      ...meta,
    });
    return NextResponse.json({ error: "Geen toegang." }, { status: 403 });
  }

  const storage = getStorage();
  if (!(await storage.exists(doc.storageKey))) {
    return NextResponse.json({ error: "Bestand ontbreekt." }, { status: 404 });
  }
  const data = await storage.get(doc.storageKey);
  const safeName = doc.filename.replace(/[^\w.\-]+/g, "_");

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

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `inline; filename="${safeName}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      // Sandbox het document: zelfs als een verkeerd getypt bestand inline wordt geopend,
      // mag het geen scripts/embeds uitvoeren (defense-in-depth bovenop magic-byte-validatie).
      "Content-Security-Policy": "sandbox; default-src 'none'",
    },
  });
}
