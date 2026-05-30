import Link from "next/link";
import { Download, ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { IMPORT_TEMPLATE_HEADERS } from "@/lib/onboarding/import";
import { ImportWizard } from "./import-wizard";

export const metadata = { title: "Importeren — Beheer" };

export default async function ImportPage() {
  await requireRole("ADMIN");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href="/admin/gebruikers" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground focus-ring">
          <ArrowLeft className="size-4" aria-hidden /> Terug naar gebruikers
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Onboarding importeren</h1>
        <p className="text-sm text-muted-foreground">
          Voeg in één keer meerdere ZZP&apos;ers en opdrachtgevers toe via een CSV. Je ziet eerst een
          controle-overzicht; pas daarna worden accounts aangemaakt.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-medium">Zo werkt het</p>
          <Link
            href="/admin/import/template"
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-accent focus-ring"
          >
            <Download className="size-3.5" aria-hidden /> Voorbeeld-CSV downloaden
          </Link>
        </div>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-muted-foreground">
          <li>Download de voorbeeld-CSV en vul je gegevens in (Excel: opslaan als CSV).</li>
          <li>Upload het bestand — je krijgt een controle-overzicht met fouten en waarschuwingen.</li>
          <li>Bevestig: alleen geldige, nog niet bestaande rijen worden aangemaakt.</li>
        </ol>
        <p className="mt-2 text-xs text-muted-foreground">
          Kolommen (verplicht: <span className="font-medium text-foreground">naam, email, rol</span>):{" "}
          {IMPORT_TEMPLATE_HEADERS.join(", ")}. Rol = <span className="font-medium text-foreground">ZZP&apos;er</span> of{" "}
          <span className="font-medium text-foreground">opdrachtgever</span> (bedrijfsnaam dan verplicht).
        </p>
      </div>

      <ImportWizard />
    </div>
  );
}
