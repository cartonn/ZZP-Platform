import { permanentRedirect } from "next/navigation";
import { hubRedirectTarget, type RouteSearchParams } from "@/lib/hub-redirect";

// Facturatie is een tab van de Bemiddeling-hub op /franchise/instellingen — die tab rendert
// hetzelfde BillingPanel, dezelfde abonnementsstatus en dezelfde lege staat. Deze losse route
// blijft als permanente omleiding bestaan; hij stond nergens in de navigatie, maar wél in
// bestaande deeplinks. De CSV-export op /franchise/facturatie/export blijft een eigen route.
export default async function FranchiseFacturatiePage({
  searchParams,
}: {
  searchParams: Promise<RouteSearchParams>;
}) {
  permanentRedirect(hubRedirectTarget("/franchise/instellingen", "facturatie", await searchParams));
}
