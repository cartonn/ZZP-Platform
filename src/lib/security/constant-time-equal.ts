// Eén audited primitive voor het constant-time vergelijken van twee geheimen/tokens. Vervangt het
// tot nu toe 6× gedupliceerde patroon (`Buffer.from(...)` + lengte-check + `timingSafeEqual`) dat over
// cron-auth, mail-intake, de Stripe-webhookhandtekening, TOTP en de deel-/agenda-feed-tokens verspreid
// zat — elk met een subtiel andere lengte-guard.
//
// Waarom niet kaal `timingSafeEqual`: dat vereist dezelfde byte-lengte en werpt anders. De call-sites
// vingen dat op met een `a.length === b.length`-voorcheck die **vroeg terugkeert** bij lengteverschil —
// een side-channel die de byte-lengte van het geheim lekt via de responstijd. Voor een token van
// publiek-bekende vaste lengte is dat onschuldig, maar voor `CRON_SECRET` en het mail-intake-secret
// (vrije lengte, door de operator gekozen) lekt die vroege return de geheime lengte.
//
// Aanpak (Django `constant_time_compare` / Rails `secure_compare`): HMAC bij beide invoeren met een
// **willekeurige per-aanroep-sleutel** naar een digest van vaste lengte (32 bytes), en vergelijk dan de
// digests timing-safe. Gevolg:
//   - de vergelijking is constant-time in zowel inhoud áls lengte (geen vroege return, digests zijn
//     altijd 32 bytes) → geen length-oracle;
//   - de random sleutel maakt de digest onvoorspelbaar, dus zelfs de digest zelf lekt niets over het
//     geheim (verdediging tegen offline analyse van het vergelijkingsresultaat);
//   - een botsing forceren om valse gelijkheid te faken vereist een HMAC-SHA256-botsing (praktisch
//     onmogelijk).
// De uitkomst is byte-identiek aan een naïeve `a === b`: `true` dan en slechts dan als de invoeren
// exact gelijk zijn.

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Vergelijkt twee strings in constant tijd, zonder de lengte van een van beide te lekken via timing.
 * Geeft `true` uitsluitend als `a` en `b` byte-voor-byte gelijk zijn. Werpt nooit.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  // Eén verse sleutel per aanroep: de digests zijn hierdoor onvoorspelbaar en onbruikbaar als oracle.
  const key = randomBytes(32);
  const da = createHmac("sha256", key).update(a, "utf8").digest();
  const db = createHmac("sha256", key).update(b, "utf8").digest();
  // Beide digests zijn altijd 32 bytes → timingSafeEqual is veilig en vereist geen lengte-voorcheck.
  return timingSafeEqual(da, db);
}
