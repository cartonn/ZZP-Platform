"use client";

// Concept 01 — "Veld" · Bento-grid modulair besturingssysteem (LIGHT).
// De #1 2026-trend, goed gedaan: warm-neutraal lichtcanvas, modulaire rounded-2xl tegels die op
// het dashboard een asymmetrisch BENTO-raster vormen — KPI's, beste matches, credentials en de
// volgende-actie krijgen elk een eigen ruimtelijk gewicht (col-span/row-span variëren). Zachte
// elevatie (subtiele schaduw + ring-1 ring-black/5), royale tussenruimtes. De tegeltaal loopt door
// in élk scherm. Speels-maar-pro: elk datapunt krijgt zijn eigen box.
// Palet: canvas #f6f6f4, tile #ffffff, ink #1c1b1f, muted #6b6a72, line rgba(0,0,0,.07),
// accent indigo #4f46e5, accentSoft #eef0ff, plus #15803d, warn #b45309.
// Fonts: Geist (UI) + Geist Mono (cijfers).

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
  Minus,
  MapPin,
  Plus,
  Command,
  Sparkles,
  CalendarClock,
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
  canvas: "#f6f6f4",
  tile: "#ffffff",
  ink: "#1c1b1f",
  inkSoft: "#3c3b42",
  muted: "#6b6a72",
  faint: "#9a99a1",
  line: "rgba(0,0,0,0.07)",
  accent: "#4f46e5",
  accentSoft: "#eef0ff",
  plus: "#15803d",
  plusSoft: "#e7f6ec",
  warn: "#b45309",
  warnSoft: "#fdf2e3",
  reject: "#b91c1c",
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

function statusStyle(s: CredStatus): {
  label: string;
  fg: string;
  bg: string;
  dot: string;
  Icon: LucideIcon;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.plus, bg: C.plusSoft, dot: C.plus, Icon: Check };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        fg: C.accent,
        bg: C.accentSoft,
        dot: C.accent,
        Icon: Clock,
      };
    case "EXPIRING":
      return {
        label: "Verloopt bijna",
        fg: C.warn,
        bg: C.warnSoft,
        dot: C.warn,
        Icon: AlertTriangle,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        fg: C.reject,
        bg: "#fbeaea",
        dot: C.reject,
        Icon: AlertTriangle,
      };
  }
}

const tileShadow = "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -16px rgba(0,0,0,0.18)";

