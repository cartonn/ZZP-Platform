import Link from "next/link";
import { Star, Trash2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { sortFavorites } from "@/lib/favorites";
import { type Availability } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { removeFavorite } from "@/app/(protected)/favorieten/actions";

const AVAILABILITY: Record<
  Availability,
  { label: string; variant: "success" | "warning" | "muted" }
> = {
  AVAILABLE: { label: "Beschikbaar", variant: "success" },
  LIMITED: { label: "Beperkt beschikbaar", variant: "warning" },
  UNAVAILABLE: { label: "Niet beschikbaar", variant: "muted" },
  UNKNOWN: { label: "Beschikbaarheid onbekend", variant: "muted" },
};

/**
 * Flexpool/favorieten-paneel — de poule van bewezen ZZP'ers van één opdrachtgever.
 * Eigenaar-gescoped: laadt uitsluitend favorieten van `companyId` (server-side waarheid).
 * Gedeeld tussen /favorieten en de "flexpool"-tab van de bedrijfsprofiel-hub, zodat beide
 * exact dezelfde lijst tonen. Begrensd met `take: 100`.
 */
export async function FlexpoolPanel({ companyId }: { companyId: string }) {
  const rows = await prisma.favoriteFreelancer.findMany({
    // Geen geschorste/geanonimiseerde ZZP'ers in de poule-weergave: server-side waarheid, consistent
    // met discoverableFreelancerWhere (zoek/suggesties) en planPoolInvites (uitnodigingen).
    where: { companyId, freelancer: { user: { status: "ACTIVE" } } },
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

  if (favorites.length === 0) {
    return (
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
    );
  }

  return (
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
                  {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
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
  );
}
