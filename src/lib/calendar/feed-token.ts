// Abonneer-token voor de agenda-feed: HMAC-SHA256 over "agenda-feed:{userId}" met het
// deeltoken-secret (SHARE_TOKEN_SECRET → AUTH_SECRET). Stateless en deterministisch — dezelfde
// gebruiker + secret levert hetzelfde token, dus de kalender-abonneerlink is stabiel en vereist
// geen opslag. De feed-route verifieert dit token in plaats van een sessie, zodat een externe
// agenda-app (Google/Apple) de link periodiek kan ophalen zonder in te loggen.
//
// De namespace-prefix ("agenda-feed:") scheidt dit token hard van het dossier-deeltoken
// (share-token.ts): een geldig dossier-token kan nooit als agenda-token dienen en omgekeerd.
//
// BEWUSTE BEPERKING (v1, spiegelt share-token.ts): geen per-token-revocatie zonder schemawijziging.
// De link blijft geldig zolang het secret ongewijzigd is; roteren van SHARE_TOKEN_SECRET breekt
// alle bestaande abonnementen. De blootgestelde data is exact het eigen werkrooster (jobtitel,
// tegenpartij-naam, data/weekdagen) — dezelfde inhoud als de bestaande eenmalige export.

import { createHmac, timingSafeEqual } from "node:crypto";
import { shareTokenSecret } from "@/lib/share-token";

const TOKEN_LENGTH = 32;
const NAMESPACE = "agenda-feed:";

/**
 * Berekent het abonneer-token voor een gebruikers-id. 32 hexadecimale tekens (afgeknotte
 * HMAC-SHA256). Deterministisch: zelfde invoer = zelfde uitvoer.
 *
 * @throws als het secret leeg is — een leeg secret zou een zwak maar geldig token geven.
 */
export function agendaFeedToken(userId: string, secret: string): string {
  if (!secret) throw new Error("Agenda-feed-secret mag niet leeg zijn");
  const hmac = createHmac("sha256", secret);
  hmac.update(NAMESPACE + userId);
  return hmac.digest("hex").slice(0, TOKEN_LENGTH);
}

/**
 * Timing-safe verificatie van een ontvangen agenda-token tegen het verwachte token voor `userId`.
 * Geeft `false` bij lengteverschil (voorkomt een length-oracle), leeg secret of mismatch.
 */
export function verifyAgendaFeedToken(
  userId: string,
  receivedToken: string,
  secret: string,
): boolean {
  if (!secret) return false;
  if (typeof receivedToken !== "string" || receivedToken.length !== TOKEN_LENGTH) return false;
  const expected = agendaFeedToken(userId, secret);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(receivedToken, "utf8");
  // Beide 32-char strings → gelijke byte-lengte; timingSafeEqual vereist gelijke lengte.
  return timingSafeEqual(a, b);
}

/**
 * Relatief feed-pad (query-vorm) voor een gebruiker. Het pad bevat een punt (`feed.ics`) zodat de
 * middleware-matcher het overslaat en de route publiek is — de route verifieert zelf het token.
 * Geeft `null` als er geen secret geconfigureerd is (dan is de feed uitgeschakeld).
 */
export function agendaFeedPath(userId: string): string | null {
  const secret = shareTokenSecret();
  if (!secret) return null;
  const token = agendaFeedToken(userId, secret);
  const params = new URLSearchParams({ u: userId, t: token });
  return `/api/agenda/feed.ics?${params.toString()}`;
}
