import Link from "next/link";
import { Building2, Palette } from "lucide-react";
import { prisma } from "@/lib/db";
import { type Actor } from "@/lib/authz";
import { getTenantStats } from "@/lib/tenant-stats";
import { getTenantBillingOverview } from "@/lib/franchise/billing";
import { formatDateShortNl } from "@/lib/format-date";
import { plural } from "@/lib/plural";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { BillingPanel, tenantBillingStatusLabel } from "@/components/franchise/billing-panel";

const TABS = [
  { key: "bemiddeling", label: "Bemiddeling" },
  { key: "facturatie", label: "Facturatie" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function initials(name: string): string {
  const parts = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase());
  return parts.join("") || "B";
}

/** Toetst of een string een geldige hex-kleur is voordat hij als stijlwaarde wordt gebruikt. */
function safeHex(color: string | null): string | null {
  return color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : null;
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium">{value}</dd>
    </div>
  );
}

/**
 * Bemiddeling-hub (kopkaart + tabs + tabinhoud), gemodelleerd op CompanyProfileScreen / ProfileScreen.
 * De FRANCHISER bekijkt zijn EIGEN bureau: strikt eigenaar/tenant-gescoped via de actor
 * (Tenant.ownerUserId == actor.id, en alle stats lopen via actor.tenantId). Geen cijfers van een
 * andere tenant. Bewerken (white-label branding) op /franchise/instellingen/bewerken.
 */
export async function BemiddelingHubScreen({ actor, tab: rawTab }: { actor: Actor; tab?: string }) {
  const [tenant, stats, billing] = await Promise.all([
    prisma.tenant.findUnique({
      where: { ownerUserId: actor.id },
      select: {
        name: true,
        brandColor: true,
        openOverflow: true,
        createdAt: true,
      },
    }),
    getTenantStats(actor),
    getTenantBillingOverview(actor, new Date()),
  ]);

  if (!tenant) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            icon={Building2}
            title="Geen bemiddeling gekoppeld"
            description="Er is nog geen bemiddeling aan dit account gekoppeld."
          />
        </CardContent>
      </Card>
    );
  }

  const tab: TabKey = TABS.find((t) => t.key === rawTab)?.key ?? "bemiddeling";
  const accent = safeHex(tenant.brandColor);
  const memberSince = formatDateShortNl(tenant.createdAt);
  const subtitle = ["Bemiddelingshub", `actief sinds ${memberSince}`].filter(Boolean).join(" · ");

  const tabHref = (key: TabKey) =>
    key === "bemiddeling" ? "/franchise/instellingen" : `/franchise/instellingen?tab=${key}`;

  return (
    <div className="space-y-6">
      {/* Bureaukop — Warmte-ontwerp: avatar (initialen, getint met de accentkleur), naam + badge,
          subtitel, kerncijfers van het bureau. */}
      <Card className="border-hero bg-hero text-white">
        <CardContent className="space-y-4 p-6 sm:p-8">
          <div className="flex flex-wrap items-start gap-5">
            <div
              aria-hidden
              className="flex size-16 shrink-0 items-center justify-center rounded-full bg-white font-display text-xl font-semibold text-primary sm:size-20 sm:text-2xl"
            >
              {initials(tenant.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="break-words font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  {tenant.name}
                </h1>
                <Badge variant="accent" className="border-transparent bg-white">
                  Bemiddeling
                </Badge>
                {billing && (
                  <Badge variant="muted" className="border-transparent bg-white">
                    Abonnement: {tenantBillingStatusLabel(billing.status)}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm font-medium text-white sm:text-base">{subtitle}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                <span className="text-sm font-medium text-white">
                  {plural(stats?.companies ?? 0, "opdrachtgever", "opdrachtgevers")}
                </span>
                <span className="text-sm font-medium text-white">
                  {plural(stats?.rosterFreelancers ?? 0, "ZZP'er", "ZZP'ers")}
                </span>
                <span className="text-sm font-medium text-white">
                  {plural(
                    stats?.activeCollaborations ?? 0,
                    "lopende samenwerking",
                    "lopende samenwerkingen",
                  )}
                </span>
                {(stats?.completedCollaborations ?? 0) > 0 && (
                  <span className="text-sm font-medium text-white">
                    {plural(
                      stats?.completedCollaborations ?? 0,
                      "afgeronde samenwerking",
                      "afgeronde samenwerkingen",
                    )}
                  </span>
                )}
                <span className="text-sm font-medium text-white">
                  {stats?.fillRate ?? 0}% vulgraad
                </span>
              </div>
            </div>
            {/* Eigen bemiddeling: direct door naar het bewerken van de white-label branding. */}
            <Link
              href="/franchise/instellingen/bewerken"
              className="focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-md border border-white/70 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10"
            >
              Bewerk bemiddeling
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Tabs — server-gerenderd via ?tab=, geen client-JS nodig. */}
      <nav
        aria-label="Bemiddelingssecties"
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

      {tab === "bemiddeling" && (
        <div className="grid gap-6 md:grid-cols-[3fr_2fr] lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <Card>
              <CardContent className="py-4">
                <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Bureau-gegevens
                </h2>
                <dl className="mt-2 divide-y divide-border">
                  <Stat label="Naam" value={tenant.name} />
                  <Stat
                    label="Accentkleur"
                    value={
                      accent ? (
                        <span className="inline-flex items-center gap-2">
                          <span
                            aria-hidden
                            className="size-4 rounded border border-border"
                            style={{ backgroundColor: accent }}
                          />
                          <span className="font-mono uppercase">{accent}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Standaard</span>
                      )
                    }
                  />
                  <Stat
                    label="Diensten openstellen"
                    value={
                      tenant.openOverflow ? (
                        <span className="text-success">Aan — platformbreed</span>
                      ) : (
                        <span className="text-muted-foreground">Uit — alleen eigen roster</span>
                      )
                    }
                  />
                  <Stat label="Actief sinds" value={memberSince} />
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Palette className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Dit is de white-label uitstraling van je bemiddeling — naam en accentkleur tonen
                    in de werkplek-header. Pas ze aan via{" "}
                    <Link
                      href="/franchise/instellingen/bewerken"
                      className="focus-ring rounded font-medium text-foreground hover:underline"
                    >
                      Bewerk bemiddeling
                    </Link>
                    .
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="py-4">
                <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Kerncijfers
                </h2>
                <dl className="mt-2 divide-y divide-border">
                  <Stat label="Opdrachtgevers" value={String(stats?.companies ?? 0)} />
                  <Stat label="ZZP'ers" value={String(stats?.rosterFreelancers ?? 0)} />
                  <Stat
                    label="Lopende samenwerkingen"
                    value={String(stats?.activeCollaborations ?? 0)}
                  />
                  <Stat
                    label="Afgeronde samenwerkingen"
                    value={String(stats?.completedCollaborations ?? 0)}
                  />
                  <Stat label="Vulgraad" value={`${stats?.fillRate ?? 0}%`} />
                  <Stat label="Open diensten" value={String(stats?.openJobs ?? 0)} />
                  <Stat label="Inzetbaarheid roster" value={`${stats?.engageabilityRate ?? 0}%`} />
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {tab === "facturatie" &&
        (billing ? (
          <BillingPanel overview={billing} />
        ) : (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={Building2}
                title="Geen bemiddeling gekoppeld"
                description="Dit overzicht is beschikbaar zodra je een bemiddeling beheert."
              />
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
