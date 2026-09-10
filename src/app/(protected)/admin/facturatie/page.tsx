import { permanentRedirect } from "next/navigation";
import { hubRedirectTarget, type RouteSearchParams } from "@/lib/hub-redirect";

// Facturatie is een tab van de Financiën-hub. Deze losse route blijft als permanente omleiding
// bestaan; paginering en filters reizen mee zodat bestaande deeplinks hun selectie houden.
export default async function AdminFacturatiePage({
  searchParams,
}: {
  searchParams: Promise<RouteSearchParams>;
}) {
  permanentRedirect(hubRedirectTarget("/admin/financien", "facturatie", await searchParams));
}
