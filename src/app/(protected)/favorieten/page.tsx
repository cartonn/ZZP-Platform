import { type Metadata } from "next";
import Link from "next/link";
import { Contact, Star, Trash2 } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { sortFavorites } from "@/lib/favorites";
import { type Availability } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { plural } from "@/lib/plural";
import { removeFavorite } from "./actions";

export const metadata: Metadata = { title: "Flexpool · ZZP Platform" };

const AVAILABILITY: Record<
  Availability,
  { label: string; variant: "success" | "warning" | "muted" }
> = {
  AVAILABLE: { label: "Beschikbaar", variant: "success" },
  LIMITED: { label: "Beperkt beschikbaar", variant: "warning" },
  UNAVAILABLE: { label: "Niet beschikbaar", variant: "muted" },
  UNKNOWN: { label: "Beschikbaarheid onbekend", variant: "muted" },
};

export default async function FlexpoolPage() {
  const actor = await requireRole("CLIENT");

  const company = await prisma.company.findUnique({
    where: { userId: actor.id },
    select: { id: true },
  });

  if (!company) {
    return (
      <div className="space-y-6">
        <PageHeader title="Flexpool" description="Je poule van bewezen ZZP'ers." />
        <Card>
          <CardContent className="p-6 sm:p-8">
            <EmptyState
              icon={Contact}
              title="Eerst een bedrijfsprofiel"
              description="Rond je bedrijfsprofiel af om ZZP'ers aan je poule toe te voegen."
              action={{ label: "Naar bedrijfsprofiel", href: "/bedrijf" }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const rows = await prisma.favoriteFreelancer.findMany({
    // Geen geschorste/geanonimiseerde ZZP'ers in de poule-weergave: server-side waarheid, consistent
    // met discoverableFreelancerWhere (zoek/suggesties) en planPoolInvites (uitnodigingen).
    where: { companyId: company.id, freelancer: { user: { status: "ACTIVE" } } },
    take: 100,
    select: {
      freelancerProfileId: true,
      note: true,
      createdAt: true,
      freelancer: {
        select: {
          id: true,
          headline: true,
          location: true,
          hourlyRate: true,
          availability: true,
          user: { select: { name: true } },
        },
      },
    },
  });

  // Beschikbaren bovenaan (pure sortFavorites): een string-kolom kan dat in de DB niet uitdrukken.
  const favorites = sortFavorites(
    rows.map((r) => ({ ...r, availability: r.freelancer.availability as Availability })),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Flexpool"
        description={
          favorites.length > 0
            ? `${plural(favorites.length, "ZZP'er", "ZZP'ers")} in je poule — beschikbaren eerst.`
            : "Je poule van bewezen ZZP'ers."
        }
      />

      {favorites.length === 0 ? (
        <Card>
          <CardContent className="p-6 sm:p-8">
            <EmptyState
              icon={Star}
              title="Nog geen ZZP'ers in je poule"
              description="Voeg bewezen ZZP'ers toe vanaf hun profiel. Zo heb je je eigen mensen meteen bij de hand voor nieuwe diensten."
              action={{ label: "ZZP'ers bekijken", href: "/freelancers" }}
            />
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {favorites.map((fav) => {
            const a = AVAILABILITY[fav.availability];
            const subtitle = [fav.freelancer.headline, fav.freelancer.location]
              .filter(Boolean)
              .join(" · ");
            return (
              <li key={fav.freelancerProfileId}>
                <Card>
                  <CardContent className="flex flex-wrap items-start justify-between gap-4 p-4 sm:p-5">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <Link
                          href={`/zzp/${fav.freelancer.id}`}
                          className="focus-ring rounded font-medium hover:underline"
                        >
                          {fav.freelancer.user.name}
                        </Link>
                        <Badge variant={a.variant}>{a.label}</Badge>
                        {fav.freelancer.hourlyRate != null && (
                          <span className="text-sm text-muted-foreground">
                            <span className="font-mono">€ {fav.freelancer.hourlyRate}</span>/uur
                          </span>
                        )}
                      </div>
                      {subtitle && (
                        <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
                      )}
                      {fav.note && <p className="text-sm">{fav.note}</p>}
                    </div>
                    <ConfirmButton
                      action={removeFavorite.bind(null, fav.freelancerProfileId)}
                      title="Uit je poule verwijderen?"
                      description={`${fav.freelancer.user.name} wordt uit je flexpool gehaald. Je kunt deze ZZP'er later opnieuw toevoegen.`}
                      confirmLabel="Verwijderen"
                      aria-label={`${fav.freelancer.user.name} uit je poule verwijderen`}
                    >
                      <Trash2 className="size-4" aria-hidden />
                      Verwijderen
                    </ConfirmButton>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
