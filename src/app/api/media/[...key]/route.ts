import { NextResponse } from "next/server";
import { requireActor, AuthorizationError } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { getStorage } from "@/lib/services/storage";
import { CROSS_ORIGIN_RESOURCE_POLICY } from "@/lib/security/resource-headers";

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
  const ext = key.split(".").pop()?.toLowerCase();
  const type =
    ext === "png"
      ? "image/png"
      : ext === "webp"
        ? "image/webp"
        : ext === "pdf"
          ? "application/pdf"
          : "image/jpeg";

  // Productie (S3): redirect naar een kortlevende presigned URL zodat de logo-bytes rechtstreeks
  // bij de opslag worden opgehaald i.p.v. door de app-server te streamen. Logo's zijn niet-gevoelig
  // (zichtbaar voor elke ingelogde gebruiker), dus de redirect introduceert geen privacyrisico. De
  // toegangscontrole (requireActor + bekende logoKey) is hierboven al server-side afgehandeld.
  // Lokaal/pilot geeft de driver `null` → val terug op streamen (gedrag ongewijzigd).
  const signed = await storage.getSignedDownloadUrl(key, {
    contentType: type,
    disposition: { type: "inline" },
  });
  if (signed) {
    return NextResponse.redirect(signed, 302);
  }

  const data = await storage.get(key);
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": type,
      "Cache-Control": "private, max-age=60",
      "X-Content-Type-Options": "nosniff",
      // Geen cross-origin embedding van onze media, ook niet via een gelekte key (defense-in-depth).
      "Cross-Origin-Resource-Policy": CROSS_ORIGIN_RESOURCE_POLICY,
    },
  });
}
