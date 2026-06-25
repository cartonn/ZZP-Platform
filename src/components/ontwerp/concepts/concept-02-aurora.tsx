"use client";

// Concept 02 — "Aurora" · Lichtgevend donker, aurora-ambient.
// Bijna-zwart canvas met een zachte aurora-ambient gradient-glow (radiaal cyaan→violet, zeer
// lage opacity) — licht, geen kaders, schept hiërarchie; urgente items gloeien. Iriserende
// accenten, hairline-randen, zachte inner-glow op het actieve oppervlak. Geen glassmorphism —
// dit is luminantie/ambient.
// Palet: canvas #070912, surface #0e1220, line #1c2336, muted #8b93a7, ink #e8ecf6,
// accent cyaan #22d3ee, accent2 violet #a78bfa. Fonts: Geist + Geist Mono.

import { useState } from "react";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  ShieldCheck,
  Sparkles,
  Receipt,
  Search,
  Bell,
  ChevronRight,
  Check,
  Clock,
  AlertTriangle,
  X,
  MapPin,
  FileText,
  ArrowUpRight,
  Plus,
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
  canvas: "#070912",
  surface: "#0e1220",
  surfaceUp: "#141a2c",
  line: "#1c2336",
  lineSoft: "#161c2e",
  muted: "#8b93a7",
  faint: "#5b6379",
  ink: "#e8ecf6",
  accent: "#22d3ee",
  accent2: "#a78bfa",
  warn: "#fbbf24",
};

const ui = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

// Ambient aurora backdrop — radiale gloed van licht, niet van kaders.
const AURORA =
  "radial-gradient(60% 50% at 12% 0%, rgba(34,211,238,0.10) 0%, rgba(34,211,238,0) 60%)," +
  "radial-gradient(55% 45% at 88% 8%, rgba(167,139,250,0.12) 0%, rgba(167,139,250,0) 60%)," +
  "radial-gradient(70% 60% at 50% 110%, rgba(34,211,238,0.06) 0%, rgba(7,9,18,0) 55%)";

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: Sparkles,
  facturen: Receipt,
  documenten: FileText,
  berichten: Bell,
};

