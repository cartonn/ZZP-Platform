// Centrale autorisatie voor cron-/taakroutes (security-review M-1/M-2, 12-6-2026):
// alleen de Authorization: Bearer-header (een ?token=-queryparameter belandt in de
// access-logs van de host) en een timing-safe vergelijking van het secret.

import { timingSafeEqual } from "node:crypto";

/** True als het verzoek een geldige Bearer CRON_SECRET draagt. False bij ontbreken/mismatch. */
export function authorizeCron(request: Request, secret: string): boolean {
  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(secret, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
