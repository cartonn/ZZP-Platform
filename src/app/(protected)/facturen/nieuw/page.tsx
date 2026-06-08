import { type Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { InvoiceForm } from "../invoice-form";

export const metadata: Metadata = { title: "Nieuwe factuur · ZZP Platform" };

export default async function NieuweFactuurPage() {
  const actor = await requireRole("FREELANCER");

  const collaborations = await prisma.collaboration.findMany({
    // Alleen samenwerkingen die NIET in de uren-/prestatie-cascade zitten: zodra er een prestatie of
    // een cascade-factuur (lifecycleStatus) bestaat, loopt de facturatie daar — een losse factuur
    // erbij zou dubbel factureren. Dit voorkomt dubbele/inconsistente facturatie.
    where: {
      freelancer: { userId: actor.id },
      status: { in: ["ACTIVE", "COMPLETED"] },
      performances: { none: {} },
      invoices: { none: { lifecycleStatus: { not: null } } },
    },
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
