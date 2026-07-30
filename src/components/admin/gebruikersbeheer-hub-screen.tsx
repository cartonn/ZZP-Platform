import Link from "next/link";
import { type Actor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { plural } from "@/lib/plural";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { GebruikersPanel } from "@/components/admin/gebruikersbeheer/gebruikers-panel";
import { BemiddelaarsPanel } from "@/components/admin/gebruikersbeheer/bemiddelaars-panel";
import { ImporterenPanel } from "@/components/admin/gebruikersbeheer/importeren-panel";
import { isEmailConfigured } from "@/app/(protected)/admin/import/actions";

const TABS = [
  { key: "gebruikers", label: "Gebruikers" },
  { key: "bemiddelaars", label: "Bemiddelaars" },
  { key: "importeren", label: "Importeren" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

/**
 * Gebruikersbeheer-hub (kopkaart + tabs + tabinhoud), gemodelleerd op de Toezicht-hub / ProfileScreen.
 * Consolideert de beheer-pagina's (gebruikers, bemiddelaars, importeren) achter één ?tab=-navigatie.
 * ADMIN-only — de route gate't via requireRole. Alleen het ACTIEVE tabpaneel wordt server-side
 * gerenderd, zodat enkel die data laadt. De resterende searchParams (q/role/status/deletion) stromen
 * door naar het gebruikers-paneel met basePath `/admin/gebruikersbeheer?tab=gebruikers`, zodat
 * filter-links binnen de hub blijven.
 */
export async function GebruikersbeheerHubScreen({
  actor,
  tab: rawTab,
  searchParams,
}: {
  actor: Actor;
  tab?: string;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const tab: TabKey = TABS.find((t) => t.key === rawTab)?.key ?? "gebruikers";
  const basePath = `/admin/gebruikersbeheer?tab=${tab}`;

  const tabHref = (key: TabKey) =>
    key === "gebruikers" ? "/admin/gebruikersbeheer" : `/admin/gebruikersbeheer?tab=${key}`;

  const [totalUsers, emailConfigured] = await Promise.all([
    prisma.user.count(),
    tab === "importeren" ? isEmailConfigured() : Promise.resolve(false),
  ]);

  const subtitle = "Accounts, bemiddelaars en onboarding-import op één plek.";

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
              G
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="break-words font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  Gebruikers
                </h1>
                <Badge variant="accent">Handslag</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">{subtitle}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                <span className="text-sm text-muted-foreground">
                  {plural(totalUsers, "gebruiker", "gebruikers")}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs — server-gerenderd via ?tab=, geen client-JS nodig. */}
      <nav
        aria-label="Gebruikersbeheersecties"
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
      {tab === "gebruikers" && (
        <GebruikersPanel actor={actor} searchParams={searchParams} basePath={basePath} />
      )}
      {tab === "bemiddelaars" && <BemiddelaarsPanel />}
      {tab === "importeren" && <ImporterenPanel emailConfigured={emailConfigured} />}
    </div>
  );
}
