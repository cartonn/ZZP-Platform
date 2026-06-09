import { type ReactNode } from "react";

// Canonieke paginakop (DESIGN.md §5): titel + optionele subtitel, met een optionele actie rechts.
// Eén bron voor de ~38 pagina's die nu elk hun eigen <header><h1><p> herhalen — consistente
// typografie, spacing en landmark. `description`/`title` accepteren ReactNode (voor inline-expressies).
export function PageHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  const heading = (
    <>
      <h1 className="break-words text-xl font-semibold tracking-tight">{title}</h1>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
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