function Tile({
  children,
  className = "",
  accent = false,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl ring-1 ring-black/5 ${className}`}
      style={{
        background: accent ? C.accentSoft : C.tile,
        boxShadow: tileShadow,
      }}
    >
      {children}
    </div>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 96;
  const h = 30;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * h;
    return { x, y };
  });
  const line = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  const id = `g-${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.18} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Concept01() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.canvas, color: C.ink }}
    >
      <div className="flex min-h-[680px]">
        {/* Sidebar */}
        <aside className="hidden w-[236px] shrink-0 flex-col px-4 py-6 md:flex">
          <div className="flex items-center gap-3 px-2 pb-8">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[14px] font-semibold text-white"
              style={{ background: C.accent }}
            >
              Z
            </div>
            <div className="leading-tight">
              <div className="text-[13.5px] font-semibold tracking-tight">ZZP Platform</div>
              <div className="text-[11px]" style={{ color: C.muted }}>
                Besturingssysteem
              </div>
            </div>
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
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    background: on ? C.tile : "transparent",
                    color: on ? C.ink : C.muted,
                    boxShadow: on ? tileShadow : "none",
                  }}
                >
                  <Icon size={17} aria-hidden="true" style={{ color: on ? C.accent : C.faint }} />
                  {s.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto">
            <Tile className="flex items-center gap-3 p-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[11px] font-semibold"
                style={{ background: C.accentSoft, color: C.accent, ...mono }}
              >
                {PROFIEL.initialen}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-semibold">{PROFIEL.naam}</div>
                <div className="truncate text-[11px]" style={{ color: C.muted }}>
                  {PROFIEL.trust}
                </div>
              </div>
            </Tile>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center gap-3 px-5 md:px-8">
            <div className="flex items-center gap-2 text-[12.5px]" style={{ color: C.muted }}>
              <span>{PROFIEL.rol.split(" · ")[0]}</span>
              <ChevronRight size={13} aria-hidden="true" style={{ color: C.faint }} />
              <span className="font-semibold" style={{ color: C.ink }}>
                {SCREENS.find((s) => s.key === screen)?.label}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[12.5px] ring-1 ring-black/5 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ background: C.tile, color: C.muted, boxShadow: tileShadow }}
                aria-label="Zoeken openen"
              >
                <Search size={14} aria-hidden="true" />
                <span>Zoek…</span>
                <kbd
                  className="flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px]"
                  style={{ background: C.canvas, color: C.faint, ...mono }}
                >
                  <Command size={9} aria-hidden="true" />K
                </kbd>
              </button>
              <button
                className="relative rounded-xl p-2.5 ring-1 ring-black/5 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ background: C.tile, color: C.muted, boxShadow: tileShadow }}
                aria-label="Meldingen"
              >
                <Bell size={15} aria-hidden="true" />
                <span
                  className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full ring-2 ring-white"
                  style={{ background: C.accent }}
                  aria-hidden="true"
                />
              </button>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div className="flex gap-2 overflow-x-auto px-4 pb-2 md:hidden">
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  className="shrink-0 rounded-xl px-3.5 py-1.5 text-[12.5px] font-medium ring-1 ring-black/5 transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    color: on ? "#fff" : C.muted,
                    background: on ? C.accent : C.tile,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6 md:px-8 md:py-8">
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
      className="text-[10.5px] font-semibold uppercase tracking-[0.16em]"
      style={{ color: C.accent }}
    >
      {children}
    </p>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const beste = OPDRACHTEN[0] as Opdracht;
  const actie = ACTIES[0] as (typeof ACTIES)[number];
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <Kicker>Vandaag</Kicker>
        <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-tight">
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
        </h1>
        <p className="mt-1 text-[13.5px]" style={{ color: C.muted }}>
          Drie matches boven 80%, één credential vraagt aandacht.
        </p>
      </div>

      {/* Bento-raster — asymmetrisch, elk datapunt zijn eigen tegel */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Tile key={k.label} className={`p-4 ${i === 0 ? "lg:col-span-1" : ""}`}>
            <p className="text-[11.5px]" style={{ color: C.muted }}>
              {k.label}
            </p>
            <p
              className="mt-2 text-[26px] font-semibold tabular-nums leading-none tracking-tight"
              style={mono}
            >
              {k.value}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums"
                style={{
                  color: k.up ? C.plus : C.warn,
                  background: k.up ? C.plusSoft : C.warnSoft,
                  ...mono,
                }}
              >
                {k.up ? (
                  <ArrowUpRight size={11} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={11} aria-hidden="true" />
                )}
                {k.trend}
              </span>
              <Sparkline data={k.spark} color={k.up ? C.plus : C.warn} />
            </div>
          </Tile>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Beste matches — brede, hoge tegel */}
        <Tile className="p-5 lg:col-span-2 lg:row-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold tracking-tight">Beste matches</h2>
            <span
              className="inline-flex items-center gap-1 text-[11px] font-medium"
              style={{ color: C.accent }}
            >
              <Sparkles size={12} aria-hidden="true" /> Verklaarbaar gesorteerd
            </span>
          </div>
          <div className="space-y-2.5">
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={onOpen}
                className="flex w-full items-center gap-4 rounded-xl p-3 text-left transition-colors hover:bg-[#f6f6f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ ...ui }}
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[12px] font-semibold tabular-nums"
                  style={{ background: C.accentSoft, color: C.accent, ...mono }}
                >
                  {o.match}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold">{o.titel}</p>
                  <p className="mt-0.5 truncate text-[12px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats}
                  </p>
                </div>
                <span
                  className="hidden text-[12.5px] tabular-nums sm:block"
                  style={{ color: C.inkSoft, ...mono }}
                >
                  {o.tarief.replace(" / uur", "")}
                </span>
                <ChevronRight size={16} aria-hidden="true" style={{ color: C.faint }} />
              </button>
            ))}
          </div>
        </Tile>

        {/* Volgende actie — accenttegel */}
        <Tile accent className="p-5">
          <div className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: "#fff", color: C.warn }}
            >
              <AlertTriangle size={15} aria-hidden="true" />
            </div>
            <span
              className="text-[10.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.accent }}
            >
              Volgende actie
            </span>
          </div>
          <p className="mt-3 text-[14px] font-semibold leading-snug">{actie.titel}</p>
          <p className="mt-1.5 text-[12px]" style={{ color: C.inkSoft }}>
            {actie.detail}
          </p>
          <button
            className="mt-4 w-full rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.accent }}
          >
            {actie.cta}
          </button>
        </Tile>

        {/* Credentials — compacte tegel */}
        <Tile className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[14px] font-semibold tracking-tight">Credentials</h2>
            <ShieldCheck size={15} aria-hidden="true" style={{ color: C.plus }} />
          </div>
          <div className="space-y-2.5">
            {CREDENTIALS.map((c) => {
              const st = statusStyle(c.status);
              return (
                <div key={c.naam} className="flex items-center gap-2.5">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: st.dot }}
                    aria-hidden="true"
                  />
                  <p className="min-w-0 flex-1 truncate text-[12.5px] font-medium">{c.naam}</p>
                  <span className="text-[10.5px] font-medium" style={{ color: st.fg }}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Tile>
      </div>

      {/* Featured match-tegel onderaan */}
      <Tile className="mt-4 flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: C.accentSoft, color: C.accent }}
        >
          <CalendarClock size={22} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-[10.5px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: C.accent }}
          >
            Topmatch
          </p>
          <p className="mt-1 text-[14.5px] font-semibold">{beste.titel}</p>
          <p className="text-[12.5px]" style={{ color: C.muted }}>
            {beste.opdrachtgever} · {beste.tarief} · {beste.start}
          </p>
        </div>
        <button
          onClick={onOpen}
          className="shrink-0 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.accent }}
        >
          Bekijk opdracht
        </button>
      </Tile>
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
    <div className="mx-auto max-w-6xl">
      <div className="mb-5">
        <Kicker>Marktplaats</Kicker>
        <h1 className="mt-2 text-[24px] font-semibold leading-tight tracking-tight">
          Open opdrachten
        </h1>
      </div>

      <Tile className="mb-5 flex items-center gap-3 px-4 py-3">
        <Search size={16} aria-hidden="true" style={{ color: C.faint }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#9a99a1]"
          style={{ color: C.ink }}
        />
        <span className="shrink-0 text-[11.5px] tabular-nums" style={{ color: C.faint, ...mono }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </Tile>

      {filtered.length === 0 ? (
        <Tile className="flex flex-col items-center px-6 py-16 text-center">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: C.accentSoft, color: C.accent }}
          >
            <Search size={22} aria-hidden="true" />
          </div>
          <p className="mt-4 text-[15px] font-semibold">Geen opdrachten gevonden</p>
          <p className="mt-1.5 max-w-xs text-[13px]" style={{ color: C.muted }}>
            Pas je zoekopdracht aan of verbreed je beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-4 rounded-xl px-4 py-2 text-[12.5px] font-semibold ring-1 ring-black/5 transition-colors hover:bg-[#f6f6f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.tile, color: C.ink }}
          >
            Filter wissen
          </button>
        </Tile>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group flex flex-col rounded-2xl p-5 text-left ring-1 ring-black/5 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: C.tile, boxShadow: tileShadow, ...ui }}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[10px] tabular-nums" style={{ color: C.faint, ...mono }}>
                  {o.id}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
                  style={{ background: C.accentSoft, color: C.accent, ...mono }}
                >
                  {o.match}%
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
                    className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                    style={{ background: C.canvas, color: C.inkSoft }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div
                className="mt-4 flex items-center justify-between border-t pt-4 text-[12.5px]"
                style={{ borderColor: C.line }}
              >
                <span className="font-semibold tabular-nums" style={{ color: C.ink, ...mono }}>
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
    <div className="mx-auto max-w-5xl">
      <div className="mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Kicker>{opdracht.id}</Kicker>
          <h1 className="mt-2 text-[24px] font-semibold leading-tight tracking-tight">
            {opdracht.titel}
          </h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-[13px]" style={{ color: C.muted }}>
            <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
        <button
          className="shrink-0 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.accent }}
        >
          Reageer op opdracht
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Tile key={m.l} className="p-4">
            <p className="text-[11px]" style={{ color: C.muted }}>
              {m.l}
            </p>
            <p className="mt-2 text-[17px] font-semibold tabular-nums tracking-tight" style={mono}>
              {m.v}
            </p>
          </Tile>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Tile className="p-5" accent>
          <p
            className="text-[10.5px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.plus }}
          >
            Pluspunten
          </p>
          <ul className="mt-3 space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li key={r} className="flex items-start gap-2.5 text-[13px]">
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                  style={{ background: C.plusSoft, color: C.plus }}
                >
                  <Check size={13} aria-hidden="true" />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </Tile>
        <Tile className="p-5">
          <p
            className="text-[10.5px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.warn }}
          >
            Aandachtspunten
          </p>
          <ul className="mt-3 space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13px]"
                style={{ color: C.inkSoft }}
              >
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                  style={{ background: C.warnSoft, color: C.warn }}
                >
                  <Minus size={13} aria-hidden="true" />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </Tile>
      </div>

      <Tile className="mt-4 p-5">
        <h3 className="text-[14px] font-semibold">Waarom deze match</h3>
        <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je geverifieerde profiel, beschikbaarheid en reistijd.
          Je ziet altijd waarom een opdracht bij je past — geen verborgen score.
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {opdracht.tags.map((t) => (
            <span
              key={t}
              className="rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{ background: C.accentSoft, color: C.accent }}
            >
              {t}
            </span>
          ))}
        </div>
      </Tile>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5">
        <Kicker>Vertrouwen</Kicker>
        <h1 className="mt-2 text-[24px] font-semibold leading-tight tracking-tight">Verificatie</h1>
      </div>

      <Tile accent className="flex items-center gap-5 p-5">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: "#fff", color: C.accent }}
        >
          <ShieldCheck size={26} aria-hidden="true" />
        </div>
        <div>
          <p className="text-[17px] font-semibold">{PROFIEL.trust}</p>
          <p className="text-[12.5px]" style={{ color: C.inkSoft }}>
            <span className="tabular-nums" style={mono}>
              {verified}
            </span>{" "}
            van{" "}
            <span className="tabular-nums" style={mono}>
              {CREDENTIALS.length}
            </span>{" "}
            credentials geverifieerd · 1 vraagt actie
          </p>
        </div>
      </Tile>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const st = statusStyle(c.status);
          return (
            <Tile key={c.naam} className="flex items-start gap-3 p-4">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: st.bg, color: st.fg }}
              >
                <st.Icon size={18} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold">{c.naam}</p>
                <p className="mt-0.5 text-[12px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
                <span
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                  style={{ background: st.bg, color: st.fg }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: st.dot }}
                    aria-hidden="true"
                  />
                  {st.label}
                </span>
              </div>
            </Tile>
          );
        })}
      </div>
    </div>
  );
}

