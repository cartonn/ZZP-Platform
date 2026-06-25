"use client";

// Concept 02 — "Orbit" · Ruimtelijke diepte / premium OLED-dark.
// Palet: canvas #08090c, panelen #101218→#15171f, hairline #232634, tekst #e7e9ee,
// muted #8b90a0, luminous accent emerald #34d399 met zachte glow op urgente elementen.
// Fonts: Geist + Geist Mono. Filosofie: diepte = hiërarchie.

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
  ChevronRight,
  ArrowUpRight,
  Check,
  Clock,
  AlertTriangle,
  X,
  MapPin,
  Command,
  Sparkles,
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
  BERICHTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

const C = {
  canvas: "#08090c",
  panel: "#101218",
  panelHi: "#15171f",
  line: "#232634",
  lineSoft: "#1a1c25",
  text: "#e7e9ee",
  muted: "#8b90a0",
  faint: "#5d6273",
  accent: "#34d399",
  accentDim: "#1f7a5a",
};

const ui = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

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

function statusStyle(s: CredStatus): { label: string; fg: string; glow: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: "#34d399", glow: "#34d39955" };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: "#60a5fa", glow: "#60a5fa55" };
    case "EXPIRING":
      return { label: "Verloopt bijna", fg: "#fbbf24", glow: "#fbbf2455" };
    case "REJECTED":
      return { label: "Afgewezen", fg: "#f87171", glow: "#f8717155" };
  }
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 104;
  const h = 32;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * h;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs>
        <linearGradient id="orbit-spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.accent} stopOpacity={0.28} />
          <stop offset="100%" stopColor={C.accent} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#orbit-spark)" />
      <polyline
        points={line}
        fill="none"
        stroke={C.accent}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 3px #34d39988)" }}
      />
    </svg>
  );
}

