import { permanentRedirect } from "next/navigation";
import { hubRedirectTarget, type RouteSearchParams } from "@/lib/hub-redirect";

// Gebruikers is de eerste tab van de Gebruikersbeheer-hub. Deze losse route blijft als permanente
// omleiding bestaan; zoek- en filterparameters (?q=, ?deletion=) reizen mee zodat bestaande
// deeplinks — o.a. de notificatie bij een verwijderverzoek — hun selectie houden.
export default async function AdminGebruikersPage({
  searchParams,
}: {
  searchParams: Promise<RouteSearchParams>;
}) {
  permanentRedirect(hubRedirectTarget("/admin/gebruikersbeheer", null, await searchParams));
}
