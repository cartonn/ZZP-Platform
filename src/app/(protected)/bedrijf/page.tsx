import { type Metadata } from "next";
import { Building2 } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { CompanyProfileScreen } from "@/components/company/company-profile-screen";

export const metadata: Metadata = { title: "Bedrijfsprofiel · ZZP Platform" };

/**
 * Bedrijfsprofiel-hub: de opdrachtgever ziet zijn eigen bedrijfsprofiel (kopkaart + tabs:
 * bedrijf, flexpool, beoordelingen) binnen de app-schil. Strikt eigenaar-gescoped op
 * `actor.id` — er bestaat geen publiek bedrijfsprofiel. Bewerken op /bedrijf/bewerken.
 */
export default async function BedrijfPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const actor = await requireRole("CLIENT");
  const { tab } = await searchParams;

  const company = await prisma.company.findUnique({
    where: { userId: actor.id },
    select: { id: true },
  });

  if (!company) {
    return (
      <div>
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={Building2}
              title="Geen bedrijfsprofiel gevonden"
              description="Er is nog geen bedrijfsprofiel gekoppeld aan dit account."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CompanyProfileScreen companyUserId={actor.id} tab={tab} />
    </div>
  );
}
