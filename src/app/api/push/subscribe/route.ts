// Registreert (of werkt bij) een web-push-abonnement van de huidige gebruiker. Uniek per endpoint:
// abonneert hetzelfde toestel opnieuw → update i.p.v. duplicaat. Ownership server-side: het
// abonnement hangt altijd aan de ingelogde actor, nooit aan een meegestuurde userId.

import { NextResponse } from "next/server";
import { z } from "zod";
import { currentActor } from "@/lib/authz";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(512),
    auth: z.string().min(1).max(512),
  }),
});

export async function POST(request: Request): Promise<Response> {
  const actor = await currentActor();
  if (!actor) return NextResponse.json({ error: "Niet geautoriseerd." }, { status: 401 });

  const parsed = subscriptionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ongeldig abonnement." }, { status: 400 });
  }

  const { endpoint, keys } = parsed.data;
  const userAgent = request.headers.get("user-agent")?.slice(0, 256) ?? null;

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId: actor.id, endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent },
    update: { userId: actor.id, p256dh: keys.p256dh, auth: keys.auth, userAgent },
  });

  return NextResponse.json({ ok: true });
}
