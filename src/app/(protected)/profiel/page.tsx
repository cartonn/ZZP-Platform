import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { UserX } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Mijn profiel · ZZP Platform" };

/**
 * "Mijn profiel" toont direct het publieke profiel — exact wat een opdrachtgever ziet
 * (de eigenaar mag zijn eigen profiel altijd inzien, ook op privé; zie profileVisibleTo).
 * Bewerken gebeurt op /profiel/bewerken.
 */
export default async function ProfielPage() {
  const actor = await requireRole("FREELANCER");
  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId: actor.id },
    select: { id: true },
  });

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl">
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

  redirect(`/zzp/${profile.id}`);
}
