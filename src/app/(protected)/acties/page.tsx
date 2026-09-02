import { type Metadata } from "next";
import { Inbox } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { pendingTasks } from "@/lib/actions/pending-tasks";
import { loadDrawerData } from "@/lib/actions/drawer-data";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ActionList } from "@/components/actions/action-list";
import { plural } from "@/lib/plural";

export const metadata: Metadata = { title: "Acties · Handslag" };

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
    <div className="space-y-6">
      {/* De paginakop noemt de eigen telling ("X acties open") zodat dit scherm zijn getal uitlegt —
          los van de meldingen-bel (die de gelezen/ongelezen historie telt, een ander soort teller). */}
      <PageHeader
        title="Acties"
        description={
          tasks.length > 0
            ? `${plural(tasks.length, "actie open", "acties open")} — op volgorde van belang; bovenaan beginnen is altijd goed.`
            : "Alles is afgehandeld."
        }
      />

      {tasks.length === 0 ? (
        <Card>
          <EmptyState
            icon={Inbox}
            title="Helemaal bij"
            description="Geen openstaande acties — mooi werk. Zodra er iets op je wacht, verschijnt het hier."
          />
        </Card>
      ) : (
        <ActionList tasks={tasks} drawerData={drawerData} />
      )}
    </div>
  );
}
