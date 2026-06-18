import { type Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { BrandingForm } from "../branding-form";

export const metadata: Metadata = { title: "Bemiddeling bewerken · ZZP Platform" };

/**
 * Bewerk-formulier voor de white-label branding van de eigen bemiddeling (naam, accentkleur,
 * diensten openstellen). Strikt eigenaar-gescoped: Tenant.ownerUserId == actor.id. De hub zelf
 * staat op /franchise/instellingen.
 */
export default async function FranchiseInstellingenBewerkenPage() {
  const actor = await requireRole("FRANCHISER");
  const tenant = await prisma.tenant.findUnique({
    where: { ownerUserId: actor.id },
    select: { name: true, brandColor: true, openOverflow: true },
  });

  return (
    <div className="space-y-6">
      <Link
        href="/franchise/instellingen"
        className="focus-ring inline-flex items-center gap-1.5 rounded text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Terug naar Mijn bemiddeling
      </Link>
      <PageHeader
        title="Bemiddeling bewerken"
        description="De white-label uitstraling van je bemiddeling — naam en accentkleur in de werkplek."
      />
      <Card>
        <CardContent className="p-5">
          <BrandingForm
            initialName={tenant?.name ?? ""}
            initialColor={tenant?.brandColor ?? null}
            initialOverflow={tenant?.openOverflow ?? false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
