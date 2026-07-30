import Link from "next/link";
import { listPlatformBillingInvoices } from "@/lib/platform-billing/billing-data";
import { formatEuro } from "@/lib/invoices";
import { plural } from "@/lib/plural";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AdminAdministratiePanel } from "@/components/admin/financien/administratie-panel";
import { FacturatiePanel } from "@/components/admin/financien/facturatie-panel";

const TABS = [
  { key: "administratie", label: "Administratie" },
  { key: "facturatie", label: "Facturatie" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

/**
 * Headline-cijfers voor de kopkaart: openstaand bedrag en totaal aantal platform-facturen. Eén
 * lees-only call (dezelfde bron als het facturatie-paneel), zodat de kop altijd dezelfde getallen
 * toont als de tab.
 */
async function headlineStats(): Promise<{ openCents: number; total: number }> {
  const invoices = await listPlatformBillingInvoices();
  const openCents = invoices
    .filter((i) => i.status === "DRAFT" || i.status === "SENT")
    .reduce((s, i) => s + i.totalCents, 0);
  return { openCents, total: invoices.length };
}

/**
 * Financiën-hub (kopkaart + tabs + tabinhoud), gemodelleerd op de Toezicht-hub / ProfileScreen.
 * Consolideert de admin-financiële pagina's (platform-administratie + platform-facturatie) achter
 * één ?tab=-navigatie. ADMIN-only — de route gate't via requireRole. Alleen het ACTIEVE tabpaneel
 * wordt server-side gerenderd, zodat enkel die data laadt. De resterende searchParams (status/
 * gegenereerd) stromen door naar het facturatie-paneel met basePath `/admin/financien?tab=facturatie`,
 * zodat filter-links binnen de hub blijven.
 */
export async function FinancienHubScreen({
  tab: rawTab,
  searchParams,
}: {
  tab?: string;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const tab: TabKey = TABS.find((t) => t.key === rawTab)?.key ?? "administratie";
  const basePath = `/admin/financien?tab=${tab}`;

  const tabHref = (key: TabKey) =>
    key === "administratie" ? "/admin/financien" : `/admin/financien?tab=${key}`;

  const { openCents, total } = await headlineStats();

  const subtitle = "Platform-administratie en facturatie aan bemiddelingen en ZZP'ers.";

  return (
    <div className="space-y-6">
      {/* Kop — Warmte-ontwerp: avatar, titel + badge, subtitel, kerncijfers. */}
      <Card>
        <CardContent className="space-y-4 p-6 sm:p-8">
          <div className="flex flex-wrap items-start gap-5">
            <div
              aria-hidden
              className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-xl font-semibold text-primary sm:size-20 sm:text-2xl"
            >
              €
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="break-words font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  Financiën
                </h1>
                <Badge variant="accent">Handslag</Badge>
                {openCents > 0 && (
                  <Badge variant="warning">{formatEuro(openCents)} facturatie open</Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">{subtitle}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                <span className="text-sm text-muted-foreground">
                  Platform-facturatie openstaand{" "}
                  <span className="font-medium tabular-nums">{formatEuro(openCents)}</span>
                </span>
                <span className="text-sm text-muted-foreground">
                  {plural(total, "platform-factuur", "platform-facturen")}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs — server-gerenderd via ?tab=, geen client-JS nodig. */}
      <nav
        aria-label="Financiënsecties"
        className="flex flex-wrap gap-1 border-b border-border text-sm"
      >
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={tabHref(t.key)}
            aria-current={tab === t.key ? "page" : undefined}
            className={
              tab === t.key
                ? "focus-ring -mb-px border-b-2 border-primary px-3 py-2 font-medium text-foreground"
                : "focus-ring -mb-px border-b-2 border-transparent px-3 py-2 text-muted-foreground hover:text-foreground"
            }
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {/* Alleen het actieve tabpaneel rendert — zo laadt enkel die data server-side. */}
      {tab === "administratie" && <AdminAdministratiePanel />}
      {tab === "facturatie" && <FacturatiePanel searchParams={searchParams} basePath={basePath} />}
    </div>
  );
}
