import { permanentRedirect } from "next/navigation";
import { hubRedirectTarget, type RouteSearchParams } from "@/lib/hub-redirect";

// De DBA-monitor is een tab van de Toezicht-hub. Deze losse route blijft als permanente omleiding
// bestaan; de actieve filter (?niveau=) reist mee zodat bestaande deeplinks hun selectie houden.
export default async function AdminDbaPage({
  searchParams,
}: {
  searchParams: Promise<RouteSearchParams>;
}) {
  permanentRedirect(hubRedirectTarget("/admin/toezicht", "dba", await searchParams));
}
