import { type Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { invoiceableCollaborationsWhere } from "@/lib/invoices";
import { InvoiceForm } from "../invoice-form";

export const metadata: Metadata = { title: "Nieuwe factuur · ZZP Platform" };

export default async function NieuweFactuurPage() {
  const actor = await requireRole("FREELANCER");

  // Alleen samenwerkingen die NIET in de uren-/prestatie-cascade zitten (gedeelde regel).
  const collaborations = await prisma.collaboration.findMany({
    where: invoiceableCollaborationsWhere(actor.id),
    orderBy: { updatedAt: "desc" },
    include: { job: { select: { title: true } }, company: { select: { name: true } } },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/facturen"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> Terug naar facturen
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Nieuwe factuur</h1>
      </div>
      <InvoiceForm
        collaborations={collaborations.map((c) => ({
          id: c.id,
          label: `${c.job.title} — ${c.company.name}`,
        }))}
      />
    </div>
  );
}
