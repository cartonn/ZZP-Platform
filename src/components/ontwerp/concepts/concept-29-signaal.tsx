"use client";

// Concept 29 — "Signaal" · Hi-vis workwear / industrieel.
// Werkkleding-esthetiek voor veldwerkers: antraciet canvas met veiligheids-oranje en hi-vis geel
// als signaalkleuren. Waarschuwingsstrepen (hazard-stripes) spaarzaam als accent-randen/headers,
// stencil-achtige vette koppen, industriële tags met klinknagel-details, monospace ref-codes.
// Stoer maar premium en strak — hoge leesbaarheid, geen rommel.
// Palet: bg #17181a, paneel #212327, ink #f2f2ef, muted #9a9c9f, oranje #ff6a00,
// hi-vis geel #e6ff3a (spaarzaam), lijn #33363b, geverifieerd-groen #5bd08a.
// Fonts: --font-lab-space (koppen/labels) + --font-lab-spline-mono (codes/cijfers).

import { useState } from "react";
import {
  LayoutGrid,
  Radar,
  HardHat,
  ShieldCheck,
  ListChecks,
  Receipt,
  Search,
  Bell,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Clock,
  AlertTriangle,
  Minus,
  MapPin,
  Plus,
  FileText,
  MessageSquare,
  Send,
  Zap,
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
  NAV,
  BERICHTEN,
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

const C = {
  bg: "#17181a",
  bgDeep: "#131416",
  panel: "#212327",
  panelSoft: "#1b1d20",
  raise: "#2a2d32",
  ink: "#f2f2ef",
  inkSoft: "#c7c8c6",
  muted: "#9a9c9f",
  faint: "#6c6f73",
  line: "#33363b",
  lineSoft: "#26282c",
  orange: "#ff6a00",
  orangeDeep: "#d95900",
  orangeSoft: "rgba(255,106,0,0.13)",
  hiVis: "#e6ff3a",
  hiVisSoft: "rgba(230,255,58,0.13)",
  green: "#5bd08a",
  greenSoft: "rgba(91,208,138,0.14)",
  red: "#ff5a4d",
  redSoft: "rgba(255,90,77,0.14)",
};

const head = { fontFamily: "var(--font-lab-space)" };
const mono = { fontFamily: "var(--font-lab-spline-mono)" };

// Hazard-stripe patronen — SPAARZAAM ingezet als dunne accent-strook (rand/header), nooit als vlak.
const HAZARD =
  "repeating-linear-gradient(45deg, #ff6a00 0, #ff6a00 11px, #17181a 11px, #17181a 22px)";
const HAZARD_YELLOW =
  "repeating-linear-gradient(45deg, #e6ff3a 0, #e6ff3a 10px, #17181a 10px, #17181a 20px)";

const SHADOW = "0 20px 48px -24px rgba(0,0,0,0.7)";
const SHADOW_SM = "0 12px 28px -18px rgba(0,0,0,0.6)";

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutGrid,
  marktplaats: Radar,
  opdracht: HardHat,
  verificatie: ShieldCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: FileText,
  berichten: MessageSquare,
};

function statusStyle(s: CredStatus): {
  label: string;
  fg: string;
  bg: string;
  Icon: LucideIcon;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "GEKEURD", fg: C.green, bg: C.greenSoft, Icon: Check };
    case "SUBMITTED":
      return { label: "IN KEURING", fg: C.hiVis, bg: C.hiVisSoft, Icon: Clock };
    case "EXPIRING":
      return { label: "VERLOOPT", fg: C.orange, bg: C.orangeSoft, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "AFGEKEURD", fg: C.red, bg: C.redSoft, Icon: AlertTriangle };
  }
}

// Klinknagel/bout-detail — kleine cirkels in de hoeken van industriële tags.
function Rivets() {
  return (
    <>
      <span
        className="absolute left-1 top-1 h-1 w-1 rounded-full"
        style={{ background: C.faint }}
        aria-hidden="true"
      />
      <span
        className="absolute right-1 top-1 h-1 w-1 rounded-full"
        style={{ background: C.faint }}
        aria-hidden="true"
      />
      <span
        className="absolute bottom-1 left-1 h-1 w-1 rounded-full"
        style={{ background: C.faint }}
        aria-hidden="true"
      />
      <span
        className="absolute bottom-1 right-1 h-1 w-1 rounded-full"
        style={{ background: C.faint }}
        aria-hidden="true"
      />
    </>
  );
}

