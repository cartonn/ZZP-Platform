"use client";

// Concept 87 — "Kader" · fintech-ops canvas in de geest van Mercury / Ramp / Stripe.
// Licht en luchtig: het saldo/omzet als held (groot bovenaan), grote afgeronde area- en
// staafgrafieken (deterministische SVG, geen random), factuur- en uitgave-kaarten met veel
// rust eromheen. Financiële helderheid, geen handelsterminal-dichtheid. Facturen als
// transacties-tabel met status-pills, tabulaire mono-cijfers.
// Palet: bg #f7f7fb, fg #1a1a2e, accent #635bff (Stripe-indigo).
// Fonts: --font-lab-jakarta (display/body) + --font-lab-mono (cijfers).

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Compass,
  FileText,
  ShieldCheck,
  ListChecks,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Search,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Plus,
  MapPin,
  Wallet,
  TrendingUp,
  CircleDollarSign,
  Send,
  RotateCw,
  Sparkle,
  Building2,
} from "lucide-react";
import {
  SCREENS,
  KPIS,
  OPDRACHTEN,
  CREDENTIALS,
  ACTIES,
  FACTUREN,
  PROFIEL,
  BERICHTEN,
  DOCUMENTEN,
  NAV,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

/* ---------- Palet & typografie ---------- */

const C = {
  bg: "#f7f7fb",
  bgAlt: "#eeeef4",
  surface: "#ffffff",
  fg: "#1a1a2e",
  muted: "#65657a",
  faint: "#9797ab",
  accent: "#635bff",
  accentDeep: "#4b45d4",
  accentSoft: "#eeecff",
  line: "#eaeaf1",
  lineSoft: "#f1f1f6",
  pos: "#0f7a56",
  posSoft: "#e2f4ec",
  warn: "#b45309",
  warnSoft: "#fdf0e0",
  danger: "#c0362c",
  dangerSoft: "#fbe9e6",
};

const display = { fontFamily: "var(--font-lab-jakarta)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

const CARD = "0 1px 2px rgba(26,26,46,0.04), 0 8px 28px -18px rgba(26,26,46,0.18)";
const CARD_HOVER = "0 2px 6px rgba(26,26,46,0.06), 0 18px 44px -20px rgba(99,91,255,0.28)";

/* ---------- Icoon per scherm ---------- */

const SCREEN_ICON: Record<ScreenKey, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  marktplaats: Compass,
  opdracht: FileText,
  verificatie: ShieldCheck,
  documenten: FileText,
  facturen: Receipt,
  berichten: Send,
  acties: ListChecks,
};

/* ---------- Status → betekenis (label + icoon + kleur, nooit kleur-alleen) ---------- */

type CredMeta = { label: string; fg: string; bg: string; Icon: typeof ShieldCheck };

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.pos, bg: C.posSoft, Icon: ShieldCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.accent, bg: C.accentSoft, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", fg: C.warn, bg: C.warnSoft, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.danger, bg: C.dangerSoft, Icon: XCircle };
  }
}

const FACTUUR_KLEUR: Record<string, { fg: string; bg: string }> = {
  Betaald: { fg: C.pos, bg: C.posSoft },
  Openstaand: { fg: C.warn, bg: C.warnSoft },
  Concept: { fg: C.faint, bg: C.lineSoft },
};

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Deterministische grafiek-data ---------- */

const MAANDEN = [
  "jul",
  "aug",
  "sep",
  "okt",
  "nov",
  "dec",
  "jan",
  "feb",
  "mrt",
  "apr",
  "mei",
  "jun",
];
const OMZET_REEKS = [4.2, 4.8, 4.5, 5.6, 6.1, 5.9, 6.8, 7.2, 6.9, 7.6, 8.0, 8.24];
const FACTUUR_REEKS = [3.1, 2.4, 3.8, 2.9, 4.2, 3.4, 4.8, 3.9, 4.5, 5.2, 4.1, 5.6];

/* ---------- Kleine bouwstenen ---------- */

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]"
      style={{ ...display, color: C.accent }}
    >
      <Sparkle size={12} strokeWidth={2.4} aria-hidden="true" />
      {children}
    </span>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="mt-2 text-[26px] font-bold leading-[1.08] tracking-[-0.02em] sm:text-[32px]"
      style={{ ...display, color: C.fg }}
    >
      {children}
    </h1>
  );
}

function Card({
  children,
  className = "",
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section";
}) {
  const Tag = as;
  return (
    <Tag
      className={`rounded-2xl ${className}`}
      style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: CARD }}
    >
      {children}
    </Tag>
  );
}

