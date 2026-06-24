import { NextResponse } from "next/server";
import { AuthorizationError, requireActor } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { requestMeta } from "@/lib/request-meta";
import { prisma } from "@/lib/db";
import { exportRateLimiter } from "@/lib/rate-limit";
import { buildAccountExport } from "@/lib/account-export";

// AVG recht op inzage/dataportabiliteit: exporteer de eigen gegevens als JSON.
// Alleen de eigen persoonsgegevens (geen documentinhoud, geen vrije-tekst-PII van derden).
// De dataverzameling zit in buildAccountExport (testbaar, gedeeld).
export async function GET() {
  let actor;
  try {
    actor = await requireActor();
  } catch (e) {
    if (e instanceof AuthorizationError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }

  // Export-rem: de export bundelt veel queries; begrens scripted loops (HTTP 429).
  if (!exportRateLimiter.check(`export:${actor.id}`).allowed) {
    return NextResponse.json(
      { error: "Te veel exportverzoeken. Probeer het later opnieuw." },
      { status: 429 },
    );
  }

  const payload = await buildAccountExport(prisma, actor.id);

  await prisma.auditLog.create({
    data: auditData({
      actorId: actor.id,
      action: "ACCOUNT_DATA_EXPORTED",
      entityType: "User",
      entityId: actor.id,
      ...(await requestMeta()),
    }),
  });

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="zzp-platform-export-${actor.id}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
