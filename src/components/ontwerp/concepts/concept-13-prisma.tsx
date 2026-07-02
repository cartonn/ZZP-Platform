"use client";

// Concept 13 — "Prisma" · Verfijnd neo-brutalisme / structureel.
// Neo-brutalisme getemd tot productiekwaliteit: dikke zwarte hairlines (border-2), harde
// offset-schaduwen (shadow-[4px_4px_0_#111]), een zichtbaar raster en strakke spacing met
// tabulaire cijfers. Zelfverzekerd en onmiskenbaar, nooit rommelig.
// Palet: canvas #f4f4ef, surface #ffffff, ink #111111, accent geel #ffd23f,
// functionele accenten: groen #1f9d55, blauw #2f6bff, rood #e0483c.
// Fonts: Space Grotesk (display/UI) + Spline Sans Mono (cijfers/labels).

import { useState } from "react";
import {
  LayoutGrid,
  Store,
  FileText,
  ShieldCheck,
  ListChecks,
  Receipt,
  Search,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Clock,
  AlertTriangle,
  Minus,
  MapPin,
  Plus,
  ArrowRight,
  Square,
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
  ink: "#111111",
  inkSoft: "#3a3a36",
  muted: "#6b6b64",
  faint: "#9a9a90",
  surface: "#ffffff",
  surfaceAlt: "#faf9f4",
  canvas: "#f4f4ef",
  line: "#111111",
  accent: "#ffd23f",
  accentDeep: "#f0be00",
  green: "#1f9d55",
  greenSoft: "#d6f0e0",
  blue: "#2f6bff",
  blueSoft: "#dbe6ff",
  red: "#e0483c",
  redSoft: "#fbdad7",
  amber: "#e08a1e",
  amberSoft: "#fbe8cd",
};

const display = { fontFamily: "var(--font-lab-space)" };
const monoFont = { fontFamily: "var(--font-lab-spline-mono)" };

const HARD = "4px 4px 0 #111111";
const HARD_SM = "3px 3px 0 #111111";

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutGrid,
  marktplaats: Store,
  opdracht: FileText,
  verificatie: ShieldCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: FileText,
  berichten: Bell,
};

const NAV_TAG: Record<ScreenKey, string> = {
  dashboard: "01",
  marktplaats: "02",
  opdracht: "03",
  verificatie: "04",
  acties: "05",
  facturen: "06",
  documenten: "07",
  berichten: "08",
};

function statusStyle(s: CredStatus): { label: string; fg: string; bg: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "GEVERIFIEERD", fg: C.green, bg: C.greenSoft };
    case "SUBMITTED":
      return { label: "IN BEOORDELING", fg: C.blue, bg: C.blueSoft };
    case "EXPIRING":
      return { label: "VERLOOPT BIJNA", fg: C.amber, bg: C.amberSoft };
    case "REJECTED":
      return { label: "AFGEWEZEN", fg: C.red, bg: C.redSoft };
  }
}

