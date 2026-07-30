import { type Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { invoiceableCollaborationsWhere } from "@/lib/invoices";
import { buildInvoiceDuplicateInitial } from "@/lib/invoice-duplicate";
import { InvoiceForm } from "../invoice-form";

export const metadata: Metadata = { title: "Nieuwe factuur · Handslag" };

export default async function NieuweFactuurPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const actor = await requireRole("FREELANCER");
  const { from } = await searchParams;

  // Alleen samenwerkingen die NIET in de uren-/prestatie-cascade zitten (gedeelde regel).
  // unbounded-allow: eigenaar-scoped keuzelijst; inherent klein
  const collaborations = await prisma.collaboration.findMany({
    where: invoiceableCollaborationsWhere(actor.id),
    orderBy: { updatedAt: "desc" },
    include: { job: { select: { title: true } }, company: { select: { name: true } } },
  });

  // "Herhaal factuur": prefill uit een bestaande, eigen, handmatige factuur. Ownership + niet-cascade
  // worden server-side afgedwongen (regel 1/2); een vreemde/ongeldige `from` levert stil een leeg
  // formulier (geen lek, geen fout). De form preselecteert de samenwerking alleen als die factureerbaar
  // is en herberekent elk bedrag opnieuw bij opslaan.
  let initial: ReturnType<typeof buildInvoiceDuplicateInitial> | undefined;
  if (from) {
    const source = await prisma.invoice.findFirst({
      where: {
        id: from,
        lifecycleStatus: null,
        collaboration: { freelancer: { userId: actor.id } },
      },
      select: {
        collaborationId: true,
        lines: { select: { description: true, quantity: true, unitCents: true } },
      },
    });
    if (source?.collaborationId)
      initial = buildInvoiceDuplicateInitial({
        collaborationId: source.collaborationId,
        lines: source.lines,
      });
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/facturen"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> Terug naar facturen
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          {initial ? "Factuur herhalen" : "Nieuwe factuur"}
        </h1>
        {initial && (
          <p className="mt-1 text-sm text-muted-foreground">
            De regels zijn overgenomen van de vorige factuur. Pas ze gerust aan; er wordt een nieuw
            concept met een vers factuurnummer aangemaakt.
          </p>
        )}
      </div>
      <InvoiceForm
        collaborations={collaborations.map((c) => ({
          id: c.id,
          label: `${c.job.title} — ${c.company.name}`,
        }))}
        initialCollaborationId={initial?.collaborationId}
        initialLines={initial?.lines}
      />
    </div>
  );
}
