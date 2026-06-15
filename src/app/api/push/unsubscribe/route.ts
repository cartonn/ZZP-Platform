// Verwijdert een web-push-abonnement van de huidige gebruiker (uitzetten op dit toestel). Scoped op
// de actor: je kunt alleen je eigen abonnement opzeggen, nooit dat van een ander.

import { NextResponse } from "next/server";
import { z } from "zod";
import { currentActor } from "@/lib/authz";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ endpoint: z.string().url().max(2048) });

export async function POST(request: Request): Promise<Response> {
  const actor = await currentActor();
  if (!actor) return NextResponse.json({ error: "Niet geautoriseerd." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ongeldig verzoek." }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({
    where: { endpoint: parsed.data.endpoint, userId: actor.id },
  });

  return NextResponse.json({ ok: true });
}
