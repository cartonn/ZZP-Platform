// Leest IP + user-agent uit de request-headers (proportionele securitylogging, AVG).
// Alleen bruikbaar in request-scope (server actions, route handlers, auth-events).
import { headers } from "next/headers";

export async function requestMeta(): Promise<{ ipAddress: string | null; userAgent: string | null }> {
  try {
    const h = await headers();
    const fwd = h.get("x-forwarded-for");
    const ipAddress = (fwd ? fwd.split(",")[0]?.trim() : null) ?? h.get("x-real-ip") ?? null;
    return { ipAddress, userAgent: h.get("user-agent") };
  } catch {
    return { ipAddress: null, userAgent: null };
  }
}
