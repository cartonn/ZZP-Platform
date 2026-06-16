import Link from "next/link";
import { Download } from "lucide-react";
import { IMPORT_TEMPLATE_HEADERS } from "@/lib/onboarding/import";
import { ImportWizard } from "@/app/(protected)/admin/import/import-wizard";

/**
 * Importeren-paneel: onboarding van meerdere ZZP'ers/opdrachtgevers via een CSV met
 * controle-overzicht. De host laadt `emailConfigured` (bepaalt of uitnodigingsmails verstuurd
 * kunnen worden). Rendert geen eigen paginakop — die hoort bij de route (/admin/import) of de hub.
 *
 * @param emailConfigured of de mailprovider is geconfigureerd (anders geen uitnodigingen).
 */
export function ImporterenPanel({ emailConfigured }: { emailConfigured: boolean }) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-medium">Zo werkt het</p>
          <Link
            href="/admin/import/template"
            className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
          >
            <Download className="size-3.5" aria-hidden /> Voorbeeld-CSV downloaden
          </Link>
        </div>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-muted-foreground">
          <li>Download de voorbeeld-CSV en vul je gegevens in (Excel: opslaan als CSV).</li>
          <li>
            Upload het bestand — je krijgt een controle-overzicht met fouten en waarschuwingen.
          </li>
          <li>Bevestig: alleen geldige, nog niet bestaande rijen worden aangemaakt.</li>
        </ol>
        <p className="mt-2 text-xs text-muted-foreground">
          Kolommen (verplicht: <span className="font-medium text-foreground">naam, email, rol</span>
          ): {IMPORT_TEMPLATE_HEADERS.join(", ")}. Rol ={" "}
          <span className="font-medium text-foreground">ZZP&apos;er</span> of{" "}
          <span className="font-medium text-foreground">opdrachtgever</span> (bedrijfsnaam dan
          verplicht).
        </p>
      </div>

      <ImportWizard emailConfigured={emailConfigured} />
    </div>
  );
}
