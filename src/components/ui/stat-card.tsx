import Link from "next/link";

/**
 * KPI-tegel: groot tabular-nums cijfer met label en optionele subtekst. Gedeelde primitive zodat
 * statistieken-/inzicht-pagina's geen eigen variant kopiëren (DESIGN.md: geen ad-hoc varianten).
 */
export function StatCard({
  label,
  value,
  sub,
  href,
  tone = "default",
}: {
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  const toneClass =
    tone === "warning"
      ? "text-warning"
      : tone === "danger"
        ? "text-danger"
        : tone === "success"
          ? "text-success"
          : "text-foreground";

  const inner = (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="focus-ring block rounded-lg transition-colors hover:opacity-80">
        {inner}
      </Link>
    );
  }
  return inner;
}
