"use client";

// Concept 20 — "Karbon" · OLED-donker, expressief high-contrast (PUUR ZWART).
// Zwart canvas, één vurig accent (#ff5c39). Dark-mode-first, messcherp contrast, de chrome verdwijnt
// en cijfers "gloeien" (subtiele glow op accent). Minimalistisch én expressief. Geist als UI,
// IBM Plex Mono voor cijfers/labels. Onderscheidend: puur zwart minimalisme, geen grids of mesh.
// Palet: bg #000000, panel #0b0b0c, line rgba(255,255,255,0.08), fg #f4f4f5, muted #a1a1aa,
// accent #ff5c39, ok #52e0a4.
// Fonts: Geist (UI) + IBM Plex Mono (cijfers/labels).

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
  Check,
  Clock,
  AlertTriangle,
  Minus,
  Plus,
  ChevronRight,
  MapPin,
  Zap,
  Circle,
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
  bg: "#000000",
  panel: "#0b0b0c",
  panelHi: "#111113",
  line: "rgba(255,255,255,0.08)",
  lineSoft: "rgba(255,255,255,0.05)",
  fg: "#f4f4f5",
  inkSoft: "#d4d4d8",
  muted: "#a1a1aa",
  faint: "#52525b",
  accent: "#ff5c39",
  accentDim: "#c74326",
  accentSoft: "rgba(255,92,57,0.12)",
  accentLine: "rgba(255,92,57,0.35)",
  ok: "#52e0a4",
  okSoft: "rgba(82,224,164,0.12)",
  warn: "#ffb547",
  warnSoft: "rgba(255,181,71,0.12)",
};

const ui = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-plex-mono)" };
const glow = { textShadow: `0 0 22px rgba(255,92,57,0.55)` };

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

function statusStyle(s: CredStatus): { label: string; fg: string; bg: string; Icon: LucideIcon } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.ok, bg: C.okSoft, Icon: Check };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.warn, bg: C.warnSoft, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", fg: C.accent, bg: C.accentSoft, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.accent, bg: C.accentSoft, Icon: AlertTriangle };
  }
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10.5px] font-medium uppercase tracking-[0.28em]"
      style={{ color: C.faint, ...mono }}
    >
      {children}
    </p>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 84;
  const h = 26;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1]!;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline
        points={line}
        fill="none"
        stroke={C.accent}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={last[0]} cy={last[1]} r={2.4} fill={C.accent} />
    </svg>
  );
}

