import Link from "next/link";
import { type Actor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { formatEuro } from "@/lib/invoices";
import { isInvoiceOutstanding } from "@/lib/administration/outstanding";
import { ROLE_LABEL } from "@/lib/nav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FacturenPanel } from "@/components/administratie/facturen-panel";
import { OpenstaandPanel } from "@/components/administratie/openstaand-panel";
import { BoekhoudingPanel } from "@/components/administratie/boekhouding-panel";
import { PrognosePanel } from "@/components/administratie/prognose-panel";
import { OntzorgdPanel } from "@/components/administratie/ontzorgd-panel";
import { VerplichtingenPanel } from "@/components/administratie/verplichtingen-panel";

const TAB_LABEL = {
  facturen: "Facturen",
  openstaand: "Openstaand",
  boekhouding: "Boekhouding",
  prognose: "Prognose",
  ontzorgd: "Ontzorgd",
  verplichtingen: "Verplichtingen",
} as const;
type TabKey = keyof typeof TAB_LABEL;

const FREELANCER_TABS: readonly TabKey[] = [
  "facturen",
  "openstaand",
  "boekhouding",
  "prognose",
  "ontzorgd",
];
const CLIENT_TABS: readonly TabKey[] = ["facturen", "openstaand", "boekhouding", "verplichtingen"];

function tabsForRole(role: Actor["role"]): readonly TabKey[] {
  return role === "FREELANCER" ? FREELANCER_TABS : CLIENT_TABS;
}

/**
 * Headline-cijfers voor de kopkaart: openstaand bedrag (rol-bewust) en — voor de ZZP'er — de
 * betaalde omzet. Live berekend uit de facturen van de actor; cascade-bewust via isInvoiceOutstanding.
 */
async function headlineStats(actor: Actor): Promise<{ openCents: number; paidCents: number }> {
  const isFreelancer = actor.role === "FREELANCER";
  const where = isFreelancer
    ? { collaboration: { freelancer: { userId: actor.id } } }
    : { collaboration: { company: { userId: actor.id } } };

  const invoices = await prisma.invoice.findMany({
    where,
    select: { status: true, lifecycleStatus: true, totalCents: true, dueAt: true },
  });

  const openCents = invoices.reduce(
    (sum, inv) => (isInvoiceOutstanding(inv) ? sum + inv.totalCents : sum),
    0,
  );
  const paidCents = invoices.reduce(
    (sum, inv) => (inv.status === "PAID" ? sum + inv.totalCents : sum),
    0,
  );

  return { openCents, paidCents };
}

/**
 * Administratie-hub (kopkaart + tabs + tabinhoud), gemodelleerd op de Toezicht-hub / ProfileScreen.
 * Consolideert de financiële pagina's (facturen, openstaand, boekhouding, prognose/ontzorgd of
 * verplichtingen) achter één ?tab=-navigatie. Rol-bewust: FREELANCER en CLIENT zien een eigen
 * tab-set. Alleen het ACTIEVE tabpaneel wordt server-side gerenderd, zodat enkel die data laadt.
 */
export async function AdministratieHubScreen({
  actor,
  tab: rawTab,
  searchParams = {},
}: {
  actor: Actor;
  tab?: string;
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const tabs = tabsForRole(actor.role);
  const tab: TabKey = (tabs as readonly string[]).includes(rawTab ?? "")
    ? (rawTab as TabKey)
    : "facturen";

  const { openCents, paidCents } = await headlineStats(actor);
  const isFreelancer = actor.role === "FREELANCER";

  const tabHref = (key: TabKey) => (key === "facturen" ? "/financien" : `/financien?tab=${key}`);

  const subtitle = isFreelancer
    ? "Je facturen, openstaande posten en boekhouding op één plek."
    : "Je facturen, openstaande posten en verplichtingen op één plek.";

  return (
    <div className="space-y-6">
      {/* Kop — Warmte-ontwerp: avatar, titel + rolbadge, subtitel, kerncijfers. */}
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
                  Administratie
                </h1>
                <Badge variant="accent">{ROLE_LABEL[actor.role]}</Badge>
                {openCents > 0 && (
                  <Badge variant="warning">{formatEuro(openCents)} openstaand</Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">{subtitle}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                <span className="text-sm text-muted-foreground">
                  Openstaand{" "}
                  <span className="font-medium tabular-nums">{formatEuro(openCents)}</span>
                </span>
                {isFreelancer && (
                  <span className="text-sm text-muted-foreground">
                    Betaalde omzet{" "}
                    <span className="font-medium tabular-nums">{formatEuro(paidCents)}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs — server-gerenderd via ?tab=, geen client-JS nodig. */}
      <nav
        aria-label="Administratiesecties"
        className="flex flex-wrap gap-1 border-b border-border text-sm"
      >
        {tabs.map((key) => (
          <Link
            key={key}
            href={tabHref(key)}
            aria-current={tab === key ? "page" : undefined}
            className={
              tab === key
                ? "focus-ring -mb-px border-b-2 border-primary px-3 py-2 font-medium text-foreground"
                : "focus-ring -mb-px border-b-2 border-transparent px-3 py-2 text-muted-foreground hover:text-foreground"
            }
          >
            {TAB_LABEL[key]}
          </Link>
        ))}
      </nav>

      {/* Alleen het actieve tabpaneel rendert — zo laadt enkel die data server-side. */}
      {tab === "facturen" && (
        <FacturenPanel actor={actor} searchParams={searchParams} basePath="/financien" />
      )}
      {tab === "openstaand" && <OpenstaandPanel actor={actor} />}
      {tab === "boekhouding" && <BoekhoudingPanel actor={actor} />}
      {tab === "prognose" && <PrognosePanel actor={actor} />}
      {tab === "ontzorgd" && <OntzorgdPanel actor={actor} />}
      {tab === "verplichtingen" && <VerplichtingenPanel actor={actor} />}
    </div>
  );
}
