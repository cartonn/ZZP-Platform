// Dashboard-zone "Wat vraagt aandacht": de top-taken inline-afhandelbaar (dezelfde resolvers +
// drawer als /acties), met een link naar de volledige lijst. Eén Card (geen kaart-in-kaart): een
// bordered header, de TaskRows, en een footer-link bij afkapping. De volgorde komt al gerankt
// binnen (rankTasks), dus slice = de meest urgente taken.

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TaskHero, TaskRows } from "@/components/actions/action-list";
import { selectDashboardTasks, type PendingTask } from "@/lib/actions/tasks";
import { type DrawerData } from "@/lib/actions/drawer-data";

export function DashboardActions({
  tasks,
  drawerData,
  title,
  max = 6,
}: {
  tasks: PendingTask[];
  drawerData?: Record<string, DrawerData>;
  title: string;
  max?: number;
}) {
  // top-`max`, maar met een gereserveerde floor-slot voor onomkeerbaar-met-deadline-taken
  // (bv. een sluitend beoordelingsvenster) zodat die niet stil van de rail vallen.
  const shown = selectDashboardTasks(tasks, max);
  const rest = tasks.length - shown.length;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
        {tasks.length > 0 ? (
          <Link
            href="/acties"
            className="focus-ring text-xs text-muted-foreground hover:text-foreground"
          >
            Alle acties
          </Link>
        ) : null}
      </div>

      {tasks.length === 0 ? (
        <div className="flex items-center gap-2 px-5 py-6 text-sm text-muted-foreground">
          <CheckCircle2 className="size-4 text-success" aria-hidden />
          Niets dat nu aandacht vraagt. Goed bezig.
        </div>
      ) : (
        <>
          {/* De meest urgente taak als held-kaart (de ranking komt al gesorteerd binnen),
              de rest als compacte rijen — antwoord op "wat nu?" zonder te scannen. */}
          {shown[0] ? <TaskHero task={shown[0]} drawerData={drawerData} /> : null}
          {shown.length > 1 ? <TaskRows tasks={shown.slice(1)} drawerData={drawerData} /> : null}
          {rest > 0 ? (
            <Link
              href="/acties"
              className="focus-ring flex items-center justify-between gap-3 border-t border-border px-5 py-3 text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            >
              <span>
                Nog {rest} {rest === 1 ? "actie" : "acties"} in het Actiecentrum
              </span>
              <ArrowRight className="size-4 shrink-0" aria-hidden />
            </Link>
          ) : null}
        </>
      )}
    </Card>
  );
}