export function Concept20() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.bg, color: C.fg }}
    >
      <div className="flex min-h-[680px]">
        {/* Slanke icoon-rail — chrome verdwijnt in het zwart */}
        <aside
          className="hidden w-[220px] shrink-0 flex-col border-r px-3 py-6 md:flex"
          style={{ borderColor: C.line, background: C.bg }}
        >
          <div className="flex items-center gap-2.5 px-2 pb-8">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{
                background: C.accent,
                color: "#1a0d08",
                boxShadow: `0 0 24px ${C.accentLine}`,
              }}
            >
              <Zap size={16} aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <div className="text-[14px] font-semibold tracking-[0.02em]">KARBON</div>
              <div
                className="text-[9.5px] uppercase tracking-[0.24em]"
                style={{ color: C.faint, ...mono }}
              >
                ZZP
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-0.5" aria-label="Hoofdnavigatie">
            {SCREENS.map((s) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  style={{
                    color: on ? C.fg : C.muted,
                    background: on ? C.panel : "transparent",
                    fontWeight: on ? 600 : 400,
                  }}
                >
                  {on && (
                    <span
                      className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full"
                      style={{ background: C.accent, boxShadow: `0 0 12px ${C.accent}` }}
                      aria-hidden="true"
                    />
                  )}
                  <Icon size={16} aria-hidden="true" style={{ color: on ? C.accent : C.faint }} />
                  {s.label}
                </button>
              );
            })}
          </nav>

          <div
            className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5"
            style={{ border: `1px solid ${C.line}` }}
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold"
              style={{ background: C.accentSoft, color: C.accent, ...mono }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
            <div className="min-w-0">
              <div className="truncate text-[12.5px] font-medium">{PROFIEL.naam}</div>
              <div className="truncate text-[10.5px]" style={{ color: C.faint }}>
                {PROFIEL.trust}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          {/* Topbar */}
          <header
            className="flex h-16 shrink-0 items-center gap-3 border-b px-5 md:px-8"
            style={{ borderColor: C.line }}
          >
            <span className="text-[13px] font-medium">
              {SCREENS.find((s) => s.key === screen)?.label}
            </span>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                className="hidden items-center gap-2.5 rounded-lg px-3 py-1.5 text-[12.5px] transition-colors hover:bg-[#111113] focus-visible:outline-none focus-visible:ring-2 sm:flex"
                style={{ border: `1px solid ${C.line}`, color: C.muted }}
                aria-label="Zoeken openen"
              >
                <Search size={14} aria-hidden="true" />
                <span>Zoek…</span>
              </button>
              <button
                className="relative rounded-lg p-2 transition-colors hover:bg-[#111113] focus-visible:outline-none focus-visible:ring-2"
                style={{ border: `1px solid ${C.line}`, color: C.muted }}
                aria-label="Meldingen"
              >
                <Bell size={15} aria-hidden="true" />
                <span
                  className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
                  style={{ background: C.accent, boxShadow: `0 0 8px ${C.accent}` }}
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
                  className="shrink-0 rounded-lg px-3 py-1.5 text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    color: on ? C.accent : C.muted,
                    background: on ? C.accentSoft : "transparent",
                    border: `1px solid ${on ? C.accentLine : "transparent"}`,
                    fontWeight: on ? 600 : 400,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-7 md:px-8">
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

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{ border: `1px solid ${C.line}`, background: C.panel }}
    >
      {children}
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const lead = OPDRACHTEN[0] as Opdracht;
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Label>Vandaag</Label>
          <h1 className="mt-2 text-[32px] font-semibold leading-none tracking-tight">
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.muted }}>
            Drie matches boven 80%. Eén credential vraagt aandacht. De rest brandt rustig door.
          </p>
        </div>
        <button
          onClick={onOpen}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          style={{ background: C.accent, color: "#1a0d08", boxShadow: `0 0 28px ${C.accentLine}` }}
        >
          <Zap size={15} aria-hidden="true" /> Bekijk topmatch
        </button>
      </div>

      {/* Gloeiende KPI's */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Panel key={k.label} className="p-4">
            <p className="text-[11px]" style={{ color: C.muted }}>
              {k.label}
            </p>
            <p
              className="mt-2.5 text-[27px] font-semibold tabular-nums leading-none tracking-tight"
              style={{ ...mono, color: i === 0 ? C.accent : C.fg, ...(i === 0 ? glow : {}) }}
            >
              {k.value}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-0.5 text-[11px] tabular-nums"
                style={{ color: k.up ? C.ok : C.warn, ...mono }}
              >
                {k.up ? (
                  <ArrowUpRight size={12} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={12} aria-hidden="true" />
                )}
                {k.trend}
              </span>
              <Sparkline data={k.spark} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[14px] font-semibold tracking-tight">Beste matches</h2>
            <span className="text-[11px]" style={{ color: C.faint, ...mono }}>
              verklaarbaar gesorteerd
            </span>
          </div>
          <Panel>
            <ul className="divide-y" style={{ borderColor: C.lineSoft }}>
              {OPDRACHTEN.map((o) => (
                <li key={o.id}>
                  <button
                    onClick={onOpen}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#111113] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  >
                    <span
                      className="flex h-9 w-14 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold tabular-nums"
                      style={{
                        background: C.accentSoft,
                        color: C.accent,
                        border: `1px solid ${C.accentLine}`,
                        ...mono,
                        ...glow,
                      }}
                    >
                      {o.match}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium">{o.titel}</p>
                      <p className="mt-0.5 truncate text-[11.5px]" style={{ color: C.muted }}>
                        {o.opdrachtgever} · {o.plaats}
                      </p>
                    </div>
                    <span
                      className="hidden text-[12px] tabular-nums sm:block"
                      style={{ color: C.inkSoft, ...mono }}
                    >
                      {o.tarief.replace(" / uur", "")}
                    </span>
                    <ChevronRight size={15} aria-hidden="true" style={{ color: C.faint }} />
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div>
          <h2 className="mb-3 text-[14px] font-semibold tracking-tight">Volgende beste actie</h2>
          <Panel className="p-5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{
                background: C.accentSoft,
                color: C.accent,
                border: `1px solid ${C.accentLine}`,
              }}
            >
              <AlertTriangle size={16} aria-hidden="true" />
            </div>
            <p className="mt-3 text-[13.5px] font-semibold leading-snug">{ACTIES[0]!.titel}</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.muted }}>
              {ACTIES[0]!.detail}
            </p>
            <button
              onClick={onOpen}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[12.5px] font-semibold transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2"
              style={{ background: C.accent, color: "#1a0d08" }}
            >
              {ACTIES[0]!.cta} <ArrowUpRight size={14} aria-hidden="true" />
            </button>
            <div className="mt-5 border-t pt-4" style={{ borderColor: C.lineSoft }}>
              <p className="text-[11px]" style={{ color: C.faint, ...mono }}>
                TOPMATCH
              </p>
              <p className="mt-1.5 truncate text-[12.5px] font-medium">{lead.titel}</p>
              <p className="text-[11.5px]" style={{ color: C.muted }}>
                {lead.opdrachtgever}
              </p>
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
    <div className="mx-auto max-w-5xl space-y-7">
      <div>
        <Label>Marktplaats</Label>
        <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-tight">
          Open opdrachten
        </h1>
      </div>

      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3"
        style={{ border: `1px solid ${C.line}`, background: C.panel }}
      >
        <Search size={15} aria-hidden="true" style={{ color: C.faint }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#52525b]"
          style={{ color: C.fg }}
        />
        <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.muted, ...mono }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center px-6 py-16 text-center">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ border: `1px solid ${C.line}`, background: C.panelHi }}
          >
            <Search size={20} aria-hidden="true" style={{ color: C.faint }} />
          </div>
          <p className="mt-4 text-[14.5px] font-semibold">Niets gevonden</p>
          <p className="mt-1 max-w-xs text-[12.5px]" style={{ color: C.muted }}>
            Geen resultaat voor “{q}”. Pas je zoekopdracht aan of verbreed je beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-4 rounded-lg px-4 py-1.5 text-[12.5px] font-medium transition-colors hover:bg-[#111113] focus-visible:outline-none focus-visible:ring-2"
            style={{ border: `1px solid ${C.line}`, color: C.fg }}
          >
            Zoekopdracht wissen
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group rounded-2xl p-5 text-left transition-all hover:border-[rgba(255,92,57,0.35)] focus-visible:outline-none focus-visible:ring-2"
              style={{ border: `1px solid ${C.line}`, background: C.panel }}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[10.5px] tabular-nums" style={{ color: C.faint, ...mono }}>
                  {o.id}
                </span>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold tabular-nums"
                  style={{
                    background: C.accentSoft,
                    color: C.accent,
                    border: `1px solid ${C.accentLine}`,
                    ...mono,
                    ...glow,
                  }}
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
                    className="rounded-full px-2 py-0.5 text-[10.5px]"
                    style={{ border: `1px solid ${C.line}`, color: C.muted }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div
                className="mt-4 flex items-center justify-between border-t pt-4 text-[12.5px] tabular-nums"
                style={{ borderColor: C.lineSoft, ...mono }}
              >
                <span style={{ color: C.inkSoft }}>{o.tarief}</span>
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
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <Label>{opdracht.id}</Label>
          <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-tight">
            {opdracht.titel}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-[13px]" style={{ color: C.muted }}>
            <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
        <button
          className="shrink-0 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2"
          style={{ background: C.accent, color: "#1a0d08", boxShadow: `0 0 28px ${C.accentLine}` }}
        >
          Reageer op opdracht
        </button>
      </div>

      {/* Grote gloeiende match-meter */}
      <Panel className="flex flex-wrap items-center gap-6 p-6">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
          <svg className="absolute inset-0" viewBox="0 0 96 96" aria-hidden="true">
            <circle cx="48" cy="48" r="40" fill="none" stroke={C.line} strokeWidth="5" />
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              stroke={C.accent}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${(opdracht.match / 100) * 2 * Math.PI * 40} ${2 * Math.PI * 40}`}
              transform="rotate(-90 48 48)"
              style={{ filter: `drop-shadow(0 0 6px ${C.accent})` }}
            />
          </svg>
          <span
            className="text-[22px] font-semibold tabular-nums"
            style={{ ...mono, color: C.accent, ...glow }}
          >
            {opdracht.match}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold">Verklaarbare match van {opdracht.match}%</p>
          <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
            Op basis van je geverifieerde profiel, reistijd en tariefondergrens.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { l: "Tarief", v: opdracht.tarief },
              { l: "Omvang", v: opdracht.uren },
              { l: "Start", v: opdracht.start },
              { l: "Match", v: `${opdracht.match}%` },
            ].map((m) => (
              <div key={m.l}>
                <p
                  className="text-[10px] uppercase tracking-[0.14em]"
                  style={{ color: C.faint, ...mono }}
                >
                  {m.l}
                </p>
                <p className="mt-1 text-[14px] font-medium tabular-nums" style={mono}>
                  {m.v}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <Panel className="p-6">
        <div className="flex items-center gap-2">
          <Circle size={13} aria-hidden="true" style={{ color: C.accent, fill: C.accent }} />
          <h3 className="text-[14px] font-semibold">Waarom deze match</h3>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-7 sm:grid-cols-2">
          <div>
            <p
              className="text-[10.5px] font-medium uppercase tracking-[0.16em]"
              style={{ color: C.ok }}
            >
              Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px]">
                  <span
                    className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.okSoft }}
                  >
                    <Check size={11} aria-hidden="true" style={{ color: C.ok }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="text-[10.5px] font-medium uppercase tracking-[0.16em]"
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
                    className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.warnSoft }}
                  >
                    <Minus size={11} aria-hidden="true" style={{ color: C.warn }} />
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
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div>
        <Label>Vertrouwenslaag</Label>
        <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-tight">Verificatie</h1>
      </div>

      <Panel className="flex flex-wrap items-center gap-6 p-6">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
          <svg className="absolute inset-0" viewBox="0 0 80 80" aria-hidden="true">
            <circle cx="40" cy="40" r="34" fill="none" stroke={C.line} strokeWidth="5" />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke={C.accent}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 2 * Math.PI * 34} ${2 * Math.PI * 34}`}
              transform="rotate(-90 40 40)"
              style={{ filter: `drop-shadow(0 0 5px ${C.accent})` }}
            />
          </svg>
          <span
            className="text-[16px] font-semibold tabular-nums"
            style={{ ...mono, color: C.accent, ...glow }}
          >
            {pct}%
          </span>
        </div>
        <div className="flex-1">
          <p className="text-[17px] font-semibold">{PROFIEL.trust}</p>
          <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
            <span className="tabular-nums" style={mono}>
              {verified}
            </span>{" "}
            van{" "}
            <span className="tabular-nums" style={mono}>
              {CREDENTIALS.length}
            </span>{" "}
            credentials geverifieerd · één vraagt actie.
          </p>
        </div>
      </Panel>

      <Panel>
        <ul className="divide-y" style={{ borderColor: C.lineSoft }}>
          {CREDENTIALS.map((c) => {
            const st = statusStyle(c.status);
            return (
              <li
                key={c.naam}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#111113]"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: st.bg, color: st.fg }}
                >
                  <st.Icon size={17} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium">{c.naam}</p>
                  <p className="text-[12px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                  style={{ background: st.bg, color: st.fg }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: st.fg }}
                    aria-hidden="true"
                  />
                  {st.label}
                </span>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}

function Acties() {
  const tone: Record<"warning" | "info", { fg: string; bg: string; Icon: LucideIcon }> = {
    warning: { fg: C.accent, bg: C.accentSoft, Icon: AlertTriangle },
    info: { fg: C.warn, bg: C.warnSoft, Icon: Bell },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <div>
        <Label>Aandacht</Label>
        <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-tight">
          Volgende acties
        </h1>
      </div>
      <div className="space-y-3">
        {ACTIES.map((a) => {
          const t = tone[a.urgentie];
          return (
            <Panel key={a.titel} className="flex items-start gap-4 p-5">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: t.bg, color: t.fg }}
              >
                <t.Icon size={17} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium">{a.titel}</p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 rounded-lg px-3.5 py-1.5 text-[12.5px] font-medium transition-colors hover:bg-[#111113] focus-visible:outline-none focus-visible:ring-2"
                style={{ border: `1px solid ${C.line}`, color: C.fg }}
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
  const statusTone: Record<string, { fg: string; bg: string }> = {
    Betaald: { fg: C.ok, bg: C.okSoft },
    Openstaand: { fg: C.accent, bg: C.accentSoft },
    Concept: { fg: C.muted, bg: C.lineSoft },
  };
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Label>Omzet</Label>
          <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-tight">Facturen</h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2"
          style={{ background: C.accent, color: "#1a0d08", boxShadow: `0 0 24px ${C.accentLine}` }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="border-b text-[10.5px] uppercase tracking-[0.1em]"
                style={{ borderColor: C.line, color: C.faint }}
              >
                <th className="px-5 py-3 font-medium" style={mono}>
                  Nummer
                </th>
                <th className="px-5 py-3 font-medium">Klant</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell" style={mono}>
                  Datum
                </th>
                <th className="px-5 py-3 text-right font-medium">Bedrag</th>
                <th className="px-5 py-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const t = statusTone[f.status] ?? { fg: C.muted, bg: C.lineSoft };
                return (
                  <tr
                    key={f.nr}
                    className="border-b transition-colors last:border-0 hover:bg-[#111113]"
                    style={{ borderColor: C.lineSoft }}
                  >
                    <td className="px-5 py-3.5 text-[12.5px]" style={{ color: C.inkSoft, ...mono }}>
                      {f.nr}
                    </td>
                    <td className="px-5 py-3.5 text-[13px]">{f.klant}</td>
                    <td
                      className="hidden px-5 py-3.5 text-[12.5px] sm:table-cell"
                      style={{ color: C.muted, ...mono }}
                    >
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
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                        style={{ background: t.bg, color: t.fg }}
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
      </Panel>
    </div>
  );
}
