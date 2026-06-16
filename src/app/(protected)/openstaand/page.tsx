import { type Metadata } from "next";
import { requireActor } from "@/lib/authz";
import { OpenstaandPanel } from "@/components/administratie/openstaand-panel";

export const metadata: Metadata = { title: "Openstaande posten · ZZP Platform" };

export default async function OpenstaandPage() {
  const actor = await requireActor();
  const isFreelancer = actor.role === "FREELANCER";
  const isAdmin = actor.role === "ADMIN";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Openstaande posten</h1>
        {!isAdmin && (
          <p className="text-sm text-muted-foreground">
            {isFreelancer
              ? "Facturen die je nog moet ontvangen, gerangschikt naar ouderdom."
              : "Facturen die je nog moet betalen, gerangschikt naar ouderdom."}
          </p>
        )}
      </header>
      <OpenstaandPanel actor={actor} />
    </div>
  );
}
