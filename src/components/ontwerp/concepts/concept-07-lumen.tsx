"use client";

// Concept 07 — "Lumen" · Glas & vibrancy — visionOS-diepte.
// Translucente, gematteerde zwevende panelen boven een zachte gradient-backdrop. Diepte ontstaat
// uit gelaagd glas met contrast-bewaakte tekst (altijd leesbaar dankzij een subtiele donkere scrim).
// Palet: backdrop #0b1020 → #131a33, glas rgba(255,255,255,0.06–0.1), hairline rgba(255,255,255,0.12),
// inkt #eaf0fb, muted #aab4cf, accent sky #38bdf8, accent2 #818cf8. Fonts: Sora + Inter.

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
  ArrowDownRight,
  Check,
  Clock,
  AlertTriangle,
  X,
  MapPin,
  FileText,
  Plus,
  Sparkles,
  Command,
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
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

const C = {
  ink: "#eaf0fb",
  muted: "#aab4cf",
  faint: "#7e88a6",
  accent: "#38bdf8",
  accent2: "#818cf8",
  line: "rgba(255,255,255,0.12)",
  lineSoft: "rgba(255,255,255,0.07)",
  glass: "rgba(255,255,255,0.06)",
  glassUp: "rgba(255,255,255,0.10)",
  scrim: "rgba(8,12,24,0.42)",
};

const display = { fontFamily: "var(--font-lab-sora)" };
const ui = { fontFamily: "var(--font-lab-inter)" };

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: FileText,
  berichten: Bell,
};

// Glaspaneel — gelaagde translucentie met hairline lichtrand en bovenlicht.
function glassStyle(up = false): React.CSSProperties {
  return {
    background: up ? C.glassUp : C.glass,
    border: `1px solid ${C.line}`,
    backdropFilter: "blur(20px) saturate(140%)",
    WebkitBackdropFilter: "blur(20px) saturate(140%)",
    boxShadow: "0 1px 0 rgba(255,255,255,0.10) inset, 0 12px 40px -12px rgba(0,0,0,0.55)",
  };
}

