import { type Metadata } from "next";
import { requireRole } from "@/lib/authz";
import { getDbaThresholds } from "@/lib/platform-config";
import { PageHeader } from "@/components/ui/page-header";
import { ConfigForm } from "./config-form";

export const metadata: Metadata = { title: "Configuratie · Handslag" };

export default async function ConfiguratiePage() {
  await requireRole("ADMIN");
  const thresholds = await getDbaThresholds();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Beheer"
        title="Configuratie"
        description="Pas de drempelwaarden voor de DBA-monitor aan. Wijzigingen worden direct van kracht."
      />

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          DBA-monitor drempelwaarden
        </h2>
        <ConfigForm thresholds={thresholds} />
      </section>
    </div>
  );
}
