// Verwijdert een web-push-abonnement van de huidige gebruiker (uitzetten op dit toestel). Scoped op
// de actor: je kunt alleen je eigen abonnement opzeggen, nooit dat van een ander.

import { NextResponse } from "next/server";
import { z } from "zod";
import { currentActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import { readLimitedJson } from "@/lib/http/read-limited-text";

export const dynamic = "force-dynamic";

// Body-grens: alleen een endpoint-URL (≤2048) + JSON-overhead. Deze route heeft geen rate-limit,
// dus een grotere payload wijzen we af vóór parsen (onbegrensd bufferen = CWE-400, zie subscribe).
const MAX_BODY_BYTES = 4 * 1024;

const bodySchema = z.object({ endpoint: z.string().url().max(2048) });

export async function POST(request: Request): Promise<Response> {
  const actor = await currentActor();
  if (!actor) return NextResponse.json({ error: "Niet geautoriseerd." }, { status: 401 });

  const parsed = bodySchema.safeParse(await readLimitedJson(request, MAX_BODY_BYTES));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ongeldig verzoek." }, { status: 400 });
  }

  const { count } = await prisma.pushSubscription.deleteMany({
    where: { endpoint: parsed.data.endpoint, userId: actor.id },
  });
  if (count > 0) {
    await prisma.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "PUSH_UNSUBSCRIBE",
        entityType: "PushSubscription",
        entityId: actor.id,
        metadata: {
          host: (() => {
            try {
              return new URL(parsed.data.endpoint).host;
            } catch {
              return null;
            }
          })(),
        },
      }),
    });
  }

  return NextResponse.json({ ok: true });
}