function statusStyle(s: CredStatus): { label: string; fg: string; bg: string; dot: string } {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        fg: "#6ee7b7",
        bg: "rgba(16,185,129,0.14)",
        dot: "#34d399",
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        fg: "#c7d2fe",
        bg: "rgba(129,140,248,0.16)",
        dot: C.accent2,
      };
    case "EXPIRING":
      return {
        label: "Verloopt bijna",
        fg: "#fcd34d",
        bg: "rgba(245,158,11,0.15)",
        dot: "#fbbf24",
      };
    case "REJECTED":
      return { label: "Afgewezen", fg: "#fca5a5", bg: "rgba(239,68,68,0.15)", dot: "#f87171" };
  }
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 100;
  const h = 30;
  const id = `lum-${color.replace(/[^a-z0-9]/gi, "")}`;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * h;
    return [x, y] as const;
  });
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Concept07() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [cmd, setCmd] = useState(false);
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[640px] w-full overflow-hidden antialiased"
      style={{ ...ui, color: C.ink, background: "#0b1020" }}
    >
      {/* Fotografische / gradient backdrop met zachte lichtbollen */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 520px at 18% -8%, rgba(56,189,248,0.22), transparent 60%)," +
            "radial-gradient(820px 600px at 92% 6%, rgba(129,140,248,0.20), transparent 58%)," +
            "radial-gradient(700px 700px at 70% 110%, rgba(56,189,248,0.10), transparent 60%)," +
            "linear-gradient(160deg, #0b1020 0%, #131a33 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <div className="relative flex min-h-[640px] gap-0 p-3 sm:p-4">
        {/* Sidebar — zwevend glaspaneel */}
        <aside
          className="hidden w-60 shrink-0 flex-col rounded-2xl px-3 py-5 md:flex"
          style={glassStyle()}
        >
          <div className="flex items-center gap-2.5 px-2 pb-6">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl text-[14px] font-semibold text-white"
              style={{
                background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
                boxShadow: "0 6px 18px -6px rgba(56,189,248,0.6)",
              }}
            >
              Z
            </div>
            <span className="text-[14px] font-semibold tracking-tight" style={display}>
              ZZP Platform
            </span>
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
                  className="group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 motion-safe:duration-200"
                  style={{
                    color: on ? C.ink : C.muted,
                    background: on ? "rgba(56,189,248,0.14)" : "transparent",
                    border: `1px solid ${on ? "rgba(56,189,248,0.30)" : "transparent"}`,
                  }}
                >
                  <Icon size={16} aria-hidden="true" style={{ color: on ? C.accent : C.faint }} />
                  {s.label}
                  {on && (
                    <span
                      className="ml-auto h-1.5 w-1.5 rounded-full"
                      style={{ background: C.accent, boxShadow: `0 0 8px ${C.accent}` }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto">
            <div
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-2.5"
              style={{ background: C.lineSoft, border: `1px solid ${C.line}` }}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold text-white"
                style={{ background: `linear-gradient(135deg, ${C.accent2}, ${C.accent})` }}
              >
                {PROFIEL.initialen}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-semibold">{PROFIEL.naam}</div>
                <div
                  className="flex items-center gap-1 truncate text-[11px]"
                  style={{ color: C.faint }}
                >
                  <ShieldCheck size={11} aria-hidden="true" style={{ color: "#34d399" }} />
                  {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col md:pl-3">
          {/* Topbar — zwevende command bar */}
          <header
            className="mb-3 flex h-14 shrink-0 items-center gap-3 rounded-2xl px-4"
            style={glassStyle()}
          >
            <div className="flex items-center gap-1.5 text-[13px]" style={{ color: C.muted }}>
              <span className="hidden sm:inline">{PROFIEL.rol.split(" · ")[0]}</span>
              <ChevronRight
                size={14}
                aria-hidden="true"
                className="hidden sm:inline"
                style={{ color: C.faint }}
              />
              <span className="font-semibold" style={{ color: C.ink }}>
                {SCREENS.find((s) => s.key === screen)?.label}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setCmd(true)}
                className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70"
                style={{ background: C.glass, border: `1px solid ${C.line}`, color: C.muted }}
                aria-label="Opdrachtenpalet openen"
              >
                <Search size={14} aria-hidden="true" />
                <span className="hidden sm:inline">Zoek of spring naar…</span>
                <kbd
                  className="rounded-md px-1.5 text-[10.5px]"
                  style={{ background: C.lineSoft, border: `1px solid ${C.line}` }}
                >
                  ⌘K
                </kbd>
              </button>
              <button
                className="relative rounded-xl p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70"
                style={{ background: C.glass, border: `1px solid ${C.line}`, color: C.muted }}
                aria-label="Meldingen"
              >
                <Bell size={15} aria-hidden="true" />
                <span
                  className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
                  style={{ background: C.accent, boxShadow: `0 0 6px ${C.accent}` }}
                  aria-hidden="true"
                />
              </button>
            </div>
          </header>

          {/* Tabs — mobiel zichtbaar */}
          <div className="mb-3 flex gap-1.5 overflow-x-auto md:hidden">
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  className="shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70"
                  style={{
                    color: on ? C.ink : C.muted,
                    background: on ? "rgba(56,189,248,0.16)" : C.glass,
                    border: `1px solid ${on ? "rgba(56,189,248,0.32)" : C.line}`,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto pb-2">
            {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
            {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
            {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties />}
            {screen === "facturen" && <Facturen />}
          </div>
        </main>
      </div>

      {/* Command-palet overlay */}
      {cmd && (
        <div
          className="absolute inset-0 z-50 flex items-start justify-center px-4 pt-24"
          style={{ background: "rgba(6,10,22,0.55)", backdropFilter: "blur(6px)" }}
          onClick={() => setCmd(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Opdrachtenpalet"
            className="w-full max-w-lg rounded-2xl p-2"
            style={glassStyle(true)}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
              style={{ background: C.glass, border: `1px solid ${C.line}` }}
            >
              <Command size={15} aria-hidden="true" style={{ color: C.accent }} />
              <input
                autoFocus
                placeholder="Zoek opdrachten, certificaten of facturen…"
                aria-label="Zoeken"
                className="w-full bg-transparent text-[13px] outline-none"
                style={{ color: C.ink }}
              />
              <kbd
                className="rounded-md px-1.5 text-[10.5px]"
                style={{ background: C.lineSoft, border: `1px solid ${C.line}`, color: C.muted }}
              >
                esc
              </kbd>
            </div>
            <div
              className="px-2 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-wider"
              style={{ color: C.faint }}
            >
              Snel naar
            </div>
            <div className="space-y-0.5">
              {SCREENS.map((s) => {
                const Icon = NAV_ICONS[s.key];
                return (
                  <button
                    key={s.key}
                    onClick={() => {
                      setScreen(s.key);
                      setCmd(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70"
                    style={{ color: C.ink }}
                  >
                    <Icon size={15} aria-hidden="true" style={{ color: C.accent }} />
                    {s.label}
                    <ChevronRight
                      size={14}
                      aria-hidden="true"
                      className="ml-auto"
                      style={{ color: C.faint }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Scrim({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  // Subtiele donkere scrim achter tekst op glas — garandeert leesbaar contrast.
  return <div className={className}>{children}</div>;
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-[17px] font-semibold tracking-tight" style={display}>
        {children}
      </h2>
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
    <Scrim className="mx-auto max-w-5xl space-y-5">
      {/* Waarschuwingsbanner */}
      <div
        className="flex items-start gap-3 rounded-2xl px-4 py-3.5"
        style={{
          ...glassStyle(),
          borderColor: "rgba(245,158,11,0.35)",
          background: "linear-gradient(90deg, rgba(245,158,11,0.16), rgba(255,255,255,0.05))",
        }}
      >
        <AlertTriangle size={17} aria-hidden="true" style={{ color: "#fbbf24", marginTop: 1 }} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold" style={{ color: "#fde68a" }}>
            Je VOG verloopt over <span className="tabular-nums">23</span> dagen
          </p>
          <p className="text-[12.5px]" style={{ color: C.muted }}>
            Vraag tijdig een nieuwe aan om verifieerbaar te blijven voor opdrachtgevers.
          </p>
        </div>
        <button
          className="shrink-0 rounded-xl px-3.5 py-1.5 text-[12.5px] font-semibold text-[#1a1206] transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 motion-reduce:hover:scale-100"
          style={{ background: "#fbbf24" }}
        >
          Vernieuwen
        </button>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <div
            key={k.label}
            className="group rounded-2xl p-4 transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
            style={glassStyle()}
          >
            <p className="text-[12px] font-medium" style={{ color: C.muted }}>
              {k.label}
            </p>
            <div className="mt-1.5 flex items-end justify-between">
              <span
                className="text-[26px] font-semibold tabular-nums leading-none tracking-tight"
                style={display}
              >
                {k.value}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
                style={{
                  color: k.up ? "#6ee7b7" : C.muted,
                  background: k.up ? "rgba(16,185,129,0.14)" : C.lineSoft,
                }}
              >
                {k.up ? (
                  <ArrowUpRight size={12} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={12} aria-hidden="true" />
                )}
                {k.trend}
              </span>
              <Sparkline data={k.spark} color={i % 2 === 0 ? C.accent : C.accent2} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Matches */}
        <div className="lg:col-span-2">
          <SectionTitle sub="Verklaarbaar gesorteerd op match-score">Beste matches</SectionTitle>
          <div className="space-y-2.5">
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={onOpen}
                className="flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left transition-all hover:bg-white/[0.10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70"
                style={glassStyle()}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold">{o.titel}</p>
                  <p className="mt-0.5 truncate text-[12px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats} · {o.uren}
                  </p>
                </div>
                <span className="text-[13px] font-medium tabular-nums" style={{ color: C.ink }}>
                  {o.tarief}
                </span>
                <span
                  className="inline-flex items-center justify-center rounded-lg px-2 py-1 text-[12px] font-semibold tabular-nums"
                  style={{
                    background: "rgba(56,189,248,0.16)",
                    color: C.accent,
                    border: "1px solid rgba(56,189,248,0.30)",
                  }}
                >
                  {o.match}%
                </span>
                <ChevronRight size={16} aria-hidden="true" style={{ color: C.faint }} />
              </button>
            ))}
          </div>
        </div>

        {/* Credentials samenvatting */}
        <div>
          <SectionTitle sub="Je verifieerbare bewijs">Credentials</SectionTitle>
          <div className="space-y-2.5 rounded-2xl p-4" style={glassStyle()}>
            {CREDENTIALS.map((c) => {
              const st = statusStyle(c.status);
              return (
                <div key={c.naam} className="flex items-start gap-2.5">
                  <span
                    className="mt-1 h-2 w-2 shrink-0 rounded-full"
                    style={{ background: st.dot, boxShadow: `0 0 8px ${st.dot}` }}
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
          </div>
        </div>
      </div>
    </Scrim>
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
      <SectionTitle sub="Open opdrachten in de zorg, gefilterd op jouw profiel">
        Marktplaats
      </SectionTitle>

      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5" style={glassStyle()}>
          <Search size={15} aria-hidden="true" style={{ color: C.faint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel of plaats…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none"
            style={{ color: C.ink }}
          />
        </div>
        {["Per 1 juli", "Avond", "BIG"].map((f) => (
          <span
            key={f}
            className="hidden rounded-xl px-3 py-2.5 text-[12px] font-medium sm:inline"
            style={{ background: C.glass, border: `1px solid ${C.line}`, color: C.muted }}
          >
            {f}
          </span>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl px-6 py-16 text-center" style={glassStyle()}>
          <div
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: "rgba(56,189,248,0.14)" }}
          >
            <Search size={20} aria-hidden="true" style={{ color: C.accent }} />
          </div>
          <p className="text-[14px] font-semibold">Geen opdrachten gevonden</p>
          <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
            Pas je zoekopdracht aan of verbreed je beschikbaarheid.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group rounded-2xl p-4 text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 motion-reduce:hover:translate-y-0"
              style={glassStyle()}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className="text-[10.5px] font-medium tabular-nums tracking-wide"
                  style={{ color: C.faint }}
                >
                  {o.id}
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[12px] font-semibold tabular-nums"
                  style={{
                    background: "rgba(56,189,248,0.16)",
                    color: C.accent,
                    border: "1px solid rgba(56,189,248,0.30)",
                  }}
                >
                  <Sparkles size={11} aria-hidden="true" /> {o.match}%
                </span>
              </div>
              <p className="mt-2 text-[14px] font-semibold leading-snug">{o.titel}</p>
              <p className="mt-1 flex items-center gap-1.5 text-[12px]" style={{ color: C.muted }}>
                <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md px-1.5 py-0.5 text-[11px]"
                    style={{
                      background: C.lineSoft,
                      border: `1px solid ${C.line}`,
                      color: C.muted,
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
                <span className="font-semibold tabular-nums">{o.tarief}</span>
                <span className="tabular-nums" style={{ color: C.muted }}>
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
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span
            className="text-[10.5px] font-medium tabular-nums tracking-wide"
            style={{ color: C.faint }}
          >
            {opdracht.id}
          </span>
          <h2 className="mt-1 text-[23px] font-semibold tracking-tight" style={display}>
            {opdracht.titel}
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-[13px]" style={{ color: C.muted }}>
            <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
        <button
          className="shrink-0 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 motion-reduce:hover:scale-100"
          style={{
            background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
            boxShadow: "0 10px 28px -10px rgba(56,189,248,0.6)",
          }}
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
        ].map((m) => (
          <div key={m.l} className="rounded-2xl p-3.5" style={glassStyle()}>
            <p className="text-[11.5px] font-medium" style={{ color: C.muted }}>
              {m.l}
            </p>
            <p
              className="mt-1 text-[16px] font-semibold tabular-nums tracking-tight"
              style={display}
            >
              {m.v}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-5" style={glassStyle()}>
        <div className="flex items-center gap-2">
          <Sparkles size={16} aria-hidden="true" style={{ color: C.accent }} />
          <h3 className="text-[14px] font-semibold" style={display}>
            Waarom deze match
          </h3>
        </div>
        <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je profiel.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: "#6ee7b7" }}
            >
              Pluspunten
            </p>
            <ul className="mt-2 space-y-1.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2 text-[13px]">
                  <Check size={15} aria-hidden="true" style={{ color: "#34d399", marginTop: 1 }} />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: "#fcd34d" }}
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
      </div>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <SectionTitle sub="Server-side bepaald — de bron van je vertrouwensniveau">
        Verificatie
      </SectionTitle>

      <div className="flex items-center gap-4 rounded-2xl p-5" style={glassStyle()}>
        <div
          className="relative flex h-16 w-16 items-center justify-center rounded-full"
          style={{
            background: "rgba(16,185,129,0.14)",
            border: "1px solid rgba(52,211,153,0.4)",
            boxShadow: "0 0 26px -6px rgba(52,211,153,0.55)",
          }}
        >
          <ShieldCheck size={28} aria-hidden="true" style={{ color: "#34d399" }} />
        </div>
        <div>
          <p className="text-[17px] font-semibold" style={display}>
            {PROFIEL.trust}
          </p>
          <p className="text-[12.5px]" style={{ color: C.muted }}>
            <span className="tabular-nums">{verified}</span> van{" "}
            <span className="tabular-nums">{CREDENTIALS.length}</span> credentials volledig
            geverifieerd · <span className="tabular-nums">1</span> vraagt actie
          </p>
        </div>
        <div
          className="ml-auto hidden rounded-xl px-3 py-1.5 text-[11.5px] font-semibold sm:block"
          style={{
            background: "rgba(16,185,129,0.14)",
            color: "#6ee7b7",
            border: "1px solid rgba(52,211,153,0.3)",
          }}
        >
          Zegel actief
        </div>
      </div>

      <div className="space-y-2.5">
        {CREDENTIALS.map((c) => {
          const st = statusStyle(c.status);
          return (
            <div
              key={c.naam}
              className="flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-colors hover:bg-white/[0.10]"
              style={glassStyle()}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: st.bg }}
              >
                {c.status === "VERIFIED" ? (
                  <Check size={17} aria-hidden="true" style={{ color: st.dot }} />
                ) : c.status === "SUBMITTED" ? (
                  <Clock size={17} aria-hidden="true" style={{ color: st.dot }} />
                ) : (
                  <AlertTriangle size={17} aria-hidden="true" style={{ color: st.dot }} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold">{c.naam}</p>
                <p className="text-[12px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <span
                className="inline-flex items-center rounded-lg px-2.5 py-1 text-[11.5px] font-semibold"
                style={{ background: st.bg, color: st.fg }}
              >
                {st.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Acties() {
  const tone: Record<
    "warning" | "info",
    { fg: string; bg: string; border: string; Icon: LucideIcon }
  > = {
    warning: {
      fg: "#fcd34d",
      bg: "rgba(245,158,11,0.15)",
      border: "rgba(245,158,11,0.35)",
      Icon: AlertTriangle,
    },
    info: {
      fg: C.accent,
      bg: "rgba(56,189,248,0.15)",
      border: "rgba(56,189,248,0.32)",
      Icon: Bell,
    },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <SectionTitle sub="Wat vraagt nu jouw aandacht — op prioriteit gesorteerd">
        Volgende acties
      </SectionTitle>
      <div className="space-y-3">
        {ACTIES.map((a) => {
          const t = tone[a.urgentie];
          return (
            <div
              key={a.titel}
              className="flex items-start gap-3.5 rounded-2xl p-4 transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
              style={glassStyle()}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: t.bg, border: `1px solid ${t.border}` }}
              >
                <t.Icon size={18} aria-hidden="true" style={{ color: t.fg }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold">{a.titel}</p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 rounded-xl px-3 py-1.5 text-[12.5px] font-semibold transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70"
                style={{ background: C.glass, border: `1px solid ${C.line}`, color: C.ink }}
              >
                {a.cta}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Facturen() {
  const statusTone: Record<string, { fg: string; bg: string }> = {
    Betaald: { fg: "#6ee7b7", bg: "rgba(16,185,129,0.14)" },
    Openstaand: { fg: "#fcd34d", bg: "rgba(245,158,11,0.15)" },
    Concept: { fg: C.muted, bg: C.lineSoft },
  };
  const fallbackTone = { fg: C.muted, bg: C.lineSoft };
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <SectionTitle sub="Overzicht van je verstuurde en openstaande facturen">
          Facturen
        </SectionTitle>
        <button
          className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold text-white transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 motion-reduce:hover:scale-100"
          style={{
            background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
            boxShadow: "0 10px 28px -10px rgba(56,189,248,0.55)",
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl" style={glassStyle()}>
        <table className="w-full text-left">
          <thead>
            <tr
              className="border-b text-[11px] uppercase tracking-wide"
              style={{ borderColor: C.line, color: C.faint }}
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
              const t = statusTone[f.status] ?? fallbackTone;
              return (
                <tr
                  key={f.nr}
                  className="border-b transition-colors last:border-0 hover:bg-white/[0.06]"
                  style={{ borderColor: C.lineSoft }}
                >
                  <td className="px-4 py-3 text-[12.5px] font-medium tabular-nums">{f.nr}</td>
                  <td className="px-4 py-3 text-[13px]">{f.klant}</td>
                  <td className="px-4 py-3 text-[12.5px] tabular-nums" style={{ color: C.muted }}>
                    {f.datum}
                  </td>
                  <td className="px-4 py-3 text-right text-[13px] font-semibold tabular-nums">
                    {f.bedrag}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className="inline-flex items-center rounded-md px-2 py-0.5 text-[11.5px] font-semibold"
                      style={{ background: t.bg, color: t.fg }}
                    >
                      {f.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Documenten — extra context */}
      <div>
        <h3 className="mb-2 text-[13px] font-semibold" style={{ color: C.muted }}>
          Recente documenten
        </h3>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {DOCUMENTEN.map((d) => {
            const st = statusStyle(d.status);
            return (
              <div key={d.naam} className="rounded-xl p-3" style={glassStyle()}>
                <div className="flex items-center gap-2">
                  <FileText size={14} aria-hidden="true" style={{ color: C.faint }} />
                  <span className="text-[10px] font-semibold" style={{ color: st.fg }}>
                    {st.label}
                  </span>
                </div>
                <p className="mt-1.5 truncate text-[12px] font-medium">{d.naam}</p>
                <p className="text-[11px] tabular-nums" style={{ color: C.faint }}>
                  {d.grootte} · {d.bijgewerkt}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
