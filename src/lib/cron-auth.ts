// Centrale autorisatie voor cron-/taakroutes (security-review M-1/M-2, 12-6-2026):
// alleen de Authorization: Bearer-header (een ?token=-queryparameter belandt in de
// access-logs van de host) en een timing-safe vergelijking van het secret.

import { constantTimeEqual } from "@/lib/security/constant-time-equal";

/** True als het verzoek een geldige Bearer CRON_SECRET draagt. False bij ontbreken/mismatch. */
export function authorizeCron(request: Request, secret: string): boolean {
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  // Constant-time in inhoud én lengte: de vergelijking lekt de (operator-gekozen, niet-publieke)
  // lengte van CRON_SECRET niet meer via een vroege lengte-return.
  return constantTimeEqual(provided, secret);
}