function Panel({
  children,
  raised,
  className = "",
}: {
  children: React.ReactNode;
  raised?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative rounded-2xl border ${className}`}
      style={{
        borderColor: C.line,
        background: raised ? `linear-gradient(180deg, ${C.panelHi}, ${C.panel})` : C.panel,
        boxShadow: raised
          ? "0 10px 30px -12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)"
          : "inset 0 1px 0 rgba(255,255,255,0.02)",
      }}
    >
      {/* lichtlijn bovenaan */}
      <div
        className="pointer-events-none absolute inset-x-6 top-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)",
        }}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}

export function Concept02() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[640px] w-full antialiased"
      style={{ ...ui, background: C.canvas, color: C.text }}
    >
      <div className="flex min-h-[640px]">
        {/* Sidebar */}
        <aside
          className="hidden w-60 shrink-0 flex-col px-3 py-5 md:flex"
          style={{ background: C.canvas, borderRight: `1px solid ${C.lineSoft}` }}
        >
          <div className="flex items-center gap-2.5 px-2 pb-7">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[13px] font-semibold"
              style={{
                background: `linear-gradient(135deg, ${C.accent}, ${C.accentDim})`,
                color: "#04140d",
                boxShadow: "0 0 16px -2px #34d39966",
              }}
            >
              Z
            </div>
            <span className="text-[14px] font-semibold tracking-tight">Orbit</span>
          </div>

          <nav className="flex flex-col gap-1">
            {SCREENS.map((s) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
                  style={{
                    color: on ? C.text : C.muted,
                    background: on ? C.panelHi : "transparent",
                    border: `1px solid ${on ? C.line : "transparent"}`,
                    boxShadow: on ? "inset 0 1px 0 rgba(255,255,255,0.04)" : "none",
                  }}
                >
                  {on && (
                    <span
                      className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full"
                      style={{ background: C.accent, boxShadow: "0 0 8px #34d399" }}
                      aria-hidden="true"
                    />
                  )}
                  <Icon size={16} aria-hidden="true" style={{ color: on ? C.accent : C.faint }} />
                  {s.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto px-1">
            <Panel raised className="px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-semibold"
                  style={{ background: C.accentDim, color: C.accent, ...mono }}
                >
                  {PROFIEL.initialen}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-semibold">{PROFIEL.naam}</div>
                  <div
                    className="flex items-center gap-1 truncate text-[11px]"
                    style={{ color: C.accent }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: C.accent, boxShadow: "0 0 6px #34d399" }}
                      aria-hidden="true"
                    />
                    {PROFIEL.trust}
                  </div>
                </div>
              </div>
            </Panel>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header
            className="flex h-14 shrink-0 items-center gap-3 px-5"
            style={{ borderBottom: `1px solid ${C.lineSoft}` }}
          >
            <h1 className="text-[15px] font-semibold tracking-tight">
              {SCREENS.find((s) => s.key === screen)?.label}
            </h1>
            <div className="ml-auto flex items-center gap-2">
              <button
                className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
                style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.muted }}
                aria-label="Commandobalk openen"
              >
                <Command size={13} aria-hidden="true" />
                <span>Zoek of spring naar…</span>
                <kbd
                  className="rounded px-1 text-[10.5px]"
                  style={{ background: C.panelHi, color: C.faint, ...mono }}
                >
                  ⌘K
                </kbd>
              </button>
              <button
                className="relative rounded-xl p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
                style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.muted }}
                aria-label="Meldingen"
              >
                <Bell size={15} aria-hidden="true" />
                <span
                  className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
                  style={{ background: C.accent, boxShadow: "0 0 6px #34d399" }}
                  aria-hidden="true"
                />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-6">
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

function Heading({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-[16px] font-semibold tracking-tight">{children}</h2>
      {sub && (
        <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Urgente, naar voren komende kaart */}
      <Panel raised className="overflow-hidden px-5 py-4">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(120% 100% at 0% 0%, rgba(251,191,36,0.10), transparent 60%)",
          }}
          aria-hidden="true"
        />
        <div className="relative flex items-start gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: "#2a230f", boxShadow: "0 0 18px -4px #fbbf2455" }}
          >
            <AlertTriangle size={17} aria-hidden="true" style={{ color: "#fbbf24" }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold">
              VOG verloopt over <span style={mono}>23</span> dagen
            </p>
            <p className="text-[12.5px]" style={{ color: C.muted }}>
              Vraag tijdig een nieuwe aan om geverifieerd te blijven.
            </p>
          </div>
          <button
            className="shrink-0 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60"
            style={{ background: "#fbbf24", color: "#1a1405" }}
          >
            Vernieuwen
          </button>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Panel key={k.label} raised={i === 0} className="p-4">
            <p className="text-[12px] font-medium" style={{ color: C.muted }}>
              {k.label}
            </p>
            <p
              className="mt-1.5 text-[26px] font-semibold leading-none tracking-tight"
              style={mono}
            >
              {k.value}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-0.5 text-[11.5px] font-medium"
                style={{ color: k.up ? C.accent : C.muted, ...mono }}
              >
                <ArrowUpRight size={12} aria-hidden="true" />
                {k.trend}
              </span>
              <Sparkline data={k.spark} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Heading sub="Verklaarbaar gesorteerd op match-score">Beste matches</Heading>
          <Panel className="divide-y overflow-hidden">
            {OPDRACHTEN.map((o, idx) => (
              <button
                key={o.id}
                onClick={onOpen}
                className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-[#15171f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-400/50"
                style={{ borderColor: C.lineSoft, borderTopWidth: idx === 0 ? 0 : 1 }}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold">{o.titel}</p>
                  <p className="mt-0.5 truncate text-[12px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats} · {o.uren}
                  </p>
                </div>
                <span className="text-[13px] font-medium" style={mono}>
                  {o.tarief}
                </span>
                <span
                  className="inline-flex items-center rounded-lg px-2 py-1 text-[12px] font-semibold"
                  style={{
                    background: "#0e231b",
                    color: C.accent,
                    boxShadow: "inset 0 0 0 1px #1f7a5a55",
                    ...mono,
                  }}
                >
                  {o.match}%
                </span>
                <ChevronRight size={16} aria-hidden="true" style={{ color: C.faint }} />
              </button>
            ))}
          </Panel>
        </div>

        <div>
          <Heading sub="Je verifieerbare bewijs">Credentials</Heading>
          <Panel className="space-y-3 p-4">
            {CREDENTIALS.map((c) => {
              const st = statusStyle(c.status);
              return (
                <div key={c.naam} className="flex items-start gap-2.5">
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ background: st.fg, boxShadow: `0 0 6px ${st.glow}` }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium">{c.naam}</p>
                    <p className="truncate text-[11.5px]" style={{ color: C.muted }}>
                      {c.detail}
                    </p>
                  </div>
                </div>
              );
            })}
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
      o.plaats.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Heading sub="Open opdrachten, ruimtelijk gerangschikt op relevantie">Marktplaats</Heading>

      <Panel className="flex items-center gap-2 px-3 py-2">
        <Search size={15} aria-hidden="true" style={{ color: C.faint }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel of plaats…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none"
          style={{ color: C.text }}
        />
      </Panel>

      {filtered.length === 0 ? (
        <Panel className="px-6 py-14 text-center">
          <Sparkles size={22} aria-hidden="true" style={{ color: C.faint, margin: "0 auto" }} />
          <p className="mt-2 text-[14px] font-semibold">Geen opdrachten gevonden</p>
          <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
            Verbreed je beschikbaarheid of pas je zoekopdracht aan.
          </p>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filtered.map((o, idx) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none"
            >
              <Panel raised={idx === 0} className="h-full p-4">
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="text-[10.5px] font-medium tracking-wide"
                    style={{ color: C.faint, ...mono }}
                  >
                    {o.id}
                  </span>
                  <span
                    className="inline-flex items-center rounded-lg px-2 py-0.5 text-[12px] font-semibold"
                    style={{
                      background: "#0e231b",
                      color: C.accent,
                      boxShadow: "inset 0 0 0 1px #1f7a5a55",
                      ...mono,
                    }}
                  >
                    {o.match}% match
                  </span>
                </div>
                <p className="mt-2 text-[14px] font-semibold leading-snug">{o.titel}</p>
                <p
                  className="mt-1 flex items-center gap-1.5 text-[12px]"
                  style={{ color: C.muted }}
                >
                  <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-md px-1.5 py-0.5 text-[11px]"
                      style={{
                        background: C.panelHi,
                        color: C.muted,
                        border: `1px solid ${C.line}`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div
                  className="mt-3 flex items-center justify-between border-t pt-3 text-[12.5px]"
                  style={{ borderColor: C.lineSoft }}
                >
                  <span className="font-semibold" style={mono}>
                    {o.tarief}
                  </span>
                  <span style={{ color: C.muted, ...mono }}>{o.uren}</span>
                </div>
              </Panel>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht }: { opdracht: (typeof OPDRACHTEN)[number] }) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span
            className="text-[10.5px] font-medium tracking-wide"
            style={{ color: C.faint, ...mono }}
          >
            {opdracht.id}
          </span>
          <h2 className="mt-1 text-[22px] font-semibold tracking-tight">{opdracht.titel}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-[13px]" style={{ color: C.muted }}>
            <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
        <button
          className="shrink-0 rounded-xl px-4 py-2.5 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
          style={{ background: C.accent, color: "#04140d", boxShadow: "0 0 22px -6px #34d39988" }}
        >
          Reageer op opdracht
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m, i) => (
          <Panel key={m.l} raised={i === 3} className="p-3.5">
            <p className="text-[11.5px] font-medium" style={{ color: C.muted }}>
              {m.l}
            </p>
            <p
              className="mt-1 text-[16px] font-semibold tracking-tight"
              style={{ ...mono, color: i === 3 ? C.accent : C.text }}
            >
              {m.v}
            </p>
          </Panel>
        ))}
      </div>

      <Panel raised className="p-5">
        <h3 className="text-[14px] font-semibold">Waarom deze match</h3>
        <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je profiel.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: C.accent }}
            >
              Pluspunten
            </p>
            <ul className="mt-2 space-y-1.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2 text-[13px]">
                  <Check size={15} aria-hidden="true" style={{ color: C.accent, marginTop: 1 }} />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: "#fbbf24" }}
            >
              Aandachtspunten
            </p>
            <ul className="mt-2 space-y-1.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2 text-[13px]"
                  style={{ color: C.muted }}
                >
                  <X size={15} aria-hidden="true" style={{ color: "#fbbf24", marginTop: 1 }} />
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
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Heading sub="Server-side bepaald — de bron van je vertrouwensniveau">Verificatie</Heading>

      <Panel raised className="flex items-center gap-4 p-5">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: "#0e231b", boxShadow: "0 0 26px -4px #34d39966" }}
        >
          <ShieldCheck size={26} aria-hidden="true" style={{ color: C.accent }} />
        </div>
        <div>
          <p className="text-[16px] font-semibold">{PROFIEL.trust}</p>
          <p className="text-[12.5px]" style={{ color: C.muted }}>
            <span style={mono}>2</span> van <span style={mono}>4</span> geverifieerd ·{" "}
            <span style={mono}>1</span> vraagt actie
          </p>
        </div>
      </Panel>

      <Panel className="divide-y overflow-hidden">
        {CREDENTIALS.map((c, idx) => {
          const st = statusStyle(c.status);
          return (
            <div
              key={c.naam}
              className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-[#15171f]"
              style={{ borderColor: C.lineSoft, borderTopWidth: idx === 0 ? 0 : 1 }}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: C.panelHi, boxShadow: `inset 0 0 0 1px ${st.glow}` }}
              >
                {c.status === "VERIFIED" ? (
                  <Check size={16} aria-hidden="true" style={{ color: st.fg }} />
                ) : c.status === "SUBMITTED" ? (
                  <Clock size={16} aria-hidden="true" style={{ color: st.fg }} />
                ) : (
                  <AlertTriangle size={16} aria-hidden="true" style={{ color: st.fg }} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold">{c.naam}</p>
                <p className="text-[12px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <span
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11.5px] font-semibold"
                style={{ background: C.panelHi, color: st.fg, border: `1px solid ${C.line}` }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: st.fg, boxShadow: `0 0 6px ${st.glow}` }}
                  aria-hidden="true"
                />
                {st.label}
              </span>
            </div>
          );
        })}
      </Panel>
    </div>
  );
}

function Acties() {
  const tone: Record<"warning" | "info", { fg: string; glow: string; Icon: LucideIcon }> = {
    warning: { fg: "#fbbf24", glow: "#fbbf2455", Icon: AlertTriangle },
    info: { fg: C.accent, glow: "#34d39955", Icon: Bell },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Heading sub="Wat naar voren komt vraagt nu jouw aandacht">Volgende acties</Heading>
      <div className="space-y-3">
        {ACTIES.map((a, i) => {
          const t = tone[a.urgentie];
          return (
            <button key={a.titel} className="block w-full text-left focus-visible:outline-none">
              <Panel raised={i === 0} className="flex items-start gap-3.5 p-4">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: C.panelHi, boxShadow: `0 0 16px -4px ${t.glow}` }}
                >
                  <t.Icon size={17} aria-hidden="true" style={{ color: t.fg }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold">{a.titel}</p>
                  <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                    {a.detail}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-lg px-3 py-1.5 text-[12.5px] font-medium"
                  style={{ background: C.panelHi, color: C.text, border: `1px solid ${C.line}` }}
                >
                  {a.cta}
                </span>
              </Panel>
            </button>
          );
        })}
      </div>

      {/* Berichten — extra */}
      <Heading sub="Recente gesprekken met opdrachtgevers">Berichten</Heading>
      <Panel className="divide-y overflow-hidden">
        {BERICHTEN.map((b, idx) => (
          <div
            key={b.van}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#15171f]"
            style={{ borderColor: C.lineSoft, borderTopWidth: idx === 0 ? 0 : 1 }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold"
              style={{ background: C.panelHi, color: C.muted, ...mono }}
            >
              {b.initialen}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-semibold">{b.van}</p>
              <p className="truncate text-[12px]" style={{ color: C.muted }}>
                {b.preview}
              </p>
            </div>
            {b.ongelezen && (
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: C.accent, boxShadow: "0 0 6px #34d399" }}
                aria-hidden="true"
              />
            )}
            <span className="text-[11px]" style={{ color: C.faint, ...mono }}>
              {b.tijd}
            </span>
          </div>
        ))}
      </Panel>
    </div>
  );
}

function Facturen() {
  const tone: Record<string, { fg: string; glow: string }> = {
    Betaald: { fg: C.accent, glow: "#34d39955" },
    Openstaand: { fg: "#fbbf24", glow: "#fbbf2455" },
    Concept: { fg: C.muted, glow: "#8b90a033" },
  };
  const fallbackTone = { fg: C.muted, glow: "#8b90a033" };
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Heading sub="Overzicht van je verstuurde en openstaande facturen">Facturen</Heading>
      <Panel className="overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[11px] uppercase tracking-wide"
              style={{ color: C.faint, borderBottom: `1px solid ${C.line}` }}
            >
              <th className="px-4 py-2.5 font-medium">Nummer</th>
              <th className="px-4 py-2.5 font-medium">Klant</th>
              <th className="px-4 py-2.5 font-medium">Datum</th>
              <th className="px-4 py-2.5 text-right font-medium">Bedrag</th>
              <th className="px-4 py-2.5 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const t = tone[f.status] ?? fallbackTone;
              return (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-[#15171f]"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                >
                  <td className="px-4 py-3 text-[12.5px] font-medium" style={mono}>
                    {f.nr}
                  </td>
                  <td className="px-4 py-3 text-[13px]">{f.klant}</td>
                  <td className="px-4 py-3 text-[12.5px]" style={{ color: C.muted, ...mono }}>
                    {f.datum}
                  </td>
                  <td
                    className="px-4 py-3 text-right text-[13px] font-semibold tabular-nums"
                    style={mono}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[11.5px] font-semibold"
                      style={{ background: C.panelHi, color: t.fg, border: `1px solid ${C.line}` }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: t.fg, boxShadow: `0 0 5px ${t.glow}` }}
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
      </Panel>
    </div>
  );
}
