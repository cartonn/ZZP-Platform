import { type Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { CredentialForm } from "../credential-form";

export const metadata: Metadata = { title: "Nieuw certificaat · ZZP Platform" };

export default async function NieuweCredentialPage() {
  await requireRole("FREELANCER");
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/certificaten"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> Terug naar certificaten
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Nieuw certificaat</h1>
      </div>
      <CredentialForm
        initial={{
          type: "VOG",
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