function statusStyle(s: CredStatus): {
  label: string;
  color: string;
  glow: string;
  mark: LucideIcon;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", color: C.accent, glow: "rgba(34,211,238,0.18)", mark: Check };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        color: C.accent2,
        glow: "rgba(167,139,250,0.18)",
        mark: Clock,
      };
    case "EXPIRING":
      return {
        label: "Verloopt bijna",
        color: C.warn,
        glow: "rgba(251,191,36,0.18)",
        mark: AlertTriangle,
      };
    case "REJECTED":
      return { label: "Afgewezen", color: "#fb7185", glow: "rgba(251,113,133,0.18)", mark: X };
  }
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 92;
  const h = 26;
  const id = data.join("-").replace(/\./g, "");
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * h;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
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
        <linearGradient id={`g-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.accent} stopOpacity="0.28" />
          <stop offset="100%" stopColor={C.accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#g-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={C.accent}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Concept02() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[640px] w-full antialiased"
      style={{ ...ui, background: C.canvas, color: C.ink, backgroundImage: AURORA }}
    >
      <div className="flex min-h-[640px]">
        {/* Sidebar */}
        <aside className="hidden w-60 shrink-0 flex-col px-3 py-5 md:flex">
          <div className="flex items-center gap-2.5 px-2 pb-7">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[13px] font-semibold"
              style={{
                color: C.canvas,
                background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
                boxShadow: `0 0 18px rgba(34,211,238,0.35)`,
              }}
            >
              Z
            </div>
            <span className="text-[14px] font-semibold tracking-tight">ZZP · Aurora</span>
          </div>

          <nav className="flex flex-col gap-1" aria-label="Hoofdnavigatie">
            {SCREENS.map((s) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    color: on ? C.ink : C.muted,
                    background: on ? C.surface : "transparent",
                    boxShadow: on
                      ? `inset 0 0 0 1px ${C.line}, inset 0 1px 14px rgba(34,211,238,0.10)`
                      : "none",
                  }}
                >
                  {on && (
                    <span
                      className="absolute inset-y-1.5 left-0 w-[2px] rounded-full"
                      style={{ background: C.accent, boxShadow: `0 0 8px ${C.accent}` }}
                      aria-hidden="true"
                    />
                  )}
                  <Icon size={16} aria-hidden="true" style={{ color: on ? C.accent : C.faint }} />
                  {s.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto">
            <div
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-2.5"
              style={{ background: C.surface, boxShadow: `inset 0 0 0 1px ${C.line}` }}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-semibold"
                style={{
                  ...mono,
                  color: C.canvas,
                  background: `linear-gradient(135deg, ${C.accent2}, ${C.accent})`,
                }}
              >
                {PROFIEL.initialen}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-semibold">{PROFIEL.naam}</div>
                <div className="truncate text-[11px]" style={{ color: C.accent }}>
                  {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header
            className="flex h-14 shrink-0 items-center gap-3 px-5"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <div className="flex items-center gap-1.5 text-[13px]" style={{ color: C.muted }}>
              <span>{PROFIEL.rol.split(" · ")[0]}</span>
              <ChevronRight size={14} aria-hidden="true" style={{ color: C.faint }} />
              <span className="font-medium" style={{ color: C.ink }}>
                {SCREENS.find((s) => s.key === screen)?.label}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] transition-colors hover:text-[#e8ecf6] focus-visible:outline-none focus-visible:ring-2"
                style={{ color: C.muted, boxShadow: `inset 0 0 0 1px ${C.line}` }}
                aria-label="Zoeken openen"
              >
                <Search size={14} aria-hidden="true" />
                <span>Zoek…</span>
                <kbd
                  className="rounded px-1 text-[10.5px]"
                  style={{ ...mono, color: C.faint, boxShadow: `inset 0 0 0 1px ${C.line}` }}
                >
                  ⌘K
                </kbd>
              </button>
              <button
                className="relative rounded-lg p-1.5 transition-colors hover:text-[#e8ecf6] focus-visible:outline-none focus-visible:ring-2"
                style={{ color: C.muted, boxShadow: `inset 0 0 0 1px ${C.line}` }}
                aria-label="Meldingen"
              >
                <Bell size={15} aria-hidden="true" />
                <span
                  className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full"
                  style={{ background: C.accent, boxShadow: `0 0 6px ${C.accent}` }}
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

function Surface({
  children,
  className = "",
  glow = false,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        background: C.surface,
        boxShadow: glow
          ? `inset 0 0 0 1px ${C.line}, inset 0 1px 20px rgba(34,211,238,0.06), 0 0 40px rgba(34,211,238,0.05)`
          : `inset 0 0 0 1px ${C.line}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
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
      {/* Urgent item gloeit */}
      <div
        className="flex items-start gap-3 rounded-2xl px-4 py-3.5"
        style={{
          background: C.surface,
          boxShadow: `inset 0 0 0 1px rgba(251,191,36,0.30), inset 0 1px 24px rgba(251,191,36,0.08)`,
        }}
      >
        <AlertTriangle size={16} aria-hidden="true" style={{ color: C.warn, marginTop: 1 }} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold" style={{ color: C.ink }}>
            Je VOG verloopt over <span style={mono}>23</span> dagen
          </p>
          <p className="text-[12.5px]" style={{ color: C.muted }}>
            Vraag tijdig een nieuwe aan om verifieerbaar te blijven voor opdrachtgevers.
          </p>
        </div>
        <button
          className="shrink-0 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
          style={{ background: C.warn, color: C.canvas }}
        >
          Vernieuwen
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Surface key={k.label} glow={i === 0} className="p-4">
            <p className="text-[12px] font-medium" style={{ color: C.muted }}>
              {k.label}
            </p>
            <div
              className="mt-2 text-[26px] font-semibold tabular-nums leading-none tracking-tight"
              style={mono}
            >
              {k.value}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-0.5 text-[11.5px] font-medium tabular-nums"
                style={{ ...mono, color: k.up ? C.accent : C.muted }}
              >
                {k.up && <ArrowUpRight size={12} aria-hidden="true" />}
                {k.trend}
              </span>
              <Sparkline data={k.spark} />
            </div>
          </Surface>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionTitle sub="Verklaarbaar gesorteerd op match-score">Beste matches</SectionTitle>
          <Surface className="overflow-hidden">
            {OPDRACHTEN.map((o, i) => (
              <button
                key={o.id}
                onClick={onOpen}
                className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-[#141a2c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{ borderTop: i ? `1px solid ${C.lineSoft}` : "none" }}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold">{o.titel}</p>
                  <p className="mt-0.5 truncate text-[12px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats} · {o.uren}
                  </p>
                </div>
                <span className="hidden text-[13px] tabular-nums sm:inline" style={mono}>
                  {o.tarief}
                </span>
                <span
                  className="inline-flex items-center justify-center rounded-lg px-2 py-1 text-[12px] font-semibold tabular-nums"
                  style={{
                    ...mono,
                    color: C.accent,
                    background: "rgba(34,211,238,0.10)",
                    boxShadow: "inset 0 0 0 1px rgba(34,211,238,0.25)",
                  }}
                >
                  {o.match}%
                </span>
                <ChevronRight size={16} aria-hidden="true" style={{ color: C.faint }} />
              </button>
            ))}
          </Surface>
        </div>

        <div>
          <SectionTitle sub="Je verifieerbare bewijs">Credentials</SectionTitle>
          <Surface className="space-y-3 p-4">
            {CREDENTIALS.map((c) => {
              const st = statusStyle(c.status);
              return (
                <div key={c.naam} className="flex items-start gap-2.5">
                  <span
                    className="mt-1 h-2 w-2 shrink-0 rounded-full"
                    style={{ background: st.color, boxShadow: `0 0 8px ${st.glow}` }}
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
          </Surface>
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
      <SectionTitle sub="Open opdrachten in de zorg, gefilterd op jouw profiel">
        Marktplaats
      </SectionTitle>

      <div className="flex items-center gap-2">
        <div
          className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2"
          style={{ background: C.surface, boxShadow: `inset 0 0 0 1px ${C.line}` }}
        >
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
            className="hidden rounded-lg px-2.5 py-2 text-[12px] font-medium sm:inline"
            style={{ color: C.muted, boxShadow: `inset 0 0 0 1px ${C.line}` }}
          >
            {f}
          </span>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Surface className="px-6 py-14 text-center">
          <p className="text-[14px] font-semibold">Geen opdrachten gevonden</p>
          <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
            Pas je zoekopdracht aan of verbreed je beschikbaarheid.
          </p>
        </Surface>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group rounded-2xl p-4 text-left transition-all duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 motion-reduce:hover:translate-y-0"
              style={{
                background: C.surface,
                boxShadow: `inset 0 0 0 1px ${C.line}`,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className="text-[10.5px] font-medium tracking-wide"
                  style={{ ...mono, color: C.faint }}
                >
                  {o.id}
                </span>
                <span
                  className="inline-flex items-center rounded-lg px-2 py-0.5 text-[12px] font-semibold tabular-nums"
                  style={{
                    ...mono,
                    color: C.accent,
                    background: "rgba(34,211,238,0.10)",
                    boxShadow: "inset 0 0 0 1px rgba(34,211,238,0.25)",
                  }}
                >
                  {o.match}% match
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
                    style={{ color: C.muted, boxShadow: `inset 0 0 0 1px ${C.line}` }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div
                className="mt-3 flex items-center justify-between pt-3 text-[12.5px] tabular-nums"
                style={{ ...mono, borderTop: `1px solid ${C.lineSoft}` }}
              >
                <span className="font-semibold">{o.tarief}</span>
                <span style={{ color: C.muted }}>{o.uren}</span>
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span
            className="text-[10.5px] font-medium tracking-wide"
            style={{ ...mono, color: C.faint }}
          >
            {opdracht.id}
          </span>
          <h2 className="mt-1 text-[22px] font-semibold tracking-tight">{opdracht.titel}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-[13px]" style={{ color: C.muted }}>
            <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
        <button
          className="shrink-0 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
          style={{
            color: C.canvas,
            background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
            boxShadow: `0 0 24px rgba(34,211,238,0.30)`,
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
        ].map((m, i) => (
          <Surface key={m.l} glow={i === 3} className="p-3.5">
            <p className="text-[11.5px] font-medium" style={{ color: C.muted }}>
              {m.l}
            </p>
            <p
              className="mt-1 text-[16px] font-semibold tabular-nums tracking-tight"
              style={{ ...mono, color: i === 3 ? C.accent : C.ink }}
            >
              {m.v}
            </p>
          </Surface>
        ))}
      </div>

      <Surface glow className="p-5">
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
            <ul className="mt-2 space-y-2">
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
              style={{ color: C.warn }}
            >
              Aandachtspunten
            </p>
            <ul className="mt-2 space-y-2">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2 text-[13px]"
                  style={{ color: C.muted }}
                >
                  <X size={15} aria-hidden="true" style={{ color: C.warn, marginTop: 1 }} />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Surface>
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

      <div
        className="flex items-center gap-4 rounded-2xl p-5"
        style={{
          background: C.surface,
          boxShadow: `inset 0 0 0 1px rgba(34,211,238,0.25), inset 0 1px 30px rgba(34,211,238,0.10), 0 0 50px rgba(34,211,238,0.06)`,
        }}
      >
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{
            background: "rgba(34,211,238,0.10)",
            boxShadow: `inset 0 0 0 1px rgba(34,211,238,0.30), 0 0 24px rgba(34,211,238,0.25)`,
          }}
        >
          <ShieldCheck size={26} aria-hidden="true" style={{ color: C.accent }} />
        </div>
        <div className="flex-1">
          <p className="text-[16px] font-semibold">{PROFIEL.trust}</p>
          <p className="text-[12.5px]" style={{ color: C.muted }}>
            <span style={mono}>{verified}</span> van <span style={mono}>{CREDENTIALS.length}</span>{" "}
            credentials volledig geverifieerd · <span style={mono}>1</span> vraagt actie
          </p>
        </div>
      </div>

      <Surface className="overflow-hidden">
        {CREDENTIALS.map((c, i) => {
          const st = statusStyle(c.status);
          return (
            <div
              key={c.naam}
              className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-[#141a2c]"
              style={{ borderTop: i ? `1px solid ${C.lineSoft}` : "none" }}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: st.glow, boxShadow: `inset 0 0 0 1px ${st.color}40` }}
              >
                <st.mark size={16} aria-hidden="true" style={{ color: st.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold">{c.naam}</p>
                <p className="text-[12px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <span
                className="inline-flex items-center rounded-lg px-2.5 py-1 text-[11.5px] font-semibold"
                style={{ color: st.color, background: st.glow }}
              >
                {st.label}
              </span>
            </div>
          );
        })}
      </Surface>
    </div>
  );
}

function Acties() {
  const tone: Record<"warning" | "info", { color: string; glow: string; Icon: LucideIcon }> = {
    warning: { color: C.warn, glow: "rgba(251,191,36,0.14)", Icon: AlertTriangle },
    info: { color: C.accent, glow: "rgba(34,211,238,0.12)", Icon: Sparkles },
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
              className="flex items-start gap-3.5 rounded-2xl p-4"
              style={{
                background: C.surface,
                boxShadow:
                  a.urgentie === "warning"
                    ? `inset 0 0 0 1px rgba(251,191,36,0.25), inset 0 1px 20px rgba(251,191,36,0.06)`
                    : `inset 0 0 0 1px ${C.line}`,
              }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: t.glow }}
              >
                <t.Icon size={17} aria-hidden="true" style={{ color: t.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold">{a.titel}</p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors hover:bg-[#141a2c] focus-visible:outline-none focus-visible:ring-2"
                style={{ color: C.ink, boxShadow: `inset 0 0 0 1px ${C.line}` }}
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
  const statusTone: Record<string, { color: string; bg: string }> = {
    Betaald: { color: C.accent, bg: "rgba(34,211,238,0.10)" },
    Openstaand: { color: C.warn, bg: "rgba(251,191,36,0.12)" },
    Concept: { color: C.muted, bg: "rgba(139,147,167,0.10)" },
  };
  const fallback = { color: C.muted, bg: "rgba(139,147,167,0.10)" };
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <SectionTitle sub="Overzicht van je verstuurde en openstaande facturen">
          Facturen
        </SectionTitle>
        <button
          className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
          style={{
            color: C.canvas,
            background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Surface className="overflow-hidden">
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
            {FACTUREN.map((f, i) => {
              const t = statusTone[f.status] ?? fallback;
              return (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-[#141a2c]"
                  style={{ borderTop: i ? `1px solid ${C.lineSoft}` : "none" }}
                >
                  <td className="px-4 py-3 text-[12.5px] font-medium" style={mono}>
                    {f.nr}
                  </td>
                  <td className="px-4 py-3 text-[13px]">{f.klant}</td>
                  <td className="px-4 py-3 text-[12.5px]" style={{ ...mono, color: C.muted }}>
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
                      className="inline-flex items-center rounded-md px-2 py-0.5 text-[11.5px] font-semibold"
                      style={{ color: t.color, background: t.bg }}
                    >
                      {f.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Surface>

      <div>
        <h3 className="mb-2 text-[13px] font-semibold" style={{ color: C.muted }}>
          Recente documenten
        </h3>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {DOCUMENTEN.map((d) => {
            const st = statusStyle(d.status);
            return (
              <Surface key={d.naam} className="p-3">
                <div className="flex items-center gap-2">
                  <FileText size={14} aria-hidden="true" style={{ color: C.faint }} />
                  <span className="text-[10px] font-medium" style={{ color: st.color }}>
                    {st.label}
                  </span>
                </div>
                <p className="mt-1.5 truncate text-[12px] font-medium">{d.naam}</p>
                <p className="text-[11px]" style={{ ...mono, color: C.faint }}>
                  {d.grootte} · {d.bijgewerkt}
                </p>
              </Surface>
            );
          })}
        </div>
      </div>
    </div>
  );
}
