import { permanentRedirect } from "next/navigation";
import { hubRedirectTarget, type RouteSearchParams } from "@/lib/hub-redirect";

// Bemiddelaars is een tab van de Gebruikersbeheer-hub. Deze losse route blijft als permanente
// omleiding bestaan zodat oude deeplinks blijven werken.
export default async function AdminFranchisesPage({
  searchParams,
}: {
  searchParams: Promise<RouteSearchParams>;
}) {
  permanentRedirect(
    hubRedirectTarget("/admin/gebruikersbeheer", "bemiddelaars", await searchParams),
  );
}
