import { type DbaMitigationPlan } from "@/lib/dba";

/**
 * Toont de concrete "next best action" van de DBA-monitor: de kleinste set indicator-wijzigingen
 * die het risico naar het eerstvolgende lagere niveau brengt (berekend door `dbaMitigations`).
 * Rendert niets als er geen plan is (al LAAG, of een louter duur-gedreven risico dat de
 * hefboom-indicatoren niet kunnen verlagen).
 *
 * Puur presentatie — geen eigen logica, geen client-hooks — zodat zowel het opdracht-formulier
 * (live, terwijl de opdrachtgever kenmerken aanvinkt) als de opgeslagen opdracht-detailpagina
 * (server-side herberekend uit de vastgelegde indicatoren) exact dezelfde stappen tonen.
 */
export function DbaMitigationCard({
  plan,
  className,
}: {
  plan: DbaMitigationPlan | null;
  className?: string;
}) {
  if (!plan) return null;
  return (
    <div
      className={`rounded-md border border-border bg-background p-2.5${className ? ` ${className}` : ""}`}
    >
      <p className="text-xs font-medium">Zo verlaag je het risico naar {plan.targetLevel}:</p>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
        {plan.changes.map((c) => (
          <li key={c.factor}>{c.action}</li>
        ))}
      </ul>
    </div>
  );
}