// Dunne hazard-strook — het kernmotief, altijd smal en functioneel.
function HazardStrip({ yellow = false, className = "" }: { yellow?: boolean; className?: string }) {
  return (
    <div
      className={`h-1.5 w-full ${className}`}
      style={{ background: yellow ? HAZARD_YELLOW : HAZARD, opacity: 0.9 }}
      aria-hidden="true"
    />
  );
}

function Sparkline({ data, color = C.orange }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 94;
  const h = 30;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      {pts.map((p, i) => (
        <line
          key={i}
          x1={p[0]}
          y1={h}
          x2={p[0]}
          y2={p[1]}
          stroke={color}
          strokeWidth={1}
          opacity={0.18}
        />
      ))}
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Industrieel stencil-label.
function Tag({
  children,
  fg = C.hiVis,
  bg = C.hiVisSoft,
  rivets = false,
}: {
  children: React.ReactNode;
  fg?: string;
  bg?: string;
  rivets?: boolean;
}) {
  return (
    <span
      className="relative inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]"
      style={{ background: bg, color: fg, border: `1px solid ${fg}33`, ...head }}
    >
      {rivets && <Rivets />}
      {children}
    </span>
  );
}

function Kicker({ children, color = C.orange }: { children: React.ReactNode; color?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="h-3 w-1.5" style={{ background: color }} aria-hidden="true" />
      <p className="text-[11px] font-bold uppercase tracking-[0.24em]" style={{ color, ...head }}>
        {children}
      </p>
    </div>
  );
}

function Panel({
  children,
  className = "",
  soft = false,
}: {
  children: React.ReactNode;
  className?: string;
  soft?: boolean;
}) {
  return (
    <div
      className={className}
      style={{
        background: soft ? C.panelSoft : C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: SHADOW,
      }}
    >
      {children}
    </div>
  );
}

export function Concept29() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...head, color: C.ink, background: C.bg }}
    >
      <div className="flex min-h-[680px]">
        {/* Sidebar */}
        <aside
          className="hidden w-[248px] shrink-0 flex-col lg:flex"
          style={{ background: C.bgDeep, borderRight: `1px solid ${C.line}` }}
        >
          <HazardStrip />
          <div className="flex items-center gap-3 px-5 py-6">
            <div
              className="flex h-11 w-11 items-center justify-center text-[18px] font-bold"
              style={{ background: C.orange, color: "#101010", ...head }}
            >
              Z
            </div>
            <div>
              <div className="text-[14px] font-bold uppercase tracking-[0.12em]">ZZP Platform</div>
              <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>
                Veldeenheid
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1 px-3">
            {SCREENS.map((s, i) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group relative flex items-center gap-3 px-3 py-2.5 text-left text-[12.5px] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    color: on ? C.ink : C.muted,
                    background: on ? C.panel : "transparent",
                    border: `1px solid ${on ? C.line : "transparent"}`,
                    ...({ ["--tw-ring-color"]: C.orange } as React.CSSProperties),
                  }}
                >
                  {on && (
                    <span
                      className="absolute left-0 top-0 h-full w-1"
                      style={{ background: C.orange }}
                      aria-hidden="true"
                    />
                  )}
                  <Icon size={16} aria-hidden="true" style={{ color: on ? C.orange : C.faint }} />
                  <span className="flex-1">{s.label}</span>
                  <span className="text-[9px] tabular-nums" style={{ color: C.faint, ...mono }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="mt-6 px-5">
            <p
              className="pb-2.5 text-[9.5px] font-bold uppercase tracking-[0.22em]"
              style={{ color: C.faint }}
            >
              Secties
            </p>
            <div className="flex flex-wrap gap-1.5">
              {NAV.slice(2).map((n) => (
                <span
                  key={n}
                  className="px-2 py-1 text-[9.5px] font-semibold uppercase tracking-[0.1em]"
                  style={{ background: C.lineSoft, color: C.muted, border: `1px solid ${C.line}` }}
                >
                  {n}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-auto p-4">
            <div
              className="relative flex items-center gap-3 p-3.5"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
            >
              <Rivets />
              <div
                className="flex h-10 w-10 items-center justify-center text-[12px] font-bold"
                style={{ background: C.hiVis, color: "#101010", ...head }}
              >
                {PROFIEL.initialen}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-bold">{PROFIEL.naam}</div>
                <div
                  className="truncate text-[9.5px] uppercase tracking-[0.12em]"
                  style={{ color: C.green, ...mono }}
                >
                  {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Topbar */}
          <header
            className="flex h-[68px] shrink-0 items-center gap-3 px-5 lg:px-8"
            style={{ borderBottom: `1px solid ${C.line}`, background: C.bgDeep }}
          >
            <div
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.muted }}
            >
              <span style={{ color: C.orange, ...mono }}>UNIT-01</span>
              <ChevronRight size={12} aria-hidden="true" style={{ color: C.faint }} />
              <span style={{ color: C.ink }}>{SCREENS.find((s) => s.key === screen)?.label}</span>
            </div>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                className="flex items-center gap-2.5 px-4 py-2 text-[11.5px] font-semibold uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2"
                style={{
                  background: C.panel,
                  color: C.muted,
                  border: `1px solid ${C.line}`,
                  ...({ ["--tw-ring-color"]: C.orange } as React.CSSProperties),
                }}
                aria-label="Zoeken openen"
              >
                <Search size={14} aria-hidden="true" />
                <span className="hidden sm:inline">Zoek</span>
              </button>
              <button
                className="relative p-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2"
                style={{
                  background: C.panel,
                  color: C.muted,
                  border: `1px solid ${C.line}`,
                  ...({ ["--tw-ring-color"]: C.orange } as React.CSSProperties),
                }}
                aria-label="Meldingen"
              >
                <Bell size={15} aria-hidden="true" />
                <span
                  className="absolute right-2 top-2 h-1.5 w-1.5"
                  style={{ background: C.orange }}
                  aria-hidden="true"
                />
              </button>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div
            className="flex gap-1.5 overflow-x-auto px-4 py-2.5 lg:hidden"
            style={{ background: C.bgDeep }}
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  className="shrink-0 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    color: on ? "#101010" : C.muted,
                    background: on ? C.orange : C.panel,
                    border: `1px solid ${on ? C.orange : C.line}`,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-7 lg:px-8 lg:py-8">
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

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Dienststart</Kicker>
          <h1 className="mt-3 text-[36px] font-bold uppercase leading-[0.98] tracking-tight">
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-2.5 max-w-lg text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            Drie matches boven inzetgrens staan paraat en één certificaat vraagt om keuring. Alles
            gecontroleerd, alles op post.
          </p>
        </div>
        <Tag fg={C.green} bg={C.greenSoft} rivets>
          Status · Actief
        </Tag>
      </div>

      {/* KPI's */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="relative overflow-hidden p-4">
            <HazardStrip className="absolute inset-x-0 top-0" />
            <p
              className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.muted }}
            >
              {k.label}
            </p>
            <p className="mt-2.5 text-[27px] font-bold tabular-nums leading-none" style={mono}>
              {k.value}
            </p>
            <div className="mt-3.5 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10.5px] font-bold tabular-nums"
                style={{
                  color: k.up ? C.green : C.orange,
                  background: k.up ? C.greenSoft : C.orangeSoft,
                  ...mono,
                }}
              >
                {k.up ? (
                  <ArrowUpRight size={12} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={12} aria-hidden="true" />
                )}
                {k.trend}
              </span>
              <Sparkline data={k.spark} color={k.up ? C.orange : C.hiVis} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Beste matches */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[16px] font-bold uppercase tracking-[0.08em]">Beste matches</h2>
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.muted }}
              >
                Verklaarbaar gerangschikt
              </span>
            </div>
            <Panel>
              <div className="flex flex-col">
                {OPDRACHTEN.map((o, i) => (
                  <button
                    key={o.id}
                    onClick={onOpen}
                    className="group flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-[#2a2d32] focus-visible:outline-none focus-visible:ring-2"
                    style={{
                      borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}`,
                      ...({ ["--tw-ring-color"]: C.orange } as React.CSSProperties),
                    }}
                  >
                    <div
                      className="flex h-11 w-11 shrink-0 flex-col items-center justify-center text-[13px] font-bold tabular-nums"
                      style={{ background: C.orangeSoft, color: C.orange, ...mono }}
                    >
                      {o.match}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-bold">{o.titel}</p>
                      <p
                        className="mt-0.5 truncate text-[11px] uppercase tracking-[0.06em]"
                        style={{ color: C.muted }}
                      >
                        {o.opdrachtgever} · {o.plaats}
                      </p>
                    </div>
                    <span
                      className="hidden text-[12px] font-bold tabular-nums sm:block"
                      style={{ color: C.hiVis, ...mono }}
                    >
                      {o.tarief.replace(" / uur", "")}
                    </span>
                    <ChevronRight
                      size={16}
                      aria-hidden="true"
                      style={{ color: C.faint }}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </button>
                ))}
              </div>
            </Panel>
          </div>

          {/* Berichten */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[16px] font-bold uppercase tracking-[0.08em]">Berichten</h2>
              <Tag fg={C.orange} bg={C.orangeSoft}>
                {ongelezen} ongelezen
              </Tag>
            </div>
            <Panel>
              <div className="flex flex-col">
                {BERICHTEN.map((b, i) => (
                  <div
                    key={b.van}
                    className="flex items-center gap-3.5 px-4 py-3"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center text-[10px] font-bold"
                      style={{
                        background: b.ongelezen ? C.hiVis : C.raise,
                        color: b.ongelezen ? "#101010" : C.muted,
                        ...head,
                      }}
                    >
                      {b.initialen}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[12.5px] font-bold">{b.van}</p>
                        {b.ongelezen && (
                          <span
                            className="h-1.5 w-1.5 shrink-0"
                            style={{ background: C.orange }}
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <p className="truncate text-[11.5px]" style={{ color: C.muted }}>
                        {b.preview}
                      </p>
                    </div>
                    <span
                      className="shrink-0 text-[10px] tabular-nums"
                      style={{ color: C.faint, ...mono }}
                    >
                      {b.tijd}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>

        <div className="space-y-5">
          {/* Certificaten */}
          <div>
            <h2 className="mb-3 text-[16px] font-bold uppercase tracking-[0.08em]">Certificaten</h2>
            <Panel className="p-4">
              <div className="space-y-3.5">
                {CREDENTIALS.map((c) => {
                  const st = statusStyle(c.status);
                  return (
                    <div key={c.naam} className="flex items-start gap-3">
                      <span
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center"
                        style={{ background: st.bg }}
                        aria-hidden="true"
                      >
                        <st.Icon size={13} style={{ color: st.fg }} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-bold">{c.naam}</p>
                        <p
                          className="truncate text-[10.5px] uppercase tracking-[0.06em]"
                          style={{ color: C.muted }}
                        >
                          {c.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          </div>

          {/* Volgende beste stap */}
          <Panel soft className="relative overflow-hidden">
            <div className="px-4 py-3.5" style={{ background: C.orange }}>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{ color: "#101010" }}
              >
                Volgende beste stap
              </p>
              <p
                className="mt-1.5 text-[15px] font-bold uppercase leading-tight"
                style={{ color: "#101010" }}
              >
                {primair.titel}
              </p>
            </div>
            <div className="p-4">
              <p className="text-[12px] leading-relaxed" style={{ color: C.inkSoft }}>
                {primair.detail}
              </p>
              <button
                className="mt-3.5 flex w-full items-center justify-center gap-2 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] transition-transform hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2"
                style={{
                  background: C.hiVis,
                  color: "#101010",
                  ...({ ["--tw-ring-color"]: C.orange } as React.CSSProperties),
                }}
              >
                <Zap size={14} aria-hidden="true" />
                {primair.cta}
              </button>
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
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Kicker color={C.hiVis}>Inzetmarkt</Kicker>
        <h1 className="mt-3 text-[30px] font-bold uppercase leading-tight tracking-tight">
          Open opdrachten
        </h1>
      </div>

      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        <Search size={16} aria-hidden="true" style={{ color: C.orange }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#6c6f73]"
          style={{ color: C.ink, ...mono }}
        />
        <span
          className="text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: C.faint }}
        >
          {filtered.length} / {OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center px-6 py-16 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center"
            style={{ background: C.orangeSoft, border: `1px solid ${C.orange}44` }}
          >
            <Radar size={26} aria-hidden="true" style={{ color: C.orange }} />
          </div>
          <p className="mt-4 text-[17px] font-bold uppercase tracking-[0.06em]">Geen signaal</p>
          <p className="mt-1.5 max-w-sm text-[12px]" style={{ color: C.muted }}>
            Geen opdracht op de radar voor deze zoekterm. Verruim je zoekwoorden of beschikbaarheid
            — we melden zodra er iets passends binnenkomt.
          </p>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group relative overflow-hidden p-4 text-left transition-transform hover:-translate-y-[2px] focus-visible:outline-none focus-visible:ring-2"
              style={{
                background: C.panel,
                border: `1px solid ${C.line}`,
                boxShadow: SHADOW_SM,
                ...({ ["--tw-ring-color"]: C.orange } as React.CSSProperties),
              }}
            >
              <span
                className="absolute left-0 top-0 h-full w-1 transition-colors group-hover:bg-[#ff6a00]"
                style={{ background: C.line }}
                aria-hidden="true"
              />
              <div className="flex items-start justify-between gap-3 pl-2">
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: C.faint, ...mono }}
                >
                  {o.id}
                </span>
                <Tag fg={C.green} bg={C.greenSoft}>
                  {o.match}% match
                </Tag>
              </div>
              <p className="mt-3 pl-2 text-[16px] font-bold uppercase leading-snug tracking-[0.02em]">
                {o.titel}
              </p>
              <p
                className="mt-1.5 flex items-center gap-1.5 pl-2 text-[11px] uppercase tracking-[0.06em]"
                style={{ color: C.muted }}
              >
                <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
              </p>
              <div className="mt-3.5 flex flex-wrap gap-1.5 pl-2">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.1em]"
                    style={{
                      background: C.lineSoft,
                      color: C.inkSoft,
                      border: `1px solid ${C.line}`,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div
                className="mt-4 flex items-center justify-between pl-2 pt-3.5 text-[12px]"
                style={{ borderTop: `1px solid ${C.line}` }}
              >
                <span className="font-bold tabular-nums" style={{ color: C.orange, ...mono }}>
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
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Kicker>{opdracht.id}</Kicker>
          <h1 className="mt-3 text-[29px] font-bold uppercase leading-tight tracking-tight">
            {opdracht.titel}
          </h1>
          <p
            className="mt-2 flex items-center gap-1.5 text-[12px] uppercase tracking-[0.06em]"
            style={{ color: C.muted }}
          >
            <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
        <button
          className="flex shrink-0 items-center gap-2 px-6 py-3 text-[12.5px] font-bold uppercase tracking-[0.1em] transition-transform hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2"
          style={{
            background: C.orange,
            color: "#101010",
            boxShadow: SHADOW_SM,
            ...({ ["--tw-ring-color"]: C.hiVis } as React.CSSProperties),
          }}
        >
          <Send size={15} aria-hidden="true" /> Reageer op opdracht
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief, hi: true },
          { l: "Omvang", v: opdracht.uren, hi: false },
          { l: "Start", v: opdracht.start, hi: false },
          { l: "Match", v: `${opdracht.match}%`, hi: false },
        ].map((m) => (
          <Panel key={m.l} className="relative overflow-hidden p-4">
            {m.hi && <HazardStrip yellow className="absolute inset-x-0 top-0" />}
            <p
              className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.muted }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[16px] font-bold tabular-nums"
              style={{ ...mono, color: m.hi ? C.hiVis : C.ink }}
            >
              {m.v}
            </p>
          </Panel>
        ))}
      </div>

      <Panel className="p-5">
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={18} aria-hidden="true" style={{ color: C.orange }} />
          <h3 className="text-[16px] font-bold uppercase tracking-[0.06em]">Waarom deze match</h3>
        </div>
        <p className="mt-1 text-[11.5px] uppercase tracking-[0.05em]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je profiel — niets verborgen.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div
            className="p-4"
            style={{ background: C.greenSoft, border: `1px solid ${C.green}33` }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.green }}
            >
              Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[12.5px]">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
                    style={{ background: C.green }}
                    aria-hidden="true"
                  >
                    <Check size={11} style={{ color: "#101010" }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div
            className="p-4"
            style={{ background: C.orangeSoft, border: `1px solid ${C.orange}33` }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.orange }}
            >
              Aandachtspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[12.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
                    style={{ background: C.orange }}
                    aria-hidden="true"
                  >
                    <Minus size={11} style={{ color: "#101010" }} />
                  </span>
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
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Kicker>Keuring</Kicker>
        <h1 className="mt-3 text-[30px] font-bold uppercase leading-tight tracking-tight">
          Verificatie
        </h1>
      </div>

      <Panel className="relative flex items-center gap-5 overflow-hidden p-5">
        <HazardStrip className="absolute inset-x-0 top-0" />
        <div
          className="mt-1 flex h-16 w-16 shrink-0 items-center justify-center"
          style={{ background: C.greenSoft, border: `1px solid ${C.green}44` }}
        >
          <ShieldCheck size={28} aria-hidden="true" style={{ color: C.green }} />
        </div>
        <div className="mt-1">
          <p className="text-[20px] font-bold uppercase tracking-[0.04em]">{PROFIEL.trust}</p>
          <p className="mt-0.5 text-[12px]" style={{ color: C.inkSoft }}>
            <span style={{ color: C.green, ...mono }}>{verified}</span> van{" "}
            <span style={mono}>{CREDENTIALS.length}</span> certificaten gekeurd ·{" "}
            <span style={{ color: C.orange, ...mono }}>1</span> vraagt om actie. Alles versleuteld
            bewaard.
          </p>
        </div>
      </Panel>

      <Panel>
        <div className="flex flex-col">
          {CREDENTIALS.map((c, i) => {
            const st = statusStyle(c.status);
            return (
              <div
                key={c.naam}
                className="flex items-center gap-4 px-4 py-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center"
                  style={{ background: st.bg, border: `1px solid ${st.fg}33` }}
                >
                  <st.Icon size={18} aria-hidden="true" style={{ color: st.fg }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-bold">{c.naam}</p>
                  <p className="text-[11.5px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <span
                  className="shrink-0 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: st.fg, background: st.bg, border: `1px solid ${st.fg}33` }}
                >
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Documenten */}
      <div>
        <h2 className="mb-3 text-[16px] font-bold uppercase tracking-[0.08em]">Documentkluis</h2>
        <Panel>
          <div className="flex flex-col">
            {DOCUMENTEN.map((d, i) => {
              const st = statusStyle(d.status);
              return (
                <div
                  key={d.naam}
                  className="flex items-center gap-3.5 px-4 py-3"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center"
                    style={{ background: C.raise, border: `1px solid ${C.line}` }}
                    aria-hidden="true"
                  >
                    <FileText size={15} style={{ color: C.muted }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-bold">{d.naam}</p>
                    <p className="truncate text-[10.5px]" style={{ color: C.muted, ...mono }}>
                      {d.type} · {d.grootte} · {d.bijgewerkt}
                    </p>
                  </div>
                  <span
                    className="shrink-0 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em]"
                    style={{ color: st.fg, background: st.bg }}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Acties() {
  const tone: Record<"warning" | "info", { fg: string; bg: string; Icon: LucideIcon }> = {
    warning: { fg: C.orange, bg: C.orangeSoft, Icon: AlertTriangle },
    info: { fg: C.hiVis, bg: C.hiVisSoft, Icon: Bell },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Kicker>Taakorder</Kicker>
        <h1 className="mt-3 text-[30px] font-bold uppercase leading-tight tracking-tight">
          Volgende acties
        </h1>
        <p className="mt-2 text-[12.5px]" style={{ color: C.inkSoft }}>
          Eén order tegelijk. Wij houden de rest onder toezicht.
        </p>
      </div>
      <div className="space-y-3.5">
        {ACTIES.map((a, i) => {
          const t = tone[a.urgentie];
          return (
            <Panel key={a.titel} className="relative flex items-start gap-4 overflow-hidden p-4">
              <span
                className="absolute left-0 top-0 h-full w-1"
                style={{ background: t.fg }}
                aria-hidden="true"
              />
              <div
                className="ml-1 flex h-11 w-11 shrink-0 items-center justify-center"
                style={{ background: t.bg, border: `1px solid ${t.fg}33` }}
              >
                <t.Icon size={19} aria-hidden="true" style={{ color: t.fg }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-bold tabular-nums"
                    style={{ color: C.faint, ...mono }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[13.5px] font-bold uppercase tracking-[0.03em]">{a.titel}</p>
                </div>
                <p className="mt-0.5 text-[12px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.1em] transition-transform hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2"
                style={{
                  background: t.fg,
                  color: "#101010",
                  ...({ ["--tw-ring-color"]: C.hiVis } as React.CSSProperties),
                }}
              >
                {a.cta}
              </button>
            </Panel>
          );
        })}
      </div>

      <Panel soft className="flex items-center gap-4 p-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center"
          style={{ background: C.greenSoft, border: `1px solid ${C.green}33` }}
        >
          <Check size={18} aria-hidden="true" style={{ color: C.green }} />
        </div>
        <p className="text-[12px] leading-relaxed" style={{ color: C.inkSoft }}>
          Lijst leeg? Post staat. Nieuwe orders verschijnen hier zodra ze relevant worden — je hoeft
          niets zelf te bewaken.
        </p>
      </Panel>
    </div>
  );
}

function Facturen() {
  const statusTone: Record<string, { fg: string; bg: string }> = {
    Betaald: { fg: C.green, bg: C.greenSoft },
    Openstaand: { fg: C.orange, bg: C.orangeSoft },
    Concept: { fg: C.muted, bg: C.lineSoft },
  };
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Afrekening</Kicker>
          <h1 className="mt-3 text-[30px] font-bold uppercase leading-tight tracking-tight">
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 px-5 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.1em] transition-transform hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2"
          style={{
            background: C.orange,
            color: "#101010",
            boxShadow: SHADOW_SM,
            ...({ ["--tw-ring-color"]: C.hiVis } as React.CSSProperties),
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Panel className="overflow-hidden">
        <HazardStrip />
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[9.5px] uppercase tracking-[0.14em]"
                style={{ color: C.muted, borderBottom: `1px solid ${C.line}` }}
              >
                <th className="px-4 py-3 font-bold">Nummer</th>
                <th className="px-4 py-3 font-bold">Klant</th>
                <th className="px-4 py-3 font-bold">Datum</th>
                <th className="px-4 py-3 text-right font-bold">Bedrag</th>
                <th className="px-4 py-3 text-right font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const t = statusTone[f.status] ?? { fg: C.muted, bg: C.lineSoft };
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#2a2d32]"
                    style={{ borderTop: `1px solid ${C.lineSoft}` }}
                  >
                    <td className="px-4 py-3.5 text-[12px]" style={{ color: C.inkSoft, ...mono }}>
                      {f.nr}
                    </td>
                    <td className="px-4 py-3.5 text-[12.5px] font-semibold">{f.klant}</td>
                    <td className="px-4 py-3.5 text-[12px]" style={{ color: C.muted, ...mono }}>
                      {f.datum}
                    </td>
                    <td
                      className="px-4 py-3.5 text-right text-[12.5px] font-bold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em]"
                        style={{ color: t.fg, background: t.bg }}
                      >
                        <span
                          className="h-1.5 w-1.5"
                          style={{ background: t.fg }}
                          aria-hidden="true"
                        />
                        {f.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
