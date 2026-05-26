import { type Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { formatEuro } from "@/lib/invoices";
import { type InvoiceStatus } from "@/lib/enums";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";

export const metadata: Metadata = { title: "Facturen · ZZP Platform" };

export default async function FacturenPage() {
  const actor = await requireActor();
  const isFreelancer = actor.role === "FREELANCER";

  const where = isFreelancer
    ? { collaboration: { freelancer: { userId: actor.id } } }
    : { collaboration: { company: { userId: actor.id } } };

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      collaboration: {
        select: { job: { select: { title: true } }, company: { select: { name: true } }, freelancer: { select: { user: { select: { name: true } } } } },
      },
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Facturen</h1>
          <p className="text-sm text-muted-foreground">
            {isFreelancer ? "Je opgestelde en verzonden facturen." : "Ontvangen facturen van je samenwerkingen."}
          </p>
        </div>
        {isFreelancer && (
          <Button asChild>
            <Link href="/facturen/nieuw"><Plus className="size-4" aria-hidden /> Nieuwe factuur</Link>
          </Button>
        )}
      </header>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="text-center text-sm text-muted-foreground">
            {isFreelancer ? "Nog geen facturen. Stel er een op vanuit een samenwerking." : "Nog geen facturen ontvangen."}
          </CardContent>
        </Card>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {invoices.map((inv) => (
            <Link key={inv.id} href={`/facturen/${inv.id}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/50">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium tabular-nums">{inv.number}</p>
                  <InvoiceStatusBadge status={inv.status as InvoiceStatus} dueAt={inv.dueAt} />
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {isFreelancer ? inv.collaboration?.company.name : inv.collaboration?.freelancer.user.name}
                  {inv.collaboration?.job.title ? ` · ${inv.collaboration.job.title}` : ""}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums">{formatEuro(inv.totalCents)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
