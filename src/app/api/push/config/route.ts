// Publieke push-config voor de browser-subscribe: of web-push aanstaat + de publieke VAPID-sleutel
// (veilig om te delen). Auth vereist — alleen ingelogde gebruikers zien/abonneren.

import { NextResponse } from "next/server";
import { currentActor } from "@/lib/authz";
import { getVapidPublicKey, isWebPushConfigured } from "@/lib/push/web-push";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const actor = await currentActor();
  if (!actor) return NextResponse.json({ error: "Niet geautoriseerd." }, { status: 401 });
  return NextResponse.json({
    configured: isWebPushConfigured(),
    publicKey: getVapidPublicKey(),
  });
}
