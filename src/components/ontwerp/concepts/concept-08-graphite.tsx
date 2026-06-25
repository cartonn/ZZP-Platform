"use client";

// Concept 08 — "Graphite" · Tactiel verfijnd brutalisme — blauwdruk.
// Engineering/blueprint-gevoel: zichtbaar structureel raster, dikke inkt-randen, harde offset-schaduwen
// (geen blur), monospace-labels, blauwdruk-annotaties (maatlijnen, hoek-ticks) en één signaal-oranje accent.
// Palet: canvas #ededea, surface #ffffff, inkt #111113, line #15151a (dik), muted #5b5b5b,
// accent signal-orange #ea580c, accentSoft #fdece0. Fonts: Space Grotesk + JetBrains Mono.

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
  CornerDownRight,
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
  canvas: "#ededea",
  surface: "#ffffff",
  ink: "#111113",
  line: "#15151a",
  muted: "#5b5b5b",
  faint: "#8a8a86",
  accent: "#ea580c",
  accentSoft: "#fdece0",
};

const display = { fontFamily: "var(--font-lab-space)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

const HARD = "4px 4px 0 #111113";
const HARD_SM = "3px 3px 0 #111113";
const HARD_ACCENT = "4px 4px 0 #ea580c";

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

// Hoek-ticks — blauwdruk-annotatie op de hoeken van een paneel.
function CornerTicks() {
  const base = "absolute h-2.5 w-2.5";
  const b = `1.5px solid ${C.line}`;
  return (
    <span aria-hidden="true">
      <span className={`${base} left-1 top-1`} style={{ borderTop: b, borderLeft: b }} />
      <span className={`${base} right-1 top-1`} style={{ borderTop: b, borderRight: b }} />
      <span className={`${base} bottom-1 left-1`} style={{ borderBottom: b, borderLeft: b }} />
      <span className={`${base} bottom-1 right-1`} style={{ borderBottom: b, borderRight: b }} />
    </span>
  );
}

function statusStyle(s: CredStatus): { label: string; fg: string; bg: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "GEVERIFIEERD", fg: "#14532d", bg: "#dcfce7" };
    case "SUBMITTED":
      return { label: "IN BEOORDELING", fg: "#1e3a8a", bg: "#dbeafe" };
    case "EXPIRING":
      return { label: "VERLOOPT BIJNA", fg: "#7c2d12", bg: C.accentSoft };
    case "REJECTED":
      return { label: "AFGEWEZEN", fg: "#7f1d1d", bg: "#fee2e2" };
  }
}

function Bars({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data) || 1;
  return (
    <div className="flex h-7 items-end gap-[3px]" aria-hidden="true">
      {data.map((d, i) => (
        <span
          key={i}
          style={{
            height: `${Math.max(12, (d / max) * 100)}%`,
            width: 5,
            background: i === data.length - 1 ? color : C.line,
          }}
        />
      ))}
    </div>
  );
}

// Maatlijn — blauwdruk-dimensie tussen twee punten.
function DimLine({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      <span className="h-2 w-px" style={{ background: C.line }} />
      <span className="h-px flex-1" style={{ background: C.line }} />
      <span
        className="px-1 text-[9.5px] uppercase tracking-widest"
        style={{ ...mono, color: C.faint }}
      >
        {label}
      </span>
      <span className="h-px flex-1" style={{ background: C.line }} />
      <span className="h-2 w-px" style={{ background: C.line }} />
    </div>
  );
}

