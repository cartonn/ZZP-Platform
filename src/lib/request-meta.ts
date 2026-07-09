// Leest IP + user-agent uit de request-headers (proportionele securitylogging, AVG).
// Alleen bruikbaar in request-scope (server actions, route handlers, auth-events).
import { headers } from "next/headers";
import { clientIpFrom } from "@/lib/client-ip";

export async function requestMeta(): Promise<{
  ipAddress: string | null;
  userAgent: string | null;
}> {
  try {
    const h = await headers();
    // Spoof-bestendig: neemt het door de vertrouwde proxy toegevoegde (rechter) X-Forwarded-For-IP,
    // nooit de client-gestuurde linkerkant. Zie src/lib/client-ip.ts (login-brute-force-bypass-fix).
    const ipAddress = clientIpFrom(h.get("x-forwarded-for"), h.get("x-real-ip"));
    return { ipAddress, userAgent: h.get("user-agent") };
  } catch {
    return { ipAddress: null, userAgent: null };
  }
}
