import Link from "next/link";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ringGeometry, barHeights, sharePct } from "@/lib/bi-geometry";
import { donutSegments } from "@/lib/donut-geometry";
import { cn } from "@/lib/utils";

/**
 * BI-kit — gedeelde, puur presentationele primitives voor de inzicht-/statistiekenschermen,
 * gebouwd op semantische tokens (DESIGN.md: geen hex, geen gradients, geen kaart-in-kaart).
 * Custom SVG, geen externe charting-library — in lijn met de bestaande `Sparkline`.
 */

export type BiTone = "default" | "accent" | "success" | "warning" | "danger";

const TONE_TEXT: Record<BiTone, string> = {
  default: "text-foreground",
  accent: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

const TONE_BAR: Record<BiTone, string> = {
  default: "bg-muted-foreground",
  accent: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

type IconType = React.ComponentType<{ className?: string }>;

/** Sectiekop met icoon + titel en een optionele rechter-meta (badge of link). */
export function BiSection({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon: IconType;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Icon className="size-4 text-muted-foreground" aria-hidden />
          <span>{title}</span>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/**
 * Trend-badge: groene op-, rode neer- of grijze vlakke pijl met percentage.
 * `null` (geen vergelijkbare vorige periode) toont een neutrale streep.
 */
export function TrendBadge({
  deltaPct,
  className,
}: {
  deltaPct: number | null;
  className?: string;
}) {
  if (deltaPct === null) {
    return (
      <Badge variant="muted" className={cn("gap-0.5", className)}>
        <Minus className="size-3" aria-hidden />—
      </Badge>
    );
  }
  if (deltaPct > 0) {
    return (
      <Badge variant="success" className={cn("gap-0.5", className)}>
        <TrendingUp className="size-3" aria-hidden />+{deltaPct}%
      </Badge>
    );
  }
  if (deltaPct < 0) {
    return (
      <Badge variant="danger" className={cn("gap-0.5", className)}>
        <TrendingDown className="size-3" aria-hidden />
        {deltaPct}%
      </Badge>
    );
  }
  return (
    <Badge variant="muted" className={cn("gap-0.5", className)}>
      <Minus className="size-3" aria-hidden />
      0%
    </Badge>
  );
}

/**
 * KPI-tegel met BI-uitstraling: icoon-chip linksboven, optionele badge rechtsboven, groot
 * mono-cijfer, label en subtekst. Gedeelde primitive — pagina's kopiëren geen eigen variant.
 */
export function KpiTile({
  icon: Icon,
  label,
  value,
  sub,
  tone = "default",
  href,
  badge,
}: {
  icon?: IconType;
  label: string;
  value: string | number;
  sub?: string;
  tone?: BiTone;
  href?: string;
  badge?: React.ReactNode;
}) {
  const inner = (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-2">
        {Icon ? (
          <span className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Icon className="size-4" aria-hidden />
          </span>
        ) : (
          <span />
        )}
        {badge}
      </div>
      <p
        className={cn(
          "mt-3 font-mono text-2xl font-semibold tabular-nums tracking-tight",
          TONE_TEXT[tone],
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-sm font-medium">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
  if (href) {
    return (
      <Link
        href={href}
        className="focus-ring block h-full rounded-lg transition-colors hover:opacity-80"
      >
        {inner}
      </Link>
    );
  }
  return inner;
}

/**
 * Gauge-ring voor een percentage (vulgraad, win-rate, compliance, …). Toont het getal in
 * het midden; de boog krijgt de tone-kleur, de rest van de ring is de border-token.
 */
export function GaugeRing({
  value,
  label,
  sub,
  tone = "accent",
  size = 132,
  bare = false,
}: {
  value: number;
  label: string;
  sub?: string;
  tone?: BiTone;
  size?: number;
  /** Zonder eigen kaart-omhulsel — voor inbedding in een `BiWidget` (geen kaart-in-kaart). */
  bare?: boolean;
}) {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const { dash, gap, pct } = ringGeometry(value, radius);
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3",
        !bare && "rounded-lg border border-border bg-card p-5",
      )}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className={TONE_TEXT[tone]}
          role="img"
          aria-label={`${label}: ${pct}%`}
        >
          <circle
            cx={cx}
            cy={cx}
            r={radius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={stroke}
          />
          {pct > 0 && (
            <circle
              cx={cx}
              cy={cx}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${gap}`}
              transform={`rotate(-90 ${cx} ${cx})`}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-mono text-2xl font-semibold tabular-nums", TONE_TEXT[tone])}>
            {pct}%
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">{label}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

export interface BarPoint {
  key: string;
  label: string;
  value: number;
}

/**
 * Verticaal staafdiagram (custom SVG-vrij, pure div-hoogtes) voor een korte reeks zoals
 * omzet per maand. De laatste staaf (huidige periode) is vol gekleurd, de rest gedempt;
 * onder elke staaf het label en de waarde.
 */
export function BarSeries({
  data,
  height = 132,
  formatValue,
  tone = "accent",
  label,
}: {
  data: BarPoint[];
  height?: number;
  formatValue: (n: number) => string;
  tone?: BiTone;
  label?: string;
}) {
  const heights = barHeights(
    data.map((d) => d.value),
    height,
  );
  const lastIdx = data.length - 1;
  return (
    <div
      role="img"
      aria-label={label}
      className="flex items-end gap-2"
      style={{ minHeight: height }}
    >
      {data.map((d, i) => (
        <div key={d.key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div className="flex w-full flex-1 items-end justify-center" style={{ height }}>
            <div
              className={cn(
                "w-full max-w-[2.5rem] rounded-t",
                i === lastIdx ? TONE_BAR[tone] : "bg-primary/30",
              )}
              style={{ height: Math.max(heights[i] ?? 0, 1) }}
              title={`${d.label}: ${formatValue(d.value)}`}
            />
          </div>
          <div className="min-w-0 space-y-0.5 text-center">
            <p className="truncate text-[11px] uppercase text-muted-foreground">{d.label}</p>
            <p className="truncate font-mono text-[11px] tabular-nums">{formatValue(d.value)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export interface DistributionItem {
  label: string;
  value: number;
  tone?: BiTone;
}

/**
 * Horizontale verdeelbalken voor een statusverdeling (bv. samenwerkingen per status). Per
 * regel: label, waarde (+ aandeel als `total` is gegeven) en een gekleurde balk op rato.
 */
export function DistributionBars({
  items,
  total,
  formatValue = (n) => String(n),
}: {
  items: DistributionItem[];
  total?: number;
  formatValue?: (n: number) => string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-2.5">
      {items.map((it) => (
        <div key={it.label} className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">{it.label}</span>
            <span className="font-mono tabular-nums">
              {formatValue(it.value)}
              {total != null && total > 0 ? ` · ${sharePct(it.value, total)}%` : ""}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full", TONE_BAR[it.tone ?? "accent"])}
              style={{
                width: `${Math.max(it.value > 0 ? 3 : 0, Math.round((it.value / max) * 100))}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export interface DonutDatum {
  label: string;
  value: number;
  tone?: BiTone;
}

/**
 * Segment-donut met centertotaal en legenda — de status-verdeling in één ring. Lege segmenten
 * (waarde 0) worden niet getekend maar blijven wél in de legenda staan. Geometrie in
 * `donut-geometry.ts`; hier alleen de SVG + legenda.
 */
export function DonutChart({
  data,
  centerLabel,
  size = 168,
}: {
  data: DonutDatum[];
  centerLabel?: string;
  size?: number;
}) {
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const circumference = 2 * Math.PI * radius;
  const { total, segments } = donutSegments(
    data.map((d) => d.value),
    circumference,
  );
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
          <circle
            cx={cx}
            cy={cx}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={stroke}
          />
          {segments.map((s, i) =>
            s.dash > 0 ? (
              <circle
                key={i}
                cx={cx}
                cy={cx}
                r={radius}
                fill="none"
                className={TONE_TEXT[data[i]?.tone ?? "accent"]}
                stroke="currentColor"
                strokeWidth={stroke}
                strokeDasharray={`${s.dash} ${s.gap}`}
                transform={`rotate(${s.rotation} ${cx} ${cx})`}
              />
            ) : null,
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-3xl font-semibold tabular-nums">{total}</span>
          {centerLabel && <span className="text-xs text-muted-foreground">{centerLabel}</span>}
        </div>
      </div>
      <ul className="w-full space-y-2">
        {data.map((d) => (
          <li key={d.label} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className={cn("size-2.5 shrink-0 rounded-full", TONE_BAR[d.tone ?? "accent"])}
                aria-hidden
              />
              <span className="truncate text-muted-foreground">{d.label}</span>
            </span>
            <span className="shrink-0 font-mono tabular-nums">
              {d.value}
              {total > 0 ? ` · ${sharePct(d.value, total)}%` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Label/waarde-lijst binnen een widget-kaart (geen geneste kaarten — DESIGN.md). Elke regel is
 * optioneel een link; de waarde staat mono-rechts en kan een tone krijgen.
 */
export function BiStatList({
  items,
}: {
  items: { label: string; value: string | number; sub?: string; href?: string; tone?: BiTone }[];
}) {
  return (
    <ul className="-my-1 divide-y divide-border">
      {items.map((it) => {
        const row = (
          <div className="flex items-center justify-between gap-2 py-2.5">
            <span className="min-w-0">
              <span className="block truncate text-sm">{it.label}</span>
              {it.sub && (
                <span className="block truncate text-xs text-muted-foreground">{it.sub}</span>
              )}
            </span>
            <span
              className={cn(
                "shrink-0 font-mono text-sm font-medium tabular-nums",
                TONE_TEXT[it.tone ?? "default"],
              )}
            >
              {it.value}
            </span>
          </div>
        );
        return (
          <li key={it.label}>
            {it.href ? (
              <Link href={it.href} className="focus-ring -mx-1 block rounded px-1 hover:opacity-80">
                {row}
              </Link>
            ) : (
              row
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Widget-kaart: witte kaart met een titelregel (+ optionele actie/meta rechts) en de inhoud
 * eronder. Geeft de inzicht-schermen de dashboard-uitstraling van losse panelen.
 */
export function BiWidget({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium">{title}</h2>
          {action}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
