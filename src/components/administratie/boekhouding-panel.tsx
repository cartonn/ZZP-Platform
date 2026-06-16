import { Receipt, Lock, Landmark } from "lucide-react";
import { type Actor } from "@/lib/authz";
import { userHasEntitlement } from "@/lib/entitlement-guard";
import { prisma } from "@/lib/db";
import { formatEuro } from "@/lib/invoices";
import {
  vatYear,
  openReceivablesCents,
  openPayablesCents,
  revenueCents,
  annualSummary,
  administrationPartyForRole,
  type LedgerEntry,
} from "@/lib/administration/overview";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

const QUARTER_LABEL = ["1e kwartaal", "2e kwartaal", "3e kwartaal", "4e kwartaal"];

/**
 * Boekhouding-paneel: persoonlijk grootboek/btw/debiteuren van de actor (rol-bewust). Betaalde
 * feature (ADMINISTRATIE); ADMIN mag altijd maar heeft geen eigen grootboek. Laadt zelf zijn data,
 * rendert geen eigen paginakop — de route en de Administratie-hub leveren de titel.
 */
export async function BoekhoudingPanel({ actor }: { actor: Actor }) {
  // Boekhouding (grootboek/btw/debiteuren) is een betaalde feature (ADMINISTRATIE). Admin mag altijd.
  if (actor.role !== "ADMIN" && !(await userHasEntitlement(actor.id, "ADMINISTRATIE"))) {
    return (
      <Card>
        <EmptyState
          icon={Lock}
          title="Boekhouding zit in een betaald plan"
          description="Upgrade naar Zelf-doen of hoger voor je grootboek, btw per kwartaal en debiteuren/crediteuren."
          action={{ label: "Bekijk abonnementen", href: "/abonnement" }}
        />
      </Card>
    );
  }

  // Alleen ZZP'er/opdrachtgever hebben een eigen grootboek. ADMIN gebruikt het platform-brede
  // overzicht (/admin/administratie); een franchisenemer heeft geen persoonlijke administratie.
  const party = administrationPartyForRole(actor.role);
  if (!party) {
    const isAdmin = actor.role === "ADMIN";
    return (
      <Card>
        <EmptyState
          icon={Landmark}
          title="Geen persoonlijke boekhouding voor deze rol"
          description={
            isAdmin
              ? "Als beheerder heb je geen eigen grootboek. Het platform-brede overzicht (grootboek, btw per kwartaal en debiteuren/crediteuren) staat onder Beheer."
              : "Deze rol heeft geen eigen debiteuren-/crediteurenadministratie."
          }
          action={
            isAdmin
              ? { label: "Naar platform-administratie", href: "/admin/administratie" }
              : { label: "Naar dashboard", href: "/dashboard" }
          }
        />
      </Card>
    );
  }

  const year = new Date().getFullYear();

  const rows = await prisma.administrationEntry.findMany({ where: { ownerUserId: actor.id } });
  const entries: LedgerEntry[] = rows.map((r) => ({
    party: r.party as LedgerEntry["party"],
    account: r.account as LedgerEntry["account"],
    debitCents: r.debitCents,
    creditCents: r.creditCents,
    occurredAt: r.occurredAt,
  }));

  const isFreelancer = party === "FREELANCER";
  const open = isFreelancer
    ? openReceivablesCents(entries, party)
    : openPayablesCents(entries, party);
  const revenue = isFreelancer ? revenueCents(entries, party, year) : 0;
  const quarters = vatYear(entries, party, year);
  const vatTotal = quarters.reduce((s, q) => s + q.balanceCents, 0);
  const annual = annualSummary(entries, party, year);

  return (
    <div className="space-y-6">
      {entries.length > 0 && (
        <div className="flex justify-end gap-2">
          <a
            href="/api/administratie/export"
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            Grootboek CSV
          </a>
          <a
            href="/api/administratie/btw"
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            BTW-overzicht CSV
          </a>
        </div>
      )}

      {entries.length === 0 ? (
        <Card>
          <EmptyState
            icon={Receipt}
            title="Nog geen boekhouding"
            description="Zodra er facturen via het werkproces lopen, verschijnen hier je BTW- en debiteuren-/crediteurenoverzichten."
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="py-4">
                <p className="text-xs text-muted-foreground">
                  {isFreelancer ? "Openstaand (debiteuren)" : "Openstaand (crediteuren)"}
                </p>
                <p className="text-lg font-semibold">{formatEuro(open)}</p>
              </CardContent>
            </Card>
            {isFreelancer && (
              <Card>
                <CardContent className="py-4">
                  <p className="text-xs text-muted-foreground">Omzet {year}</p>
                  <p className="text-lg font-semibold">{formatEuro(revenue)}</p>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardContent className="py-4">
                <p className="text-xs text-muted-foreground">
                  {isFreelancer ? "Af te dragen BTW" : "Voorbelasting (terug)"} {year}
                </p>
                <p className="text-lg font-semibold">
                  {formatEuro(isFreelancer ? vatTotal : -vatTotal)}
                </p>
              </CardContent>
            </Card>
          </div>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">BTW per kwartaal</h2>
            <Card>
              <CardContent className="py-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="py-2 font-medium">Periode</th>
                      <th className="py-2 text-right font-medium">Af te dragen</th>
                      <th className="py-2 text-right font-medium">Voorbelasting</th>
                      <th className="py-2 text-right font-medium">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quarters.map((q) => (
                      <tr key={q.quarter} className="border-t border-border">
                        <td className="py-2">{QUARTER_LABEL[q.quarter - 1]}</td>
                        <td className="py-2 text-right">{formatEuro(q.payableCents)}</td>
                        <td className="py-2 text-right">{formatEuro(q.deductibleCents)}</td>
                        <td className="py-2 text-right font-medium">
                          {formatEuro(q.balanceCents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground">
              Saldo positief = af te dragen aan de Belastingdienst; negatief = terug te ontvangen.
              Indicatief overzicht.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">Jaaroverzicht {year} (IB-voorbereiding)</h2>
            <Card>
              <CardContent className="space-y-1 py-3 text-sm">
                {isFreelancer ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Omzet</span>
                    <span className="tabular-nums">{formatEuro(annual.revenueCents)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kosten (inhuur)</span>
                    <span className="tabular-nums">{formatEuro(annual.costCents)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Af te dragen BTW</span>
                  <span className="tabular-nums">{formatEuro(annual.vatPayableCents)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Voorbelasting</span>
                  <span className="tabular-nums">{formatEuro(annual.vatDeductibleCents)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1 font-medium">
                  <span>BTW-saldo {year}</span>
                  <span className="tabular-nums">{formatEuro(annual.vatBalanceCents)}</span>
                </div>
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground">
              Indicatief jaaroverzicht ter voorbereiding op je aangifte. Geen fiscaal advies;
              raadpleeg je boekhouder.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