function StatusPill({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
      style={{ ...display, color: m.fg, background: m.bg }}
    >
      <Icon size={12.5} strokeWidth={2.6} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Match-ring — indigo arc met tabulair mono-cijfer.
function MatchRing({ value, size = 46 }: { value: number; size?: number }) {
  const stroke = 3.4;
  const r = size / 2 - stroke;
  const circ = 2 * Math.PI * r;
  const strong = value >= 90;
  const color = strong ? C.accent : value >= 85 ? C.accentDeep : C.muted;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.lineSoft}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 100)}
        />
      </svg>
      <span className="text-[12.5px] font-semibold tabular-nums" style={{ ...mono, color }}>
        {value}
      </span>
    </span>
  );
}

// Compacte sparkline (zachte lijn + eindpunt).
function Spark({ data, color = C.accent }: { data: number[]; color?: string }) {
  const w = 84;
  const h = 26;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last && <circle cx={last[0]} cy={last[1]} r="2.2" fill={color} />}
    </svg>
  );
}

/* ---------- Signatuur: grote afgeronde area-grafiek ---------- */

function pt(arr: readonly (readonly [number, number])[], i: number): readonly [number, number] {
  return arr[i] ?? arr[Math.max(0, Math.min(arr.length - 1, i))] ?? [0, 0];
}

