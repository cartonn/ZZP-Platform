import { type Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { CREDENTIAL_TYPES, type CredentialType } from "@/lib/enums";
import { CredentialForm } from "../credential-form";

export const metadata: Metadata = { title: "Document toevoegen · Handslag" };

export default async function NieuweCredentialPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  await requireRole("FREELANCER");
  // Deep-link vanuit het Actiecentrum ("verplicht document ontbreekt"): ?type=VOG/INSURANCE
  // vult het juiste documenttype vast in. Ongeldige waarden vallen terug op de default.
  const { type } = await searchParams;
  const initialType: CredentialType = (CREDENTIAL_TYPES as readonly string[]).includes(type ?? "")
    ? (type as CredentialType)
    : "VOG";
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/certificaten"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> Terug naar certificaten
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Document toevoegen</h1>
      </div>
      <CredentialForm
        initial={{
          type: initialType,
          title: "",
          issuer: "",
          issuedAt: "",
          expiresAt: "",
          visibility: "PRIVATE",
          hasDocument: false,
        }}
      />
    </div>
  );
}
