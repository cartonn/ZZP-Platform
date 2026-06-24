"use client";

// Concept 07 — "Stratum": ops console / control-room density (Datadog-grade).
// Dark slate, cyan accent, monospaced-forward. Extreme but legible data density:
// compact rows, sticky headers, fine grid lines, status dots, tabular numbers.
// Self-contained mini-app: command bar + screen tabs over the platform's core screens.

import { useMemo, useState } from "react";
import {
  Search,
  Bell,
  Activity,
  ShieldCheck,
  Bookmark,
  CornerDownLeft,
  ChevronRight,
  Circle,
  Plus,
  Minus,
  Inbox,
} from "lucide-react";
import {
  KPIS,
  OPDRACHTEN,
  CREDENTIALS,
  ACTIES,
  FACTUREN,
  PROFIEL,
  SCREENS,
  type ScreenKey,
  type CredStatus,
} from "./mock";

const mono = { fontFamily: "var(--font-lab-mono)" } as const;
const sans = { fontFamily: "var(--font-lab-geist)" } as const;

// Palette
const BG = "#0d1117";
const SURFACE = "#161b22";
const LINE = "#21262d";
const CYAN = "#22d3ee";
const GREEN = "#34d399";
const AMBER = "#fbbf24";
const RED = "#f87171";

/* ------------------------------------------------------------------ sparkline */

function Spark({ data, up }: { data: number[]; up: boolean }) {
  const w = 72;
  const h = 22;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d - min) / span) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const stroke = up ? GREEN : AMBER;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="overflow-visible"
      aria-hidden
      preserveAspectRatio="none"
    >
      <polyline
        points={pts}
        fill="none"
        stroke={stroke}
        strokeWidth={1.25}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ status dot */

const STATUS: Record<CredStatus, { color: string; label: string }> = {
  VERIFIED: { color: GREEN, label: "OK" },
  EXPIRING: { color: AMBER, label: "WARN" },
  SUBMITTED: { color: CYAN, label: "PEND" },
  REJECTED: { color: RED, label: "FAIL" },
};

