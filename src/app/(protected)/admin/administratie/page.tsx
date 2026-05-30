import { type Metadata } from "next";
import { BarChart } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatEuro } from "@/lib/invoices";
import { platformQuarterlySummary } from "@/lib/administration/platform-overview";

export const metadata: Metadata = { title: "Platform Administratie · ZZP Platform" };

const QUARTER_LABEL: Record<number, string> = {
  1: "Q1",
  2: "Q2",
  3: "Q3",
  4: "Q4",
};

function fmt(d: Date | null | undefined): string {
  return d ? d.toLocaleDateString("nl-NL") : "—";
}

function lifecycleLabel(status: string | null | undefined): string {
  switch (status) {
    case "APPROVED":
      return "Goedgekeurd";
    case "OVERDUE":
      return "Verlopen";
    default:
      return status ?? "—";
  }
}

export default async function AdminAdministratiePage() {
  await requireRole("ADMIN");

  const [adminEntries, collaborations] = await Promise.all([
    prisma.administrationEntry.findMany({
      orderBy: { occurredAt: "asc" },
    }),
    prisma.collaboration.findMany({
      where: {
        status: { in: ["ACTIVE", "COMPLETED"] },
        invoices: {
          some: {
            lifecycleStatus: { in: ["APPROVED", "OVERDUE"] },
          },
        },
      },
      include: {
        job: { select: { title: true } },
        freelancer: { select: { user: { select: { name: true } } } },
        company: { select: { name: true } },
        invoices: {
          where: {
            lifecycleStatus: { in: ["APPROVED", "OVERDUE"] },
          },
          select: {
            id: true,
            partyInvoiceNumber: true,
            lifecycleStatus: true,
            totalCents: true,
            dueAt: true,
          },
        },
      },
    }),
  ]);

  const quarterRows = platformQuarterlySummary(
    adminEntries.map((e) => ({
      party: e.party as "FREELANCER" | "CLIENT" | "PLATFORM",
      account: e.account as
        | "DEBITEUREN"
        | "CREDITEUREN"
        | "OMZET"
        | "KOSTEN"
        | "BTW_AF_TE_DRAGEN"
        | "BTW_VOORBELASTING"
        | "ONTVANGEN"
        | "BETAALD",
      debitCents: e.debitCents,
      creditCents: e.creditCents,
      occurredAt: e.occurredAt,
    })),
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Platform Administratie</h1>
        <p className="text-sm text-muted-foreground">
          Platform-brede kwartaaloverzichten en openstaande betalingen over alle samenwerkingen.
        </p>
      </header>

      {/* Kwartaaloverzicht */}
      <section className="space-y-3">
        <h2 className="text-base font-medium">Kwartaaloverzicht</h2>

        {quarterRows.length === 0 ? (
          <Card>
            <EmptyState
              icon={BarChart}
              title="Geen gegevens"
              description="Er zijn nog geen administratieregels beschikbaar."
            />
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Periode</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        Omzet (ZZP&apos;ers)
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        Kosten (opdrachtgevers)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {quarterRows.map((row) => (
                      <tr key={`${row.year}-${row.quarter}`} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-medium">
                          {QUARTER_LABEL[row.quarter]} {row.year}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatEuro(row.freelancerRevenueCents)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatEuro(row.clientCostsCents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Openstaande betalingen */}
      <section className="space-y-3">
        <h2 className="text-base font-medium">Openstaande betalingen</h2>

        {collaborations.length === 0 ? (
          <Card>
            <EmptyState
              icon={BarChart}
              title="Geen openstaande betalingen"
              description="Er zijn op dit moment geen goedgekeurde of verlopen facturen zonder betaling."
            />
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">ZZP&apos;er</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Opdrachtgever</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Opdracht</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Factuurnummer</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Bedrag</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vervaldatum</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collaborations.flatMap((c) =>
                      c.invoices.map((inv) => (
                        <tr key={inv.id} className="border-b border-border last:border-0">
                          <td className="px-4 py-3">{c.freelancer.user.name ?? "—"}</td>
                          <td className="px-4 py-3">{c.company.name}</td>
                          <td className="px-4 py-3 max-w-[200px] truncate">{c.job.title}</td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {inv.partyInvoiceNumber ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {formatEuro(inv.totalCents)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{fmt(inv.dueAt)}</td>
                          <td className="px-4 py-3">
                            <Badge variant={inv.lifecycleStatus === "OVERDUE" ? "warning" : "muted"}>
                              {lifecycleLabel(inv.lifecycleStatus)}
                            </Badge>
                          </td>
                        </tr>
                      )),
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
