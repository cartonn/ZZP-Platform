import { type ReactNode } from "react";
import { getTranslator } from "@/lib/i18n/server";

// Canonieke paginakop (DESIGN.md §5): titel + optionele subtitel, met een optionele actie rechts.
// Eén bron voor de ~38 pagina's die nu elk hun eigen <header><h1><p> herhalen — consistente
// typografie, spacing en landmark. `description`/`title` accepteren ReactNode (voor inline-expressies).
// Server-component: vertaalt automatisch een string-titel/-subtitel (ReactNode-waarden passeren
// onveranderd) zodat de paginakoppen meebewegen met de taalkeuze zonder elke pagina te wijzigen.
export async function PageHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  const { t } = await getTranslator();
  const tr = (v: ReactNode): ReactNode => (typeof v === "string" ? t(v) : v);
  const heading = (
    <>
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
