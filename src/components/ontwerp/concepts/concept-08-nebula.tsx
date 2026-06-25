"use client";

// Concept 08 — "Nebula" · Techno-futurist (DARK, cyber-grid).
// Near-black canvas met een subtiel achtergrond-rasterpatroon, neon electric accenten
// (cyan + violet), scherpe dunne randen die subtiel oplichten bij hover, "deployment-board"
// status-energie, monospaced data, glowende status-dots en kinetische transities.
// Scherp, technisch, premium-cyber — gegrid en precies. Contrast AA+.
// Palet: canvas #08090d, surface #0d0f15, line #1b1f2a, cyan #22e0c8, violet #8b7dff,
// ink #e6e9f0, muted #8a91a3.
// Fonts: Geist (UI) + Geist Mono / JetBrains Mono (data).

import { useState } from "react";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  ShieldCheck,
  ListTodo,
  Receipt,
  Search,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Check,
  Clock,
  AlertTriangle,
  Minus,
  MapPin,
  Plus,
  Command,
  Activity,
  Terminal,
  type LucideIcon,
} from "lucide-react";
import {
  SCREENS,
  KPIS,
  OPDRACHTEN,
  CREDENTIALS,
  ACTIES,
  FACTUREN,
  PROFIEL,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

const C = {
  canvas: "#08090d",
  surface: "#0d0f15",
  surfaceHi: "#11141c",
  line: "#1b1f2a",
  lineHi: "#262c3a",
  muted: "#8a91a3",
  faint: "#5b6273",
  ink: "#e6e9f0",
  inkSoft: "#b6bcca",
  cyan: "#22e0c8",
  cyanSoft: "rgba(34,224,200,0.12)",
  cyanLine: "rgba(34,224,200,0.35)",
  violet: "#8b7dff",
  violetSoft: "rgba(139,125,255,0.14)",
  amber: "#ffb454",
  red: "#ff6b81",
  green: "#3fe08a",
};

const ui = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };
const monoJ = { fontFamily: "var(--font-lab-mono)" };

const GRID_BG = {
  backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`,
  backgroundSize: "44px 44px",
};

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: Receipt,
  berichten: Bell,
};

function statusStyle(s: CredStatus): {
  label: string;
  code: string;
  fg: string;
  dot: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", code: "VERIFIED", fg: C.green, dot: C.green };
    case "SUBMITTED":
      return { label: "In beoordeling", code: "PENDING", fg: C.cyan, dot: C.cyan };
    case "EXPIRING":
      return { label: "Verloopt bijna", code: "EXPIRING", fg: C.amber, dot: C.amber };
    case "REJECTED":
      return { label: "Afgewezen", code: "REJECTED", fg: C.red, dot: C.red };
  }
}

function Dot({ color, pulse = false }: { color: string; pulse?: boolean }) {
  return (
    <span className="relative inline-flex h-2 w-2 shrink-0" aria-hidden="true">
      {pulse && (
        <span
          className="absolute inset-0 animate-ping rounded-full opacity-60"
          style={{ background: color }}
        />
      )}
      <span
        className="relative h-2 w-2 rounded-full"
        style={{ background: color, boxShadow: `0 0 6px ${color}` }}
      />
    </span>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 96;
  const h = 26;
  const pts = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d - min) / span) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 3px ${color})` }}
      />
    </svg>
  );
}

