import { permanentRedirect } from "next/navigation";
import { hubRedirectTarget, type RouteSearchParams } from "@/lib/hub-redirect";

// Het verwerkingsregister is een tab van de Toezicht-hub. Deze losse route blijft als permanente
// omleiding bestaan; de actieve filter (?grond=) reist mee. De CSV-export op
// /admin/avg/export blijft een eigen route en verandert niet.
export default async function AdminAvgPage({
  searchParams,
}: {
  searchParams: Promise<RouteSearchParams>;
}) {
  permanentRedirect(hubRedirectTarget("/admin/toezicht", "avg", await searchParams));
}
