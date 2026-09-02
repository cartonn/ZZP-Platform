import { permanentRedirect } from "next/navigation";
import { hubRedirectTarget, type RouteSearchParams } from "@/lib/hub-redirect";

// Statistieken zijn de eerste tab van de Toezicht-hub. Deze losse route blijft als permanente
// omleiding bestaan zodat oude deeplinks (notificaties, bladwijzers) blijven werken.
export default async function AdminStatistiekenPage({
  searchParams,
}: {
  searchParams: Promise<RouteSearchParams>;
}) {
  permanentRedirect(hubRedirectTarget("/admin/toezicht", null, await searchParams));
}