export function Concept08() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.canvas, color: C.ink }}
    >
      <div className="flex min-h-[680px]">
        {/* Sidebar */}
        <aside
          className="hidden w-[240px] shrink-0 flex-col border-r px-4 py-6 md:flex"
          style={{ borderColor: C.line, background: C.canvas }}
        >
          <div className="flex items-center gap-3 px-2 pb-8">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-md text-[13px] font-bold"
              style={{
                border: `1px solid ${C.cyanLine}`,
                color: C.cyan,
                background: C.cyanSoft,
                ...mono,
              }}
            >
              Z
            </div>
            <div className="leading-tight">
              <div className="text-[13px] font-semibold tracking-tight">ZZP Platform</div>
              <div className="text-[10px] tracking-[0.18em]" style={{ color: C.cyan, ...mono }}>
                v2.6 · LIVE
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-0.5">
            {SCREENS.map((s, i) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-[13px] transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22e0c8]"
                  style={{
                    color: on ? C.ink : C.muted,
                    background: on ? C.surfaceHi : "transparent",
                    border: `1px solid ${on ? C.lineHi : "transparent"}`,
                  }}
                >
                  {on && (
                    <span
                      className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full"
                      style={{ background: C.cyan, boxShadow: `0 0 8px ${C.cyan}` }}
                      aria-hidden="true"
                    />
                  )}
                  <Icon
                    size={16}
                    aria-hidden="true"
                    style={{ color: on ? C.cyan : C.faint }}
                    className="transition-colors group-hover:text-[#22e0c8]"
                  />
                  <span className="flex-1">{s.label}</span>
                  <span className="text-[10px] tabular-nums" style={{ color: C.faint, ...mono }}>
                    {String(i).padStart(2, "0")}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto">
            <div
              className="rounded-lg p-3"
              style={{ border: `1px solid ${C.line}`, background: C.surface }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-md text-[11px] font-semibold"
                  style={{ border: `1px solid ${C.cyanLine}`, color: C.cyan, ...mono }}
                >
                  {PROFIEL.initialen}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-medium">{PROFIEL.naam}</div>
                  <div className="flex items-center gap-1.5 text-[11px]" style={{ color: C.muted }}>
                    <Dot color={C.green} /> {PROFIEL.trust}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Topbar */}
          <header
            className="flex h-16 shrink-0 items-center gap-3 border-b px-6"
            style={{ borderColor: C.line }}
          >
            <div className="flex items-center gap-2 text-[12px]" style={mono}>
              <Terminal size={13} aria-hidden="true" style={{ color: C.faint }} />
              <span style={{ color: C.faint }}>~/</span>
              <span className="font-medium" style={{ color: C.cyan }}>
                {screen}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                className="flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[12.5px] transition-colors hover:border-[#262c3a] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22e0c8]"
                style={{ border: `1px solid ${C.line}`, color: C.muted, background: C.surface }}
                aria-label="Zoeken openen"
              >
                <Search size={14} aria-hidden="true" />
                <span>Zoek…</span>
                <kbd
                  className="flex items-center gap-0.5 rounded px-1 text-[10px]"
                  style={{ border: `1px solid ${C.line}`, color: C.faint, ...mono }}
                >
                  <Command size={9} aria-hidden="true" />K
                </kbd>
              </button>
              <button
                className="relative rounded-md p-2 transition-colors hover:border-[#262c3a] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22e0c8]"
                style={{ border: `1px solid ${C.line}`, color: C.muted, background: C.surface }}
                aria-label="Meldingen"
              >
                <Bell size={15} aria-hidden="true" />
                <span
                  className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
                  style={{ background: C.cyan, boxShadow: `0 0 6px ${C.cyan}` }}
                  aria-hidden="true"
                />
              </button>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div
            className="flex gap-1 overflow-x-auto border-b px-4 py-2 md:hidden"
            style={{ borderColor: C.line }}
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="shrink-0 rounded-md px-3 py-1.5 text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22e0c8]"
                  style={{
                    color: on ? C.cyan : C.muted,
                    background: on ? C.cyanSoft : "transparent",
                    border: `1px solid ${on ? C.cyanLine : "transparent"}`,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-8">
            {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
            {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
            {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties />}
            {screen === "facturen" && <Facturen />}
          </div>
        </main>
      </div>
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10.5px] font-medium uppercase tracking-[0.22em]"
      style={{ color: C.cyan, ...mono }}
    >
      {children}
    </p>
  );
}

function Panel({
  children,
  className = "",
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`group rounded-xl transition-all ${className}`}
      style={{
        border: `1px solid ${C.line}`,
        background: C.surface,
        ...(glow ? { boxShadow: `0 0 0 1px ${C.cyanLine}, 0 0 24px -8px ${C.cyan}` } : {}),
      }}
    >
      {children}
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const kpiColors = [C.cyan, C.violet, C.green, C.amber];
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Hero met grid */}
      <div
        className="relative overflow-hidden rounded-2xl p-7"
        style={{ border: `1px solid ${C.line}`, background: C.surface }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={GRID_BG}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full"
          style={{ background: C.cyan, opacity: 0.07, filter: "blur(40px)" }}
          aria-hidden="true"
        />
        <div className="relative">
          <Kicker>System · vandaag</Kicker>
          <h1 className="mt-3 text-[32px] font-semibold leading-[1.05] tracking-tight">
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-2 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.muted }}>
            Drie matches boven 80%, één credential vraagt aandacht. Alle systemen operationeel.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2.5 text-[11.5px]" style={mono}>
            <span
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1"
              style={{ border: `1px solid ${C.line}`, color: C.green }}
            >
              <Dot color={C.green} pulse /> alle credentials actief
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1"
              style={{ border: `1px solid ${C.line}`, color: C.amber }}
            >
              <Dot color={C.amber} /> 1 verloopt &lt; 30d
            </span>
          </div>
        </div>
      </div>

      {/* KPI's — deployment board */}
      <div
        className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl lg:grid-cols-4"
        style={{ background: C.line, border: `1px solid ${C.line}` }}
      >
        {KPIS.map((k, i) => {
          const col = kpiColors[i % kpiColors.length] ?? C.cyan;
          return (
            <div
              key={k.label}
              className="p-5 transition-colors hover:bg-[#11141c]"
              style={{ background: C.surface }}
            >
              <div className="flex items-center justify-between">
                <p
                  className="text-[11px] uppercase tracking-[0.1em]"
                  style={{ color: C.muted, ...mono }}
                >
                  {k.label}
                </p>
                <Dot color={col} />
              </div>
              <p
                className="mt-3 text-[28px] font-light tabular-nums leading-none tracking-tight"
                style={mono}
              >
                {k.value}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] tabular-nums"
                  style={{ color: k.up ? C.green : C.amber, ...mono }}
                >
                  {k.up ? (
                    <ArrowUpRight size={12} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={12} aria-hidden="true" />
                  )}
                  {k.trend}
                </span>
                <Sparkline data={k.spark} color={col} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-3">
        {/* Matches */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[14px] font-semibold tracking-tight">
              <Activity size={15} aria-hidden="true" style={{ color: C.cyan }} /> Beste matches
            </h2>
            <span className="text-[11px]" style={{ color: C.faint, ...mono }}>
              sorted by score desc
            </span>
          </div>
          <Panel>
            <div className="divide-y" style={{ borderColor: C.line }}>
              {OPDRACHTEN.map((o) => (
                <button
                  key={o.id}
                  onClick={onOpen}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#11141c] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#22e0c8]"
                >
                  <span className="text-[11px] tabular-nums" style={{ color: C.faint, ...mono }}>
                    {o.id}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium">{o.titel}</p>
                    <p className="mt-0.5 truncate text-[12px]" style={{ color: C.muted }}>
                      {o.opdrachtgever} · {o.plaats}
                    </p>
                  </div>
                  <span
                    className="hidden text-[12px] tabular-nums sm:inline"
                    style={{ color: C.inkSoft, ...mono }}
                  >
                    {o.tarief.replace(" / uur", "")}
                  </span>
                  <span
                    className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium tabular-nums"
                    style={{ background: C.cyanSoft, color: C.cyan, ...mono }}
                  >
                    {o.match}%
                  </span>
                  <ChevronRight size={15} aria-hidden="true" style={{ color: C.faint }} />
                </button>
              ))}
            </div>
          </Panel>
        </div>

        {/* Credentials */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-[14px] font-semibold tracking-tight">
            <ShieldCheck size={15} aria-hidden="true" style={{ color: C.violet }} /> Credentials
          </h2>
          <Panel className="p-5">
            <div className="space-y-4">
              {CREDENTIALS.map((c) => {
                const st = statusStyle(c.status);
                return (
                  <div key={c.naam} className="flex items-start gap-3">
                    <span className="mt-1.5">
                      <Dot color={st.dot} pulse={c.status === "SUBMITTED"} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium">{c.naam}</p>
                      <p className="truncate text-[11px]" style={{ color: C.muted }}>
                        {c.detail}
                      </p>
                    </div>
                    <span className="text-[9.5px] tabular-nums" style={{ color: st.fg, ...mono }}>
                      {st.code}
                    </span>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div>
        <Kicker>Marktplaats</Kicker>
        <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-tight">
          Open opdrachten
        </h1>
      </div>

      <div
        className="flex items-center gap-3 rounded-lg px-4 py-2.5 transition-colors focus-within:border-[#22e0c8]"
        style={{ border: `1px solid ${C.line}`, background: C.surface }}
      >
        <Search size={15} aria-hidden="true" style={{ color: C.cyan }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="grep opdrachten — titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#5b6273]"
          style={{ color: C.ink, ...mono }}
        />
        <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.faint, ...mono }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div
          className="rounded-xl px-6 py-16 text-center"
          style={{ border: `1px dashed ${C.lineHi}`, background: C.surface }}
        >
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg"
            style={{ border: `1px solid ${C.line}` }}
            aria-hidden="true"
          >
            <Search size={20} style={{ color: C.faint }} />
          </div>
          <p className="mt-4 text-[14px] font-medium">Geen resultaten</p>
          <p className="mt-1.5 text-[12.5px]" style={{ color: C.muted, ...mono }}>
            0 matches voor &quot;{q}&quot; — verbreed je zoekopdracht.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 inline-flex items-center gap-2 rounded-md px-4 py-2 text-[12px] font-medium transition-colors hover:bg-[#11141c] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22e0c8]"
            style={{ border: `1px solid ${C.cyanLine}`, color: C.cyan }}
          >
            reset filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group rounded-xl p-5 text-left transition-all hover:-translate-y-0.5 hover:border-[#22e0c8] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22e0c8]"
              style={{ border: `1px solid ${C.line}`, background: C.surface }}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[10px] tracking-wide" style={{ color: C.faint, ...mono }}>
                  {o.id}
                </span>
                <span
                  className="flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium tabular-nums"
                  style={{ background: C.cyanSoft, color: C.cyan, ...mono }}
                >
                  <Dot color={C.cyan} /> {o.match}%
                </span>
              </div>
              <p className="mt-3 text-[15px] font-semibold leading-snug">{o.titel}</p>
              <p
                className="mt-1.5 flex items-center gap-1.5 text-[12px]"
                style={{ color: C.muted }}
              >
                <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded px-2 py-0.5 text-[10.5px]"
                    style={{ border: `1px solid ${C.line}`, color: C.inkSoft, ...mono }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div
                className="mt-4 flex items-center justify-between border-t pt-4 text-[12.5px]"
                style={{ borderColor: C.line }}
              >
                <span className="font-medium tabular-nums" style={{ color: C.ink, ...mono }}>
                  {o.tarief}
                </span>
                <span className="tabular-nums" style={{ color: C.muted, ...mono }}>
                  {o.uren}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div
        className="relative overflow-hidden rounded-2xl p-7"
        style={{ border: `1px solid ${C.line}`, background: C.surface }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={GRID_BG}
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Kicker>{opdracht.id}</Kicker>
            <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-tight">
              {opdracht.titel}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-[13px]" style={{ color: C.muted }}>
              <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <button
            className="shrink-0 rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22e0c8]"
            style={{ background: C.cyan, color: "#04120f", boxShadow: `0 0 20px -6px ${C.cyan}` }}
          >
            Reageer op opdracht
          </button>
        </div>
      </div>

      <div
        className="grid grid-cols-2 gap-px overflow-hidden rounded-xl sm:grid-cols-4"
        style={{ background: C.line, border: `1px solid ${C.line}` }}
      >
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <div key={m.l} className="p-4" style={{ background: C.surface }}>
            <p
              className="text-[10.5px] uppercase tracking-[0.1em]"
              style={{ color: C.muted, ...mono }}
            >
              {m.l}
            </p>
            <p className="mt-1.5 text-[16px] font-light tabular-nums tracking-tight" style={mono}>
              {m.v}
            </p>
          </div>
        ))}
      </div>

      <Panel className="p-6">
        <h3 className="flex items-center gap-2 text-[14px] font-semibold">
          <Activity size={15} aria-hidden="true" style={{ color: C.cyan }} /> Waarom deze match
        </h3>
        <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je profiel.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <p
              className="text-[10.5px] font-medium uppercase tracking-[0.16em]"
              style={{ color: C.green, ...mono }}
            >
              + Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px]">
                  <Check size={15} aria-hidden="true" style={{ color: C.green, marginTop: 1 }} />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="text-[10.5px] font-medium uppercase tracking-[0.16em]"
              style={{ color: C.amber, ...mono }}
            >
              − Aandachtspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.muted }}
                >
                  <Minus size={15} aria-hidden="true" style={{ color: C.amber, marginTop: 1 }} />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div>
        <Kicker>Vertrouwen</Kicker>
        <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-tight">Verificatie</h1>
      </div>

      <Panel glow className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
          style={{ border: `1px solid ${C.cyanLine}`, background: C.cyanSoft }}
        >
          <ShieldCheck size={26} aria-hidden="true" style={{ color: C.cyan }} />
        </div>
        <div className="flex-1">
          <p className="text-[17px] font-semibold">{PROFIEL.trust}</p>
          <p className="text-[12.5px]" style={{ color: C.muted }}>
            <span style={mono}>{verified}</span> van <span style={mono}>{CREDENTIALS.length}</span>{" "}
            credentials volledig geverifieerd ·{" "}
            <span style={{ color: C.amber }}>1 vraagt actie</span>
          </p>
        </div>
        <div className="flex items-center gap-1" aria-hidden="true">
          {CREDENTIALS.map((c) => {
            const st = statusStyle(c.status);
            return (
              <span
                key={c.naam}
                className="h-8 w-2 rounded-full"
                style={{ background: st.dot, boxShadow: `0 0 6px ${st.dot}` }}
              />
            );
          })}
        </div>
      </Panel>

      <Panel>
        <div className="divide-y" style={{ borderColor: C.line }}>
          {CREDENTIALS.map((c) => {
            const st = statusStyle(c.status);
            const Icon =
              c.status === "VERIFIED" ? Check : c.status === "SUBMITTED" ? Clock : AlertTriangle;
            return (
              <div
                key={c.naam}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#11141c]"
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ border: `1px solid ${C.line}` }}
                >
                  <Icon size={16} aria-hidden="true" style={{ color: st.dot }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium">{c.naam}</p>
                  <p className="text-[12px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <span
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium"
                  style={{ border: `1px solid ${C.line}`, color: st.fg }}
                >
                  <Dot color={st.dot} /> {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

function Acties() {
  const tone: Record<"warning" | "info", { fg: string; Icon: LucideIcon }> = {
    warning: { fg: C.amber, Icon: AlertTriangle },
    info: { fg: C.cyan, Icon: Bell },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <div>
        <Kicker>Aandacht</Kicker>
        <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-tight">
          Volgende acties
        </h1>
      </div>
      <div className="space-y-3">
        {ACTIES.map((a) => {
          const t = tone[a.urgentie];
          return (
            <Panel key={a.titel} className="flex items-start gap-4 p-5 hover:border-[#262c3a]">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ border: `1px solid ${C.line}` }}
              >
                <t.Icon size={17} aria-hidden="true" style={{ color: t.fg }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium">{a.titel}</p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 rounded-md px-3.5 py-1.5 text-[12.5px] font-medium transition-colors hover:bg-[#11141c] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22e0c8]"
                style={{ border: `1px solid ${C.lineHi}`, color: C.ink }}
              >
                {a.cta}
              </button>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

function Facturen() {
  const statusTone: Record<string, string> = {
    Betaald: C.green,
    Openstaand: C.amber,
    Concept: C.muted,
  };
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div className="flex items-end justify-between">
        <div>
          <Kicker>Omzet</Kicker>
          <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-tight">Facturen</h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-semibold transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22e0c8]"
          style={{ background: C.cyan, color: "#04120f", boxShadow: `0 0 16px -6px ${C.cyan}` }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Panel className="overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr
              className="border-b text-[10.5px] uppercase tracking-[0.12em]"
              style={{ borderColor: C.line, color: C.faint, ...mono }}
            >
              <th className="px-5 py-3 font-medium">Nummer</th>
              <th className="px-5 py-3 font-medium">Klant</th>
              <th className="px-5 py-3 font-medium">Datum</th>
              <th className="px-5 py-3 text-right font-medium">Bedrag</th>
              <th className="px-5 py-3 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => (
              <tr
                key={f.nr}
                className="border-b transition-colors last:border-0 hover:bg-[#11141c]"
                style={{ borderColor: C.line }}
              >
                <td className="px-5 py-3.5 text-[12.5px]" style={{ color: C.inkSoft, ...monoJ }}>
                  {f.nr}
                </td>
                <td className="px-5 py-3.5 text-[13px]">{f.klant}</td>
                <td className="px-5 py-3.5 text-[12.5px]" style={{ color: C.muted, ...mono }}>
                  {f.datum}
                </td>
                <td
                  className="px-5 py-3.5 text-right text-[13px] font-medium tabular-nums"
                  style={mono}
                >
                  {f.bedrag}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span
                    className="inline-flex items-center gap-1.5 text-[11.5px] font-medium"
                    style={{ color: statusTone[f.status] ?? C.muted }}
                  >
                    <Dot color={statusTone[f.status] ?? C.muted} />
                    {f.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
