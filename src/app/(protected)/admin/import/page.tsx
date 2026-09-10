import { permanentRedirect } from "next/navigation";
import { hubRedirectTarget, type RouteSearchParams } from "@/lib/hub-redirect";

// Importeren is een tab van de Gebruikersbeheer-hub. Deze losse route blijft als permanente
// omleiding bestaan. De sjabloon-download op /admin/import/template blijft een eigen route.
export default async function AdminImportPage({
  searchParams,
}: {
  searchParams: Promise<RouteSearchParams>;
}) {
  permanentRedirect(hubRedirectTarget("/admin/gebruikersbeheer", "importeren", await searchParams));
}
