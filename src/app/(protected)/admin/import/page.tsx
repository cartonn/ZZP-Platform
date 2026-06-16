import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { ImporterenPanel } from "@/components/admin/gebruikersbeheer/importeren-panel";
import { isEmailConfigured } from "./actions";

export const metadata = { title: "Importeren — Beheer" };

export default async function ImportPage() {
  await requireRole("ADMIN");
  const emailConfigured = await isEmailConfigured();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/gebruikers"
          className="focus-ring mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden /> Terug naar gebruikers
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Onboarding importeren</h1>
        <p className="text-sm text-muted-foreground">
          Voeg in één keer meerdere ZZP&apos;ers en opdrachtgevers toe via een CSV. Je ziet eerst
          een controle-overzicht; pas daarna worden accounts aangemaakt.
        </p>
      </div>

      <ImporterenPanel emailConfigured={emailConfigured} />
    </div>
  );
}
