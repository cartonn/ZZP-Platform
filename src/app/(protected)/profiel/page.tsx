import { type Metadata } from "next";
import { UserX } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProfileScreen } from "@/components/profile/profile-screen";

export const metadata: Metadata = { title: "Mijn profiel · Handslag" };

/**
 * "Mijn profiel" toont direct het publieke profiel — exact wat een opdrachtgever ziet
 * (de eigenaar mag zijn eigen profiel altijd inzien, ook op privé; zie profileVisibleTo) —
 * maar bínnen de app-schil, zodat de zijbalk blijft staan. Bewerken op /profiel/bewerken.
 */
export default async function ProfielPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const actor = await requireRole("FREELANCER");
  const { tab } = await searchParams;
  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId: actor.id },
    select: { id: true },
  });

  if (!profile) {
    return (
      <div>
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={UserX}
              title="Geen freelancerprofiel gevonden"
              description="Er is nog geen profiel gekoppeld aan dit account."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Geen eigen breedte-wrapper: de app-schil geeft elke pagina dezelfde volle breedte met kleine,
  // gelijke marges, zodat het profiel op elke tab exact dezelfde paginaranden heeft als de rest.
  return <ProfileScreen profileId={profile.id} tab={tab} basePath="/profiel" />;
}
