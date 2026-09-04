import { permanentRedirect } from "next/navigation";
import { hubRedirectTarget, type RouteSearchParams } from "@/lib/hub-redirect";

// Administratie is de eerste tab van de Financiën-hub. Deze losse route blijft als permanente
// omleiding bestaan zodat oude deeplinks — o.a. de betaalherinnering-notificatie — blijven werken.
export default async function AdminAdministratiePage({
  searchParams,
}: {
  searchParams: Promise<RouteSearchParams>;
}) {
  permanentRedirect(hubRedirectTarget("/admin/financien", null, await searchParams));
}
