import { type Metadata } from "next";
import { Inbox } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { pendingTasks } from "@/lib/actions/pending-tasks";
import { loadDrawerData } from "@/lib/actions/drawer-data";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ActionList } from "@/components/actions/action-list";

export const metadata: Metadata = { title: "Acties · ZZP Platform" };

// Het Actiecentrum: één plek waar alles wat op je wacht inline af te handelen is. De server is de
// waarheid (pendingTasks enumereert de concrete openstaande items); na elke actie revalideert die
// de pagina, waardoor de afgehandelde taak verdwijnt en de volgende klaarstaat.
export default async function ActiesPage() {
  const actor = await requireActor();
  const tasks = await pendingTasks(actor);
  // Prefetch de form-data voor de drawer-soorten die daadwerkelijk in de lijst staan (N+1-veilig),
  // zodat elke actie ter plekke in een slide-over af te handelen is.
  const drawerData = await loadDrawerData(actor, tasks);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Acties</h1>
        <p className="text-sm text-muted-foreground">
          {tasks.length > 0
            ? "Handel hier alles af wat op je wacht — afgehandelde acties verdwijnen vanzelf."
            : "Alles is afgehandeld."}
        </p>
      </header>

      {tasks.length === 0 ? (
        <Card>
          <EmptyState
            icon={Inbox}
            title="Niets te doen"
            description="Je hebt geen openstaande acties. Zodra er iets op je wacht, verschijnt het hier."
          />
        </Card>
      ) : (
        <ActionList tasks={tasks} drawerData={drawerData} />
      )}
    </div>
  );
}
