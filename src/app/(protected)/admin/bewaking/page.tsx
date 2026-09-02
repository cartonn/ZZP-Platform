import { permanentRedirect } from "next/navigation";
import { hubRedirectTarget, type RouteSearchParams } from "@/lib/hub-redirect";

// Platform-bewaking is een tab van de Toezicht-hub. Deze losse route blijft als permanente
// omleiding bestaan zodat oude deeplinks (o.a. de monitoring-notificatie) blijven werken.
export default async function AdminBewakingPage({
  searchParams,
}: {
  searchParams: Promise<RouteSearchParams>;
}) {
  permanentRedirect(hubRedirectTarget("/admin/toezicht", "bewaking", await searchParams));
}