function smoothPath(points: readonly (readonly [number, number])[]): string {
  if (points.length < 2) return "";
  const first = points[0] ?? [0, 0];
  let d = `M ${first[0].toFixed(2)} ${first[1].toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = pt(points, i - 1);
    const p1 = pt(points, i);
    const p2 = pt(points, i + 1);
    const p3 = pt(points, i + 2);
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d;
}

function AreaChart({ data, labels }: { data: number[]; labels: string[] }) {
  const w = 720;
  const h = 220;
  const padX = 8;
  const padTop = 16;
  const padBottom = 28;
  const min = Math.min(...data) * 0.9;
  const max = Math.max(...data) * 1.06;
  const span = max - min || 1;
  const points = data.map((v, i) => {
    const x = padX + (i / (data.length - 1)) * (w - padX * 2);
    const y = padTop + (1 - (v - min) / span) * (h - padTop - padBottom);
    return [x, y] as const;
  });
  const linePath = smoothPath(points);
  const lastPoint = points[points.length - 1] ?? [w - padX, padTop];
  const areaPath = `${linePath} L ${lastPoint[0].toFixed(2)} ${h - padBottom} L ${padX} ${h - padBottom} Z`;
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-auto w-full"
        role="img"
        aria-label="Omzet per maand, laatste twaalf maanden — oplopende trend"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="kader87-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(99,91,255,0.20)" />
            <stop offset="100%" stopColor="rgba(99,91,255,0)" />
          </linearGradient>
        </defs>
        {gridLines.map((g) => {
          const y = padTop + g * (h - padTop - padBottom);
          return (
            <line
              key={g}
              x1={padX}
              y1={y}
              x2={w - padX}
              y2={y}
              stroke={C.lineSoft}
              strokeWidth="1"
            />
          );
        })}
        <path d={areaPath} fill="url(#kader87-area)" />
        <path
          d={linePath}
          fill="none"
          stroke={C.accent}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) =>
          i === points.length - 1 ? (
            <g key={i}>
              <circle cx={p[0]} cy={p[1]} r="6" fill="rgba(99,91,255,0.16)" />
              <circle
                cx={p[0]}
                cy={p[1]}
                r="3.4"
                fill={C.accent}
                stroke={C.surface}
                strokeWidth="1.8"
              />
            </g>
          ) : null,
        )}
        {labels.map((l, i) => {
          if (i % 2 !== 0 && i !== labels.length - 1) return null;
          const x = padX + (i / (labels.length - 1)) * (w - padX * 2);
          return (
            <text
              key={l + i}
              x={x}
              y={h - 8}
              textAnchor={i === 0 ? "start" : i === labels.length - 1 ? "end" : "middle"}
              style={{ ...mono }}
              fontSize="12"
              fill={C.faint}
            >
              {l}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// Afgeronde staafgrafiek — gefactureerd per maand.
function BarChart({ data, labels }: { data: number[]; labels: string[] }) {
  const w = 720;
  const h = 200;
  const padTop = 14;
  const padBottom = 26;
  const max = Math.max(...data) * 1.08 || 1;
  const slot = w / data.length;
  const bw = Math.min(30, slot * 0.5);
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-auto w-full"
      role="img"
      aria-label="Gefactureerd bedrag per maand"
      preserveAspectRatio="none"
    >
      {data.map((v, i) => {
        const x = i * slot + slot / 2 - bw / 2;
        const bh = (v / max) * (h - padTop - padBottom);
        const y = h - padBottom - bh;
        const strong = i >= data.length - 3;
        return (
          <g key={i}>
            <rect
              x={x}
              y={padTop}
              width={bw}
              height={h - padTop - padBottom}
              rx="7"
              fill={C.lineSoft}
            />
            <rect
              x={x}
              y={y}
              width={bw}
              height={Math.max(bh, 3)}
              rx="7"
              fill={strong ? C.accent : "#c8c5f5"}
            />
          </g>
        );
      })}
      {labels.map((l, i) => {
        if (i % 2 !== 0 && i !== labels.length - 1) return null;
        const x = i * slot + slot / 2;
        return (
          <text
            key={l + i}
            x={x}
            y={h - 8}
            textAnchor="middle"
            style={{ ...mono }}
            fontSize="12"
            fill={C.faint}
          >
            {l}
          </text>
        );
      })}
    </svg>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept87() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...display, color: C.fg, background: C.bg }}
    >
      <div className="flex min-h-[680px] flex-col md:flex-row">
        {/* Zijbalk */}
        <aside
          className="shrink-0 md:w-[248px]"
          style={{ background: C.surface, borderRight: `1px solid ${C.line}` }}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2.5 px-5 py-5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: C.accent }}
                aria-hidden="true"
              >
                <Wallet size={18} strokeWidth={2.4} color="#fff" />
              </span>
              <div className="leading-tight">
                <div className="text-[16px] font-bold tracking-[-0.01em]" style={{ color: C.fg }}>
                  Kader
                </div>
                <div className="text-[10.5px] font-medium" style={{ color: C.faint }}>
                  Financiën &amp; werk
                </div>
              </div>
            </div>

            <nav
              className="flex flex-row gap-1 overflow-x-auto px-3 pb-2 md:flex-1 md:flex-col md:pb-0"
              aria-label="Hoofdnavigatie"
            >
              {SCREENS.map((s) => {
                const on = s.key === screen;
                const Icon = SCREEN_ICON[s.key];
                return (
                  <button
                    key={s.key}
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className="flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 md:w-full"
                    style={{
                      color: on ? C.accent : C.muted,
                      background: on ? C.accentSoft : "transparent",
                      // @ts-expect-error CSS custom prop for ring color
                      "--tw-ring-color": C.accent,
                    }}
                  >
                    <Icon size={17} strokeWidth={on ? 2.4 : 2} aria-hidden="true" />
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto p-3">
              <div
                className="flex items-center gap-3 rounded-xl p-3"
                style={{ background: C.bg, border: `1px solid ${C.line}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                  style={{ background: C.accent }}
                  aria-hidden="true"
                >
                  {PROFIEL.initialen}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold" style={{ color: C.fg }}>
                    {PROFIEL.naam}
                  </div>
                  <div
                    className="flex items-center gap-1 text-[10.5px] font-semibold"
                    style={{ color: C.pos }}
                  >
                    <ShieldCheck size={11} strokeWidth={2.6} aria-hidden="true" /> {PROFIEL.trust}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-5 sm:p-8">
            {screen === "dashboard" && <Dashboard onOpen={open} onGo={setScreen} />}
            {screen === "marktplaats" && (
              <Marktplaats activeId={activeId} onSelect={setActiveId} onOpen={open} />
            )}
            {screen === "opdracht" && <OpdrachtDetail opdracht={active} onGo={setScreen} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties onGo={setScreen} />}
            {screen === "facturen" && <Facturen />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */

function Dashboard({
  onOpen,
  onGo,
}: {
  onOpen: (id?: string) => void;
  onGo: (k: ScreenKey) => void;
}) {
  const warn = ACTIES.find((a) => a.urgentie === "warning");
  const omzet = KPIS.find((k) => k.label.startsWith("Omzet"));
  const [feed, setFeed] = useState<"loading" | "error" | "ok">("loading");
  useEffect(() => {
    const t = window.setTimeout(() => setFeed("error"), 650);
    return () => window.clearTimeout(t);
  }, []);
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Overzicht</Kicker>
          <Title>Goedemorgen, {PROFIEL.naam.split(" ")[0]}</Title>
          <p className="mt-2 text-[13.5px]" style={{ color: C.muted }}>
            {PROFIEL.rol} · {PROFIEL.plaats}
          </p>
        </div>
        <button
          onClick={() => onGo("facturen")}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.accent, boxShadow: CARD, ["--tw-ring-color" as string]: C.accent }}
        >
          <Plus size={15} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
        </button>
      </header>

      {warn && (
        <div
          className="flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center"
          style={{ background: C.warnSoft, border: `1px solid ${C.warn}33` }}
          role="alert"
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center self-start rounded-lg"
            style={{ background: "#fff" }}
          >
            <AlertTriangle size={17} strokeWidth={2.4} color={C.warn} aria-hidden="true" />
          </span>
          <p className="text-[13.5px] leading-snug" style={{ color: C.fg }}>
            <span className="font-semibold">{warn.titel}.</span>{" "}
            <span style={{ color: C.muted }}>{warn.detail}</span>
          </p>
          <button
            onClick={() => onGo("verificatie")}
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.warn, ["--tw-ring-color" as string]: C.warn }}
          >
            {warn.cta} <ArrowRight size={13} strokeWidth={2.8} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Held: omzet + grote area-grafiek */}
      <Card className="overflow-hidden">
        <div
          className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6"
          style={{ borderColor: C.line }}
        >
          <div>
            <p
              className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.faint }}
            >
              <CircleDollarSign size={14} strokeWidth={2.4} aria-hidden="true" /> Omzet deze maand
            </p>
            <p
              className="mt-2 text-[44px] font-bold tabular-nums leading-none tracking-[-0.02em] sm:text-[52px]"
              style={{ ...mono, color: C.fg }}
            >
              {omzet?.value ?? "€ 8.240"}
            </p>
            <p
              className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold"
              style={{ color: C.pos }}
            >
              <TrendingUp size={15} strokeWidth={2.4} aria-hidden="true" /> {omzet?.trend ?? "+12%"}{" "}
              t.o.v. vorige maand
            </p>
          </div>
          <div className="flex gap-2">
            {["3M", "6M", "12M"].map((t, i) => (
              <span
                key={t}
                className="rounded-lg px-3 py-1.5 text-[12px] font-semibold tabular-nums"
                style={{
                  ...mono,
                  color: i === 2 ? C.accent : C.faint,
                  background: i === 2 ? C.accentSoft : C.bg,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <AreaChart data={OMZET_REEKS} labels={MAANDEN} />
        </div>
      </Card>

      {/* KPI-rij */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} className="flex flex-col justify-between p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11.5px] font-semibold leading-tight" style={{ color: C.muted }}>
                {k.label}
              </p>
              <span
                className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
                style={{
                  ...mono,
                  color: k.up ? C.pos : C.warn,
                  background: k.up ? C.posSoft : C.warnSoft,
                }}
              >
                {k.up ? (
                  <ArrowUpRight size={12} strokeWidth={2.8} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={12} strokeWidth={2.8} aria-hidden="true" />
                )}
                {k.trend}
              </span>
            </div>
            <p
              className="mt-3 text-[26px] font-bold tabular-nums leading-none tracking-[-0.01em]"
              style={{ ...mono, color: C.fg }}
            >
              {k.value}
            </p>
            <div className="mt-2">
              <Spark data={k.spark} color={k.up ? C.accent : C.warn} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
        {/* Recente transacties */}
        <Card>
          <div
            className="flex items-center justify-between border-b p-4 sm:p-5"
            style={{ borderColor: C.line }}
          >
            <h3 className="flex items-center gap-2 text-[15px] font-bold" style={{ color: C.fg }}>
              <Receipt size={16} strokeWidth={2.2} color={C.accent} aria-hidden="true" /> Recente
              facturen
            </h3>
            <button
              onClick={() => onGo("facturen")}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-semibold transition-colors hover:bg-[#eeecff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ color: C.accent, ["--tw-ring-color" as string]: C.accent }}
            >
              Alles <ArrowRight size={12} strokeWidth={2.8} aria-hidden="true" />
            </button>
          </div>
          <ul>
            {FACTUREN.slice(0, 4).map((f, i) => {
              const kl = FACTUUR_KLEUR[f.status] ?? { fg: C.faint, bg: C.lineSoft };
              return (
                <li
                  key={f.nr}
                  className="flex items-center gap-3 p-4"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: C.bg }}
                    aria-hidden="true"
                  >
                    <Building2 size={16} strokeWidth={2.2} color={C.muted} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold" style={{ color: C.fg }}>
                      {f.klant}
                    </p>
                    <p className="text-[11.5px] tabular-nums" style={{ ...mono, color: C.faint }}>
                      {f.nr} · {f.datum}
                    </p>
                  </div>
                  <span
                    className="text-[14px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.fg }}
                  >
                    {f.bedrag}
                  </span>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{ ...display, color: kl.fg, background: kl.bg }}
                  >
                    {f.status}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="space-y-5">
          {/* Beste matches */}
          <Card>
            <div
              className="flex items-center justify-between border-b p-4"
              style={{ borderColor: C.line }}
            >
              <h3 className="text-[15px] font-bold" style={{ color: C.fg }}>
                Beste matches
              </h3>
              <button
                onClick={() => onGo("marktplaats")}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-semibold transition-colors hover:bg-[#eeecff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ color: C.accent, ["--tw-ring-color" as string]: C.accent }}
              >
                Bekijk <ArrowRight size={12} strokeWidth={2.8} aria-hidden="true" />
              </button>
            </div>
            <ul className="p-2">
              {OPDRACHTEN.map((o) => (
                <li key={o.id}>
                  <button
                    onClick={() => onOpen(o.id)}
                    className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-[#f7f7fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-offset-0"
                    style={{ ["--tw-ring-color" as string]: C.accent }}
                  >
                    <MatchRing value={o.match} />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[13px] font-semibold"
                        style={{ color: C.fg }}
                      >
                        {o.titel}
                      </span>
                      <span className="block truncate text-[11.5px]" style={{ color: C.muted }}>
                        {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <ArrowUpRight size={15} strokeWidth={2.2} color={C.faint} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          {/* Cashflow-feed — loading / error / ok */}
          <Card className="p-4">
            <h3 className="flex items-center gap-2 text-[14px] font-bold" style={{ color: C.fg }}>
              <TrendingUp size={15} strokeWidth={2.2} color={C.accent} aria-hidden="true" />{" "}
              Cashflow-signaal
            </h3>
            {feed === "loading" && (
              <div className="mt-3 space-y-2" role="status" aria-live="polite">
                <span className="sr-only">Signaal wordt geladen…</span>
                {[0, 1].map((i) => (
                  <span
                    key={i}
                    className="block h-3 animate-pulse rounded"
                    style={{ background: C.lineSoft, width: i === 0 ? "80%" : "58%" }}
                  />
                ))}
              </div>
            )}
            {feed === "error" && (
              <div
                className="mt-3 flex flex-col gap-2 rounded-xl p-3 sm:flex-row sm:items-center"
                style={{ background: C.dangerSoft, border: `1px solid ${C.danger}33` }}
                role="alert"
              >
                <XCircle size={16} strokeWidth={2.4} color={C.danger} aria-hidden="true" />
                <p className="flex-1 text-[12.5px]" style={{ color: C.fg }}>
                  Kon de cashflow-feed niet ophalen.
                </p>
                <button
                  onClick={() => setFeed("ok")}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ background: C.danger, ["--tw-ring-color" as string]: C.danger }}
                >
                  <RotateCw size={12} strokeWidth={2.8} aria-hidden="true" /> Opnieuw
                </button>
              </div>
            )}
            {feed === "ok" && (
              <p className="mt-3 flex items-center gap-2 text-[12.5px]" style={{ color: C.muted }}>
                <Check size={14} strokeWidth={2.8} color={C.pos} aria-hidden="true" /> Alles
                bijgewerkt — {ongelezen} ongelezen bericht{ongelezen === 1 ? "" : "en"}.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------- Marktplaats ---------- */

function Marktplaats({
  activeId,
  onSelect,
  onOpen,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  onOpen: (id?: string) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  const sel = filtered.find((o) => o.id === activeId) ?? filtered[0];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Kicker>Marktplaats</Kicker>
        <Title>Open opdrachten</Title>
      </div>

      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3"
        style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: CARD }}
      >
        <Search size={17} strokeWidth={2.2} color={C.accent} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#9797ab]"
          style={{ color: C.fg }}
        />
        <span
          className="shrink-0 text-[12px] font-semibold tabular-nums"
          style={{ ...mono, color: C.faint }}
        >
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: C.accentSoft }}
            aria-hidden="true"
          >
            <Compass size={24} strokeWidth={2} color={C.accent} />
          </span>
          <p className="mt-4 text-[18px] font-bold" style={{ color: C.fg }}>
            Geen opdrachten gevonden
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.muted }}>
            Geen opdracht past bij &quot;{q}&quot;. Pas je zoekterm aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.accent, ["--tw-ring-color" as string]: C.accent }}
          >
            Zoekopdracht wissen
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
          <div className="space-y-4">
            {filtered.map((o) => {
              const on = sel?.id === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => onSelect(o.id)}
                  aria-pressed={on}
                  className="w-full rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:p-5"
                  style={{
                    background: C.surface,
                    border: `1.5px solid ${on ? C.accent : C.line}`,
                    boxShadow: on ? CARD_HOVER : CARD,
                    ["--tw-ring-color" as string]: C.accent,
                  }}
                >
                  <div className="flex items-start gap-4">
                    <MatchRing value={o.match} size={52} />
                    <div className="min-w-0 flex-1">
                      <div
                        className="flex items-center gap-2 text-[11px] font-semibold tabular-nums"
                        style={{ ...mono, color: C.faint }}
                      >
                        <span>{o.id}</span>
                        {on && <span style={{ color: C.accent }}>· geselecteerd</span>}
                      </div>
                      <p
                        className="mt-0.5 truncate text-[15.5px] font-bold"
                        style={{ color: C.fg }}
                      >
                        {o.titel}
                      </p>
                      <p
                        className="mt-0.5 flex items-center gap-1 truncate text-[12.5px]"
                        style={{ color: C.muted }}
                      >
                        <MapPin size={12.5} strokeWidth={2.2} aria-hidden="true" />{" "}
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {o.redenen.plus.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                            style={{ color: C.pos, background: C.posSoft }}
                          >
                            <Check size={11} strokeWidth={3} aria-hidden="true" /> {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {sel && (
            <aside className="h-fit lg:sticky lg:top-4">
              <Card>
                <div
                  className="flex items-center justify-between border-b p-4"
                  style={{ borderColor: C.line }}
                >
                  <span
                    className="text-[12px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.accent }}
                  >
                    {sel.id}
                  </span>
                  <MatchRing value={sel.match} size={40} />
                </div>
                <div className="p-4 sm:p-5">
                  <p className="text-[17px] font-bold leading-snug" style={{ color: C.fg }}>
                    {sel.titel}
                  </p>
                  <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
                    {sel.opdrachtgever} · {sel.plaats}
                  </p>
                  <dl className="mt-4 grid grid-cols-2 gap-2.5 text-[13px]">
                    {[
                      { l: "Tarief", v: sel.tarief },
                      { l: "Omvang", v: sel.uren },
                      { l: "Start", v: sel.start },
                      { l: "Match", v: `${sel.match}%` },
                    ].map((m) => (
                      <div key={m.l} className="rounded-xl p-2.5" style={{ background: C.bg }}>
                        <dt
                          className="text-[10.5px] font-semibold uppercase tracking-[0.06em]"
                          style={{ color: C.faint }}
                        >
                          {m.l}
                        </dt>
                        <dd
                          className="mt-0.5 font-semibold tabular-nums"
                          style={{ ...mono, color: C.fg }}
                        >
                          {m.v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <button
                    onClick={() => onOpen(sel.id)}
                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{ background: C.accent, ["--tw-ring-color" as string]: C.accent }}
                  >
                    Open opdracht <ArrowRight size={14} strokeWidth={2.8} aria-hidden="true" />
                  </button>
                </div>
              </Card>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Opdracht-detail ---------- */

function OpdrachtDetail({ opdracht, onGo }: { opdracht: Opdracht; onGo: (k: ScreenKey) => void }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 800);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <button
        onClick={() => onGo("marktplaats")}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12.5px] font-semibold transition-colors hover:bg-[#eeecff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.accent, ["--tw-ring-color" as string]: C.accent }}
      >
        <ArrowRight size={13} strokeWidth={2.8} className="rotate-180" aria-hidden="true" /> Terug
        naar marktplaats
      </button>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div>
            <Kicker>{opdracht.id}</Kicker>
            <Title>{opdracht.titel}</Title>
            <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full px-2.5 py-0.5 text-[11.5px] font-medium"
                  style={{ color: C.muted, background: C.bg }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <MatchRing value={opdracht.match} size={72} />
        </div>
        <div className="border-t p-5 sm:p-6" style={{ borderColor: C.line }}>
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13.5px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:translate-y-0 disabled:opacity-90"
            style={{
              background: state === "sent" ? C.pos : C.accent,
              ["--tw-ring-color" as string]: C.accent,
            }}
          >
            {state === "idle" && (
              <>
                <Send size={15} strokeWidth={2.4} aria-hidden="true" /> Reageer op opdracht
              </>
            )}
            {state === "sending" && "Versturen…"}
            {state === "sent" && (
              <>
                <Check size={15} strokeWidth={3} aria-hidden="true" /> Reactie verstuurd
              </>
            )}
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Card key={m.l} className="p-4">
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.06em]"
              style={{ color: C.faint }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[19px] font-bold tabular-nums"
              style={{ ...mono, color: C.fg }}
            >
              {m.v}
            </p>
          </Card>
        ))}
      </div>

      <Card>
        <div
          className="flex items-center gap-2 border-b p-4 sm:p-5"
          style={{ borderColor: C.line }}
        >
          <Sparkle size={16} strokeWidth={2.2} color={C.accent} aria-hidden="true" />
          <h3 className="text-[16px] font-bold" style={{ color: C.fg }}>
            Waarom deze match
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="p-5 sm:border-r" style={{ borderColor: C.line }}>
            <p
              className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.pos }}
            >
              <Check size={13} strokeWidth={3} aria-hidden="true" /> Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px]"
                  style={{ color: C.fg }}
                >
                  <span
                    className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.posSoft }}
                  >
                    <Check size={11} strokeWidth={3} color={C.pos} aria-hidden="true" />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t p-5 sm:border-t-0" style={{ borderColor: C.line }}>
            <p
              className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.warn }}
            >
              <AlertTriangle size={13} strokeWidth={2.6} aria-hidden="true" /> Aandachtspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px]"
                  style={{ color: C.muted }}
                >
                  <span
                    className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.warnSoft }}
                  >
                    <AlertTriangle size={11} strokeWidth={2.8} color={C.warn} aria-hidden="true" />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const stats = [
    { l: "Geverifieerd", v: `${verified}/${total}`, fg: C.pos, bg: C.posSoft, Icon: ShieldCheck },
    { l: "Verloopt binnenkort", v: "1", fg: C.warn, bg: C.warnSoft, Icon: AlertTriangle },
    { l: "In beoordeling", v: "1", fg: C.accent, bg: C.accentSoft, Icon: Clock },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Kicker>Verificatie</Kicker>
        <Title>Certificaten &amp; documenten</Title>
        <p className="mt-2 text-[13.5px]" style={{ color: C.muted }}>
          Je bewijsstukken worden veilig en privé bewaard.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.Icon;
          return (
            <Card key={s.l} className="flex items-center justify-between p-4">
              <div>
                <p className="text-[11.5px] font-semibold" style={{ color: C.muted }}>
                  {s.l}
                </p>
                <p
                  className="mt-1.5 text-[26px] font-bold tabular-nums"
                  style={{ ...mono, color: C.fg }}
                >
                  {s.v}
                </p>
              </div>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: s.bg }}
              >
                <Icon size={20} strokeWidth={2.2} color={s.fg} aria-hidden="true" />
              </span>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="border-b p-4 sm:p-5" style={{ borderColor: C.line }}>
          <h3 className="text-[15px] font-bold" style={{ color: C.fg }}>
            Je certificaten
          </h3>
        </div>
        {CREDENTIALS.map((c, i) => {
          const m = credMeta(c.status);
          const Icon = m.Icon;
          return (
            <div
              key={c.naam}
              className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: m.bg }}
              >
                <Icon size={20} strokeWidth={2.2} color={m.fg} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold" style={{ color: C.fg }}>
                  {c.naam}
                </p>
                <p className="text-[12px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <StatusPill status={c.status} />
            </div>
          );
        })}
      </Card>

      <Card>
        <div className="border-b p-4 sm:p-5" style={{ borderColor: C.line }}>
          <h3 className="flex items-center gap-2 text-[15px] font-bold" style={{ color: C.fg }}>
            <FileText size={16} strokeWidth={2.2} color={C.accent} aria-hidden="true" /> Bestanden
          </h3>
        </div>
        <ul>
          {DOCUMENTEN.map((d, i) => {
            const m = credMeta(d.status);
            return (
              <li
                key={d.naam}
                className="flex items-center gap-3 p-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[9.5px] font-bold"
                  style={{ ...mono, background: C.bg, color: C.muted }}
                  aria-hidden="true"
                >
                  {d.type}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold" style={{ color: C.fg }}>
                    {d.naam}
                  </p>
                  <p className="text-[11.5px] tabular-nums" style={{ ...mono, color: C.faint }}>
                    {d.grootte} · {d.bijgewerkt}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{ ...display, color: m.fg, background: m.bg }}
                >
                  {m.label}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Kicker>Prioriteiten</Kicker>
        <Title>Volgende acties</Title>
        <p className="mt-2 text-[13.5px]" style={{ color: C.muted }}>
          Op volgorde van urgentie — begin bovenaan.
        </p>
      </div>

      <div className="space-y-4">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const fg = warn ? C.warn : C.accent;
          const bg = warn ? C.warnSoft : C.accentSoft;
          return (
            <Card key={a.titel} className="flex items-stretch overflow-hidden">
              <div
                className="flex w-14 shrink-0 flex-col items-center justify-center gap-2"
                style={{ background: bg }}
              >
                <span className="text-[15px] font-bold tabular-nums" style={{ ...mono, color: fg }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {warn ? (
                  <AlertTriangle size={15} strokeWidth={2.4} color={fg} aria-hidden="true" />
                ) : (
                  <Sparkle size={15} strokeWidth={2.4} color={fg} aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1 p-4">
                <span
                  className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: fg }}
                >
                  {warn ? "Waarschuwing" : "Melding"}
                </span>
                <p className="mt-1 text-[14.5px] font-bold" style={{ color: C.fg }}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className="m-3 shrink-0 self-center rounded-xl px-4 py-2 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  color: warn ? "#fff" : C.accent,
                  background: warn ? C.warn : C.accentSoft,
                  ["--tw-ring-color" as string]: warn ? C.warn : C.accent,
                }}
              >
                {a.cta}
              </button>
            </Card>
          );
        })}
      </div>

      <div
        className="flex items-center gap-3 rounded-2xl p-4"
        style={{ background: C.posSoft, border: `1px solid ${C.pos}22` }}
      >
        <Check size={18} strokeWidth={2.6} color={C.pos} aria-hidden="true" />
        <p className="text-[13px]" style={{ color: C.muted }}>
          Verder is alles bijgewerkt. Nieuwe acties verschijnen hier vanzelf.
        </p>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );
  const concept = FACTUREN.filter((f) => f.status === "Concept").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );
  const totals = [
    { l: "Ontvangen", v: betaald, fg: C.pos },
    { l: "Openstaand", v: open, fg: C.warn },
    { l: "Concept", v: concept, fg: C.faint },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Financiën</Kicker>
          <Title>Facturen</Title>
        </div>
        <button
          className="inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.accent, ["--tw-ring-color" as string]: C.accent }}
        >
          <Plus size={15} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {totals.map((t) => (
          <Card key={t.l} className="p-4 sm:p-5">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.faint }}
            >
              {t.l}
            </p>
            <p
              className="mt-2 text-[20px] font-bold tabular-nums sm:text-[24px]"
              style={{ ...mono, color: t.fg }}
            >
              € {t.v.toLocaleString("nl-NL")}
            </p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div
          className="flex items-center gap-2 border-b p-4 sm:p-5"
          style={{ borderColor: C.line }}
        >
          <TrendingUp size={16} strokeWidth={2.2} color={C.accent} aria-hidden="true" />
          <h3 className="text-[15px] font-bold" style={{ color: C.fg }}>
            Gefactureerd per maand
          </h3>
        </div>
        <div className="p-4 sm:p-6">
          <BarChart data={FACTUUR_REEKS} labels={MAANDEN} />
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[10.5px] font-semibold uppercase tracking-[0.06em]"
              style={{ color: C.faint, borderBottom: `1px solid ${C.line}` }}
            >
              <th className="p-4">Nummer</th>
              <th className="p-4">Klant</th>
              <th className="hidden p-4 sm:table-cell">Datum</th>
              <th className="p-4 text-right">Bedrag</th>
              <th className="p-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f, i) => {
              const kl = FACTUUR_KLEUR[f.status] ?? { fg: C.faint, bg: C.lineSoft };
              return (
                <tr key={f.nr} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <td
                    className="p-4 text-[12.5px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.fg }}
                  >
                    {f.nr}
                  </td>
                  <td className="p-4 text-[13.5px] font-medium" style={{ color: C.fg }}>
                    {f.klant}
                  </td>
                  <td
                    className="hidden p-4 text-[12.5px] tabular-nums sm:table-cell"
                    style={{ ...mono, color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="p-4 text-right text-[13.5px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.fg }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end">
                      <span
                        className="rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
                        style={{ ...display, color: kl.fg, background: kl.bg }}
                      >
                        {f.status}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <p className="px-1 text-[11.5px]" style={{ color: C.faint }}>
        {NAV.length} onderdelen in je werkruimte · bedragen incl. btw waar van toepassing.
      </p>
    </div>
  );
}
