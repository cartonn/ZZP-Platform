import { permanentRedirect } from "next/navigation";
import { requireRole } from "@/lib/authz";
import { hubRedirectTarget } from "@/lib/hub-redirect";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * Het audit-log woont als tab in de toezicht-hub (`/admin/toezicht?tab=audit`, met CSV-export en
 * dezelfde filters/paginatie). Deze losse route blijft bestaan als permanente omleiding zodat oude
 * deeplinks (notificaties, bladwijzers) blijven werken — één canoniek pad per paneel, mirror van
 * /admin/dba, /admin/avg en /admin/bewaking. De actie-/entiteit-/pagina-filters gaan mee.
 */
export default async function AuditPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole("ADMIN");
  permanentRedirect(hubRedirectTarget("/admin/toezicht", "audit", await searchParams));
}
