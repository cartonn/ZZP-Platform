// Registreert (of werkt bij) een web-push-abonnement van de huidige gebruiker. Uniek per endpoint:
// abonneert hetzelfde toestel opnieuw → update i.p.v. duplicaat. Ownership server-side: het
// abonnement hangt altijd aan de ingelogde actor, nooit aan een meegestuurde userId.

import { NextResponse } from "next/server";
import { z } from "zod";
import { currentActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import { isAllowedPushEndpoint } from "@/lib/push/endpoints";

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
  // Anti-SSRF/exfiltratie: alleen endpoints van bekende push-diensten — de server POST't hier de
  // (VAPID-ondertekende) melding naartoe; een eigen host zou de inhoud kunnen wegsluizen.
  if (!isAllowedPushEndpoint(endpoint)) {
    return NextResponse.json({ error: "Onbekende pushdienst." }, { status: 400 });
  }

  const userAgent = request.headers.get("user-agent")?.slice(0, 256) ?? null;

  // Eén rij per endpoint; opnieuw abonneren ververst de sleutels en bindt aan de huidige actor
  // (nodig voor een gedeeld toestel waar een andere gebruiker inlogt). Het endpoint zelf is een
  // niet-raadbaar geheim, dus dit is geen praktisch overnamerisico. Audit (regel 5): alleen de host,
  // nooit het geheime pad/sleutelmateriaal.
  const sub = await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId: actor.id, endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent },
    update: { userId: actor.id, p256dh: keys.p256dh, auth: keys.auth, userAgent },
  });
  await prisma.auditLog.create({
    data: auditData({
      actorId: actor.id,
      action: "PUSH_SUBSCRIBE",
      entityType: "PushSubscription",
      entityId: sub.id,
      metadata: { host: new URL(endpoint).host },
    }),
  });

  return NextResponse.json({ ok: true });
}
