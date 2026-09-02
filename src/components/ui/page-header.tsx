import { type ReactNode } from "react";
import { getTranslator } from "@/lib/i18n/server";

// Canonieke paginakop (DESIGN.md §5): titel + optionele subtitel, met een optionele actie rechts.
// Eén bron voor de ~38 pagina's die nu elk hun eigen <header><h1><p> herhalen — consistente
// typografie, spacing en landmark. `description`/`title` accepteren ReactNode (voor inline-expressies).
// Server-component: vertaalt automatisch een string-titel/-subtitel (ReactNode-waarden passeren
// onveranderd) zodat de paginakoppen meebewegen met de taalkeuze zonder elke pagina te wijzigen.
// LET OP: async servercomponent — niet bruikbaar vanuit een "use client"-component; geef daar
// een eigen <header> of til de PageHeader naar de dichtstbijzijnde server-parent.
export async function PageHeader({
  title,
  description,
  action,
  eyebrow,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  /** Sectieregel boven de titel: de gewone naam van de sectie waar deze pagina onder valt,
      bv. "Administratie" op /facturen of "Mijn profiel" op /certificaten — een breadcrumb, geen
      motief. Laat 'm weg zodra de h1 hetzelfde al zegt. Mono, kapitaal, merk-groen. */
  eyebrow?: ReactNode;
}) {
  const { t } = await getTranslator();
  const tr = (v: ReactNode): ReactNode => (typeof v === "string" ? t(v) : v);
  const heading = (
    <>
      {eyebrow ? (
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.13em] text-primary">
          {tr(eyebrow)}
        </p>
      ) : null}
      <h1 className="break-words font-display text-2xl font-semibold tracking-tight">
        {tr(title)}
      </h1>
      {description ? <p className="text-sm text-muted-foreground">{tr(description)}</p> : null}
    </>
  );

  if (!action) return <header className="space-y-1">{heading}</header>;

  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 space-y-1">{heading}</div>
      <div className="shrink-0">{action}</div>
    </header>
  );
}
