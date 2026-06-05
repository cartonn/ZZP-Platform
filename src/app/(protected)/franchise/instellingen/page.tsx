import { type Metadata } from "next";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { BrandingForm } from "./branding-form";

export const metadata: Metadata = { title: "Instellingen · Franchise" };

export default async function FranchiseInstellingenPage() {
  const actor = await requireRole("FRANCHISER");
  const tenant = await prisma.tenant.findUnique({
    where: { ownerUserId: actor.id },
    select: { name: true, brandColor: true },
  });

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title="Instellingen"
        description="De white-label uitstraling van je franchise — naam en accentkleur in de werkplek."
      />
      <Card>
        <CardContent className="p-5">
          <BrandingForm
            initialName={tenant?.name ?? ""}
            initialColor={tenant?.brandColor ?? null}
          />
        </CardContent>
      </Card>
    </div>
  );
}
