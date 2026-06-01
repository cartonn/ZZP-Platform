import { NextResponse } from "next/server";
import { requireActor, AuthorizationError } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { getStorage } from "@/lib/services/storage";

// Serveert opgeslagen media via de storage-abstractie. Storage is privé (CLAUDE.md
// regel 4): er wordt nooit een publiek pad blootgesteld.
// Toegang: ingelogd + key moet een bekende Company.logoKey zijn.
// Logo's zijn bewust zichtbaar voor alle ingelogde gebruikers (staan op zoekpagina's,
// opdrachtdetails, bedrijfsprofielen). Gevoelige documenten gaan via /api/documents/[id]
// met ownership-check.
export async function GET(_req: Request, ctx: { params: Promise<{ key: string[] }> }) {
  try {
    await requireActor();
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  const { key: parts } = await ctx.params;
  const key = parts.join("/");

  const company = await prisma.company.findFirst({ where: { logoKey: key }, select: { id: true } });
  if (!company) {
    return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
  }

  const storage = getStorage();
  if (!(await storage.exists(key))) {
    return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
  }
  const data = await storage.get(key);
  const ext = key.split(".").pop()?.toLowerCase();
  const type =
    ext === "png"
      ? "image/png"
      : ext === "webp"
        ? "image/webp"
        : ext === "pdf"
          ? "application/pdf"
          : "image/jpeg";

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": type,
      "Cache-Control": "private, max-age=60",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