function Dot({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}66` }}
    />
  );
}

function matchColor(m: number) {
  if (m >= 90) return GREEN;
  if (m >= 84) return CYAN;
  return AMBER;
}

/* ------------------------------------------------------------------ shell */

export function Concept07() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");

  return (
    <div
      style={{ ...sans, backgroundColor: BG }}
      className="flex min-h-[640px] w-full flex-col text-[#c9d1d9] antialiased [color-scheme:dark]"
    >
      {/* Command / filter bar */}
      <header
        className="flex items-center gap-3 border-b px-4 py-2.5"
        style={{ borderColor: LINE, backgroundColor: SURFACE }}
      >
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-md text-[13px] font-bold text-[#0d1117]"
            style={{ ...mono, backgroundColor: CYAN }}
            aria-hidden
          >
            Z
          </span>
          <span
            style={mono}
            className="hidden text-[12px] font-semibold tracking-tight text-white sm:inline"
          >
            stratum<span style={{ color: CYAN }}>/</span>ops
          </span>
        </div>

        <button
          type="button"
          className="group flex min-w-0 flex-1 items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-[12px] transition-colors duration-150 hover:border-[#30363d] focus-visible:outline-none focus-visible:ring-2 sm:max-w-md"
          style={{
            borderColor: LINE,
            backgroundColor: BG,
            ...({ "--tw-ring-color": `${CYAN}66` } as React.CSSProperties),
          }}
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-[#8b949e]" aria-hidden />
          <span style={mono} className="truncate text-[#8b949e]">
            filter opdrachten, facturen…
          </span>
          <kbd
            style={{ ...mono, borderColor: LINE }}
            className="ml-auto hidden shrink-0 rounded border px-1.5 py-0.5 text-[10px] text-[#8b949e] sm:inline"
          >
            /
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-1.5" style={mono}>
          <span className="hidden items-center gap-1 text-[10px] text-[#8b949e] md:flex">
            <Circle className="h-1.5 w-1.5 fill-current" style={{ color: GREEN }} aria-hidden />
            live
          </span>
        </div>

        <button
          type="button"
          aria-label="Meldingen"
          className="relative rounded-md p-1.5 text-[#8b949e] transition-colors hover:bg-[#21262d] hover:text-white focus-visible:outline-none focus-visible:ring-2"
          style={{ ...({ "--tw-ring-color": `${CYAN}66` } as React.CSSProperties) }}
        >
          <Bell className="h-4 w-4" aria-hidden />
          <span
            className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: CYAN }}
            aria-hidden
          />
        </button>

        <span
          className="flex h-7 w-7 items-center justify-center rounded-md border text-[10px] font-semibold text-white"
          style={{ ...mono, borderColor: LINE, backgroundColor: BG }}
          aria-hidden
        >
          {PROFIEL.initialen}
        </span>
      </header>

      {/* Screen tabs */}
      <div className="border-b" style={{ borderColor: LINE, backgroundColor: SURFACE }}>
        <div
          role="tablist"
          aria-label="Schermen"
          className="flex gap-0 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {SCREENS.map((s) => {
            const active = s.key === screen;
            return (
              <button
                key={s.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setScreen(s.key)}
                style={mono}
                className={[
                  "relative shrink-0 px-3 py-2.5 text-[11px] uppercase tracking-[0.08em] transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset",
                  active ? "text-white" : "text-[#8b949e] hover:text-[#c9d1d9]",
                ].join(" ")}
              >
                {s.label}
                <span
                  aria-hidden
                  className="absolute inset-x-3 bottom-0 h-0.5 transition-colors duration-150"
                  style={{ backgroundColor: active ? CYAN : "transparent" }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex-1 overflow-x-hidden">
        {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
        {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
        {screen === "opdracht" && <Opdracht onBack={() => setScreen("marktplaats")} />}
        {screen === "verificatie" && <Verificatie />}
        {screen === "acties" && <Acties />}
        {screen === "facturen" && <Facturen />}
      </main>

      {/* Status / keyboard hint footer */}
      <footer
        className="flex items-center gap-4 border-t px-4 py-1.5"
        style={{ ...mono, borderColor: LINE, backgroundColor: SURFACE }}
      >
        <span className="flex items-center gap-1.5 text-[10px] text-[#8b949e]">
          <Activity className="h-3 w-3" style={{ color: CYAN }} aria-hidden />
          systeem · operationeel
        </span>
        <span className="ml-auto hidden items-center gap-3 text-[10px] text-[#8b949e] sm:flex">
          <span>
            <kbd className="rounded border px-1 py-0.5" style={{ borderColor: LINE }}>
              J
            </kbd>{" "}
            /{" "}
            <kbd className="rounded border px-1 py-0.5" style={{ borderColor: LINE }}>
              K
            </kbd>{" "}
            navigeer
          </span>
          <span className="flex items-center gap-1">
            <kbd
              className="flex items-center gap-1 rounded border px-1 py-0.5"
              style={{ borderColor: LINE }}
            >
              <CornerDownLeft className="h-2.5 w-2.5" aria-hidden /> Enter
            </kbd>{" "}
            open
          </span>
        </span>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ Dashboard */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={mono} className="text-[10px] uppercase tracking-[0.14em] text-[#8b949e]">
      {children}
    </span>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="space-y-px" style={{ backgroundColor: LINE }}>
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-px lg:grid-cols-4" style={{ backgroundColor: LINE }}>
        {KPIS.map((kpi) => (
          <div key={kpi.label} className="p-3.5" style={{ backgroundColor: BG }}>
            <SectionLabel>{kpi.label}</SectionLabel>
            <div className="mt-2 flex items-end justify-between gap-2">
              <span
                style={mono}
                className="text-[22px] font-semibold leading-none tracking-tight text-white"
              >
                {kpi.value}
              </span>
              <Spark data={kpi.spark} up={kpi.up} />
            </div>
            <div
              style={{ ...mono, color: kpi.up ? GREEN : AMBER }}
              className="mt-2 text-[11px] tabular-nums"
            >
              {kpi.up ? "▲" : "•"} {kpi.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Top matches grid */}
      <div className="p-0" style={{ backgroundColor: BG }}>
        <div className="flex items-center justify-between px-3.5 py-2.5">
          <SectionLabel>Top matches</SectionLabel>
          <span style={mono} className="text-[10px] text-[#8b949e]">
            {OPDRACHTEN.length} actief
          </span>
        </div>
        <div role="grid" aria-label="Top matches">
          <div
            role="row"
            className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-y px-3.5 py-1.5"
            style={{ borderColor: LINE }}
          >
            <span
              role="columnheader"
              style={mono}
              className="text-[10px] uppercase tracking-wider text-[#8b949e]"
            >
              opdracht
            </span>
            <span
              role="columnheader"
              style={mono}
              className="text-right text-[10px] uppercase tracking-wider text-[#8b949e]"
            >
              tarief
            </span>
            <span
              role="columnheader"
              style={mono}
              className="w-12 text-right text-[10px] uppercase tracking-wider text-[#8b949e]"
            >
              match
            </span>
          </div>
          {OPDRACHTEN.map((o) => (
            <button
              key={o.id}
              type="button"
              role="row"
              onClick={onOpen}
              className="grid w-full grid-cols-[1fr_auto_auto] items-center gap-3 border-b px-3.5 text-left transition-colors duration-150 hover:bg-[#161b22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
              style={{
                borderColor: LINE,
                height: 30,
                ...({ "--tw-ring-color": `${CYAN}66` } as React.CSSProperties),
              }}
            >
              <span className="flex min-w-0 items-center gap-2">
                <Dot color={matchColor(o.match)} />
                <span style={mono} className="truncate text-[12px] text-[#c9d1d9]">
                  <span className="text-[#8b949e]">{o.id}</span> {o.titel}
                </span>
              </span>
              <span style={mono} className="text-right text-[12px] tabular-nums text-[#8b949e]">
                {o.tarief}
              </span>
              <span
                style={{ ...mono, color: matchColor(o.match) }}
                className="w-12 text-right text-[12px] font-semibold tabular-nums"
              >
                {o.match}%
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Acties feed */}
      <div className="p-0" style={{ backgroundColor: BG }}>
        <div className="px-3.5 py-2.5">
          <SectionLabel>Actie-log</SectionLabel>
        </div>
        <ul>
          {ACTIES.map((a) => (
            <li
              key={a.titel}
              className="flex items-start gap-2.5 border-t px-3.5 py-2"
              style={{ borderColor: LINE }}
            >
              <Dot color={a.urgentie === "warning" ? AMBER : CYAN} />
              <span style={mono} className="text-[11px] leading-relaxed">
                <span className="text-white">{a.titel}</span>
                <span className="text-[#8b949e]"> — {a.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Marktplaats */

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const filters = ["alle", "≥85%", "utrecht", "avond"];
  const [active, setActive] = useState(0);

  const rows = useMemo(() => {
    if (active === 1) return OPDRACHTEN.filter((o) => o.match >= 85);
    return OPDRACHTEN;
  }, [active]);

  return (
    <div>
      <div
        className="flex flex-wrap items-center gap-1.5 border-b px-3.5 py-2"
        style={{ borderColor: LINE, backgroundColor: SURFACE }}
      >
        {filters.map((f, i) => {
          const on = i === active;
          return (
            <button
              key={f}
              type="button"
              aria-pressed={on}
              onClick={() => setActive(i)}
              style={{
                ...mono,
                backgroundColor: on ? CYAN : "transparent",
                borderColor: on ? CYAN : LINE,
                color: on ? "#0d1117" : undefined,
              }}
              className={[
                "rounded border px-2 py-0.5 text-[11px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2",
                on ? "" : "text-[#8b949e] hover:text-[#c9d1d9]",
              ].join(" ")}
            >
              {f}
            </button>
          );
        })}
        <span style={mono} className="ml-auto text-[10px] text-[#8b949e]">
          {rows.length} / {OPDRACHTEN.length} resultaten
        </span>
      </div>

      {rows.length === 0 ? (
        <Empty label="Geen opdrachten boven dit filter." />
      ) : (
        <div role="grid" aria-label="Opdrachten">
          <div
            role="row"
            className="sticky top-0 z-10 grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 border-b px-3.5 py-1.5"
            style={{ borderColor: LINE, backgroundColor: SURFACE }}
          >
            {["", "opdracht", "uren", "tarief", "match"].map((h, i) => (
              <span
                key={i}
                role="columnheader"
                style={mono}
                className={[
                  "text-[10px] uppercase tracking-wider text-[#8b949e]",
                  i >= 2 ? "text-right" : "",
                  i === 4 ? "w-12" : "",
                ].join(" ")}
              >
                {h}
              </span>
            ))}
          </div>
          {rows.map((o) => (
            <button
              key={o.id}
              type="button"
              role="row"
              onClick={onOpen}
              className="grid w-full grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 border-b px-3.5 text-left transition-colors duration-150 hover:bg-[#161b22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
              style={{
                borderColor: LINE,
                height: 34,
                ...({ "--tw-ring-color": `${CYAN}66` } as React.CSSProperties),
              }}
            >
              <Dot color={matchColor(o.match)} />
              <span className="flex min-w-0 flex-col">
                <span style={mono} className="truncate text-[12px] text-[#c9d1d9]">
                  {o.titel}
                </span>
                <span style={mono} className="truncate text-[10px] text-[#8b949e]">
                  {o.id} · {o.opdrachtgever} · {o.plaats}
                </span>
              </span>
              <span style={mono} className="text-right text-[11px] tabular-nums text-[#8b949e]">
                {o.uren}
              </span>
              <span style={mono} className="text-right text-[11px] tabular-nums text-[#8b949e]">
                {o.tarief}
              </span>
              <span
                style={{ ...mono, color: matchColor(o.match) }}
                className="w-12 text-right text-[12px] font-semibold tabular-nums"
              >
                {o.match}%
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Opdracht */

function Opdracht({ onBack }: { onBack: () => void }) {
  const o = OPDRACHTEN[0];
  const [saved, setSaved] = useState(false);
  if (!o) return null;
  return (
    <div className="p-3.5 sm:p-5">
      <button
        type="button"
        onClick={onBack}
        style={mono}
        className="mb-4 inline-flex items-center gap-1 text-[11px] text-[#8b949e] transition-colors hover:text-[#c9d1d9] focus-visible:outline-none focus-visible:ring-2"
      >
        <ChevronRight className="h-3 w-3 rotate-180" aria-hidden /> marktplaats
      </button>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <SectionLabel>{o.id}</SectionLabel>
          <h2 className="mt-1 text-[18px] font-semibold tracking-tight text-white">{o.titel}</h2>
          <div style={mono} className="mt-1 text-[11px] tabular-nums text-[#8b949e]">
            {o.opdrachtgever} · {o.plaats} · {o.tarief} · {o.uren} · {o.start}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {o.tags.map((t) => (
              <span
                key={t}
                style={{ ...mono, borderColor: LINE }}
                className="rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[#8b949e]"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <SectionLabel>match</SectionLabel>
          <div
            style={{ ...mono, color: matchColor(o.match) }}
            className="text-[28px] font-bold tabular-nums leading-none"
          >
            {o.match}%
          </div>
        </div>
      </div>

      {/* explainable matching */}
      <div className="mt-5 grid gap-px sm:grid-cols-2" style={{ backgroundColor: LINE }}>
        <div className="p-3.5" style={{ backgroundColor: SURFACE }}>
          <div className="mb-2.5 flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" style={{ color: GREEN }} aria-hidden />
            <SectionLabel>waarom dit past</SectionLabel>
          </div>
          <ul className="space-y-1.5">
            {o.redenen.plus.map((r) => (
              <li key={r} className="flex items-start gap-2" style={mono}>
                <Plus className="mt-0.5 h-3 w-3 shrink-0" style={{ color: GREEN }} aria-hidden />
                <span className="text-[12px] leading-snug text-[#c9d1d9]">{r}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-3.5" style={{ backgroundColor: SURFACE }}>
          <div className="mb-2.5 flex items-center gap-1.5">
            <Minus className="h-3.5 w-3.5" style={{ color: AMBER }} aria-hidden />
            <SectionLabel>let op</SectionLabel>
          </div>
          <ul className="space-y-1.5">
            {o.redenen.min.map((r) => (
              <li key={r} className="flex items-start gap-2" style={mono}>
                <Minus className="mt-0.5 h-3 w-3 shrink-0" style={{ color: AMBER }} aria-hidden />
                <span className="text-[12px] leading-snug text-[#c9d1d9]">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          style={{ ...mono, backgroundColor: CYAN }}
          className="rounded-md px-4 py-2 text-[12px] font-semibold text-[#0d1117] transition-opacity duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1117]"
        >
          Reageer op opdracht
        </button>
        <button
          type="button"
          onClick={() => setSaved((s) => !s)}
          aria-pressed={saved}
          style={{ ...mono, borderColor: LINE }}
          className="flex items-center gap-1.5 rounded-md border px-4 py-2 text-[12px] font-medium text-[#c9d1d9] transition-colors duration-150 hover:bg-[#161b22] focus-visible:outline-none focus-visible:ring-2"
        >
          <Bookmark
            className="h-3.5 w-3.5"
            style={{ color: saved ? CYAN : undefined }}
            fill={saved ? CYAN : "none"}
            aria-hidden
          />
          {saved ? "Bewaard" : "Bewaar"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Verificatie */

const STATUS_LABEL: Record<CredStatus, string> = {
  VERIFIED: "Geverifieerd",
  EXPIRING: "Verloopt binnenkort",
  SUBMITTED: "In beoordeling",
  REJECTED: "Afgewezen",
};

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="p-3.5 sm:p-5">
      <div
        className="flex items-center gap-3 rounded-md border p-3.5"
        style={{ borderColor: LINE, backgroundColor: SURFACE }}
      >
        <ShieldCheck className="h-5 w-5" style={{ color: GREEN }} aria-hidden />
        <div>
          <div style={mono} className="text-[13px] font-semibold text-white">
            Vertrouwensniveau · Hoog
          </div>
          <div style={mono} className="text-[10px] text-[#8b949e]">
            {verified}/{CREDENTIALS.length} credentials geverifieerd
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1" aria-hidden>
          {CREDENTIALS.map((c) => (
            <span
              key={c.naam}
              className="h-6 w-1.5 rounded-full"
              style={{ backgroundColor: STATUS[c.status].color }}
            />
          ))}
        </div>
      </div>

      <div className="mt-4">
        <SectionLabel>Credentials</SectionLabel>
        <div className="mt-2 overflow-hidden rounded-md border" style={{ borderColor: LINE }}>
          <div
            className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b px-3.5 py-1.5"
            style={{ borderColor: LINE, backgroundColor: SURFACE }}
          >
            {["", "credential", "status"].map((h, i) => (
              <span
                key={i}
                style={mono}
                className="text-[10px] uppercase tracking-wider text-[#8b949e]"
              >
                {h}
              </span>
            ))}
          </div>
          {CREDENTIALS.map((c) => (
            <div
              key={c.naam}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b px-3.5 py-2.5 last:border-b-0"
              style={{ borderColor: LINE, backgroundColor: BG }}
            >
              <Dot color={STATUS[c.status].color} />
              <div className="min-w-0">
                <div style={mono} className="truncate text-[12px] text-[#c9d1d9]">
                  {c.naam}
                </div>
                <div style={mono} className="truncate text-[10px] text-[#8b949e]">
                  {c.detail}
                </div>
              </div>
              <span
                style={{ ...mono, color: STATUS[c.status].color }}
                className="text-[10px] uppercase tracking-wider"
                title={STATUS_LABEL[c.status]}
              >
                {STATUS[c.status].label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Acties */

function Acties() {
  const ordered = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="p-3.5 sm:p-5">
      <SectionLabel>Volgende beste acties</SectionLabel>
      <div className="mt-3 space-y-2">
        {ordered.map((a) => {
          const warn = a.urgentie === "warning";
          const c = warn ? AMBER : CYAN;
          return (
            <div
              key={a.titel}
              className="flex items-start gap-3 rounded-md border p-3.5"
              style={{ borderColor: LINE, backgroundColor: SURFACE }}
            >
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded"
                style={{ backgroundColor: `${c}1a` }}
                aria-hidden
              >
                <Dot color={c} />
              </span>
              <div className="min-w-0 flex-1">
                <div style={mono} className="text-[12px] font-semibold text-white">
                  {a.titel}
                </div>
                <p style={mono} className="mt-0.5 text-[11px] leading-snug text-[#8b949e]">
                  {a.detail}
                </p>
              </div>
              <button
                type="button"
                style={{ ...mono, color: c }}
                className="shrink-0 text-[11px] font-semibold transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
              >
                {a.cta} →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Facturen */

const INVOICE_COLOR: Record<string, string> = {
  Betaald: GREEN,
  Openstaand: AMBER,
  Concept: "#8b949e",
};

function Facturen() {
  return (
    <div role="grid" aria-label="Facturen">
      <div
        className="sticky top-0 z-10 grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 border-b px-3.5 py-1.5"
        style={{ borderColor: LINE, backgroundColor: SURFACE }}
      >
        {["", "nr / klant", "datum", "bedrag", "status"].map((h, i) => (
          <span
            key={i}
            role="columnheader"
            style={mono}
            className={[
              "text-[10px] uppercase tracking-wider text-[#8b949e]",
              i >= 2 ? "text-right" : "",
            ].join(" ")}
          >
            {h}
          </span>
        ))}
      </div>
      {FACTUREN.map((f) => {
        const c = INVOICE_COLOR[f.status] ?? "#8b949e";
        return (
          <div
            key={f.nr}
            className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 border-b px-3.5 transition-colors hover:bg-[#161b22]"
            style={{ borderColor: LINE, backgroundColor: BG, minHeight: 36 }}
          >
            <Dot color={c} />
            <div className="min-w-0">
              <span style={mono} className="text-[12px] tabular-nums text-[#c9d1d9]">
                {f.nr}
              </span>
              <span style={mono} className="ml-2 text-[10px] text-[#8b949e]">
                {f.klant}
              </span>
            </div>
            <span style={mono} className="text-right text-[11px] tabular-nums text-[#8b949e]">
              {f.datum}
            </span>
            <span
              style={mono}
              className="text-right text-[12px] font-medium tabular-nums text-white"
            >
              {f.bedrag}
            </span>
            <span
              style={{ ...mono, color: c }}
              className="text-right text-[10px] uppercase tracking-wider"
            >
              {f.status}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ Empty */

function Empty({ label }: { label: string }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center gap-2 text-center">
      <span
        className="flex h-10 w-10 items-center justify-center rounded-md border"
        style={{ borderColor: LINE, backgroundColor: SURFACE }}
        aria-hidden
      >
        <Inbox className="h-5 w-5 text-[#8b949e]" />
      </span>
      <p style={mono} className="text-[12px] text-[#8b949e]">
        {label}
      </p>
    </div>
  );
}
