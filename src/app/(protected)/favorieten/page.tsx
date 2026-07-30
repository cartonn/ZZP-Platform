import { type Metadata } from "next";
import { Contact } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { FlexpoolPanel } from "@/components/favorites/flexpool-panel";

export const metadata: Metadata = { title: "Flexpool · ZZP Platform" };

export default async function FlexpoolPage() {
  const actor = await requireRole("CLIENT");

  const company = await prisma.company.findUnique({
    where: { userId: actor.id },
    select: { id: true },
  });

  if (!company) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="De etalage · flexpool"
          title="Flexpool"
          description="Je poule van bewezen ZZP'ers."
        />
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Flexpool"
        description="Je poule van bewezen ZZP'ers — beschikbaren eerst."
      />
      <FlexpoolPanel companyId={company.id} />
    </div>
  );
}
