import { type Metadata } from "next";
import { requireRole } from "@/lib/authz";
import { getDbaThresholds } from "@/lib/platform-config";
import { ConfigForm } from "./config-form";

export const metadata: Metadata = { title: "Configuratie · ZZP Platform" };

export default async function ConfiguratiePage() {
  await requireRole("ADMIN");
  const thresholds = await getDbaThresholds();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Configuratie</h1>
        <p className="text-sm text-muted-foreground">
          Pas de drempelwaarden voor de DBA-monitor aan. Wijzigingen worden direct van kracht.
        </p>
      </header>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          DBA-monitor drempelwaarden
        </h2>
        <ConfigForm thresholds={thresholds} />
      </section>
    </div>
  );
}
