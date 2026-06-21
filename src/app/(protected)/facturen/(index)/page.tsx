import { type Metadata } from "next";
import { requireActor } from "@/lib/authz";
import { PageHeader } from "@/components/ui/page-header";
import { FacturenPanel } from "@/components/administratie/facturen-panel";

export const metadata: Metadata = { title: "Facturen · ZZP Platform" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function FacturenPage({ searchParams }: { searchParams: SearchParams }) {
  const actor = await requireActor();
  const isFreelancer = actor.role === "FREELANCER";
  const sp = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facturen"
        description={
          isFreelancer
            ? "Je opgestelde en verzonden facturen."
            : "Ontvangen facturen van je samenwerkingen."
        }
      />
      <FacturenPanel actor={actor} searchParams={sp} basePath="/facturen" />
    </div>
  );
}
