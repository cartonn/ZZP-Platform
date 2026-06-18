import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { CredentialForm } from "../../credential-form";

export const metadata: Metadata = { title: "Certificaat bewerken · ZZP Platform" };

export default async function CredentialBewerkenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireRole("FREELANCER");
  const { id } = await params;

  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId: actor.id },
    select: { id: true },
  });
  const credential = profile ? await prisma.credential.findUnique({ where: { id } }) : null;
  if (!credential || credential.freelancerProfileId !== profile!.id) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/certificaten"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> Terug naar certificaten
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Certificaat bewerken</h1>
      </div>
      <CredentialForm
        initial={{
          id: credential.id,
          type: credential.type,
          title: credential.title,
          issuer: credential.issuer ?? "",
          issuedAt: credential.issuedAt ? credential.issuedAt.toISOString().slice(0, 10) : "",
          expiresAt: credential.expiresAt ? credential.expiresAt.toISOString().slice(0, 10) : "",
          visibility: credential.visibility,
          hasDocument: !!credential.documentId,
          documentId: credential.documentId,
          status: credential.status,
          rejectionReason: credential.rejectionReason,
        }}
      />
    </div>
  );
}
