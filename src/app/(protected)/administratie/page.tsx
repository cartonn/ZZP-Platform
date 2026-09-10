import { permanentRedirect } from "next/navigation";
import { hubRedirectTarget, type RouteSearchParams } from "@/lib/hub-redirect";

// Boekhouding is een tab van de Administratie-hub op /financien. Deze losse route blijft als
// permanente omleiding bestaan zodat oude deeplinks — o.a. de takenlijst-actie — blijven werken.
export default async function AdministratiePage({
  searchParams,
}: {
  searchParams: Promise<RouteSearchParams>;
}) {
  permanentRedirect(hubRedirectTarget("/financien", "boekhouding", await searchParams));
}
