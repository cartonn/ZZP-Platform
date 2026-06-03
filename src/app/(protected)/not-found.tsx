import { FileQuestion } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

// Niet-gevonden binnen de app-shell: behoudt de navigatie (sidebar) zodat de gebruiker
// meteen verder kan, i.p.v. de bare full-screen 404 van de root. Detailpagina's die
// notFound() aanroepen (factuur, opdracht, bericht, ticket, dossier) landen hier.
export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl py-12">
      <EmptyState
        icon={FileQuestion}
        title="Niet gevonden"
        description="Dit item bestaat niet (meer) of je hebt er geen toegang toe. Controleer de link of ga terug naar je dashboard."
        action={{ href: "/dashboard", label: "Naar dashboard" }}
      />
    </div>
  );
}
