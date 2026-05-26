import { NextResponse } from "next/server";
import { requireActor, AuthorizationError } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { getStorage } from "@/lib/services/storage";

// Serveert opgeslagen media via de storage-abstractie. Storage is privé (CLAUDE.md
// regel 4): er wordt nooit een publiek pad blootgesteld. Voor Sessie 1 dekt deze route
// alleen bedrijfslogo's (key moet als Company.logoKey bekend zijn). De algemene,
// ownership-gecontroleerde document-download volgt in Sessie 4.
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
    ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : ext === "pdf" ? "application/pdf" : "image/jpeg";

  return new NextResponse(new Uint8Array(data), {
    headers: { "Content-Type": type, "Cache-Control": "private, max-age=60" },
  });
}
