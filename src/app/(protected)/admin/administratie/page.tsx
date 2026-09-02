import { type Metadata } from "next";
import { requireRole } from "@/lib/authz";
import { PageHeader } from "@/components/ui/page-header";
import { AdminAdministratiePanel } from "@/components/admin/financien/administratie-panel";

export const metadata: Metadata = { title: "Platform Administratie · Handslag" };

export default async function AdminAdministratiePage() {
  await requireRole("ADMIN");

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Financiën"
        title="Platform Administratie"
        description="Platform-brede kwartaaloverzichten en openstaande betalingen over alle samenwerkingen."
      />
      <AdminAdministratiePanel />
    </div>
  );
}
