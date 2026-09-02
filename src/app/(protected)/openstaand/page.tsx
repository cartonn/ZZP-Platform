import { permanentRedirect } from "next/navigation";
import { hubRedirectTarget, type RouteSearchParams } from "@/lib/hub-redirect";

// Openstaand is een tab van de Administratie-hub op /financien. Deze losse route blijft als
// permanente omleiding bestaan zodat oude deeplinks blijven werken.
export default async function OpenstaandPage({
  searchParams,
}: {
  searchParams: Promise<RouteSearchParams>;
}) {
  permanentRedirect(hubRedirectTarget("/financien", "openstaand", await searchParams));
}