export function Concept08() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[640px] w-full antialiased"
      style={{ ...display, background: C.canvas, color: C.ink }}
    >
      {/* Zichtbaar structureel raster (blauwdruk). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(17,17,19,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(17,17,19,0.06) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative flex min-h-[640px]">
        {/* Sidebar */}
        <aside
          className="hidden w-60 shrink-0 flex-col px-3 py-5 md:flex"
          style={{ borderRight: `2px solid ${C.line}`, background: C.surface }}
        >
          <div className="flex items-center gap-2.5 px-1 pb-6">
            <div
              className="flex h-8 w-8 items-center justify-center text-[14px] font-bold text-white"
              style={{ background: C.ink, boxShadow: HARD_ACCENT }}
            >
              Z
            </div>
            <span className="text-[14px] font-bold tracking-tight" style={display}>
              ZZP_PLATFORM
            </span>
          </div>

          <div
            className="mb-2 px-1 text-[9.5px] uppercase tracking-widest"
            style={{ ...mono, color: C.faint }}
          >
            {"// navigatie"}
          </div>
          <nav className="flex flex-col gap-2">
            {SCREENS.map((s, i) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="flex items-center gap-2.5 px-2.5 py-2 text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    color: on ? C.surface : C.ink,
                    background: on ? C.ink : C.surface,
                    border: `2px solid ${C.line}`,
                    boxShadow: on ? HARD_ACCENT : "none",
                  }}
                >
                  <span
                    className="text-[10px] tabular-nums"
                    style={{ ...mono, color: on ? C.accent : C.faint }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Icon size={15} aria-hidden="true" />
                  {s.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto">
            <div
              className="relative flex items-center gap-2.5 p-2.5"
              style={{ border: `2px solid ${C.line}`, background: C.surface, boxShadow: HARD_SM }}
            >
              <div
                className="flex h-9 w-9 items-center justify-center text-[12px] font-bold text-white"
                style={{ background: C.accent }}
              >
                {PROFIEL.initialen}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-bold">{PROFIEL.naam}</div>
                <div
                  className="truncate text-[10px] uppercase tracking-wide"
                  style={{ ...mono, color: C.muted }}
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
            className="flex h-14 shrink-0 items-center gap-3 px-5"
            style={{ borderBottom: `2px solid ${C.line}`, background: C.surface }}
          >
            <div
              className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide"
              style={{ ...mono, color: C.muted }}
            >
              <span className="hidden sm:inline">{PROFIEL.rol.split(" · ")[0]}</span>
              <ChevronRight size={13} aria-hidden="true" className="hidden sm:inline" />
              <span className="font-bold" style={{ color: C.ink }}>
                {SCREENS.find((s) => s.key === screen)?.label}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                className="flex items-center gap-2 px-2.5 py-1.5 text-[12px] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0"
                style={{
                  border: `2px solid ${C.line}`,
                  background: C.surface,
                  color: C.muted,
                  boxShadow: HARD_SM,
                }}
                aria-label="Zoeken openen"
              >
                <Search size={14} aria-hidden="true" />
                <span className="hidden sm:inline" style={mono}>
                  zoek
                </span>
                <kbd
                  className="px-1 text-[10px]"
                  style={{ ...mono, border: `1.5px solid ${C.line}` }}
                >
                  ⌘K
                </kbd>
              </button>
              <button
                className="relative p-2 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0"
                style={{
                  border: `2px solid ${C.line}`,
                  background: C.surface,
                  color: C.ink,
                  boxShadow: HARD_SM,
                }}
                aria-label="Meldingen"
              >
                <Bell size={15} aria-hidden="true" />
                <span
                  className="absolute -right-1.5 -top-1.5 h-3 w-3"
                  style={{ background: C.accent, border: `1.5px solid ${C.line}` }}
                  aria-hidden="true"
                />
              </button>
            </div>
          </header>

          {/* Tabs — mobiel */}
          <div
            className="flex gap-2 overflow-x-auto px-5 py-3 md:hidden"
            style={{ borderBottom: `2px solid ${C.line}` }}
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  className="shrink-0 px-3 py-1.5 text-[12px] font-bold focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    color: on ? C.surface : C.ink,
                    background: on ? C.ink : C.surface,
                    border: `2px solid ${C.line}`,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
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

function SectionTitle({
  children,
  sub,
  code,
}: {
  children: React.ReactNode;
  sub?: string;
  code?: string;
}) {
  return (
    <div className="mb-4">
      {code && (
        <div
          className="mb-1 text-[10px] uppercase tracking-widest"
          style={{ ...mono, color: C.accent }}
        >
          {code}
        </div>
      )}
      <h2 className="text-[18px] font-bold tracking-tight" style={display}>
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

function Panel({
  children,
  className = "",
  accent = false,
  ticks = false,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
  ticks?: boolean;
}) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        background: C.surface,
        border: `2px solid ${C.line}`,
        boxShadow: accent ? HARD_ACCENT : HARD,
      }}
    >
      {ticks && <CornerTicks />}
      {children}
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Waarschuwingsbanner */}
      <div
        className="relative flex items-start gap-3 p-4"
        style={{ background: C.accentSoft, border: `2px solid ${C.line}`, boxShadow: HARD }}
      >
        <AlertTriangle size={17} aria-hidden="true" style={{ color: C.accent, marginTop: 1 }} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold" style={{ color: "#7c2d12" }}>
            VOG VERLOOPT OVER <span className="tabular-nums">23</span> DAGEN
          </p>
          <p className="text-[12.5px]" style={{ color: "#9a4318" }}>
            Vraag tijdig een nieuwe aan om verifieerbaar te blijven voor opdrachtgevers.
          </p>
        </div>
        <button
          className="shrink-0 px-3.5 py-1.5 text-[12px] font-bold uppercase text-white transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0"
          style={{
            ...mono,
            background: C.accent,
            border: `2px solid ${C.line}`,
            boxShadow: HARD_SM,
          }}
        >
          Vernieuwen
        </button>
      </div>

      {/* KPI grid */}
      <div>
        <DimLine label="kerncijfers · maand" />
        <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k) => (
            <Panel key={k.label} className="p-4" ticks>
              <p
                className="text-[10.5px] uppercase tracking-wide"
                style={{ ...mono, color: C.muted }}
              >
                {k.label}
              </p>
              <div
                className="mt-1.5 text-[26px] font-bold tabular-nums leading-none tracking-tight"
                style={display}
              >
                {k.value}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-white"
                  style={{ ...mono, background: k.up ? "#16a34a" : C.muted }}
                >
                  {k.up ? (
                    <ArrowUpRight size={12} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={12} aria-hidden="true" />
                  )}
                  {k.trend}
                </span>
                <Bars data={k.spark} color={C.accent} />
              </div>
            </Panel>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Matches */}
        <div className="lg:col-span-2">
          <SectionTitle code="// beste_matches" sub="Verklaarbaar gesorteerd op match-score">
            Beste matches
          </SectionTitle>
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={onOpen}
                className="flex w-full items-center gap-4 p-4 text-left transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0"
                style={{ background: C.surface, border: `2px solid ${C.line}`, boxShadow: HARD_SM }}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-bold">{o.titel}</p>
                  <p className="mt-0.5 truncate text-[12px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats} · {o.uren}
                  </p>
                </div>
                <span className="text-[13px] font-bold tabular-nums" style={mono}>
                  {o.tarief}
                </span>
                <span
                  className="inline-flex items-center justify-center px-2 py-1 text-[12px] font-bold tabular-nums text-white"
                  style={{ ...mono, background: C.accent }}
                >
                  {o.match}%
                </span>
                <ChevronRight size={16} aria-hidden="true" style={{ color: C.ink }} />
              </button>
            ))}
          </div>
        </div>

        {/* Credentials samenvatting */}
        <div>
          <SectionTitle code="// credentials" sub="Je verifieerbare bewijs">
            Credentials
          </SectionTitle>
          <Panel className="space-y-3 p-4">
            {CREDENTIALS.map((c) => {
              const st = statusStyle(c.status);
              return (
                <div key={c.naam} className="flex items-start gap-2.5">
                  <span
                    className="mt-1 h-2.5 w-2.5 shrink-0"
                    style={{ background: st.fg, border: `1.5px solid ${C.line}` }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-bold">{c.naam}</p>
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
      <SectionTitle
        code="// marktplaats"
        sub="Open opdrachten in de zorg, gefilterd op jouw profiel"
      >
        Marktplaats
      </SectionTitle>

      <div className="flex items-center gap-2">
        <div
          className="flex flex-1 items-center gap-2 px-3 py-2.5"
          style={{ background: C.surface, border: `2px solid ${C.line}`, boxShadow: HARD_SM }}
        >
          <Search size={15} aria-hidden="true" style={{ color: C.ink }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="zoek op titel of plaats…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none"
            style={{ ...mono, color: C.ink }}
          />
        </div>
        {["PER 1 JULI", "AVOND", "BIG"].map((f) => (
          <span
            key={f}
            className="hidden px-2.5 py-2.5 text-[11px] font-bold uppercase sm:inline"
            style={{
              ...mono,
              background: C.surface,
              border: `2px solid ${C.line}`,
              color: C.muted,
            }}
          >
            {f}
          </span>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Panel className="px-6 py-16 text-center" ticks>
          <div
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center"
            style={{ background: C.accentSoft, border: `2px solid ${C.line}` }}
          >
            <Search size={20} aria-hidden="true" style={{ color: C.accent }} />
          </div>
          <p className="text-[14px] font-bold">Geen opdrachten gevonden</p>
          <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
            Pas je zoekopdracht aan of verbreed je beschikbaarheid.
          </p>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group relative p-4 text-left transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0"
              style={{ background: C.surface, border: `2px solid ${C.line}`, boxShadow: HARD }}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className="text-[10.5px] tabular-nums tracking-wide"
                  style={{ ...mono, color: C.faint }}
                >
                  {o.id}
                </span>
                <span
                  className="inline-flex items-center px-2 py-0.5 text-[12px] font-bold tabular-nums text-white"
                  style={{ ...mono, background: C.accent }}
                >
                  {o.match}% MATCH
                </span>
              </div>
              <p className="mt-2 text-[14px] font-bold leading-snug">{o.titel}</p>
              <p className="mt-1 flex items-center gap-1.5 text-[12px]" style={{ color: C.muted }}>
                <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className="px-1.5 py-0.5 text-[11px] uppercase"
                    style={{ ...mono, border: `1.5px solid ${C.line}`, color: C.muted }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div
                className="mt-3 flex items-center justify-between pt-3 text-[12.5px]"
                style={{ borderTop: `1.5px dashed ${C.line}` }}
              >
                <span className="font-bold tabular-nums" style={mono}>
                  {o.tarief}
                </span>
                <span className="tabular-nums" style={{ ...mono, color: C.muted }}>
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <span
            className="text-[10.5px] tabular-nums tracking-wide"
            style={{ ...mono, color: C.accent }}
          >
            {opdracht.id}
          </span>
          <h2 className="mt-1 text-[24px] font-bold tracking-tight" style={display}>
            {opdracht.titel}
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-[13px]" style={{ color: C.muted }}>
            <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
        <button
          className="shrink-0 px-4 py-2.5 text-[13px] font-bold uppercase text-white transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0"
          style={{
            ...mono,
            background: C.ink,
            border: `2px solid ${C.line}`,
            boxShadow: HARD_ACCENT,
          }}
        >
          Reageer →
        </button>
      </div>

      <DimLine label="kerngegevens" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { l: "TARIEF", v: opdracht.tarief },
          { l: "OMVANG", v: opdracht.uren },
          { l: "START", v: opdracht.start },
          { l: "MATCH", v: `${opdracht.match}%` },
        ].map((m) => (
          <Panel key={m.l} className="p-3.5">
            <p className="text-[10px] uppercase tracking-wide" style={{ ...mono, color: C.muted }}>
              {m.l}
            </p>
            <p className="mt-1 text-[16px] font-bold tabular-nums tracking-tight" style={mono}>
              {m.v}
            </p>
          </Panel>
        ))}
      </div>

      <Panel className="p-5" accent>
        <div className="flex items-center gap-2">
          <CornerDownRight size={16} aria-hidden="true" style={{ color: C.accent }} />
          <h3 className="text-[14px] font-bold" style={display}>
            Waarom deze match
          </h3>
        </div>
        <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je profiel.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <p
              className="text-[10.5px] font-bold uppercase tracking-widest"
              style={{ ...mono, color: "#15803d" }}
            >
              [+] Pluspunten
            </p>
            <ul className="mt-2 space-y-1.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2 text-[13px]">
                  <Check size={15} aria-hidden="true" style={{ color: "#16a34a", marginTop: 1 }} />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="text-[10.5px] font-bold uppercase tracking-widest"
              style={{ ...mono, color: "#9a4318" }}
            >
              [-] Aandachtspunten
            </p>
            <ul className="mt-2 space-y-1.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2 text-[13px]"
                  style={{ color: C.muted }}
                >
                  <X size={15} aria-hidden="true" style={{ color: C.accent, marginTop: 1 }} />
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
    <div className="mx-auto max-w-4xl space-y-5">
      <SectionTitle
        code="// verificatie"
        sub="Server-side bepaald — de bron van je vertrouwensniveau"
      >
        Verificatie
      </SectionTitle>

      <Panel className="flex items-center gap-4 p-5" accent ticks>
        <div
          className="flex h-16 w-16 items-center justify-center"
          style={{ background: C.ink, border: `2px solid ${C.line}` }}
        >
          <ShieldCheck size={30} aria-hidden="true" style={{ color: C.accent }} />
        </div>
        <div>
          <p className="text-[17px] font-bold" style={display}>
            {PROFIEL.trust}
          </p>
          <p className="text-[12.5px]" style={{ color: C.muted }}>
            <span className="tabular-nums">{verified}</span> van{" "}
            <span className="tabular-nums">{CREDENTIALS.length}</span> credentials volledig
            geverifieerd · <span className="tabular-nums">1</span> vraagt actie
          </p>
        </div>
        <div
          className="ml-auto hidden px-3 py-1.5 text-[10.5px] font-bold uppercase sm:block"
          style={{
            ...mono,
            background: "#dcfce7",
            border: `2px solid ${C.line}`,
            color: "#14532d",
          }}
        >
          Zegel actief
        </div>
      </Panel>

      <div className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusStyle(c.status);
          return (
            <div
              key={c.naam}
              className="flex items-center gap-4 p-4 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0"
              style={{ background: C.surface, border: `2px solid ${C.line}`, boxShadow: HARD_SM }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center"
                style={{ background: st.bg, border: `2px solid ${C.line}` }}
              >
                {c.status === "VERIFIED" ? (
                  <Check size={17} aria-hidden="true" style={{ color: st.fg }} />
                ) : c.status === "SUBMITTED" ? (
                  <Clock size={17} aria-hidden="true" style={{ color: st.fg }} />
                ) : (
                  <AlertTriangle size={17} aria-hidden="true" style={{ color: st.fg }} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-bold">{c.naam}</p>
                <p className="text-[12px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <span
                className="inline-flex items-center px-2.5 py-1 text-[10.5px] font-bold uppercase"
                style={{ ...mono, background: st.bg, color: st.fg, border: `2px solid ${C.line}` }}
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
  const tone: Record<"warning" | "info", { fg: string; bg: string; Icon: LucideIcon }> = {
    warning: { fg: "#7c2d12", bg: C.accentSoft, Icon: AlertTriangle },
    info: { fg: "#1e3a8a", bg: "#dbeafe", Icon: Bell },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <SectionTitle
        code="// volgende_acties"
        sub="Wat vraagt nu jouw aandacht — op prioriteit gesorteerd"
      >
        Volgende acties
      </SectionTitle>
      <div className="space-y-4">
        {ACTIES.map((a, i) => {
          const t = tone[a.urgentie];
          return (
            <div
              key={a.titel}
              className="relative flex items-start gap-3.5 p-4"
              style={{ background: C.surface, border: `2px solid ${C.line}`, boxShadow: HARD }}
            >
              <span
                className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center text-[11px] font-bold tabular-nums text-white"
                style={{ ...mono, background: C.ink, border: `2px solid ${C.line}` }}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center"
                style={{ background: t.bg, border: `2px solid ${C.line}` }}
              >
                <t.Icon size={18} aria-hidden="true" style={{ color: t.fg }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-bold">{a.titel}</p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 px-3 py-1.5 text-[12px] font-bold uppercase transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0"
                style={{
                  ...mono,
                  background: C.surface,
                  border: `2px solid ${C.line}`,
                  color: C.ink,
                  boxShadow: HARD_SM,
                }}
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
    Betaald: { fg: "#14532d", bg: "#dcfce7" },
    Openstaand: { fg: "#7c2d12", bg: C.accentSoft },
    Concept: { fg: C.muted, bg: "#e8e8e4" },
  };
  const fallbackTone = { fg: C.muted, bg: "#e8e8e4" };
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-end justify-between">
        <SectionTitle code="// facturen" sub="Overzicht van je verstuurde en openstaande facturen">
          Facturen
        </SectionTitle>
        <button
          className="mb-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-bold uppercase text-white transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0"
          style={{
            ...mono,
            background: C.accent,
            border: `2px solid ${C.line}`,
            boxShadow: HARD_SM,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe
        </button>
      </div>

      <div
        className="overflow-hidden"
        style={{ border: `2px solid ${C.line}`, background: C.surface, boxShadow: HARD }}
      >
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[10px] uppercase tracking-wide"
              style={{
                ...mono,
                borderBottom: `2px solid ${C.line}`,
                background: C.ink,
                color: "#d4d4d4",
              }}
            >
              <th className="px-4 py-2.5 font-bold">Nummer</th>
              <th className="px-4 py-2.5 font-bold">Klant</th>
              <th className="px-4 py-2.5 font-bold">Datum</th>
              <th className="px-4 py-2.5 text-right font-bold">Bedrag</th>
              <th className="px-4 py-2.5 text-right font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f, i) => {
              const t = statusTone[f.status] ?? fallbackTone;
              return (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-[#fafaf8]"
                  style={{
                    borderBottom: i === FACTUREN.length - 1 ? "none" : `1.5px solid ${C.line}`,
                  }}
                >
                  <td className="px-4 py-3 text-[12.5px] font-bold tabular-nums" style={mono}>
                    {f.nr}
                  </td>
                  <td className="px-4 py-3 text-[13px]">{f.klant}</td>
                  <td
                    className="px-4 py-3 text-[12.5px] tabular-nums"
                    style={{ ...mono, color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="px-4 py-3 text-right text-[13px] font-bold tabular-nums"
                    style={mono}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase"
                      style={{
                        ...mono,
                        background: t.bg,
                        color: t.fg,
                        border: `1.5px solid ${C.line}`,
                      }}
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
        <DimLine label="recente documenten" />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {DOCUMENTEN.map((d) => {
            const st = statusStyle(d.status);
            return (
              <div
                key={d.naam}
                className="p-3"
                style={{ background: C.surface, border: `2px solid ${C.line}`, boxShadow: HARD_SM }}
              >
                <div className="flex items-center gap-2">
                  <FileText size={14} aria-hidden="true" style={{ color: C.ink }} />
                  <span
                    className="text-[9px] font-bold uppercase"
                    style={{ ...mono, color: st.fg }}
                  >
                    {st.label}
                  </span>
                </div>
                <p className="mt-1.5 truncate text-[12px] font-bold">{d.naam}</p>
                <p className="text-[11px] tabular-nums" style={{ ...mono, color: C.faint }}>
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
