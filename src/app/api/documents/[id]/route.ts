import { NextResponse } from "next/server";
import { AuthorizationError, requireActor } from "@/lib/authz";
import { canAccessDocument } from "@/lib/documents";
import { prisma } from "@/lib/db";
import { getStorage } from "@/lib/services/storage";

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
    return NextResponse.json({ error: "Geen toegang." }, { status: 403 });
  }

  const storage = getStorage();
  if (!(await storage.exists(doc.storageKey))) {
    return NextResponse.json({ error: "Bestand ontbreekt." }, { status: 404 });
  }
  const data = await storage.get(doc.storageKey);
  const safeName = doc.filename.replace(/[^\w.\-]+/g, "_");

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `inline; filename="${safeName}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
