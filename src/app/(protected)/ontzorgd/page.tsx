import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { OntzorgdPanel } from "@/components/administratie/ontzorgd-panel";

export const metadata: Metadata = { title: "Ontzorgd · ZZP Platform" };

export default async function OntzorgdPage() {
  const actor = await requireActor();
  // Alleen voor ZZP'ers; opdrachtgever/admin hebben een eigen administratie.
  if (actor.role !== "FREELANCER") redirect("/administratie");

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" aria-hidden />
          <h1 className="text-xl font-semibold tracking-tight">Ontzorgd</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Jouw administratie en belasting in één beeld. Wij rekenen voor, jij hoeft alleen te
          werken.
        </p>
      </header>
      <OntzorgdPanel actor={actor} />
    </div>
  );
}
