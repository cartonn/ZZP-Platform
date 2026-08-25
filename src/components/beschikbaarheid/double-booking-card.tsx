import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { type CollaborationOverlap } from "@/lib/collaboration-overlap";
import { formatDateShortNl } from "@/lib/format-date";

const fmt = (d: Date) => formatDateShortNl(d);

/**
 * Waarschuwt de ZZP'er zodra twee eigen lopende/voorgestelde samenwerkingen qua looptijd overlappen —
 * een dubbelboeking die anders pas als no-show opvalt. Rendert niets zonder overlap (rustige pagina).
 */
export function DoubleBookingCard({ overlaps }: { overlaps: readonly CollaborationOverlap[] }) {
  if (overlaps.length === 0) return null;

  return (
    <section className="rounded-lg border border-danger/30 bg-danger/5 p-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-4 shrink-0 text-danger" aria-hidden />
        <h2 className="text-sm font-medium text-foreground">
          {overlaps.length === 1
            ? "Twee samenwerkingen overlappen — je kunt er maar één draaien"
            : `${overlaps.length} keer overlappen twee samenwerkingen — je kunt er maar één draaien`}
        </h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Plan je op twee opdrachten tegelijk, dan valt er gegarandeerd één om. Los dit op tijd op:
        stem af met een opdrachtgever of trek je terug.
      </p>
      <ul className="mt-3 space-y-2">
        {overlaps.map((o) => (
          <li
            key={`${o.aId}-${o.bId}`}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm"
          >
            <span className="block font-medium">
              Botst {fmt(o.overlapStart)} — {fmt(o.overlapEnd)}
            </span>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <Link
                href={`/samenwerkingen/${o.aId}`}
                className="focus-ring truncate rounded underline-offset-2 hover:underline"
              >
                {o.aClient} · {o.aTitle}
              </Link>
              <span aria-hidden>×</span>
              <Link
                href={`/samenwerkingen/${o.bId}`}
                className="focus-ring truncate rounded underline-offset-2 hover:underline"
              >
                {o.bClient} · {o.bTitle}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