function Acties() {
  const tone: Record<"warning" | "info", { fg: string; bg: string; Icon: LucideIcon }> = {
    warning: { fg: C.warn, bg: C.warnSoft, Icon: AlertTriangle },
    info: { fg: C.accent, bg: C.accentSoft, Icon: Bell },
  };
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5">
        <Kicker>Aandacht</Kicker>
        <h1 className="mt-2 text-[24px] font-semibold leading-tight tracking-tight">
          Volgende acties
        </h1>
      </div>
      <div className="space-y-3">
        {ACTIES.map((a) => {
          const t = tone[a.urgentie];
          return (
            <Tile key={a.titel} className="flex items-start gap-4 p-5">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: t.bg, color: t.fg }}
              >
                <t.Icon size={18} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold">{a.titel}</p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 rounded-xl px-4 py-2 text-[12.5px] font-semibold ring-1 ring-black/5 transition-colors hover:bg-[#f6f6f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ background: C.tile, color: C.ink }}
              >
                {a.cta}
              </button>
            </Tile>
          );
        })}
      </div>
    </div>
  );
}

function Facturen() {
  const statusTone: Record<string, { fg: string; bg: string }> = {
    Betaald: { fg: C.plus, bg: C.plusSoft },
    Openstaand: { fg: C.warn, bg: C.warnSoft },
    Concept: { fg: C.muted, bg: C.canvas },
  };
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <Kicker>Omzet</Kicker>
          <h1 className="mt-2 text-[24px] font-semibold leading-tight tracking-tight">Facturen</h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12.5px] font-semibold text-white transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.accent }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Tile className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="border-b text-[10.5px] uppercase tracking-[0.1em]"
                style={{ borderColor: C.line, color: C.faint }}
              >
                <th className="px-5 py-3 font-semibold">Nummer</th>
                <th className="px-5 py-3 font-semibold">Klant</th>
                <th className="px-5 py-3 font-semibold">Datum</th>
                <th className="px-5 py-3 text-right font-semibold">Bedrag</th>
                <th className="px-5 py-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const t = statusTone[f.status] ?? { fg: C.muted, bg: C.canvas };
                return (
                  <tr
                    key={f.nr}
                    className="border-b transition-colors last:border-0 hover:bg-[#fbfbfa]"
                    style={{ borderColor: C.line }}
                  >
                    <td className="px-5 py-3.5 text-[12.5px]" style={{ color: C.inkSoft, ...mono }}>
                      {f.nr}
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-medium">{f.klant}</td>
                    <td className="px-5 py-3.5 text-[12.5px]" style={{ color: C.muted, ...mono }}>
                      {f.datum}
                    </td>
                    <td
                      className="px-5 py-3.5 text-right text-[13px] font-semibold tabular-nums"
                      style={mono}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                        style={{ color: t.fg, background: t.bg }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
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
      </Tile>
    </div>
  );
}
