import { type Metadata } from "next";
import Link from "next/link";
import { Upload } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { PageHeader } from "@/components/ui/page-header";
import { GebruikersPanel } from "@/components/admin/gebruikersbeheer/gebruikers-panel";

export const metadata: Metadata = { title: "Gebruikers · Handslag" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function GebruikersPage({ searchParams }: { searchParams: SearchParams }) {
  const actor = await requireRole("ADMIN");
  const sp = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gebruikersbeheer"
        title="Gebruikers"
        description="Beheer accounts: status, schorsing en anonimisering. De rol staat per account vermeld."
        action={
          <Link
            href="/admin/import"
            className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent"
          >
            <Upload className="size-4" aria-hidden /> Importeren
          </Link>
        }
      />
      <GebruikersPanel actor={actor} searchParams={sp} basePath="/admin/gebruikers" />
    </div>
  );
}