function Sparkline({ data, color = C.ink }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 84;
  const h = 28;
  const pts = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d - min) / span) * (h - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={2.25}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Kicker({ children, bg = C.accent }: { children: React.ReactNode; bg?: string }) {
  return (
    <span
      className="inline-block border-2 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.14em]"
      style={{ borderColor: C.line, background: bg, color: C.ink, boxShadow: HARD_SM, ...monoFont }}
    >
      {children}
    </span>
  );
}

function Card({
  children,
  className = "",
  bg = C.surface,
  shadow = true,
}: {
  children: React.ReactNode;
  className?: string;
  bg?: string;
  shadow?: boolean;
}) {
  return (
    <div
      className={`border-2 ${className}`}
      style={{ borderColor: C.line, background: bg, boxShadow: shadow ? HARD : "none" }}
    >
      {children}
    </div>
  );
}

export function Concept13() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{
        ...display,
        color: C.ink,
        background: C.canvas,
        backgroundImage:
          "linear-gradient(rgba(17,17,17,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(17,17,17,0.05) 1px, transparent 1px)",
        backgroundSize: "26px 26px",
      }}
    >
      <div className="flex min-h-[680px]">
        {/* Sidebar */}
        <aside
          className="hidden w-[236px] shrink-0 flex-col border-r-2 lg:flex"
          style={{ borderColor: C.line, background: C.surface }}
        >
          <div
            className="flex items-center gap-3 border-b-2 px-4 py-5"
            style={{ borderColor: C.line }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center border-2 text-[16px] font-bold"
              style={{ borderColor: C.line, background: C.accent, boxShadow: HARD_SM, ...display }}
            >
              Z
            </div>
            <div>
              <div className="text-[15px] font-bold leading-tight tracking-tight">ZZP PLATFORM</div>
              <div
                className="text-[10px] uppercase tracking-[0.12em]"
                style={{ color: C.muted, ...monoFont }}
              >
                Structureel
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-2 p-3">
            {SCREENS.map((s) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="flex items-center gap-3 border-2 px-3 py-2.5 text-[13px] font-bold uppercase tracking-[0.04em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    borderColor: on ? C.line : "transparent",
                    background: on ? C.accent : "transparent",
                    color: C.ink,
                    boxShadow: on ? HARD_SM : "none",
                  }}
                >
                  <Icon size={16} aria-hidden="true" />
                  <span className="flex-1 text-left">{s.label}</span>
                  <span
                    className="text-[10px] tabular-nums"
                    style={{ color: on ? C.ink : C.faint, ...monoFont }}
                  >
                    {NAV_TAG[s.key]}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="mt-2 px-3">
            <p
              className="pb-2 text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.faint, ...monoFont }}
            >
              Meer
            </p>
            <div className="flex flex-wrap gap-1.5">
              {NAV.slice(2).map((n) => (
                <span
                  key={n}
                  className="border-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]"
                  style={{ borderColor: C.line, background: C.surfaceAlt, color: C.muted }}
                >
                  {n}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-auto border-t-2 p-3" style={{ borderColor: C.line }}>
            <div
              className="flex items-center gap-3 border-2 p-2.5"
              style={{ borderColor: C.line, background: C.surfaceAlt }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center border-2 text-[12px] font-bold"
                style={{ borderColor: C.line, background: C.green, color: "#fff", ...monoFont }}
              >
                {PROFIEL.initialen}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-bold">{PROFIEL.naam}</div>
                <div
                  className="truncate text-[10px] uppercase tracking-[0.08em]"
                  style={{ color: C.muted, ...monoFont }}
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
            className="flex h-[60px] shrink-0 items-center gap-3 border-b-2 px-5"
            style={{ borderColor: C.line, background: C.surface }}
          >
            <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.06em]">
              <Square size={12} aria-hidden="true" fill={C.accent} />
              <span style={{ color: C.muted }}>{PROFIEL.rol.split(" · ")[0]}</span>
              <ArrowRight size={13} aria-hidden="true" style={{ color: C.faint }} />
              <span>{SCREENS.find((s) => s.key === screen)?.label}</span>
            </div>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                className="flex items-center gap-2 border-2 px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.04em] transition-all hover:shadow-[3px_3px_0_#111] focus-visible:outline-none focus-visible:ring-2"
                style={{ borderColor: C.line, background: C.surface, color: C.muted }}
                aria-label="Zoeken openen"
              >
                <Search size={14} aria-hidden="true" />
                <span className="hidden sm:inline">Zoek</span>
              </button>
              <button
                className="relative border-2 p-2 transition-all hover:shadow-[3px_3px_0_#111] focus-visible:outline-none focus-visible:ring-2"
                style={{ borderColor: C.line, background: C.surface, color: C.ink }}
                aria-label="Meldingen"
              >
                <Bell size={15} aria-hidden="true" />
                <span
                  className="absolute -right-1.5 -top-1.5 h-3 w-3 border-2"
                  style={{ borderColor: C.line, background: C.red }}
                  aria-hidden="true"
                />
              </button>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div
            className="flex gap-2 overflow-x-auto border-b-2 px-3 py-2.5 lg:hidden"
            style={{ borderColor: C.line, background: C.surface }}
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  className="shrink-0 border-2 px-3 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.04em] transition-all focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    borderColor: C.line,
                    background: on ? C.accent : C.surface,
                    color: C.ink,
                    boxShadow: on ? HARD_SM : "none",
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-6 lg:px-8 lg:py-8">
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
  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <div>
        <Kicker>Vandaag</Kicker>
        <h1
          className="mt-3 text-[34px] font-bold uppercase leading-[0.98] tracking-tight"
          style={display}
        >
          Hallo {PROFIEL.naam.split(" ")[0]}.
        </h1>
        <p
          className="mt-2.5 max-w-lg text-[13.5px] font-medium leading-relaxed"
          style={{ color: C.inkSoft }}
        >
          Drie sterke matches staan klaar en één certificaat vraagt om actie. Alles staat strak op
          een rij — jij bepaalt de volgorde.
        </p>
      </div>

      {/* KPI's */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} className="p-4">
            <p
              className="text-[10.5px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.muted, ...monoFont }}
            >
              {k.label}
            </p>
            <p
              className="mt-2 text-[27px] font-bold tabular-nums leading-none tracking-tight"
              style={{ ...display }}
            >
              {k.value}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-0.5 border-2 px-1.5 py-0.5 text-[11px] font-bold tabular-nums"
                style={{
                  borderColor: C.line,
                  color: C.ink,
                  background: k.up ? C.greenSoft : C.redSoft,
                  ...monoFont,
                }}
              >
                {k.up ? (
                  <ArrowUpRight size={12} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={12} aria-hidden="true" />
                )}
                {k.trend}
              </span>
              <Sparkline data={k.spark} color={k.up ? C.green : C.red} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[15px] font-bold uppercase tracking-[0.06em]">Beste matches</h2>
              <span
                className="text-[10.5px] font-bold uppercase tracking-[0.1em]"
                style={{ color: C.muted, ...monoFont }}
              >
                Match ↓
              </span>
            </div>
            <Card className="divide-y-2" bg={C.surface}>
              <div className="divide-y-2" style={{ borderColor: C.line }}>
                {OPDRACHTEN.map((o) => (
                  <button
                    key={o.id}
                    onClick={onOpen}
                    className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-[#faf9f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                    style={{ borderColor: C.line }}
                  >
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center border-2 text-[13px] font-bold tabular-nums"
                      style={{ borderColor: C.line, background: C.accent, ...monoFont }}
                    >
                      {o.match}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-bold">{o.titel}</p>
                      <p
                        className="mt-0.5 truncate text-[11.5px] font-medium"
                        style={{ color: C.muted }}
                      >
                        {o.opdrachtgever} · {o.plaats}
                      </p>
                    </div>
                    <span
                      className="hidden text-[12px] font-bold tabular-nums sm:block"
                      style={{ ...monoFont }}
                    >
                      {o.tarief.replace(" / uur", "")}
                    </span>
                    <ArrowRight size={16} aria-hidden="true" style={{ color: C.ink }} />
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Berichten */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[15px] font-bold uppercase tracking-[0.06em]">Berichten</h2>
              <span
                className="border-2 px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.08em]"
                style={{ borderColor: C.line, background: C.blueSoft, color: C.ink, ...monoFont }}
              >
                {BERICHTEN.filter((b) => b.ongelezen).length} ongelezen
              </span>
            </div>
            <Card bg={C.surface}>
              <div className="divide-y-2" style={{ borderColor: C.line }}>
                {BERICHTEN.map((b) => (
                  <div
                    key={b.van}
                    className="flex items-center gap-3.5 px-4 py-3 transition-colors hover:bg-[#faf9f4]"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center border-2 text-[11px] font-bold"
                      style={{
                        borderColor: C.line,
                        background: b.ongelezen ? C.blue : C.surfaceAlt,
                        color: b.ongelezen ? "#fff" : C.ink,
                        ...monoFont,
                      }}
                    >
                      {b.initialen}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[12.5px] font-bold">{b.van}</p>
                        {b.ongelezen && (
                          <span
                            className="h-2 w-2 shrink-0 border-2"
                            style={{ borderColor: C.line, background: C.red }}
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <p className="truncate text-[11.5px] font-medium" style={{ color: C.muted }}>
                        {b.preview}
                      </p>
                    </div>
                    <span
                      className="shrink-0 text-[11px] tabular-nums"
                      style={{ color: C.faint, ...monoFont }}
                    >
                      {b.tijd}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-[15px] font-bold uppercase tracking-[0.06em]">Certificaten</h2>
            <Card className="p-4">
              <div className="space-y-3.5">
                {CREDENTIALS.map((c) => {
                  const st = statusStyle(c.status);
                  return (
                    <div key={c.naam} className="flex items-start gap-3">
                      <span
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border-2"
                        style={{ borderColor: C.line, background: st.bg }}
                        aria-hidden="true"
                      >
                        <span className="h-2 w-2" style={{ background: st.fg }} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-bold">{c.naam}</p>
                        <p className="truncate text-[11px] font-medium" style={{ color: C.muted }}>
                          {c.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <Card className="overflow-hidden p-0">
            <div
              className="border-b-2 px-4 py-3"
              style={{ borderColor: C.line, background: C.accent }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ ...monoFont }}
              >
                Volgende beste stap
              </p>
              <p className="mt-1 text-[14.5px] font-bold uppercase leading-tight tracking-tight">
                {primair.titel}
              </p>
            </div>
            <div className="px-4 py-3.5">
              <p className="text-[12px] font-medium leading-relaxed" style={{ color: C.inkSoft }}>
                {primair.detail}
              </p>
              <button
                className="mt-3 w-full border-2 px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.06em] transition-all hover:shadow-[3px_3px_0_#111] focus-visible:outline-none focus-visible:ring-2"
                style={{ borderColor: C.line, background: C.ink, color: "#fff" }}
              >
                {primair.cta}
              </button>
            </div>
          </Card>
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
        <Kicker bg={C.greenSoft}>Marktplaats</Kicker>
        <h1
          className="mt-3 text-[28px] font-bold uppercase leading-tight tracking-tight"
          style={display}
        >
          Open opdrachten
        </h1>
      </div>

      <Card className="flex items-center gap-3 px-4 py-3">
        <Search size={16} aria-hidden="true" style={{ color: C.ink }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ZOEK OP TITEL, PLAATS OF OPDRACHTGEVER…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[12.5px] font-bold uppercase tracking-[0.04em] outline-none placeholder:text-[#9a9a90]"
          style={{ color: C.ink, ...monoFont }}
        />
      </Card>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center px-6 py-16 text-center">
          <div
            className="flex h-14 w-14 items-center justify-center border-2"
            style={{ borderColor: C.line, background: C.accent, boxShadow: HARD_SM }}
          >
            <Search size={24} aria-hidden="true" />
          </div>
          <p className="mt-5 text-[18px] font-bold uppercase tracking-tight" style={display}>
            Geen resultaten
          </p>
          <p className="mt-1.5 max-w-sm text-[12px] font-medium" style={{ color: C.muted }}>
            Geen opdrachten gevonden. Pas je zoekwoorden aan of verbreed je beschikbaarheid.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group border-2 p-5 text-left transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_#111] focus-visible:outline-none focus-visible:ring-2"
              style={{ borderColor: C.line, background: C.surface, boxShadow: HARD }}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className="text-[10.5px] font-bold tracking-wide"
                  style={{ color: C.muted, ...monoFont }}
                >
                  {o.id}
                </span>
                <span
                  className="border-2 px-2 py-0.5 text-[11px] font-bold tabular-nums"
                  style={{ borderColor: C.line, background: C.green, color: "#fff", ...monoFont }}
                >
                  {o.match}%
                </span>
              </div>
              <p
                className="mt-3 text-[17px] font-bold uppercase leading-tight tracking-tight"
                style={display}
              >
                {o.titel}
              </p>
              <p
                className="mt-1.5 flex items-center gap-1.5 text-[11.5px] font-medium"
                style={{ color: C.muted }}
              >
                <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className="border-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em]"
                    style={{ borderColor: C.line, background: C.surfaceAlt, color: C.inkSoft }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div
                className="mt-4 flex items-center justify-between border-t-2 pt-3.5 text-[12.5px]"
                style={{ borderColor: C.line }}
              >
                <span className="font-bold tabular-nums" style={{ ...monoFont }}>
                  {o.tarief}
                </span>
                <span className="tabular-nums" style={{ color: C.muted, ...monoFont }}>
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
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Kicker>{opdracht.id}</Kicker>
          <h1
            className="mt-3 text-[28px] font-bold uppercase leading-tight tracking-tight"
            style={display}
          >
            {opdracht.titel}
          </h1>
          <p
            className="mt-2 flex items-center gap-1.5 text-[12.5px] font-medium"
            style={{ color: C.muted }}
          >
            <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
        <button
          className="shrink-0 border-2 px-6 py-3 text-[13px] font-bold uppercase tracking-[0.06em] transition-all hover:shadow-[6px_6px_0_#111] focus-visible:outline-none focus-visible:ring-2"
          style={{ borderColor: C.line, background: C.accent, color: C.ink, boxShadow: HARD }}
        >
          Reageer
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Card key={m.l} className="p-4">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.muted, ...monoFont }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[16px] font-bold tabular-nums tracking-tight"
              style={{ ...monoFont }}
            >
              {m.v}
            </p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h3 className="text-[16px] font-bold uppercase tracking-[0.04em]">Waarom deze match</h3>
        <p className="mt-1 text-[12px] font-medium" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je profiel — niets verborgen.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="border-2 p-4" style={{ borderColor: C.line, background: C.greenSoft }}>
            <p
              className="text-[10.5px] font-bold uppercase tracking-[0.12em]"
              style={{ color: C.green, ...monoFont }}
            >
              Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px] font-medium">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-2"
                    style={{ borderColor: C.line, background: C.green }}
                    aria-hidden="true"
                  >
                    <Check size={12} className="text-white" />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-2 p-4" style={{ borderColor: C.line, background: C.amberSoft }}>
            <p
              className="text-[10.5px] font-bold uppercase tracking-[0.12em]"
              style={{ color: C.amber, ...monoFont }}
            >
              Aandachtspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px] font-medium"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-2"
                    style={{ borderColor: C.line, background: C.amber }}
                    aria-hidden="true"
                  >
                    <Minus size={12} className="text-white" />
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

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Kicker>Vertrouwen</Kicker>
        <h1
          className="mt-3 text-[28px] font-bold uppercase leading-tight tracking-tight"
          style={display}
        >
          Verificatie
        </h1>
      </div>

      <Card className="flex items-center gap-5 p-6">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center border-2"
          style={{ borderColor: C.line, background: C.green, boxShadow: HARD_SM }}
        >
          <ShieldCheck size={28} aria-hidden="true" className="text-white" />
        </div>
        <div>
          <p className="text-[19px] font-bold uppercase tracking-tight" style={display}>
            {PROFIEL.trust}
          </p>
          <p className="mt-0.5 text-[12.5px] font-medium" style={{ color: C.inkSoft }}>
            <span style={monoFont}>{verified}</span> van{" "}
            <span style={monoFont}>{CREDENTIALS.length}</span> certificaten geverifieerd ·{" "}
            <span style={monoFont}>1</span> vraagt om actie.
          </p>
        </div>
        <div className="ml-auto hidden gap-2 sm:flex">
          {[
            { l: "OK", v: verified, bg: C.greenSoft },
            { l: "REVIEW", v: 1, bg: C.blueSoft },
            { l: "EXP", v: 1, bg: C.amberSoft },
          ].map((s) => (
            <div
              key={s.l}
              className="border-2 px-3 py-2 text-center"
              style={{ borderColor: C.line, background: s.bg }}
            >
              <div className="text-[18px] font-bold tabular-nums" style={{ ...monoFont }}>
                {s.v}
              </div>
              <div
                className="text-[9px] font-bold uppercase tracking-[0.1em]"
                style={{ color: C.muted, ...monoFont }}
              >
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="divide-y-2" style={{ borderColor: C.line }}>
          {CREDENTIALS.map((c) => {
            const st = statusStyle(c.status);
            return (
              <div
                key={c.naam}
                className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-[#faf9f4]"
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center border-2"
                  style={{ borderColor: C.line, background: st.bg }}
                >
                  {c.status === "VERIFIED" ? (
                    <Check size={18} aria-hidden="true" style={{ color: st.fg }} />
                  ) : c.status === "SUBMITTED" ? (
                    <Clock size={18} aria-hidden="true" style={{ color: st.fg }} />
                  ) : (
                    <AlertTriangle size={18} aria-hidden="true" style={{ color: st.fg }} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-bold">{c.naam}</p>
                  <p className="text-[11.5px] font-medium" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <span
                  className="shrink-0 border-2 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em]"
                  style={{ borderColor: C.line, color: C.ink, background: st.bg, ...monoFont }}
                >
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Documenten */}
      <div>
        <h2 className="mb-3 text-[15px] font-bold uppercase tracking-[0.06em]">
          Veilig bewaarde documenten
        </h2>
        <Card>
          <div className="divide-y-2" style={{ borderColor: C.line }}>
            {DOCUMENTEN.map((d) => {
              const st = statusStyle(d.status);
              return (
                <div
                  key={d.naam}
                  className="flex items-center gap-3.5 px-4 py-3 transition-colors hover:bg-[#faf9f4]"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center border-2"
                    style={{ borderColor: C.line, background: C.surfaceAlt }}
                    aria-hidden="true"
                  >
                    <FileText size={16} style={{ color: C.ink }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-bold">{d.naam}</p>
                    <p
                      className="truncate text-[10.5px] font-medium uppercase tracking-[0.04em]"
                      style={{ color: C.muted, ...monoFont }}
                    >
                      {d.type} · {d.grootte} · {d.bijgewerkt}
                    </p>
                  </div>
                  <span
                    className="shrink-0 border-2 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.06em]"
                    style={{ borderColor: C.line, color: C.ink, background: st.bg, ...monoFont }}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Acties() {
  const tone: Record<"warning" | "info", { bg: string; Icon: LucideIcon }> = {
    warning: { bg: C.amberSoft, Icon: AlertTriangle },
    info: { bg: C.blueSoft, Icon: Bell },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Kicker>Aandacht</Kicker>
        <h1
          className="mt-3 text-[28px] font-bold uppercase leading-tight tracking-tight"
          style={display}
        >
          Volgende acties
        </h1>
        <p className="mt-2 text-[13px] font-medium" style={{ color: C.inkSoft }}>
          Eén ding tegelijk. Wij houden de rest voor je in de gaten.
        </p>
      </div>
      <div className="space-y-4">
        {ACTIES.map((a, i) => {
          const t = tone[a.urgentie];
          return (
            <Card key={a.titel} className="flex items-start gap-4 p-5">
              <div className="flex flex-col items-center gap-2">
                <span
                  className="text-[11px] font-bold tabular-nums"
                  style={{ color: C.faint, ...monoFont }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center border-2"
                  style={{ borderColor: C.line, background: t.bg }}
                >
                  <t.Icon size={19} aria-hidden="true" style={{ color: C.ink }} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold uppercase tracking-tight">{a.titel}</p>
                <p className="mt-0.5 text-[12.5px] font-medium" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 border-2 px-4 py-2 text-[11.5px] font-bold uppercase tracking-[0.06em] transition-all hover:shadow-[3px_3px_0_#111] focus-visible:outline-none focus-visible:ring-2"
                style={{ borderColor: C.line, background: C.accent, color: C.ink }}
              >
                {a.cta}
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Facturen() {
  const statusTone: Record<string, string> = {
    Betaald: C.greenSoft,
    Openstaand: C.amberSoft,
    Concept: C.surfaceAlt,
  };
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Omzet</Kicker>
          <h1
            className="mt-3 text-[28px] font-bold uppercase leading-tight tracking-tight"
            style={display}
          >
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 border-2 px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.06em] transition-all hover:shadow-[6px_6px_0_#111] focus-visible:outline-none focus-visible:ring-2"
          style={{ borderColor: C.line, background: C.accent, color: C.ink, boxShadow: HARD }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="border-b-2 text-[10px] uppercase tracking-[0.1em]"
                style={{
                  borderColor: C.line,
                  background: C.surfaceAlt,
                  color: C.muted,
                  ...monoFont,
                }}
              >
                <th className="px-5 py-3 font-bold">Nummer</th>
                <th className="px-5 py-3 font-bold">Klant</th>
                <th className="px-5 py-3 font-bold">Datum</th>
                <th className="px-5 py-3 text-right font-bold">Bedrag</th>
                <th className="px-5 py-3 text-right font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y-2" style={{ borderColor: C.line }}>
              {FACTUREN.map((f) => {
                const bg = statusTone[f.status] ?? C.surfaceAlt;
                return (
                  <tr key={f.nr} className="transition-colors hover:bg-[#faf9f4]">
                    <td className="px-5 py-3.5 text-[12px] font-bold" style={{ ...monoFont }}>
                      {f.nr}
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-semibold">{f.klant}</td>
                    <td className="px-5 py-3.5 text-[12px]" style={{ color: C.muted, ...monoFont }}>
                      {f.datum}
                    </td>
                    <td
                      className="px-5 py-3.5 text-right text-[13px] font-bold tabular-nums"
                      style={{ ...monoFont }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span
                        className="inline-block border-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]"
                        style={{ borderColor: C.line, color: C.ink, background: bg, ...monoFont }}
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
      </Card>
    </div>
  );
}
