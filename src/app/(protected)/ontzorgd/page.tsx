import { permanentRedirect } from "next/navigation";
import { hubRedirectTarget, type RouteSearchParams } from "@/lib/hub-redirect";

// Ontzorgd is een tab van de Administratie-hub op /financien. Deze losse route blijft als
// permanente omleiding bestaan zodat oude deeplinks — o.a. de urencriterium-notificatie en de
// factuur-reservekaart — blijven werken. De subroutes /ontzorgd/uren en /ontzorgd/aangifte
// blijven eigen pagina's; alleen dit overzicht was dubbel.
export default async function OntzorgdPage({
  searchParams,
}: {
  searchParams: Promise<RouteSearchParams>;
}) {
  permanentRedirect(hubRedirectTarget("/financien", "ontzorgd", await searchParams));
}
